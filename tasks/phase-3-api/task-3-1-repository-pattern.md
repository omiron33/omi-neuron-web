---
title: Repository Pattern - Data Access Layer
status: completed
priority: 1
labels:
  - 'Phase:3-API'
  - 'Type:Database'
assignees:
  - CodingAgent
depends_on:
  - task-1-5-postgres-client
  - task-1-2-type-system
---

# Task 3.1: Repository Pattern

## Objective
Build repository classes for clean data access with CRUD operations for all entities.

## Requirements

### 1. BaseRepository (`src/api/repositories/base.ts`)

```typescript
abstract class BaseRepository<T, CreateDTO, UpdateDTO> {
  constructor(protected db: Database, protected tableName: string);
  
  async findById(id: string): Promise<T | null>;
  async findAll(options?: QueryOptions): Promise<T[]>;
  async create(data: CreateDTO): Promise<T>;
  async update(id: string, data: UpdateDTO): Promise<T | null>;
  async delete(id: string): Promise<boolean>;
  async count(where?: WhereClause): Promise<number>;
  
  protected buildQuery(options: QueryOptions): string;
  protected mapRow(row: Record<string, unknown>): T;
}
```

### 2. NodeRepository (`src/api/repositories/node-repository.ts`)
- [ ] Extend BaseRepository
- [ ] `findBySlug(slug: string)`
- [ ] `findByDomain(domain: string)`
- [ ] `findByCluster(clusterId: string)`
- [ ] `search(query: string)`
- [ ] `batchCreate(nodes: NeuronNodeCreate[])`
- [ ] `updateConnectionCounts(nodeId: string)`

### 3. EdgeRepository (`src/api/repositories/edge-repository.ts`)
- [ ] Extend BaseRepository
- [ ] `findByNodeId(nodeId: string, direction?: 'inbound' | 'outbound' | 'both')`
- [ ] `findBetweenNodes(fromId: string, toId: string)`
- [ ] `deleteByNodeId(nodeId: string)`
- [ ] `batchCreate(edges: NeuronEdgeCreate[])`

### 4. ClusterRepository (`src/api/repositories/cluster-repository.ts`)
- [ ] Extend BaseRepository
- [ ] `findWithMembers(clusterId: string)`
- [ ] `updateCentroid(clusterId: string, centroid: number[])`
- [ ] `addMember(clusterId: string, nodeId: string, similarity: number)`
- [ ] `removeMember(clusterId: string, nodeId: string)`

### 5. SettingsRepository (`src/api/repositories/settings-repository.ts`)
- [ ] `get()` - Get current settings
- [ ] `update(settings: NeuronSettingsUpdate)` - Deep merge update
- [ ] `reset(sections?: string[])` - Reset to defaults

### 6. AnalysisRunRepository (`src/api/repositories/analysis-run-repository.ts`)
- [ ] Extend BaseRepository
- [ ] `findActive()` - Get running jobs
- [ ] `updateProgress(id: string, progress: number)`
- [ ] `markCompleted(id: string, results: object)`
- [ ] `markFailed(id: string, error: string)`

## Deliverables
- [ ] `src/api/repositories/base.ts`
- [ ] `src/api/repositories/node-repository.ts`
- [ ] `src/api/repositories/edge-repository.ts`
- [ ] `src/api/repositories/cluster-repository.ts`
- [ ] `src/api/repositories/settings-repository.ts`
- [ ] `src/api/repositories/analysis-run-repository.ts`
- [ ] `src/api/repositories/index.ts`
- [ ] Unit tests

## Acceptance Criteria
- All CRUD operations work
- Transactions supported
- Proper error handling
- Type-safe returns
- SQL injection prevented

## Notes
- Use parameterized queries always
- Handle JSON columns (metadata, evidence)
- Handle array columns (keywords, position_override)
- Handle vector columns (embedding, centroid)

