import { describe, it, expect, vi } from 'vitest';
import { EventBus, createEvent } from '../../src/core/events/event-bus';

describe('EventBus', () => {
  it('emits events to subscribers', async () => {
    const bus = new EventBus();
    const handler = vi.fn();
    bus.subscribe('node:created', handler);
    await bus.emitAsync(createEvent('node:created', { node: { id: '1' } }, 'system'));
    expect(handler).toHaveBeenCalled();
  });
});
