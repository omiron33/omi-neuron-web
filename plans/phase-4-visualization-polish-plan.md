# Phase 4B: Visualization Polish Plan

## Outcomes
- Make NeuronWeb feel cinematic and alive with subtle, continuous motion.
- Improve readability by reducing visual density and clarifying focus states.
- Add hover cards with rich context and smooth transitions.
- Enhance click/focus interactions with satisfying animation sequences.
- Provide configurable visual effects and animation toggles via theme/settings.
- Maintain performance budgets across normal/degraded/fallback modes and respect reduced-motion.

## Scope

### In scope
- Ambient motion system (float, pulse, edge flow) with performance gating
- Hover card component anchored to nodes with slot-based content
- Click/focus animation sequence (camera tween, selection ring, edge emphasis)
- Layout de-densification controls (spacing, focus expansion, declutter modes)
- Postprocessing polish (bloom/vignette/grade) and background atmosphere
- Theme/config additions for animation + effects + density
- Visual/interaction regression demos and perf profiling
- Docs updates for new props and visuals

### Out of scope
- Full renderer rewrite (React Three Fiber, WebGPU)
- Custom shader authoring beyond Three.js examples
- VR/AR modes
- Real-time multi-user presence
- Server-driven layout computation

## Assumptions & Constraints
- Three.js remains a peer dependency; avoid heavy new runtime deps.
- Prefer additive config fields; no breaking changes to existing props.
- Effects are gated by performance mode and user preferences.
- Fallback2D continues to function without 3D-only effects.
- Hover cards use DOM overlays (CSS2DRenderer/HTML) for UI flexibility.
- Motion respects `prefers-reduced-motion` and can be disabled globally.

## Dependencies
- Existing SceneManager, NodeRenderer, EdgeRenderer, InteractionManager, AnimationController, ThemeEngine.
- Phase 6 visual tests scaffolding for validation.
- Layout utilities in `src/visualization/layouts`.

## Execution Phases

### Phase 1 – Discovery 🟥
- [ ] Audit current NeuronWeb visual baseline for density, motion, readability, and interaction affordances.
- [ ] Define visual targets and performance budgets for normal/degraded/fallback modes.
- [ ] Draft interaction/animation storyboard covering idle, hover, click, focus, and filter transitions.
- [ ] Define hover card data contract (fields, truncation rules, slots, and fallback content).

### Phase 2 – Design/Architecture 🟥
- [ ] Extend visualization config/theme schema for animation, density, and effects options.
- [ ] Design hover card system (anchoring, offset, pointer safety, z-order, and event flow).
- [ ] Design de-densification strategy (spacing, focus expansion, edge fading, cluster halos) and APIs.
- [ ] Plan postprocessing/effects pipeline (bloom/vignette/grade) with gating and fallback behavior.

### Phase 3 – Implementation 🟥
- [ ] Implement ambient node motion, pulsing, and edge-flow animations with performance gates.
- [ ] Implement hover card component with smooth enter/exit and pointer tracking.
- [ ] Implement click/focus animation sequence (camera tween, ripple, edge emphasis, detail panel sync).
- [ ] Implement density controls and layout spacing/focus expansion in layout utilities.
- [ ] Implement postprocessing and background polish per theme (stars, gradients, subtle fog).

### Phase 4 – Validation 🟥
- [ ] Add visual regression/demo scenes for new effects and interactions.
- [ ] Benchmark performance across node counts and tune gating thresholds.
- [ ] Validate accessibility: keyboard focus, contrast, and reduced-motion support.
- [ ] Update documentation and examples with new props and visuals.

## Risks & Mitigations
- Performance regressions from effects → Gate by mode, allow per-feature disable, default conservative.
- Visual clutter from too many effects → Provide presets and sensible defaults; keep effects subtle.
- Hover card overlap or jitter → Add hysteresis/lock on hover, clamp to viewport.
- Motion sickness/accessibility → Respect reduced-motion and expose global animation toggle.

## Open Questions
- Preferred visual direction (minimal, neon, cinematic, paper-like)?
- Are postprocessing effects acceptable as optional dependencies from `three/examples`?
- Any constraints on hover card content (length, fields, markdown)?
- Target maximum node count for “normal” mode after polish?

## Task Backlog
- Explore GPU instanced nodes for larger graphs (future optimization).

## Parallel / Unblock Options
- Hover card design can proceed in parallel with animation schema updates.
- Density strategy can be designed in parallel with effects pipeline.
- Validation prep can start once implementation tasks are scoped.
