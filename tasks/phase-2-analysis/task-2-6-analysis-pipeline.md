---
title: Analysis Pipeline - Orchestration
status: completed
priority: 1
labels:
  - 'Phase:2-Analysis'
  - 'Type:Pipeline'
assignees:
  - CodingAgent
depends_on:
  - task-2-1-data-processor
  - task-2-3-clustering-engine
  - task-2-4-relationship-engine
---

# Task 2.6: Analysis Pipeline

## Objective
Build an AnalysisPipeline that orchestrates all analysis operations with job tracking, progress reporting, and error handling.

## Requirements

### 1. AnalysisPipeline Class (`src/core/analysis/pipeline.ts`)

```typescript
interface PipelineOptions {
  nodeIds?: string[];           // Specific nodes or all
  forceRecompute?: boolean;     // Regenerate existing
  
  // Embedding options
  skipEmbeddings?: boolean;
  embeddingModel?: string;
  
  // Clustering options
  skipClustering?: boolean;
  clusterCount?: number;
  clusteringAlgorithm?: ClusteringAlgorithm;
  
  // Relationship options
  skipRelationships?: boolean;
  relationshipThreshold?: number;
  maxRelationshipsPerNode?: number;
  
  // Callbacks
  onProgress?: (progress: PipelineProgress) => void;
  webhookUrl?: string;
}

interface PipelineProgress {
  stage: 'embeddings' | 'clustering' | 'relationships' | 'complete';
  progress: number;             // 0-100
  currentItem: string;
  itemsProcessed: number;
  totalItems: number;
  estimatedTimeRemaining?: number;
}

class AnalysisPipeline {
  constructor(
    db: Database,
    embeddings: EmbeddingsService,
    clustering: ClusteringEngine,
    relationships: RelationshipEngine,
    events: EventBus
  );
  
  // Full pipeline
  async runFull(options?: PipelineOptions): Promise<AnalysisRun>;
  
  // Individual stages
  async runEmbeddings(options?: PipelineOptions): Promise<AnalysisRun>;
  async runClustering(options?: PipelineOptions): Promise<AnalysisRun>;
  async runRelationships(options?: PipelineOptions): Promise<AnalysisRun>;
  
  // Job management
  async getJob(jobId: string): Promise<AnalysisRun | null>;
  async listJobs(options?: { status?: string; limit?: number }): Promise<AnalysisRun[]>;
  async cancelJob(jobId: string): Promise<boolean>;
  
  // Status
  getActiveJobs(): AnalysisRun[];
  isRunning(): boolean;
}
```

### 2. Job Tracking
- [ ] Create AnalysisRun record on start
- [ ] Update progress periodically
- [ ] Record completion/failure
- [ ] Store results summary

### 3. Pipeline Stages
```
1. Embeddings
   - Identify nodes without embeddings (or all if force)
   - Generate in batches
   - Update node records

2. Clustering
   - Run clustering algorithm
   - Create/update cluster records
   - Assign nodes to clusters
   - Generate cluster labels

3. Relationships
   - Find candidates for each node
   - Run AI inference
   - Create edge records
```

### 4. Progress Reporting
- [ ] Emit progress events
- [ ] Calculate ETA
- [ ] Report per-stage progress
- [ ] Call webhook on completion

### 5. Error Handling
- [ ] Continue on individual item failure
- [ ] Collect all errors
- [ ] Partial results on failure
- [ ] Rollback option (optional)

### 6. Cancellation
- [ ] Check cancellation flag between items
- [ ] Clean up partial state
- [ ] Mark job as cancelled

### 7. Concurrency
- [ ] Queue management for multiple jobs
- [ ] Configurable concurrency limit
- [ ] Priority ordering (optional)

## Deliverables
- [ ] `src/core/analysis/pipeline.ts`
- [ ] Job tracking logic
- [ ] Progress calculation
- [ ] Unit tests

## Acceptance Criteria
- Full pipeline completes successfully
- Progress updates are accurate
- Cancellation works mid-pipeline
- Partial failures don't crash pipeline
- Job history persists
- Events emitted at key points

## Example Usage

```typescript
const pipeline = new AnalysisPipeline(
  db, embeddings, clustering, relationships, events
);

// Run full analysis
const job = await pipeline.runFull({
  forceRecompute: false,
  clusterCount: 10,
  relationshipThreshold: 0.7,
  onProgress: (p) => {
    console.log(`${p.stage}: ${p.progress}%`);
  },
});

console.log(`Completed in ${job.durationMs}ms`);
console.log(`Embeddings: ${job.results.embeddingsGenerated}`);
console.log(`Clusters: ${job.results.clustersCreated}`);
console.log(`Relationships: ${job.results.relationshipsInferred}`);
```

## Notes
- Use AbortController pattern for cancellation
- Consider background worker for long jobs
- Webhook payload should match AnalysisRun schema
- Emit events for UI updates


