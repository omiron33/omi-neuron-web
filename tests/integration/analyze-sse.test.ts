import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_ANALYSIS_SETTINGS, DEFAULT_VISUALIZATION_SETTINGS, type NeuronConfig } from '../../src/core/types/settings';

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

const decodeStream = async (stream: ReadableStream<Uint8Array>, maxChunks = 10): Promise<string> => {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let output = '';
  let chunks = 0;
  const readWithTimeout = async () =>
    (await Promise.race([
      reader.read(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timed out reading SSE stream')), 1_000)),
    ])) as ReadableStreamReadResult<Uint8Array>;

  try {
    while (chunks < maxChunks) {
      const result = await readWithTimeout();
      if (result.done) break;
      output += decoder.decode(result.value, { stream: true });
      chunks += 1;
      if (output.includes('\n\n')) break;
    }
  } finally {
    reader.releaseLock();
  }
  return output;
};

describe('Analyze SSE streaming + polling fallback', () => {
  it('streams progress events and closes on terminal event', async () => {
    vi.resetModules();

    const busInstances: any[] = [];
    const actualEvents = await vi.importActual<typeof import('../../src/core/events/event-bus')>(
      '../../src/core/events/event-bus'
    );

    vi.doMock('../../src/core/events/event-bus', () => {
      class CapturingEventBus extends actualEvents.EventBus {
        constructor(...args: any[]) {
          super(...args);
          busInstances.push(this);
        }
      }
      return { ...actualEvents, EventBus: CapturingEventBus };
    });

    const mockDb = {
      queryOne: vi.fn(async (sql: string) => {
        if (sql.includes('SELECT status, progress_snapshot FROM analysis_runs')) {
          return {
            status: 'running',
            progress_snapshot: {
              jobId: 'job-1',
              scope: 'default',
              runType: 'embedding',
              stage: 'embeddings',
              progress: 0,
              overallProgress: 0,
              currentItem: 'starting',
              itemsProcessed: 0,
              totalItems: 2,
            },
          };
        }
        return null;
      }),
      query: vi.fn(async () => []),
      execute: vi.fn(async () => 1),
    };

    vi.doMock('../../src/storage/factory', () => ({
      createDatabase: () => mockDb,
      createGraphStore: () => ({ kind: 'postgres' }),
    }));

    const { createAnalyzeRoutes } = await import('../../src/api/routes/analyze');
    const { createEvent } = await import('../../src/core/events/event-bus');

    const store = { kind: 'postgres' } as any;
    const routes = createAnalyzeRoutes(baseConfig(), store);

    const response = await routes.GET(new Request('http://test/api/neuron/analyze/job-1/stream'));
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/event-stream');

    const stream = response.body;
    expect(stream).toBeTruthy();

    const initial = await decodeStream(stream!);
    expect(initial).toContain('event: analysis.job.progress');
    expect(initial).toContain('"jobId":"job-1"');

    const bus = busInstances[0];
    expect(bus).toBeTruthy();

    await bus.emitAsync(
      createEvent(
        'analysis.job.progress',
        {
          jobId: 'job-1',
          scope: 'default',
          stage: 'embeddings',
          progress: 50,
          overallProgress: 50,
          currentItem: 'n1',
          itemsProcessed: 1,
          totalItems: 2,
        },
        'analysis'
      )
    );

    const mid = await decodeStream(stream!);
    expect(mid).toContain('event: analysis.job.progress');
    expect(mid).toContain('"progress":50');

    await bus.emitAsync(createEvent('analysis.job.completed', { jobId: 'job-1', scope: 'default' }, 'analysis'));

    const terminal = await decodeStream(stream!);
    expect(terminal).toContain('event: analysis.job.completed');
  });

  it('returns a polling-friendly progress snapshot from GET /analyze/:jobId', async () => {
    vi.resetModules();

    const actualEvents = await vi.importActual<typeof import('../../src/core/events/event-bus')>(
      '../../src/core/events/event-bus'
    );

    vi.doMock('../../src/core/events/event-bus', () => actualEvents);
    vi.doMock('../../src/core/providers/openai/openai-embedding-provider', () => ({
      OpenAIEmbeddingProvider: class OpenAIEmbeddingProvider {
        readonly name = 'openai';
        constructor() {}
        async embed(): Promise<never> {
          throw new Error('Embedding provider not available in tests');
        }
      },
    }));
    vi.doMock('../../src/core/providers/openai/openai-llm-provider', () => ({
      OpenAILLMProvider: class OpenAILLMProvider {
        readonly name = 'openai';
        constructor() {}
        async generate(): Promise<never> {
          throw new Error('LLM provider not available in tests');
        }
      },
    }));

    const mockDb = {
      queryOne: vi.fn(async (sql: string) => {
        if (sql.includes('SELECT * FROM analysis_runs')) {
          return {
            id: 'job-1',
            run_type: 'embedding',
            input_params: {},
            results: {},
            status: 'running',
            progress: 12,
            started_at: null,
            completed_at: null,
            duration_ms: null,
            error_message: null,
            error_stack: null,
          };
        }
        if (sql.includes('SELECT progress_snapshot FROM analysis_runs')) {
          return {
            progress_snapshot: {
              jobId: 'job-1',
              scope: 'default',
              runType: 'embedding',
              stage: 'embeddings',
              progress: 12,
              overallProgress: 12,
              currentItem: 'n1',
              itemsProcessed: 1,
              totalItems: 8,
            },
          };
        }
        return null;
      }),
      query: vi.fn(async () => []),
      execute: vi.fn(async () => 1),
    };

    vi.doMock('../../src/storage/factory', () => ({
      createDatabase: () => mockDb,
      createGraphStore: () => ({ kind: 'postgres' }),
    }));

    const { createAnalyzeRoutes } = await import('../../src/api/routes/analyze');
    const store = { kind: 'postgres' } as any;
    const routes = createAnalyzeRoutes(baseConfig(), store);

    const response = await routes.GET(new Request('http://test/api/neuron/analyze/job-1'));
    expect(response.status).toBe(200);

    const json = (await response.json()) as { job: { id: string; status: string }; progress: { jobId: string } | null };
    expect(json.job.id).toBe('job-1');
    expect(json.job.status).toBe('running');
    expect(json.progress?.jobId).toBe('job-1');
  });
});
