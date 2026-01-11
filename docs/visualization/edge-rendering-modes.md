# Edge Rendering Modes (Phase 4C.7)

This document defines the edge rendering modes and implementation approach for Phase 4C.

Goals:
- Improve readability in dense graphs (curves, declutter, emphasis).
- Preserve performance by defaulting to low-cost representations and gating expensive features.
- Provide a stable, type-safe configuration surface (`EdgeStyleOptions` + resolver overrides).

---

## Current Implementation (baseline)

File: `src/visualization/scene/edge-renderer.ts`
- Geometry: `THREE.Line` with 2-point `BufferGeometry` (straight line between endpoints).
- Material: `THREE.LineBasicMaterial`
- Strength mapping: opacity can scale with `edge.strength` when enabled.
- “Flow”: opacity pulsing (sin wave), not directional.
- No arrowheads, no curve support, no variable width support.

---

## Supported Edge Geometries (v1)

### 1) Straight (default)
**Mode name:** `straight`

Implementation:
- Keep existing `THREE.Line` straight segments.
- Lowest risk and best default for performance.

Recommended defaults:
- `mode: 'straight'`
- opacity mapping from strength (clamped)
- no arrows
- no flow outside `normal`

### 2) Curved (opt-in, gated)
**Mode name:** `curved`

Implementation options (ordered by preference for v1):
1) **Sampled bezier polyline**
   - Use a quadratic or cubic bezier curve and sample into N segments.
   - Use `THREE.Line` with a multi-point `BufferGeometry`.
   - Pros: no new dependencies; predictable.
   - Cons: still “thin line”; width support remains limited.
2) **TubeGeometry (not recommended for v1)**
   - Represent edge as a mesh tube for width.
   - Pros: reliable width.
   - Cons: expensive for many edges.

Control point heuristic (recommended):
- Compute control point in a stable way from endpoints:
  - midpoint + perpendicular offset proportional to distance (and optionally based on edge id hash)
  - ensure the arc direction is deterministic (avoid random flips)

Recommended defaults:
- `curved` is opt-in and **normal-mode only by default**.
- Default segments: 12–24 (trade-off between smoothness and CPU/vertex count).

---

## Arrowheads / Directionality (opt-in, gated)

Arrowheads are valuable for:
- directed graphs
- relationship inference outputs (direction matters)

### Strategy (recommended v1)
Use a lightweight mesh per arrowhead:
- `THREE.ConeGeometry` or `THREE.CylinderGeometry`
- oriented to the edge direction at the “to” endpoint
- small, subtle size to avoid clutter

Bidirectional edges:
- draw two arrowheads (one near each endpoint), with small offsets so they don’t overlap.

Gating defaults:
- Arrowheads are disabled by default.
- Arrowheads only in `normal` mode unless graph is small.

---

## Dash / Flow Strategy (opt-in, gated)

There are multiple ways to communicate “flow” without custom shaders.

### Level 0 — Pulse emphasis (existing; lowest cost)
- Use opacity pulsing (sin) for focused edges (or global flow in normal mode).
- Not directional, but communicates “alive”.

### Level 1 — Dashed line animation (optional v1)
Implementation (candidate):
- `THREE.LineDashedMaterial`
- requires `line.computeLineDistances()`
- animate dash offset by shifting the `lineDistance` attribute in-place (best-effort; normal-mode only).

Constraints:
- Must be **normal-mode only** by default.
- Must be disabled for reduced motion.

### Level 2 — True directional flow (likely v2)
Directional flow is best served by:
- shader-based UV scroll or custom fragment logic
- or texture scrolling along a mesh

This is higher complexity and should not be the default in Phase 4C unless it proves cheap and robust.

---

## Width / Opacity Mapping Rules

### Opacity (recommended v1)
Opacity should map from `edge.strength` (0..1):
- clamp strength into [0,1]
- map into a conservative range (avoid “all edges are opaque”)

Example mapping:
- `opacity = lerp(0.12, 0.8, strength)`
- clamp final opacity into [0.05, 1]

### Width (caution)
Line width is not reliably supported with `LineBasicMaterial` across platforms.

Recommended v1 stance:
- expose width configuration in types for forward compatibility
- implement width only when the chosen rendering mechanism supports it (e.g., a future `Line2` adoption)
- document that width may be ignored in some modes/platforms

Confidence mapping:
- `NeuronVisualEdge` currently exposes `strength` but not `confidence`.
- v1 should map from `strength` only.
- If confidence becomes required:
  - extend `NeuronVisualEdge` to include confidence, or
  - provide it through metadata and a resolver callback.

---

## Default Behavior Table (by performance mode)

| Feature | normal | degraded | fallback |
| --- | --- | --- | --- |
| Edge geometry | straight (default), curved opt-in | straight only | straight only |
| Arrowheads | opt-in | off | off |
| Dash / flow | opt-in (pulse OK) | off | off |
| Strength opacity mapping | on | on | on |
| Width mapping | best-effort | off or best-effort | off |

Reduced motion (`prefers-reduced-motion`):
- disables all continuous flow animations (pulse/dash scroll)
- arrowheads may remain if they are static (no motion)

---

## API Surface (v1)

Type surface is in `src/visualization/types.ts`:
- `EdgeStyleOptions`
- `EdgeStyle` (resolver return)
- `EdgeStyleResolver`

Recommended “easy path”:
- users pick a preset, then optionally set `edges.mode` and `edges.opacity`.

Recommended “advanced path”:
- users supply `rendering.resolvers.getEdgeStyle(edge)` for bespoke style decisions.

### Flow modes
To preserve existing visuals, `flow.mode` defaults to `'pulse'`.
- `flow.mode: 'pulse'` → opacity pulsing (lowest cost)
- `flow.mode: 'dash'` → dashed material with dash offset animation (normal-only by default)
