import crypto from 'node:crypto';
import type { Database } from '../../storage/database';
import type { ClusterMembership } from '../types/cluster';
import type { NeuronNode } from '../types/node';
import type { EmbeddingsService } from './embeddings-service';
import type { GraphStoreContext } from '../store/graph-store';
import { resolveScope } from '../store/graph-store';

export interface ClusteringConfig {
  algorithm: 'kmeans' | 'dbscan' | 'hierarchical';
  clusterCount?: number;
  minClusterSize?: number;
  similarityThreshold?: number;
  epsilon?: number;
  minSamples?: number;
}

export interface ClusteringResult {
  clusterId: string;
  label: string;
  nodeIds: string[];
  centroid: number[];
  avgSimilarity: number;
  cohesion: number;
}

const cosineSimilarity = (a: number[], b: number[]): number => {
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
};

const averageVector = (vectors: number[][]): number[] => {
  const length = vectors[0]?.length ?? 0;
  const sum = new Array(length).fill(0);
  vectors.forEach((vector) => {
    vector.forEach((value, idx) => {
      sum[idx] += value;
    });
  });
  return sum.map((value) => value / vectors.length);
};

export class ClusteringEngine {
  private scope: string;

  constructor(private db: Database, private embeddings: EmbeddingsService, context?: GraphStoreContext) {
    this.scope = resolveScope(context);
  }

  async clusterNodes(config: ClusteringConfig): Promise<{ clusters: ClusteringResult[]; unassigned: string[] }> {
    const nodes = await this.fetchNodesWithEmbeddings();
    if (nodes.length === 0) return { clusters: [], unassigned: [] };

    let clusters: ClusteringResult[] = [];
    if (config.algorithm === 'dbscan') {
      clusters = this.runDbscan(nodes, config);
    } else {
      clusters = this.runKmeans(nodes, config);
    }

    await this.persistClusters(clusters);

    const assigned = new Set(clusters.flatMap((cluster) => cluster.nodeIds));
    const unassigned = nodes.map((node) => node.id).filter((id) => !assigned.has(id));

    return { clusters, unassigned };
  }

  async recluster(config: ClusteringConfig): Promise<ClusteringResult[]> {
    const { clusters } = await this.clusterNodes(config);
    return clusters;
  }

  async assignToCluster(nodeId: string): Promise<ClusterMembership | null> {
    const node = await this.db.queryOne<{ id: string; embedding: number[] | null }>(
      'SELECT id, embedding FROM nodes WHERE id = $1 AND scope = $2',
      [nodeId, this.scope]
    );
    if (!node?.embedding) return null;

    const best = await this.findBestCluster(node.embedding);
    if (!best) return null;

    await this.db.execute(
      'INSERT INTO cluster_memberships (scope, node_id, cluster_id, similarity_score, is_primary) VALUES ($1, $2, $3, $4, true) ON CONFLICT (node_id, cluster_id) DO UPDATE SET similarity_score = $4, is_primary = true',
      [this.scope, nodeId, best.clusterId, best.similarity]
    );
    await this.db.execute('UPDATE nodes SET cluster_id = $1, cluster_similarity = $2 WHERE id = $3 AND scope = $4', [
      best.clusterId,
      best.similarity,
      nodeId,
      this.scope,
    ]);

    return {
      nodeId,
      clusterId: best.clusterId,
      similarityScore: best.similarity,
      isPrimary: true,
      assignedAt: new Date(),
    };
  }

  async findBestCluster(embedding: number[]): Promise<{ clusterId: string; similarity: number } | null> {
    const clusters = await this.db.query<{ id: string; centroid: number[] | null }>(
      'SELECT id, centroid FROM clusters WHERE centroid IS NOT NULL AND scope = $1',
      [this.scope]
    );
    let best: { clusterId: string; similarity: number } | null = null;
    clusters.forEach((cluster) => {
      if (!cluster.centroid) return;
      const similarity = cosineSimilarity(cluster.centroid, embedding);
      if (!best || similarity > best.similarity) {
        best = { clusterId: cluster.id, similarity };
      }
    });
    return best;
  }

