import type { Database } from '../../storage/database';
import type { GraphStoreContext } from '../../core/store/graph-store';
import { resolveScope } from '../../core/store/graph-store';

export class SourceItemNodeRepository {
  constructor(private db: Database) {}

  async addMapping(sourceItemId: string, nodeId: string, context?: GraphStoreContext): Promise<void> {
    const scope = resolveScope(context);
    await this.db.execute(
      `INSERT INTO source_item_nodes (scope, source_item_id, node_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (source_item_id, node_id) DO NOTHING`,
      [scope, sourceItemId, nodeId]
    );
  }

  async listNodeIds(sourceItemId: string, context?: GraphStoreContext): Promise<string[]> {
    const scope = resolveScope(context);
    const rows = await this.db.query<{ node_id: string }>(
      'SELECT node_id FROM source_item_nodes WHERE source_item_id = $1 AND scope = $2',
      [sourceItemId, scope]
    );
    return rows.map((r) => r.node_id);
  }
}
