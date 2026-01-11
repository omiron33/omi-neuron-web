# Rendering Options v1 (Phase 4C.2)

This document defines the **v1 option surface** for “rendering depth” in Phase 4C.

Design goals:
- Make richer rendering/animation **declarative** and **type-safe**.
- Provide **presets first**, then **advanced overrides**.
- Keep defaults conservative and aligned to `docs/visualization/performance-budgets.md`.
- Keep changes additive: existing `NeuronWebProps` and theme overrides continue to work unchanged.

---

## Concept: a single `rendering` container (proposed)

Current control surfaces are spread across:
- `theme` (colors/effects/animation constants)
- `performanceMode` (normal/degraded/fallback gating)
- `density` (spread + edge fade + label caps)

Proposed: introduce a single optional prop:

```ts
// Proposed (final naming decided in Phase 4C.5)
export interface NeuronWebProps {
  rendering?: RenderingOptions;
}
```

The intent is not to replace `theme`, `density`, or `performanceMode` immediately, but to provide a **home for “how it’s drawn and animated”** decisions:
- node/edge/label rendering modes
- mapping rules and resolvers
- animation profiles and transition rules
- performance gates for “depth” features

---

## Presets (the default adoption path)

### Preset names (recommended)
- `minimal` — safe, low-motion, legible defaults; avoids heavy rendering features.
- `subtle` — richer than minimal; tasteful motion; conservative gating.
- `cinematic` — maximum “alive” feel in normal mode; strict auto-gating as density increases.

Recommended additional profile for animations:
- `off` — used when user explicitly disables animations (or reduced motion forces it).

Canonical snippet (presets-first):

```tsx
import { NeuronWeb, DEFAULT_RENDERING_OPTIONS } from '@omiron33/omi-neuron-web/visualization';

export function MyGraph() {
  return (
    <NeuronWeb
      graphData={{ nodes: [], edges: [] }}
      rendering={{
        ...DEFAULT_RENDERING_OPTIONS,
        preset: 'subtle',
      }}
    />
  );
}
```

---

## Proposed Type Shape (v1)

This is a **design target**; final code lives in `src/visualization/types.ts` (or a new `src/visualization/rendering/*` module).

```ts
import type { NeuronVisualNode, NeuronVisualEdge } from '@omiron33/omi-neuron-web';

export type RenderingPreset = 'minimal' | 'subtle' | 'cinematic';

export type NodeRenderMode = 'sprite' | 'mesh';
export type EdgeRenderMode = 'straight' | 'curved';

export type AnimationProfile = 'off' | 'minimal' | 'subtle' | 'cinematic';

export interface RenderingResolvers {
  getNodeStyle?: (node: NeuronVisualNode) => NodeStyle;
  getEdgeStyle?: (edge: NeuronVisualEdge) => EdgeStyle;
}

export interface RenderingOptions {
  preset?: RenderingPreset;
  nodes?: NodeStyleOptions;
  edges?: EdgeStyleOptions;
  labels?: LabelOptions;
  animations?: AnimationOptions;
  performance?: RenderingPerformanceOptions;
  resolvers?: RenderingResolvers;
}

export interface NodeStyleOptions {
  mode?: NodeRenderMode;
  size?: NumberMappingRule;
  opacity?: NumberMappingRule;
  glow?: { enabled?: boolean; intensity?: number };
  selection?: { scale?: number; highlightColor?: string };
  hover?: { scale?: number };
}

export interface EdgeStyleOptions {
  mode?: EdgeRenderMode;
  width?: NumberMappingRule;
  opacity?: NumberMappingRule;
  arrows?: { enabled?: boolean; scale?: number };
  flow?: {
    enabled?: boolean;
    speed?: number;
    mode?: 'pulse' | 'dash';
    dashSize?: number;
    gapSize?: number;
  };
  curve?: { tension?: number; segments?: number };
}

export interface LabelOptions {
  visibility?: 'auto' | 'interaction' | 'none';
  maxCount?: number;
  distance?: number;
  tiers?: Partial<Record<NodeTier, 'always' | 'auto' | 'none'>>;
  transitions?: { enabled?: boolean; durationMs?: number };
}

export interface AnimationOptions {
  profile?: AnimationProfile;
  enableCameraTween?: boolean;
  focusDurationMs?: number;
  transitionDurationMs?: number;
  easing?: 'linear' | 'easeInOut' | 'easeOut';
}

export interface RenderingPerformanceOptions {
  // Fine tuning for auto gating; does not override explicit performanceMode.
  normalMaxNodes?: number;
  degradedMaxNodes?: number;
}

export interface NumberMappingRule {
  // Static value (easy mode).
  value?: number;
  // Map from a numeric field (e.g. strength/confidence/connectionCount).
  fromField?: 'connectionCount' | 'strength' | 'confidence';
  inputMin?: number;
  inputMax?: number;
  outputMin?: number;
  outputMax?: number;
  clamp?: boolean;
  curve?: 'linear' | 'sqrt' | 'log';
}

export interface NodeStyle {
  color?: string;
  scale?: number;
  opacity?: number;
  // Intentionally constrained; v1 avoids arbitrary materials/shaders.
}

export interface EdgeStyle {
  color?: string;
  opacity?: number;
  width?: number;
  dashed?: boolean;
}
```

---

## Option Catalog (v1 “what exists”)

This list is intentionally constrained to avoid “an infinite knob surface”.

