import type { Database } from '../../storage/database';
import type { NeuronNode } from '../types/node';

export interface ScoringConfig {
  similarityWeight: number;
  connectionWeight: number;
  recencyWeight: number;
  domainBoost: number;
}

export interface ScoredNode {
  node: NeuronNode;
  score: number;
  breakdown: {
    similarity: number;
    connections: number;
    recency: number;
    domainMatch: number;
  };
}

const DEFAULT_CONFIG: ScoringConfig = {
  similarityWeight: 0.6,
  connectionWeight: 0.2,
  recencyWeight: 0.1,
  domainBoost: 0.1,
};

export class ScoringEngine {
  private config: ScoringConfig;

  constructor(private db: Database, config?: ScoringConfig) {
    this.config = { ...DEFAULT_CONFIG, ...(config ?? {}) };
  }

  cosineSimilarity(a: number[], b: number[]): number {
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
  }

  async semanticSimilarity(nodeA: string, nodeB: string): Promise<number> {
    const rows = await this.db.query<{ similarity: number }>(
      'SELECT 1 - (a.embedding <=> b.embedding) as similarity FROM nodes a JOIN nodes b ON b.id = $2 WHERE a.id = $1',
      [nodeA, nodeB]
    );
    return rows[0]?.similarity ?? 0;
  }

  async scoreForQuery(queryEmbedding: number[], nodeIds?: string[]): Promise<ScoredNode[]> {
    const filterClause = nodeIds?.length ? 'AND id = ANY($2)' : '';
    const values = nodeIds?.length ? [queryEmbedding, nodeIds] : [queryEmbedding];
    const nodes = await this.db.query<NeuronNode & { similarity: number }>(
      `SELECT *, 1 - (embedding <=> $1) as similarity FROM nodes WHERE embedding IS NOT NULL ${filterClause} ORDER BY embedding <=> $1`,
      values
    );

    return nodes.map((node) => this.applyScoring(node, node.similarity ?? 0));
  }

  async findSimilar(nodeId: string, limit = 10, excludeConnected = false): Promise<ScoredNode[]> {
    const base = excludeConnected
      ? `SELECT id FROM nodes WHERE id NOT IN (SELECT to_node_id FROM edges WHERE from_node_id = $1)`
      : `SELECT id FROM nodes WHERE id != $1`;
    const nodes = await this.db.query<NeuronNode & { similarity: number }>(
      `SELECT n.*, 1 - (n.embedding <=> (SELECT embedding FROM nodes WHERE id = $1)) as similarity
       FROM nodes n
       WHERE n.embedding IS NOT NULL AND n.id IN (${base})
       ORDER BY n.embedding <=> (SELECT embedding FROM nodes WHERE id = $1)
       LIMIT $2`,
      [nodeId, limit]
    );

    return nodes.map((node) => this.applyScoring(node, node.similarity ?? 0));
  }

  async calculateNodeImportance(nodeId: string): Promise<number> {
    const row = await this.db.queryOne<{ importance: number }>(
      `WITH edge_weights AS (
        SELECT to_node_id, SUM(strength) as total_inbound
        FROM edges
        GROUP BY to_node_id
      )
      SELECT COALESCE(ew.total_inbound, 0) + (n.connection_count * 0.1) as importance
      FROM nodes n
      LEFT JOIN edge_weights ew ON n.id = ew.to_node_id
      WHERE n.id = $1`,
      [nodeId]
    );
    return row?.importance ?? 0;
  }

  async rankAllNodes(): Promise<Array<{ nodeId: string; importance: number }>> {
    const rows = await this.db.query<{ id: string; importance: number }>(
      `WITH edge_weights AS (
        SELECT to_node_id, SUM(strength) as total_inbound
        FROM edges
        GROUP BY to_node_id
      )
      SELECT n.id, COALESCE(ew.total_inbound, 0) + (n.connection_count * 0.1) as importance
      FROM nodes n
      LEFT JOIN edge_weights ew ON n.id = ew.to_node_id
      ORDER BY importance DESC`
    );
    return rows.map((row) => ({ nodeId: row.id, importance: row.importance }));
  }

  async scoreRelevance(
    sourceNodeId: string,
    candidateNodeIds: string[],
    context?: string
  ): Promise<ScoredNode[]> {
    const nodes = await this.db.query<NeuronNode & { similarity: number }>(
      `SELECT *, 1 - (embedding <=> (SELECT embedding FROM nodes WHERE id = $1)) as similarity
       FROM nodes
       WHERE embedding IS NOT NULL AND id = ANY($2)
       ORDER BY embedding <=> (SELECT embedding FROM nodes WHERE id = $1)`,
      [sourceNodeId, candidateNodeIds]
    );

    return nodes.map((node) => {
      const base = this.applyScoring(node, node.similarity ?? 0);
      if (context) {
        base.score += this.config.domainBoost * 0.1;
      }
      return base;
    });
  }

  private applyScoring(node: NeuronNode & { similarity?: number }, similarity: number): ScoredNode {
    const connections = node.connectionCount ?? 0;
    const recency = node.updatedAt ? Math.max(0, 1 - (Date.now() - new Date(node.updatedAt).getTime()) / (1000 * 60 * 60 * 24 * 30)) : 0;
    const domainMatch = 0;

    const score =
      similarity * this.config.similarityWeight +
      connections * this.config.connectionWeight +
      recency * this.config.recencyWeight +
      domainMatch * this.config.domainBoost;

    return {
      node,
      score,
      breakdown: {
        similarity,
        connections,
        recency,
        domainMatch,
      },
    };
  }
}
