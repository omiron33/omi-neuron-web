import type { NeuronConfig } from '../../core/types/settings';
import { analysisRequestSchema } from '../../core/schemas/analysis';
import { createDatabase } from '../../storage/factory';
import { EventBus } from '../../core/events/event-bus';
import { EmbeddingsService } from '../../core/analysis/embeddings-service';
import { ClusteringEngine } from '../../core/analysis/clustering-engine';
import { RelationshipEngine } from '../../core/analysis/relationship-engine';
import { AnalysisPipeline } from '../../core/analysis/pipeline';

const buildPipeline = (config: NeuronConfig) => {
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
    db
  );
  const clustering = new ClusteringEngine(db, embeddings);
  const relationships = new RelationshipEngine(db, {
    model: config.analysis.relationshipInferenceModel,
    minConfidence: config.analysis.relationshipMinConfidence,
    maxPerNode: config.analysis.relationshipMaxPerNode,
    similarityThreshold: config.analysis.clusterSimilarityThreshold,
    includeExisting: true,
    batchSize: 10,
    rateLimit: config.analysis.openaiRateLimit,
  });
  return new AnalysisPipeline(db, embeddings, clustering, relationships, events);
};

export const createAnalyzeRoutes = (config: NeuronConfig) => {
  return {
    async POST(request: Request) {
      const url = new URL(request.url);
      if (url.pathname.endsWith('/cancel')) {
        const jobId = url.pathname.split('/').slice(-2)[0];
        const pipeline = buildPipeline(config);
        const cancelled = await pipeline.cancelJob(jobId);
        return Response.json({ cancelled });
      }

      const body = await request.json();
      const input = analysisRequestSchema.parse(body);
      const pipeline = buildPipeline(config);
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
    },
    async GET(request: Request) {
      const url = new URL(request.url);
      if (url.pathname.endsWith('/history')) {
        const pipeline = buildPipeline(config);
        const jobs = await pipeline.listJobs({ limit: 50 });
        return Response.json({ jobs });
      }
      const jobId = url.pathname.split('/').pop();
      if (!jobId) return new Response('Missing job id', { status: 400 });
      const pipeline = buildPipeline(config);
      const job = await pipeline.getJob(jobId);
      return Response.json({ job });
    },
  };
};
