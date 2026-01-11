import { describe, expect, it, vi } from 'vitest';
import { SuggestedEdgeRepository } from '../../src/api/repositories/suggested-edge-repository';

describe('SuggestedEdgeRepository', () => {
  it('upserts and maps suggested edge rows', async () => {
    const now = new Date();
    const db = {
      queryOne: vi.fn(async () => ({
        id: 's-1',
        scope: 'scope-a',
        from_node_id: 'n1',
        to_node_id: 'n2',
        relationship_type: 'related_to',
        strength: 0.5,
        confidence: 0.9,
        reasoning: 'because',
        evidence: [],
        status: 'pending',
        source_model: 'gpt-4o-mini',
        analysis_run_id: 'job-1',
        reviewed_by: null,
        reviewed_at: null,
        review_reason: null,
        approved_edge_id: null,
        created_at: now,
        updated_at: now,
      })),
      query: vi.fn(async () => []),
      execute: vi.fn(async () => 1),
    } as any;

    const repo = new SuggestedEdgeRepository(db);
    const suggestion = await repo.upsertSuggestion(
      {
        fromNodeId: 'n1',
        toNodeId: 'n2',
        relationshipType: 'related_to',
        confidence: 0.9,
        reasoning: 'because',
        evidence: [],
        sourceModel: 'gpt-4o-mini',
        analysisRunId: 'job-1',
      },
      { scope: 'scope-a' }
    );

    expect(db.queryOne).toHaveBeenCalledOnce();
    expect(suggestion.id).toBe('s-1');
    expect(suggestion.scope).toBe('scope-a');
    expect(suggestion.fromNodeId).toBe('n1');
    expect(suggestion.toNodeId).toBe('n2');
    expect(suggestion.relationshipType).toBe('related_to');
    expect(suggestion.status).toBe('pending');
  });

  it('scopes list queries via GraphStoreContext', async () => {
    const now = new Date();
    const db = {
      queryOne: vi.fn(async () => null),
      query: vi.fn(async (_sql: string, values: unknown[]) => {
        expect(values[0]).toBe('scope-b');
        return [
          {
            id: 's-1',
            scope: 'scope-b',
            from_node_id: 'n1',
            to_node_id: 'n2',
            relationship_type: 'related_to',
            strength: 0.5,
            confidence: 0.9,
            reasoning: 'because',
            evidence: [],
            status: 'pending',
            source_model: null,
            analysis_run_id: null,
            reviewed_by: null,
            reviewed_at: null,
            review_reason: null,
            approved_edge_id: null,
            created_at: now,
            updated_at: now,
          },
        ];
      }),
      execute: vi.fn(async () => 1),
    } as any;

    const repo = new SuggestedEdgeRepository(db);
    const results = await repo.list({ status: 'pending' }, { scope: 'scope-b' });

    expect(results).toHaveLength(1);
    expect(results[0]?.scope).toBe('scope-b');
  });
});

