# NeuronWeb Performance Budgets

## Goals
- Preserve cinematic motion in **normal** mode without sacrificing interactivity.
- Maintain **degraded** mode readability and hover/click affordances with reduced visual load.
- Ensure **fallback** mode remains responsive and safe for large graphs.

## Mode Targets

| Mode | Node Count Range | FPS Target | Primary Goal |
| --- | --- | --- | --- |
| normal | 0–180 nodes | 60 fps (floor 55) | Full cinematic feel; rich interactions |
| degraded | 181–360 nodes | 45–55 fps (floor 40) | Maintain clarity; reduce density + effects |
| fallback | 361–800 nodes | 30–45 fps (floor 28) | Keep interaction stable; minimal effects |

> Note: In auto mode, the thresholds above are the default gating boundaries. Manual `performanceMode` overrides auto gating.

## Effect Tier Matrix

| Feature | normal | degraded | fallback |
| --- | --- | --- | --- |
| Labels | On (distance + max count) | Off by default | Off |
| Hover cards | On | On | Off |
| Click card | On | On | Off |
| Click zoom | On | On | On (shorter duration) |
| Ambient node motion | On | Off (or low amplitude) | Off |
| Edge flow animation | On | Off | Off |
| Selection pulse/ripple | On | On (reduced) | On (minimal) |
| Starfield | On (full count) | On (reduced count) | Optional (off by default) |
| Fog + atmosphere | On | On (reduced intensity) | Off |
| Postprocessing (bloom/vignette/grade) | On | Off | Off |

## Renderer + Animation Mode Matrix (Phase 4C)

Phase 4C introduces deeper rendering options (curves/arrows/label transitions) and a formal animation profile system. This matrix defines the defaults and the **expected gating behavior**.

Legend:
- ✅ allowed by default
- 🟡 allowed only when explicitly enabled and within budgets
- ❌ disabled

| Feature | normal | degraded | fallback |
| --- | --- | --- | --- |
| Labels (distance + max count) | ✅ | 🟡 (interaction-only recommended) | ❌ |
| Label transitions (fade/scale) | 🟡 | ❌ | ❌ |
| Edge curves | 🟡 | ❌ | ❌ |
| Arrowheads | 🟡 | ❌ | ❌ |
| Edge flow (pulse/dash/scroll) | 🟡 | ❌ | ❌ |
| Selection pulse | ✅ | ✅ (reduced) | 🟡 (minimal only) |
| Selection ripple | ✅ | ✅ | 🟡 (minimal only) |
| Ambient node drift | ✅ | ❌ | ❌ |
| Camera tween focus | ✅ | ✅ (shorter) | 🟡 (short or snap) |
| Postprocessing | 🟡 (normal only) | ❌ | ❌ |
| Node mesh mode | 🟡 | ❌ | ❌ |

### Auto thresholds (default)

The default auto thresholds (consistent with baseline):
- `normal`: 0–180 nodes
- `degraded`: 181–360 nodes
- `fallback`: 361+ nodes

If `rendering.performance.normalMaxNodes` / `rendering.performance.degradedMaxNodes` are provided, they fine-tune the auto threshold selection, but **never override an explicit** `performanceMode`.

Note (high-DPI devices):
- Auto gating uses a small device pixel ratio factor so large canvases on high-DPI screens degrade earlier.
  Current behavior treats the “effective node count” as `nodeCount * sqrt(devicePixelRatio)` with `devicePixelRatio` capped at 2.

### Override semantics (important)

1) **Manual `performanceMode` wins**
   - If the user sets `performanceMode="degraded"`, the system must behave as degraded even if the graph is small.
2) **Performance gates still apply**
   - Rendering options are requests, not guarantees.
   - “Unsafe” features (curves/arrows/flow/mesh) must be automatically disabled outside `normal` by default.
3) **Reduced motion is a hard governor**
   - Continuous motion (ambient drift, edge flow, pulsing) is disabled when reduced motion is enabled, regardless of profile/preset.

## Default Gating Rules

