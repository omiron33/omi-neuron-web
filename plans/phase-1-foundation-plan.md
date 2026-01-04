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

### Phase 1.1 – Project Setup 🟥
- [ ] Create repo at ~/Code/omi-neuron-web with pnpm init
- [ ] Configure TypeScript with strict mode
- [ ] Set up ESLint with TypeScript plugin
- [ ] Configure Prettier
- [ ] Set up tsup for building
- [ ] Configure package.json with exports and peer deps

### Phase 1.2 – Type System 🟥
- [ ] Define NeuronNode types (base, full, create, update, visual)
- [ ] Define NeuronEdge types (edge, create, update, visual, inferred)
- [ ] Define NeuronCluster types (cluster, membership, config)
- [ ] Define Analysis types (run, request, response, results)
- [ ] Define Settings types (visualization, analysis, config)
- [ ] Define Event types (all event types and payloads)
- [ ] Define API types (request/response for all endpoints)
- [ ] Create index.ts with all exports

### Phase 1.3 – Zod Schemas 🟥
- [ ] Create node schemas (create, update, batch)
- [ ] Create edge schemas (create, update)
- [ ] Create cluster schemas
- [ ] Create analysis schemas (request, options)
- [ ] Create settings schemas (visualization, analysis, full config)
- [ ] Create API request/response schemas
- [ ] Create config file schema (neuron.config.ts)

### Phase 1.4 – Docker Manager 🟥
- [ ] Create DockerManager class
- [ ] Implement container start with port configuration
- [ ] Implement container stop with volume cleanup option
- [ ] Implement health check with database readiness
- [ ] Implement port conflict detection
- [ ] Implement connection string generation
- [ ] Create docker-compose.template.yml with pgvector

### Phase 1.5 – PostgreSQL Client 🟥
- [ ] Create database client with pg library
- [ ] Implement connection pooling
- [ ] Implement query builder helpers
- [ ] Implement transaction support
- [ ] Create connection factory with config support

### Phase 1.6 – Migration System 🟥
- [ ] Create migration runner
- [ ] Implement up/down/status commands
- [ ] Create 001_initial_schema migration (nodes, edges, settings)
- [ ] Create 002_embeddings migration (pgvector, indexes)
- [ ] Create 003_clusters migration (clusters, memberships)
- [ ] Create 004_analysis_runs migration (job tracking)

### Phase 1.7 – CLI Tools 🟥
- [ ] Set up Commander.js CLI structure
- [ ] Implement `init` command (scaffold files, docker-compose, config)
- [ ] Implement `db:up` command (start container, run migrations)
- [ ] Implement `db:down` command (stop container)
- [ ] Implement `db:migrate` command (run pending migrations)
- [ ] Implement `db:status` command (show stats, migration status)
- [ ] Implement `db:reset` command (destructive reset)
- [ ] Implement `validate` command (check config, connections)

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
- Should we support SQLite for local-only mode?
- Include Drizzle ORM or keep raw SQL?

## Parallel / Unblock Options
- Type system can be developed independently
- Docker manager and CLI can be developed in parallel
- Migrations depend on PostgreSQL client

## Validation Criteria
- [ ] `pnpm build` succeeds with no errors
- [ ] All types compile and export correctly
- [ ] `npx omi-neuron init` scaffolds project correctly
- [ ] `npx omi-neuron db:up` starts PostgreSQL container
- [ ] Migrations run without errors
- [ ] Health check returns healthy status

