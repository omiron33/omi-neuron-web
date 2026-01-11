import type { NeuronConfig } from '../../core/types/settings';
import { analysisRequestSchema } from '../../core/schemas/analysis';
import type { GraphStore } from '../../core/store/graph-store';
import { createDatabase, createGraphStore } from '../../storage/factory';
import { EventBus } from '../../core/events/event-bus';
import { EmbeddingsService } from '../../core/analysis/embeddings-service';
import { ClusteringEngine } from '../../core/analysis/clustering-engine';
import { RelationshipEngine } from '../../core/analysis/relationship-engine';
import { AnalysisPipeline } from '../../core/analysis/pipeline';
import { OpenAILLMProvider } from '../../core/providers/openai/openai-llm-provider';
import { toGraphStoreContext, withRequestContext, type ContextualRouteHandler, type RequestContextOptions } from '../middleware/request-context';
import { withAuthGuard, type AuthGuardOptions } from '../middleware/auth';
import { withBodySizeLimit, type BodySizeLimitOptions } from '../middleware/body-size-limit';
import { withRateLimit, type RateLimitOptions } from '../middleware/rate-limit';

type RouteSecurityOptions = { bodySizeLimit?: BodySizeLimitOptions; rateLimit?: RateLimitOptions };

export const createAnalyzeRoutes = (
  config: NeuronConfig,
  injectedStore?: GraphStore,
  requestContextOptions?: RequestContextOptions,
  authOptions?: AuthGuardOptions,
  security?: RouteSecurityOptions
) => {
  const store = injectedStore ?? createGraphStore(config);
  const db = createDatabase(config);
  const events = new EventBus();
  const pipelinesByScope = new Map<string, AnalysisPipeline>();
  const resolvedRequestContextOptions: RequestContextOptions = {
    ...requestContextOptions,
    resolveScope:
      requestContextOptions?.resolveScope ??
      ((request) => {
        const url = new URL(request.url);
        return url.searchParams.get('scope');
      }),
  };

  const getPipeline = (context: ReturnType<typeof toGraphStoreContext>) => {
    const scope = context.scope ?? 'default';
    const existing = pipelinesByScope.get(scope);
    if (existing) return existing;

    const embeddings = new EmbeddingsService(
      {
        openaiApiKey: config.openai.apiKey,
        model: config.analysis.embeddingModel,
        batchSize: config.analysis.embeddingBatchSize,
        rateLimit: config.analysis.openaiRateLimit,
        cacheTTL: config.analysis.embeddingCacheTTL,
        maxRetries: config.openai.maxRetries ?? 3,
      },
      db,
      undefined,
      context
    );
    const clustering = new ClusteringEngine(db, embeddings, context);
    const relationships = new RelationshipEngine(
      db,
      {
        model: config.analysis.relationshipInferenceModel,
        minConfidence: config.analysis.relationshipMinConfidence,
        maxPerNode: config.analysis.relationshipMaxPerNode,
        similarityThreshold: config.analysis.clusterSimilarityThreshold,
        includeExisting: true,
        batchSize: 10,
        rateLimit: config.analysis.openaiRateLimit,
        governanceEnabled: config.analysis.relationshipGovernanceEnabled,
        autoApproveEnabled: config.analysis.relationshipAutoApproveEnabled,
        autoApproveMinConfidence: config.analysis.relationshipAutoApproveMinConfidence,
      },
      new OpenAILLMProvider({ apiKey: config.openai.apiKey, organization: config.openai.organization }),
      context
    );

    const pipeline = new AnalysisPipeline(db, embeddings, clustering, relationships, events, undefined, context);
    pipelinesByScope.set(scope, pipeline);
    return pipeline;
  };

  const wrap = (handler: ContextualRouteHandler) =>
    withBodySizeLimit(withRateLimit(withAuthGuard(handler, authOptions), security?.rateLimit), security?.bodySizeLimit);
  return {
    POST: withRequestContext(wrap(async (request, requestContext) => {
      const context = toGraphStoreContext(requestContext);
      if (store.kind !== 'postgres') {
        return Response.json({ error: 'Analyze endpoints currently require the Postgres backend.' }, { status: 400 });
      }
      const url = new URL(request.url);
      if (url.pathname.endsWith('/cancel')) {
        const jobId = url.pathname.split('/').slice(-2)[0];
        const pipeline = getPipeline(context);
        const cancelled = await pipeline.cancelJob(jobId);
        return Response.json({ cancelled });
      }

      const body = await request.json();
      const input = analysisRequestSchema.parse(body);
      const pipeline = getPipeline(context);

      const runType =
        input.action === 'embeddings'
          ? 'embedding'
          : input.action === 'cluster'
            ? 'clustering'
            : input.action === 'infer_relationships'
              ? 'relationship_inference'
              : 'full_analysis';

      const { job, completion } = await pipeline.startJob(runType, input.options ?? {});
      void completion.catch(() => undefined);

      return Response.json({ jobId: job.id, status: job.status });
    }), resolvedRequestContextOptions),
    GET: withRequestContext(wrap(async (request, requestContext) => {
      const context = toGraphStoreContext(requestContext);
      if (store.kind !== 'postgres') {
        return Response.json({ error: 'Analyze endpoints currently require the Postgres backend.' }, { status: 400 });
      }
      const url = new URL(request.url);
      if (url.pathname.endsWith('/stream')) {
        const segments = url.pathname.split('/');
        const jobId = segments.slice(-2)[0];
        if (!jobId) return new Response('Missing job id', { status: 400 });

        const row = await db.queryOne<{ status: string; progress_snapshot: unknown }>(
          'SELECT status, progress_snapshot FROM analysis_runs WHERE id = $1 AND scope = $2',
          [jobId, context.scope ?? 'default']
        );
        if (!row) return Response.json({ error: 'Job not found' }, { status: 404 });

        const encoder = new TextEncoder();
        const headers = new Headers({
          'content-type': 'text/event-stream; charset=utf-8',
          'cache-control': 'no-cache, no-transform',
          connection: 'keep-alive',
        });

        const stream = new ReadableStream<Uint8Array>({
          start(controller) {
            let id = 0;

            const write = (event: string, data: unknown) => {
              id += 1;
              const payload = typeof data === 'string' ? data : JSON.stringify(data);
              controller.enqueue(encoder.encode(`id: ${id}\nevent: ${event}\ndata: ${payload}\n\n`));
            };

            // Initial snapshot
            write('analysis.job.progress', row.progress_snapshot ?? { jobId });

            const terminalEvent =
              row.status === 'completed'
                ? 'analysis.job.completed'
                : row.status === 'failed'
                  ? 'analysis.job.failed'
                  : row.status === 'cancelled'
                    ? 'analysis.job.canceled'
                    : null;

            if (terminalEvent) {
              write(terminalEvent, row.progress_snapshot ?? { jobId });
              controller.close();
              return;
            }

            const heartbeat = setInterval(() => {
              controller.enqueue(encoder.encode(': ping\n\n'));
            }, 15_000);

            const sub = events.subscribeMany(
              ['analysis.job.progress', 'analysis.job.completed', 'analysis.job.failed', 'analysis.job.canceled'],
              (event) => {
                const payload = event.payload as { jobId?: string; scope?: string };
                if (payload.jobId !== jobId) return;
                if ((payload.scope ?? 'default') !== (context.scope ?? 'default')) return;

                write(event.type, event.payload);

                if (event.type === 'analysis.job.completed' || event.type === 'analysis.job.failed' || event.type === 'analysis.job.canceled') {
                  clearInterval(heartbeat);
                  sub.unsubscribe();
                  controller.close();
                }
              }
            );

            const cleanup = () => {
              clearInterval(heartbeat);
              sub.unsubscribe();
              controller.close();
            };

            request.signal.addEventListener('abort', cleanup);
          },
        });

        return new Response(stream, { headers });
      }
      if (url.pathname.endsWith('/history')) {
        const pipeline = getPipeline(context);
        const jobs = await pipeline.listJobs({ limit: 50 });
        return Response.json({ jobs });
      }
      const jobId = url.pathname.split('/').pop();
      if (!jobId) return new Response('Missing job id', { status: 400 });
      const pipeline = getPipeline(context);
      const job = await pipeline.getJob(jobId);
      if (!job) return Response.json({ error: 'Job not found' }, { status: 404 });
      const progress = await db.queryOne<{ progress_snapshot: unknown }>(
        'SELECT progress_snapshot FROM analysis_runs WHERE id = $1 AND scope = $2',
        [jobId, context.scope ?? 'default']
      );
      return Response.json({ job, progress: progress?.progress_snapshot ?? null });
    }), resolvedRequestContextOptions),
  };
};
