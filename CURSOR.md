# CURSOR.md

Specific instructions for Cursor AI when working in this repository.

## Project Context

This is **omi-neuron-web**, a drop-in Next.js library for:
- Data analysis with OpenAI embeddings
- Graph visualization with Three.js
- Zero-config PostgreSQL with Docker

## Quick Start for Cursor

### Read These First
1. `plans/next-step.json` — Current task
2. `plans/master-plan-planner.md` — Overall plan
3. `CLAUDE.md` — Technical details

### Key Directories
- `src/core/types/` — Type definitions (start here)
- `src/storage/` — Database layer
- `src/api/` — REST API
- `src/visualization/` — Three.js component
- `plans/` — Implementation plans
- `tasks/` — Task breakdowns

## Cursor-Specific Settings

### Recommended Rules
Add to `.cursorrules` or workspace settings:

```
# omi-neuron-web workspace rules

## Code Style
- Use TypeScript strict mode
- Prefer named exports
- Use Zod for validation
- JSDoc on public APIs

## Architecture
- Types in src/core/types/
- Schemas in src/core/schemas/
- API routes export factory functions
- React hooks in src/react/hooks/

## Patterns
- Repository pattern for data access
- Event bus for cross-cutting concerns
- Factory functions for route handlers
- Class-based services for analysis

## Don'ts
- Don't use `any` type
- Don't skip type exports
- Don't hardcode configuration
- Don't add unnecessary dependencies
```

### File Associations
```json
{
  "files.associations": {
    "*.md": "markdown",
    "task-*.md": "markdown"
  }
}
```

## Working with Plans

### Task Execution Flow
```
1. @read plans/next-step.json
2. @read tasks/phase-X/task-Y.md
3. Implement requirements
4. Update task status
5. Update next-step.json
```

### Plan File Patterns
- `plans/phase-*-plan.md` — Phase overview
- `tasks/phase-*/task-*.md` — Individual tasks
- `plans/next-step.json` — Execution queue

## Code Generation Hints

### Creating Types
```typescript
// Always export from index
export type { NeuronNode } from './node';

// Use interfaces for objects
export interface NeuronNode {
  id: string;
  // ...
}

// Use type for unions
export type NodeTier = 'primary' | 'secondary' | 'tertiary';
```

### Creating API Routes
```typescript
// Factory pattern
export function createNodesRoutes(config: NeuronConfig) {
  const repo = new NodeRepository(getDatabase());
  
  return {
    async GET(request: Request) {
      // Validate with Zod
      const params = listNodesSchema.parse(...);
      // Use repository
      const nodes = await repo.findAll(params);
      // Return JSON
      return Response.json({ nodes });
    },
  };
}
```

### Creating Hooks
```typescript
export function useNeuronNodes() {
  const { api } = useNeuronContext();
  const [nodes, setNodes] = useState<NeuronNode[]>([]);
  
  // Implement CRUD
  const createNode = async (data: NeuronNodeCreate) => {
    const node = await api.nodes.create(data);
    setNodes(prev => [...prev, node]);
    return node;
  };
  
  return { nodes, createNode };
}
```

## Common Tasks

### Add New Type
1. Create in `src/core/types/`
2. Export from `src/core/types/index.ts`
3. Create Zod schema in `src/core/schemas/`
4. Export from `src/core/schemas/index.ts`

### Add API Endpoint
1. Create route handler in `src/api/routes/`
2. Add repository method if needed
3. Create Zod schema for input
4. Export from `src/api/index.ts`

### Add React Hook
1. Create in `src/react/hooks/`
2. Use `useNeuronContext()` for API access
3. Export from `src/react/hooks/index.ts`

## Testing Approach

```typescript
// tests/core/embeddings-service.test.ts
import { describe, it, expect, vi } from 'vitest';

describe('EmbeddingsService', () => {
  it('generates embedding for text', async () => {
    const service = new EmbeddingsService(mockConfig, mockDb);
    const embedding = await service.generateEmbedding('test');
    expect(embedding).toHaveLength(1536);
  });
});
```

## Debugging Tips

### Type Errors
```bash
pnpm typecheck  # See all errors
```

### Missing Exports
Check `index.ts` files in each module.

### Database Issues
```bash
npx omi-neuron db:status
npx omi-neuron db:migrate --status
```

## Reference Code

### From Technochristian
- Visualization: `/Users/shanefisher/Code/Technochristian/src/components/home/neuron-web.tsx`
- Graph API: `/Users/shanefisher/Code/Technochristian/src/lib/atlas/graph.ts`

### From Psyopbuilder
- Graph schema: `/Users/shanefisher/Code/psyopbuilder/plans/neuron-web-graph-plan.md`

## Completion Checklist

Before finishing any task:
- [ ] Types compile
- [ ] Lint passes
- [ ] Exports updated
- [ ] Task status updated
- [ ] next-step.json updated

