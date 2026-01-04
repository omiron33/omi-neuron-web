---
title: Query Builder - Graph Queries
status: not_started
priority: 1
labels:
  - 'Phase:3-API'
  - 'Type:Database'
assignees:
  - CodingAgent
depends_on:
  - task-3-1-repository-pattern
---

# Task 3.2: Query Builder

## Objective
Build a flexible query builder for complex graph traversal and filtering operations.

## Requirements

### 1. GraphQueryBuilder (`src/api/query-builder.ts`)

```typescript
class GraphQueryBuilder {
  constructor(db: Database);
  
  // Build full graph query
  buildGraphQuery(params: GetGraphParams): { sql: string; values: unknown[] };
  
  // Build expansion query
  buildExpansionQuery(params: ExpandGraphRequest): { sql: string; values: unknown[] };
  
  // Build path query
  buildPathQuery(params: FindPathRequest): { sql: string; values: unknown[] };
  
  // Execute queries
  async getGraph(params: GetGraphParams): Promise<GetGraphResponse>;
  async expandGraph(params: ExpandGraphRequest): Promise<ExpandGraphResponse>;
  async findPaths(params: FindPathRequest): Promise<FindPathResponse>;
}
```

### 2. Filtering
- [ ] Filter by node types
- [ ] Filter by domains
- [ ] Filter by cluster IDs
- [ ] Filter by specific node IDs
- [ ] Filter by edge strength
- [ ] Filter by relationship types

### 3. Pagination
- [ ] Cursor-based pagination
- [ ] Limit enforcement
- [ ] Truncation indicator

### 4. Graph Expansion
- [ ] Expand from seed nodes
- [ ] Control depth (hops)
- [ ] Direction control (in/out/both)
- [ ] Limit expanded nodes

### 5. Path Finding
- [ ] Shortest path (BFS)
- [ ] All paths (DFS with limit)
- [ ] Calculate path strength

### 6. Performance
- [ ] Use CTEs for complex queries
- [ ] Limit result sets
- [ ] Index hints where needed

## Deliverables
- [ ] `src/api/query-builder.ts`
- [ ] Graph query implementation
- [ ] Expansion query implementation
- [ ] Path finding algorithm
- [ ] Unit tests

## Acceptance Criteria
- Filters combine correctly
- Pagination works
- Expansion respects depth
- Paths found accurately
- Performance acceptable

## Example Queries

```sql
-- Full graph with filters
WITH filtered_nodes AS (
  SELECT * FROM nodes
  WHERE domain = ANY($1)
    AND node_type = ANY($2)
  LIMIT $3
),
filtered_edges AS (
  SELECT e.* FROM edges e
  JOIN filtered_nodes fn1 ON e.from_node_id = fn1.id
  JOIN filtered_nodes fn2 ON e.to_node_id = fn2.id
  WHERE e.strength >= $4
)
SELECT 
  json_build_object(
    'nodes', (SELECT json_agg(...) FROM filtered_nodes),
    'edges', (SELECT json_agg(...) FROM filtered_edges)
  );

-- Path finding with recursive CTE
WITH RECURSIVE paths AS (
  -- Base case
  SELECT 
    ARRAY[from_node_id, to_node_id] as path,
    ARRAY[id] as edge_ids,
    strength as total_strength,
    1 as depth
  FROM edges
  WHERE from_node_id = $1
  
  UNION ALL
  
  -- Recursive case
  SELECT 
    p.path || e.to_node_id,
    p.edge_ids || e.id,
    p.total_strength + e.strength,
    p.depth + 1
  FROM paths p
  JOIN edges e ON e.from_node_id = p.path[array_upper(p.path, 1)]
  WHERE NOT e.to_node_id = ANY(p.path)  -- Prevent cycles
    AND p.depth < $3
)
SELECT * FROM paths
WHERE path[array_upper(path, 1)] = $2
ORDER BY array_length(path, 1), total_strength DESC;
```

## Notes
- Use recursive CTEs for path finding
- Limit recursion depth to prevent runaway queries
- Consider materialized views for common queries
- Test with large graphs (1000+ nodes)

