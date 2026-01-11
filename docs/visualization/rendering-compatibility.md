# Rendering + Animation Compatibility Notes (Phase 4C.4)

This document captures the compatibility constraints that must be respected while adding Phase 4C rendering + animation depth.

The primary consumers are Next.js apps; the visualization layer must remain safe and predictable under:
- Next.js client/server boundaries
- reduced-motion settings
- performance gating (normal/degraded/fallback)
- browser capability constraints (WebGL availability)

---

## Next.js / SSR constraints

### 1) `NeuronWeb` is a client component
- `src/visualization/NeuronWeb.tsx` begins with `'use client'`.
- Consumers should only render `NeuronWeb` from **client components**.

### 2) Avoid server-side evaluation of Three.js modules
This repository exports visualization modules from `src/visualization/index.ts`, including:
- `NeuronWeb`
- `SceneManager` (imports `three/examples/*`)
- `ThemeEngine`

Guidance:
- In Next.js, keep visualization imports inside client components, or use dynamic import with `ssr: false`.
- For shared types, use **type-only imports**:

```ts
import type { NeuronWebProps } from '@omiron33/omi-neuron-web/visualization';
```

### 3) Do not require secrets in the browser
Phase 4C should not introduce any configuration that implies API keys are needed in `NeuronWeb` or any browser code path.

---

## Browser capability constraints

### WebGL availability
Current behavior:
- `SceneManager` always creates a `THREE.WebGLRenderer`.
- There is no current “no WebGL” detector or 2D fallback renderer in `src/visualization/fallback/` (the folder exists but is empty).

Phase 4C constraints:
- Any new rendering feature must fail gracefully if WebGL is unavailable or context is lost.
- If Phase 4C introduces optional rendering modes (mesh/curves/arrows/flow), they must:
  - be disabled by default outside `normal` mode
  - have a clear “no-op or degrade” behavior when unsupported

### Context loss
Current:
- `SceneManager` has `onContextLost`/`onContextRestored` placeholders, but they are not wired to renderer events yet.

Constraint:
- New animation/rendering systems should not assume context stability; features should tolerate re-init without leaking resources.

---

## Performance mode behavior (current and required)

Performance modes are a first-class contract:
- `normal` — full experience
- `degraded` — reduce density + expensive effects
- `fallback` — safest/lowest-feature state for large graphs

Current gating in `NeuronWeb` includes:
- starfield count reduced by mode (none in fallback)
- postprocessing normal-only
- hover/click cards disabled in fallback
- ambient motion and edge flow normal-only (also disabled with reduced motion)
- labels default to normal-only (distance/max count defaults to 0 outside normal)

Phase 4C constraints:
- New rendering depth features (curves/arrows/flow/mesh/label transitions) must be gated by mode.
- Default behavior should remain conservative; consumers can opt in explicitly.

---

## Reduced motion (`prefers-reduced-motion`)

Current reduced motion handling:
- `NeuronWeb` uses `matchMedia('(prefers-reduced-motion: reduce)')`.
- When enabled, it disables:
  - ambient node drift
  - edge flow pulse
  - hover scale and selection pulse (per current gating)
  - hover card slide distance (fade-only)

Phase 4C constraints:
- Any new animation (camera tweens, transitions, flow, ambient effects) must respect reduced motion.
- Prefer a single “global” motion governor:
  - reduced motion should clamp profile to `off` or `minimal`
  - transitions should become fade-only or snap (explicit policy)

---

## Fallback behavior definition (Phase 4C baseline)

Because a true 2D fallback renderer does not exist yet, treat `fallback` today as:
- WebGL is still used, but **expensive features are disabled**.

If a 2D fallback is introduced later, Phase 4C features must still be compatible:
- `rendering` options should either:
  - no-op in fallback, or
  - provide a documented reduced feature set in fallback

---

## Compatibility checklist (for every Phase 4C PR)

- [ ] No breaking changes to existing `NeuronWebProps`.
- [ ] `NeuronWeb` continues to render in Next.js client components.
- [ ] Type-only imports remain safe in shared code.
- [ ] Reduced motion disables continuous animations (ambient motion + edge flow + pulsing).
- [ ] `degraded` and `fallback` modes auto-disable any new expensive rendering option.
- [ ] No memory leaks: geometries/materials/textures are disposed or reused appropriately.

