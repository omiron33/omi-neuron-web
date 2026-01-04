import { z } from 'zod';

export const analysisOptionsSchema = z.object({
  nodeIds: z.array(z.string().uuid()).optional(),
  forceRecompute: z.boolean().optional(),
  skipEmbeddings: z.boolean().optional(),
  embeddingModel: z.string().optional(),
  skipClustering: z.boolean().optional(),
  clusterCount: z.coerce.number().int().min(1).optional(),
  clusteringAlgorithm: z.enum(['kmeans', 'dbscan', 'hierarchical']).optional(),
  skipRelationships: z.boolean().optional(),
  relationshipThreshold: z.coerce.number().min(0).max(1).optional(),
  maxRelationshipsPerNode: z.coerce.number().int().min(1).optional(),
});

export const analysisRequestSchema = z.object({
  action: z.enum(['embeddings', 'cluster', 'infer_relationships', 'full']),
  options: analysisOptionsSchema.optional(),
});

export type AnalysisOptionsInput = z.infer<typeof analysisOptionsSchema>;
export type AnalysisRequestInput = z.infer<typeof analysisRequestSchema>;
