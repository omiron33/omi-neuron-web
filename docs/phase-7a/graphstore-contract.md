# GraphStore Contract (Phase 7A)

This document defines the v1 `GraphStore` contract: a portable interface that lets the API and analysis layers operate against different backends (Postgres, in-memory, file-backed) while preserving route shapes and analysis behavior.

## Goals
- Allow swapping storage backends without editing route handlers.
- Preserve Postgres as the default high-performance backend.
- Provide enough primitives for:
  - API CRUD (`/nodes`, `/edges`, `/settings`)
  - visualization graph fetch (`/graph`)
  - analysis steps (embeddings, clustering, relationship inference) with best-effort parity in local-first modes.

## Non-goals (v1)
- Expose every SQL/query-builder capability across all stores.
- Build a generic query language.
- Guarantee identical performance across stores (correctness and parity are the priority).

## RequestContext (forward-compatible)

Phase 7D adds multi-tenancy; the store interface should be compatible with it from day one.

Recommended pattern:
- All store methods accept an optional `context` argument:
  - `scope?: string` (defaults to `"default"`)
  - optional user identity / claims (Phase 7D)

Backends that don’t support scoping yet may ignore it (but should not error).

## Core method groups (v1)

### 1) Nodes
Required for API parity:
- `getNodeById(id)`
- `getNodeBySlug(slug)`
- `listNodes({ limit, offset, filters })`
- `createNodes(nodes: NeuronNodeCreate[])` (batch)
- `updateNode(id, patch: NeuronNodeUpdate)`
- `deleteNode(id)` (should also remove or cascade edges as backend requires)

Required for ingestion (Phase 7C):
- Optional `upsertNodeByExternalId(...)` (exact model finalized in Phase 7C provenance design)

### 2) Edges
Required for API parity:
- `getEdgeById(id)`
- `listEdges({ limit, offset, filters })`
- `createEdges(edges: NeuronEdgeCreate[])` (batch)
- `updateEdge(id, patch: NeuronEdgeUpdate)`
- `deleteEdge(id)`
- `deleteEdgesByNodeId(nodeId)` (useful for safe node deletes)

### 3) Settings
Required for API parity:
- `getSettings()`
- `updateSettings(update: NeuronSettingsUpdate)`
- `resetSettings({ sections? })`

### 4) Graph queries (visualization)
Required to preserve `/graph` route behavior:
- `getGraph(params: GetGraphParams): GetGraphResponse`
  - must return `NeuronVisualNode[]` and `NeuronVisualEdge[]`
  - must support the same filters used today (domains, nodeTypes, clusterIds, nodeIds)
- `expandGraph(req: ExpandGraphRequest): ExpandGraphResponse`
- `findPaths(req: FindPathRequest): FindPathResponse`

Notes:
- Postgres can keep using the existing SQL builder (fast).
- Local-first backends can implement simplified versions (correctness > performance).

### 5) Embeddings + similarity (analysis + search)
Required to preserve current analysis/search behavior across stores:

Embedding persistence primitives:
- `getNodeEmbeddingInfo(nodeId): { embedding, embeddingModel, embeddingGeneratedAt }`
- `setNodeEmbedding(nodeId, { embedding, model, generatedAt? })`
- `clearNodeEmbeddings({ nodeIds? })`

Similarity / candidate selection:
- `findSimilarNodeIds(nodeId, { limit, minSimilarity? }): Array<{ nodeId, similarity }>`
  - Postgres uses pgvector operators.
  - Local stores use cosine similarity over stored vectors.

Semantic search scoring:
- `scoreNodesForQueryEmbedding(queryEmbedding, { limit?, nodeIds? })`
  - returns nodes with similarity scores (or `ScoredNode[]`).

### 6) Clusters (analysis)
Minimal support required for clustering parity:
- `replaceClusters({ clusters, memberships })` (bulk replace semantics)
- `setNodeCluster(nodeId, { clusterId, similarity })`
- `listClusters()` and `listClusterMemberships(clusterId)` (optional for API expansion)

V1 simplification:
- clustering may be “best effort” in local-first modes; document limitations in Phase 7B parity docs.

## Data integrity expectations
- IDs are UUIDs (v4) in Postgres today; local stores should also use UUIDs to avoid shape drift.
- Slugs should be unique; creation should fail or skip duplicates deterministically (strategy documented in Phase 7B).
- Batch operations should be order-preserving and return created records.

## Relationship to existing code

Postgres implementation can be built by composing existing modules:
- `NodeRepository`, `EdgeRepository`, `SettingsRepository`, `ClusterRepository`, `AnalysisRunRepository`
- `GraphQueryBuilder` for graph queries
- Existing direct SQL used by analysis engines can be moved behind store methods gradually.

## Migration plan for API routes

Target endpoint wiring:
- Today: routes instantiate repositories/query builders from a `Database`.
- After Phase 7A: routes accept an injected `GraphStore` (or `NeuronServer` that contains one).

Compatibility:
- Keep `createNeuronRoutes(config)` working by:
  - internally creating a `PostgresGraphStore` from `config`
  - delegating all route handlers to store methods

