import { Command } from 'commander';
import { Database } from '../../storage/database';
import { resolveCliConfig } from '../utils/config';
import { logger } from '../utils/logger';
import { EventBus } from '../../core/events/event-bus';
import { EmbeddingsService } from '../../core/analysis/embeddings-service';
import { ClusteringEngine } from '../../core/analysis/clustering-engine';
import { RelationshipEngine } from '../../core/analysis/relationship-engine';
import { AnalysisPipeline } from '../../core/analysis/pipeline';
import { OpenAILLMProvider } from '../../core/providers/openai/openai-llm-provider';

const buildConnectionString = (config: {
  databaseUrl?: string;
  databaseUser?: string;
  databasePassword?: string;
  databaseName?: string;
  port: number;
}) => {
  if (config.databaseUrl) return config.databaseUrl;
  const user = config.databaseUser ?? 'neuron';
  const password = config.databasePassword ?? 'neuron_dev';
  const database = config.databaseName ?? 'neuron_web';
  return `postgresql://${user}:${password}@localhost:${config.port}/${database}`;
};

async function buildPipeline(): Promise<AnalysisPipeline> {
  const config = await resolveCliConfig();
  const db = new Database({ connectionString: buildConnectionString(config) });
  const events = new EventBus();

  const embeddings = new EmbeddingsService(
    {
      openaiApiKey: process.env.OPENAI_API_KEY ?? '',
      model: 'text-embedding-3-small',
      batchSize: 20,
      rateLimit: 60,
      cacheTTL: 86400,
      maxRetries: 3,
    },
    db
  );

  const clustering = new ClusteringEngine(db, embeddings);
  const relationships = new RelationshipEngine(db, {
    model: 'gpt-4o-mini',
    minConfidence: 0.7,
    maxPerNode: 10,
    similarityThreshold: 0.75,
    includeExisting: false,
    batchSize: 10,
    rateLimit: 30,
  }, new OpenAILLMProvider({ apiKey: process.env.OPENAI_API_KEY ?? '' }));

  return new AnalysisPipeline(db, embeddings, clustering, relationships, events);
}

export const analyzeCommand = new Command('analyze')
  .description('Analysis commands')
  .addCommand(
    new Command('embeddings')
      .description('Generate embeddings')
      .option('--node-ids <ids>', 'Comma-separated node IDs')
      .option('--force', 'Regenerate existing')
      .action(async (options) => {
        const pipeline = await buildPipeline();
        const nodeIds = options.nodeIds ? options.nodeIds.split(',') : undefined;
        await pipeline.runEmbeddings({ nodeIds, forceRecompute: options.force });
        logger.success('Embeddings complete');
      })
  )
  .addCommand(
    new Command('cluster')
      .description('Run clustering')
      .option('--count <n>', 'Number of clusters')
      .option('--algorithm <alg>', 'kmeans, dbscan, hierarchical', 'kmeans')
      .action(async (options) => {
        const pipeline = await buildPipeline();
        await pipeline.runClustering({
          clusterCount: options.count ? Number(options.count) : undefined,
          clusteringAlgorithm: options.algorithm,
        });
        logger.success('Clustering complete');
      })
  )
  .addCommand(
    new Command('relationships')
      .description('Infer relationships')
      .option('--threshold <n>', 'Min confidence (0-1)', '0.7')
      .option('--dry-run', 'Show without saving')
      .action(async (options) => {
        const pipeline = await buildPipeline();
        await pipeline.runRelationships({
          relationshipThreshold: Number(options.threshold),
        });
        logger.success('Relationship inference complete');
      })
  )
  .addCommand(
    new Command('full')
      .description('Run full analysis pipeline')
      .option('--force', 'Force recompute all')
      .action(async (options) => {
        const pipeline = await buildPipeline();
        await pipeline.runFull({ forceRecompute: options.force });
        logger.success('Analysis pipeline complete');
      })
  );
