import type { NeuronConfig } from '../../core/types/settings';
import { semanticSearchRequestSchema, findSimilarRequestSchema } from '../../core/schemas/api';
import type { EmbeddingProvider } from '../../core/providers/embedding-provider';
import type { GraphStore } from '../../core/store/graph-store';
import { cosineSimilarity } from '../../core/store/utils/cosine';
import { OpenAIEmbeddingProvider } from '../../core/providers/openai/openai-embedding-provider';
import { createGraphStore } from '../../storage/factory';
import { toGraphStoreContext, withRequestContext, type ContextualRouteHandler, type RequestContextOptions } from '../middleware/request-context';
import { withAuthGuard, type AuthGuardOptions } from '../middleware/auth';
import { withBodySizeLimit, type BodySizeLimitOptions } from '../middleware/body-size-limit';
import { withRateLimit, type RateLimitOptions } from '../middleware/rate-limit';

const buildConnectedNodeSet = async (store: GraphStore, nodeId: string, context: ReturnType<typeof toGraphStoreContext>) => {
  const edges = await store.listEdges({ context });
  const connected = new Set<string>();
  edges.forEach((edge) => {
    if (edge.fromNodeId === nodeId) connected.add(edge.toNodeId);
    if (edge.toNodeId === nodeId) connected.add(edge.fromNodeId);
  });
  return connected;
};

export const createSearchRoutes = (
  config: NeuronConfig,
  injectedStore?: GraphStore,
  options?: {
    embeddingProvider?: EmbeddingProvider;
    requestContext?: RequestContextOptions;
    auth?: AuthGuardOptions;
    bodySizeLimit?: BodySizeLimitOptions;
    rateLimit?: RateLimitOptions;
  }
) => {
  const store = injectedStore ?? createGraphStore(config);
  const wrap = (handler: ContextualRouteHandler) =>
    withBodySizeLimit(withRateLimit(withAuthGuard(handler, options?.auth), options?.rateLimit), options?.bodySizeLimit);

  let embeddingProvider: EmbeddingProvider | null = options?.embeddingProvider ?? null;
  const getEmbeddingProvider = () => {
    if (!embeddingProvider) {
      embeddingProvider = new OpenAIEmbeddingProvider({
        apiKey: config.openai.apiKey,
        organization: config.openai.organization,
      });
    }
    return embeddingProvider;
  };

  return {
    POST: withRequestContext(wrap(async (request, context) => {
      const storeContext = toGraphStoreContext(context);
      const url = new URL(request.url);
      if (url.pathname.endsWith('/similar')) {
        const body = await request.json();
        const input = findSimilarRequestSchema.parse(body);
        const limit = input.limit ?? 10;
        const minSimilarity = input.minSimilarity ?? 0;

        const raw = await store.findSimilarNodeIds(
          input.nodeId,
          {
            limit: input.excludeConnected ? limit * 5 : limit,
            minSimilarity,
          },
          storeContext
        );

        const connected = input.excludeConnected ? await buildConnectedNodeSet(store, input.nodeId, storeContext) : null;
        const filtered = (connected ? raw.filter((r) => !connected.has(r.nodeId)) : raw).slice(0, limit);

        const nodes = await Promise.all(filtered.map((r) => store.getNodeById(r.nodeId, storeContext)));
        const results = filtered
          .map((r, idx) => {
            const node = nodes[idx];
            if (!node) return null;
            return { node, similarity: r.similarity };
          })
          .filter(Boolean) as Array<{ node: NonNullable<(typeof nodes)[number]>; similarity: number }>;

        return Response.json({ results });
      }

      const body = await request.json();
      const input = semanticSearchRequestSchema.parse(body);
      const start = Date.now();
      const response = await getEmbeddingProvider().embed({
        model: config.analysis.embeddingModel,
        input: input.query,
        dimensions: config.analysis.embeddingDimensions,
      });
      const queryEmbedding = response.embeddings[0] ?? [];

      let nodes = await store.listNodes({ context: storeContext });
      if (input.nodeTypes?.length) nodes = nodes.filter((node) => input.nodeTypes?.includes(node.nodeType));
      if (input.domains?.length) nodes = nodes.filter((node) => input.domains?.includes(node.domain));

      const minSimilarity = input.minSimilarity ?? 0;
      const limit = input.limit ?? 10;
      const results = nodes
        .filter((node) => node.embedding && node.embedding.length === queryEmbedding.length)
        .map((node) => ({ node, similarity: cosineSimilarity(queryEmbedding, node.embedding as number[]) }))
        .filter((row) => row.similarity >= minSimilarity)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit);

      return Response.json({
        results,
        queryTime: Date.now() - start,
        queryEmbedding: input.includeExplanation ? queryEmbedding : undefined,
      });
    }), options?.requestContext),
  };
};
