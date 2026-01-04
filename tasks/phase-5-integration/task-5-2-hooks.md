---
title: React Hooks - Graph, Nodes, Analysis, Settings, Search
status: not_started
priority: 1
labels:
  - 'Phase:5-Integration'
  - 'Type:React'
assignees:
  - CodingAgent
depends_on:
  - task-5-1-provider
---

# Task 5.2: React Hooks

## Objective
Build comprehensive React hooks for all library functionality.

## Requirements

### 1. useNeuronGraph (`src/react/hooks/useNeuronGraph.ts`)

```typescript
interface UseNeuronGraphOptions {
  domains?: string[];
  nodeTypes?: string[];
  minEdgeStrength?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

function useNeuronGraph(options?: UseNeuronGraphOptions): {
  // Data
  nodes: NeuronVisualNode[];
  edges: NeuronVisualEdge[];
  clusters: NeuronVisualCluster[];
  
  // State
  isLoading: boolean;
  error: Error | null;
  
  // Filters
  filters: GraphFilters;
  setFilters: (filters: Partial<GraphFilters>) => void;
  clearFilters: () => void;
  
  // Selection
  selectedNode: NeuronNode | null;
  selectNode: (nodeId: string | null) => void;
  clearSelection: () => void;
  
  // Actions
  refetch: () => Promise<void>;
  expandFromNode: (nodeId: string, depth?: number) => Promise<void>;
  findPath: (fromId: string, toId: string) => Promise<PathResult>;
};
```

### 2. useNeuronNodes (`src/react/hooks/useNeuronNodes.ts`)

```typescript
interface UseNeuronNodesOptions {
  initialFilters?: ListNodesParams;
  pageSize?: number;
}

function useNeuronNodes(options?: UseNeuronNodesOptions): {
  nodes: NeuronNode[];
  isLoading: boolean;
  error: Error | null;
  
  createNode: (data: NeuronNodeCreate) => Promise<NeuronNode>;
  updateNode: (id: string, data: NeuronNodeUpdate) => Promise<NeuronNode>;
  deleteNode: (id: string) => Promise<void>;
  batchCreate: (nodes: NeuronNodeCreate[], options?: BatchOptions) => Promise<NeuronNode[]>;
  
  search: (query: string) => Promise<void>;
  
  pagination: {
    page: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  setPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
};
```

### 3. useNeuronAnalysis (`src/react/hooks/useNeuronAnalysis.ts`)

```typescript
function useNeuronAnalysis(): {
  activeJobs: AnalysisRun[];
  jobHistory: AnalysisRun[];
  
  startAnalysis: (request: AnalysisRequest) => Promise<AnalysisResponse>;
  cancelJob: (jobId: string) => Promise<void>;
  getJobStatus: (jobId: string) => Promise<AnalysisRun>;
  
  isRunning: boolean;
  currentProgress: number | null;
};
```

### 4. useNeuronSettings (`src/react/hooks/useNeuronSettings.ts`)

```typescript
function useNeuronSettings(): {
  settings: NeuronSettings;
  isLoading: boolean;
  isUpdating: boolean;
  error: Error | null;
  
  updateSettings: (updates: NeuronSettingsUpdate) => Promise<void>;
  resetSettings: (sections?: string[]) => Promise<void>;
  
  // Convenience methods
  setDomainColor: (domain: string, color: string) => Promise<void>;
  setVisualization: (updates: Partial<VisualizationSettings>) => Promise<void>;
};
```

### 5. useNeuronSearch (`src/react/hooks/useNeuronSearch.ts`)

```typescript
function useNeuronSearch(): {
  results: SearchResult[];
  isSearching: boolean;
  error: Error | null;
  
  search: (query: string, options?: SemanticSearchOptions) => Promise<void>;
  findSimilar: (nodeId: string, options?: FindSimilarOptions) => Promise<void>;
  
  clearResults: () => void;
};
```

### 6. useNeuronEvents (`src/react/hooks/useNeuronEvents.ts`)

```typescript
function useNeuronEvents(): {
  subscribe: <T>(type: NeuronEventType, handler: EventHandler<T>) => void;
  emit: <T>(type: NeuronEventType, payload: T) => void;
};

// Also provide targeted hooks
function useNodeEvents(handlers: {
  onCreated?: (node: NeuronNode) => void;
  onUpdated?: (node: NeuronNode) => void;
  onDeleted?: (nodeId: string) => void;
}): void;

function useAnalysisEvents(handlers: {
  onStarted?: (jobId: string) => void;
  onProgress?: (jobId: string, progress: number) => void;
  onCompleted?: (job: AnalysisRun) => void;
  onFailed?: (jobId: string, error: string) => void;
}): void;
```

## Deliverables
- [ ] `src/react/hooks/useNeuronGraph.ts`
- [ ] `src/react/hooks/useNeuronNodes.ts`
- [ ] `src/react/hooks/useNeuronAnalysis.ts`
- [ ] `src/react/hooks/useNeuronSettings.ts`
- [ ] `src/react/hooks/useNeuronSearch.ts`
- [ ] `src/react/hooks/useNeuronEvents.ts`
- [ ] `src/react/hooks/index.ts`

## Acceptance Criteria
- All hooks work correctly
- Loading states accurate
- Error handling consistent
- Cache invalidation works
- Events trigger updates

## Notes
- Use SWR-like patterns for caching
- Implement optimistic updates where appropriate
- Handle race conditions
- Clean up subscriptions on unmount

