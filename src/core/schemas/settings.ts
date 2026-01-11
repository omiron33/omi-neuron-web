import { z } from 'zod';

const colorSchema = z.string().min(1);

export const nodeTypeConfigSchema = z.object({
  type: z.string().min(1),
  label: z.string().min(1),
  description: z.string().optional(),
  defaultDomain: z.string().min(1),
  icon: z.string().optional(),
  color: colorSchema.optional(),
  analysisPrompt: z.string().optional(),
});

export const domainConfigSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  color: colorSchema,
  description: z.string().optional(),
});

export const relationshipTypeConfigSchema = z.object({
  type: z.string().min(1),
  label: z.string().min(1),
  description: z.string().optional(),
  bidirectional: z.boolean(),
  color: colorSchema.optional(),
});

export const visualizationSettingsSchema = z.object({
  domainColors: z.record(z.string(), colorSchema),
  defaultDomainColor: colorSchema,
  edgeColor: colorSchema,
  edgeActiveColor: colorSchema,
  backgroundColor: colorSchema,
  defaultCameraPosition: z.tuple([z.number(), z.number(), z.number()]),
  defaultCameraTarget: z.tuple([z.number(), z.number(), z.number()]),
  minZoomDistance: z.number(),
  maxZoomDistance: z.number(),
  enableStarfield: z.boolean(),
  starfieldCount: z.number().int().min(0),
  labelDistance: z.number().min(0),
  maxVisibleLabels: z.number().int().min(0),
  performanceMode: z.enum(['auto', 'normal', 'degraded', 'fallback']),
  nodeCountThreshold: z.number().int().min(0),
  pixelRatioCap: z.number().min(0.5),
  enableAnimations: z.boolean(),
  focusTweenDuration: z.number().int().min(0),
  filterTransitionDuration: z.number().int().min(0),
  enableHover: z.boolean(),
  enableClick: z.boolean(),
  enableDoubleClick: z.boolean(),
  enablePan: z.boolean(),
  enableZoom: z.boolean(),
  enableRotate: z.boolean(),
});

export const analysisSettingsSchema = z.object({
  embeddingModel: z.enum(['text-embedding-ada-002', 'text-embedding-3-small', 'text-embedding-3-large']),
  embeddingDimensions: z.number().int().min(1),
  embeddingBatchSize: z.number().int().min(1),
  embeddingCacheTTL: z.number().int().min(0),
  clusteringAlgorithm: z.enum(['kmeans', 'dbscan', 'hierarchical']),
  defaultClusterCount: z.number().int().min(1),
  minClusterSize: z.number().int().min(1),
  clusterSimilarityThreshold: z.number().min(0).max(1),
  relationshipInferenceModel: z.string().min(1),
  relationshipMinConfidence: z.number().min(0).max(1),
  relationshipMaxPerNode: z.number().int().min(1),
  relationshipGovernanceEnabled: z.boolean().optional().default(true),
  relationshipAutoApproveEnabled: z.boolean().optional().default(true),
  relationshipAutoApproveMinConfidence: z.number().min(0).max(1).optional().default(0.7),
  openaiRateLimit: z.number().int().min(1),
  maxConcurrentAnalysis: z.number().int().min(1),
});

const instanceSettingsSchema = z.object({
  name: z.string().min(1),
  version: z.string().min(1),
  repoName: z.string().min(1),
});

export const databaseSettingsSchema = z.object({
  mode: z.enum(['docker', 'external']),
  port: z.number().int().min(1).max(65535),
  containerName: z.string().optional(),
  image: z.string().optional(),
  user: z.string().optional(),
  password: z.string().optional(),
  database: z.string().optional(),
  url: z.string().optional(),
  pool: z
    .object({
      min: z.number().int().min(0),
      max: z.number().int().min(1),
      idleTimeoutMs: z.number().int().min(0),
      connectionTimeoutMs: z.number().int().min(0),
    })
    .optional(),
  resources: z
    .object({
      memoryLimit: z.string().min(1),
      cpuLimit: z.string().optional(),
    })
    .optional(),
});

const apiSettingsSchema = z.object({
  basePath: z.string().min(1),
  enableCors: z.boolean(),
  rateLimit: z
    .object({
      windowMs: z.number().int().min(1),
      max: z.number().int().min(1),
    })
    .optional(),
});

const loggingSettingsSchema = z.object({
  level: z.enum(['debug', 'info', 'warn', 'error']),
  prettyPrint: z.boolean(),
});

export const neuronSettingsSchema = z.object({
  instance: instanceSettingsSchema,
  visualization: visualizationSettingsSchema,
  analysis: analysisSettingsSchema,
  nodeTypes: z.array(nodeTypeConfigSchema),
  domains: z.array(domainConfigSchema),
  relationshipTypes: z.array(relationshipTypeConfigSchema),
});

export const neuronSettingsUpdateSchema = z.object({
  visualization: visualizationSettingsSchema.partial().optional(),
  analysis: analysisSettingsSchema.partial().optional(),
  nodeTypes: z.array(nodeTypeConfigSchema).optional(),
  domains: z.array(domainConfigSchema).optional(),
  relationshipTypes: z.array(relationshipTypeConfigSchema).optional(),
});

export const neuronConfigSchema = neuronSettingsSchema.extend({
  openai: z.object({
    apiKey: z.string().min(1),
    organization: z.string().optional(),
    requestsPerMinute: z.number().int().min(1).optional(),
    maxRetries: z.number().int().min(0).optional(),
  }),
  database: databaseSettingsSchema,
  api: apiSettingsSchema,
  logging: loggingSettingsSchema,
});

export type NodeTypeConfigInput = z.infer<typeof nodeTypeConfigSchema>;
export type DomainConfigInput = z.infer<typeof domainConfigSchema>;
export type RelationshipTypeConfigInput = z.infer<typeof relationshipTypeConfigSchema>;
export type VisualizationSettingsInput = z.infer<typeof visualizationSettingsSchema>;
export type AnalysisSettingsInput = z.infer<typeof analysisSettingsSchema>;
export type DatabaseSettingsInput = z.infer<typeof databaseSettingsSchema>;
export type NeuronSettingsInput = z.infer<typeof neuronSettingsSchema>;
export type NeuronSettingsUpdateInput = z.infer<typeof neuronSettingsUpdateSchema>;
export type NeuronConfigInput = z.infer<typeof neuronConfigSchema>;
