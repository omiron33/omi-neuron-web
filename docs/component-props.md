# Component Props

## NeuronWeb

See `NeuronWebProps` in `src/visualization/types.ts`.

### Layout

`NeuronWebProps.layout` provides layout strategies when nodes lack explicit positions. The `atlas`
mode mirrors the Technochristian (www.technochristianity.com) golden-sphere arrangement (canonical nodes on a wider sphere,
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

### Camera Auto-Fit

`NeuronWebProps.cameraFit` centers and zooms the camera so all nodes fit within a chosen viewport fraction.
When `isFullScreen` is true and `cameraFit.enabled` is omitted, auto-fit defaults to enabled.
Auto-fit pauses whenever a node is selected/focused so the camera doesn't snap back to the full graph.

Orbit pivot behavior:
- On pointer down, the orbit target shifts to the cursor (or the node under it), so rotation
  follows the cursor instead of staying locked to the last focused node.

- `enabled`: toggle auto-fit (default: false)
- `mode`: `'once' | 'onChange'` (default: `once`)
- `viewportFraction`: fraction of the viewport to occupy (default: `0.33` = center third)
- `padding`: extra padding on bounds (default: `0.15` = 15%)

Example:

```tsx
<NeuronWeb
  graphData={{ nodes, edges }}
  isFullScreen
  cameraFit={{ enabled: true, mode: 'once', viewportFraction: 0.33, padding: 0.15 }}
/>
```

Disable auto-fit in fullscreen:

```tsx
<NeuronWeb graphData={{ nodes, edges }} isFullScreen cameraFit={{ enabled: false }} />
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

### Click Cards

`NeuronWebProps.clickCard` enables a persistent card on node click.

- `enabled`: toggle click cards (default: false)
- `width`: card width in pixels
- `offset`: `[x, y]` offset from the node

```tsx
<NeuronWeb
  graphData={{ nodes, edges }}
  clickCard={{ enabled: true, width: 320, offset: [24, 24] }}
/>
```

### Card Mode

`NeuronWebProps.cardsMode` overrides card visibility globally.

When `cardsMode` is set, it takes precedence over `hoverCard.enabled` and `clickCard.enabled`.

- `none`: disable all cards
- `hover`: hover cards only
- `click`: click cards only
- `both`: hover + click cards

```tsx
<NeuronWeb graphData={{ nodes, edges }} cardsMode="hover" />
```

### Click Zoom

`NeuronWebProps.clickZoom` controls whether clicking a node zooms the camera to it.

- `enabled`: toggle click zoom (default: true)

```tsx
<NeuronWeb graphData={{ nodes, edges }} clickZoom={{ enabled: false }} />
```

### Study Path Playback

`NeuronWebProps.studyPathRequest` plays an ordered path of nodes. Each step:
- selects the node
- moves the camera (if `clickZoom.enabled`)
- highlights the edge between current and next step

Fields:
- `steps`: array of `{ nodeSlug?: string; nodeId?: string; label?: string; summary?: string }`
- `stepDurationMs`: time per step (default: 4200)
- `fromNodeId`/`toNodeId`: fallback two-step path if `steps` is omitted

```tsx
<NeuronWeb
  graphData={{ nodes, edges }}
  studyPathRequest={{
    steps: [{ nodeSlug: 'alpha' }, { nodeSlug: 'beta' }],
    stepDurationMs: 3200,
  }}
/>
```

## NeuronWebProvider

See `NeuronWebProviderProps` in `src/react/NeuronWebProvider.tsx`.
