# Master Plan Planner - omi-neuron-web

Private tracker for agent execution. Goal: build a comprehensive drop-in Next.js library for graph-based data analysis and Three.js visualization with OpenAI-powered insights.

## Status Legend

- ✅ Done
- 🟡 In Progress
- 🟥 Not Started

---

## Executive Summary

**omi-neuron-web** is a self-contained data analysis and visualization library designed as a drop-in solution for Next.js applications. It abstracts the complexity of graph-based data relationships, AI-powered analysis, and 3D visualization into a cohesive, configurable package.

### Core Value Propositions
1. **Zero-config database setup** - Automatically provisions Docker PostgreSQL with pgvector
2. **AI-first analysis** - OpenAI integration for embeddings, clustering, and relationship inference
3. **Rich visualization** - Production-ready Three.js component with full customization
4. **Universal API** - Consistent endpoints regardless of data domain
5. **Type-safe** - Full TypeScript with Zod runtime validation

---

## Big Milestones

- [ ] 🟥 **Phase 1: Foundation** — Core types, Docker/PostgreSQL setup, CLI scaffolding (`plans/phase-1-foundation-plan.md`)
- [ ] 🟥 **Phase 2: Analysis Engine** — Embeddings, clustering, relationship inference pipeline (`plans/phase-2-analysis-engine-plan.md`)
- [ ] 🟥 **Phase 3: API Layer** — REST endpoints for nodes, edges, graph, analysis, settings (`plans/phase-3-api-layer-plan.md`)
- [ ] 🟥 **Phase 4: Visualization** — Three.js NeuronWeb component with full customization (`plans/phase-4-visualization-plan.md`)
- [ ] 🟥 **Phase 5: React Integration** — Provider, hooks, Next.js integration, examples (`plans/phase-5-integration-plan.md`)
- [ ] 🟥 **Phase 6: Validation & Publish** — Tests, documentation, npm publishing (`plans/phase-6-validation-plan.md`)

---

## Control Panel Tasks

- [ ] 🟥 Define complete type system (nodes, edges, clusters, settings, events)
- [ ] 🟥 Create Zod validation schemas for all types and API inputs
- [ ] 🟥 Build DockerManager for PostgreSQL container lifecycle with configurable ports
- [ ] 🟥 Create migration system with pgvector support
- [ ] 🟥 Build CLI tools for init, db management, analysis
- [ ] 🟥 Port and refactor NeuronWeb from Technochristian
- [ ] 🟥 Build analysis pipeline with OpenAI integration
- [ ] 🟥 Create React hooks and provider system
- [ ] 🟥 Write comprehensive documentation and examples

---

## Feature Portfolio

### Phase 1 - Foundation
- `plans/phase-1-foundation-plan.md` — Core TypeScript setup, types, Docker, migrations, CLI

### Phase 2 - Analysis Engine
- `plans/phase-2-analysis-engine-plan.md` — Data processor, embeddings, clustering, relationships, event system

### Phase 3 - API Layer
- `plans/phase-3-api-layer-plan.md` — REST endpoints, repository pattern, query builder, middleware

### Phase 4 - Visualization
- `plans/phase-4-visualization-plan.md` — Three.js component, scene management, interactions, theming

### Phase 5 - React Integration
- `plans/phase-5-integration-plan.md` — Provider, hooks, Next.js wrapper, examples

### Phase 6 - Validation & Publish
- `plans/phase-6-validation-plan.md` — Unit tests, integration tests, docs, npm publish

---

## Next Steps Tracking

Current execution tracked in phase-specific plans and task files under `tasks/`. Use those for current execution order; master plan stays a milestone overview.

### Immediate Next Steps
1. Complete Phase 1 Foundation tasks in order
2. Begin Phase 2 Analysis Engine once data layer is stable
3. API Layer can begin in parallel with analysis engine
4. Visualization can proceed independently once types are defined

---

## Dependencies Graph

