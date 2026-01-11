import type { RouteHandler } from './error-handler';

export interface CorsOptions {
  /**
   * Allowlist of origins. When omitted or empty, CORS is disabled (recommended default).
   */
  origins?: string[];
  allowMethods?: string[];
  allowHeaders?: string[];
  allowCredentials?: boolean;
  maxAgeSeconds?: number;
}

export const withCors = (options?: CorsOptions) => (handler: RouteHandler): RouteHandler => async (request) => {
  const resolvedOptions: CorsOptions = options ?? {};
  const origins = resolvedOptions.origins ?? [];
  if (!origins.length) {
    return handler(request);
  }

  const origin = request.headers.get('origin')?.trim() ?? '';
  const isAllowed = origin.length > 0 && origins.includes(origin);

  if (request.method === 'OPTIONS') {
    if (!isAllowed) {
      return new Response(null, { status: 204 });
    }
    return new Response(null, {
      status: 204,
      headers: buildCorsHeaders(resolvedOptions, origin),
    });
  }

  const response = await handler(request);
  if (!isAllowed) {
    return response;
  }
  const headers = new Headers(response.headers);
  const corsHeaders = buildCorsHeaders(resolvedOptions, origin);
  corsHeaders.forEach((value, key) => headers.set(key, value));
  return new Response(response.body, { status: response.status, headers });
};

const buildCorsHeaders = (options: CorsOptions, origin: string): Headers => {
  const headers = new Headers();
  headers.set('Access-Control-Allow-Origin', origin);
  headers.set('Vary', 'Origin');

  const allowMethods = options.allowMethods ?? ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'];
  headers.set('Access-Control-Allow-Methods', allowMethods.join(','));

  const allowHeaders = options.allowHeaders ?? ['Content-Type', 'Authorization', 'x-neuron-scope', 'x-request-id'];
  headers.set('Access-Control-Allow-Headers', allowHeaders.join(','));

  if (options.allowCredentials) {
    headers.set('Access-Control-Allow-Credentials', 'true');
  }

  if (typeof options.maxAgeSeconds === 'number') {
    headers.set('Access-Control-Max-Age', String(options.maxAgeSeconds));
  }

  return headers;
};
