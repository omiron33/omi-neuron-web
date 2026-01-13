# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) and Cursor AI when working with code in this repository.

## Project Overview

**omi-neuron-web** is a drop-in Next.js library that provides:
- AI-powered data analysis using OpenAI embeddings
- Graph-based relationship inference and clustering
- Interactive Three.js visualization (NeuronWeb component)
- Zero-config Docker PostgreSQL with pgvector
- CLI tools for project scaffolding and database management

The library is designed to be installed via npm and initialized in any Next.js project with `npx omi-neuron init`.

## Repository Structure

```
omi-neuron-web/
├── src/
│   ├── core/              # Core engine modules
│   │   ├── types/         # TypeScript type definitions
│   │   ├── schemas/       # Zod validation schemas
│   │   ├── events/        # Event bus system
│   │   └── analysis/      # Analysis pipeline (embeddings, clustering, relationships)
│   ├── storage/           # Database layer
│   │   ├── migrations/    # SQL migrations
│   │   └── *.ts           # Database client, Docker manager
│   ├── api/               # REST API layer
│   │   ├── routes/        # Next.js route handlers
│   │   ├── repositories/  # Data access layer
│   │   └── middleware/    # Validation, errors, CORS
│   ├── visualization/     # Three.js visualization
│   │   ├── scene/         # Scene manager, renderers
│   │   ├── interactions/  # Pointer/keyboard handling
│   │   ├── animations/    # Camera tweens, transitions
│   │   └── themes/        # Theme engine
│   ├── react/             # React integration
│   │   ├── hooks/         # useNeuronGraph, useNeuronNodes, etc.
│   │   └── *.tsx          # Provider component
│   └── cli/               # CLI commands
├── docker/                # Docker compose templates
├── plans/                 # Implementation plans (agent reference)
├── tasks/                 # Detailed task breakdowns
├── examples/              # Example applications
└── tests/                 # Test suites
```

## Development Commands

```bash
# Build
pnpm build              # Build with tsup
pnpm dev                # Watch mode build

# Quality
pnpm lint               # ESLint
pnpm lint:fix           # ESLint with auto-fix
pnpm typecheck          # TypeScript type check
pnpm format             # Prettier

# Testing
pnpm test               # Run Vitest tests
pnpm test:watch         # Watch mode

# Publishing
pnpm changeset          # Create changeset for version bump
pnpm release            # Build and publish to npm
```

## Planning System

All implementation is tracked through markdown plans:

### Plan Files (`plans/`)
- `master-plan-planner.md` — Global milestone tracker
- `phase-{N}-*-plan.md` — Phase-specific plans with detailed requirements
- `next-step.json` — Current task queue with dependencies
- `private-npm-publishing-plan.md` — npm publishing workflow

### Task Files (`tasks/`)
Each phase has a folder with individual task files:
```
tasks/
├── phase-1-foundation/    # Types, Docker, migrations, CLI
├── phase-2-analysis/      # Embeddings, clustering, relationships
├── phase-3-api/           # REST API endpoints
├── phase-4-visualization/ # Three.js component
├── phase-5-integration/   # React hooks, provider, examples
├── phase-6-validation/    # Tests, docs, publishing
└── backlog/               # Future enhancements
```

### Task File Format
```yaml
---
title: Task Title
status: not_started | in_progress | completed | blocked
priority: 1-3
labels:
  - 'Phase:X'
  - 'Type:Category'
depends_on:
  - task-id-1
---

# Task description and requirements...
```

### Executing Tasks
1. Read `plans/next-step.json` for current task
2. Read corresponding task file for requirements
3. Implement according to specifications
4. Update task status in frontmatter
5. Move to next task based on dependencies

## Architecture Patterns

### Type System
All types are in `src/core/types/`. Key interfaces:
- `NeuronNode`, `NeuronNodeCreate` — Node data structures
- `NeuronEdge`, `NeuronEdgeCreate` — Edge/relationship structures
- `NeuronCluster` — Cluster groupings
- `NeuronSettings`, `NeuronConfig` — Configuration
- `NeuronEvent` — Event system types

### Database Layer
- PostgreSQL 16 with pgvector extension
- Docker-managed via `DockerManager` class
- Migrations in `src/storage/migrations/`
- Connection pooling via `pg` library

### Analysis Pipeline
```
DataProcessor → EmbeddingsService → ClusteringEngine → RelationshipEngine
                      ↓
                 ScoringEngine
                      ↓
              AnalysisPipeline (orchestrates all)
```

### API Pattern
```typescript
// Route handlers export factory functions
export function createNodesRoutes(config: NeuronConfig) {
  return {
    async GET(request: Request) { ... },
    async POST(request: Request) { ... },
  };
}
```

