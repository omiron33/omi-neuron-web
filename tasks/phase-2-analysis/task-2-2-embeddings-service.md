---
title: Embeddings Service - OpenAI Integration
status: completed
priority: 1
labels:
  - 'Phase:2-Analysis'
  - 'Type:AI'
assignees:
  - CodingAgent
depends_on:
  - task-1-5-postgres-client
---

# Task 2.2: Embeddings Service

## Objective
Build an EmbeddingsService that generates text embeddings using OpenAI's API with caching, batching, and rate limiting.

## Requirements

### 1. EmbeddingsService Class (`src/core/analysis/embeddings-service.ts`)

```typescript
interface EmbeddingsConfig {
  openaiApiKey: string;
  model: 'text-embedding-ada-002' | 'text-embedding-3-small' | 'text-embedding-3-large';
  dimensions?: number;
  batchSize: number;        // Max items per API call
  rateLimit: number;        // Requests per minute
  cacheTTL: number;         // Cache duration in seconds
  maxRetries: number;
}

interface EmbeddingResult {
  nodeId: string;
  embedding: number[];
  model: string;
  tokenCount: number;
  cached: boolean;
}

class EmbeddingsService {
  constructor(config: EmbeddingsConfig, db: Database);
  
  // Generate embeddings
  async generateEmbedding(text: string): Promise<number[]>;
  async generateBatchEmbeddings(texts: string[]): Promise<number[][]>;
  
  // Node-specific operations
  async embedNode(nodeId: string): Promise<EmbeddingResult>;
  async embedNodes(nodeIds: string[]): Promise<{
    results: EmbeddingResult[];
    errors: Array<{ nodeId: string; error: string }>;
  }>;
  
  // Cache operations
  async getCachedEmbedding(nodeId: string): Promise<number[] | null>;
  async cacheEmbedding(nodeId: string, embedding: number[], model: string): Promise<void>;
  async invalidateCache(nodeIds?: string[]): Promise<void>;
  
  // Utilities
  countTokens(text: string): number;
  estimateCost(nodeCount: number): { tokens: number; cost: number };
}
```

### 2. OpenAI Client Wrapper
- [ ] Initialize OpenAI client
- [ ] Handle authentication
- [ ] Implement retry with exponential backoff
- [ ] Handle rate limit errors (429)
- [ ] Handle token limit errors

### 3. Batching Logic
- [ ] Group requests by batch size
- [ ] Respect rate limits
- [ ] Process batches concurrently (within limits)
- [ ] Report progress

### 4. Caching Strategy
- [ ] Store embeddings in PostgreSQL (vector column)
- [ ] Check cache before API call
- [ ] Store model version with embedding
- [ ] Invalidate on content change
- [ ] TTL-based expiration (optional)

### 5. Token Counting
- [ ] Use tiktoken or similar
- [ ] Truncate content to fit model limit
- [ ] Report token usage

### 6. Cost Estimation
- [ ] Calculate tokens per node
- [ ] Apply model pricing
- [ ] Return estimated cost

## Deliverables
- [ ] `src/core/analysis/embeddings-service.ts`
- [ ] OpenAI client wrapper
- [ ] Token counting utility
- [ ] Unit tests with mocked API

## Acceptance Criteria
- Embeddings generate correctly
- Cache prevents duplicate API calls
- Rate limiting respected
- Retries handle transient failures
- Cost estimation is accurate
- Progress events emitted

## Example Usage

```typescript
const embeddings = new EmbeddingsService({
  openaiApiKey: process.env.OPENAI_API_KEY!,
  model: 'text-embedding-3-small',
  batchSize: 20,
  rateLimit: 60,
  cacheTTL: 86400,
  maxRetries: 3,
}, db);

// Embed all nodes without embeddings
const pending = await db.query(
  'SELECT id FROM nodes WHERE embedding IS NULL'
);

const results = await embeddings.embedNodes(
  pending.map(n => n.id)
);

console.log(`Generated ${results.results.length} embeddings`);
```

## Notes
- text-embedding-3-small: 1536 dimensions, $0.02/1M tokens
- text-embedding-3-large: 3072 dimensions, $0.13/1M tokens
- text-embedding-ada-002: 1536 dimensions, $0.10/1M tokens (legacy)
- Use HNSW index for similarity search performance