  async recomputeCentroid(clusterId: string): Promise<void> {
    const rows = await this.db.query<{ embedding: number[] | null }>(
      'SELECT n.embedding FROM nodes n JOIN cluster_memberships cm ON n.id = cm.node_id WHERE cm.cluster_id = $1 AND cm.scope = $2 AND n.scope = $2',
      [clusterId, this.scope]
    );
    const vectors = rows.map((row) => row.embedding).filter(Boolean) as number[][];
    if (vectors.length === 0) return;
    const centroid = averageVector(vectors);
    await this.db.execute('UPDATE clusters SET centroid = $1, last_recomputed_at = NOW() WHERE id = $2 AND scope = $3', [
      centroid,
      clusterId,
      this.scope,
    ]);
  }

  async recomputeAllCentroids(): Promise<void> {
    const clusters = await this.db.query<{ id: string }>('SELECT id FROM clusters WHERE scope = $1', [this.scope]);
    for (const cluster of clusters) {
      await this.recomputeCentroid(cluster.id);
    }
  }

  async generateClusterLabel(clusterId: string): Promise<string> {
    const rows = await this.db.query<{ label: string }>(
      'SELECT n.label FROM nodes n JOIN cluster_memberships cm ON n.id = cm.node_id WHERE cm.cluster_id = $1 AND cm.scope = $2 AND n.scope = $2 LIMIT 5',
      [clusterId, this.scope]
    );
    const label = rows.map((row) => row.label).join(', ');
    await this.db.execute('UPDATE clusters SET label = $1 WHERE id = $2 AND scope = $3', [label, clusterId, this.scope]);
    return label;
  }

  async generateAllLabels(): Promise<void> {
    const clusters = await this.db.query<{ id: string }>('SELECT id FROM clusters WHERE scope = $1', [this.scope]);
    for (const cluster of clusters) {
      await this.generateClusterLabel(cluster.id);
    }
  }

  calculateSilhouetteScore(clusters: ClusteringResult[]): number {
    if (clusters.length === 0) return 0;
    return clusters.reduce((acc, cluster) => acc + cluster.cohesion, 0) / clusters.length;
  }

  calculateCohesion(cluster: ClusteringResult): number {
    return cluster.cohesion;
  }

  private async fetchNodesWithEmbeddings(): Promise<Array<NeuronNode & { embedding: number[] }>> {
    const nodes = await this.db.query<NeuronNode & { embedding: number[] }>(
      'SELECT * FROM nodes WHERE embedding IS NOT NULL AND scope = $1',
      [this.scope]
    );
    return nodes as Array<NeuronNode & { embedding: number[] }>;
  }

  private runKmeans(nodes: Array<NeuronNode & { embedding: number[] }>, config: ClusteringConfig): ClusteringResult[] {
    const k = Math.max(1, config.clusterCount ?? 3);
    const centroids: number[][] = [];
    const initialNodes = [...nodes].sort(() => Math.random() - 0.5).slice(0, k);
    initialNodes.forEach((node) => centroids.push([...node.embedding]));

    let assignments = new Map<string, number>();
    for (let iteration = 0; iteration < 10; iteration += 1) {
      assignments = new Map();
      nodes.forEach((node) => {
        let bestIndex = 0;
        let bestScore = -Infinity;
        centroids.forEach((centroid, idx) => {
          const score = cosineSimilarity(node.embedding, centroid);
          if (score > bestScore) {
            bestScore = score;
            bestIndex = idx;
          }
        });
        assignments.set(node.id, bestIndex);
      });

      for (let i = 0; i < k; i += 1) {
        const members = nodes.filter((node) => assignments.get(node.id) === i);
        if (members.length === 0) continue;
        centroids[i] = averageVector(members.map((node) => node.embedding));
      }
    }

    const clusters: ClusteringResult[] = [];
    for (let i = 0; i < k; i += 1) {
      const members = nodes.filter((node) => assignments.get(node.id) === i);
      if (members.length === 0) continue;
      const centroid = centroids[i];
      const similarities = members.map((node) => cosineSimilarity(node.embedding, centroid));
      const avgSimilarity = similarities.reduce((acc, val) => acc + val, 0) / similarities.length;
      clusters.push({
        clusterId: crypto.randomUUID(),
        label: members.map((node) => node.label).slice(0, 3).join(', '),
        nodeIds: members.map((node) => node.id),
        centroid,
        avgSimilarity,
        cohesion: avgSimilarity,
      });
    }

    return clusters;
  }

