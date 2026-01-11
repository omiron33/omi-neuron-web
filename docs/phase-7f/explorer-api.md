# Phase 7F — Explorer UX (Discovery Draft)

This document captures the **minimal “explorer UX” feature set** that most consumers end up rebuilding around `NeuronWeb`, plus a first-pass **target API surface** for an optional wrapper component.

It is intentionally **minimal, slot-based, and optional**:
- `NeuronWeb` remains the headless renderer (no new UI requirements).
- `NeuronWebExplorer` is an optional helper for “app-ready” integrations (search / filters / panels).

> Note: This is a Phase 7F Discovery artifact. Phase 7F Design tasks will refine this into a stable v1 contract.

## Goals (v1)

### 1) Reduce repeated UI scaffolding
Common repeated UI needs:
- Search (label/fuzzy + semantic search)
- Filter controls (domain/node type/relationship type/cluster)
- Selection details panel (selected node metadata + actions)
- Legend / status indicators (domain colors, edge styles)

### 2) Keep styling optional
Explorer should not impose a design system:
- slot-based rendering hooks for toolbar/legend/panels
- no required CSS framework
- minimal default markup and class names, with user overrides

### 3) Leverage existing hooks/contracts
Explorer should primarily compose:
- `useNeuronGraph` (load graph)
- `useNeuronSearch` (semantic search + similar)
- `useNeuronNodes` / `useNeuronEdges` (optional for detail panels)

## Non-goals
- A full “graph editor” application
- Opinionated component library (buttons/inputs/theme system)
- Real-time collaboration or multi-user presence

## Minimal Explorer Feature Set

### Search
**Required**
- “Label search”: client-side search over current graph nodes (label/slug), fast and offline.
- “Semantic search”: calls `api.search.semantic`, presents result list, and allows focusing a node.

**Nice-to-have**
- “Find similar”: calls `api.search.similar` from selected node.

### Filters
**Required**
- `domain[]` filter
- `nodeType[]` filter
- `relationshipType[]` filter

**Nice-to-have**
- `clusterId[]` filter (when clustering is used)
- `minEdgeStrength` / `minConfidence` filter for declutter + governance workflows

### Selection & Panels
**Required**
- Selection state (selected node)
- Selection details panel slot
- Programmatic focus on a node from search results

**Nice-to-have**
- Edge click selection handling (show edge details)

### Visualization Controls
**Required**
- Density preset selector (maps to `NeuronWebProps.density.mode`)
- “Performance mode” selector (`NeuronWebProps.performanceMode`)

## Proposed API Surface (Draft)

### Export shape
Target new exports (to be implemented in Phase 7F Implementation tasks):
- `NeuronWebExplorer`
- `NeuronWebExplorerProps`

Recommended export location:
- `src/visualization/explorer/NeuronWebExplorer.tsx` (or similar)
- re-export from `src/visualization/index.ts`

### Data flow (recommended)
Explorer should support two modes:

1) **Hook-driven** (most common)
- uses `NeuronProvider` + hooks to fetch graph/search data
- good for real apps

2) **Controlled/headless** (advanced)
- accepts `graphData` directly and only provides UI wiring
- good for apps that manage their own fetching/caching

### Props (draft)

```ts
export type NeuronWebExplorerProps = {
  /** Required: graph data to render (if not using hooks). */
  graphData?: NeuronGraphData;

  /** Optional: initial filter state (uncontrolled mode). */
  initialFilters?: {
    domains?: string[];
    nodeTypes?: string[];
    relationshipTypes?: string[];
    clusterIds?: string[];
    minEdgeStrength?: number;
  };

  /** Optional: controlled filter state */
  filters?: NeuronWebExplorerProps['initialFilters'];
  onFiltersChange?: (next: NonNullable<NeuronWebExplorerProps['filters']>) => void;

  /** Selection wiring */
  selectedNodeId?: string | null;
  onSelectedNodeIdChange?: (id: string | null) => void;

  /** Rendering options forwarded to NeuronWeb */
  neuronWebProps?: Partial<NeuronWebProps>;

  /** Slot-based UI customization */
  renderToolbar?: (ctx: {
    query: string;
    setQuery: (q: string) => void;
    filters: NonNullable<NeuronWebExplorerProps['filters']>;
    setFilters: (f: NonNullable<NeuronWebExplorerProps['filters']>) => void;
    isSearching: boolean;
  }) => React.ReactNode;

  renderLegend?: (ctx: { filters: NonNullable<NeuronWebExplorerProps['filters']> }) => React.ReactNode;
  renderSelectionPanel?: (ctx: { selectedNode: NeuronNode | null }) => React.ReactNode;
  renderEmptyState?: () => React.ReactNode;
  renderLoadingState?: () => React.ReactNode;
};
```

