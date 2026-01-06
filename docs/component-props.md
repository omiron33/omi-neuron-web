# Component Props

## NeuronWeb

See `NeuronWebProps` in `src/visualization/types.ts`.

### Layout

`NeuronWebProps.layout` provides layout strategies when nodes lack explicit positions. The `atlas`
mode mirrors the Technochristian golden-sphere arrangement (canonical nodes on a wider sphere,
insight nodes on a tighter sphere) and ships with the default Technochristian position map.

- `mode`: `'auto' | 'positioned' | 'fuzzy' | 'atlas'` (default: `atlas`)
- `radius`: base radius for layout (atlas + fuzzy)
- `insightRadius`: radius for insight nodes in `atlas` mode
- `jitter`: random offset applied to each node
- `zSpread`: depth variance for the 3D cloud
- `seed`: stable seed for deterministic placement
- `spread`: density multiplier (higher = more spacing)
- `overrides`: map of `{ [idOrSlug]: [x, y, z] }` for manual placement (merged on top of defaults)

Example:

```tsx
<NeuronWeb
  graphData={{ nodes, edges }}
  layout={{ mode: 'atlas', radius: 12, insightRadius: 5, spread: 1.1 }}
/>
```

### Layout Sizing

- `isFullScreen`: covers the full viewport (`position: fixed; inset: 0`)
- `fullHeight`: stretches to `100vh` when embedded in a normal layout

### Hover Cards

`NeuronWebProps.hoverCard` enables hover card overlays on nodes.

- `enabled`: toggle hover cards (default: true)
- `width`: card width in pixels
- `offset`: `[x, y]` offset from the node

You can customize content with `renderNodeHover`:

```tsx
<NeuronWeb
  graphData={{ nodes, edges }}
  renderNodeHover={(node) => (
    <div>
      <strong>{node.label}</strong>
      <div style={{ opacity: 0.7 }}>{node.metadata?.summary}</div>
    </div>
  )}
/>
```

## NeuronWebProvider

See `NeuronWebProviderProps` in `src/react/NeuronWebProvider.tsx`.
