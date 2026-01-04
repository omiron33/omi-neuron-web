import { z } from 'zod';

export const clusteringConfigSchema = z.object({
  algorithm: z.enum(['kmeans', 'dbscan', 'hierarchical']),
  clusterCount: z.coerce.number().int().min(1).optional(),
  minClusterSize: z.coerce.number().int().min(1).optional(),
  similarityThreshold: z.coerce.number().min(0).max(1).optional(),
  epsilon: z.coerce.number().min(0).optional(),
  minSamples: z.coerce.number().int().min(1).optional(),
});

export const clusterCreateSchema = z.object({
  label: z.string().min(1).max(255),
  clusterType: z.string().max(100).optional(),
  centroid: z.array(z.number()).optional(),
  memberCount: z.number().int().min(0).optional(),
  avgSimilarity: z.number().min(0).max(1).optional(),
  cohesion: z.number().min(0).max(1).optional(),
  description: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const clusterUpdateSchema = clusterCreateSchema.partial();

export type ClusteringConfigInput = z.infer<typeof clusteringConfigSchema>;
export type ClusterCreateInput = z.infer<typeof clusterCreateSchema>;
export type ClusterUpdateInput = z.infer<typeof clusterUpdateSchema>;
