# Phase 5: React Integration Plan

## Outcomes
- Build NeuronWebProvider for application-wide configuration
- Create comprehensive React hooks for all library features
- Implement Next.js configuration wrapper
- Deliver working examples for different use cases
- Ensure seamless integration experience for consuming applications

## Scope

### In Scope
- NeuronWebProvider context component
- useNeuronGraph hook for graph data management
- useNeuronNodes hook for CRUD operations
- useNeuronAnalysis hook for job management
- useNeuronSettings hook for configuration
- useNeuronSearch hook for semantic search
- useNeuronEvents hook for event subscription
- withNeuronWeb Next.js config wrapper
- Example: basic-usage (minimal setup)
- Example: narrative-analysis (psyopbuilder use case)
- Example: knowledge-graph (technochristian use case)

### Out of Scope
- Server components (client-side only for visualization)
- SSR for Three.js (not supported)
- State management library integration (use internal state)

## Assumptions & Constraints
- React 18+ for concurrent features
- Next.js 13+ with App Router
- All hooks use SWR-like patterns for caching
- Provider must be client component

## Dependencies
- Phase 2: Event system
- Phase 3: All API endpoints
- Phase 4: NeuronWeb component

## Execution Phases

### Phase 5.1 – NeuronWebProvider ✅
- [x] Create NeuronWebProvider component
- [x] Implement configuration context
- [x] Implement API client initialization
- [x] Implement event bus initialization
- [x] Add error boundary integration
- [x] Create useNeuronConfig hook
- [x] Add provider nesting detection/warning

### Phase 5.2 – useNeuronGraph Hook ✅
- [x] Create useNeuronGraph hook
- [x] Implement graph data fetching
- [x] Implement filter state management
- [x] Implement selection state management
- [x] Implement graph expansion helper
- [x] Implement path finding helper
- [x] Add automatic refetch on filter change
- [x] Add loading/error state management

### Phase 5.3 – useNeuronNodes Hook ✅
- [x] Create useNeuronNodes hook
- [x] Implement node listing with pagination
- [x] Implement single node fetching
- [x] Implement node creation
- [x] Implement node update
- [x] Implement node deletion
- [x] Implement batch operations
- [x] Add optimistic updates
- [x] Add cache invalidation

### Phase 5.4 – useNeuronAnalysis Hook ✅
- [x] Create useNeuronAnalysis hook
- [x] Implement analysis job triggering
- [x] Implement job status polling
- [x] Implement job cancellation
- [x] Implement job history listing
- [x] Add progress event subscription
- [x] Add completion callbacks

### Phase 5.5 – useNeuronSettings Hook ✅
- [x] Create useNeuronSettings hook
- [x] Implement settings fetching
- [x] Implement settings update
- [x] Implement settings reset
- [x] Add optimistic updates
- [x] Implement validation before save

### Phase 5.6 – useNeuronSearch Hook ✅
- [x] Create useNeuronSearch hook
- [x] Implement semantic search
- [x] Implement find similar
- [x] Add debounced search input
- [x] Add result caching
- [x] Implement search history

### Phase 5.7 – useNeuronEvents Hook ✅
- [x] Create useNeuronEvents hook
- [x] Implement event subscription
- [x] Implement event emission
- [x] Add type-safe event handlers
- [x] Implement subscription cleanup
- [x] Add event filtering helpers

### Phase 5.8 – Next.js Integration ✅
- [x] Create withNeuronWeb config wrapper
- [x] Implement webpack externals for Three.js
- [x] Add transpilePackages configuration
- [x] Create middleware helpers (optional)
- [x] Document server component boundaries
- [x] Add TypeScript plugin for better DX

### Phase 5.9 – Example: Basic Usage ✅
- [x] Create examples/basic-usage directory
- [x] Set up minimal Next.js app
- [x] Implement basic graph page
- [x] Add node creation form
- [x] Add analysis trigger button
- [x] Add README with setup instructions
- [x] Add docker-compose for database

