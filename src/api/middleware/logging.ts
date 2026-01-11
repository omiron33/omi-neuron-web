import type { RouteHandler } from './error-handler';

export type Logger = {
  debug?: (message: string, meta?: Record<string, unknown>) => void;
  info?: (message: string, meta?: Record<string, unknown>) => void;
  warn?: (message: string, meta?: Record<string, unknown>) => void;
  error?: (message: string, meta?: Record<string, unknown>) => void;
};

export type LoggingOptions = {
  enabled?: boolean;
  logger?: Logger;
};

const noopLogger: Required<Logger> = {
  debug: () => undefined,
  info: () => undefined,
  warn: () => undefined,
  error: () => undefined,
};

export const withLogging = (handler: RouteHandler, options?: LoggingOptions): RouteHandler => async (request) => {
  if (!options?.enabled) {
    return handler(request);
  }

  const start = Date.now();
  const response = await handler(request);
  const durationMs = Date.now() - start;

  const requestId = response.headers.get('x-request-id') ?? request.headers.get('x-request-id') ?? undefined;
  const scope = request.headers.get('x-neuron-scope') ?? undefined;
  const url = new URL(request.url);

  const logger = options.logger ?? noopLogger;
  logger.info?.('[omi-neuron] request', {
    requestId,
    scope,
    method: request.method,
    path: url.pathname,
    status: response.status,
    durationMs,
  });

  return response;
};
