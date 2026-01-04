import type { Database } from '../../storage/database';
import type { AnalysisRun, AnalysisRunType } from '../types/analysis';
import type { ClusteringAlgorithm } from '../types/cluster';
import type { EventBus } from '../events/event-bus';
import type { EmbeddingsService } from './embeddings-service';
import type { ClusteringEngine } from './clustering-engine';
import type { RelationshipEngine } from './relationship-engine';

export interface PipelineOptions {
  nodeIds?: string[];
  forceRecompute?: boolean;
  skipEmbeddings?: boolean;
  embeddingModel?: string;
  skipClustering?: boolean;
  clusterCount?: number;
  clusteringAlgorithm?: ClusteringAlgorithm;
  skipRelationships?: boolean;
  relationshipThreshold?: number;
  maxRelationshipsPerNode?: number;
  onProgress?: (progress: PipelineProgress) => void;
  webhookUrl?: string;
}

export interface PipelineProgress {
  stage: 'embeddings' | 'clustering' | 'relationships' | 'complete';
  progress: number;
  currentItem: string;
  itemsProcessed: number;
  totalItems: number;
  estimatedTimeRemaining?: number;
}

export class AnalysisPipeline {
  private activeJobs = new Map<string, AbortController>();

  constructor(
    private db: Database,
    private embeddings: EmbeddingsService,
    private clustering: ClusteringEngine,
    private relationships: RelationshipEngine,
    private events: EventBus
  ) {}

  async runFull(options: PipelineOptions = {}): Promise<AnalysisRun> {
    const job = await this.createJob('full_analysis', options);
    try {
      if (!options.skipEmbeddings) {
        await this.runEmbeddingsStage(job, options);
      }
      if (!options.skipClustering) {
        await this.runClusteringStage(job, options);
      }
      if (!options.skipRelationships) {
        await this.runRelationshipsStage(job, options);
      }
      return await this.completeJob(job.id);
    } catch (error) {
      return await this.failJob(job.id, error);
    }
  }

  async runEmbeddings(options: PipelineOptions = {}): Promise<AnalysisRun> {
    const job = await this.createJob('embedding', options);
    try {
      await this.runEmbeddingsStage(job, options);
      return await this.completeJob(job.id);
    } catch (error) {
      return await this.failJob(job.id, error);
    }
  }

  async runClustering(options: PipelineOptions = {}): Promise<AnalysisRun> {
    const job = await this.createJob('clustering', options);
    try {
      await this.runClusteringStage(job, options);
      return await this.completeJob(job.id);
    } catch (error) {
      return await this.failJob(job.id, error);
    }
  }

  async runRelationships(options: PipelineOptions = {}): Promise<AnalysisRun> {
    const job = await this.createJob('relationship_inference', options);
    try {
      await this.runRelationshipsStage(job, options);
      return await this.completeJob(job.id);
    } catch (error) {
      return await this.failJob(job.id, error);
    }
  }

  async getJob(jobId: string): Promise<AnalysisRun | null> {
    const row = await this.db.queryOne<AnalysisRun>('SELECT * FROM analysis_runs WHERE id = $1', [jobId]);
    return row ?? null;
  }

  async listJobs(options?: { status?: string; limit?: number }): Promise<AnalysisRun[]> {
    const where = options?.status ? 'WHERE status = $1' : '';
    const limit = options?.limit ? `LIMIT ${options.limit}` : '';
    const rows = await this.db.query<AnalysisRun>(
      `SELECT * FROM analysis_runs ${where} ORDER BY created_at DESC ${limit}`,
      options?.status ? [options.status] : []
    );
    return rows;
  }

  async cancelJob(jobId: string): Promise<boolean> {
    const controller = this.activeJobs.get(jobId);
    if (!controller) return false;
    controller.abort();
    await this.db.execute('UPDATE analysis_runs SET status = $1 WHERE id = $2', [
      'cancelled',
      jobId,
    ]);
    return true;
  }

  getActiveJobs(): AnalysisRun[] {
    return [];
  }

  isRunning(): boolean {
    return this.activeJobs.size > 0;
  }

