import type { Database } from '../storage/database';
import type {
  ExpandGraphRequest,
  ExpandGraphResponse,
  FindPathRequest,
  FindPathResponse,
  GetGraphParams,
  GetGraphResponse,
} from '../core/types/api';
import type { NeuronVisualEdge, NeuronVisualNode } from '../core/types';
import type { GraphStoreContext } from '../core/store/graph-store';
import { resolveScope } from '../core/store/graph-store';

const mapVisualNode = (row: Record<string, unknown>): NeuronVisualNode => ({
  id: row.id as string,
  slug: row.slug as string,
  label: row.label as string,
  domain: row.domain as string,
  tier: (row.tier as NeuronVisualNode['tier']) ?? undefined,
  metadata: (row.metadata as Record<string, unknown>) ?? {},
  ref: (row.ref as string | null) ?? null,
  connectionCount: Number(row.connection_count ?? 0),
  position: (row.position_override as [number, number, number] | null) ?? undefined,
});

const mapVisualEdge = (row: Record<string, unknown>): NeuronVisualEdge => ({
  id: row.id as string,
  from: row.from_slug as string,
  to: row.to_slug as string,
  relationshipType: row.relationship_type as string,
  strength: Number(row.strength ?? 0.5),
  label: (row.label as string | null) ?? null,
});

export class GraphQueryBuilder {
  constructor(private db: Database) {}

  buildGraphQuery(params: GetGraphParams, context?: GraphStoreContext): { sql: string; values: unknown[] } {
    const scope = resolveScope(context);
    const values: unknown[] = [];
    const filters: string[] = [];

    values.push(scope);
    filters.push(`scope = $${values.length}`);

    if (params.domains?.length) {
      values.push(params.domains);
      filters.push(`domain = ANY($${values.length})`);
    }
    if (params.nodeTypes?.length) {
      values.push(params.nodeTypes);
      filters.push(`node_type = ANY($${values.length})`);
    }
    if (params.clusterIds?.length) {
      values.push(params.clusterIds);
      filters.push(`cluster_id = ANY($${values.length})`);
    }
    if (params.nodeIds?.length) {
      values.push(params.nodeIds);
      filters.push(`id = ANY($${values.length})`);
    }

    const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
    const limit = params.maxNodes ? `LIMIT ${params.maxNodes}` : '';

    const sql = `
      WITH filtered_nodes AS (
        SELECT * FROM nodes
        ${where}
        ${limit}
      )
      SELECT * FROM filtered_nodes;
    `;

    return { sql, values };
  }

  buildExpansionQuery(params: ExpandGraphRequest, context?: GraphStoreContext): { sql: string; values: unknown[] } {
    const scope = resolveScope(context);
    const values: unknown[] = [params.fromNodeIds, params.depth ?? 1, scope];

    const joinEdge =
      params.direction === 'outbound'
        ? 'ed.from_node_id = e.id'
        : params.direction === 'inbound'
          ? 'ed.to_node_id = e.id'
          : 'ed.from_node_id = e.id OR ed.to_node_id = e.id';

    const joinNode =
      params.direction === 'outbound'
        ? 'n.id = ed.to_node_id'
        : params.direction === 'inbound'
          ? 'n.id = ed.from_node_id'
          : 'n.id = CASE WHEN ed.from_node_id = e.id THEN ed.to_node_id ELSE ed.from_node_id END';

    const sql = `
      WITH RECURSIVE expanded AS (
        SELECT id, slug, label, domain, tier, metadata, position_override, connection_count, 0 as depth
        FROM nodes
        WHERE id = ANY($1) AND scope = $3

        UNION ALL

        SELECT n.id, n.slug, n.label, n.domain, n.tier, n.metadata, n.position_override, n.connection_count, e.depth + 1
        FROM expanded e
        JOIN edges ed ON (${joinEdge}) AND ed.scope = $3
        JOIN nodes n ON (${joinNode}) AND n.scope = $3
        WHERE e.depth < $2
      )
      SELECT DISTINCT * FROM expanded;
    `;

    return { sql, values };
  }

