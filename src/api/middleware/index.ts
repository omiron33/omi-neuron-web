import type { RouteHandler } from './error-handler';
import { withCors, type CorsOptions } from './cors';
import { withErrorHandler } from './error-handler';
import { withLogging, type LoggingOptions } from './logging';
import { withTiming } from './timing';

export * from './request-context';
export * from './auth';
export * from './body-size-limit';
export * from './rate-limit';

export interface MiddlewareOptions {
  cors?: CorsOptions;
  logging?: LoggingOptions;
}

const compose = (...handlers: Array<(handler: RouteHandler) => RouteHandler>) => {
  return (handler: RouteHandler) => handlers.reduceRight((acc, fn) => fn(acc), handler);
};

export const withNeuronMiddleware = (handler: RouteHandler, options?: MiddlewareOptions) => {
  const chain = [withErrorHandler, (h: RouteHandler) => withLogging(h, options?.logging), withTiming];
  if (options?.cors) {
    chain.push(withCors(options.cors));
  }
  return compose(...chain)(handler);
};
