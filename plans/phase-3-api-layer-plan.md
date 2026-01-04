# Phase 3: API Layer Plan

## Outcomes
- Build complete REST API for all neuron-web operations
- Implement repository pattern for clean data access
- Create flexible query builder for graph traversal
- Establish middleware stack for auth, validation, error handling
- Ensure consistent API response format across all endpoints

## Scope

### In Scope
- Repository classes for nodes, edges, clusters, settings
- Query builder for complex graph queries with filters
- Nodes API (CRUD, batch, search)
- Edges API (CRUD, bulk operations)
- Graph API (full graph, expand, path finding)
- Analysis API (trigger jobs, check status, cancel)
- Settings API (read, update, reset)
- Search API (semantic search, find similar)
- Middleware (validation, error handling, CORS)

### Out of Scope
- Authentication (handled by consuming app)
- Rate limiting (handled by consuming app)
- WebSocket/real-time updates (future enhancement)

## Assumptions & Constraints
- API routes exported as Next.js route handlers
- All endpoints prefixed with `/api/neuron`
- JSON request/response format
- Zod validation on all inputs

## Dependencies
- Phase 1: Types, Zod schemas, PostgreSQL client
- Phase 2: Analysis pipeline, scoring engine

## Execution Phases

### Phase 3.1 – Repository Pattern 🟥
- [ ] Create BaseRepository class with common CRUD
- [ ] Create NodeRepository with full CRUD + batch operations
- [ ] Create EdgeRepository with relationship queries
- [ ] Create ClusterRepository with membership management
- [ ] Create SettingsRepository with deep merge updates
- [ ] Create AnalysisRunRepository for job tracking
- [ ] Add transaction support across repositories

### Phase 3.2 – Query Builder 🟥
- [ ] Create GraphQueryBuilder class
- [ ] Implement node filtering (type, domain, cluster, status)
- [ ] Implement edge filtering (type, strength, confidence)
- [ ] Implement pagination with cursor-based approach
- [ ] Implement depth-limited graph expansion
- [ ] Implement path finding (shortest path, all paths)
- [ ] Add query optimization hints

### Phase 3.3 – Nodes API 🟥
- [ ] Implement GET /api/neuron/nodes (list with filters)
- [ ] Implement POST /api/neuron/nodes (create single or batch)
- [ ] Implement GET /api/neuron/nodes/:id (get with relations)
- [ ] Implement PATCH /api/neuron/nodes/:id (update)
- [ ] Implement DELETE /api/neuron/nodes/:id (delete with cascade)
- [ ] Add search parameter for full-text search
- [ ] Add embedding inclusion option

### Phase 3.4 – Edges API 🟥
- [ ] Implement GET /api/neuron/edges (list with filters)
- [ ] Implement POST /api/neuron/edges (create single or batch)
- [ ] Implement GET /api/neuron/edges/:id (get single)
- [ ] Implement PATCH /api/neuron/edges/:id (update)
- [ ] Implement DELETE /api/neuron/edges/:id (delete)
- [ ] Add bulk delete by node ID
- [ ] Add relationship type filtering

### Phase 3.5 – Graph API 🟥
- [ ] Implement GET /api/neuron/graph (full graph for visualization)
- [ ] Implement POST /api/neuron/graph/expand (expand from nodes)
- [ ] Implement POST /api/neuron/graph/path (find paths)
- [ ] Add node count limiting for performance
- [ ] Add cluster information in response
- [ ] Implement graph statistics endpoint

### Phase 3.6 – Analysis API 🟥
- [ ] Implement POST /api/neuron/analyze (trigger analysis)
- [ ] Implement GET /api/neuron/analyze/:jobId (check status)
- [ ] Implement POST /api/neuron/analyze/:jobId/cancel (cancel job)
- [ ] Implement GET /api/neuron/analyze/history (list past jobs)
- [ ] Add webhook notification on completion
- [ ] Add estimated duration calculation

### Phase 3.7 – Settings API 🟥
- [ ] Implement GET /api/neuron/settings (get current)
- [ ] Implement PATCH /api/neuron/settings (update with deep merge)
- [ ] Implement POST /api/neuron/settings/reset (reset sections)
- [ ] Implement GET /api/neuron/settings/schema (get JSON schema)
- [ ] Add settings validation before save
- [ ] Add settings change events

### Phase 3.8 – Search API 🟥
- [ ] Implement POST /api/neuron/search (semantic search)
- [ ] Implement POST /api/neuron/search/similar (find similar nodes)
- [ ] Add query embedding caching
- [ ] Add result explanation option
- [ ] Add domain/type filtering

### Phase 3.9 – API Middleware 🟥
- [ ] Create validation middleware (Zod integration)
- [ ] Create error handling middleware (consistent error format)
- [ ] Create logging middleware
- [ ] Create CORS middleware (optional enable)
- [ ] Create request timing middleware
- [ ] Export route handler factory functions

## Task Files

See `tasks/phase-3-api/` for individual task tracking:
- `task-3-1-repository-pattern.md`
- `task-3-2-query-builder.md`
- `task-3-3-nodes-api.md`
- `task-3-4-edges-api.md`
- `task-3-5-graph-api.md`
- `task-3-6-analysis-api.md`
- `task-3-7-settings-api.md`
- `task-3-8-search-api.md`
- `task-3-9-api-middleware.md`

## API Endpoint Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/neuron/nodes | List nodes with filters |
| POST | /api/neuron/nodes | Create node(s) |
| GET | /api/neuron/nodes/:id | Get node with relations |
| PATCH | /api/neuron/nodes/:id | Update node |
| DELETE | /api/neuron/nodes/:id | Delete node |
| GET | /api/neuron/edges | List edges with filters |
| POST | /api/neuron/edges | Create edge(s) |
| GET | /api/neuron/edges/:id | Get edge |
| PATCH | /api/neuron/edges/:id | Update edge |
| DELETE | /api/neuron/edges/:id | Delete edge |
| GET | /api/neuron/graph | Get full graph |
| POST | /api/neuron/graph/expand | Expand from nodes |
| POST | /api/neuron/graph/path | Find paths |
| POST | /api/neuron/analyze | Trigger analysis |
| GET | /api/neuron/analyze/:jobId | Get job status |
| POST | /api/neuron/analyze/:jobId/cancel | Cancel job |
| GET | /api/neuron/settings | Get settings |
| PATCH | /api/neuron/settings | Update settings |
| POST | /api/neuron/settings/reset | Reset settings |
| POST | /api/neuron/search | Semantic search |
| POST | /api/neuron/search/similar | Find similar |
| GET | /api/neuron/health | Health check |

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Large graph responses | Pagination, node limits, streaming |
| Slow path finding | Depth limits, caching, async option |
| Validation overhead | Schema caching, efficient validators |

## Open Questions
- GraphQL support in addition to REST?
- Batch operations transaction semantics?
- Pagination: offset vs cursor?

## Parallel / Unblock Options
- Repository pattern and middleware can be built first
- Node/Edge APIs can be developed in parallel
- Graph API depends on query builder
- Analysis API depends on Phase 2 pipeline

## Validation Criteria
- [ ] All endpoints return correct response format
- [ ] Validation rejects invalid inputs with clear errors
- [ ] Pagination works correctly
- [ ] Graph queries perform within acceptable time
- [ ] Analysis jobs track and report progress
- [ ] Settings persist and apply correctly

