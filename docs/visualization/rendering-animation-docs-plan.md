# Rendering + Animation Docs Plan (Phase 4C.10)

This document defines where Phase 4C docs live and establishes canonical usage snippets so the API remains discoverable and stable.

Goals:
- Presets-first documentation: “copy/paste to get started”.
- Advanced overrides documented separately (resolvers, mapping rules, performance gates).
- Keep “what does this do in degraded/fallback?” explicit.

---

## Doc Locations (file-level targets)

### API Reference (consumer-facing)
- `docs/component-props.md`
  - Add `rendering?: RenderingOptions` section.
  - Document presets (`minimal/subtle/cinematic`) and how they interact with:
    - `performanceMode`
    - `density`
    - reduced motion
  - Include the canonical snippet (below).

- `README.md`
  - Add a “Rendering presets” snippet in the visualization section.
  - Keep it short (one example + link to deeper docs).

### Conceptual + Design Docs (Phase 4C)
- `docs/visualization/rendering-options-v1.md`
  - Canonical contract description and option catalog (already exists).
- `docs/visualization/style-mapping-contract.md`
  - Static vs resolver mode + precedence rules (already exists).
- `docs/visualization/edge-rendering-modes.md`
  - Curves/arrows/flow design + gating table (already exists).
- `docs/visualization/animation-profiles.md`
  - Profiles matrix + reduced-motion policy (already exists).
- `docs/visualization/rendering-compatibility.md`
  - SSR + fallback + capability constraints (already exists).
- `docs/visualization/performance-budgets.md`
  - Keep the authoritative mode matrix + thresholds; ensure Phase 4C features are included (updated).

### Demos / Examples (adoption-oriented)
- `examples/basic-usage/` (or the existing example entry)
  - Add 3 presets:
    - minimal
    - subtle
    - cinematic
  - Add one advanced resolver demo (deterministic).
  - Add a note on how to toggle performanceMode and reduced motion for testing.

---

## Canonical Usage Snippet (presets-first)

This snippet should be reused (verbatim) in:
- `docs/component-props.md`
- `README.md` (or a condensed version)
- `docs/visualization/rendering-options-v1.md` (as the “happy path”)

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

## Required Examples (minimum set)

### 1) Minimal preset
```tsx
<NeuronWeb graphData={{ nodes, edges }} rendering={{ preset: 'minimal' }} />
```

### 2) Subtle preset (default recommendation)
```tsx
<NeuronWeb graphData={{ nodes, edges }} rendering={{ preset: 'subtle' }} />
```

### 3) Cinematic preset (normal-mode only richness)
```tsx
<NeuronWeb graphData={{ nodes, edges }} rendering={{ preset: 'cinematic' }} />
```

### 4) Advanced resolver example (deterministic)
```tsx
<NeuronWeb
  graphData={{ nodes, edges }}
  rendering={{
    preset: 'subtle',
    resolvers: {
      getNodeStyle: (node) => (node.tier === 'insight' ? { scale: 1.3, opacity: 1 } : {}),
    },
  }}
/>
```

---

## Documentation Checks (Definition of done for Phase 4C docs)

- [ ] Presets are documented first (before listing every knob).
- [ ] Every “depth feature” has a clear gating statement:
  - normal vs degraded vs fallback
  - reduced motion behavior
- [ ] At least one end-to-end snippet compiles against published types.
- [ ] `docs/visualization/performance-budgets.md` is the single source of truth for the mode matrix.

