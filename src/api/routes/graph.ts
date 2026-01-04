import { expandGraphRequestSchema, findPathRequestSchema, getGraphParamsSchema } from '../../core/schemas/api';
import type { NeuronConfig } from '../../core/types/settings';
import { createDatabase } from '../../storage/factory';
import { GraphQueryBuilder } from '../query-builder';

export const createGraphRoutes = (config: NeuronConfig) => {
  const db = createDatabase(config);
  const builder = new GraphQueryBuilder(db);

  return {
    async GET(request: Request) {
      const url = new URL(request.url);
      const params = getGraphParamsSchema.parse(Object.fromEntries(url.searchParams));
      const result = await builder.getGraph({
        ...params,
        nodeTypes: params.nodeTypes ? (Array.isArray(params.nodeTypes) ? params.nodeTypes : [params.nodeTypes]) : undefined,
        domains: params.domains ? (Array.isArray(params.domains) ? params.domains : [params.domains]) : undefined,
        clusterIds: params.clusterIds ? (Array.isArray(params.clusterIds) ? params.clusterIds : [params.clusterIds]) : undefined,
        nodeIds: params.nodeIds ? (Array.isArray(params.nodeIds) ? params.nodeIds : [params.nodeIds]) : undefined,
        relationshipTypes: params.relationshipTypes
          ? (Array.isArray(params.relationshipTypes) ? params.relationshipTypes : [params.relationshipTypes])
          : undefined,
      });
      return Response.json(result);
    },
    async POST(request: Request) {
      const url = new URL(request.url);
      if (url.pathname.endsWith('/expand')) {
        const body = await request.json();
        const input = expandGraphRequestSchema.parse(body);
        const result = await builder.expandGraph(input);
        return Response.json(result);
      }
      if (url.pathname.endsWith('/path')) {
        const body = await request.json();
        const input = findPathRequestSchema.parse(body);
        const result = await builder.findPaths(input);
        return Response.json(result);
      }
      return new Response('Unsupported', { status: 404 });
    },
  };
};
