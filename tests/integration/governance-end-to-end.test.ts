import crypto from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import { RelationshipEngine, type InferredRelationship } from '../../src/core/analysis/relationship-engine';
import { PostgresGraphStore } from '../../src/core/store/postgres-graph-store';
import { DEFAULT_ANALYSIS_SETTINGS, DEFAULT_VISUALIZATION_SETTINGS, type NeuronConfig } from '../../src/core/types/settings';

type SuggestedEdgeRow = {
  id: string;
  scope: string;
  from_node_id: string;
  to_node_id: string;
  relationship_type: string;
  strength: number | null;
  confidence: number;
  reasoning: string | null;
  evidence: unknown;
  status: 'pending' | 'approved' | 'rejected';
  source_model: string | null;
  analysis_run_id: string | null;
  reviewed_by: string | null;
  reviewed_at: Date | null;
  review_reason: string | null;
  approved_edge_id: string | null;
  created_at: Date;
  updated_at: Date;
};

type EdgeRow = {
  id: string;
  scope: string;
  from_node_id: string;
  to_node_id: string;
  relationship_type: string;
  strength: number;
  confidence: number;
  evidence: unknown;
  label: string | null;
  description: string | null;
  metadata: Record<string, unknown>;
  source: 'ai_inferred' | 'manual' | 'imported';
  source_model: string | null;
  bidirectional: boolean;
  created_at: Date;
  updated_at: Date;
};

const baseConfig = (): NeuronConfig => ({
  instance: { name: 'test', version: '0.1.1', repoName: 'omi-neuron-web' },
  visualization: DEFAULT_VISUALIZATION_SETTINGS,
  analysis: DEFAULT_ANALYSIS_SETTINGS,
  nodeTypes: [],
  domains: [],
  relationshipTypes: [],
  openai: { apiKey: 'test' },
  database: { mode: 'external', port: 5433 },
  api: { basePath: '/api/neuron', enableCors: false },
  logging: { level: 'info', prettyPrint: true },
  storage: { mode: 'memory' },
});

const buildSuggestionRow = (overrides: Partial<SuggestedEdgeRow>): SuggestedEdgeRow => ({
  id: overrides.id ?? 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  scope: overrides.scope ?? 'default',
  from_node_id: overrides.from_node_id ?? 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  to_node_id: overrides.to_node_id ?? 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
  relationship_type: overrides.relationship_type ?? 'related_to',
  strength: overrides.strength ?? null,
  confidence: overrides.confidence ?? 0.9,
  reasoning: overrides.reasoning ?? 'because',
  evidence: overrides.evidence ?? [],
  status: overrides.status ?? 'pending',
  source_model: overrides.source_model ?? 'gpt-test',
  analysis_run_id: overrides.analysis_run_id ?? null,
  reviewed_by: overrides.reviewed_by ?? null,
  reviewed_at: overrides.reviewed_at ?? null,
  review_reason: overrides.review_reason ?? null,
  approved_edge_id: overrides.approved_edge_id ?? null,
  created_at: overrides.created_at ?? new Date(),
  updated_at: overrides.updated_at ?? new Date(),
});

