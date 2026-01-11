import { expandGraphRequestSchema, findPathRequestSchema, getGraphParamsSchema } from '../../core/schemas/api';
import type { NeuronConfig } from '../../core/types/settings';
import type { GraphStore } from '../../core/store/graph-store';
import { createGraphStore } from '../../storage/factory';
import { toGraphStoreContext, withRequestContext, type ContextualRouteHandler, type RequestContextOptions } from '../middleware/request-context';
import { withAuthGuard, type AuthGuardOptions } from '../middleware/auth';
import { withBodySizeLimit, type BodySizeLimitOptions } from '../middleware/body-size-limit';
import { withRateLimit, type RateLimitOptions } from '../middleware/rate-limit';

type RouteSecurityOptions = { bodySizeLimit?: BodySizeLimitOptions; rateLimit?: RateLimitOptions };

export const createGraphRoutes = (
  config: NeuronConfig,
  injectedStore?: GraphStore,
  requestContextOptions?: RequestContextOptions,
  authOptions?: AuthGuardOptions,
  security?: RouteSecurityOptions
) => {
  const store = injectedStore ?? createGraphStore(config);
  const wrap = (handler: ContextualRouteHandler) =>
    withBodySizeLimit(withRateLimit(withAuthGuard(handler, authOptions), security?.rateLimit), security?.bodySizeLimit);

  return {
    GET: withRequestContext(wrap(async (request, context) => {
      const url = new URL(request.url);
      const params = getGraphParamsSchema.parse(Object.fromEntries(url.searchParams));
      const result = await store.getGraph({
        ...params,
        nodeTypes: params.nodeTypes ? (Array.isArray(params.nodeTypes) ? params.nodeTypes : [params.nodeTypes]) : undefined,
        domains: params.domains ? (Array.isArray(params.domains) ? params.domains : [params.domains]) : undefined,
        clusterIds: params.clusterIds ? (Array.isArray(params.clusterIds) ? params.clusterIds : [params.clusterIds]) : undefined,
        nodeIds: params.nodeIds ? (Array.isArray(params.nodeIds) ? params.nodeIds : [params.nodeIds]) : undefined,
        relationshipTypes: params.relationshipTypes
          ? (Array.isArray(params.relationshipTypes) ? params.relationshipTypes : [params.relationshipTypes])
          : undefined,
      }, toGraphStoreContext(context));
      return Response.json(result);
    }), requestContextOptions),
    POST: withRequestContext(wrap(async (request, context) => {
      const url = new URL(request.url);
      if (url.pathname.endsWith('/expand')) {
        const body = await request.json();
        const input = expandGraphRequestSchema.parse(body);
        const result = await store.expandGraph(input, toGraphStoreContext(context));
        return Response.json(result);
      }
      if (url.pathname.endsWith('/path')) {
        const body = await request.json();
        const input = findPathRequestSchema.parse(body);
        const result = await store.findPaths(input, toGraphStoreContext(context));
        return Response.json(result);
      }
      return new Response('Unsupported', { status: 404 });
    }), requestContextOptions),
  };
};
