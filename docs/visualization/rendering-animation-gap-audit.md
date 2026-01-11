# Rendering + Animation Gap Audit (Phase 4C.1)

This document audits the current rendering/animation capabilities in `src/visualization/*` and identifies the highest-impact gaps to address in Phase 4C (Rendering + Animation Depth).

Primary goal: make follow-on Phase 4C work target the highest leverage improvements with clear performance + compatibility constraints.

---

## Current Capabilities (What exists today)

### Scene + camera
- `SceneManager` (`src/visualization/scene/scene-manager.ts`)
  - WebGL renderer + OrbitControls + CSS2DRenderer labels.
  - Optional starfield (`Points`) and fog.
  - Optional postprocessing pipeline via `EffectComposer` with:
    - RenderPass
    - UnrealBloomPass (optional)
    - Vignette/grade ShaderPass (optional)
    - Gamma correction pass
  - Per-container ResizeObserver support.
- Camera motion / tweening
  - `AnimationController` currently supports **camera focus tween** only:
    - `focusOnNode()` and `focusOnPosition()` with easing (`linear | easeInOut | easeOut`).
  - Several animation methods exist as stubs (`animateNodeAppear`, `animateNodesFilter`, etc.) and do not run today.

### Node rendering
- `NodeRenderer` (`src/visualization/scene/node-renderer.ts`)
  - Renders nodes as **Three.js `Sprite`** using a canvas-generated glow texture.
  - Tier scaling (`primary`, `secondary`, `tertiary`, `insight`) via `tierScales`.
  - Domain color mapping: `domainColors[node.domain] ?? defaultColor`.
  - Hover + selection visuals:
    - hover scale (optional gating)
    - selected scale
    - one-shot selection pulse (optional gating)
  - Ambient motion:
    - per-node sinusoidal drift via `computeAmbientDrift()` (optional gating).
  - Node labels:
    - CSS2D-based label objects (DOM) created per node (optional gating).
    - Label LOD is **distance + max count**, sorted by distance.
    - Label “interaction only” mode: labels are visible only when hovered/selected.
    - No dedicated label fade/scale transitions; visibility toggles are immediate.

### Edge rendering
- `EdgeRenderer` (`src/visualization/scene/edge-renderer.ts`)
  - Renders edges as **straight `THREE.Line`** with `LineBasicMaterial`.
  - Opacity can scale with edge strength.
  - Focus behavior:
    - When a focus set exists, focused edges brighten/pulse and non-focused edges fade.
  - “Flow” today is a **simple opacity pulse** (sinusoidal), not a directional dash/texture scroll.
  - No support today for:
    - curved edges
    - variable width per edge (LineBasicMaterial width isn’t reliable cross-platform)
    - arrowheads/directionality
    - bidirectional edge handling

### Interactions + overlays
- `InteractionManager` (`src/visualization/interactions/interaction-manager.ts`)
  - Raycaster-based hover + click for nodes; edge click when no node hit.
  - Hover delay / double click logic exists, but in `NeuronWeb` double click is currently disabled (`doubleClickEnabled = false`).
  - Keyboard navigation hooks exist (`onKeyDown`) but are not implemented.
  - Line picking uses `raycaster.params.Line.threshold`.
- `NeuronWeb` (`src/visualization/NeuronWeb.tsx`)
  - Hover card and click card are **DOM overlays** positioned each frame from world→screen projection.
  - Filter/visibility transitions:
    - a global scene overlay animation (opacity/scale/blur) when `visibleNodeSlugs` changes.
  - Study path / story beats:
    - Plays steps; focuses camera; pulses selection; optionally shows selection ripple.

### Performance + reduced motion gating (current)
- Performance modes exist: `auto | normal | degraded | fallback`.
  - Auto thresholds are currently hard-coded in `NeuronWeb`:
    - `normal` ≤ 180 nodes
    - `degraded` 181–360 nodes
    - `fallback` > 360 nodes
- Current gating behavior in code (high-level):
  - Labels are effectively normal-only by default (labelDistance/max count default to 0 when degraded).
  - Starfield count scales by mode; none in fallback.
  - Postprocessing is normal-only (disabled outside normal).
  - Hover + click cards are disabled in fallback.
  - Ambient motion and edge flow are normal-only and disabled for reduced motion.

---

## High-Impact Gaps (What’s missing for Phase 4C)

### 1) Declarative rendering options contract (biggest leverage)
Today, rendering behavior is split across:
- `NeuronWebProps` (`performanceMode`, `density`, `theme`, `domainColors`, cards props)
- internal defaults in `NeuronWeb`
- `NodeRenderConfig` and `EdgeRenderConfig` passed to renderers

