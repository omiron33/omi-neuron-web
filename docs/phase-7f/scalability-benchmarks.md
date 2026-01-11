# Phase 7F — Scalability Benchmarks (Discovery Draft)

This document outlines a repeatable way to benchmark `NeuronWeb` performance across graph sizes and highlights the most likely bottlenecks based on the current render loop and renderer architecture.

> Note: This is a Phase 7F Discovery artifact. Phase 7F Design tasks will refine targets/budgets and turn these into actionable implementation work.

## Current Baseline Controls (already in code)

`NeuronWeb` already includes a coarse performance tiering system:
- `performanceMode: 'auto' | 'normal' | 'degraded' | 'fallback'`
- default thresholds (as implemented in `src/visualization/NeuronWeb.tsx`):
  - `normalMaxNodes` default: **180**
  - `degradedMaxNodes` default: **360**

In `auto` mode, the component selects the mode based on node count and an adjusted “effective count” that accounts for device pixel ratio.

## Benchmark Matrix (recommended)

Run each scenario with:
- rendering preset: `minimal`, `subtle`, `cinematic`
- label visibility modes: `auto`, `interaction`, `none`
- density presets: `relaxed`, `balanced`, `compact`

Suggested graph sizes:

| Scenario | Nodes | Edges | Purpose |
|---|---:|---:|---|
| S1 | 50 | 80 | Baseline smoothness |
| S2 | 120 | 200 | Typical “small app” graph |
| S3 | 180 | 320 | `normal` threshold |
| S4 | 260 | 500 | mid “degraded” |
| S5 | 360 | 700 | `degraded` threshold |
| S6 | 600 | 1200 | pressure test for “fallback” |

Edge density guidelines:
- Start with ~1–2 edges per node (sparse).
- Add a second pass with ~3–5 edges per node (dense) to stress edge renderer + declutter logic.

## Metrics to Capture

At minimum:
- **FPS** (avg + worst-case)
- **Frame time breakdown** (main thread ms/frame, long tasks)
- **DOM/layout work** (especially with labels via CSS2DRenderer)
- **Draw calls / triangles** (WebGL inspector / devtools)
- **JS heap growth** over time (leaks / allocations per frame)

Recommended tools:
- Chrome Performance panel (record 10–20 seconds during interaction)
- Chrome “Rendering” tab (FPS meter)
- WebGL inspector / Spector.js (optional)

## Likely Bottlenecks (from code audit)

### 1) Label rendering + DOM churn
Labels are implemented with `CSS2DObject` + DOM elements (`three/examples/jsm/renderers/CSS2DRenderer.js`).

Hot spots:
- `nodeRenderer.updateLabelVisibility(camera)` is called every frame.
- label transitions can trigger style updates / layout invalidation.

Mitigations (Phase 7F implementation candidates):
- stronger label LOD rules (tier + distance + max count)
- ability to throttle label visibility checks (e.g. every N frames)
- default to `labelVisibility: 'interaction'` at higher node counts

### 2) Per-frame edge position updates
When nodes have dynamic positions, the render loop does:
- `nodeRenderer.getNodePositionsBySlug(...)`
- `edgeRenderer.updatePositions(positions)`

This can become CPU-heavy with many edges, especially if using curved edges or dashed flow modes.

Mitigations:
- avoid recomputing positions maps when camera-only changes happen
- skip edge updates when layout is stable
- consider batching edge geometry updates or instanced techniques

### 3) Object count (non-instanced node/edge objects)
Current renderers allocate per-node/edge objects, which can increase:
- draw calls
- memory pressure
- interaction/raycast overhead

Mitigations:
- instanced nodes (optional future work)
- merge geometries for certain styles
- tighter “fallback” mode that trades fidelity for fewer objects

### 4) Per-frame overlay positioning work
The render loop updates hover/click card positions on every frame:
- reads DOM sizes (`offsetWidth/offsetHeight`)
- reads bounding rect (`getBoundingClientRect`)
- writes transforms

Mitigations:
- cache measured sizes until content changes
- throttle layout reads
- avoid reading `getBoundingClientRect` every frame if container is stable

### 5) Postprocessing + effects
Bloom/vignette/color grading and other effects increase GPU cost.

Mitigations:
- default-disable postprocessing in `degraded` / `fallback`
- keep presets predictable and documented

## Benchmark Procedure (repeatable)

1. Pick a scenario size (S1–S6) and preset configuration.
2. Render the graph and wait ~3 seconds for layout settling.
3. Interact:
   - rotate camera
   - hover nodes (if enabled)
   - click/select nodes
4. Record:
   - 10–20s Performance profile
   - FPS range
5. Repeat for label visibility modes and density presets.

## Deliverable Output (what we want after running benchmarks)

For each scenario:
- chosen recommended default `performanceMode` behavior
- label policy recommendation (LOD + caps)
- edge declutter recommendations (threshold/fade)
- decision on whether instancing is required for target budgets