### Nodes
- `nodes.mode` (default: `sprite`)
  - `sprite`: current behavior (glow sprite, scale mapping).
  - `mesh`: renders nodes as lightweight meshes (gated to `normal` mode by default).
- `nodes.size`
  - Default mapping is tier-based (existing behavior).
  - v1 adds optional mapping from `connectionCount` (common user request).
- `nodes.opacity`
  - Keep a conservative default; allow optional mapping from metadata fields.
- `nodes.hover` / `nodes.selection`
  - Preserve current default hover/selected scales.

Example: opt into mesh nodes (normal-mode only by default)
```tsx
<NeuronWeb graphData={{ nodes, edges }} rendering={{ nodes: { mode: 'mesh' } }} />
```

Example: scale nodes from connection count (deterministic)
```tsx
<NeuronWeb
  graphData={{ nodes, edges }}
  rendering={{
    nodes: {
      size: {
        fromField: 'connectionCount',
        inputMin: 0,
        inputMax: 24,
        outputMin: 0.95,
        outputMax: 1.6,
        clamp: true,
        curve: 'sqrt',
      },
    },
  }}
/>
```

### Edges
- `edges.mode` (default: `straight`)
  - `curved` is opt-in and gated by performance mode.
- `edges.opacity`
  - Default mapping from `strength`, clamped.
- `edges.width`
  - v1 can expose width rules, but implementation must be careful:
    - `LineBasicMaterial` linewidth isn’t portable.
    - prefer “supported width mechanisms” with clear docs.
- `edges.arrows`
  - opt-in; directionality should be visible without overwhelming.
- `edges.flow`
  - opt-in; disabled by default in `degraded`/`fallback`.

### Labels
- `labels.visibility` (default: `auto`)
- `labels.maxCount` and `labels.distance` (defaults derived from performance mode + density)
- `labels.tiers`
  - Optional tier-aware label rules to keep behavior deterministic (no collision system required).
  - Example: always prioritize `primary` and `insight`, suppress `tertiary` in dense views.
- `labels.transitions`
  - v1 adds fade/scale transitions for LOD changes (optional, gated).

### Animations
- `animations.profile` (default: preset-derived)
- `animations.enableCameraTween` (default: current `theme.animation.enableCameraTween`)
- `animations.focusDurationMs`, `animations.transitionDurationMs`, and `animations.easing`

---

## Precedence Rules (proposed)

To avoid “mystery behavior”, v1 should be explicit:

1) **Hard gates**
   - `prefers-reduced-motion` is the top-level motion governor.
   - `performanceMode === 'fallback'` disables heavy features regardless of other options.
2) **Preset**
   - `rendering.preset` sets a baseline option set (nodes/edges/labels/animations).
3) **Explicit `rendering.*` overrides**
   - Specific options override preset values.
4) **Existing props**
   - `density` remains the primary high-level “declutter” knob.
   - `theme` remains the primary “look and feel” knob (colors/typography/effects intensities).

If an option is specified in both `density` and `rendering.labels`, the v1 recommendation is:
- `rendering.labels.*` wins (more explicit), but defaults should continue to derive from `density` when `rendering.labels` is absent.

---

## Theme vs Rendering (what belongs where)

To keep APIs predictable:
- `theme` controls **visual identity**:
  - colors, typography
  - effect intensities (bloom strength, fog range, etc.)
  - default animation constants (durations, base scales)
- `rendering` controls **structural rendering behavior**:
  - what geometry modes are used
  - which mapping rules apply
  - which features are enabled under which performance/motion gates
  - which transitions/animation profiles are active

---

## Preset Matrices (recommended defaults)

These defaults are intended to align with the existing budget matrix in `docs/visualization/performance-budgets.md`.

### `minimal`
- Nodes: sprite, conservative glow, minimal hover/selection scaling.
- Edges: straight, no arrows, no flow.
- Labels: interaction-only in normal; off in degraded/fallback.
- Animations: profile `minimal` (no ambient drift; short camera tweens).

### `subtle`
- Nodes: sprite, ambient drift in normal (small amplitude), selection ripple enabled in normal/degraded.
- Edges: straight by default, optional low-cost emphasis on focus.
- Labels: auto distance+max count in normal, interaction-only in degraded.
- Animations: profile `subtle`.

### `cinematic`
- Nodes: sprite by default; allow mesh mode in normal for primary/insight nodes only (if implemented).
- Edges: allow curved edges in normal (gated), optional flow.
- Labels: auto in normal with LOD transitions; capped.
- Animations: profile `cinematic` in normal; auto-degrades to `subtle`/`minimal` with density.

---

## Code Touchpoints (where this lives)

Planned/implemented locations for the Phase 4C contract:
- Types:
  - `src/visualization/types.ts` (`RenderingOptions`, `NodeStyleOptions`, `EdgeStyleOptions`, `AnimationProfile`, resolver signatures)
- Defaults:
  - `src/visualization/constants.ts` (`DEFAULT_RENDERING_OPTIONS`)
- Exports:
  - `src/visualization/index.ts` (visualization entry point)

---

## Documentation Touchpoints (what should be updated)

As Phase 4C moves from design → implementation, update these docs:
- `docs/component-props.md` — document `rendering?: RenderingOptions` and show presets-first usage.
- `docs/visualization/performance-budgets.md` — extend the mode matrix to cover curves/arrows/flow/label transitions.
- `docs/visualization/rendering-options-v1.md` — keep this as the canonical contract.
- `README.md` — add one “copy/paste preset” snippet for quick adoption.
