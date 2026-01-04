import slugify from 'slugify';
import { z } from 'zod';

const slugTransform = (label: string) =>
  slugify(label, { lower: true, strict: true, trim: true }).slice(0, 255);

export const nodeTierSchema = z.enum(['primary', 'secondary', 'tertiary', 'insight']);

export const nodeCreateSchema = z
  .object({
    slug: z.string().min(1).max(255).optional(),
    label: z.string().min(1).max(500),
    nodeType: z.string().min(1).max(100).optional(),
    domain: z.string().min(1).max(100).optional(),
    summary: z.string().max(1000).optional(),
    description: z.string().optional(),
    content: z.string().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
    tier: nodeTierSchema.optional(),
  })
  .transform((data) => ({
    ...data,
    slug: data.slug ?? slugTransform(data.label),
  }));

export const nodeUpdateSchema = z.object({
  label: z.string().min(1).max(500).optional(),
  summary: z.string().max(1000).optional(),
  description: z.string().optional(),
  content: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  domain: z.string().min(1).max(100).optional(),
  tier: nodeTierSchema.optional(),
  positionOverride: z.tuple([z.number(), z.number(), z.number()]).nullable().optional(),
});

export const nodeBatchCreateSchema = z.object({
  nodes: z.array(nodeCreateSchema),
  options: z
    .object({
      skipDuplicates: z.boolean().optional(),
      updateOnConflict: z.boolean().optional(),
      autoAnalyze: z.boolean().optional(),
      analysisDepth: z.enum(['embeddings', 'cluster', 'full']).optional(),
    })
    .optional(),
});

export const nodeFilterSchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(1000).optional(),
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

export type NodeCreateInput = z.infer<typeof nodeCreateSchema>;
export type NodeUpdateInput = z.infer<typeof nodeUpdateSchema>;
export type NodeBatchCreateInput = z.infer<typeof nodeBatchCreateSchema>;
export type NodeFilterInput = z.infer<typeof nodeFilterSchema>;
