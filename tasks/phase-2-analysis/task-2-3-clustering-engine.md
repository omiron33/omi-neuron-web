---
title: Clustering Engine - K-means and DBSCAN
status: completed
priority: 2
labels:
  - 'Phase:2-Analysis'
  - 'Type:ML'
assignees:
  - CodingAgent
depends_on:
  - task-2-2-embeddings-service
---

# Task 2.3: Clustering Engine

## Objective
Build a ClusteringEngine that groups similar nodes using k-means and DBSCAN algorithms based on embedding vectors.

## Requirements

### 1. ClusteringEngine Class (`src/core/analysis/clustering-engine.ts`)

```typescript
interface ClusteringConfig {
  algorithm: 'kmeans' | 'dbscan' | 'hierarchical';
  clusterCount?: number;      // For k-means
  minClusterSize?: number;
  similarityThreshold?: number;
  epsilon?: number;           // For DBSCAN
  minSamples?: number;        // For DBSCAN
}

interface ClusteringResult {
  clusterId: string;
  label: string;
  nodeIds: string[];
  centroid: number[];
  avgSimilarity: number;
  cohesion: number;
}

class ClusteringEngine {
  constructor(db: Database, embeddings: EmbeddingsService);
  
  // Clustering operations
  async clusterNodes(config: ClusteringConfig): Promise<{
    clusters: ClusteringResult[];
    unassigned: string[];
  }>;
  
  async recluster(config: ClusteringConfig): Promise<ClusteringResult[]>;
  
  // Single node operations
  async assignToCluster(nodeId: string): Promise<ClusterMembership | null>;
  async findBestCluster(embedding: number[]): Promise<{
    clusterId: string;
    similarity: number;
  } | null>;
  
  // Cluster management
  async recomputeCentroid(clusterId: string): Promise<void>;
  async recomputeAllCentroids(): Promise<void>;
  async generateClusterLabel(clusterId: string): Promise<string>;
  async generateAllLabels(): Promise<void>;
  
  // Quality metrics
  calculateSilhouetteScore(clusters: ClusteringResult[]): number;
  calculateCohesion(cluster: ClusteringResult): number;
}
```

### 2. K-Means Implementation
- [ ] Initialize centroids (k-means++)
- [ ] Iterate until convergence
- [ ] Handle empty clusters
- [ ] Optimize with pgvector operations

### 3. DBSCAN Implementation
- [ ] Density-based clustering
- [ ] Handle noise points
- [ ] No predefined cluster count

### 4. Centroid Management
- [ ] Calculate mean of member embeddings
- [ ] Store in clusters table
- [ ] Update on membership change

### 5. Label Generation
- [ ] Extract keywords from member nodes
- [ ] Use OpenAI for label suggestion
- [ ] Allow manual override

### 6. Incremental Updates
- [ ] Add new node to existing cluster
- [ ] Handle cluster splits
- [ ] Handle cluster merges

## Deliverables
- [ ] `src/core/analysis/clustering-engine.ts`
- [ ] K-means algorithm implementation
- [ ] DBSCAN algorithm implementation
- [ ] Quality metrics calculation
- [ ] Unit tests

## Acceptance Criteria
- K-means produces k clusters
- DBSCAN identifies density-based clusters
- Centroids calculated correctly
- Labels are meaningful
- Incremental updates work
- Quality scores calculated

## Algorithm Details

### K-Means++
```
1. Choose first centroid randomly
2. For each remaining centroid:
   - Calculate distance to nearest centroid for each point
   - Choose next centroid with probability proportional to distance²
3. Assign points to nearest centroid
4. Recalculate centroids as mean of assigned points
5. Repeat 3-4 until convergence
```

### DBSCAN
```
1. For each unvisited point:
   - Find neighbors within epsilon distance
   - If neighbors >= minSamples, start new cluster
   - Recursively add density-reachable points
   - Otherwise mark as noise
2. Noise points may be assigned to nearest cluster or left unassigned
```

## Notes
- Use cosine distance for embeddings (not Euclidean)
- pgvector supports cosine similarity: `1 - (a <=> b)`
- Silhouette score: (b - a) / max(a, b) where a=intra-cluster, b=inter-cluster
- Consider memory for large embedding matrices


