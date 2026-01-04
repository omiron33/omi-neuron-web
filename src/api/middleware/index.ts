import type { RouteHandler } from './error-handler';
import { withCors, type CorsOptions } from './cors';
import { withErrorHandler } from './error-handler';
import { withLogging } from './logging';
import { withTiming } from './timing';

export interface MiddlewareOptions {
  cors?: CorsOptions;
}

const compose = (...handlers: Array<(handler: RouteHandler) => RouteHandler>) => {
  return (handler: RouteHandler) => handlers.reduceRight((acc, fn) => fn(acc), handler);
};

export const withNeuronMiddleware = (handler: RouteHandler, options?: MiddlewareOptions) => {
  const chain = [withErrorHandler, withLogging, withTiming];
  if (options?.cors) {
    chain.push(withCors(options.cors));
  }
  return compose(...chain)(handler);
};