  buildPathQuery(params: FindPathRequest, context?: GraphStoreContext): { sql: string; values: unknown[] } {
    const scope = resolveScope(context);
    const values: unknown[] = [params.fromNodeId, params.toNodeId, params.maxDepth ?? 5, scope];
    const sql = `
      WITH RECURSIVE paths AS (
        SELECT ARRAY[from_node_id, to_node_id] as path,
               ARRAY[id] as edge_ids,
               strength as total_strength,
               1 as depth
        FROM edges
        WHERE from_node_id = $1 AND scope = $4

        UNION ALL

        SELECT p.path || e.to_node_id,
               p.edge_ids || e.id,
               p.total_strength + e.strength,
               p.depth + 1
        FROM paths p
        JOIN edges e ON e.from_node_id = p.path[array_upper(p.path, 1)] AND e.scope = $4
        WHERE NOT e.to_node_id = ANY(p.path)
          AND p.depth < $3
      )
      SELECT * FROM paths
      WHERE path[array_upper(path, 1)] = $2
      ORDER BY array_length(path, 1), total_strength DESC;
    `;

    return { sql, values };
  }

  async getGraph(params: GetGraphParams, context?: GraphStoreContext): Promise<GetGraphResponse> {
    const scope = resolveScope(context);
    const { sql, values } = this.buildGraphQuery(params, context);
    const nodes = await this.db.query<Record<string, unknown>>(sql, values);
    const nodeIds = nodes.map((node) => node.id as string);

    const edges = await this.db.query<Record<string, unknown>>(
      `SELECT e.*, n1.slug as from_slug, n2.slug as to_slug
       FROM edges e
       JOIN nodes n1 ON e.from_node_id = n1.id AND n1.scope = $2
       JOIN nodes n2 ON e.to_node_id = n2.id AND n2.scope = $2
       WHERE e.scope = $2 AND e.from_node_id = ANY($1) AND e.to_node_id = ANY($1)`,
      [nodeIds, scope]
    );

    return {
      nodes: nodes.map(mapVisualNode),
      edges: edges.map(mapVisualEdge),
      clusters: [],
      meta: {
        totalNodes: nodes.length,
        totalEdges: edges.length,
        truncated: Boolean(params.maxNodes && nodes.length >= params.maxNodes),
        queryTime: 0,
      },
    };
  }

  async expandGraph(params: ExpandGraphRequest, context?: GraphStoreContext): Promise<ExpandGraphResponse> {
    const scope = resolveScope(context);
    const { sql, values } = this.buildExpansionQuery(params, context);
    const nodes = await this.db.query<Record<string, unknown>>(sql, values);
    const nodeIds = nodes.map((node) => node.id as string);

    const edges = await this.db.query<Record<string, unknown>>(
      `SELECT e.*, n1.slug as from_slug, n2.slug as to_slug
       FROM edges e
       JOIN nodes n1 ON e.from_node_id = n1.id AND n1.scope = $2
       JOIN nodes n2 ON e.to_node_id = n2.id AND n2.scope = $2
       WHERE e.scope = $2 AND e.from_node_id = ANY($1) AND e.to_node_id = ANY($1)`,
      [nodeIds, scope]
    );

    return {
      nodes: nodes.map(mapVisualNode),
      edges: edges.map(mapVisualEdge),
    };
  }

  async findPaths(params: FindPathRequest, context?: GraphStoreContext): Promise<FindPathResponse> {
    const { sql, values } = this.buildPathQuery(params, context);
    const rows = await this.db.query<{ path: string[]; edge_ids: string[]; total_strength: number }>(
      sql,
      values
    );

    return {
      paths: rows.map((row) => ({
        nodes: row.path,
        edges: row.edge_ids,
        length: row.path.length,
        totalStrength: row.total_strength,
      })),
    };
  }
}
