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

const buildPipeline = (config: NeuronConfig, context: ReturnType<typeof toGraphStoreContext>) => {
  const db = createDatabase(config);
  const events = new EventBus();
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
  const relationships = new RelationshipEngine(db, {
    model: config.analysis.relationshipInferenceModel,
    minConfidence: config.analysis.relationshipMinConfidence,
    maxPerNode: config.analysis.relationshipMaxPerNode,
    similarityThreshold: config.analysis.clusterSimilarityThreshold,
    includeExisting: true,
    batchSize: 10,
    rateLimit: config.analysis.openaiRateLimit,
  }, new OpenAILLMProvider({ apiKey: config.openai.apiKey, organization: config.openai.organization }), context);
  return new AnalysisPipeline(db, embeddings, clustering, relationships, events, undefined, context);
};

export const createAnalyzeRoutes = (
  config: NeuronConfig,
  injectedStore?: GraphStore,
  requestContextOptions?: RequestContextOptions,
  authOptions?: AuthGuardOptions,
  security?: RouteSecurityOptions
) => {
  const store = injectedStore ?? createGraphStore(config);
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
        const pipeline = buildPipeline(config, context);
        const cancelled = await pipeline.cancelJob(jobId);
        return Response.json({ cancelled });
      }

      const body = await request.json();
      const input = analysisRequestSchema.parse(body);
      const pipeline = buildPipeline(config, context);
      let job;
      if (input.action === 'embeddings') {
        job = await pipeline.runEmbeddings(input.options ?? {});
      } else if (input.action === 'cluster') {
        job = await pipeline.runClustering(input.options ?? {});
      } else if (input.action === 'infer_relationships') {
        job = await pipeline.runRelationships(input.options ?? {});
      } else {
        job = await pipeline.runFull(input.options ?? {});
      }
      return Response.json({ jobId: job.id, status: job.status });
    }), requestContextOptions),
    GET: withRequestContext(wrap(async (request, requestContext) => {
      const context = toGraphStoreContext(requestContext);
      if (store.kind !== 'postgres') {
        return Response.json({ error: 'Analyze endpoints currently require the Postgres backend.' }, { status: 400 });
      }
      const url = new URL(request.url);
      if (url.pathname.endsWith('/history')) {
        const pipeline = buildPipeline(config, context);
        const jobs = await pipeline.listJobs({ limit: 50 });
        return Response.json({ jobs });
      }
      const jobId = url.pathname.split('/').pop();
      if (!jobId) return new Response('Missing job id', { status: 400 });
      const pipeline = buildPipeline(config, context);
      const job = await pipeline.getJob(jobId);
      return Response.json({ job });
    }), requestContextOptions),
  };
};
