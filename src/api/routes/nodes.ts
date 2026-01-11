import { listNodesParamsSchema } from '../../core/schemas/api';
import { nodeBatchCreateSchema, nodeUpdateSchema } from '../../core/schemas/node';
import type { NeuronConfig } from '../../core/types/settings';
import type { GraphStore } from '../../core/store/graph-store';
import { createGraphStore } from '../../storage/factory';
import { toGraphStoreContext, withRequestContext, type ContextualRouteHandler, type RequestContextOptions } from '../middleware/request-context';
import { withAuthGuard, type AuthGuardOptions } from '../middleware/auth';
import { withBodySizeLimit, type BodySizeLimitOptions } from '../middleware/body-size-limit';
import { withRateLimit, type RateLimitOptions } from '../middleware/rate-limit';

type RouteSecurityOptions = { bodySizeLimit?: BodySizeLimitOptions; rateLimit?: RateLimitOptions };

export const createNodesRoutes = (
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
      const params = listNodesParamsSchema.parse(Object.fromEntries(url.searchParams));
      const nodes = await store.listNodes({
        limit: params.limit,
        offset: params.page ? (params.page - 1) * (params.limit ?? 50) : undefined,
        context: toGraphStoreContext(context),
      });
      return Response.json({
        nodes,
        pagination: {
          page: params.page ?? 1,
          limit: params.limit ?? nodes.length,
          total: nodes.length,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
        meta: {
          queryTime: 0,
          filters: params,
        },
      });
    }), requestContextOptions),
    POST: withRequestContext(wrap(async (request, context) => {
      const body = await request.json();
      const input = nodeBatchCreateSchema.parse(body);
      const created = await store.createNodes(input.nodes, toGraphStoreContext(context));
      return Response.json({ created, skipped: [], analysisJobId: null }, { status: 201 });
    }), requestContextOptions),
    PATCH: withRequestContext(wrap(async (request, context) => {
      const url = new URL(request.url);
      const id = url.pathname.split('/').pop();
      if (!id) return new Response('Missing id', { status: 400 });
      const body = await request.json();
      const input = nodeUpdateSchema.parse(body);
      const updated = await store.updateNode(id, input, toGraphStoreContext(context));
      return Response.json(updated);
    }), requestContextOptions),
    DELETE: withRequestContext(wrap(async (request, context) => {
      const url = new URL(request.url);
      const id = url.pathname.split('/').pop();
      if (!id) return new Response('Missing id', { status: 400 });
      const result = await store.deleteNode(id, toGraphStoreContext(context));
      return Response.json(result);
    }), requestContextOptions),
  };
};
