---
title: Relationship Engine - AI-Powered Edge Inference
status: completed
priority: 2
labels:
  - 'Phase:2-Analysis'
  - 'Type:AI'
assignees:
  - CodingAgent
depends_on:
  - task-2-2-embeddings-service
---

# Task 2.4: Relationship Engine

## Objective
Build a RelationshipEngine that uses OpenAI to infer relationships between nodes based on content similarity and semantic analysis.

## Requirements

### 1. RelationshipEngine Class (`src/core/analysis/relationship-engine.ts`)

```typescript
interface InferenceConfig {
  model: string;              // e.g., 'gpt-4o-mini'
  minConfidence: number;      // 0-1, threshold for creating edge
  maxPerNode: number;         // Max relationships to infer per node
  similarityThreshold: number; // Min similarity to consider
  includeExisting: boolean;   // Re-analyze nodes with edges
  batchSize: number;
  rateLimit: number;
}

interface InferredRelationship {
  fromNodeId: string;
  toNodeId: string;
  relationshipType: RelationshipType;
  confidence: number;
  reasoning: string;
  evidence: EdgeEvidence[];
}

class RelationshipEngine {
  constructor(db: Database, config: InferenceConfig);
  
  // Inference operations
  async inferForNode(nodeId: string): Promise<InferredRelationship[]>;
  async inferForNodes(nodeIds: string[]): Promise<{
    inferred: InferredRelationship[];
    errors: Array<{ nodeId: string; error: string }>;
  }>;
  async inferAll(): Promise<InferredRelationship[]>;
  
  // Candidate selection
  async findCandidates(nodeId: string): Promise<Array<{
    nodeId: string;
    similarity: number;
  }>>;
  
  // Validation
  async validateRelationship(rel: InferredRelationship): Promise<boolean>;
  
  // Edge creation
  async createEdgesFromInferences(
    inferences: InferredRelationship[],
    autoApprove?: boolean
  ): Promise<NeuronEdge[]>;
}
```

### 2. Candidate Selection
- [ ] Find similar nodes using embedding similarity
- [ ] Filter by similarity threshold
- [ ] Exclude already-connected nodes (optional)
- [ ] Limit candidates per node

### 3. AI Inference Prompt

```typescript
const INFERENCE_PROMPT = `
You are analyzing potential relationships between concepts in a knowledge graph.

Node A:
- Label: {nodeA.label}
- Summary: {nodeA.summary}
- Content: {nodeA.content}

Node B:
- Label: {nodeB.label}
- Summary: {nodeB.summary}
- Content: {nodeB.content}

Determine if there is a meaningful relationship between these nodes.

Respond in JSON:
{
  "hasRelationship": boolean,
  "relationshipType": "related_to" | "derives_from" | "contradicts" | "supports" | "references" | "part_of" | "leads_to" | "similar_to",
  "confidence": 0.0-1.0,
  "reasoning": "Brief explanation",
  "evidence": ["Specific quote or fact supporting this"]
}
`;
```

### 4. Relationship Type Classification
- [ ] `related_to` - Generic connection
- [ ] `derives_from` - Causal/source
- [ ] `contradicts` - Opposing
- [ ] `supports` - Evidence
- [ ] `references` - Citation
- [ ] `part_of` - Hierarchical
- [ ] `leads_to` - Sequential
- [ ] `similar_to` - Similarity

### 5. Batch Processing
- [ ] Group candidates by node
- [ ] Process within rate limits
- [ ] Track progress
- [ ] Handle partial failures

### 6. Confidence Scoring
- [ ] AI-provided confidence
- [ ] Adjust by similarity score
- [ ] Minimum threshold filter

## Deliverables
- [ ] `src/core/analysis/relationship-engine.ts`
- [ ] Prompt templates
- [ ] Candidate selection logic
- [ ] Unit tests with mocked AI

## Acceptance Criteria
- Relationships inferred with reasonable accuracy
- Confidence scores are calibrated
- Rate limits respected
- Duplicate edges prevented
- Reasoning is helpful

## Example Usage

```typescript
const engine = new RelationshipEngine(db, {
  model: 'gpt-4o-mini',
  minConfidence: 0.7,
  maxPerNode: 10,
  similarityThreshold: 0.75,
  includeExisting: false,
  batchSize: 10,
  rateLimit: 30,
});

// Infer for specific nodes
const results = await engine.inferForNodes(['node-1', 'node-2']);

// Create edges from high-confidence inferences
const edges = await engine.createEdgesFromInferences(
  results.inferred.filter(r => r.confidence >= 0.8)
);
```

## Notes
- gpt-4o-mini is cost-effective for classification
- Consider structured output format (JSON mode)
- May need custom prompts per node type
- Human review option for borderline cases


