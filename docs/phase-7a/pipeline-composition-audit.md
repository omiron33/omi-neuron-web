# Pipeline Composition Audit (Phase 7A.2)

This document inventories how the analysis pipeline is composed today, what is hard-coded vs configurable, and where we can introduce clean extension seams for Phase 7A `AnalysisStep` + pipeline builder work.

## Current pipeline (as implemented)

Primary implementation:
- `src/core/analysis/pipeline.ts` (`AnalysisPipeline`)

Pipeline stage order (hard-coded):
1) Embeddings (`EmbeddingsService.embedNodes(...)`)
2) Clustering (`ClusteringEngine.clusterNodes(...)`)
3) Relationships (`RelationshipEngine.inferForNodes(...)` then `createEdgesFromInferences(...)`)

Public entry points:
- `AnalysisPipeline.runFull(options)`
- `AnalysisPipeline.runEmbeddings(options)`
- `AnalysisPipeline.runClustering(options)`
- `AnalysisPipeline.runRelationships(options)`

Pipeline persistence / job tracking:
- Writes `analysis_runs` row on start (`createJob`)
- Updates `analysis_runs.results` (only stage totals + errors)
- Updates `analysis_runs.status/progress` on completion/failure

Cancellation model:
- Maintains `activeJobs: Map<string, AbortController>`
- `cancelJob()` aborts controller, sets status `cancelled`
- Important: the abort signal is **not** used by embedding/LLM requests, so cancellation only affects job bookkeeping, not underlying work.

Progress reporting model:
- `PipelineOptions.onProgress` callback exists
- Currently reports only 100% completion per stage, not incremental progress

Events:
- `AnalysisPipeline` receives an `EventBus` but does not currently emit any events.

## Current composition points (where services are wired)

The pipeline is constructed “outside” the core pipeline class; key wiring points:

- `src/api/routes/analyze.ts`
  - `buildPipeline(config)` constructs DB, EmbeddingsService, ClusteringEngine, RelationshipEngine, EventBus.
  - New injection seams can start here without changing route handlers.

- `src/cli/commands/analyze.ts`
  - `buildPipeline()` constructs DB and concrete services directly.

Implication:
- The library has already-established “composition at the edge” patterns; Phase 7A can introduce a server builder while keeping these call sites as compatibility shims.

## What is configurable today vs hard-coded

### Configurable inputs (existing)
`PipelineOptions` supports:
- `skipEmbeddings`, `skipClustering`, `skipRelationships`
- clustering: `clusterCount`, `clusteringAlgorithm`
- relationships: `relationshipThreshold`, `maxRelationshipsPerNode`
- embeddings: `forceRecompute`, `embeddingModel` (currently not plumbed through)
- `nodeIds` selection
- `onProgress` callback

### Hard-coded / non-extensible areas (current limitations)
- Fixed stage set and stage order (cannot add/remove/reorder beyond the skip flags).
- Stage implementations call concrete services directly; no step contract.
- Cancellation is not propagated (no `AbortSignal` passed into providers).
- Progress is not incremental (no per-item progress events).
- Pipeline has implicit Postgres assumptions:
  - embeddings stage reads/writes node embedding columns directly via SQL.
  - relationship candidate selection uses pgvector operators.

## Desired extension seams (Phase 7A target)

### Step contract boundary
Introduce a new `AnalysisStep` contract to separate:
- *what the pipeline does* (step ordering, cancellation, progress)
from
- *how a step does it* (embeddings, clustering, inference, etc.)

Minimum seam requirements (derived from current architecture):
- Step ID/name + stable ordering
- `run(ctx, input)` function:
  - receives `AbortSignal`
  - can report progress incrementally
  - returns structured results (so pipeline can persist snapshots)

### Pipeline builder utilities
Introduce utilities to define a pipeline as:
- default step list (equivalent to current “full analysis”)
- user-provided step overrides (add/remove/replace)
- “preset pipelines” (embeddings-only, clustering-only) without duplicating logic

### Store and provider injection boundary
To support Phase 7B local-first stores and Phase 7A provider swapping:
- Steps should depend on:
  - `GraphStore` (portable data access), and
  - provider contracts (`EmbeddingProvider`, `LLMProvider`)
instead of raw SQL + direct OpenAI calls.

Phase 7A can preserve existing Postgres performance by:
- implementing `PostgresGraphStore` that composes existing repositories/query builder
- keeping pgvector-specific methods inside the Postgres-backed store implementation

### Events and job progress
Replace “callback-only” progress with:
- EventBus events (server + client can consume)
- periodic DB snapshots for polling (Phase 7E builds SSE on top)

## Backward-compatibility strategy (recommended)

To avoid breaking changes:
- Keep `AnalysisPipeline` class and its existing methods.
- Internally implement `runFull` etc by using:
  - a default step list + pipeline runner
  - optional injected steps/providers/store via new builder APIs
- Keep existing route helpers working by:
  - providing a new “server builder” factory
  - leaving `buildPipeline(config)` as a thin wrapper for now

## Gaps to close in later tasks
- Decide where step selection is configured:
  - config file vs API request vs code-only builder
- Define the minimal progress payload contract (Phase 7E depends on this).
- Define how candidate selection for inference works in non-Postgres stores:
  - naive similarity scoring with stored embeddings (Phase 7B)
  - or explicit “relationships disabled” mode (documented).