Notes:
- `neuronWebProps` is intentionally a “bag” so we don’t mirror every `NeuronWebProps` field.
- Explorer should primarily coordinate `visibleNodeSlugs` + `focusNodeSlug` + selection callbacks.

### How filters map into NeuronWeb
Explorer computes:
- `visibleNodeSlugs`: derived from filters (and optionally search results)
- `density` / `performanceMode`: from explorer controls into `NeuronWebProps`

### How search maps into NeuronWeb
Explorer manages:
- `focusNodeSlug`: set when a search result is selected
- optional “search results overlay” / panel via slots

## Open Questions (for Phase 7F Design)
- Should explorer ship *any* default styles (e.g. minimal layout CSS), or only primitives + slots?
- Should explorer expose a “results list” data contract (so UIs can reuse it), or keep it fully internal?
- Should “label search” be pluggable (custom matcher, debounce, extra fields)?

## Component Anatomy (Draft)

Recommended internal structure (implementation detail, but helps keep responsibilities clear):

- `NeuronWebExplorer` (layout + state orchestration)
  - `ExplorerToolbar` (optional default; can be replaced with `renderToolbar`)
  - `ExplorerLegend` (optional default; can be replaced with `renderLegend`)
  - `ExplorerSelectionPanel` (optional default; can be replaced with `renderSelectionPanel`)
  - `NeuronWeb` (the renderer; unchanged)

Explorer should be responsible for:
- computing `visibleNodeSlugs` from filters
- translating search selection into `focusNodeSlug`
- keeping selection state consistent across filter changes

NeuronWeb remains responsible for:
- rendering
- interactions (hover/click) and emitting callbacks
- internal animation and performance gating

## Styling Contract (Minimal)

To keep the explorer optional and styling-neutral:
- Provide stable wrapper class names (no CSS shipped by default).
- Allow slot overrides to fully control UI.

Suggested class names (draft):
- `.neuron-explorer`
- `.neuron-explorer__toolbar`
- `.neuron-explorer__canvas`
- `.neuron-explorer__sidebar`
- `.neuron-explorer__legend`
- `.neuron-explorer__selection`

## State Semantics (Draft)

### Selection vs focus
- “Focus” (`focusNodeSlug`) is an imperative action (camera focus + select) and should be considered *transient*.
- “Selection” (`selectedNodeId`) is persistent state.

Suggested behavior:
- Selecting a search result triggers focus and sets selection.
- Changing filters:
  - if the selected node is no longer visible, selection resets to `null`
  - focus is cleared after it is consumed (using `onFocusConsumed`)

### Filtering strategy (default)
Default behavior should render an **induced subgraph**:
- keep all nodes that match filters
- keep edges only where both endpoints remain visible

This matches how `NeuronWeb` currently filters edges under `visibleNodeSlugs`.

## Example Usage (Draft)

Hook-driven explorer (consumer provides UI via slots):

```tsx
<NeuronProvider config={config}>
  <NeuronWebExplorer
    renderToolbar={({ query, setQuery, filters, setFilters }) => (
      <MyToolbar query={query} onQueryChange={setQuery} filters={filters} onFiltersChange={setFilters} />
    )}
    renderSelectionPanel={({ selectedNode }) => <MySelectionPanel node={selectedNode} />}
  />
</NeuronProvider>
```

