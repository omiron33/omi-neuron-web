# NeuronWebExplorer (Optional Wrapper)

`NeuronWebExplorer` is a lightweight, **optional** wrapper around `NeuronWeb` that helps apps avoid rewriting the same UI scaffolding:
- search input (label/slug substring search)
- filter state (domains / relationship types / min edge strength)
- selection panel / legend slots

It is intentionally **slot-based** and styling-neutral:
- no CSS framework requirement
- stable class names (you provide styling if desired)
- default layout is minimal and can be replaced via slots

## Imports

```ts
import {
  NeuronWebExplorer,
  type NeuronWebExplorerProps,
  type NeuronWebExplorerFilters,
} from '@omiron33/omi-neuron-web/visualization';
```

Related docs:
- `docs/visualization/performance-budgets.md` (mode gating + defaults)
- `docs/visualization/density-strategy.md` (declutter + label visibility)
- `docs/visualization/story-tooling.md` (beats + study paths helpers)

## Controlled (headless) mode

Provide `graphData` and (optionally) custom UI via slots:

```tsx
<NeuronWebExplorer
  graphData={{ nodes, edges, storyBeats }}
  neuronWebProps={{
    layout: { mode: 'fuzzy', seed: 'demo' },
    density: { mode: 'balanced' },
    performanceMode: 'auto',
  }}
  renderToolbar={({ query, setQuery, filters, setFilters }) => (
    <MyToolbar query={query} onQueryChange={setQuery} filters={filters} onFiltersChange={setFilters} />
  )}
  renderSelectionPanel={({ selectedNode }) => <MySelectionPanel node={selectedNode} />}
/>
```

## Hook-driven mode

If `graphData` is omitted, explorer will call `useNeuronGraph()` internally and feed the result into `NeuronWeb`.
This requires `NeuronWebProvider` to be present in the React tree.

Notes:
- `domains`, `nodeTypes`, and `minEdgeStrength` are forwarded to `useNeuronGraph()`.
- `relationshipTypes` filtering is applied client-side by the explorer after the graph is loaded.

## Filter semantics (v1)

Explorer applies an **induced subgraph** filter:
- nodes are filtered first
- edges are then kept only when **both endpoints** remain visible
- `storyBeats` (if present) are filtered down to beats that still have at least 2 visible `nodeIds`

### Search query

`query` is a simple client-side substring matcher:
- case-insensitive
- matches against `node.label` and `node.slug`

### Filters object (`NeuronWebExplorerFilters`)

```ts
type NeuronWebExplorerFilters = {
  domains?: string[];
  nodeTypes?: string[];
  relationshipTypes?: string[];
  minEdgeStrength?: number;
};
```

Notes:
- `nodeTypes` is primarily intended for hook-driven mode (it is sent to `useNeuronGraph()`).
  The visualization `NeuronVisualNode` shape does not include `nodeType`, so the explorer does not apply
  a client-side nodeType filter in controlled mode by default.

## Selection + focus semantics

- Selection is tracked by `selectedNodeId` (controlled/uncontrolled).
- Clicking a node in the canvas sets `selectedNodeId` (and calls through to `neuronWebProps.onNodeClick` if provided).
- The toolbar slot also receives `focusNodeSlug` + `setFocusNodeSlug` so you can implement “focus a node” flows.
  This maps directly to `NeuronWeb`’s `focusNodeSlug` behavior and is cleared after `onFocusConsumed` fires.

## Styling contract

Explorer provides stable wrapper classes:
- `.neuron-explorer`
- `.neuron-explorer__toolbar`
- `.neuron-explorer__canvas`
- `.neuron-explorer__sidebar`
- `.neuron-explorer__legend`
- `.neuron-explorer__selection`

No CSS is shipped by default.

## Reference example

See `examples/basic-usage/app/explorer/page.tsx` for a full working example with:
- query + filter controls
- selection panel + focus behavior
- density + performance toggles
