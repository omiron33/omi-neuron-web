import type { NeuronConfig } from '../../core/types/settings';
import type { EmbeddingProvider } from '../../core/providers/embedding-provider';
import type { GraphStore } from '../../core/store/graph-store';
import { createGraphStore } from '../../storage/factory';
import { createNodesRoutes } from './nodes';
import { createEdgesRoutes } from './edges';
import { createGraphRoutes } from './graph';
import { createAnalyzeRoutes } from './analyze';
import { createSettingsRoutes } from './settings';
import { createSearchRoutes } from './search';
import { createHealthRoutes } from './health';
import type { RequestContextOptions } from '../middleware/request-context';
import type { AuthGuardOptions } from '../middleware/auth';
import type { BodySizeLimitOptions } from '../middleware/body-size-limit';
import type { RateLimitOptions, RateLimitKeyFn, RateLimitLimiter } from '../middleware/rate-limit';

export function createNeuronRoutes(
  config: NeuronConfig,
  options?: {
    store?: GraphStore;
    embeddingProvider?: EmbeddingProvider;
    requestContext?: RequestContextOptions;
    auth?: AuthGuardOptions;
    bodySizeLimit?: BodySizeLimitOptions;
    rateLimit?: { limiter?: RateLimitLimiter; keyFn?: RateLimitKeyFn; windowMs?: number; max?: number };
  }
) {
  const store = options?.store ?? createGraphStore(config);
  const resolvedRateLimit: RateLimitOptions | undefined = options?.rateLimit?.limiter
    ? {
        limiter: options.rateLimit.limiter,
        keyFn: options.rateLimit.keyFn,
        windowMs: options.rateLimit.windowMs ?? config.api.rateLimit?.windowMs ?? 60_000,
        max: options.rateLimit.max ?? config.api.rateLimit?.max ?? 60,
      }
    : undefined;
  const security = { bodySizeLimit: options?.bodySizeLimit, rateLimit: resolvedRateLimit };
  return {
    nodes: createNodesRoutes(config, store, options?.requestContext, options?.auth, security),
    edges: createEdgesRoutes(config, store, options?.requestContext, options?.auth, security),
    graph: createGraphRoutes(config, store, options?.requestContext, options?.auth, security),
    analyze: createAnalyzeRoutes(config, store, options?.requestContext, options?.auth, security),
    settings: createSettingsRoutes(config, store, options?.requestContext, options?.auth, security),
    search: createSearchRoutes(config, store, {
      embeddingProvider: options?.embeddingProvider,
      requestContext: options?.requestContext,
      auth: options?.auth,
      bodySizeLimit: options?.bodySizeLimit,
      rateLimit: resolvedRateLimit,
    }),
    health: createHealthRoutes(config, store),
  };
}
