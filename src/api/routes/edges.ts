import { listEdgesParamsSchema } from '../../core/schemas/api';
import { edgeCreateSchema, edgeUpdateSchema } from '../../core/schemas/edge';
import type { NeuronConfig } from '../../core/types/settings';
import type { GraphStore } from '../../core/store/graph-store';
import { createGraphStore } from '../../storage/factory';
import { toGraphStoreContext, withRequestContext, type ContextualRouteHandler, type RequestContextOptions } from '../middleware/request-context';
import { withAuthGuard, type AuthGuardOptions } from '../middleware/auth';
import { withBodySizeLimit, type BodySizeLimitOptions } from '../middleware/body-size-limit';
import { withRateLimit, type RateLimitOptions } from '../middleware/rate-limit';

type RouteSecurityOptions = { bodySizeLimit?: BodySizeLimitOptions; rateLimit?: RateLimitOptions };

export const createEdgesRoutes = (
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
      const params = listEdgesParamsSchema.parse(Object.fromEntries(url.searchParams));
      const edges = await store.listEdges({
        limit: params.limit,
        offset: params.page ? (params.page - 1) * (params.limit ?? 50) : undefined,
        context: toGraphStoreContext(context),
      });
      return Response.json({
        edges,
        pagination: {
          page: params.page ?? 1,
          limit: params.limit ?? edges.length,
          total: edges.length,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
      });
    }), requestContextOptions),
    POST: withRequestContext(wrap(async (request, context) => {
      const body = await request.json();
      const input = edgeCreateSchema.array().safeParse(body.edges ?? body);
      if (!input.success) {
        return Response.json({ error: input.error.message }, { status: 400 });
      }
      const created = await store.createEdges(input.data, toGraphStoreContext(context));
      return Response.json({ created, errors: [] }, { status: 201 });
    }), requestContextOptions),
    PATCH: withRequestContext(wrap(async (request, context) => {
      const url = new URL(request.url);
      const id = url.pathname.split('/').pop();
      if (!id) return new Response('Missing id', { status: 400 });
      const body = await request.json();
      const input = edgeUpdateSchema.parse(body);
      const updated = await store.updateEdge(id, input, toGraphStoreContext(context));
      return Response.json(updated);
    }), requestContextOptions),
    DELETE: withRequestContext(wrap(async (request, context) => {
      const url = new URL(request.url);
      const id = url.pathname.split('/').pop();
      if (!id) return new Response('Missing id', { status: 400 });
      const deleted = await store.deleteEdge(id, toGraphStoreContext(context));
      return Response.json({ deleted });
    }), requestContextOptions),
  };
};
