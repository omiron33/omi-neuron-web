import type { NeuronConfig, NeuronSettingsUpdate } from '../../core/types/settings';
import { neuronSettingsUpdateSchema } from '../../core/schemas/settings';
import type { GraphStore } from '../../core/store/graph-store';
import { createGraphStore } from '../../storage/factory';
import { toGraphStoreContext, withRequestContext, type ContextualRouteHandler, type RequestContextOptions } from '../middleware/request-context';
import { withAuthGuard, type AuthGuardOptions } from '../middleware/auth';
import { withBodySizeLimit, type BodySizeLimitOptions } from '../middleware/body-size-limit';
import { withRateLimit, type RateLimitOptions } from '../middleware/rate-limit';

type RouteSecurityOptions = { bodySizeLimit?: BodySizeLimitOptions; rateLimit?: RateLimitOptions };

export const createSettingsRoutes = (
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
    GET: withRequestContext(wrap(async (_request, context) => {
      const settings = await store.getSettings(toGraphStoreContext(context));
      return Response.json({ settings });
    }), requestContextOptions),
    PATCH: withRequestContext(wrap(async (request, context) => {
      const body = await request.json();
      const input = neuronSettingsUpdateSchema.parse(body) as NeuronSettingsUpdate;
      const settings = await store.updateSettings(input, toGraphStoreContext(context));
      return Response.json({ settings });
    }), requestContextOptions),
    POST: withRequestContext(wrap(async (request, context) => {
      const url = new URL(request.url);
      if (!url.pathname.endsWith('/reset')) {
        return new Response('Not found', { status: 404 });
      }
      const body = await request.json().catch(() => ({}));
      const settings = await store.resetSettings(body?.sections, toGraphStoreContext(context));
      return Response.json({ settings });
    }), requestContextOptions),
  };
};
