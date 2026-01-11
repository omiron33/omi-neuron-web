import { describe, expect, it, vi } from 'vitest';
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
  id: overrides.id ?? '11111111-1111-4111-8111-111111111111',
  scope: overrides.scope ?? 'default',
  from_node_id: overrides.from_node_id ?? 'n1',
  to_node_id: overrides.to_node_id ?? 'n2',
  relationship_type: overrides.relationship_type ?? 'related_to',
  strength: overrides.strength ?? null,
  confidence: overrides.confidence ?? 0.9,
  reasoning: overrides.reasoning ?? null,
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

const createMockDb = (initial: SuggestedEdgeRow[]) => {
  const suggestions = new Map<string, SuggestedEdgeRow>();
  initial.forEach((row) => suggestions.set(`${row.scope}:${row.id}`, { ...row }));

  const edges = new Map<string, string>();
  const makeEdgeId = () => `edge-${edges.size + 1}`;

  const queryOne = vi.fn(async (sql: string, params: unknown[] = []) => {
    if (sql.startsWith('SELECT * FROM suggested_edges')) {
      const [id, scope] = params as [string, string];
      return suggestions.get(`${scope}:${id}`) ?? null;
    }

    if (sql.startsWith('UPDATE suggested_edges') && sql.includes("SET status = 'approved'")) {
      const [id, reviewedBy, reviewReason, approvedEdgeId, scope] = params as [string, string | null, string | null, string | null, string];
      const key = `${scope}:${id}`;
      const existing = suggestions.get(key);
      if (!existing) return null;
      const next: SuggestedEdgeRow = {
        ...existing,
        status: 'approved',
        reviewed_by: reviewedBy ?? null,
        reviewed_at: new Date(),
        review_reason: reviewReason ?? null,
        approved_edge_id: approvedEdgeId ?? null,
        updated_at: new Date(),
      };
      suggestions.set(key, next);
      return next;
    }

    if (sql.startsWith('UPDATE suggested_edges') && sql.includes("SET status = 'rejected'")) {
      const [id, reviewedBy, reviewReason, scope] = params as [string, string | null, string | null, string];
      const key = `${scope}:${id}`;
      const existing = suggestions.get(key);
      if (!existing) return null;
      const next: SuggestedEdgeRow = {
        ...existing,
        status: 'rejected',
        reviewed_by: reviewedBy ?? null,
        reviewed_at: new Date(),
        review_reason: reviewReason ?? null,
        updated_at: new Date(),
      };
      suggestions.set(key, next);
      return next;
    }

    if (sql.includes('WITH inserted AS')) {
      const [scope, fromNodeId, toNodeId, relationshipType] = params as [string, string, string, string];
      const key = `${scope}:${fromNodeId}:${toNodeId}:${relationshipType}`;
      const id = edges.get(key) ?? makeEdgeId();
      edges.set(key, id);
      return { id };
    }

    return null;
  });

  const query = vi.fn(async (_sql: string, params: unknown[] = []) => {
    // Used by list() - keep minimal for these tests.
    const [scope] = params as [string];
    const rows = Array.from(suggestions.values()).filter((row) => row.scope === scope);
    return rows;
  });

  const execute = vi.fn(async () => 1);

  return { queryOne, query, execute, suggestions, edges };
};

