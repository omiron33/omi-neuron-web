import type { Database } from '../../storage/database';
import type { AnalysisRun, AnalysisJobStatus, AnalysisRunType } from '../types/analysis';
import type { ClusteringAlgorithm } from '../types/cluster';
import type { EventBus } from '../events/event-bus';
import { createEvent } from '../events/event-bus';
import type { EmbeddingsService } from './embeddings-service';
import type { ClusteringEngine } from './clustering-engine';
import type { RelationshipEngine } from './relationship-engine';
import { createDefaultAnalysisSteps } from './steps/default-steps';
import type { AnalysisStep } from './steps/analysis-step';
import type { GraphStoreContext } from '../store/graph-store';
import { resolveScope } from '../store/graph-store';

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
  /**
   * Optional derived overall progress (0–100) across all stages for the current run type.
   * This is computed by the pipeline when emitting/persisting progress snapshots.
   */
  overallProgress?: number;
  estimatedTimeRemaining?: number;
}

type AnalysisRunRow = {
  id: string;
  run_type: AnalysisRunType;
  input_params: unknown;
  results: unknown;
  status: AnalysisJobStatus;
  progress: number;
  started_at?: Date | null;
  completed_at?: Date | null;
  duration_ms?: number | null;
  error_message?: string | null;
  error_stack?: string | null;
};

const defaultResults = (): AnalysisRun['results'] => ({
  nodesProcessed: 0,
  embeddingsGenerated: 0,
  clustersCreated: 0,
  relationshipsInferred: 0,
  errors: [],
});

const isAbortError = (error: unknown): boolean => {
  if (!(error instanceof Error)) return false;
  return error.name === 'AbortError' || error.message === 'AbortError';
};

export class AnalysisPipeline {
  private activeJobs = new Map<string, AbortController>();
  private steps: AnalysisStep[];
  private scope: string;

  constructor(
    private db: Database,
    private embeddings: EmbeddingsService,
    private clustering: ClusteringEngine,
    private relationships: RelationshipEngine,
    private events: EventBus,
    steps?: AnalysisStep[],
    context?: GraphStoreContext
  ) {
    this.steps = steps ?? createDefaultAnalysisSteps();
    this.scope = resolveScope(context);
  }

  async startJob(runType: AnalysisRunType, options: PipelineOptions = {}): Promise<{
    job: AnalysisRun;
    completion: Promise<AnalysisRun>;
  }> {
    const job = await this.createJob(runType, options);
    const controls = this.controlsForRunType(runType);

    const completion = (async () => {
      try {
        await this.runSteps(job, options, controls);
        return await this.completeJob(job.id);
      } catch (error) {
        if (isAbortError(error)) {
          return await this.cancelledJob(job.id);
        }
        return await this.failJob(job.id, error);
      }
    })();

    return { job, completion };
  }

  async runFull(options: PipelineOptions = {}): Promise<AnalysisRun> {
    const { completion } = await this.startJob('full_analysis', options);
    return await completion;
  }

  async runEmbeddings(options: PipelineOptions = {}): Promise<AnalysisRun> {
    const { completion } = await this.startJob('embedding', options);
    return await completion;
  }

  async runClustering(options: PipelineOptions = {}): Promise<AnalysisRun> {
    const { completion } = await this.startJob('clustering', options);
    return await completion;
  }

  async runRelationships(options: PipelineOptions = {}): Promise<AnalysisRun> {
    const { completion } = await this.startJob('relationship_inference', options);
    return await completion;
  }

  async getJob(jobId: string): Promise<AnalysisRun | null> {
    const row = await this.db.queryOne<AnalysisRunRow>('SELECT * FROM analysis_runs WHERE id = $1 AND scope = $2', [
      jobId,
      this.scope,
    ]);
    return row ? this.toAnalysisRun(row) : null;
  }

  async listJobs(options?: { status?: string; limit?: number }): Promise<AnalysisRun[]> {
    const where = options?.status ? 'WHERE scope = $1 AND status = $2' : 'WHERE scope = $1';
    const limit = options?.limit ? `LIMIT ${options.limit}` : '';
    const rows = await this.db.query<AnalysisRunRow>(
      `SELECT * FROM analysis_runs ${where} ORDER BY created_at DESC ${limit}`,
      options?.status ? [this.scope, options.status] : [this.scope]
    );
    return rows.map((row) => this.toAnalysisRun(row));
  }

  async cancelJob(jobId: string): Promise<boolean> {
    const controller = this.activeJobs.get(jobId);
    if (!controller) return false;
    controller.abort();
    await this.db.execute(
      `UPDATE analysis_runs
       SET status = $1, completed_at = NOW(), duration_ms = EXTRACT(EPOCH FROM (NOW() - started_at)) * 1000, updated_at = NOW()
       WHERE id = $2 AND scope = $3`,
      ['cancelled', jobId, this.scope]
    );
    this.events.emit(createEvent('analysis.job.canceled', { jobId, scope: this.scope }, 'analysis'));
    return true;
  }

