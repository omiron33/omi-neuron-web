import crypto from 'node:crypto';
import type { GraphStoreContext } from '../../core/store/graph-store';
import { DEFAULT_SCOPE } from '../../core/store/graph-store';
import { handleError, type RouteHandler } from './error-handler';

export type RequestUser = {
  id: string;
  email?: string;
  roles?: string[];
};

export type RequestContext = {
  requestId: string;
  scope: string;
  user?: RequestUser | null;
  claims?: Record<string, unknown> | null;
};

export type ContextualRouteHandler = (request: Request, context: RequestContext) => Promise<Response>;

export type RequestContextOptions = {
  scopeHeader?: string;
  requestIdHeader?: string;
  resolveScope?: (request: Request) => string | null | Promise<string | null>;
  resolveUser?: (request: Request) => RequestUser | null | Promise<RequestUser | null>;
  resolveClaims?: (request: Request) => Record<string, unknown> | null | Promise<Record<string, unknown> | null>;
};

const readHeaderValue = (request: Request, name: string): string | null => {
  const value = request.headers.get(name);
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

export const buildRequestContext = async (request: Request, options?: RequestContextOptions): Promise<RequestContext> => {
  const scopeHeader = options?.scopeHeader ?? 'x-neuron-scope';
  const requestIdHeader = options?.requestIdHeader ?? 'x-request-id';

  const headerScope = readHeaderValue(request, scopeHeader);
  const resolvedScope = headerScope ?? (await options?.resolveScope?.(request)) ?? DEFAULT_SCOPE;
  const scope = resolvedScope?.trim() ? resolvedScope.trim() : DEFAULT_SCOPE;

  const requestId = readHeaderValue(request, requestIdHeader) ?? crypto.randomUUID();

  const user = options?.resolveUser ? await options.resolveUser(request) : null;
  const claims = options?.resolveClaims ? await options.resolveClaims(request) : null;

  return { requestId, scope, user, claims };
};

export const toGraphStoreContext = (context: RequestContext): GraphStoreContext => ({
  scope: context.scope,
});

export const withRequestContext = (handler: ContextualRouteHandler, options?: RequestContextOptions): RouteHandler => {
  return async (request) => {
    const requestIdHeader = options?.requestIdHeader ?? 'x-request-id';
    const context = await buildRequestContext(request, options);
    try {
      const response = await handler(request, context);
      const headers = new Headers(response.headers);
      headers.set(requestIdHeader, context.requestId);
      return new Response(response.body, { status: response.status, headers });
    } catch (error) {
      const response = handleError(error, { requestId: context.requestId });
      const headers = new Headers(response.headers);
      headers.set(requestIdHeader, context.requestId);
      return new Response(response.body, { status: response.status, headers });
    }
  };
};
