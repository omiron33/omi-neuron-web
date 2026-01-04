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

### Phase 5.1 – NeuronWebProvider 🟥
- [ ] Create NeuronWebProvider component
- [ ] Implement configuration context
- [ ] Implement API client initialization
- [ ] Implement event bus initialization
- [ ] Add error boundary integration
- [ ] Create useNeuronConfig hook
- [ ] Add provider nesting detection/warning

### Phase 5.2 – useNeuronGraph Hook 🟥
- [ ] Create useNeuronGraph hook
- [ ] Implement graph data fetching
- [ ] Implement filter state management
- [ ] Implement selection state management
- [ ] Implement graph expansion helper
- [ ] Implement path finding helper
- [ ] Add automatic refetch on filter change
- [ ] Add loading/error state management

### Phase 5.3 – useNeuronNodes Hook 🟥
- [ ] Create useNeuronNodes hook
- [ ] Implement node listing with pagination
- [ ] Implement single node fetching
- [ ] Implement node creation
- [ ] Implement node update
- [ ] Implement node deletion
- [ ] Implement batch operations
- [ ] Add optimistic updates
- [ ] Add cache invalidation

### Phase 5.4 – useNeuronAnalysis Hook 🟥
- [ ] Create useNeuronAnalysis hook
- [ ] Implement analysis job triggering
- [ ] Implement job status polling
- [ ] Implement job cancellation
- [ ] Implement job history listing
- [ ] Add progress event subscription
- [ ] Add completion callbacks

### Phase 5.5 – useNeuronSettings Hook 🟥
- [ ] Create useNeuronSettings hook
- [ ] Implement settings fetching
- [ ] Implement settings update
- [ ] Implement settings reset
- [ ] Add optimistic updates
- [ ] Implement validation before save

### Phase 5.6 – useNeuronSearch Hook 🟥
- [ ] Create useNeuronSearch hook
- [ ] Implement semantic search
- [ ] Implement find similar
- [ ] Add debounced search input
- [ ] Add result caching
- [ ] Implement search history

### Phase 5.7 – useNeuronEvents Hook 🟥
- [ ] Create useNeuronEvents hook
- [ ] Implement event subscription
- [ ] Implement event emission
- [ ] Add type-safe event handlers
- [ ] Implement subscription cleanup
- [ ] Add event filtering helpers

### Phase 5.8 – Next.js Integration 🟥
- [ ] Create withNeuronWeb config wrapper
- [ ] Implement webpack externals for Three.js
- [ ] Add transpilePackages configuration
- [ ] Create middleware helpers (optional)
- [ ] Document server component boundaries
- [ ] Add TypeScript plugin for better DX

### Phase 5.9 – Example: Basic Usage 🟥
- [ ] Create examples/basic-usage directory
- [ ] Set up minimal Next.js app
- [ ] Implement basic graph page
- [ ] Add node creation form
- [ ] Add analysis trigger button
- [ ] Add README with setup instructions
- [ ] Add docker-compose for database

### Phase 5.10 – Example: Narrative Analysis 🟥
- [ ] Create examples/narrative-analysis directory
- [ ] Set up psyopbuilder-style configuration
- [ ] Implement claim/entity node types
- [ ] Add bias lens filtering
- [ ] Add narrative thread visualization
- [ ] Document use case and customization

### Phase 5.11 – Example: Knowledge Graph 🟥
- [ ] Create examples/knowledge-graph directory
- [ ] Set up technochristian-style configuration
- [ ] Implement concept node types
- [ ] Add scripture reference support
- [ ] Add study path feature
- [ ] Document use case and customization

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
- Should we provide Redux/Zustand adapters?
- Real-time updates via WebSocket in future?
- Should examples be in monorepo or separate repos?

## Parallel / Unblock Options
- Provider must come first
- Hooks can be developed in parallel
- Examples depend on all hooks
- Next.js integration can be parallel

## Validation Criteria
- [ ] Provider initializes without errors
- [ ] All hooks return expected data
- [ ] Hooks properly handle loading/error states
- [ ] Examples run successfully with npm run dev
- [ ] TypeScript types work correctly in consuming apps
- [ ] No runtime errors in production builds

