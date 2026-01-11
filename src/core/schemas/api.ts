import { z } from 'zod';

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(1000).optional(),
});

export const listNodesParamsSchema = paginationSchema.extend({
  nodeType: z.union([z.string(), z.array(z.string())]).optional(),
  domain: z.union([z.string(), z.array(z.string())]).optional(),
  clusterId: z.string().uuid().optional(),
  analysisStatus: z.string().optional(),
  search: z.string().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'label', 'connectionCount']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  includeEmbeddings: z.coerce.boolean().optional(),
  includeStats: z.coerce.boolean().optional(),
});

export const listEdgesParamsSchema = paginationSchema.extend({
  fromNodeId: z.string().uuid().optional(),
  toNodeId: z.string().uuid().optional(),
  nodeId: z.string().uuid().optional(),
  relationshipType: z.union([z.string(), z.array(z.string())]).optional(),
  source: z.enum(['manual', 'ai_inferred', 'imported']).optional(),
  minStrength: z.coerce.number().min(0).max(1).optional(),
  minConfidence: z.coerce.number().min(0).max(1).optional(),
});

export const listSuggestionsParamsSchema = paginationSchema.extend({
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
  relationshipType: z.string().optional(),
  minConfidence: z.coerce.number().min(0).max(1).optional(),
});

export const suggestionIdsSchema = z.object({
  ids: z.array(z.string().uuid()).min(1),
});

export const suggestionRejectSchema = z.object({
  reason: z.string().min(1).optional(),
});

export const bulkSuggestionRejectSchema = suggestionIdsSchema.extend({
  reason: z.string().min(1).optional(),
});

export const getGraphParamsSchema = z.object({
  nodeTypes: z.union([z.string(), z.array(z.string())]).optional(),
  domains: z.union([z.string(), z.array(z.string())]).optional(),
  clusterIds: z.union([z.string(), z.array(z.string())]).optional(),
  nodeIds: z.union([z.string(), z.array(z.string())]).optional(),
  depth: z.coerce.number().int().min(1).optional(),
  minEdgeStrength: z.coerce.number().min(0).max(1).optional(),
  relationshipTypes: z.union([z.string(), z.array(z.string())]).optional(),
  maxNodes: z.coerce.number().int().min(1).optional(),
  includeOrphanNodes: z.coerce.boolean().optional(),
});

export const expandGraphRequestSchema = z.object({
  fromNodeIds: z.array(z.string().uuid()),
  depth: z.coerce.number().int().min(1),
  direction: z.enum(['outbound', 'inbound', 'both']),
  maxNodes: z.coerce.number().int().min(1).optional(),
});

export const findPathRequestSchema = z.object({
  fromNodeId: z.string().uuid(),
  toNodeId: z.string().uuid(),
  maxDepth: z.coerce.number().int().min(1).optional(),
  algorithm: z.enum(['shortest', 'all']).optional(),
});

export const semanticSearchRequestSchema = z.object({
  query: z.string().min(1),
  nodeTypes: z.array(z.string()).optional(),
  domains: z.array(z.string()).optional(),
  limit: z.coerce.number().int().min(1).optional(),
  minSimilarity: z.coerce.number().min(-1).max(1).optional(),
  includeExplanation: z.coerce.boolean().optional(),
});

export const findSimilarRequestSchema = z.object({
  nodeId: z.string().uuid(),
  limit: z.coerce.number().int().min(1).optional(),
  minSimilarity: z.coerce.number().min(-1).max(1).optional(),
  excludeConnected: z.coerce.boolean().optional(),
});

export type PaginationInput = z.infer<typeof paginationSchema>;
export type ListNodesParamsInput = z.infer<typeof listNodesParamsSchema>;
export type ListEdgesParamsInput = z.infer<typeof listEdgesParamsSchema>;
export type ListSuggestionsParamsInput = z.infer<typeof listSuggestionsParamsSchema>;
export type GetGraphParamsInput = z.infer<typeof getGraphParamsSchema>;
export type ExpandGraphRequestInput = z.infer<typeof expandGraphRequestSchema>;
export type FindPathRequestInput = z.infer<typeof findPathRequestSchema>;
export type SemanticSearchRequestInput = z.infer<typeof semanticSearchRequestSchema>;
export type FindSimilarRequestInput = z.infer<typeof findSimilarRequestSchema>;
