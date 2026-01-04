import type {
  EventHandler,
  EventSubscription,
  EventSource,
  NeuronEvent,
  NeuronEventEmitter,
  NeuronEventType,
} from '../types/events';

export type EventMiddleware = (event: NeuronEvent, next: () => void | Promise<void>) =>
  | void
  | Promise<void>;

export class EventBus implements NeuronEventEmitter {
  private subscribers = new Map<NeuronEventType, Set<EventHandler>>();
  private globalSubscribers = new Set<EventHandler>();
  private middleware: EventMiddleware[] = [];
  private history: NeuronEvent[] = [];
  private historyLimit = 200;

  emit<T>(event: NeuronEvent<T>): void {
    void this.emitAsync(event);
  }

  async emitAsync<T>(event: NeuronEvent<T>): Promise<void> {
    await this.runMiddleware(event, async () => {
      this.recordEvent(event);
      const handlers = this.subscribers.get(event.type);
      if (handlers) {
        for (const handler of handlers) {
          await handler(event);
        }
      }
      for (const handler of this.globalSubscribers) {
        await handler(event);
      }
    });
  }

  subscribe<T>(type: NeuronEventType, handler: EventHandler<T>): EventSubscription {
    if (!this.subscribers.has(type)) {
      this.subscribers.set(type, new Set());
    }
    this.subscribers.get(type)!.add(handler as EventHandler);
    return {
      unsubscribe: () => this.unsubscribe(type, handler as EventHandler),
    };
  }

  subscribeMany(types: NeuronEventType[], handler: EventHandler): EventSubscription {
    types.forEach((type) => this.subscribe(type, handler));
    return {
      unsubscribe: () => types.forEach((type) => this.unsubscribe(type, handler)),
    };
  }

  subscribeAll(handler: EventHandler<unknown>): EventSubscription {
    this.globalSubscribers.add(handler as EventHandler);
    return {
      unsubscribe: () => {
        this.globalSubscribers.delete(handler as EventHandler);
      },
    };
  }

  unsubscribe(type: NeuronEventType, handler: EventHandler): void {
    const handlers = this.subscribers.get(type);
    if (!handlers) return;
    handlers.delete(handler);
    if (handlers.size === 0) {
      this.subscribers.delete(type);
    }
  }

  unsubscribeAll(): void {
    this.subscribers.clear();
    this.globalSubscribers.clear();
  }

  use(middleware: EventMiddleware): void {
    this.middleware.push(middleware);
  }

  getSubscriberCount(type?: NeuronEventType): number {
    if (!type) {
      let count = this.globalSubscribers.size;
      for (const handlers of this.subscribers.values()) {
        count += handlers.size;
      }
      return count;
    }
    return this.subscribers.get(type)?.size ?? 0;
  }

  getEventHistory(limit?: number): NeuronEvent[] {
    if (!limit) return [...this.history];
    return this.history.slice(-limit);
  }

  clearHistory(): void {
    this.history = [];
  }

  private recordEvent(event: NeuronEvent): void {
    this.history.push(event);
    if (this.history.length > this.historyLimit) {
      this.history.shift();
    }
  }

  private async runMiddleware(event: NeuronEvent, finalHandler: () => void | Promise<void>) {
    const stack = [...this.middleware];
    let index = -1;

    const runner = async (): Promise<void> => {
      index += 1;
      if (index < stack.length) {
        await stack[index](event, runner);
      } else {
        await finalHandler();
      }
    };

    await runner();
  }
}

export const createEvent = <T>(
  type: NeuronEventType,
  payload: T,
  source: EventSource = 'system'
): NeuronEvent<T> => ({
  type,
  payload,
  source,
  timestamp: new Date(),
});