  private runDbscan(nodes: Array<NeuronNode & { embedding: number[] }>, config: ClusteringConfig): ClusteringResult[] {
    const epsilon = config.similarityThreshold ?? 0.75;
    const minSamples = config.minSamples ?? 2;
    const visited = new Set<string>();
    const clusters: ClusteringResult[] = [];

    for (const node of nodes) {
      if (visited.has(node.id)) continue;
      visited.add(node.id);
      const neighbors = this.findNeighbors(nodes, node, epsilon);
      if (neighbors.length < minSamples) {
        continue;
      }

      const clusterMembers = new Set<string>([node.id, ...neighbors.map((n) => n.id)]);
      let idx = 0;
      const neighborList = [...neighbors];
      while (idx < neighborList.length) {
        const neighbor = neighborList[idx];
        if (!visited.has(neighbor.id)) {
          visited.add(neighbor.id);
          const neighborNeighbors = this.findNeighbors(nodes, neighbor, epsilon);
          if (neighborNeighbors.length >= minSamples) {
            neighborNeighbors.forEach((n) => {
              if (!clusterMembers.has(n.id)) {
                clusterMembers.add(n.id);
                neighborList.push(n);
              }
            });
          }
        }
        idx += 1;
      }

      const members = nodes.filter((n) => clusterMembers.has(n.id));
      const centroid = averageVector(members.map((member) => member.embedding));
      const similarities = members.map((member) => cosineSimilarity(member.embedding, centroid));
      const avgSimilarity = similarities.reduce((acc, val) => acc + val, 0) / similarities.length;
      clusters.push({
        clusterId: crypto.randomUUID(),
        label: members.map((member) => member.label).slice(0, 3).join(', '),
        nodeIds: members.map((member) => member.id),
        centroid,
        avgSimilarity,
        cohesion: avgSimilarity,
      });
    }

    return clusters;
  }

  private findNeighbors(
    nodes: Array<NeuronNode & { embedding: number[] }>,
    node: NeuronNode & { embedding: number[] },
    threshold: number
  ) {
    return nodes.filter((candidate) => {
      if (candidate.id === node.id) return false;
      return cosineSimilarity(candidate.embedding, node.embedding) >= threshold;
    });
  }

  private async persistClusters(clusters: ClusteringResult[]): Promise<void> {
    const scope = this.scope;
    await this.db.transaction(async (client) => {
      await client.query('DELETE FROM cluster_memberships WHERE scope = $1', [scope]);
      await client.query('DELETE FROM clusters WHERE scope = $1', [scope]);

      for (const cluster of clusters) {
        await client.query(
          'INSERT INTO clusters (id, scope, label, centroid, member_count, avg_similarity, cohesion, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())',
          [
            cluster.clusterId,
            scope,
            cluster.label,
            cluster.centroid,
            cluster.nodeIds.length,
            cluster.avgSimilarity,
            cluster.cohesion,
          ]
        );

        for (const nodeId of cluster.nodeIds) {
          await client.query(
            'INSERT INTO cluster_memberships (scope, node_id, cluster_id, similarity_score, is_primary) VALUES ($1, $2, $3, $4, true)',
            [scope, nodeId, cluster.clusterId, cluster.avgSimilarity]
          );
          await client.query('UPDATE nodes SET cluster_id = $1, cluster_similarity = $2 WHERE id = $3 AND scope = $4', [
            cluster.clusterId,
            cluster.avgSimilarity,
            nodeId,
            scope,
          ]);
        }
      }
    });
  }
}
