# Intent + Portfolio Roadmap (Agent-Friendly)

This document captures:
- The intent of `@omiron33/omi-neuron-web` as a library (what it’s for, how it’s meant to be used).
- The primary user-facing usage modes (real-world adoption patterns).
- The main adoption frictions and the corresponding design levers.
- A portfolio roadmap of future work, with links to detailed implementation plans under `plans/`.

If you are executing work in this repo, follow `AGENTS.md` and treat the plan files as the source of truth for task order and dependencies.

---

## Library Intent (What this library is trying to be)

`omi-neuron-web` is a batteries-included “graph intelligence + graph UI” kit for Next.js:

1) **Store a graph** (nodes + edges) in Postgres with `pgvector` support.
2) **Enrich the graph** with AI-powered analysis:
   - Embeddings generation (vector search)
   - Clustering
   - Relationship inference / edge suggestions
3) **Expose a stable API surface** (Next.js route handlers returning `Response`).
4) **Make exploration delightful** via a production-ready Three.js component (`NeuronWeb`) and a React integration layer (provider + hooks).

The core value is “drop-in”: consumers should not need to design a schema, migrations, route handlers, vector-search plumbing, or a complex 3D interaction layer.

---

## How Users Will Use It (Practical usage modes)

### Mode 1 — Full-stack drop-in Next.js “knowledge graph app”
- Uses the CLI to scaffold config + Docker Postgres + migrations + route handlers.
- Uses React hooks/provider + `NeuronWeb` to build a complete app quickly.
- Ideal for “I want this working in a day” users.

### Mode 2 — Visualization-only (bring your own backend)
- Uses `NeuronWeb` + `NeuronWebProps` only (graphData in, UI out).
- Consumer provides nodes/edges from their own backend (Neo4j/custom/static JSON).
- Ideal for teams that already have a graph store and want UI + interactions.

### Mode 3 — Headless intelligence service (no Three.js)
- Uses storage + analysis + API routes, but renders UI differently (2D, lists, search).
- Ideal for “semantic search + clustering + inferred relationships” without 3D.

### Mode 4 — Batch enrichment pipeline
- Uses `DataProcessor` + repositories + `AnalysisPipeline` as a job runner:
  - ingest CSV/JSON
  - embed, cluster, infer
  - export results or serve through API
- Ideal for researchers/content-ops doing offline analysis.

### Mode 5 — Narrative exploration (story beats / study paths)
- Uses story beats + study paths to guide users through the graph as a curated “tour”.
- Ideal for education, explainers, onboarding flows.

---

## Adoption Frictions (Why people won’t adopt) + Mitigation Themes

### Friction: operational overhead
- Postgres + migrations + Docker is heavier than people want for “try it quickly”.
Mitigation themes:
- Provide local-first / low-ops storage modes for prototypes.
- Provide clear “production vs prototype” guidance.

### Friction: provider coupling (OpenAI-only)
- Teams want Azure OpenAI/Anthropic/OpenRouter/local embeddings, or “no AI” mode.
Mitigation themes:
- Provider interfaces (embedding + LLM) with first-class adapters.

### Friction: framework coupling
- Next.js route handlers are great, but some users want Remix/SvelteKit/Express.
Mitigation themes:
- Keep the API layer portable (Fetch `Request`/`Response` is already a good baseline).
- Provide integration examples for other runtimes where possible.

### Friction: security + key handling clarity
- Any hint of “put your OpenAI API key in the browser” reduces adoption immediately.
Mitigation themes:
- Explicit server-only configuration + client-safe settings layering.
- Reference implementation patterns for Next.js server routes.

---

## Roadmap Portfolio (Detailed Plans)

The plans below are designed for agentic implementation:
- Each plan is verbose and broken into Discovery → Design → Implementation → Validation.
- Each checkbox item has a matching task file under `tasks/<plan-slug>/`.
- The master tracker is `plans/master-plan-planner.md`.
- The next execution pointer is `plans/next-step.json`.

### Recommended execution order (highest adoption leverage first)

0) **Visualization Rendering + Animation Depth**
   - plans/phase-4c-visualization-rendering-animation-plan.md

1) **Provider + Pipeline Extensibility**
   - plans/phase-7a-providers-and-extensibility-plan.md
2) **Low-ops / Local-first Storage Backends**
   - plans/phase-7b-storage-backends-plan.md
3) **Connectors + Ingestion Recipes**
   - plans/phase-7c-connectors-and-ingestion-plan.md
4) **Production Hardening (Auth + Multi-tenancy + Security + Observability)**
   - plans/phase-7d-production-hardening-plan.md
5) **Job Orchestration + Governance (Streaming progress + approvals)**
   - plans/phase-7e-jobs-and-governance-plan.md
6) **Visualization UX Toolkit + Scalability**
   - plans/phase-7f-visualization-ux-and-scale-plan.md

Notes:
- Phase 4B (`plans/phase-4-visualization-polish-plan.md`) remains a prerequisite for some Phase 4C and Phase 7F items.
- Phase 4C focuses on “deeper renderer + animation options” (how it’s drawn and animated). Phase 7F focuses on “explorer UX + scale”.
