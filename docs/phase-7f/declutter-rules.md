# Phase 7F — Declutter + LOD Rules (Design Draft)

This document defines recommended **label LOD** and **edge declutter** rules, and how they map onto the existing `NeuronWeb` configuration surfaces:
- `NeuronWebProps.density` (density presets + threshold knobs)
- `NeuronWebProps.rendering.labels` (label policy)
- `NeuronWebProps.performanceMode` / `rendering.performance` (mode selection thresholds)

## Guiding Principles

1. **Predictability over cleverness**
   - Consumers should be able to answer: “Why are labels hidden?” or “Why did edges disappear?”

2. **Defaults should scale**
   - “Normal” mode should look rich by default.
   - “Degraded” mode should remain usable and interactive.
   - “Fallback” mode should prioritize responsiveness above all else.

3. **Always show what the user is interacting with**
   - Hovered/selected nodes should have labels even when global labels are capped.

## Density Presets (current behavior)

`NeuronWeb` currently derives defaults from `density.mode`:

| Mode | `spread` | `edgeFade` | `focusExpansion` | `minEdgeStrength` |
|---|---:|---:|---:|---:|
| `relaxed` | 1.2 | 0.2 | 0.18 | 0.00 |
| `balanced` | 1.0 | 0.35 | 0.12 | 0.05 |
| `compact` | 0.9 | 0.5 | 0.08 | 0.15 |

Notes:
- `spread` influences layout spacing (more spread = less overlap).
- `edgeFade` is applied as a focus fade opacity multiplier (non-focused edges).
- `minEdgeStrength` hides weak edges below the threshold.

## Label LOD Rules

### Existing controls
Labels can be governed by:
- `density.labelVisibility` (`auto | interaction | none`)
- `density.labelMaxCount` (cap)
- `density.labelDistance` (distance threshold)
- `rendering.labels` overrides:
  - `visibility`, `maxCount`, `distance`
  - `tiers` via `LabelTierRules` (`primary|secondary|tertiary|insight → always|auto|none`)

The renderer already guarantees:
- hovered/selected labels win even under caps
- tier rules can force visibility (`always`) or suppress (`none`)

### Recommended default label policy (v1)

**Normal**
- `labels.visibility`: `auto`
- `labels.maxCount`: 80 (cap)
- `labels.distance`: 26
- `labels.tiers`:
  - `primary`: `always`
  - `insight`: `always`
  - `secondary`: `auto`
  - `tertiary`: `auto`

**Degraded**
- `labels.visibility`: `interaction` (hover/selected only)
- `labels.maxCount`: 0 (ignored under `interaction`)
- `labels.distance`: 0 (ignored under `interaction`)
- `labels.tiers`: optional (not required)

**Fallback**
- `labels.visibility`: `none` by default
  - consumers can opt in to `interaction` if desired

Rationale:
- Degraded mode should keep labels available for interaction without paying the constant DOM cost of always-on labels.
- Fallback mode should avoid CSS2D label overhead by default.

### Throttling recommendation (future optimization)
If label updates become a hotspot at higher node counts:
- compute label visibility every N frames (e.g. every 2–4 frames)
- keep hover/selection label updates immediate

## Edge Declutter Rules

### Existing controls
Edges are controlled via:
- `density.minEdgeStrength` (hard cutoff)
- `density.edgeFade` (non-focused opacity scaling)
- `rendering.edges.mode` (curved edges are gated to `normal` mode)

### Recommended default edge policy (v1)

**Normal**
- allow curved edges only when requested (`rendering.edges.mode = 'curved'`)
- default `minEdgeStrength` comes from density mode

**Degraded**
- force `rendering.edges.mode = 'straight'`
- prefer `density.mode = 'compact'` by default (or auto mapping)

**Fallback**
- keep `minEdgeStrength` elevated (e.g. >= 0.15) unless user overrides
- disable flow + arrows + transitions

## Interaction Semantics

When a node is selected:
- show connected edges at full opacity
- fade other edges by `edgeFade`

When no node is selected:
- render edges at their base opacity (scaled by strength if enabled)

## Design Outputs (Phase 7F)

This document is intended to be the “single source of truth” for:
- how density presets map to renderer behavior
- what defaults are used per performance mode
- which parts can be overridden by consumers (and which are gated for safety)

