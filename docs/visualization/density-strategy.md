# Density Strategy + API Design

## Goals
- Reduce visual clutter at high node counts.
- Preserve legibility for key nodes and relationships.
- Offer predictable modes for consumers (relaxed/balanced/compact).

## Spacing Strategies

1. **Global Scale (Spread):** Apply a multiplier to layout radius and jitter.
   - `spread`: 1.0 (balanced), 1.15 (relaxed), 0.9 (compact)
2. **Cluster Expansion:** If clusters exist, push cluster centroids apart.
3. **Local Focus Spread:** When a node is selected, push nearby nodes outward by 8–20%.

## Declutter Rules

- **Edges:**
  - Fade edges not connected to hovered/selected nodes to 20–40% opacity.
  - Apply minimum strength threshold for visibility in dense modes.
- **Labels:**
  - Defaults are performance-mode aware:
    - `normal` → labels on by default (distance + max count; `labelVisibility: 'auto'`)
    - `degraded` → interaction-only by default (`labelVisibility: 'interaction'`)
    - `fallback` → off by default (`labelVisibility: 'none'`)
  - Cap visible labels based on distance and max count (when labels are enabled).
  - Prefer `rendering.labels` for precise control:
    - `rendering.labels.visibility` overrides `density.labelVisibility`
    - `rendering.labels.tiers` prioritizes primary/insight labels without adding collision systems
    - `rendering.labels.transitions` (normal-mode only) for smoother LOD

## Proposed API Additions

```ts
export type DensityMode = 'relaxed' | 'balanced' | 'compact';

export interface DensityOptions {
  mode?: DensityMode;
  spread?: number;           // layout multiplier
  edgeFade?: number;         // 0..1, non-focused edge opacity
  minEdgeStrength?: number;  // hide edges below threshold
  focusExpansion?: number;   // 0..1, extra spacing near selected node
  labelMaxCount?: number;    // cap for visible labels
  labelDistance?: number;    // override default label distance
  labelVisibility?: 'auto' | 'interaction' | 'none';
}

export interface NeuronWebProps {
  density?: DensityOptions;
}
```

## Mode Defaults (Proposed)

- **relaxed:** spread 1.2, edgeFade 0.2, focusExpansion 0.18
- **balanced:** spread 1.0, edgeFade 0.35, focusExpansion 0.12
- **compact:** spread 0.9, edgeFade 0.5, focusExpansion 0.08

## Implementation Notes

- Map `density.spread` to layout `spread` when `layout.spread` is not set.
- Apply `edgeFade` when a node is hovered/selected.
- Use `labelMaxCount` and `labelDistance` to tune label density per mode.
- Clamp `edgeFade` and `minEdgeStrength` into `[0..1]` for predictable behavior.
- Default `density.mode` is derived from performance mode:
  - `normal` → `balanced`
  - `degraded` / `fallback` → `compact`

### Precedence (labels)
When `rendering.labels` is provided, it is treated as the explicit label policy:
1) `rendering.labels.*` overrides `density.label*` values
2) `density.label*` overrides performance-mode defaults
3) performance mode still gates heavy label features (transitions/large caps), especially in `fallback`
