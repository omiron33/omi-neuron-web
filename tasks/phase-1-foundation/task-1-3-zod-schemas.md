---
title: Zod Validation Schemas
status: completed
priority: 2
labels:
  - 'Phase:1-Foundation'
  - 'Type:Validation'
assignees:
  - CodingAgent
depends_on:
  - task-1-2-type-system
---

# Task 1.3: Zod Schemas

## Objective
Create comprehensive Zod validation schemas for all types and API inputs to ensure runtime type safety.

## Requirements

### 1. Node Schemas (`src/core/schemas/node.ts`)
- [ ] `nodeCreateSchema` - validate node creation input
- [ ] `nodeUpdateSchema` - validate node update input
- [ ] `nodeBatchCreateSchema` - validate batch operations
- [ ] `nodeFilterSchema` - validate list query params
- [ ] Infer types from schemas

### 2. Edge Schemas (`src/core/schemas/edge.ts`)
- [ ] `edgeEvidenceSchema` - validate evidence objects
- [ ] `edgeCreateSchema` - validate edge creation
- [ ] `edgeUpdateSchema` - validate edge updates
- [ ] `edgeFilterSchema` - validate list query params

### 3. Cluster Schemas (`src/core/schemas/cluster.ts`)
- [ ] `clusterCreateSchema`
- [ ] `clusterUpdateSchema`
- [ ] `clusteringConfigSchema`

### 4. Analysis Schemas (`src/core/schemas/analysis.ts`)
- [ ] `analysisRequestSchema` - validate analysis triggers
- [ ] `analysisOptionsSchema` - validate analysis options

### 5. Settings Schemas (`src/core/schemas/settings.ts`)
- [ ] `visualizationSettingsSchema`
- [ ] `analysisSettingsSchema`
- [ ] `nodeTypeConfigSchema`
- [ ] `domainConfigSchema`
- [ ] `relationshipTypeConfigSchema`
- [ ] `neuronSettingsSchema` - full settings
- [ ] `neuronSettingsUpdateSchema` - partial updates
- [ ] `databaseSettingsSchema`
- [ ] `neuronConfigSchema` - full config file

### 6. API Schemas (`src/core/schemas/api.ts`)
- [ ] `paginationSchema`
- [ ] `listNodesParamsSchema`
- [ ] `listEdgesParamsSchema`
- [ ] `getGraphParamsSchema`
- [ ] `expandGraphRequestSchema`
- [ ] `findPathRequestSchema`
- [ ] `semanticSearchRequestSchema`
- [ ] `findSimilarRequestSchema`

### 7. Index Export (`src/core/schemas/index.ts`)
- [ ] Export all schemas
- [ ] Export inferred types

## Deliverables
- [ ] `src/core/schemas/node.ts`
- [ ] `src/core/schemas/edge.ts`
- [ ] `src/core/schemas/cluster.ts`
- [ ] `src/core/schemas/analysis.ts`
- [ ] `src/core/schemas/settings.ts`
- [ ] `src/core/schemas/api.ts`
- [ ] `src/core/schemas/index.ts`

## Schema Patterns

```typescript
import { z } from 'zod';

// Example: Node creation schema
export const nodeCreateSchema = z.object({
  slug: z.string().optional(),
  label: z.string().min(1).max(200),
  nodeType: z.string().optional(),
  domain: z.string().optional(),
  summary: z.string().max(1000).optional(),
  description: z.string().optional(),
  content: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
  tier: z.enum(['primary', 'secondary', 'tertiary', 'insight']).optional(),
});

export type NodeCreateInput = z.infer<typeof nodeCreateSchema>;
```

## Acceptance Criteria
- All API inputs have validation schemas
- Schemas match TypeScript types
- Error messages are user-friendly
- Validation is performant (no excessive refinements)
- Types can be inferred from schemas

## Notes
- Use `.optional()` appropriately
- Add `.transform()` for slug generation
- Consider `.refine()` for complex validations
- Export both schema and inferred type

