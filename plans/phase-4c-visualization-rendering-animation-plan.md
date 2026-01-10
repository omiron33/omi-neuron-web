# Phase 4C: Rendering + Animation Depth Plan

## Outcomes
- Provide significantly richer rendering options for nodes and edges (styles, geometry, and mapping rules) while preserving safe defaults.
- Provide higher-quality animations (focus, transitions, layout changes, edge flow, selection states) with configurable profiles and gating.
- Make rendering and animation customization **declarative** and **type-safe** via new options types and theme extensions.
- Maintain performance budgets across `normal` / `degraded` / `fallback` and respect reduced-motion preferences.
- Keep changes additive (no breaking changes to existing `NeuronWebProps`), with a documented migration path where new APIs supersede older ad-hoc behavior.

## Scope

### In scope
- Node rendering options:
  - geometry mode(s): sprite / billboard / mesh (as feasible without heavy deps)
  - size/opacity/glow mapping rules based on node fields (tier, connectionCount, metadata)
  - per-tier styling and selection/hover styling
- Edge rendering options:
  - line style modes: straight / curved (quadratic/cubic) / bundled (where supported)
  - width/opacity mapping rules based on edge strength/confidence
  - arrowheads/bidirectional styling options
  - animated flow options (dash offset / texture scroll / highlight pulse)
- Label rendering options:
  - label LOD rules and explicit caps by mode
  - label style variants for hover/selection
  - predictable show/hide transitions
- Animation system enhancements:
  - animation profiles/presets (subtle/cinematic/minimal/off)
  - camera tween improvements (easing, damping, chaining)
  - smooth transitions for: graph updates, filters, layout changes, and story beats
  - per-feature gating based on performance mode and reduced-motion
- Developer control surfaces:
  - new `rendering` / `renderOptions` (name finalized in Design phase) prop(s) or theme extensions
  - optional resolver callbacks for advanced mapping (`getNodeStyle`, `getEdgeStyle`)
  - documented presets to avoid “too many knobs”
- Demo scenes + docs for rendering/animation options

### Out of scope
- Full renderer rewrite (React Three Fiber / WebGPU).
- Custom shader authoring beyond Three.js built-ins and `three/examples` utilities.
- Real-time multi-user presence/collaboration features.
- Server-side layout computation (layout remains client-side).

## Assumptions & Constraints
- Three.js remains a peer dependency; avoid additional heavyweight runtime deps.
- Changes are additive; existing props continue to work as currently documented.
- The “default look” remains stable unless the consumer opts into new modes/presets.
- Respect `prefers-reduced-motion`; provide a single “disable animations” switch.
- Performance budgets from Phase 4B remain the baseline (`docs/visualization/performance-budgets.md`).

## Dependencies
- Phase 4 (Visualization) is complete and provides: `SceneManager`, `NodeRenderer`, `EdgeRenderer`, `InteractionManager`, `AnimationController`, `ThemeEngine`, `Fallback2D`.
- Phase 4B docs and contracts (recommended prerequisites):
  - `docs/visualization/animation-storyboard.md`
  - `docs/visualization/performance-budgets.md`
  - `docs/visualization/density-strategy.md`
  - `docs/visualization/effects-pipeline.md`

## Execution Phases

### Phase 1 – Discovery 🟥
- [ ] Audit current rendering/animation capabilities and identify the highest-impact gaps (node styles, edge styles, transition quality, configurability).
- [ ] Define the “must-have” option set for v1 depth:
  - node/edge style modes
  - mapping/resolver needs
  - animation profile presets
- [ ] Identify performance bottlenecks to address first (draw calls, labels, line rendering, raycasting, postprocessing).
- [ ] Confirm required compatibility constraints (Next.js client components, SSR-safe exports, fallback behavior).

### Phase 2 – Design/Architecture 🟥
- [ ] Define a rendering options contract (types + defaults) and decide whether it lives in `theme`, a new prop, or both.
- [ ] Design style mapping strategy:
  - static options for simple use
  - optional resolver callbacks for advanced use
  - deterministic behavior for tests and demos
- [ ] Design edge style modes and implementation approach:
  - straight vs curved edges
  - arrowheads/bidirectional rendering
  - flow animation technique and gating rules
- [ ] Design animation profiles/presets:
  - what each profile enables/disables
  - default durations/easing per mode
  - reduced-motion behavior and overrides
- [ ] Define rendering/animation “mode matrix” across `normal`/`degraded`/`fallback` and document it.
- [ ] Plan API docs and examples structure (what to document where, and the canonical usage snippet).

### Phase 3 – Implementation 🟥
- [ ] Implement node style modes and mapping rules in NodeRenderer (with safe defaults and type-safe options).
- [ ] Implement edge style modes (curves/width/arrowheads/flow) in EdgeRenderer with performance gates.
- [ ] Implement improved label LOD + transitions, ensuring predictable caps and mode behavior.
- [ ] Implement animation profile system and wire it through AnimationController/ThemeEngine.
- [ ] Implement smooth transitions for:
  - graph updates (node/edge additions/removals)
  - filter changes
  - layout mode changes
  - story beat playback
- [ ] Add/expand demo scenes and docs that showcase each style/animation mode and how to configure them.

### Phase 4 – Validation 🟥
- [ ] Add regression demos and “visual baseline” snapshots for each preset/mode combination (normal/degraded/fallback).
- [ ] Benchmark performance at representative node counts and validate gating behavior matches budgets.
- [ ] Validate accessibility and motion safety:
  - reduced-motion compliance
  - keyboard focus/selection remains usable
  - contrast/readability under new styles
- [ ] Validate public API compatibility:
  - existing NeuronWeb props still function
  - new options are exported and documented

## Risks & Mitigations
- Too many knobs overwhelm users → provide presets and layered configuration (simple defaults, advanced resolvers optional).
- Performance regressions from richer rendering → strict gating by performance mode; prefer instancing/LOD; document limits.
- Feature creep into shader development → constrain to Three.js built-ins; backlog custom shaders separately.
- Visual inconsistency across modes → define a mode matrix and test it via demo fixtures.

## Open Questions
- Should edge curves be default in any preset, or opt-in only?
- Do we need a “render pipeline” abstraction (pluggable renderers), or is options + resolvers sufficient?
- Should label rendering offer a performance-first alternative to CSS2D for large graphs?

## Task Backlog
- GPU instancing for nodes and edges if draw-call limits become the primary bottleneck.
- Optional edge bundling upgrade strategy if current implementation is insufficient.
- Optional “render graph as 2.5D” mode for lower GPU cost than full 3D.

## Parallel / Unblock Options
- Edge style design can proceed in parallel with animation profile design.
- Label LOD improvements can proceed independently of edge flow work.
- Demos/docs can begin once contracts are drafted, even before implementation finalizes.

