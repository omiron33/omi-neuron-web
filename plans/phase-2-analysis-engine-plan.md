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

### Phase 2.1 – Data Processor 🟥
- [ ] Create DataProcessor class
- [ ] Implement input normalization (JSON, CSV, structured objects)
- [ ] Implement slug generation from labels
- [ ] Implement metadata extraction and flattening
- [ ] Implement content preparation for embedding
- [ ] Add validation with Zod schemas
- [ ] Add duplicate detection logic

### Phase 2.2 – Embeddings Service 🟥
- [ ] Create EmbeddingsService class
- [ ] Implement OpenAI client wrapper
- [ ] Implement single embedding generation
- [ ] Implement batch embedding generation with rate limiting
- [ ] Implement embedding caching in PostgreSQL
- [ ] Implement cache lookup before API calls
- [ ] Add embedding model configuration
- [ ] Add token counting and cost estimation

### Phase 2.3 – Clustering Engine 🟥
- [ ] Create ClusteringEngine class
- [ ] Implement k-means clustering algorithm
- [ ] Implement DBSCAN clustering algorithm
- [ ] Implement hierarchical clustering (optional)
- [ ] Implement cluster centroid calculation
- [ ] Implement cluster label generation (AI-powered)
- [ ] Implement node-to-cluster assignment
- [ ] Implement incremental cluster updates
- [ ] Add silhouette score calculation

### Phase 2.4 – Relationship Engine 🟥
- [ ] Create RelationshipEngine class
- [ ] Implement similarity-based relationship detection
- [ ] Implement AI-powered relationship inference
- [ ] Build inference prompt templates per node type
- [ ] Implement confidence scoring
- [ ] Implement evidence extraction
- [ ] Add relationship type suggestion
- [ ] Implement batch inference with rate limiting
- [ ] Add duplicate edge prevention

### Phase 2.5 – Scoring Engine 🟥
- [ ] Create ScoringEngine class
- [ ] Implement cosine similarity calculation
- [ ] Implement semantic search with pgvector
- [ ] Implement relevance scoring for search results
- [ ] Implement node importance scoring (PageRank-inspired)
- [ ] Add multi-factor scoring (similarity + connections + recency)

### Phase 2.6 – Analysis Pipeline 🟥
- [ ] Create AnalysisPipeline class
- [ ] Implement job queue management
- [ ] Implement pipeline orchestration (embedding → cluster → infer)
- [ ] Implement progress tracking and reporting
- [ ] Implement partial failure handling
- [ ] Implement job cancellation
- [ ] Add webhook notification support
- [ ] Add CLI integration for manual triggers

### Phase 2.7 – Event System 🟥
- [ ] Create EventBus class
- [ ] Implement typed event emission
- [ ] Implement subscription management
- [ ] Implement event filtering by type/source
- [ ] Implement async event handlers
- [ ] Add event logging and debugging
- [ ] Create React hook for event subscription (useNeuronEvents)

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
- Should we support local embedding models (Ollama)?
- Real-time embedding updates on node content changes?
- Background job persistence across server restarts?

## Parallel / Unblock Options
- Event system can be built independently
- Embeddings and clustering can be developed in parallel
- Relationship engine depends on embeddings

## Validation Criteria
- [ ] Embeddings generate correctly for sample text
- [ ] Embeddings cached and retrieved from database
- [ ] Clustering produces meaningful groups
- [ ] Relationships inferred with reasonable confidence
- [ ] Full pipeline completes without errors
- [ ] Events emit and subscribers receive correctly