  getActiveJobs(): AnalysisRun[] {
    return [];
  }

  isRunning(): boolean {
    return this.activeJobs.size > 0;
  }

  private async runSteps(
    job: AnalysisRun,
    options: PipelineOptions,
    controls?: { only?: Array<AnalysisStep['id']>; respectEnabled?: boolean }
  ): Promise<void> {
    const controller = this.activeJobs.get(job.id);
    const stepContext = {
      db: this.db,
      embeddings: this.embeddings,
      clustering: this.clustering,
      relationships: this.relationships,
      events: this.events,
      signal: controller?.signal,
      updateJobResults: this.updateJobResults.bind(this),
      resolveNodeIds: this.resolveNodeIds.bind(this),
      reportProgress: (progress: PipelineProgress) => {
        const overallProgress = this.computeOverallProgress(job.runType, progress);
        const enriched: PipelineProgress = { ...progress, overallProgress };
        options.onProgress?.(enriched);
        void this.persistProgressSnapshot(job.id, job.runType, enriched).catch(() => undefined);
        this.events.emit(createEvent('analysis.job.progress', { jobId: job.id, scope: this.scope, ...enriched }, 'analysis'));
      },
    };

    const selected = controls?.only?.length
      ? this.steps.filter((step) => controls.only?.includes(step.id))
      : this.steps;

    const respectEnabled = controls?.respectEnabled ?? true;
    for (const step of selected) {
      if (respectEnabled && step.isEnabled && !step.isEnabled(options)) continue;
      await step.run(job, options, stepContext);
    }
  }

  private async createJob(runType: AnalysisRunType, options: PipelineOptions): Promise<AnalysisRun> {
    const controller = new AbortController();
    const stage = this.initialStageForRunType(runType);
    const initialProgress: PipelineProgress = {
      stage,
      progress: 0,
      overallProgress: 0,
      currentItem: 'starting',
      itemsProcessed: 0,
      totalItems: 0,
    };

    const row = await this.db.queryOne<AnalysisRunRow>(
      `INSERT INTO analysis_runs (scope, run_type, input_params, status, progress, started_at)
       VALUES ($1, $2, $3, 'running', 0, NOW())
       RETURNING *`,
      [this.scope, runType, options]
    );
    if (!row) throw new Error('Failed to create analysis job');
    this.activeJobs.set(row.id, controller);
    void this.persistProgressSnapshot(row.id, runType, initialProgress).catch(() => undefined);
    this.events.emit(createEvent('analysis.job.started', { jobId: row.id, runType, scope: this.scope }, 'analysis'));
    return this.toAnalysisRun(row);
  }

  private async completeJob(jobId: string): Promise<AnalysisRun> {
    const scope = this.scope;
    const row = await this.db.queryOne<AnalysisRunRow>(
      `UPDATE analysis_runs
       SET status = 'completed', progress = 100, completed_at = NOW(), duration_ms = EXTRACT(EPOCH FROM (NOW() - started_at)) * 1000, updated_at = NOW()
       WHERE id = $1 AND scope = $2
       RETURNING *`,
      [jobId, scope]
    );
    this.activeJobs.delete(jobId);
    if (row) {
      const snapshot: PipelineProgress = {
        stage: 'complete',
        progress: 100,
        overallProgress: 100,
        currentItem: 'complete',
        itemsProcessed: 0,
        totalItems: 0,
      };
      void this.persistProgressSnapshot(jobId, row.run_type, snapshot).catch(() => undefined);
      this.events.emit(createEvent('analysis.job.completed', { jobId, scope: this.scope }, 'analysis'));
    }
    return this.toAnalysisRun(row as AnalysisRunRow);
  }

  private async failJob(jobId: string, error: unknown): Promise<AnalysisRun> {
    const scope = this.scope;
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    const row = await this.db.queryOne<AnalysisRunRow>(
      `UPDATE analysis_runs
       SET status = 'failed', error_message = $2, error_stack = $3, completed_at = NOW(), duration_ms = EXTRACT(EPOCH FROM (NOW() - started_at)) * 1000, updated_at = NOW()
       WHERE id = $1 AND scope = $4
       RETURNING *`,
      [jobId, message, stack, scope]
    );
    this.activeJobs.delete(jobId);
    if (row) {
      const snapshot: PipelineProgress = {
        stage: 'complete',
        progress: 0,
        overallProgress: row.progress,
        currentItem: 'failed',
        itemsProcessed: 0,
        totalItems: 0,
      };
      void this.persistProgressSnapshot(jobId, row.run_type, snapshot).catch(() => undefined);
      this.events.emit(createEvent('analysis.job.failed', { jobId, scope: this.scope, error: message }, 'analysis'));
    }
    return this.toAnalysisRun(row as AnalysisRunRow);
  }

