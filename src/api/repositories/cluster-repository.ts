import type { Database } from '../../storage/database';
import type { NeuronCluster } from '../../core/types/cluster';
import { BaseRepository } from './base';

const mapClusterRow = (row: Record<string, unknown>): NeuronCluster => ({
  id: row.id as string,
  label: row.label as string,
  clusterType: (row.cluster_type as string | null) ?? 'topic',
  centroid: (row.centroid as number[] | null) ?? [],
  memberCount: Number(row.member_count ?? 0),
  avgSimilarity: (row.avg_similarity as number | null) ?? 0,
  cohesion: (row.cohesion as number | null) ?? 0,
  description: (row.description as string | null) ?? null,
  keywords: (row.keywords as string[] | null) ?? [],
  metadata: (row.metadata as Record<string, unknown>) ?? {},
  createdAt: row.created_at as Date,
  updatedAt: row.updated_at as Date,
  lastRecomputedAt: (row.last_recomputed_at as Date | null) ?? null,
});

export class ClusterRepository extends BaseRepository<NeuronCluster, NeuronCluster, Partial<NeuronCluster>> {
  constructor(db: Database) {
    super(db, 'clusters');
  }

  override async findById(id: string): Promise<NeuronCluster | null> {
    const row = await this.db.queryOne<Record<string, unknown>>('SELECT * FROM clusters WHERE id = $1', [id]);
    return row ? mapClusterRow(row) : null;
  }

  async findWithMembers(clusterId: string): Promise<{
    cluster: NeuronCluster | null;
    members: Array<{ nodeId: string; similarityScore: number }>;
  }> {
    const cluster = await this.findById(clusterId);
    const memberships = await this.db.query<{ node_id: string; similarity_score: number }>(
      'SELECT node_id, similarity_score FROM cluster_memberships WHERE cluster_id = $1',
      [clusterId]
    );
    return {
      cluster,
      members: memberships.map((row) => ({ nodeId: row.node_id, similarityScore: row.similarity_score })),
    };
  }

  async updateCentroid(clusterId: string, centroid: number[]): Promise<void> {
    await this.db.execute('UPDATE clusters SET centroid = $1 WHERE id = $2', [centroid, clusterId]);
  }

  async addMember(clusterId: string, nodeId: string, similarity: number): Promise<void> {
    await this.db.execute(
      'INSERT INTO cluster_memberships (node_id, cluster_id, similarity_score, is_primary) VALUES ($1, $2, $3, true) ON CONFLICT (node_id, cluster_id) DO UPDATE SET similarity_score = $3',
      [nodeId, clusterId, similarity]
    );
  }

  async removeMember(clusterId: string, nodeId: string): Promise<void> {
    await this.db.execute('DELETE FROM cluster_memberships WHERE cluster_id = $1 AND node_id = $2', [
      clusterId,
      nodeId,
    ]);
  }
}
