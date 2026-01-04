import { z } from 'zod';

export const edgeEvidenceSchema = z.object({
  type: z.enum(['text', 'url', 'citation', 'ai_inference']),
  content: z.string().min(1),
  confidence: z.number().min(0).max(1).optional(),
  sourceId: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const edgeCreateSchema = z.object({
  fromNodeId: z.string().uuid(),
  toNodeId: z.string().uuid(),
  relationshipType: z.string().optional(),
  strength: z.number().min(0).max(1).optional(),
  confidence: z.number().min(0).max(1).optional(),
  evidence: z.array(edgeEvidenceSchema).optional(),
  label: z.string().max(255).optional(),
  description: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  bidirectional: z.boolean().optional(),
});

export const edgeUpdateSchema = z.object({
  strength: z.number().min(0).max(1).optional(),
  confidence: z.number().min(0).max(1).optional(),
  relationshipType: z.string().optional(),
  label: z.string().max(255).optional(),
  description: z.string().optional(),
  evidence: z.array(edgeEvidenceSchema).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const edgeFilterSchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(1000).optional(),
  fromNodeId: z.string().uuid().optional(),
  toNodeId: z.string().uuid().optional(),
  nodeId: z.string().uuid().optional(),
  relationshipType: z.union([z.string(), z.array(z.string())]).optional(),
  source: z.enum(['manual', 'ai_inferred', 'imported']).optional(),
  minStrength: z.coerce.number().min(0).max(1).optional(),
  minConfidence: z.coerce.number().min(0).max(1).optional(),
});

export type EdgeEvidenceInput = z.infer<typeof edgeEvidenceSchema>;
export type EdgeCreateInput = z.infer<typeof edgeCreateSchema>;
export type EdgeUpdateInput = z.infer<typeof edgeUpdateSchema>;
export type EdgeFilterInput = z.infer<typeof edgeFilterSchema>;