Gap: there is **no single, typed, declarative “rendering options” contract** that:
- can be expressed as presets (minimal/subtle/cinematic/off)
- supports simple static configuration AND advanced per-node/per-edge resolvers
- clearly defines precedence between `theme`, `density`, `performanceMode`, reduced-motion, and overrides

### 2) Edge rendering depth
Biggest missing edge features (in descending order of leverage):
- Curved edges (quadratic/cubic) for readability in dense graphs.
- Directionality (arrowheads or directional styling).
- True “flow” animation (dash offset / highlight sweep) rather than opacity pulse.
- Width/opacity mapping rules from `strength` / `confidence` with predictable clamping.

### 3) Label behavior under density
Current label LOD is distance + max count, but:
- there are no fade transitions (labels pop in/out)
- there are no per-tier/per-node “label importance” rules
- there is no explicit “caps by mode” contract beyond what `NeuronWeb` implicitly does

### 4) Animation profile / preset system
Currently, animation is controlled by a mix of theme numbers + boolean gates.
Gap: a profile system that answers:
- “what animations are enabled in minimal/subtle/cinematic/off?”
- “how do durations/easing change across performance modes?”
- “what does reduced motion override do exactly?”

### 5) Transition primitives for graph updates/layout changes
The component has a global blur/scale transition for filtering, but there is no system for:
- node/edge enter/exit transitions
- smooth layout transitions (interpolating positions rather than teleport)
- cancellation if a new update arrives mid-transition

### 6) Missing fallback behavior definition
Plans mention “Fallback2D”, but today the codebase implements “fallback mode” as feature gating, not a separate 2D renderer.
Gap: explicitly define what “fallback” means today and what is expected in Phase 4C:
- which features no-op
- what the user experience should be
- what is considered acceptable for SSR/import safety

---

## Prioritized Gap List (Impact × Feasibility)

Legend:
- Impact: 🟢 high / 🟡 medium / 🔵 low
- Complexity: 🟢 low / 🟡 medium / 🔴 high
- Perf risk: 🟢 low / 🟡 medium / 🔴 high

| Gap | Impact | Complexity | Perf risk | Notes |
| --- | --- | --- | --- | --- |
| Typed rendering options contract + presets | 🟢 | 🟡 | 🟢 | Foundation for all other work |
| Label LOD contract + fade transitions | 🟢 | 🟡 | 🟡 | Big UX improvement; careful DOM cost |
| Edge width/opacity mapping rules | 🟢 | 🟢 | 🟢 | Mostly math + config; low risk |
| Curved edges (bezier) | 🟢 | 🟡 | 🟡 | Needs gating + segmentation controls |
| Arrowheads + bidirectional styling | 🟡 | 🟡 | 🟡 | Visual payoff; must be optional |
| True edge flow animation | 🟡 | 🟡 | 🔴 | Can be expensive; disable by default outside normal |
| Animation profile system | 🟡 | 🟡 | 🟢 | Mostly configuration + wiring |
| Layout / graph update transition primitives | 🟡 | 🔴 | 🔴 | Needs careful lifecycle + cancellation |
| Resolver callbacks (getNodeStyle/getEdgeStyle) | 🟡 | 🟡 | 🟡 | Powerful but easy to misuse; strict docs needed |

---

## Recommended Implementation Sequence (Phase 4C)

This maps directly to the Phase 4C plan tasks:

1) **Write contracts first (docs + types)**:
   - `rendering-options-v1.md` (option catalog + presets)
   - `style-mapping-contract.md` (static options + resolvers + precedence)
   - `animation-profiles.md` (profile matrix + reduced-motion policy)
   - `edge-rendering-modes.md` (curves/arrows/flow design + gating)
   - `rendering-compatibility.md` (SSR + fallback semantics)

2) **Add a single “rendering options” entry point** (additive, safe default):
   - new `rendering?: RenderingOptions` prop (or theme extension) that merges with existing behavior.
   - ensure “no options provided” keeps current visuals.

3) **Implement the lowest-risk depth improvements**:
   - label LOD transitions (fade/scale) + explicit caps by mode
   - edge width/opacity mapping (even if width remains limited to a small set of supported mechanisms)

4) **Implement medium-risk upgrades with strict gating**:
   - curved edges as an opt-in mode
   - arrowheads/directionality as opt-in

5) **Leave high-risk transitions and advanced animation as last**:
   - per-node enter/exit animations
   - layout interpolation transitions
   - full flow animations

---

## Explicit “Not in Phase 4C” (to prevent scope creep)

- Custom shader authoring beyond Three.js built-ins and small `three/examples` utilities.
- Full renderer rewrite (React Three Fiber / WebGPU).
- Real-time multi-user collaboration or server-driven layout.
- A full “render pipeline abstraction” unless options + resolvers prove insufficient.

