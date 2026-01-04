import type { Database } from '../../storage/database';
import type { AnalysisRun } from '../../core/types/analysis';
import { BaseRepository } from './base';

export class AnalysisRunRepository extends BaseRepository<AnalysisRun, AnalysisRun, Partial<AnalysisRun>> {
  constructor(db: Database) {
    super(db, 'analysis_runs');
  }

  async findActive(): Promise<AnalysisRun[]> {
    return this.db.query<AnalysisRun>('SELECT * FROM analysis_runs WHERE status = $1', ['running']);
  }

  async updateProgress(id: string, progress: number): Promise<void> {
    await this.db.execute('UPDATE analysis_runs SET progress = $1 WHERE id = $2', [progress, id]);
  }

  async markCompleted(id: string, results: object): Promise<void> {
    await this.db.execute(
      'UPDATE analysis_runs SET status = $1, results = $2, completed_at = NOW() WHERE id = $3',
      ['completed', results, id]
    );
  }

  async markFailed(id: string, error: string): Promise<void> {
    await this.db.execute(
      'UPDATE analysis_runs SET status = $1, error_message = $2, completed_at = NOW() WHERE id = $3',
      ['failed', error, id]
    );
  }
}