  private async cancelledJob(jobId: string): Promise<AnalysisRun> {
    const scope = this.scope;
    const row = await this.db.queryOne<AnalysisRunRow>(
      `UPDATE analysis_runs
       SET status = 'cancelled', completed_at = NOW(), duration_ms = EXTRACT(EPOCH FROM (NOW() - started_at)) * 1000, updated_at = NOW()
       WHERE id = $1 AND scope = $2
       RETURNING *`,
      [jobId, scope]
    );
    this.activeJobs.delete(jobId);
    if (row) {
      const snapshot: PipelineProgress = {
        stage: 'complete',
        progress: 0,
        overallProgress: row.progress,
        currentItem: 'cancelled',
        itemsProcessed: 0,
        totalItems: 0,
      };
      void this.persistProgressSnapshot(jobId, row.run_type, snapshot).catch(() => undefined);
      this.events.emit(createEvent('analysis.job.canceled', { jobId, scope: this.scope }, 'analysis'));
    }
    return this.toAnalysisRun(row as AnalysisRunRow);
  }

  private async updateJobResults(jobId: string, updates: Partial<AnalysisRun['results']>) {
    const row = await this.db.queryOne<{ results: AnalysisRun['results'] }>(
      'SELECT results FROM analysis_runs WHERE id = $1 AND scope = $2',
      [jobId, this.scope]
    );
    const current = row?.results ?? defaultResults();
    const next = { ...current, ...updates };
    await this.db.execute('UPDATE analysis_runs SET results = $1, updated_at = NOW() WHERE id = $2 AND scope = $3', [
      next,
      jobId,
      this.scope,
    ]);
  }

  private async resolveNodeIds(nodeIds?: string[], forceRecompute = false): Promise<string[]> {
    if (nodeIds?.length) return nodeIds;
    if (forceRecompute) {
      const rows = await this.db.query<{ id: string }>('SELECT id FROM nodes WHERE scope = $1', [this.scope]);
      return rows.map((row) => row.id);
    }
    const rows = await this.db.query<{ id: string }>('SELECT id FROM nodes WHERE embedding IS NULL AND scope = $1', [this.scope]);
    return rows.map((row) => row.id);
  }

  private toAnalysisRun(row: AnalysisRunRow): AnalysisRun {
    return {
      id: row.id,
      runType: row.run_type,
      inputParams: (row.input_params ?? {}) as AnalysisRun['inputParams'],
      results: (row.results ?? defaultResults()) as AnalysisRun['results'],
      status: row.status,
      progress: row.progress ?? 0,
      startedAt: row.started_at ?? null,
      completedAt: row.completed_at ?? null,
      durationMs: row.duration_ms ?? null,
      errorMessage: row.error_message ?? null,
      errorStack: row.error_stack ?? null,
    };
  }

  private initialStageForRunType(runType: AnalysisRunType): PipelineProgress['stage'] {
    if (runType === 'clustering') return 'clustering';
    if (runType === 'relationship_inference') return 'relationships';
    return 'embeddings';
  }

  private stagesForRunType(runType: AnalysisRunType): Array<Exclude<PipelineProgress['stage'], 'complete'>> {
    if (runType === 'embedding') return ['embeddings'];
    if (runType === 'clustering') return ['clustering'];
    if (runType === 'relationship_inference') return ['relationships'];
    return ['embeddings', 'clustering', 'relationships'];
  }

  private computeOverallProgress(runType: AnalysisRunType, progress: PipelineProgress): number {
    if (progress.stage === 'complete') return 100;
    const stages = this.stagesForRunType(runType);
    const index = stages.indexOf(progress.stage);
    if (index === -1) return Math.min(100, Math.max(0, progress.progress));
    const span = 100 / stages.length;
    const start = index * span;
    return Math.min(100, Math.max(0, start + (Math.min(100, Math.max(0, progress.progress)) / 100) * span));
  }

  private async persistProgressSnapshot(jobId: string, runType: AnalysisRunType, progress: PipelineProgress): Promise<void> {
    const overallProgress = progress.overallProgress ?? this.computeOverallProgress(runType, progress);
    const snapshot = {
      jobId,
      scope: this.scope,
      runType,
      stage: progress.stage,
      progress: progress.progress,
      overallProgress,
      currentItem: progress.currentItem,
      itemsProcessed: progress.itemsProcessed,
      totalItems: progress.totalItems,
      estimatedTimeRemaining: progress.estimatedTimeRemaining,
    };
    await this.db.execute(
      'UPDATE analysis_runs SET progress = $1, progress_snapshot = $2, updated_at = NOW() WHERE id = $3 AND scope = $4',
      [Math.round(overallProgress), JSON.stringify(snapshot), jobId, this.scope]
    );
  }

  private controlsForRunType(runType: AnalysisRunType): { only?: Array<AnalysisStep['id']>; respectEnabled?: boolean } {
    if (runType === 'full_analysis') return { respectEnabled: true };
    if (runType === 'embedding') return { only: ['embeddings'], respectEnabled: false };
    if (runType === 'clustering') return { only: ['clustering'], respectEnabled: false };
    if (runType === 'relationship_inference') return { only: ['relationships'], respectEnabled: false };
    return { respectEnabled: true };
  }
}
