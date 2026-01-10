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

## Outcomes

- Phases 1–6 implemented with scaffolding and core modules in place
- Phase 4B (Visualization Polish) remains planned work
- Phase 7 portfolio (adoption + extensibility) is planned work
- Library exports stabilized for core types, analysis, storage, API, visualization, and React
- Documentation, examples, tests, and CI/publishing scaffolding completed

---

## Big Milestones

- [x] ✅ **Phase 1: Foundation** — Core types, Docker/PostgreSQL setup, CLI scaffolding (`plans/phase-1-foundation-plan.md`)
- [x] ✅ **Phase 2: Analysis Engine** — Embeddings, clustering, relationship inference pipeline (`plans/phase-2-analysis-engine-plan.md`)
- [x] ✅ **Phase 3: API Layer** — REST endpoints for nodes, edges, graph, analysis, settings (`plans/phase-3-api-layer-plan.md`)
- [x] ✅ **Phase 4: Visualization** — Three.js NeuronWeb component with full customization (`plans/phase-4-visualization-plan.md`)
- [ ] 🟥 **Phase 4B: Visualization Polish** — Cinematic motion, hover cards, density controls (`plans/phase-4-visualization-polish-plan.md`)
- [ ] 🟥 **Phase 4C: Rendering + Animation Depth** — More rendering styles, animation profiles, and drawing options (`plans/phase-4c-visualization-rendering-animation-plan.md`)
- [x] ✅ **Phase 5: React Integration** — Provider, hooks, Next.js integration, examples (`plans/phase-5-integration-plan.md`)
- [x] ✅ **Phase 6: Validation & Publish** — Tests, documentation, npm publishing (`plans/phase-6-validation-plan.md`)
- [ ] 🟥 **Phase 7A: Providers + Extensibility** — Pluggable AI providers, pipeline steps, GraphStore contract (`plans/phase-7a-providers-and-extensibility-plan.md`)
- [ ] 🟥 **Phase 7B: Storage Backends + Local-First DX** — In-memory + file-backed backends for low-ops onboarding (`plans/phase-7b-storage-backends-plan.md`)
- [ ] 🟥 **Phase 7C: Connectors + Ingestion Recipes** — Markdown/GitHub/RSS/Notion ingestion + provenance (`plans/phase-7c-connectors-and-ingestion-plan.md`)
- [ ] 🟥 **Phase 7D: Production Hardening** — Auth hooks, multi-tenancy scoping, security, observability (`plans/phase-7d-production-hardening-plan.md`)
- [ ] 🟥 **Phase 7E: Jobs + Governance** — Streaming progress, suggested-edge approvals workflow (`plans/phase-7e-jobs-and-governance-plan.md`)
- [ ] 🟥 **Phase 7F: Visualization UX + Scale** — Optional explorer UX + performance/scalability knobs (`plans/phase-7f-visualization-ux-and-scale-plan.md`)

---

## Control Panel Tasks

- [x] ✅ Define complete type system (nodes, edges, clusters, settings, events)
- [x] ✅ Create Zod validation schemas for all types and API inputs
- [x] ✅ Build DockerManager for PostgreSQL container lifecycle with configurable ports
- [x] ✅ Create migration system with pgvector support
- [x] ✅ Build CLI tools for init, db management, analysis
- [x] ✅ Port and refactor NeuronWeb from Technochristian
- [x] ✅ Build analysis pipeline with OpenAI integration
- [x] ✅ Create React hooks and provider system
- [x] ✅ Write comprehensive documentation and examples

---

## Feature Portfolio

### ✅ Phase 1 - Foundation
- `plans/phase-1-foundation-plan.md` — Core TypeScript setup, types, Docker, migrations, CLI

### ✅ Phase 2 - Analysis Engine
- `plans/phase-2-analysis-engine-plan.md` — Data processor, embeddings, clustering, relationships, event system

### ✅ Phase 3 - API Layer
- `plans/phase-3-api-layer-plan.md` — REST endpoints, repository pattern, query builder, middleware

### ✅ Phase 4 - Visualization
- `plans/phase-4-visualization-plan.md` — Three.js component, scene management, interactions, theming

### 🟥 Phase 4B - Visualization Polish
- `plans/phase-4-visualization-polish-plan.md` — Motion polish, hover cards, density controls, effects

### 🟥 Phase 4C - Rendering + Animation Depth
- `plans/phase-4c-visualization-rendering-animation-plan.md` — Rendering styles, animation profiles, and deeper drawing options

### 🟥 Phase 7A - Providers + Extensibility
- `plans/phase-7a-providers-and-extensibility-plan.md` — Pluggable providers, pipeline composition, GraphStore + config layering

### 🟥 Phase 7B - Storage Backends + Local-First DX
- `plans/phase-7b-storage-backends-plan.md` — In-memory + file-backed stores, low-ops onboarding, parity tests

### 🟥 Phase 7C - Connectors + Ingestion Recipes
- `plans/phase-7c-connectors-and-ingestion-plan.md` — Connectors, provenance/sync model, ingestion CLI

### 🟥 Phase 7D - Production Hardening
- `plans/phase-7d-production-hardening-plan.md` — Scope/multi-tenancy, auth hooks, security middleware, observability

### 🟥 Phase 7E - Jobs + Governance
- `plans/phase-7e-jobs-and-governance-plan.md` — Progress streaming (SSE), suggested edges queue + approvals

### 🟥 Phase 7F - Visualization UX + Scale
- `plans/phase-7f-visualization-ux-and-scale-plan.md` — Explorer UX toolkit, scalability and performance presets

### ✅ Phase 5 - React Integration
- `plans/phase-5-integration-plan.md` — Provider, hooks, Next.js wrapper, examples

### ✅ Phase 6 - Validation & Publish
- `plans/phase-6-validation-plan.md` — Unit tests, integration tests, docs, npm publish

---

## Execution Phases
### Phase 1 – Discovery 🟡
- [ ] Outline scope.

All phases executed in dependency order with task completion tracked in `tasks/` and `plans/next-step.json`.

---

## Next Steps Tracking

Current execution tracked in phase-specific plans and task files under `tasks/`. Use those for current execution order; master plan stays a milestone overview.

### Immediate Next Steps
1. ✅ Complete Phase 1 Foundation tasks in order
2. ✅ Begin Phase 2 Analysis Engine once data layer is stable
3. ✅ API Layer can begin in parallel with analysis engine
4. ✅ Visualization can proceed independently once types are defined

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

- None (resolved for initial release).

---

## Notes & Blockers

- Migrating from Technochristian's NeuronWeb requires cleanup of domain-specific code
- pgvector extension required for embedding similarity searches
- Three.js externalized as peer dependency to avoid bundle bloat
- Event system enables consuming apps to extend functionality without forking

---

## Task Backlog

No pending backlog items; all planned tasks completed.

---

## Parallel / Unblock Options

- All dependencies resolved; no parallel unblock work required.
