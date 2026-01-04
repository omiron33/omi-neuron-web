import type { RouteHandler } from './error-handler';

export interface CorsOptions {
  origins?: string[];
}

export const withCors = (options?: CorsOptions) => (handler: RouteHandler): RouteHandler => async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: buildCorsHeaders(options),
    });
  }

  const response = await handler(request);
  const headers = new Headers(response.headers);
  const corsHeaders = buildCorsHeaders(options);
  corsHeaders.forEach((value, key) => headers.set(key, value));
  return new Response(response.body, { status: response.status, headers });
};

const buildCorsHeaders = (options?: CorsOptions): Headers => {
  const headers = new Headers();
  headers.set('Access-Control-Allow-Origin', options?.origins?.join(',') ?? '*');
  headers.set('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  return headers;
};
