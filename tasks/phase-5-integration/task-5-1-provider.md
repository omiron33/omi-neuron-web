---
title: NeuronWebProvider - React Context
status: completed
priority: 1
labels:
  - 'Phase:5-Integration'
  - 'Type:React'
assignees:
  - CodingAgent
depends_on:
  - task-3-4-middleware
  - task-2-7-event-system
---

# Task 5.1: NeuronWebProvider

## Objective
Build the main React context provider for omi-neuron-web library integration.

## Requirements

### 1. Provider Component (`src/react/NeuronWebProvider.tsx`)

```typescript
interface NeuronWebProviderProps {
  children: React.ReactNode;
  config: {
    // Required
    openaiApiKey?: string;
    
    // Database (auto-configured if using Docker)
    databaseUrl?: string;
    
    // Optional overrides
    settings?: Partial<NeuronSettings>;
    
    // Event handlers
    onEvent?: (event: NeuronEvent) => void;
    onError?: (error: Error, context: ErrorContext) => void;
  };
}

export function NeuronWebProvider(props: NeuronWebProviderProps): JSX.Element;
```

### 2. Context Structure

```typescript
interface NeuronContextValue {
  // Configuration
  config: NeuronConfig;
  settings: NeuronSettings;
  
  // API client
  api: NeuronApiClient;
  
  // Event bus
  events: EventBus;
  
  // State
  isInitialized: boolean;
  error: Error | null;
  
  // Actions
  updateSettings: (settings: Partial<NeuronSettings>) => Promise<void>;
  resetSettings: () => Promise<void>;
}

const NeuronContext = createContext<NeuronContextValue | null>(null);
```

### 3. API Client (`src/react/api-client.ts`)

```typescript
class NeuronApiClient {
  constructor(basePath: string);
  
  // Nodes
  nodes: {
    list: (params?: ListNodesParams) => Promise<ListNodesResponse>;
    get: (id: string) => Promise<GetNodeResponse>;
    create: (data: CreateNodesRequest) => Promise<CreateNodesResponse>;
    update: (id: string, data: UpdateNodeRequest) => Promise<NeuronNode>;
    delete: (id: string) => Promise<DeleteNodeResponse>;
  };
  
  // Edges
  edges: {
    list: (params?: ListEdgesParams) => Promise<ListEdgesResponse>;
    create: (data: CreateEdgesRequest) => Promise<CreateEdgesResponse>;
    // ...
  };
  
  // Graph
  graph: {
    get: (params?: GetGraphParams) => Promise<GetGraphResponse>;
    expand: (data: ExpandGraphRequest) => Promise<ExpandGraphResponse>;
    findPath: (data: FindPathRequest) => Promise<FindPathResponse>;
  };
  
  // Analysis
  analyze: {
    start: (data: AnalysisRequest) => Promise<AnalysisResponse>;
    getStatus: (jobId: string) => Promise<GetAnalysisJobResponse>;
    cancel: (jobId: string) => Promise<CancelAnalysisResponse>;
  };
  
  // Settings
  settings: {
    get: () => Promise<GetSettingsResponse>;
    update: (data: UpdateSettingsRequest) => Promise<UpdateSettingsResponse>;
    reset: (data?: ResetSettingsRequest) => Promise<ResetSettingsResponse>;
  };
  
  // Search
  search: {
    semantic: (data: SemanticSearchRequest) => Promise<SemanticSearchResponse>;
    similar: (data: FindSimilarRequest) => Promise<FindSimilarResponse>;
  };
}
```

### 4. Initialization
- [ ] Validate configuration
- [ ] Initialize API client
- [ ] Initialize event bus
- [ ] Load settings from API
- [ ] Report initialization errors

### 5. Error Boundary Integration
- [ ] Catch provider errors
- [ ] Report via onError callback
- [ ] Show fallback UI option

### 6. Context Hook

```typescript
function useNeuronContext(): NeuronContextValue {
  const context = useContext(NeuronContext);
  if (!context) {
    throw new Error('useNeuronContext must be used within NeuronWebProvider');
  }
  return context;
}
```

## Deliverables
- [ ] `src/react/NeuronWebProvider.tsx`
- [ ] `src/react/api-client.ts`
- [ ] `src/react/context.ts`
- [ ] `src/react/hooks/useNeuronContext.ts`

## Acceptance Criteria
- Provider initializes correctly
- Context available in children
- API client works
- Events flow through
- Errors reported properly

## Example Usage

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
            },
          },
        },
        onEvent: (event) => {
          console.log('Event:', event.type);
        },
        onError: (error) => {
          console.error('Neuron error:', error);
        },
      }}
    >
      {children}
    </NeuronWebProvider>
  );
}
```

## Notes
- Use "use client" directive
- Avoid SSR for API calls
- Memoize context value
- Handle provider nesting


