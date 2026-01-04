import type { EventMiddleware } from '../event-bus';

export const validationMiddleware: EventMiddleware = (event, next) => {
  if (!event.type) {
    throw new Error('Event missing type');
  }
  if (!event.timestamp) {
    throw new Error('Event missing timestamp');
  }
  return next();
};