describe('Suggestions routes', () => {
  it('approves a pending suggestion, writes an ai_inferred edge, and is idempotent', async () => {
    vi.resetModules();

    const now = new Date();
    const id = '11111111-1111-4111-8111-111111111111';
    const db = createMockDb([
      buildSuggestionRow({
        id,
        scope: 'alpha',
        status: 'pending',
        confidence: 0.82,
        created_at: now,
        updated_at: now,
      }),
    ]);

    vi.doMock('../../src/storage/factory', () => ({
      createDatabase: () => db as any,
      createGraphStore: () => ({ kind: 'postgres' }),
    }));

    const { createSuggestionsRoutes } = await import('../../src/api/routes/suggestions');
    const routes = createSuggestionsRoutes(
      baseConfig(),
      { kind: 'postgres' } as any,
      {
        resolveUser: async () => ({ id: 'reviewer-1' }),
      }
    );

    const approveResponse = await routes.POST(new Request(`http://test/api/neuron/suggestions/${id}/approve`, { method: 'POST', headers: { 'x-neuron-scope': 'alpha' } }));
    expect(approveResponse.status).toBe(200);
    const approveBody = (await approveResponse.json()) as { approved: boolean; edgeId: string };
    expect(approveBody.approved).toBe(true);
    expect(approveBody.edgeId).toMatch(/^edge-/);

    const stored = db.suggestions.get(`alpha:${id}`);
    expect(stored?.status).toBe('approved');
    expect(stored?.approved_edge_id).toBe(approveBody.edgeId);
    expect(stored?.reviewed_by).toBe('reviewer-1');

    const edgeCountAfterFirst = db.edges.size;
    const approveAgainResponse = await routes.POST(new Request(`http://test/api/neuron/suggestions/${id}/approve`, { method: 'POST', headers: { 'x-neuron-scope': 'alpha' } }));
    expect(approveAgainResponse.status).toBe(200);
    const approveAgainBody = (await approveAgainResponse.json()) as { approved: boolean; edgeId: string };
    expect(approveAgainBody.edgeId).toBe(approveBody.edgeId);
    expect(db.edges.size).toBe(edgeCountAfterFirst);
  });

  it('rejects a pending suggestion and records a reason (idempotent)', async () => {
    vi.resetModules();

    const now = new Date();
    const id = '22222222-2222-4222-8222-222222222222';
    const db = createMockDb([
      buildSuggestionRow({ id, scope: 'alpha', status: 'pending', created_at: now, updated_at: now }),
    ]);

    vi.doMock('../../src/storage/factory', () => ({
      createDatabase: () => db as any,
      createGraphStore: () => ({ kind: 'postgres' }),
    }));

    const { createSuggestionsRoutes } = await import('../../src/api/routes/suggestions');
    const routes = createSuggestionsRoutes(
      baseConfig(),
      { kind: 'postgres' } as any,
      {
        resolveUser: async () => ({ id: 'reviewer-2' }),
      }
    );

    const rejectResponse = await routes.POST(
      new Request(`http://test/api/neuron/suggestions/${id}/reject`, {
        method: 'POST',
        headers: { 'x-neuron-scope': 'alpha' },
        body: JSON.stringify({ reason: 'Not relevant' }),
      })
    );
    expect(rejectResponse.status).toBe(200);
    const rejectBody = (await rejectResponse.json()) as { rejected: boolean };
    expect(rejectBody.rejected).toBe(true);

    const stored = db.suggestions.get(`alpha:${id}`);
    expect(stored?.status).toBe('rejected');
    expect(stored?.review_reason).toBe('Not relevant');
    expect(stored?.reviewed_by).toBe('reviewer-2');

    const rejectAgainResponse = await routes.POST(
      new Request(`http://test/api/neuron/suggestions/${id}/reject`, {
        method: 'POST',
        headers: { 'x-neuron-scope': 'alpha' },
        body: JSON.stringify({ reason: 'Still not relevant' }),
      })
    );
    expect(rejectAgainResponse.status).toBe(200);
    expect((await rejectAgainResponse.json()) as any).toMatchObject({ rejected: true });
  });

  it('bulk approves suggestions and returns notFoundIds (scope-aware)', async () => {
    vi.resetModules();

    const now = new Date();
    const pendingId = '33333333-3333-4333-8333-333333333333';
    const alreadyApprovedId = '44444444-4444-4444-8444-444444444444';
    const missingId = '55555555-5555-4555-8555-555555555555';
    const db = createMockDb([
      buildSuggestionRow({ id: pendingId, scope: 'alpha', status: 'pending', created_at: now, updated_at: now }),
      buildSuggestionRow({
        id: alreadyApprovedId,
        scope: 'alpha',
        status: 'approved',
        approved_edge_id: 'edge-existing',
        created_at: now,
        updated_at: now,
      }),
    ]);

    vi.doMock('../../src/storage/factory', () => ({
      createDatabase: () => db as any,
      createGraphStore: () => ({ kind: 'postgres' }),
    }));

    const { createSuggestionsRoutes } = await import('../../src/api/routes/suggestions');
    const routes = createSuggestionsRoutes(baseConfig(), { kind: 'postgres' } as any);

    const bulkResponse = await routes.POST(
      new Request('http://test/api/neuron/suggestions/approve', {
        method: 'POST',
        headers: { 'x-neuron-scope': 'alpha' },
        body: JSON.stringify({ ids: [pendingId, alreadyApprovedId, missingId] }),
      })
    );
    expect(bulkResponse.status).toBe(200);
    const json = (await bulkResponse.json()) as { approvedIds: string[]; edgeIds: string[]; notFoundIds: string[] };
    expect(json.approvedIds).toEqual([pendingId, alreadyApprovedId]);
    expect(json.edgeIds).toHaveLength(2);
    expect(json.edgeIds[1]).toBe('edge-existing');
    expect(json.notFoundIds).toEqual([missingId]);

    expect(db.suggestions.get(`alpha:${pendingId}`)?.status).toBe('approved');
    expect(db.suggestions.get(`alpha:${alreadyApprovedId}`)?.status).toBe('approved');
  });

  it('bulk rejects suggestions with a reason and is idempotent for already rejected rows', async () => {
    vi.resetModules();

    const now = new Date();
    const pendingId = '77777777-7777-4777-8777-777777777777';
    const alreadyRejectedId = '88888888-8888-4888-8888-888888888888';
    const missingId = '99999999-9999-4999-8999-999999999999';

    const db = createMockDb([
      buildSuggestionRow({ id: pendingId, scope: 'alpha', status: 'pending', created_at: now, updated_at: now }),
      buildSuggestionRow({
        id: alreadyRejectedId,
        scope: 'alpha',
        status: 'rejected',
        review_reason: 'Existing reason',
        reviewed_by: 'reviewer-old',
        reviewed_at: now,
        created_at: now,
        updated_at: now,
      }),
    ]);

    vi.doMock('../../src/storage/factory', () => ({
      createDatabase: () => db as any,
      createGraphStore: () => ({ kind: 'postgres' }),
    }));

    const { createSuggestionsRoutes } = await import('../../src/api/routes/suggestions');
    const routes = createSuggestionsRoutes(
      baseConfig(),
      { kind: 'postgres' } as any,
      {
        resolveUser: async () => ({ id: 'reviewer-3' }),
      }
    );

    const bulkResponse = await routes.POST(
      new Request('http://test/api/neuron/suggestions/reject', {
        method: 'POST',
        headers: { 'x-neuron-scope': 'alpha' },
        body: JSON.stringify({ ids: [pendingId, alreadyRejectedId, missingId], reason: 'Spam' }),
      })
    );
    expect(bulkResponse.status).toBe(200);
    const json = (await bulkResponse.json()) as { rejectedIds: string[]; notFoundIds: string[] };
    expect(json.rejectedIds).toEqual([pendingId, alreadyRejectedId]);
    expect(json.notFoundIds).toEqual([missingId]);

    const storedPending = db.suggestions.get(`alpha:${pendingId}`);
    expect(storedPending?.status).toBe('rejected');
    expect(storedPending?.review_reason).toBe('Spam');
    expect(storedPending?.reviewed_by).toBe('reviewer-3');

    const storedRejected = db.suggestions.get(`alpha:${alreadyRejectedId}`);
    expect(storedRejected?.status).toBe('rejected');
    expect(storedRejected?.review_reason).toBe('Existing reason');
    expect(storedRejected?.reviewed_by).toBe('reviewer-old');
  });

  it('enforces auth guard hooks before hitting storage', async () => {
    vi.resetModules();

    const db = createMockDb([buildSuggestionRow({ id: '66666666-6666-4666-8666-666666666666', scope: 'alpha', status: 'pending' })]);

    vi.doMock('../../src/storage/factory', () => ({
      createDatabase: () => db as any,
      createGraphStore: () => ({ kind: 'postgres' }),
    }));

    const { createSuggestionsRoutes } = await import('../../src/api/routes/suggestions');
    const routes = createSuggestionsRoutes(baseConfig(), { kind: 'postgres' } as any, undefined, {
      authorize: (_req, context) =>
        context.scope === 'alpha'
          ? true
          : { allowed: false, statusCode: 403, code: 'FORBIDDEN', error: 'Forbidden' },
    });

    const response = await routes.GET(new Request('http://test/api/neuron/suggestions?status=pending', { headers: { 'x-neuron-scope': 'beta' } }));
    expect(response.status).toBe(403);
    expect(db.queryOne).not.toHaveBeenCalled();
  });
});
