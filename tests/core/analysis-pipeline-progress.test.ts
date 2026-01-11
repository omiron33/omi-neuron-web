import { describe, it, expect, vi } from 'vitest';
import { AnalysisPipeline } from '../../src/core/analysis/pipeline';
import { EventBus } from '../../src/core/events/event-bus';

const createMockDb = () => {
  const state = {
    runType: 'embedding',
    results: {
      nodesProcessed: 0,
      embeddingsGenerated: 0,
      clustersCreated: 0,
      relationshipsInferred: 0,
      errors: [],
    } as any,
  };

  return {
    queryOne: vi.fn(async (sql: string, params: unknown[] = []) => {
      if (sql.includes('INSERT INTO analysis_runs')) {
        state.runType = (params[1] as any) ?? state.runType;
        return {
          id: 'job-1',
          run_type: state.runType,
          input_params: params[2] ?? {},
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
    query: vi.fn(async () => []),
    execute: vi.fn(async (sql: string, params: unknown[] = []) => {
      if (sql.includes('UPDATE analysis_runs SET results')) {
        state.results = params[0] as any;
      }
      return 1;
    }),
  };
};

describe('AnalysisPipeline progress emission + persistence', () => {
  it('emits analysis.job.* events and persists progress snapshots', async () => {
    const db = createMockDb();
    const events = new EventBus();
    const seen: Array<{ type: string; payload: any; source: string }> = [];
    events.subscribeAll((event) => {
      seen.push({ type: event.type, payload: event.payload, source: event.source });
    });

    const embeddings = {
      embedNodesWithProgress: vi.fn(async (_nodeIds: string[], options?: { onProgress?: (value: any) => void }) => {
        options?.onProgress?.({ processed: 1, total: 2, currentItem: 'n1' });
        options?.onProgress?.({ processed: 2, total: 2, currentItem: 'n2' });
        return { results: [{ nodeId: 'n1' }, { nodeId: 'n2' }], errors: [] };
      }),
    } as any;

    const pipeline = new AnalysisPipeline(db as any, embeddings, {} as any, {} as any, events);
    await pipeline.runEmbeddings({ nodeIds: ['n1', 'n2'] });

    const types = seen.map((event) => event.type);
    expect(types).toContain('analysis.job.started');
    expect(types).toContain('analysis.job.progress');
    expect(types).toContain('analysis.job.completed');

    const progressEvents = seen.filter((event) => event.type === 'analysis.job.progress');
    expect(progressEvents.length).toBeGreaterThan(0);
    expect(progressEvents.some((event) => event.payload?.stage === 'embeddings')).toBe(true);

    const snapshotUpdates = (db.execute as any).mock.calls
      .filter(([sql]) => String(sql).includes('progress_snapshot'))
      .map(([, params]) => params as unknown[]);

    expect(snapshotUpdates.length).toBeGreaterThan(0);

    const parsedSnapshots = snapshotUpdates
      .map((params) => String(params[1]))
      .map((value) => JSON.parse(value));

    expect(parsedSnapshots.some((snapshot) => snapshot.runType === 'embedding')).toBe(true);
    expect(parsedSnapshots.some((snapshot) => snapshot.stage === 'embeddings')).toBe(true);
    expect(parsedSnapshots.some((snapshot) => snapshot.jobId === 'job-1' && snapshot.scope === 'default')).toBe(true);

    const mid = parsedSnapshots.find((snapshot) => snapshot.itemsProcessed === 1 && snapshot.totalItems === 2);
    expect(mid).toBeTruthy();
    expect(mid.progress).toBe(50);
    expect(mid.overallProgress).toBe(50);
  });
});

