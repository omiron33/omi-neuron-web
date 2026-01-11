# Style Mapping Contract (Phase 4C.6)

This document defines how node/edge styles are computed in Phase 4C.

Goals:
- Provide a “simple mode” that covers most needs (static config + mapping rules).
- Provide an “advanced mode” for power users (resolver callbacks).
- Keep behavior deterministic, testable, and safe under performance constraints.

---

## Two configuration modes

### Mode A — Static options (recommended default)

Use `rendering.nodes` / `rendering.edges` to configure:
- modes (sprite/mesh, straight/curved)
- mapping rules for size/opacity/width
- feature toggles (flow, arrows, label transitions)

Static options should be:
- easy to document
- easy to validate
- stable across releases

### Mode B — Resolver callbacks (advanced)

Use resolvers when static configuration cannot express what you need:
- per-node style decisions based on multiple fields
- conditional styling (e.g., highlight “insight” nodes differently)
- bespoke color rules that depend on metadata

Resolvers should be considered an escape hatch:
- they must be pure + deterministic
- they should not allocate heavily or perform expensive work per frame
- they should not rely on random values without an explicit seed

---

## Contract types (source of truth)

The canonical types live in `src/visualization/types.ts`:
- `NodeStyle`, `EdgeStyle`
- `NodeStyleResolver`, `EdgeStyleResolver`
- `NodeStyleOptions`, `EdgeStyleOptions`
- `RenderingOptions`

Constraints:
- Resolver return shapes are intentionally narrow in v1.
- Arbitrary materials/shaders are out of scope for v1.

---

## Precedence Rules (explicit)

When multiple inputs define the same “style intent”, precedence is:

1) **Preset defaults**
   - `DEFAULT_RENDERING_OPTIONS` + `rendering.preset`
2) **Theme**
   - `theme.colors`, `theme.effects`, `theme.animation` determine baseline look and timing
3) **Explicit `rendering.*` options**
   - `rendering.nodes`, `rendering.edges`, `rendering.labels`, `rendering.animations`
4) **Resolver override**
   - `rendering.resolvers.getNodeStyle(node)`
   - `rendering.resolvers.getEdgeStyle(edge)`

Note:
- Resolvers override static options because they are the most explicit and most specific.
- Performance mode + reduced motion are “hard gates” that may disable features even if requested.

---

## Determinism rules (for tests + demos)

Resolvers must:
- depend only on stable inputs:
  - node fields (`tier`, `domain`, `connectionCount`, `metadata.*`)
  - edge fields (`relationshipType`, `strength`, `label`)
  - stable configuration values
- avoid time-based changes (no `Date.now()` / `performance.now()` inside style computation)
- avoid random values unless a stable seed is injected by the caller

This is required so:
- demo screenshots remain stable
- future “visual baselines” can be compared meaningfully

---

## Examples

### Example 1 — Static mapping (no resolvers)

```tsx
import { NeuronWeb, DEFAULT_RENDERING_OPTIONS } from '@omiron33/omi-neuron-web/visualization';

<NeuronWeb
  graphData={{ nodes, edges }}
  rendering={{
    ...DEFAULT_RENDERING_OPTIONS,
    preset: 'subtle',
    nodes: {
      mode: 'sprite',
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
    edges: {
      mode: 'straight',
      opacity: {
        fromField: 'strength',
        inputMin: 0,
        inputMax: 1,
        outputMin: 0.15,
        outputMax: 0.8,
        clamp: true,
        curve: 'linear',
      },
    },
    labels: {
      visibility: 'auto',
      maxCount: 80,
      distance: 26,
      transitions: { enabled: false },
    },
    animations: {
      profile: 'subtle',
    },
  }}
/>;
```

### Example 2 — Resolver override (advanced)

```tsx
import type { NodeStyleResolver } from '@omiron33/omi-neuron-web/visualization';

const getNodeStyle: NodeStyleResolver = (node) => {
  if (node.tier === 'insight') {
    return { color: '#ffffff', scale: 1.35, opacity: 1 };
  }

  // Deterministic mapping from connection count.
  const normalized = Math.min(1, Math.max(0, node.connectionCount / 24));
  const scale = 0.95 + normalized * 0.55;
  return { scale, opacity: 0.82 };
};

<NeuronWeb
  graphData={{ nodes, edges }}
  rendering={{
    preset: 'cinematic',
    resolvers: { getNodeStyle },
  }}
/>;
```

---

## Implementation Guidance (internal)

When wiring this into renderers:
- Resolve styles at the lowest frequency that makes sense:
  - static mapping rules can be resolved once per node/edge on render/update
  - resolver outputs should be cached by node/edge id and invalidated only when:
    - the node/edge data changes
    - the rendering options change
- Avoid per-frame resolver calls; per-frame work should be animation-only, not style computation.
