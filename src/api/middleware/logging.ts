import type { RouteHandler } from './error-handler';

export const withLogging = (handler: RouteHandler): RouteHandler => async (request) => {
  const start = Date.now();
  const response = await handler(request);
  const duration = Date.now() - start;
  // eslint-disable-next-line no-console
  console.log(`[omi-neuron] ${request.method} ${request.url} -> ${response.status} (${duration}ms)`);
  return response;
};
