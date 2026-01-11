---
title: Complete Type System Definition
status: blocked
priority: 1
labels:
  - 'Phase:1-Foundation'
  - 'Type:Types'
assignees:
  - CodingAgent
depends_on:
  - task-1-1-project-setup
---

# Task 1.2: Type System

## Objective
Define the complete TypeScript type system for all library entities including nodes, edges, clusters, settings, events, and API contracts.

## Requirements

### 1. Node Types (`src/core/types/node.ts`)
- [ ] `NodeTier` type ('primary' | 'secondary' | 'tertiary' | 'insight')
- [ ] `AnalysisStatus` type ('pending' | 'processing' | 'complete' | 'failed')
- [ ] `NeuronNodeBase` interface (id, slug, label, nodeType, domain, timestamps)
- [ ] `NeuronNode` interface (full node with embeddings, clusters, counts)
- [ ] `NeuronNodeCreate` interface (input for creation)
- [ ] `NeuronNodeUpdate` interface (input for updates)
- [ ] `NeuronNodeBatchCreate` interface (batch operations)
- [ ] `NeuronVisualNode` interface (visualization subset)

### 2. Edge Types (`src/core/types/edge.ts`)
- [ ] `RelationshipType` type (built-in + custom string)
- [ ] `EdgeSource` type ('manual' | 'ai_inferred' | 'imported')
- [ ] `EdgeEvidence` interface (supporting data)
- [ ] `NeuronEdge` interface (full edge)
- [ ] `NeuronEdgeCreate` interface (input)
- [ ] `NeuronEdgeUpdate` interface (update input)
- [ ] `NeuronVisualEdge` interface (visualization subset)
- [ ] `InferredRelationship` interface (AI results)

### 3. Cluster Types (`src/core/types/cluster.ts`)
- [ ] `NeuronCluster` interface (cluster definition)
- [ ] `ClusterMembership` interface (node-to-cluster)
- [ ] `NeuronClusterCreate` interface
- [ ] `NeuronClusterUpdate` interface
- [ ] `NeuronVisualCluster` interface
- [ ] `ClusteringAlgorithm` type
- [ ] `ClusteringConfig` interface

### 4. Analysis Types (`src/core/types/analysis.ts`)
- [ ] `AnalysisRunType` type
- [ ] `AnalysisJobStatus` type
- [ ] `AnalysisRun` interface (job record)
- [ ] `AnalysisRequest` interface (trigger input)
- [ ] `AnalysisResponse` interface
- [ ] `EmbeddingResult` interface
- [ ] `ClusteringResult` interface
- [ ] `AnalysisPipelineConfig` interface

### 5. Settings Types (`src/core/types/settings.ts`)
- [ ] `EmbeddingModel` type
- [ ] `PerformanceMode` type
- [ ] `NodeTypeConfig` interface
- [ ] `DomainConfig` interface
- [ ] `RelationshipTypeConfig` interface
- [ ] `VisualizationSettings` interface (all viz options)
- [ ] `AnalysisSettings` interface (all analysis options)
- [ ] `DatabaseSettings` interface
- [ ] `NeuronSettings` interface (complete settings)
- [ ] `NeuronConfig` interface (full config with secrets)
- [ ] Default settings exports

### 6. Event Types (`src/core/types/events.ts`)
- [ ] `NeuronEventType` union (all event types)
- [ ] `EventSource` type
- [ ] `NeuronEvent<T>` interface
- [ ] All event payload interfaces (20+ payloads)
- [ ] `EventHandler` type
- [ ] `EventSubscription` interface
- [ ] `NeuronEventEmitter` interface

### 7. API Types (`src/core/types/api.ts`)
- [ ] Pagination types
- [ ] All request interfaces
- [ ] All response interfaces
- [ ] `ApiErrorResponse` interface
- [ ] `HealthCheckResponse` interface

### 8. Index Export (`src/core/types/index.ts`)
- [ ] Export all types with proper naming

## Deliverables
- [ ] `src/core/types/node.ts`
- [ ] `src/core/types/edge.ts`
- [ ] `src/core/types/cluster.ts`
- [ ] `src/core/types/analysis.ts`
- [ ] `src/core/types/settings.ts`
- [ ] `src/core/types/events.ts`
- [ ] `src/core/types/api.ts`
- [ ] `src/core/types/index.ts`

## Acceptance Criteria
- All types compile without errors
- All types are properly exported
- JSDoc comments on all interfaces
- No `any` types except where necessary
- Consistent naming conventions

## Notes
- Use `Record<string, unknown>` for metadata fields
- Keep visual types minimal for Three.js performance
- Default settings should be exported as const objects



---
**2026-01-10T22:09:57.364Z**
Task 'Complete Type System Definition' is currently in progress.

---
**2026-01-10T22:10:01.059Z**
Task 'Complete Type System Definition' is blocked due to linting errors. Fix required.
