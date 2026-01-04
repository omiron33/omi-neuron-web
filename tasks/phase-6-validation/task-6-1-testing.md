---
title: Testing - Unit, Integration, Visual
status: completed
priority: 1
labels:
  - 'Phase:6-Validation'
  - 'Type:Testing'
assignees:
  - CodingAgent
depends_on:
  - phase-5-integration
---

# Task 6.1: Testing

## Objective
Build comprehensive test suite covering core modules, API routes, and visualization.

## Requirements

### 1. Test Configuration (`vitest.config.ts`)

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['**/node_modules/**', '**/dist/**', '**/examples/**'],
    },
  },
});
```

### 2. Core Module Tests (`tests/core/`)

```typescript
// tests/core/data-processor.test.ts
describe('DataProcessor', () => {
  it('normalizes JSON input to NeuronNodeCreate');
  it('generates unique slugs');
  it('extracts content from multiple fields');
  it('detects duplicates by slug');
  it('handles malformed input gracefully');
});

// tests/core/embeddings-service.test.ts
describe('EmbeddingsService', () => {
  it('generates embeddings via OpenAI');
  it('caches embeddings in database');
  it('returns cached embeddings');
  it('handles rate limiting');
  it('batches requests efficiently');
});

// tests/core/clustering-engine.test.ts
describe('ClusteringEngine', () => {
  it('clusters nodes with k-means');
  it('clusters nodes with DBSCAN');
  it('calculates centroids correctly');
  it('assigns new nodes to clusters');
  it('generates cluster labels');
});

// tests/core/relationship-engine.test.ts
describe('RelationshipEngine', () => {
  it('finds candidate nodes by similarity');
  it('infers relationships via AI');
  it('respects confidence threshold');
  it('creates edges from inferences');
});

// tests/core/event-bus.test.ts
describe('EventBus', () => {
  it('emits events to subscribers');
  it('filters events by type');
  it('unsubscribes correctly');
  it('handles async handlers');
});
```

### 3. API Tests (`tests/api/`)

```typescript
// tests/api/nodes.test.ts
describe('Nodes API', () => {
  it('GET /nodes returns paginated list');
  it('POST /nodes creates single node');
  it('POST /nodes creates batch nodes');
  it('GET /nodes/:id returns node with relations');
  it('PATCH /nodes/:id updates node');
  it('DELETE /nodes/:id removes node and edges');
  it('validates input with Zod');
  it('returns proper error format');
});

// tests/api/graph.test.ts
describe('Graph API', () => {
  it('GET /graph returns filtered graph');
  it('POST /graph/expand expands from seed nodes');
  it('POST /graph/path finds shortest path');
  it('respects node limits');
});

// tests/api/analyze.test.ts
describe('Analysis API', () => {
  it('POST /analyze starts analysis job');
  it('GET /analyze/:id returns job status');
  it('POST /analyze/:id/cancel cancels job');
});
```

### 4. Visualization Tests (`tests/visualization/`)

```typescript
// tests/visualization/neuron-web.test.tsx
describe('NeuronWeb', () => {
  it('renders without errors');
  it('displays nodes from graphData');
  it('calls onNodeClick when node clicked');
  it('updates when graphData changes');
  it('handles empty graph gracefully');
  it('applies theme colors');
});
```

### 5. Integration Tests (`tests/integration/`)

```typescript
// tests/integration/full-pipeline.test.ts
describe('Full Pipeline', () => {
  it('processes nodes end-to-end');
  it('generates embeddings and clusters');
  it('infers relationships');
  it('handles failures gracefully');
});
```

### 6. Test Utilities

```typescript
// tests/utils/fixtures.ts
export const mockNodes: NeuronNode[] = [...];
export const mockEdges: NeuronEdge[] = [...];
export const mockGraphData = { nodes: mockNodes, edges: mockEdges };

// tests/utils/mocks.ts
export const mockOpenAI = {...};
export const mockDatabase = {...};
```

## Deliverables
- [ ] `vitest.config.ts`
- [ ] `tests/setup.ts`
- [ ] `tests/core/*.test.ts`
- [ ] `tests/api/*.test.ts`
- [ ] `tests/visualization/*.test.tsx`
- [ ] `tests/integration/*.test.ts`
- [ ] `tests/utils/`

## Acceptance Criteria
- 80%+ code coverage on core
- All API endpoints tested
- Component renders tested
- CI passes all tests

## Notes
- Mock OpenAI API calls
- Use test database
- Reset state between tests
- Use realistic fixtures