  private async runEmbeddingsStage(job: AnalysisRun, options: PipelineOptions): Promise<void> {
    const nodeIds = await this.resolveNodeIds(options.nodeIds, options.forceRecompute);
    const { results, errors } = await this.embeddings.embedNodes(nodeIds);
    await this.updateJobResults(job.id, {
      embeddingsGenerated: results.length,
      errors,
    });
    options.onProgress?.({
      stage: 'embeddings',
      progress: 100,
      currentItem: 'complete',
      itemsProcessed: results.length,
      totalItems: nodeIds.length,
    });
  }

  private async runClusteringStage(job: AnalysisRun, options: PipelineOptions): Promise<void> {
    const clusterCount = options.clusterCount;
    const algorithm = options.clusteringAlgorithm ?? 'kmeans';
    const result = await this.clustering.clusterNodes({
      algorithm,
      clusterCount,
      similarityThreshold: options.relationshipThreshold,
    });
    await this.updateJobResults(job.id, {
      clustersCreated: result.clusters.length,
    });
    options.onProgress?.({
      stage: 'clustering',
      progress: 100,
      currentItem: 'complete',
      itemsProcessed: result.clusters.length,
      totalItems: result.clusters.length,
    });
  }

  private async runRelationshipsStage(job: AnalysisRun, options: PipelineOptions): Promise<void> {
    const nodeIds = options.nodeIds ?? (await this.resolveNodeIds());
    const { inferred, errors } = await this.relationships.inferForNodes(nodeIds);
    await this.relationships.createEdgesFromInferences(inferred, true);
    await this.updateJobResults(job.id, {
      relationshipsInferred: inferred.length,
      errors,
    });
    options.onProgress?.({
      stage: 'relationships',
      progress: 100,
      currentItem: 'complete',
      itemsProcessed: inferred.length,
      totalItems: inferred.length,
    });
  }

  private async createJob(runType: AnalysisRunType, options: PipelineOptions): Promise<AnalysisRun> {
    const controller = new AbortController();
    const row = await this.db.queryOne<AnalysisRun>(
      `INSERT INTO analysis_runs (run_type, input_params, status, progress, started_at)
       VALUES ($1, $2, 'running', 0, NOW())
       RETURNING *`,
      [runType, options]
    );
    if (!row) throw new Error('Failed to create analysis job');
    this.activeJobs.set(row.id, controller);
    return row;
  }

  private async completeJob(jobId: string): Promise<AnalysisRun> {
    const row = await this.db.queryOne<AnalysisRun>(
      `UPDATE analysis_runs
       SET status = 'completed', progress = 100, completed_at = NOW(), duration_ms = EXTRACT(EPOCH FROM (NOW() - started_at)) * 1000
       WHERE id = $1
       RETURNING *`,
      [jobId]
    );
    this.activeJobs.delete(jobId);
    return row as AnalysisRun;
  }

  private async failJob(jobId: string, error: unknown): Promise<AnalysisRun> {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    const row = await this.db.queryOne<AnalysisRun>(
      `UPDATE analysis_runs
       SET status = 'failed', error_message = $2, error_stack = $3, completed_at = NOW(), duration_ms = EXTRACT(EPOCH FROM (NOW() - started_at)) * 1000
       WHERE id = $1
       RETURNING *`,
      [jobId, message, stack]
    );
    this.activeJobs.delete(jobId);
    return row as AnalysisRun;
  }

  private async updateJobResults(jobId: string, updates: Partial<AnalysisRun['results']>) {
    const row = await this.db.queryOne<{ results: AnalysisRun['results'] }>(
      'SELECT results FROM analysis_runs WHERE id = $1',
      [jobId]
    );
    const current = row?.results ?? {
      nodesProcessed: 0,
      embeddingsGenerated: 0,
      clustersCreated: 0,
      relationshipsInferred: 0,
      errors: [],
    };
    const next = { ...current, ...updates };
    await this.db.execute('UPDATE analysis_runs SET results = $1 WHERE id = $2', [next, jobId]);
  }

  private async resolveNodeIds(nodeIds?: string[], forceRecompute = false): Promise<string[]> {
    if (nodeIds?.length) return nodeIds;
    if (forceRecompute) {
      const rows = await this.db.query<{ id: string }>('SELECT id FROM nodes');
      return rows.map((row) => row.id);
    }
    const rows = await this.db.query<{ id: string }>('SELECT id FROM nodes WHERE embedding IS NULL');
    return rows.map((row) => row.id);
  }
}
