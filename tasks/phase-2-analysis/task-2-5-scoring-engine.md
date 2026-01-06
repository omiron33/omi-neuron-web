---
title: Scoring Engine - Relevance and Similarity
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

# Task 2.5: Scoring Engine

## Objective
Build a ScoringEngine for calculating relevance scores, similarity scores, and node importance rankings.

## Requirements

### 1. ScoringEngine Class (`src/core/analysis/scoring-engine.ts`)

```typescript
interface ScoringConfig {
  similarityWeight: number;     // Weight for embedding similarity
  connectionWeight: number;     // Weight for connection count
  recencyWeight: number;        // Weight for recency
  domainBoost: number;          // Boost for same domain
}

interface ScoredNode {
  node: NeuronNode;
  score: number;
  breakdown: {
    similarity: number;
    connections: number;
    recency: number;
    domainMatch: number;
  };
}

class ScoringEngine {
  constructor(db: Database, config?: ScoringConfig);
  
  // Similarity calculations
  cosineSimilarity(a: number[], b: number[]): number;
  async semanticSimilarity(nodeA: string, nodeB: string): Promise<number>;
  
  // Search scoring
  async scoreForQuery(
    queryEmbedding: number[],
    nodeIds?: string[]
  ): Promise<ScoredNode[]>;
  
  // Similar node finding
  async findSimilar(
    nodeId: string,
    limit?: number,
    excludeConnected?: boolean
  ): Promise<ScoredNode[]>;
  
  // Importance scoring (PageRank-inspired)
  async calculateNodeImportance(nodeId: string): Promise<number>;
  async rankAllNodes(): Promise<Array<{ nodeId: string; importance: number }>>;
  
  // Relevance scoring
  async scoreRelevance(
    sourceNodeId: string,
    candidateNodeIds: string[],
    context?: string
  ): Promise<ScoredNode[]>;
}
```

### 2. Cosine Similarity
- [ ] Implement in TypeScript
- [ ] Use pgvector for database queries
- [ ] Handle normalized vs unnormalized vectors

### 3. Semantic Search
- [ ] Generate query embedding
- [ ] Use pgvector similarity search
- [ ] Apply filters (domain, type, etc.)
- [ ] Return top-k results

### 4. Multi-Factor Scoring
- [ ] Combine similarity with metadata
- [ ] Apply configurable weights
- [ ] Normalize final scores

### 5. Node Importance (PageRank-style)
- [ ] Consider inbound edges
- [ ] Consider edge strength
- [ ] Iterative calculation
- [ ] Cache results

### 6. Context-Aware Relevance
- [ ] Factor in query context
- [ ] Domain alignment bonus
- [ ] Recency bonus (optional)

## Deliverables
- [ ] `src/core/analysis/scoring-engine.ts`
- [ ] Cosine similarity implementation
- [ ] pgvector query helpers
- [ ] Unit tests

## Acceptance Criteria
- Similarity scores are accurate
- Search returns relevant results
- Multi-factor scoring works
- Importance ranking is sensible
- Performance is acceptable

## SQL Helpers

```sql
-- Find similar nodes using pgvector
SELECT 
  id,
  label,
  1 - (embedding <=> $1) as similarity
FROM nodes
WHERE embedding IS NOT NULL
  AND id != $2
ORDER BY embedding <=> $1
LIMIT $3;

-- PageRank-style importance (simplified)
WITH edge_weights AS (
  SELECT 
    to_node_id,
    SUM(strength) as total_inbound
  FROM edges
  GROUP BY to_node_id
)
SELECT 
  n.id,
  COALESCE(ew.total_inbound, 0) + 
    (n.connection_count * 0.1) as importance
FROM nodes n
LEFT JOIN edge_weights ew ON n.id = ew.to_node_id
ORDER BY importance DESC;
```

## Notes
- pgvector operators: `<->` (L2), `<=>` (cosine), `<#>` (inner product)
- For cosine similarity with pgvector: `1 - (a <=> b)`
- Consider caching frequent queries
- May need batch processing for large graphs


