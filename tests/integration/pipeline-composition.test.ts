import { describe, it, expect, vi } from 'vitest';
import { AnalysisPipeline, type PipelineProgress } from '../../src/core/analysis/pipeline';
import { EventBus } from '../../src/core/events/event-bus';

const createMockDb = () => {
  const state = {
    results: {
      nodesProcessed: 0,
      embeddingsGenerated: 0,
      clustersCreated: 0,
      relationshipsInferred: 0,
      errors: [],
    } as any,
    runType: 'full_analysis',
  };

  return {
    queryOne: vi.fn(async (sql: string, params: unknown[] = []) => {
      if (sql.includes('INSERT INTO analysis_runs')) {
        state.runType = (params[1] as any) ?? state.runType;
        return {
          id: 'job-1',
          run_type: state.runType,
          input_params: {},
          results: state.results,
          status: 'running',
          progress: 0,
        };
      }
      if (sql.includes('SELECT results FROM analysis_runs')) {
        return { results: state.results };
      }
      if (sql.includes("SET status = 'completed'")) {
        return {
          id: 'job-1',
          run_type: state.runType,
          input_params: {},
          results: state.results,
          status: 'completed',
          progress: 100,
        };
      }
      return null;
    }),
    query: vi.fn(async (sql: string) => {
      if (sql.includes('SELECT id FROM nodes')) {
        return [{ id: 'n1' }, { id: 'n2' }];
      }
      return [];
    }),
    execute: vi.fn(async (sql: string, params: unknown[] = []) => {
      if (sql.includes('UPDATE analysis_runs SET results')) {
        state.results = params[0] as any;
      }
      return 1;
    }),
  };
};

describe('AnalysisPipeline composition', () => {
  it('runs default steps in order and reports progress', async () => {
    const db = createMockDb();
    const callOrder: string[] = [];
    const progress: PipelineProgress[] = [];

    const embeddings = {
      embedNodesWithProgress: vi.fn(async (_nodeIds: string[], options?: { onProgress?: (value: any) => void }) => {
        callOrder.push('embeddings');
        options?.onProgress?.({ processed: 2, total: 2, currentItem: 'n2' });
        return { results: [{ nodeId: 'n1' }, { nodeId: 'n2' }], errors: [] };
      }),
    } as any;

    const clustering = {
      clusterNodes: vi.fn(async () => {
        callOrder.push('clustering');
        return { clusters: [{ clusterId: 'c1' }], unassigned: [] };
      }),
    } as any;

    const relationships = {
      inferForNodesWithProgress: vi.fn(async (_nodeIds: string[], options?: { onProgress?: (value: any) => void }) => {
        callOrder.push('relationships');
        options?.onProgress?.({ processed: 1, total: 2, currentItem: 'n1' });
        options?.onProgress?.({ processed: 2, total: 2, currentItem: 'n2' });
        return { inferred: [{ fromNodeId: 'n1', toNodeId: 'n2' }], errors: [] };
      }),
      createEdgesFromInferences: vi.fn(async () => []),
    } as any;

    const pipeline = new AnalysisPipeline(db as any, embeddings, clustering, relationships, new EventBus());
    await pipeline.runFull({ onProgress: (p) => progress.push(p) });

    expect(callOrder).toEqual(['embeddings', 'clustering', 'relationships']);
    expect(new Set(progress.map((p) => p.stage))).toEqual(new Set(['embeddings', 'clustering', 'relationships']));
    expect(progress.some((p) => typeof p.overallProgress === 'number')).toBe(true);
  });

  it('respects skip flags for runFull', async () => {
    const db = createMockDb();

    const embeddings = { embedNodesWithProgress: vi.fn(async () => ({ results: [], errors: [] })) } as any;
    const clustering = { clusterNodes: vi.fn(async () => ({ clusters: [], unassigned: [] })) } as any;
    const relationships = {
      inferForNodesWithProgress: vi.fn(async () => ({ inferred: [], errors: [] })),
      createEdgesFromInferences: vi.fn(async () => []),
    } as any;

    const pipeline = new AnalysisPipeline(db as any, embeddings, clustering, relationships, new EventBus());
    await pipeline.runFull({ skipClustering: true });

    expect(embeddings.embedNodesWithProgress).toHaveBeenCalled();
    expect(clustering.clusterNodes).not.toHaveBeenCalled();
    expect(relationships.inferForNodesWithProgress).toHaveBeenCalled();
  });

  it('runEmbeddings ignores skipEmbeddings and executes the embeddings step', async () => {
    const db = createMockDb();
    const embeddings = { embedNodesWithProgress: vi.fn(async () => ({ results: [], errors: [] })) } as any;
    const clustering = { clusterNodes: vi.fn() } as any;
    const relationships = { inferForNodesWithProgress: vi.fn(), createEdgesFromInferences: vi.fn() } as any;

    const pipeline = new AnalysisPipeline(db as any, embeddings, clustering, relationships, new EventBus());
    await pipeline.runEmbeddings({ skipEmbeddings: true });

    expect(embeddings.embedNodesWithProgress).toHaveBeenCalled();
    expect(clustering.clusterNodes).not.toHaveBeenCalled();
    expect(relationships.inferForNodesWithProgress).not.toHaveBeenCalled();
  });

  it('cancelJob aborts and updates status', async () => {
    const db = createMockDb();
    const pipeline = new AnalysisPipeline(db as any, {} as any, {} as any, {} as any, new EventBus());

    // Force a running job entry for cancellation.
    (pipeline as any).activeJobs.set('job-1', new AbortController());
    const cancelled = await pipeline.cancelJob('job-1');

    expect(cancelled).toBe(true);
    expect(db.execute).toHaveBeenCalled();
  });
});