### React Integration
```typescript
// Provider wraps application
<NeuronWebProvider config={{...}}>
  <App />
</NeuronWebProvider>

// Hooks access functionality
const { nodes, createNode } = useNeuronNodes();
const { graphData, selectNode } = useNeuronGraph();
```

### Visualization
- Three.js with WebGLRenderer + CSS2DRenderer
- SceneManager handles lifecycle
- NodeRenderer/EdgeRenderer for graph elements
- InteractionManager for pointer events
- AnimationController for camera tweens

## Key Implementation Details

### Embeddings
- OpenAI text-embedding-3-small (1536 dimensions)
- Cached in PostgreSQL with pgvector
- HNSW index for fast similarity search

### Clustering
- K-means and DBSCAN algorithms
- Centroid stored as vector column
- AI-generated cluster labels

### Relationship Inference
- Similarity-based candidate selection
- AI classification of relationship type
- Confidence scoring with threshold filtering

### Performance Modes
- `normal` — Full quality (< 50 nodes)
- `degraded` — Reduced labels/effects (50-150 nodes)
- `fallback` — 2D canvas (150+ nodes)

## Common Patterns

### Creating Nodes
```typescript
const node = await createNode({
  label: 'My Concept',
  nodeType: 'concept',
  domain: 'knowledge',
  content: 'Full text for embedding...',
});
```

### Running Analysis
```typescript
const job = await startAnalysis({
  action: 'full',
  options: {
    clusterCount: 10,
    relationshipThreshold: 0.7,
  },
});
```

### Semantic Search
```typescript
const results = await search('machine learning', {
  limit: 20,
  minSimilarity: 0.7,
});
```

## Environment Variables

```bash
# Required
OPENAI_API_KEY=sk-...

# Database (auto-configured for Docker mode)
NEURON_DATABASE_URL=postgresql://neuron:neuron_dev@localhost:5433/neuron_web
NEURON_DB_PORT=5433
NEURON_DB_PASSWORD=neuron_dev

# Optional
NEURON_LOG_LEVEL=debug
```

## Important Guidelines

### Documentation Updates
**This is an agent-first repository.** When adding new features, always update `README.md` with:
- New exports and their usage
- New types and interfaces
- New props and configuration options
- Usage examples with code snippets
- Any new patterns or modes

Keep documentation agent-readable: use code blocks, explicit type signatures, and clear examples that agents can use directly.

### Code Style
- Strict TypeScript with no `any` (except where necessary)
- Zod for all runtime validation
- JSDoc comments on public interfaces
- Consistent naming: camelCase for variables, PascalCase for types

### Error Handling
- Use `ApiError` class for HTTP errors
- Include error codes for all failures
- Never expose stack traces in production

### Testing
- Unit tests for core modules
- Integration tests for API routes
- Visual tests for component rendering

### Performance
- Lazy load Three.js (peer dependency)
- Use pgvector indexes for similarity
- Batch API calls with rate limiting
- Implement proper disposal/cleanup

## Working with Existing Code

### Porting from Technochristian
The NeuronWeb visualization is ported from `Technochristian/src/components/home/neuron-web.tsx`. When working on visualization:
1. Remove domain-specific code (atlas, scripture references)
2. Generalize color handling via ThemeEngine
3. Update types to use library types
4. Extract reusable utilities

### Reference Implementations
- Graph visualization: `Technochristian/src/components/home/neuron-web.tsx`
- Graph data fetching: `Technochristian/src/lib/atlas/graph.ts`
- Contextual API: `Technochristian/tasks/contextual-graph-api.md`

## CLI Development

The CLI is the primary interface for consuming apps:

```bash
npx omi-neuron init          # Scaffold in project
npx omi-neuron db:up         # Start PostgreSQL
npx omi-neuron db:migrate    # Run migrations
npx omi-neuron analyze:full  # Run analysis pipeline
```

CLI implementation uses Commander.js with chalk for output.

## Publishing

Package is published to npm with scoped name:
- Name: `@your-org/omi-neuron-web`
- Access: restricted (private)
- Versioning: changesets

See `plans/private-npm-publishing-plan.md` for details.

## Quick Reference

| What | Where |
|------|-------|
| Types | `src/core/types/` |
| Schemas | `src/core/schemas/` |
| Database | `src/storage/` |
| API Routes | `src/api/routes/` |
| Visualization | `src/visualization/` |
| React Hooks | `src/react/hooks/` |
| CLI | `src/cli/` |
| Plans | `plans/` |
| Tasks | `tasks/` |


