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
  - Render only in normal mode or when explicitly enabled.
  - Cap visible labels based on distance and max count.

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
