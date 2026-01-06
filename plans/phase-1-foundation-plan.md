# Phase 1: Foundation Plan

## Outcomes
- Establish core TypeScript infrastructure with complete type system
- Create Docker-based PostgreSQL setup with pgvector extension
- Build migration system for schema management
- Deliver CLI tools for project initialization and database management

## Scope

### In Scope
- TypeScript project setup with pnpm, ESLint, Prettier
- Complete type definitions for nodes, edges, clusters, settings, events
- Zod validation schemas for all types and API inputs
- DockerManager class for container lifecycle
- PostgreSQL client with connection pooling
- Database migrations with pgvector support
- CLI commands: init, db:up, db:down, db:migrate, db:status

### Out of Scope
- Analysis algorithms (Phase 2)
- API endpoints (Phase 3)
- Visualization components (Phase 4)

## Assumptions & Constraints
- Docker Desktop must be available for managed database mode
- PostgreSQL 16+ with pgvector extension
- Node.js 18+ for ESM support
- pnpm as package manager

## Dependencies
- None (this is the foundation phase)

## Execution Phases

### Phase 1.1 – Project Setup ✅
- [x] Create repo at ~/Code/omi-neuron-web with pnpm init
- [x] Configure TypeScript with strict mode
- [x] Set up ESLint with TypeScript plugin
- [x] Configure Prettier
- [x] Set up tsup for building
- [x] Configure package.json with exports and peer deps

### Phase 1.2 – Type System ✅
- [x] Define NeuronNode types (base, full, create, update, visual)
- [x] Define NeuronEdge types (edge, create, update, visual, inferred)
- [x] Define NeuronCluster types (cluster, membership, config)
- [x] Define Analysis types (run, request, response, results)
- [x] Define Settings types (visualization, analysis, config)
- [x] Define Event types (all event types and payloads)
- [x] Define API types (request/response for all endpoints)
- [x] Create index.ts with all exports

### Phase 1.3 – Zod Schemas ✅
- [x] Create node schemas (create, update, batch)
- [x] Create edge schemas (create, update)
- [x] Create cluster schemas
- [x] Create analysis schemas (request, options)
- [x] Create settings schemas (visualization, analysis, full config)
- [x] Create API request/response schemas
- [x] Create config file schema (neuron.config.ts)

### Phase 1.4 – Docker Manager ✅
- [x] Create DockerManager class
- [x] Implement container start with port configuration
- [x] Implement container stop with volume cleanup option
- [x] Implement health check with database readiness
- [x] Implement port conflict detection
- [x] Implement connection string generation
- [x] Create docker-compose.template.yml with pgvector

### Phase 1.5 – PostgreSQL Client ✅
- [x] Create database client with pg library
- [x] Implement connection pooling
- [x] Implement query builder helpers
- [x] Implement transaction support
- [x] Create connection factory with config support

### Phase 1.6 – Migration System ✅
- [x] Create migration runner
- [x] Implement up/down/status commands
- [x] Create 001_initial_schema migration (nodes, edges, settings)
- [x] Create 002_embeddings migration (pgvector, indexes)
- [x] Create 003_clusters migration (clusters, memberships)
- [x] Create 004_analysis_runs migration (job tracking)

### Phase 1.7 – CLI Tools ✅
- [x] Set up Commander.js CLI structure
- [x] Implement `init` command (scaffold files, docker-compose, config)
- [x] Implement `db:up` command (start container, run migrations)
- [x] Implement `db:down` command (stop container)
- [x] Implement `db:migrate` command (run pending migrations)
- [x] Implement `db:status` command (show stats, migration status)
- [x] Implement `db:reset` command (destructive reset)
- [x] Implement `validate` command (check config, connections)

## Task Files

See `tasks/phase-1-foundation/` for individual task tracking:
- `task-1-1-project-setup.md`
- `task-1-2-type-system.md`
- `task-1-3-zod-schemas.md`
- `task-1-4-docker-manager.md`
- `task-1-5-postgres-client.md`
- `task-1-6-migration-system.md`
- `task-1-7-cli-tools.md`

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Docker not installed | External database mode fallback |
| Port conflicts | Auto-detect and suggest alternatives |
| Migration failures | Rollback support, dry-run mode |

## Open Questions
- None (resolved for initial release).

## Task Backlog
- None. All Phase 1 tasks completed.

## Parallel / Unblock Options
- Type system can be developed independently
- Docker manager and CLI can be developed in parallel
- Migrations depend on PostgreSQL client

## Validation Criteria
- [x] `pnpm build` succeeds with no errors
- [x] All types compile and export correctly
- [x] `npx omi-neuron init` scaffolds project correctly
- [x] `npx omi-neuron db:up` starts PostgreSQL container
- [x] Migrations run without errors
- [x] Health check returns healthy status

