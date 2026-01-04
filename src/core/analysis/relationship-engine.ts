import OpenAI from 'openai';
import type { Database } from '../../storage/database';
import type { EdgeEvidence, NeuronEdge, RelationshipType } from '../types/edge';

export interface InferenceConfig {
  model: string;
  minConfidence: number;
  maxPerNode: number;
  similarityThreshold: number;
  includeExisting: boolean;
  batchSize: number;
  rateLimit: number;
}

export interface InferredRelationship {
  fromNodeId: string;
  toNodeId: string;
  relationshipType: RelationshipType;
  confidence: number;
  reasoning: string;
  evidence: EdgeEvidence[];
}

const INFERENCE_PROMPT = `You are analyzing potential relationships between concepts in a knowledge graph.

Node A:
- Label: {nodeA.label}
- Summary: {nodeA.summary}
- Content: {nodeA.content}

Node B:
- Label: {nodeB.label}
- Summary: {nodeB.summary}
- Content: {nodeB.content}

Determine if there is a meaningful relationship between these nodes.

Respond in JSON:
{
  "hasRelationship": boolean,
  "relationshipType": "related_to" | "derives_from" | "contradicts" | "supports" | "references" | "part_of" | "leads_to" | "similar_to",
  "confidence": 0.0-1.0,
  "reasoning": "Brief explanation",
  "evidence": ["Specific quote or fact supporting this"]
}
`;

export class RelationshipEngine {
  private client: OpenAI;

  constructor(private db: Database, private config: InferenceConfig) {
    this.client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY ?? '' });
  }

  async inferForNode(nodeId: string): Promise<InferredRelationship[]> {
    const candidates = await this.findCandidates(nodeId);
    const inferred: InferredRelationship[] = [];

    for (const candidate of candidates.slice(0, this.config.maxPerNode)) {
      const inference = await this.inferPair(nodeId, candidate.nodeId);
      if (inference && inference.confidence >= this.config.minConfidence) {
        inferred.push(inference);
      }
      await this.applyRateLimit();
    }

    return inferred;
  }

  async inferForNodes(nodeIds: string[]): Promise<{
    inferred: InferredRelationship[];
    errors: Array<{ nodeId: string; error: string }>;
  }> {
    const inferred: InferredRelationship[] = [];
    const errors: Array<{ nodeId: string; error: string }> = [];

    for (const nodeId of nodeIds) {
      try {
        const results = await this.inferForNode(nodeId);
        inferred.push(...results);
      } catch (error) {
        errors.push({ nodeId, error: error instanceof Error ? error.message : String(error) });
      }
    }

    return { inferred, errors };
  }

  async inferAll(): Promise<InferredRelationship[]> {
    const nodes = await this.db.query<{ id: string }>('SELECT id FROM nodes');
    const result = await this.inferForNodes(nodes.map((node) => node.id));
    return result.inferred;
  }

  async findCandidates(nodeId: string): Promise<Array<{ nodeId: string; similarity: number }>> {
    const rows = await this.db.query<{ id: string; similarity: number }>(
      `SELECT id, 1 - (embedding <=> (SELECT embedding FROM nodes WHERE id = $1)) as similarity
       FROM nodes
       WHERE embedding IS NOT NULL AND id != $1
       ORDER BY embedding <=> (SELECT embedding FROM nodes WHERE id = $1)
       LIMIT $2`,
      [nodeId, this.config.maxPerNode * 3]
    );

    return rows
      .filter((row) => row.similarity >= this.config.similarityThreshold)
      .map((row) => ({ nodeId: row.id, similarity: row.similarity }));
  }

  async validateRelationship(rel: InferredRelationship): Promise<boolean> {
    return rel.confidence >= this.config.minConfidence;
  }

  async createEdgesFromInferences(
    inferences: InferredRelationship[],
    autoApprove = true
  ): Promise<NeuronEdge[]> {
    const created: NeuronEdge[] = [];
    if (!autoApprove) return created;

    for (const inference of inferences) {
      const rows = await this.db.query<NeuronEdge>(
        `INSERT INTO edges (from_node_id, to_node_id, relationship_type, strength, confidence, evidence, source, source_model)
         VALUES ($1, $2, $3, $4, $5, $6, 'ai_inferred', $7)
         ON CONFLICT (from_node_id, to_node_id, relationship_type) DO NOTHING
         RETURNING *`,
        [
          inference.fromNodeId,
          inference.toNodeId,
          inference.relationshipType,
          inference.confidence,
          inference.confidence,
          JSON.stringify(inference.evidence),
          this.config.model,
        ]
      );
      if (rows[0]) {
        created.push(rows[0]);
      }
    }

    return created;
  }

  private async inferPair(
    fromNodeId: string,
    toNodeId: string
  ): Promise<InferredRelationship | null> {
    const [nodeA, nodeB] = await Promise.all([
      this.db.queryOne<{ id: string; label: string; summary: string | null; content: string | null }>(
        'SELECT id, label, summary, content FROM nodes WHERE id = $1',
        [fromNodeId]
      ),
      this.db.queryOne<{ id: string; label: string; summary: string | null; content: string | null }>(
        'SELECT id, label, summary, content FROM nodes WHERE id = $1',
        [toNodeId]
      ),
    ]);

    if (!nodeA || !nodeB) return null;

    const prompt = INFERENCE_PROMPT.replace('{nodeA.label}', nodeA.label)
      .replace('{nodeA.summary}', nodeA.summary ?? '')
      .replace('{nodeA.content}', nodeA.content ?? '')
      .replace('{nodeB.label}', nodeB.label)
      .replace('{nodeB.summary}', nodeB.summary ?? '')
      .replace('{nodeB.content}', nodeB.content ?? '');

    const response = await this.client.chat.completions.create({
      model: this.config.model,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return null;

    const parsed = JSON.parse(content) as {
      hasRelationship: boolean;
      relationshipType: RelationshipType;
      confidence: number;
      reasoning: string;
      evidence: string[];
    };

    if (!parsed.hasRelationship) return null;

    return {
      fromNodeId,
      toNodeId,
      relationshipType: parsed.relationshipType ?? 'related_to',
      confidence: parsed.confidence ?? 0,
      reasoning: parsed.reasoning ?? '',
      evidence: (parsed.evidence ?? []).map((text) => ({ type: 'text', content: text })),
    };
  }

  private async applyRateLimit(): Promise<void> {
    const delayMs = Math.ceil(60_000 / this.config.rateLimit);
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
}
