import type { Database } from '../../storage/database';
import type { AnalysisRun } from '../../core/types/analysis';
import type { GraphStoreContext } from '../../core/store/graph-store';
import { resolveScope } from '../../core/store/graph-store';
import { BaseRepository } from './base';

export class AnalysisRunRepository extends BaseRepository<AnalysisRun, AnalysisRun, Partial<AnalysisRun>> {
  constructor(db: Database) {
    super(db, 'analysis_runs');
  }

  async findActive(context?: GraphStoreContext): Promise<AnalysisRun[]> {
    const scope = resolveScope(context);
    return this.db.query<AnalysisRun>('SELECT * FROM analysis_runs WHERE status = $1 AND scope = $2', ['running', scope]);
  }

  async updateProgress(id: string, progress: number, context?: GraphStoreContext): Promise<void> {
    const scope = resolveScope(context);
    await this.db.execute('UPDATE analysis_runs SET progress = $1 WHERE id = $2 AND scope = $3', [progress, id, scope]);
  }

  async markCompleted(id: string, results: object, context?: GraphStoreContext): Promise<void> {
    const scope = resolveScope(context);
    await this.db.execute(
      'UPDATE analysis_runs SET status = $1, results = $2, completed_at = NOW() WHERE id = $3 AND scope = $4',
      ['completed', results, id, scope]
    );
  }

  async markFailed(id: string, error: string, context?: GraphStoreContext): Promise<void> {
    const scope = resolveScope(context);
    await this.db.execute(
      'UPDATE analysis_runs SET status = $1, error_message = $2, completed_at = NOW() WHERE id = $3 AND scope = $4',
      ['failed', error, id, scope]
    );
  }
}