### Phase 5.10 – Example: Narrative Analysis ✅
- [x] Create examples/narrative-analysis directory
- [x] Set up psyopbuilder-style configuration
- [x] Implement claim/entity node types
- [x] Add bias lens filtering
- [x] Add narrative thread visualization
- [x] Document use case and customization

### Phase 5.11 – Example: Knowledge Graph ✅
- [x] Create examples/knowledge-graph directory
- [x] Set up technochristian-style configuration
- [x] Implement concept node types
- [x] Add scripture reference support
- [x] Add study path feature
- [x] Document use case and customization

## Task Files

See `tasks/phase-5-integration/` for individual task tracking:
- `task-5-1-provider.md`
- `task-5-2-use-neuron-graph.md`
- `task-5-3-use-neuron-nodes.md`
- `task-5-4-use-neuron-analysis.md`
- `task-5-5-use-neuron-settings.md`
- `task-5-6-use-neuron-search.md`
- `task-5-7-use-neuron-events.md`
- `task-5-8-nextjs-integration.md`
- `task-5-9-example-basic.md`
- `task-5-10-example-narrative.md`
- `task-5-11-example-knowledge.md`

## Hook API Reference

### useNeuronGraph

```typescript
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
  expandFromNode: (nodeId: string, depth: number) => Promise<void>;
  findPath: (fromId: string, toId: string) => Promise<PathResult>;
};
```

### useNeuronNodes

```typescript
function useNeuronNodes(options?: UseNeuronNodesOptions): {
  nodes: NeuronNode[];
  isLoading: boolean;
  error: Error | null;
  
  createNode: (data: NeuronNodeCreate) => Promise<NeuronNode>;
  updateNode: (id: string, data: NeuronNodeUpdate) => Promise<NeuronNode>;
  deleteNode: (id: string) => Promise<void>;
  batchCreate: (nodes: NeuronNodeCreate[]) => Promise<NeuronNode[]>;
  search: (query: string) => Promise<NeuronNode[]>;
  
  pagination: PaginationState;
  setPage: (page: number) => void;
};
```

### useNeuronAnalysis

```typescript
function useNeuronAnalysis(): {
  activeJobs: AnalysisRun[];
  
  startAnalysis: (request: AnalysisRequest) => Promise<AnalysisResponse>;
  cancelJob: (jobId: string) => Promise<void>;
  getJobStatus: (jobId: string) => Promise<AnalysisRun>;
  
  isRunning: boolean;
  currentProgress: number;
};
```

## Provider Usage

```tsx
// app/layout.tsx
import { NeuronWebProvider } from 'omi-neuron-web';

export default function RootLayout({ children }) {
  return (
    <NeuronWebProvider
      config={{
        openaiApiKey: process.env.OPENAI_API_KEY!,
        settings: {
          visualization: {
            domainColors: {
              technology: '#00f5d4',
              culture: '#ff5f71',
            },
          },
          nodeTypes: [
            { type: 'concept', label: 'Concept', defaultDomain: 'general' },
          ],
        },
        onEvent: (event) => {
          console.log('Neuron event:', event);
        },
      }}
    >
      {children}
    </NeuronWebProvider>
  );
}
```

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Context re-renders | Memoization, split contexts |
| Stale data | Automatic refetch, cache invalidation |
| Bundle size | Tree shaking, dynamic imports |
| SSR issues | Clear client component boundaries |

## Open Questions
- None (resolved for initial release).

## Task Backlog
- None. All Phase 5 tasks completed.

## Parallel / Unblock Options
- Provider must come first
- Hooks can be developed in parallel
- Examples depend on all hooks
- Next.js integration can be parallel

## Validation Criteria
- [x] Provider initializes without errors
- [x] All hooks return expected data
- [x] Hooks properly handle loading/error states
- [x] Examples run successfully with npm run dev
- [x] TypeScript types work correctly in consuming apps
- [x] No runtime errors in production builds
