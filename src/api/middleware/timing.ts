import type { RouteHandler } from './error-handler';

export const withTiming = (handler: RouteHandler): RouteHandler => async (request) => {
  const start = Date.now();
  const response = await handler(request);
  const duration = Date.now() - start;
  const headers = new Headers(response.headers);
  headers.set('X-Response-Time', `${duration}ms`);
  return new Response(response.body, { status: response.status, headers });
};