```
Phase 1 (Foundation)
├── Core Types ──────────────────┬─────────────────────────────────┐
│                                │                                 │
├── Zod Schemas ─────────────────┼─────────────────────────────────┤
│                                │                                 │
├── Docker Manager ──┬───────────┴───────────────────────────────┐ │
│                    │                                           │ │
├── PostgreSQL Client┴───┬───────────────────────────────────────┤ │
│                        │                                       │ │
├── Migrations ──────────┴───────────────────────────────────────┤ │
│                                                                │ │
└── CLI Tools ───────────────────────────────────────────────────┘ │
                                                                   │
Phase 2 (Analysis Engine)                                          │
├── Data Processor ◄───────────────────────────────────────────────┘
├── Embeddings Service ◄─── PostgreSQL Client
├── Clustering Engine ◄──── Embeddings Service
├── Relationship Engine ◄── Embeddings Service
├── Scoring Engine ◄─────── Embeddings Service
├── Analysis Pipeline ◄──── All above
└── Event System ◄───────── Core Types

Phase 3 (API Layer)
├── Repository Pattern ◄─── PostgreSQL Client + Types
├── Query Builder ◄──────── Repository Pattern
├── Nodes API ◄──────────── Repository + Zod
├── Edges API ◄──────────── Nodes API
├── Graph API ◄──────────── Query Builder
├── Analyze API ◄────────── Analysis Pipeline
├── Settings API ◄───────── Repository
├── Search API ◄─────────── Scoring Engine
└── Middleware ◄─────────── Nodes API

Phase 4 (Visualization)
├── Port NeuronWeb ◄─────── Core Types
├── Scene Manager ◄──────── Port NeuronWeb
├── Node Renderer ◄──────── Scene Manager
├── Edge Renderer ◄──────── Scene Manager
├── Interaction Manager ◄── Scene Manager
├── Animation Controller ◄─ Scene Manager
├── Theme Engine ◄───────── Port NeuronWeb
├── Fallback 2D ◄────────── Port NeuronWeb
├── Study Paths ◄────────── Animation Controller
└── Node Detail Panel ◄──── Port NeuronWeb

Phase 5 (Integration)
├── Provider ◄───────────── Middleware + Event System
├── useNeuronGraph ◄─────── Provider + Graph API
├── useNeuronNodes ◄─────── Provider + Nodes API
├── useNeuronAnalysis ◄──── Provider + Analyze API
├── useNeuronSettings ◄──── Provider + Settings API
├── useNeuronSearch ◄────── Provider + Search API
├── useNeuronEvents ◄────── Provider + Event System
├── Next.js Integration ◄── Provider
└── Examples ◄───────────── All above

Phase 6 (Validation)
├── Unit Tests ◄─────────── Analysis Pipeline
├── API Tests ◄──────────── Middleware
├── Visual Tests ◄───────── NeuronWeb Component
├── Load Tests ◄─────────── Examples
├── Migration Scripts ◄──── Nodes API
├── Documentation ◄──────── Examples
└── npm Publish ◄────────── All above
```

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Large graphs crash browser | High | Performance modes (degraded/fallback), pagination, LOD |
| OpenAI rate limits | Medium | Batching, caching, queue management |
| Docker not available | Medium | External database mode fallback |
| Three.js bundle size | Medium | Dynamic imports, tree shaking |
| TypeScript complexity | Low | Comprehensive type exports, good defaults |

---

## Open Questions

- [ ] Should we support additional embedding providers (Anthropic, local models)?
- [ ] Real-time collaboration features for multi-user graph editing?
- [ ] Should story beats be part of core or a plugin?
- [ ] WebGL fallback vs Canvas 2D for low-end devices?

---

## Notes & Blockers

- Migrating from Technochristian's NeuronWeb requires cleanup of domain-specific code
- pgvector extension required for embedding similarity searches
- Three.js externalized as peer dependency to avoid bundle bloat
- Event system enables consuming apps to extend functionality without forking

