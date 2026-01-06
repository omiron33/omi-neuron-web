# Component Props

## NeuronWeb

See `NeuronWebProps` in `src/visualization/types.ts`.

### Layout

`NeuronWebProps.layout` provides a fuzzy 3D fallback when nodes lack explicit positions.

- `mode`: `'auto' | 'positioned' | 'fuzzy'` (default: `auto`)
- `radius`: base radius for the layout ring
- `jitter`: random offset applied to each node
- `zSpread`: depth variance for the 3D cloud
- `seed`: stable seed for deterministic placement
- `spread`: density multiplier (higher = more spacing)

Example:

```tsx
<NeuronWeb
  graphData={{ nodes, edges }}
  layout={{ mode: 'fuzzy', radius: 8, jitter: 1.2, zSpread: 3, spread: 1.25 }}
/>
```

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
