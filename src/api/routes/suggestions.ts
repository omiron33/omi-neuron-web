import {
  bulkSuggestionRejectSchema,
  listSuggestionsParamsSchema,
  suggestionIdsSchema,
  suggestionRejectSchema,
} from '../../core/schemas/api';
import type { NeuronConfig } from '../../core/types/settings';
import type { GraphStoreContext } from '../../core/store/graph-store';
import type { GraphStore } from '../../core/store/graph-store';
import { createDatabase, createGraphStore } from '../../storage/factory';
import { SuggestedEdgeRepository } from '../repositories/suggested-edge-repository';
import { toGraphStoreContext, withRequestContext, type ContextualRouteHandler, type RequestContextOptions } from '../middleware/request-context';
import { withAuthGuard, type AuthGuardOptions } from '../middleware/auth';
import { withBodySizeLimit, type BodySizeLimitOptions } from '../middleware/body-size-limit';
import { withRateLimit, type RateLimitOptions } from '../middleware/rate-limit';

type RouteSecurityOptions = { bodySizeLimit?: BodySizeLimitOptions; rateLimit?: RateLimitOptions };

export const createSuggestionsRoutes = (
  config: NeuronConfig,
  injectedStore?: GraphStore,
  requestContextOptions?: RequestContextOptions,
  authOptions?: AuthGuardOptions,
  security?: RouteSecurityOptions
) => {
  const store = injectedStore ?? createGraphStore(config);
  const db = createDatabase(config);
  const suggestions = new SuggestedEdgeRepository(db);
  const resolvedRequestContextOptions: RequestContextOptions = {
    ...requestContextOptions,
    resolveScope:
      requestContextOptions?.resolveScope ??
      ((request) => {
        const url = new URL(request.url);
        return url.searchParams.get('scope');
      }),
  };

  const wrap = (handler: ContextualRouteHandler) =>
    withBodySizeLimit(withRateLimit(withAuthGuard(handler, authOptions), security?.rateLimit), security?.bodySizeLimit);

  const ensureAiInferredEdgeId = async (
    scope: string,
    input: { fromNodeId: string; toNodeId: string; relationshipType: string; confidence: number; strength: number; evidence: unknown; sourceModel: string | null },
    context?: GraphStoreContext
  ): Promise<string | null> => {
    const resolvedScope = scope ?? context?.scope ?? 'default';
    const row = await db.queryOne<{ id: string }>(
      `WITH inserted AS (
         INSERT INTO edges (scope, from_node_id, to_node_id, relationship_type, strength, confidence, evidence, source, source_model)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'ai_inferred', $8)
         ON CONFLICT (scope, from_node_id, to_node_id, relationship_type) DO NOTHING
         RETURNING id
       )
       SELECT id FROM inserted
       UNION ALL
       SELECT id FROM edges WHERE scope = $1 AND from_node_id = $2 AND to_node_id = $3 AND relationship_type = $4
       LIMIT 1`,
      [
        resolvedScope,
        input.fromNodeId,
        input.toNodeId,
        input.relationshipType,
        input.strength,
        input.confidence,
        JSON.stringify(input.evidence ?? []),
        input.sourceModel ?? config.analysis.relationshipInferenceModel,
      ]
    );
    return row?.id ?? null;
  };

  return {
    GET: withRequestContext(wrap(async (request, context) => {
      if (store.kind !== 'postgres') {
        return Response.json({ error: 'Suggestions endpoints currently require the Postgres backend.' }, { status: 400 });
      }

      const url = new URL(request.url);
      const params = listSuggestionsParamsSchema.parse(Object.fromEntries(url.searchParams));
      const page = params.page ?? 1;
      const limit = params.limit ?? 50;
      const offset = (page - 1) * limit;

      const scopeContext = toGraphStoreContext(context);
      const list = await suggestions.list(
        {
          status: params.status ?? 'pending',
          relationshipType: params.relationshipType,
          minConfidence: params.minConfidence,
          limit,
          offset,
        },
        scopeContext
      );

      return Response.json({
        suggestions: list,
        pagination: {
          page,
          limit,
          total: list.length,
          totalPages: 1,
          hasNext: false,
          hasPrev: page > 1,
        },
      });
    }), resolvedRequestContextOptions),

    POST: withRequestContext(wrap(async (request, context) => {
      if (store.kind !== 'postgres') {
        return Response.json({ error: 'Suggestions endpoints currently require the Postgres backend.' }, { status: 400 });
      }

      const url = new URL(request.url);
      const segments = url.pathname.split('/').filter(Boolean);
      const last = segments[segments.length - 1];
      const prev = segments[segments.length - 2];

      const scopeContext = toGraphStoreContext(context);
      const reviewedBy = context.user?.id;

      if (last === 'approve') {
        // Bulk approve: /api/neuron/suggestions/approve
        if (prev === 'suggestions') {
          const body = suggestionIdsSchema.parse(await request.json());
          const approvedIds: string[] = [];
          const edgeIds: string[] = [];
          const notFoundIds: string[] = [];

          for (const id of body.ids) {
            const suggestion = await suggestions.findById(id, scopeContext);
            if (!suggestion) {
              notFoundIds.push(id);
              continue;
            }

            const edgeId =
              suggestion.approvedEdgeId ??
              (await ensureAiInferredEdgeId(
                context.scope,
                {
                  fromNodeId: suggestion.fromNodeId,
                  toNodeId: suggestion.toNodeId,
                  relationshipType: suggestion.relationshipType,
                  confidence: suggestion.confidence,
                  strength: suggestion.strength ?? suggestion.confidence,
                  evidence: suggestion.evidence,
                  sourceModel: suggestion.sourceModel,
                },
                scopeContext
              ));

            if (!edgeId) {
              return Response.json({ error: 'Failed to create edge for suggestion' }, { status: 500 });
            }

            if (suggestion.status !== 'approved') {
              await suggestions.markApproved(id, { reviewedBy, approvedEdgeId: edgeId }, scopeContext);
            }

            approvedIds.push(id);
            edgeIds.push(edgeId);
          }

          return Response.json({ approvedIds, edgeIds, notFoundIds });
        }

        // Single approve: /api/neuron/suggestions/:id/approve
        const id = prev;
        if (!id) return new Response('Missing id', { status: 400 });

        const suggestion = await suggestions.findById(id, scopeContext);
        if (!suggestion) return Response.json({ error: 'Suggestion not found' }, { status: 404 });

        if (suggestion.status === 'approved' && suggestion.approvedEdgeId) {
          return Response.json({ approved: true, edgeId: suggestion.approvedEdgeId });
        }

        const edgeId =
          suggestion.approvedEdgeId ??
          (await ensureAiInferredEdgeId(
            context.scope,
            {
              fromNodeId: suggestion.fromNodeId,
              toNodeId: suggestion.toNodeId,
              relationshipType: suggestion.relationshipType,
              confidence: suggestion.confidence,
              strength: suggestion.strength ?? suggestion.confidence,
              evidence: suggestion.evidence,
              sourceModel: suggestion.sourceModel,
            },
            scopeContext
          ));

        if (!edgeId) {
          return Response.json({ error: 'Failed to create edge for suggestion' }, { status: 500 });
        }

        if (suggestion.status !== 'approved') {
          await suggestions.markApproved(id, { reviewedBy, approvedEdgeId: edgeId }, scopeContext);
        }

        return Response.json({ approved: true, edgeId });
      }

      if (last === 'reject') {
        // Bulk reject: /api/neuron/suggestions/reject
        if (prev === 'suggestions') {
          const body = bulkSuggestionRejectSchema.parse(await request.json());
          const rejectedIds: string[] = [];
          const notFoundIds: string[] = [];

          for (const id of body.ids) {
            const suggestion = await suggestions.findById(id, scopeContext);
            if (!suggestion) {
              notFoundIds.push(id);
              continue;
            }
            if (suggestion.status !== 'rejected') {
              await suggestions.markRejected(id, { reviewedBy, reviewReason: body.reason }, scopeContext);
            }
            rejectedIds.push(id);
          }

          return Response.json({ rejectedIds, notFoundIds });
        }

        // Single reject: /api/neuron/suggestions/:id/reject
        const id = prev;
        if (!id) return new Response('Missing id', { status: 400 });

        const payload = suggestionRejectSchema.parse(await request.json().catch(() => ({})));
        const suggestion = await suggestions.findById(id, scopeContext);
        if (!suggestion) return Response.json({ error: 'Suggestion not found' }, { status: 404 });

        if (suggestion.status !== 'rejected') {
          await suggestions.markRejected(id, { reviewedBy, reviewReason: payload.reason }, scopeContext);
        }

        return Response.json({ rejected: true });
      }

      return Response.json({ error: 'Not found' }, { status: 404 });
    }), resolvedRequestContextOptions),
  };
};
