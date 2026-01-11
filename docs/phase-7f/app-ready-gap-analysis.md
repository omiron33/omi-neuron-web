# Phase 7F — “App-Ready” Gap Analysis (Discovery Draft)

This document summarizes what Phase 4B/4C already delivered for `NeuronWeb`, and what still tends to be missing when teams try to ship a real “explorer” experience (search / filters / panels / density presets) without rebuilding UI scaffolding in every app.

## What we already have (strong baseline)

### Visual + interaction polish (Phase 4B)
From the Phase 4B plan and current implementation:
- Ambient motion + “cinematic” feel (gated by performance mode + reduced motion)
- Hover cards + click cards (DOM overlays)
- Camera fit options + camera tween focus behavior
- Density strategy knobs (`density.mode`, `minEdgeStrength`, edge fade)
- Effects pipeline + postprocessing toggles (bloom/vignette/grade), with performance gating
- Accessibility considerations (`prefers-reduced-motion`, contrast targets in docs)

Key related docs:
- `docs/visualization/density-strategy.md`
- `docs/visualization/performance-budgets.md`
- `docs/component-props.md` (especially density + rendering options)

### Rendering and animation depth (Phase 4C)
Phase 4C expanded:
- rendering presets and deeper style mapping
- more rendering/animation profiles for different performance envelopes

Key docs:
- `docs/visualization/rendering-options-v1.md`
- `docs/visualization/animation-profiles.md`

### Basic “headless” control surfaces exist
`NeuronWeb` already supports several explorer-adjacent control hooks:
- `visibleNodeSlugs` for filtering what is rendered
- `focusNodeSlug` for programmatic focus
- controlled selection (`selectedNode`)
- domain color overrides (`domainColors`)
- density + performance mode options

## What’s still missing for “app-ready” usage

### 1) A reusable explorer wrapper (UI scaffolding)
Even with a headless renderer, most apps need:
- search box + results list (label search + semantic search)
- filter controls (domain/nodeType/relationshipType/cluster)
- selection detail panel (node metadata + actions)
- legend panel (domain colors, edge meanings, active filters)

These can be built externally today, but it’s repetitive and easy to get subtly wrong (filter semantics, selection wiring, focus behaviors).

### 2) A standardized “filters → graph” mapping contract
Today, consumers must decide how filters map into:
- `visibleNodeSlugs`
- `density` / `minEdgeStrength`
- which edges remain when nodes are filtered (induced subgraph vs. strict endpoints)

The library should provide:
- a predictable default strategy
- hooks/utilities for deriving `visibleNodeSlugs` from filter state

### 3) Predictable LOD behavior at scale
There are already label visibility controls (`labelVisibility`, `labelTierRules`, caps), but app-ready usage needs:
- documented defaults per performance mode
- deterministic “what happens when graph grows” behavior
- possibly a throttling strategy for label visibility calculations

### 4) Edge declutter options beyond a single threshold
Current density knobs include a `minEdgeStrength` threshold and fades.
Explorer-scale graphs often need:
- “focus fade”: de-emphasize non-focused edges more aggressively
- per-relationship-type visibility toggles
- optional bundling as a backlog item (if feasible without heavy deps)

### 5) First-class “performance mode presets” for common ranges
Even though `performanceMode` exists, app-ready usage benefits from:
- named presets that set multiple things at once:
  - label policy
  - effects gating
  - edge rendering mode (straight vs curved)
  - animation profile

This makes it easier for consumers to get stable behavior without tuning 10 knobs.

## Recommended Phase 7F direction

### Explorer UX
Ship an optional `NeuronWebExplorer` wrapper that:
- composes `NeuronWeb`
- provides slot hooks for UI customization
- integrates with `useNeuronGraph` / `useNeuronSearch` by default
- does not impose styling

### Scale knobs
Focus on predictable defaults:
- label LOD rules (tier + distance + caps) by performance mode
- edge declutter controls that map into `density` and rendering options
- presets for normal / degraded / fallback

## Deliverables produced in Phase 7F Discovery
- `docs/phase-7f/explorer-api.md` — minimal explorer UX scope + target API surface
- `docs/phase-7f/scalability-benchmarks.md` — benchmark plan + bottleneck analysis

