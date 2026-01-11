# Pipeline Steps Contract (Phase 7A)

This document defines the v1 pipeline composition APIs: `AnalysisStep` and utilities for building/running a pipeline with progress + cancellation.

Goals:
- Allow consumers to add/remove/replace steps without forking core analysis code.
- Preserve a safe default “full analysis” pipeline equivalent to today’s behavior.
- Provide consistent progress reporting and cancellation semantics (Phase 7E builds SSE + governance on top).

## AnalysisStep (v1)

### Core interface
Each step should have:
- `id`: stable identifier (string)
- `label`: human-readable name
- `run(ctx, input)`: executes the step
- optional `dependsOn`: other step IDs
- optional `isEnabled(ctx, input)`: feature gating based on config/options

### Step context (minimum)
Steps need access to:
- `store`: `GraphStore`
- `providers`:
  - `embedding?: EmbeddingProvider`
  - `llm?: LLMProvider`
- `signal`: `AbortSignal` (cancellation)
- `events`: `EventBus` (optional; should exist in server builds)
- `reportProgress(progress)` callback

Optional context fields (Phase 7D/7E):
- `requestId`
- `scope`
- `logger`

### Step input
Pipeline-level inputs should be carried into each step:
- `nodeIds?: string[]` (explicit target selection)
- flags for skipping/recomputing
- step-specific options should live under a `stepOptions` bag keyed by step id

### Step output
Step output should be structured so the pipeline can:
- persist snapshots to DB (polling)
- emit progress/completion events
- surface summary stats

Suggested shape:
- `summary`: key counts (e.g., embeddingsGenerated, clustersCreated)
- `errors`: per-item errors (nodeId + message)
- optional `artifacts`: IDs or lightweight references

## Progress contract (v1)

### Minimum fields
The pipeline should be able to emit:
- `stage`: coarse stage name (e.g., `embeddings|clustering|relationships`)
- `stepId`: the step currently running
- `status`: `started|progress|completed|failed|canceled`
- `percent?`: 0–100 when available
- `message?`: human-readable hint (for logs/UI)
- `itemsProcessed?`, `totalItems?` for batch steps

### Emission strategy
- Emit a `started` event when a step begins.
- Emit periodic `progress` updates during long-running steps.
- Emit `completed` with final summary.
- Persist snapshots for polling (Phase 7E).

## Cancellation semantics (v1)
- Pipeline runner owns an `AbortController` per job.
- Step implementations must:
  - pass `signal` into provider requests
  - check `signal.aborted` between batches
  - throw a `canceled` error when aborted
- Pipeline runner must:
  - mark job status `canceled`
  - emit cancellation events

## Pipeline composition utilities (v1)

Recommended helper APIs:
- `defineAnalysisSteps(steps: AnalysisStep[])` (just returns the array; clarity helper)
- `createPipelineRunner({ steps, store, providers, events })`
- `runPipeline({ runType, options })` (compat wrapper for `AnalysisPipeline.runFull` etc.)

Customization patterns:
- **Default steps**: export a default step list (equivalent to today’s pipeline).
- **Override**: allow consumers to supply `steps` to replace the default list.
- **Selective disable**: allow disabling a step by ID without reordering.

## Backward compatibility plan

To avoid breaking current users:
- Keep `AnalysisPipeline` class and methods.
- Internally, implement them on top of the step runner.
- Continue supporting:
  - `PipelineOptions` skip flags
  - current route request shapes