const parseJsonField = (value: unknown) => {
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

const createInMemoryDb = () => {
  const suggestions = new Map<string, SuggestedEdgeRow>();
  const edges = new Map<string, EdgeRow>();

  const deterministicSuggestionId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const deterministicEdgeId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

  const nextTimestamp = () => new Date();

  const queryOne = vi.fn(async (sql: string, params: unknown[] = []) => {
    if (sql.includes('INSERT INTO suggested_edges')) {
      const [scope, fromNodeId, toNodeId, relationshipType, confidence, strength, reasoning, evidence, sourceModel, analysisRunId] = params as [
        string,
        string,
        string,
        string,
        number,
        number,
        string | null,
        unknown,
        string | null,
        string | null,
      ];

      const key = `${scope}:${fromNodeId}:${toNodeId}:${relationshipType}`;
      const existing = suggestions.get(key);
      if (existing && existing.status !== 'pending') {
        return null;
      }

      const now = nextTimestamp();
      const row: SuggestedEdgeRow = {
        ...(existing ?? buildSuggestionRow({})),
        id: existing?.id ?? deterministicSuggestionId,
        scope,
        from_node_id: fromNodeId,
        to_node_id: toNodeId,
        relationship_type: relationshipType,
        confidence,
        strength: strength ?? null,
        reasoning: reasoning ?? null,
        evidence: parseJsonField(evidence) ?? [],
        status: 'pending',
        source_model: sourceModel ?? null,
        analysis_run_id: analysisRunId ?? null,
        updated_at: now,
        created_at: existing?.created_at ?? now,
      };
      suggestions.set(key, row);
      return { id: row.id };
    }

    if (sql.startsWith('SELECT * FROM suggested_edges')) {
      const [id, scope] = params as [string, string];
      const row = Array.from(suggestions.values()).find((candidate) => candidate.id === id && candidate.scope === scope);
      return row ? { ...row } : null;
    }

    if (sql.startsWith('UPDATE suggested_edges') && sql.includes("SET status = 'approved'")) {
      const [id, reviewedBy, reviewReason, approvedEdgeId, scope] = params as [string, string | null, string | null, string | null, string];
      const existingKey = Array.from(suggestions.entries()).find(([, row]) => row.id === id && row.scope === scope)?.[0];
      if (!existingKey) return null;
      const existing = suggestions.get(existingKey);
      if (!existing) return null;
      const now = nextTimestamp();
      const updated: SuggestedEdgeRow = {
        ...existing,
        status: 'approved',
        reviewed_by: reviewedBy ?? null,
        reviewed_at: now,
        review_reason: reviewReason ?? null,
        approved_edge_id: approvedEdgeId ?? null,
        updated_at: now,
      };
      suggestions.set(existingKey, updated);
      return { ...updated };
    }

    if (sql.startsWith('UPDATE suggested_edges') && sql.includes("SET status = 'rejected'")) {
      const [id, reviewedBy, reviewReason, scope] = params as [string, string | null, string | null, string];
      const existingKey = Array.from(suggestions.entries()).find(([, row]) => row.id === id && row.scope === scope)?.[0];
      if (!existingKey) return null;
      const existing = suggestions.get(existingKey);
      if (!existing) return null;
      const now = nextTimestamp();
      const updated: SuggestedEdgeRow = {
        ...existing,
        status: 'rejected',
        reviewed_by: reviewedBy ?? null,
        reviewed_at: now,
        review_reason: reviewReason ?? null,
        updated_at: now,
      };
      suggestions.set(existingKey, updated);
      return { ...updated };
    }

    if (sql.includes('WITH inserted AS') && sql.includes('INSERT INTO edges')) {
      const [scope, fromNodeId, toNodeId, relationshipType, strength, confidence, evidence, sourceModel] = params as [
        string,
        string,
        string,
        string,
        number,
        number,
        unknown,
        string | null,
      ];

      const key = `${scope}:${fromNodeId}:${toNodeId}:${relationshipType}`;
      const existing = edges.get(key);
      if (existing) return { id: existing.id };

      const now = nextTimestamp();
      const row: EdgeRow = {
        id: deterministicEdgeId,
        scope,
        from_node_id: fromNodeId,
        to_node_id: toNodeId,
        relationship_type: relationshipType,
        strength: Number(strength ?? confidence ?? 0.5),
        confidence: Number(confidence ?? 1),
        evidence: parseJsonField(evidence) ?? [],
        label: null,
        description: null,
        metadata: {},
        source: 'ai_inferred',
        source_model: sourceModel ?? null,
        bidirectional: false,
        created_at: now,
        updated_at: now,
      };
      edges.set(key, row);
      return { id: row.id };
    }

    if (sql.startsWith('SELECT * FROM edges WHERE id = $1')) {
      const [id, scope] = params as [string, string];
      const row = Array.from(edges.values()).find((candidate) => candidate.id === id && candidate.scope === scope);
      return row ? { ...row } : null;
    }

    return null;
  });

  const query = vi.fn(async (sql: string, params: unknown[] = []) => {
    if (sql.startsWith('SELECT * FROM edges WHERE scope = $1')) {
      const [scope] = params as [string];
      return Array.from(edges.values()).filter((row) => row.scope === scope);
    }
    return [];
  });

  const execute = vi.fn(async () => 1);

  const tableExists = vi.fn(async (table: string) => table === 'suggested_edges');

  return { queryOne, query, execute, tableExists, suggestions, edges };
};

describe('Governance end-to-end (suggestions → approve → edges)', () => {
  it('persists a pending suggestion, approves it, and exposes the created edge through edges queries', async () => {
    vi.resetModules();

    const scope = 'alpha';
    const reviewerId = 'reviewer-1';
    const db = createInMemoryDb();

    const inference: InferredRelationship = {
      fromNodeId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
      toNodeId: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
      relationshipType: 'related_to',
      confidence: 0.9,
      reasoning: 'because',
      evidence: [{ type: 'text', content: 'evidence' }],
    };

    const engine = new RelationshipEngine(
      db as any,
      {
        model: 'gpt-4o-mini',
        minConfidence: 0.7,
        maxPerNode: 10,
        similarityThreshold: 0.75,
        includeExisting: false,
        batchSize: 10,
        rateLimit: 60,
        governanceEnabled: true,
        autoApproveEnabled: false,
      },
      { generate: vi.fn(async () => ({ content: null })) } as any,
      { scope }
    );

    const analysisRunId = crypto.randomUUID();
    const persistResult = await engine.persistInferences([inference], { analysisRunId });
    expect(persistResult.suggestionsUpserted).toBe(1);
    expect(persistResult.suggestionsApproved).toBe(0);
    expect(persistResult.edgesEnsured).toBe(0);

    const suggested = Array.from(db.suggestions.values()).find((row) => row.scope === scope);
    expect(suggested?.status).toBe('pending');
    expect(suggested?.analysis_run_id).toBe(analysisRunId);
    expect(suggested?.confidence).toBeCloseTo(inference.confidence);
    expect(suggested?.relationship_type).toBe(inference.relationshipType);

    vi.doMock('../../src/storage/factory', () => ({
      createDatabase: () => db as any,
      createGraphStore: () => new PostgresGraphStore(db as any),
    }));

    const store = new PostgresGraphStore(db as any);
    const { createSuggestionsRoutes } = await import('../../src/api/routes/suggestions');
    const { createEdgesRoutes } = await import('../../src/api/routes/edges');

    const suggestionsRoutes = createSuggestionsRoutes(
      baseConfig(),
      store,
      {
        resolveUser: async () => ({ id: reviewerId }),
      }
    );
    const edgesRoutes = createEdgesRoutes(baseConfig(), store);

    const approveResponse = await suggestionsRoutes.POST(
      new Request(`http://test/api/neuron/suggestions/${suggested?.id}/approve`, {
        method: 'POST',
        headers: { 'x-neuron-scope': scope },
      })
    );
    expect(approveResponse.status).toBe(200);
    const approveBody = (await approveResponse.json()) as { approved: boolean; edgeId: string };
    expect(approveBody).toMatchObject({ approved: true });
    expect(approveBody.edgeId).toBe('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');

    const approvedRow = Array.from(db.suggestions.values()).find((row) => row.id === suggested?.id && row.scope === scope);
    expect(approvedRow?.status).toBe('approved');
    expect(approvedRow?.reviewed_by).toBe(reviewerId);
    expect(approvedRow?.approved_edge_id).toBe(approveBody.edgeId);

    const edgesResponse = await edgesRoutes.GET(new Request('http://test/api/neuron/edges', { headers: { 'x-neuron-scope': scope } }));
    expect(edgesResponse.status).toBe(200);
    const edgesBody = (await edgesResponse.json()) as { edges: Array<{ id: string; source: string }>; pagination: unknown };
    expect(edgesBody.edges).toHaveLength(1);
    expect(edgesBody.edges[0]).toMatchObject({ id: approveBody.edgeId, source: 'ai_inferred' });
  });
});