1. **Auto mode** selects `normal`, `degraded`, or `fallback` based on node count.
2. **Manual `performanceMode`** overrides all auto gating.
3. **Reduced motion** (prefers-reduced-motion) disables ambient motion, edge flow, and any camera tween longer than 400ms.
4. **Labels** render only in `normal` mode; if enabled, cap counts and distance thresholds to avoid overdraw.
5. **Hover + click cards** disable in fallback to prevent layout thrash and keep pointer latency low.
6. **Postprocessing** is opt-in for `normal` and always disabled in `degraded` and `fallback`.
7. **Starfield density** scales with mode (normal > degraded > fallback).
8. **Density controls** should tighten edge opacity + node spacing in degraded/fallback to reduce clutter.

## Bottlenecks + Mitigations (Phase 4C)

Phase 4C adds “depth” options, which can introduce real performance costs. This section records the primary hotspots and the preferred mitigation patterns.

### Nodes (draw calls + per-frame work)
Current implementation:
- One `THREE.Sprite` per node + per-node per-frame updates (ambient drift + scale lerp).

Primary risks:
- High object count increases CPU work per frame.
- Each node is raycastable; pointer move raycasts can become expensive.

Preferred mitigations:
- Strict feature gating by mode (`normal` only by default for expensive node effects).
- Avoid allocating in the render loop (reuse vectors; cache derived values).
- Consider GPU instancing for nodes if draw calls become the dominant bottleneck (future backlog).

Stop conditions (recommended):
- > 180 nodes: disable any expensive per-node effects beyond basic hover/selection.
- > 360 nodes: disable ambient motion entirely.

### Edges (geometry count + line rendering)
Current implementation:
- One `THREE.Line` per edge with a 2-point `BufferGeometry`.

Primary risks:
- Lots of `Line` objects means lots of geometries/materials and raycast targets.
- Curved edges, arrowheads, and flow animations increase geometry complexity.

Preferred mitigations:
- Keep edge features opt-in; default to straight edges.
- Gate curves/arrows/flow to `normal` by default.
- When feasible, batch edges into fewer geometries (future optimization).

Stop conditions (recommended):
- Curves/arrows/flow disabled automatically outside `normal`.
- If edge count is “very high” relative to node count, prioritize opacity gating and strength thresholds.

### Labels (DOM cost)
Current implementation:
- Labels are CSS2D DOM nodes; LOD uses distance + max count.

Primary risks:
- DOM overlays can cause layout/paint costs, especially with transitions.

Preferred mitigations:
- Hard caps by mode (normal-only by default).
- Prefer fade-only transitions (opacity) over transforms when density is high.
- Allow `interaction` visibility mode for degraded behavior (labels only on hover/selection).

Stop conditions (recommended):
- `degraded` default: labels off or interaction-only.
- `fallback`: labels off.

### Picking / raycasting (pointer latency)
Current implementation:
- Pointer move runs raycasts against node objects (and edges if no node hit on click).

Primary risks:
- High object count + frequent pointer events can cause pointer latency.

Preferred mitigations:
- Hover delay (already present) + consider requestAnimationFrame throttling for move events.
- Limit raycast targets to visible nodes/edges.

### Postprocessing (GPU cost)
Current implementation:
- EffectComposer + optional bloom/vignette/grade; normal-only by default.

Primary risks:
- Bloom and shader passes can be expensive on high-DPI devices.

Preferred mitigations:
- Keep postprocessing disabled outside `normal`.
- Cap pixel ratio (already present via `pixelRatioCap`).

## Visual Targets (Qualitative)

- **Normal:** subtle but continuous motion, clear selection highlights, readable labels, and smooth hover transitions.
- **Degraded:** less motion, fewer labels, still readable node hierarchy, and responsive hover/click focus.
- **Fallback:** static but legible graph with minimal overlays; interaction should feel immediate.

## Reference Baseline

See `docs/visualization/visual-baseline.md` for initial FPS/memory measurements and screenshots.

## Post-Polish Headless Measurements (Jan 9, 2026)

Measured via Playwright headless Chromium (2s `requestAnimationFrame` sample).

| Scenario | Mode | Avg FPS | JS Heap Used | JS Heap Total |
| --- | --- | --- | --- | --- |
| 50 nodes | normal | ~60.2 fps | ~67.5 MB | ~74.1 MB |
| 200 nodes | degraded | ~60.3 fps | ~81.3 MB | ~104.5 MB |
| 500 nodes | fallback | ~60.2 fps | ~93.7 MB | ~125.4 MB |

Notes:
- Headless FPS tends to be optimistic; treat as a floor check.
- Postprocessing was enabled in normal mode and disabled in fallback mode for the above.
