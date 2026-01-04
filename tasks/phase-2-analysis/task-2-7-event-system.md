---
title: Event System - EventBus Implementation
status: not_started
priority: 2
labels:
  - 'Phase:2-Analysis'
  - 'Type:Infrastructure'
assignees:
  - CodingAgent
depends_on:
  - task-1-2-type-system
---

# Task 2.7: Event System

## Objective
Build a typed EventBus for emitting and subscribing to events throughout the library.

## Requirements

### 1. EventBus Class (`src/core/events/event-bus.ts`)

```typescript
class EventBus implements NeuronEventEmitter {
  private subscribers: Map<NeuronEventType, Set<EventHandler>>;
  private globalSubscribers: Set<EventHandler>;
  private middleware: EventMiddleware[];
  
  constructor();
  
  // Emission
  emit<T>(event: NeuronEvent<T>): void;
  emitAsync<T>(event: NeuronEvent<T>): Promise<void>;
  
  // Subscription
  subscribe<T>(type: NeuronEventType, handler: EventHandler<T>): EventSubscription;
  subscribeMany(types: NeuronEventType[], handler: EventHandler): EventSubscription;
  subscribeAll(handler: EventHandler<unknown>): EventSubscription;
  
  // Unsubscription
  unsubscribe(type: NeuronEventType, handler: EventHandler): void;
  unsubscribeAll(): void;
  
  // Middleware
  use(middleware: EventMiddleware): void;
  
  // Utilities
  getSubscriberCount(type?: NeuronEventType): number;
  getEventHistory(limit?: number): NeuronEvent[];
}

type EventMiddleware = (
  event: NeuronEvent,
  next: () => void
) => void | Promise<void>;
```

### 2. Event Creation Helpers

```typescript
// src/core/events/helpers.ts

function createEvent<T>(
  type: NeuronEventType,
  payload: T,
  source: EventSource = 'system'
): NeuronEvent<T>;

function createNodeEvent(
  type: 'node:created' | 'node:updated' | 'node:deleted',
  payload: NodeEventPayload
): NeuronEvent;

function createAnalysisEvent(
  type: 'analysis:started' | 'analysis:progress' | 'analysis:completed' | 'analysis:failed',
  payload: AnalysisEventPayload
): NeuronEvent;

// ... similar for other event types
```

### 3. React Integration

```typescript
// src/core/events/react.ts

function useNeuronEvents() {
  const eventBus = useContext(NeuronContext).events;
  
  return {
    subscribe: <T>(type: NeuronEventType, handler: EventHandler<T>) => {
      useEffect(() => {
        const sub = eventBus.subscribe(type, handler);
        return () => sub.unsubscribe();
      }, [type, handler]);
    },
    
    emit: <T>(type: NeuronEventType, payload: T, source?: EventSource) => {
      eventBus.emit(createEvent(type, payload, source ?? 'ui'));
    },
  };
}
```

### 4. Middleware Support
- [ ] Logging middleware
- [ ] Validation middleware
- [ ] Transform middleware
- [ ] Error boundary middleware

### 5. Event History
- [ ] Store recent events (configurable limit)
- [ ] Query history by type
- [ ] Clear history

### 6. Debugging Tools
- [ ] Event logger (dev mode)
- [ ] Event inspector
- [ ] Performance tracking

## Deliverables
- [ ] `src/core/events/event-bus.ts`
- [ ] `src/core/events/helpers.ts`
- [ ] `src/core/events/react.ts`
- [ ] `src/core/events/middleware/` (logging, validation)
- [ ] `src/core/events/index.ts`
- [ ] Unit tests

## Acceptance Criteria
- Events emit and handlers receive
- Type-safe subscriptions
- Middleware chain works
- Memory cleanup on unsubscribe
- History tracks events
- React hook works correctly

## Example Usage

```typescript
// In library code
const events = new EventBus();

events.use(loggingMiddleware);

events.emit(createEvent('node:created', {
  node: newNode,
  source: 'manual',
}, 'api'));

// In consuming app
function MyComponent() {
  const { subscribe, emit } = useNeuronEvents();
  
  useEffect(() => {
    const unsub = subscribe('node:created', (event) => {
      console.log('New node:', event.payload.node);
      toast.success(`Created: ${event.payload.node.label}`);
    });
    return unsub;
  }, []);
  
  // Emit custom event
  const handleAction = () => {
    emit('viz:node_focused', { 
      node: selectedNode,
      source: 'click',
    });
  };
}
```

## Notes
- Use WeakSet for cleanup tracking
- Consider batching rapid events
- Async handlers should not block emission
- Unsubscribe returns function for cleanup

