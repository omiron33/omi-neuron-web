import { describe, expect, it, vi } from 'vitest';
import { RelationshipEngine, type InferredRelationship } from '../../src/core/analysis/relationship-engine';

describe('RelationshipEngine (governance persistence)', () => {
  it('persists suggestions and auto-approves into edges when enabled', async () => {
    const db = {
      tableExists: vi.fn(async () => true),
      queryOne: vi.fn(async (sql: string) => {
        if (sql.includes('INSERT INTO suggested_edges')) return { id: 's-1' };
        if (sql.includes('WITH inserted AS')) return { id: 'e-1' };
        if (sql.includes('UPDATE suggested_edges')) return { id: 's-1' };
        return null;
      }),
    } as any;

    const engine = new RelationshipEngine(
      db,
      {
        model: 'gpt-4o-mini',
        minConfidence: 0.7,
        maxPerNode: 10,
        similarityThreshold: 0.75,
        includeExisting: false,
        batchSize: 10,
        rateLimit: 60,
        governanceEnabled: true,
        autoApproveEnabled: true,
        autoApproveMinConfidence: 0.8,
      },
      { generate: vi.fn(async () => ({ content: null })) } as any
    );

    const inference: InferredRelationship = {
      fromNodeId: 'n1',
      toNodeId: 'n2',
      relationshipType: 'related_to',
      confidence: 0.9,
      reasoning: 'because',
      evidence: [],
    };

    const result = await engine.persistInferences([inference], { analysisRunId: 'job-1' });

    expect(db.tableExists).toHaveBeenCalledOnce();
    expect(result.suggestionsUpserted).toBe(1);
    expect(result.suggestionsApproved).toBe(1);
    expect(result.edgesEnsured).toBe(1);
  });

  it('persists suggestions but does not auto-approve when confidence is below threshold', async () => {
    const db = {
      tableExists: vi.fn(async () => true),
      queryOne: vi.fn(async (sql: string) => {
        if (sql.includes('INSERT INTO suggested_edges')) return { id: 's-1' };
        return null;
      }),
    } as any;

    const engine = new RelationshipEngine(
      db,
      {
        model: 'gpt-4o-mini',
        minConfidence: 0.7,
        maxPerNode: 10,
        similarityThreshold: 0.75,
        includeExisting: false,
        batchSize: 10,
        rateLimit: 60,
        governanceEnabled: true,
        autoApproveEnabled: true,
        autoApproveMinConfidence: 0.95,
      },
      { generate: vi.fn(async () => ({ content: null })) } as any
    );

    const inference: InferredRelationship = {
      fromNodeId: 'n1',
      toNodeId: 'n2',
      relationshipType: 'related_to',
      confidence: 0.9,
      reasoning: 'because',
      evidence: [],
    };

    const result = await engine.persistInferences([inference], { analysisRunId: 'job-1' });

    expect(db.tableExists).toHaveBeenCalledOnce();
    expect(result.suggestionsUpserted).toBe(1);
    expect(result.suggestionsApproved).toBe(0);
    expect(result.edgesEnsured).toBe(0);
  });

  it('falls back to edge writes when suggested_edges table is missing', async () => {
    const db = {
      tableExists: vi.fn(async () => false),
      queryOne: vi.fn(async (sql: string) => {
        if (sql.includes('WITH inserted AS')) return { id: 'e-1' };
        return null;
      }),
    } as any;

    const engine = new RelationshipEngine(
      db,
      {
        model: 'gpt-4o-mini',
        minConfidence: 0.7,
        maxPerNode: 10,
        similarityThreshold: 0.75,
        includeExisting: false,
        batchSize: 10,
        rateLimit: 60,
        governanceEnabled: true,
        autoApproveEnabled: true,
        autoApproveMinConfidence: 0.8,
      },
      { generate: vi.fn(async () => ({ content: null })) } as any
    );

    const inference: InferredRelationship = {
      fromNodeId: 'n1',
      toNodeId: 'n2',
      relationshipType: 'related_to',
      confidence: 0.9,
      reasoning: 'because',
      evidence: [],
    };

    const result = await engine.persistInferences([inference], { analysisRunId: 'job-1' });

    expect(db.tableExists).toHaveBeenCalledOnce();
    expect(result.suggestionsUpserted).toBe(0);
    expect(result.suggestionsApproved).toBe(0);
    expect(result.edgesEnsured).toBe(1);
  });
});

