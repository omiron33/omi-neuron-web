import type { EventMiddleware } from '../event-bus';

export const loggingMiddleware: EventMiddleware = (event, next) => {
  // eslint-disable-next-line no-console
  console.debug(`[omi-neuron:event] ${event.type}`, event);
  void next();
};
