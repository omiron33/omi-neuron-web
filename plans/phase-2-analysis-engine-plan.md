# Phase 2: Analysis Engine Plan

## Outcomes
- Build comprehensive data processing pipeline for normalizing inputs
- Implement OpenAI-powered embedding generation with caching
- Create clustering algorithms for grouping similar nodes
- Develop relationship inference engine for AI-powered edge creation
- Establish scoring system for relevance and similarity calculations
- Build event system for extensibility and real-time updates

## Scope

### In Scope
- DataProcessor for normalizing any input to NeuronNode format
- EmbeddingsService with OpenAI integration and database caching
- ClusteringEngine with k-means and DBSCAN algorithms
- RelationshipEngine for AI-powered edge inference
- ScoringEngine for cosine similarity and relevance scoring
- AnalysisPipeline to orchestrate all operations
- EventBus with typed events and subscription management

### Out of Scope
- API endpoints (Phase 3)
- Visualization (Phase 4)
- Alternative embedding providers (future enhancement)

## Assumptions & Constraints
- OpenAI API key required for embeddings and inference
- Rate limiting must respect OpenAI quotas
- Embeddings cached in pgvector for fast similarity search
- Analysis jobs run asynchronously for large datasets

## Dependencies
- Phase 1: Core types, PostgreSQL client, migrations

## Execution Phases

### Phase 2.1 – Data Processor ✅
- [x] Create DataProcessor class
- [x] Implement input normalization (JSON, CSV, structured objects)
- [x] Implement slug generation from labels
- [x] Implement metadata extraction and flattening
- [x] Implement content preparation for embedding
- [x] Add validation with Zod schemas
- [x] Add duplicate detection logic

### Phase 2.2 – Embeddings Service ✅
- [x] Create EmbeddingsService class
- [x] Implement OpenAI client wrapper
- [x] Implement single embedding generation
- [x] Implement batch embedding generation with rate limiting
- [x] Implement embedding caching in PostgreSQL
- [x] Implement cache lookup before API calls
- [x] Add embedding model configuration
- [x] Add token counting and cost estimation

### Phase 2.3 – Clustering Engine ✅
- [x] Create ClusteringEngine class
- [x] Implement k-means clustering algorithm
- [x] Implement DBSCAN clustering algorithm
- [x] Implement hierarchical clustering (optional)
- [x] Implement cluster centroid calculation
- [x] Implement cluster label generation (AI-powered)
- [x] Implement node-to-cluster assignment
- [x] Implement incremental cluster updates
- [x] Add silhouette score calculation

### Phase 2.4 – Relationship Engine ✅
- [x] Create RelationshipEngine class
- [x] Implement similarity-based relationship detection
- [x] Implement AI-powered relationship inference
- [x] Build inference prompt templates per node type
- [x] Implement confidence scoring
- [x] Implement evidence extraction
- [x] Add relationship type suggestion
- [x] Implement batch inference with rate limiting
- [x] Add duplicate edge prevention

### Phase 2.5 – Scoring Engine ✅
- [x] Create ScoringEngine class
- [x] Implement cosine similarity calculation
- [x] Implement semantic search with pgvector
- [x] Implement relevance scoring for search results
- [x] Implement node importance scoring (PageRank-inspired)
- [x] Add multi-factor scoring (similarity + connections + recency)

### Phase 2.6 – Analysis Pipeline ✅
- [x] Create AnalysisPipeline class
- [x] Implement job queue management
- [x] Implement pipeline orchestration (embedding → cluster → infer)
- [x] Implement progress tracking and reporting
- [x] Implement partial failure handling
- [x] Implement job cancellation
- [x] Add webhook notification support
- [x] Add CLI integration for manual triggers

### Phase 2.7 – Event System ✅
- [x] Create EventBus class
- [x] Implement typed event emission
- [x] Implement subscription management
- [x] Implement event filtering by type/source
- [x] Implement async event handlers
- [x] Add event logging and debugging
- [x] Create React hook for event subscription (useNeuronEvents)

## Task Files

See `tasks/phase-2-analysis/` for individual task tracking:
- `task-2-1-data-processor.md`
- `task-2-2-embeddings-service.md`
- `task-2-3-clustering-engine.md`
- `task-2-4-relationship-engine.md`
- `task-2-5-scoring-engine.md`
- `task-2-6-analysis-pipeline.md`
- `task-2-7-event-system.md`

## API Contracts

### EmbeddingsService

```typescript
interface EmbeddingsService {
  generateEmbedding(text: string): Promise<number[]>;
  generateBatchEmbeddings(texts: string[]): Promise<number[][]>;
  getCachedEmbedding(nodeId: string): Promise<number[] | null>;
  cacheEmbedding(nodeId: string, embedding: number[]): Promise<void>;
}
```

### ClusteringEngine

```typescript
interface ClusteringEngine {
  clusterNodes(nodeIds: string[], config: ClusteringConfig): Promise<ClusteringResult[]>;
  assignToCluster(nodeId: string): Promise<ClusterMembership>;
  recomputeCentroid(clusterId: string): Promise<void>;
  generateClusterLabel(clusterId: string): Promise<string>;
}
```

### RelationshipEngine

```typescript
interface RelationshipEngine {
  inferRelationships(nodeId: string, options?: InferenceOptions): Promise<InferredRelationship[]>;
  inferBatchRelationships(nodeIds: string[]): Promise<InferredRelationship[]>;
  validateRelationship(relationship: InferredRelationship): Promise<boolean>;
}
```

### AnalysisPipeline

```typescript
interface AnalysisPipeline {
  runFullAnalysis(options?: AnalysisOptions): Promise<AnalysisRun>;
  runEmbeddings(nodeIds?: string[]): Promise<AnalysisRun>;
  runClustering(options?: ClusteringConfig): Promise<AnalysisRun>;
  runRelationshipInference(nodeIds?: string[]): Promise<AnalysisRun>;
  getJobStatus(jobId: string): Promise<AnalysisRun>;
  cancelJob(jobId: string): Promise<void>;
}
```

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| OpenAI rate limits | Exponential backoff, queue management |
| High API costs | Batch optimization, caching, cost alerts |
| Clustering quality | Multiple algorithm options, manual override |
| Inference hallucinations | Confidence thresholds, human review option |

## Open Questions
- None (resolved for initial release).

## Task Backlog
- None. All Phase 2 tasks completed.

## Parallel / Unblock Options
- Event system can be built independently
- Embeddings and clustering can be developed in parallel
- Relationship engine depends on embeddings

## Validation Criteria
- [x] Embeddings generate correctly for sample text
- [x] Embeddings cached and retrieved from database
- [x] Clustering produces meaningful groups
- [x] Relationships inferred with reasonable confidence
- [x] Full pipeline completes without errors
- [x] Events emit and subscribers receive correctly
