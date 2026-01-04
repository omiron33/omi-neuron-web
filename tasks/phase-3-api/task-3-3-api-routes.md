---
title: API Routes - All Endpoints
status: not_started
priority: 1
labels:
  - 'Phase:3-API'
  - 'Type:API'
assignees:
  - CodingAgent
depends_on:
  - task-3-1-repository-pattern
  - task-1-3-zod-schemas
---

# Task 3.3: API Routes

## Objective
Build all REST API route handlers for the neuron-web library.

## Requirements

### 1. Route Handler Factory (`src/api/routes/factory.ts`)

```typescript
// Export factory for consuming apps to use
export function createNeuronRoutes(config: NeuronConfig) {
  return {
    nodes: createNodesRoutes(config),
    edges: createEdgesRoutes(config),
    graph: createGraphRoutes(config),
    analyze: createAnalyzeRoutes(config),
    settings: createSettingsRoutes(config),
    search: createSearchRoutes(config),
    health: createHealthRoutes(config),
  };
}
```

### 2. Nodes Routes (`src/api/routes/nodes.ts`)
- [ ] `GET /` - List with filters
- [ ] `POST /` - Create single or batch
- [ ] `GET /:id` - Get with relations
- [ ] `PATCH /:id` - Update
- [ ] `DELETE /:id` - Delete

### 3. Edges Routes (`src/api/routes/edges.ts`)
- [ ] `GET /` - List with filters
- [ ] `POST /` - Create single or batch
- [ ] `GET /:id` - Get single
- [ ] `PATCH /:id` - Update
- [ ] `DELETE /:id` - Delete

### 4. Graph Routes (`src/api/routes/graph.ts`)
- [ ] `GET /` - Full graph for viz
- [ ] `POST /expand` - Expand from nodes
- [ ] `POST /path` - Find paths

### 5. Analysis Routes (`src/api/routes/analyze.ts`)
- [ ] `POST /` - Trigger analysis
- [ ] `GET /:jobId` - Check status
- [ ] `POST /:jobId/cancel` - Cancel job
- [ ] `GET /history` - List past jobs

### 6. Settings Routes (`src/api/routes/settings.ts`)
- [ ] `GET /` - Get current
- [ ] `PATCH /` - Update
- [ ] `POST /reset` - Reset sections
- [ ] `GET /schema` - Get JSON schema

### 7. Search Routes (`src/api/routes/search.ts`)
- [ ] `POST /` - Semantic search
- [ ] `POST /similar` - Find similar

### 8. Health Route (`src/api/routes/health.ts`)
- [ ] `GET /` - Health check

## Deliverables
- [ ] `src/api/routes/factory.ts`
- [ ] `src/api/routes/nodes.ts`
- [ ] `src/api/routes/edges.ts`
- [ ] `src/api/routes/graph.ts`
- [ ] `src/api/routes/analyze.ts`
- [ ] `src/api/routes/settings.ts`
- [ ] `src/api/routes/search.ts`
- [ ] `src/api/routes/health.ts`
- [ ] `src/api/routes/index.ts`

## Route Handler Pattern

```typescript
// Example: Nodes list handler
export function createNodesRoutes(config: NeuronConfig) {
  const repo = new NodeRepository(getDatabase());
  
  return {
    async GET(request: Request) {
      const url = new URL(request.url);
      const params = listNodesParamsSchema.parse(
        Object.fromEntries(url.searchParams)
      );
      
      const result = await repo.findAll(params);
      
      return Response.json({
        nodes: result.data,
        pagination: result.pagination,
        meta: { queryTime: result.queryTime },
      });
    },
    
    async POST(request: Request) {
      const body = await request.json();
      const input = createNodesRequestSchema.parse(body);
      
      const created = await repo.batchCreate(input.nodes, input.options);
      
      return Response.json(created, { status: 201 });
    },
  };
}
```

## Acceptance Criteria
- All endpoints return correct format
- Validation rejects invalid input
- Errors are informative
- Pagination works
- Performance is acceptable

## Notes
- Export as Next.js route handlers
- Use Zod for validation
- Consistent error format
- Include timing in responses

