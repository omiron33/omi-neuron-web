# Phase 7F — Explorer Integration Patterns (Design Draft)

This document defines how an optional `NeuronWebExplorer` wrapper should integrate with the existing React hooks and API contracts.

## Primary Integration Modes

Explorer should support two operational modes:

### Mode A: Server-driven graph (recommended)
Use the server to apply the “big” filters so the client renders a bounded graph:
- domain/nodeType/relationshipType/cluster filters
- min strength thresholds for declutter

Implementation approach:
- call `api.graph.get(...)` via `useNeuronGraph(...)`
- refetch when filters change (debounced if needed)

Pros:
- scales better for large graphs
- avoids client holding full node/edge dataset

Cons:
- requires clear mapping from explorer filter UI → `GetGraphParams`

### Mode B: Client-side filtering (small graphs / offline)
Fetch a broad graph and filter it locally:
- compute `visibleNodeSlugs` and pass to `NeuronWeb`

Pros:
- instant filter toggles
- fewer network calls

Cons:
- does not scale to large graphs

## Hook Composition

### `useNeuronGraph`
Today `useNeuronGraph` maps a small subset of options into `api.graph.get`.

Explorer should use it as the baseline data loader, but Phase 7F implementation may expand its option surface to include:
- `relationshipTypes?: string[]`
- `clusterIds?: string[]`
- `nodeIds?: string[]` (e.g. “focus only these nodes”)
- `depth?: number` (when building a local neighborhood view)

Mapping to API:
- `domains` → `GetGraphParams.domains`
- `nodeTypes` → `GetGraphParams.nodeTypes`
- `relationshipTypes` → `GetGraphParams.relationshipTypes`
- `clusterIds` → `GetGraphParams.clusterIds`
- `minEdgeStrength` → `GetGraphParams.minEdgeStrength`

### `useNeuronSearch`
Explorer should support two search tracks:

1) **Label search** (client-side)
- search `graphData.nodes` by `label` + `slug`
- used for instant filtering and selection

2) **Semantic search** (server-side)
- `useNeuronSearch().search(query, options)`
- results should allow focusing a node:
  - if the node is already in the rendered graph, focus/select immediately
  - if not present, either:
    - refetch graph with a filter that includes the node (preferred if supported)
    - or show “result outside current filter set” messaging

### `useNeuronNodes` (optional)
Explorer can use `useNeuronNodes` for:
- richer selection panels (metadata, edit controls)
- “search results list” outside the current graph view

For most cases, selection panel data can be sourced from `useNeuronGraph().nodes`.

## Filter State Contract (recommended)

Explorer should keep a single filter object that can be:
- uncontrolled (`initialFilters`)
- controlled (`filters` + `onFiltersChange`)

Recommended shape:

```ts
export type ExplorerFilters = {
  domains?: string[];
  nodeTypes?: string[];
  relationshipTypes?: string[];
  clusterIds?: string[];
  minEdgeStrength?: number;
};
```

## Selection + Focus Wiring

Explorer coordinates three mechanisms:

- `NeuronWebProps.selectedNode` (controlled selection)
- `NeuronWebProps.focusNodeSlug` (imperative focus action)
- `NeuronWebProps.onFocusConsumed` (clear focus request)

Recommended behavior:
- clicking a node in NeuronWeb updates explorer selection
- selecting a search result triggers:
  1. set `focusNodeSlug` to slug/id
  2. set selection to that node id (if available)
  3. clear `focusNodeSlug` when consumed

## Density + Performance Presets

Explorer should treat these as user-facing UX controls:
- `density.mode` (relaxed/balanced/compact)
- `performanceMode` (auto/normal/degraded/fallback)

When using “server-driven graph” mode:
- `minEdgeStrength` should map to the graph query to reduce payload size.

When using “client filtering” mode:
- `minEdgeStrength` can map into `density.minEdgeStrength` for local declutter.

