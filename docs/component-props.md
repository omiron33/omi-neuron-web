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

### Selection

- `selectedNode`: controlled selection (when provided, it overrides internal click selection)
- `focusNodeSlug`: programmatic focus/selection by slug/id
- `visibleNodeSlugs`: filter nodes by slug/id

When `selectedNode` is provided, the component behaves as controlled selection:

```tsx
<NeuronWeb
  graphData={{ nodes, edges }}
  selectedNode={selectedNode}
  onNodeClick={(node) => setSelectedNode(node)}
/>
```

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

### Domain Colors

Override domain color mapping without supplying a full theme:

```tsx
<NeuronWeb
  graphData={{ nodes, edges }}
  domainColors={{ core: '#7ea6ff', insight: '#b08cff' }}
/>
```

### Hover Cards

`NeuronWebProps.hoverCard` enables hover card overlays on nodes.

- `enabled`: toggle hover cards (default: true)
- `width`: card width in pixels
- `offset`: `[x, y]` offset from the node
- `showTags`: show tag chips (default: true)
- `showMetrics`: show metrics row (default: true)
- `maxSummaryLength`: truncate summary length (default: 140)

Slot-level customization:

- `hoverCardSlots.header`
- `hoverCardSlots.summary`
- `hoverCardSlots.tags`
- `hoverCardSlots.metrics`
- `hoverCardSlots.footer`

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

Slot example:

```tsx
<NeuronWeb
  graphData={{ nodes, edges }}
  hoverCardSlots={{
    header: (node) => <strong>{node.label}</strong>,
    metrics: (node) => <div>Connections: {node.connectionCount}</div>,
  }}
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
- `distance`: fixed camera distance from the focused node (overrides the current distance)
- `offset`: fixed `[x, y, z]` offset added to the focused node (overrides `distance`)

```tsx
<NeuronWeb graphData={{ nodes, edges }} clickZoom={{ enabled: false }} />

<NeuronWeb
  graphData={{ nodes, edges }}
  clickZoom={{ enabled: true, offset: [0, 2, 8] }}
/>
```

### Story Beats

`graphData.storyBeats` provides external UI metadata and can also drive built-in playback
when paired with `activeStoryBeatId`.

- `activeStoryBeatId`: selects a beat to play
- `storyBeatStepDurationMs`: optional override per-step duration
- `onStoryBeatComplete`: callback when playback ends

```tsx
<NeuronWeb
  graphData={{ nodes, edges, storyBeats }}
  activeStoryBeatId="beat-1"
  onStoryBeatComplete={(beat) => console.log('done', beat)}
/>
```

### Callbacks

- `onEdgeClick`: fired when a line edge is clicked
- `onCameraChange`: fired on OrbitControls changes (camera position array)

```tsx
<NeuronWeb
  graphData={{ nodes, edges }}
  onEdgeClick={(edge) => console.log(edge)}
  onCameraChange={(pos) => console.log('camera', pos)}
/>
```

### Density Controls

`NeuronWebProps.density` adjusts spacing and decluttering in dense graphs.

- `mode`: `'relaxed' | 'balanced' | 'compact'`
- `spread`: layout spacing multiplier
- `edgeFade`: non-focused edge opacity multiplier
- `minEdgeStrength`: hide weak edges below threshold
- `focusExpansion`: extra spacing around selected node
- `labelMaxCount`: cap visible labels
- `labelDistance`: override label distance threshold

```tsx
<NeuronWeb
  graphData={{ nodes, edges }}
  density={{ mode: 'relaxed', focusExpansion: 0.2 }}
/>
```

### Rendering Options (Phase 4C)

`NeuronWebProps.rendering` provides a declarative, type-safe way to opt into richer rendering styles and
animation behavior (without needing to fork `NeuronWeb`).

Start with presets (copy/paste), then optionally layer in overrides:
- `rendering.preset` sets the overall “depth” posture (`minimal` / `subtle` / `cinematic`).
- `rendering.nodes` / `rendering.edges` / `rendering.labels` override specific style knobs.
- `rendering.resolvers` provides advanced per-node/per-edge styling callbacks.

Migration note:
- Existing consumers can leave `rendering` undefined; behavior stays the same (safe defaults).
- Prefer `rendering` for new rendering/animation tweaks; `theme` remains supported for global look-and-feel.

Canonical snippet (presets-first):

```tsx
import { NeuronWeb, DEFAULT_RENDERING_OPTIONS } from '@omiron33/omi-neuron-web/visualization';

<NeuronWeb
  graphData={{ nodes, edges }}
  rendering={{
    ...DEFAULT_RENDERING_OPTIONS,
    preset: 'subtle',
  }}
/>
```

Preset copy/paste:

```tsx
<NeuronWeb graphData={{ nodes, edges }} rendering={{ preset: 'minimal' }} />
```

Screenshot target: `docs/assets/rendering-preset-minimal.png` (generated in Phase 4C validation).

```tsx
<NeuronWeb graphData={{ nodes, edges }} rendering={{ preset: 'subtle' }} />
```

Screenshot target: `docs/assets/rendering-preset-subtle.png` (generated in Phase 4C validation).

```tsx
<NeuronWeb graphData={{ nodes, edges }} rendering={{ preset: 'cinematic' }} />
```

Screenshot target: `docs/assets/rendering-preset-cinematic.png` (generated in Phase 4C validation).

Advanced resolver example (deterministic):

```tsx
<NeuronWeb
  graphData={{ nodes, edges }}
  rendering={{
    preset: 'subtle',
    resolvers: {
      getNodeStyle: (node) =>
        node.tier === 'insight'
          ? { scale: 1.25, opacity: 1, color: '#b08cff' }
          : node.connectionCount > 10
            ? { scale: 1.1, opacity: 0.95 }
            : {},
      getEdgeStyle: (edge) =>
        edge.strength > 0.8 ? { opacity: 0.9, width: 1.4 } : edge.strength < 0.25 ? { opacity: 0.15 } : {},
    },
  }}
/>
```

Performance + safety guidance:
- In `performanceMode="degraded"` and `performanceMode="fallback"`, expensive features are gated off.
  For example: curved edges, arrows, edge-flow animations, mesh nodes, and graph enter/exit transitions
  are intentionally limited to `normal` mode.
- When the OS preference `prefers-reduced-motion: reduce` is active, continuous motion (ambient drift, edge flow)
  is disabled and camera tweening is clamped/disabled to avoid motion sickness.
- The authoritative gating table lives in `docs/visualization/performance-budgets.md` and
  `docs/visualization/animation-profiles.md`.

### Effects + Animation Overrides

Use `theme.effects` and `theme.animation` to toggle polish features:

- `effects.postprocessingEnabled`, `effects.bloomEnabled`, `effects.vignetteEnabled`
- `effects.ambientMotionEnabled`, `effects.edgeFlowEnabled`
- `animation.enableCameraTween`, `animation.enableSelectionPulse`, `animation.enableSelectionRipple`

```tsx
<NeuronWeb
  graphData={{ nodes, edges }}
  theme={{
    effects: { postprocessingEnabled: false, ambientMotionEnabled: false },
    animation: { enableCameraTween: false },
  }}
/>
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
