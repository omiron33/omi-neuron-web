import type { AnalysisStep } from './analysis-step';

export const createDefaultAnalysisSteps = (): AnalysisStep[] => [
  {
    id: 'embeddings',
    stage: 'embeddings',
    isEnabled: (options) => !options.skipEmbeddings,
    async run(job, options, context) {
      const nodeIds = await context.resolveNodeIds(options.nodeIds, options.forceRecompute);
      context.reportProgress({
        stage: 'embeddings',
        progress: 0,
        currentItem: 'starting',
        itemsProcessed: 0,
        totalItems: nodeIds.length,
      });
      const { results, errors } = await context.embeddings.embedNodesWithProgress(nodeIds, {
        signal: context.signal,
        onProgress: ({ processed, total, currentItem }) => {
          context.reportProgress({
            stage: 'embeddings',
            progress: total ? Math.round((processed / total) * 100) : 100,
            currentItem: currentItem ?? `${processed}/${total}`,
            itemsProcessed: processed,
            totalItems: total,
          });
        },
      });
      await context.updateJobResults(job.id, {
        embeddingsGenerated: results.length,
        errors,
      });
      context.reportProgress({
        stage: 'embeddings',
        progress: 100,
        currentItem: 'complete',
        itemsProcessed: nodeIds.length,
        totalItems: nodeIds.length,
      });
    },
  },
  {
    id: 'clustering',
    stage: 'clustering',
    isEnabled: (options) => !options.skipClustering,
    async run(job, options, context) {
      const clusterCount = options.clusterCount;
      const algorithm = options.clusteringAlgorithm ?? 'kmeans';
      context.reportProgress({
        stage: 'clustering',
        progress: 0,
        currentItem: 'starting',
        itemsProcessed: 0,
        totalItems: 0,
      });
      const result = await context.clustering.clusterNodes({
        algorithm,
        clusterCount,
        similarityThreshold: options.relationshipThreshold,
      });
      await context.updateJobResults(job.id, {
        clustersCreated: result.clusters.length,
      });
      context.reportProgress({
        stage: 'clustering',
        progress: 100,
        currentItem: 'complete',
        itemsProcessed: result.clusters.length,
        totalItems: result.clusters.length,
      });
    },
  },
  {
    id: 'relationships',
    stage: 'relationships',
    isEnabled: (options) => !options.skipRelationships,
    async run(job, options, context) {
      const nodeIds = options.nodeIds ?? (await context.resolveNodeIds());
      context.reportProgress({
        stage: 'relationships',
        progress: 0,
        currentItem: 'starting',
        itemsProcessed: 0,
        totalItems: nodeIds.length,
      });
      const { inferred, errors } = await context.relationships.inferForNodesWithProgress(nodeIds, {
        signal: context.signal,
        onProgress: ({ processed, total, currentItem }) => {
          context.reportProgress({
            stage: 'relationships',
            progress: total ? Math.round((processed / total) * 100) : 100,
            currentItem: currentItem ?? `${processed}/${total}`,
            itemsProcessed: processed,
            totalItems: total,
          });
        },
      });
      await context.relationships.createEdgesFromInferences(inferred, true);
      await context.updateJobResults(job.id, {
        relationshipsInferred: inferred.length,
        errors,
      });
      context.reportProgress({
        stage: 'relationships',
        progress: 100,
        currentItem: 'complete',
        itemsProcessed: nodeIds.length,
        totalItems: nodeIds.length,
      });
    },
  },
];
