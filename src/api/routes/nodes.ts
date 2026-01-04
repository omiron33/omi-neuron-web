import { listNodesParamsSchema } from '../../core/schemas/api';
import { nodeBatchCreateSchema, nodeUpdateSchema } from '../../core/schemas/node';
import type { NeuronConfig } from '../../core/types/settings';
import { createDatabase } from '../../storage/factory';
import { NodeRepository } from '../repositories/node-repository';

export const createNodesRoutes = (config: NeuronConfig) => {
  const db = createDatabase(config);
  const repo = new NodeRepository(db);

  return {
    async GET(request: Request) {
      const url = new URL(request.url);
      const params = listNodesParamsSchema.parse(Object.fromEntries(url.searchParams));
      const nodes = await repo.findAll({
        where: {},
        limit: params.limit,
        offset: params.page ? (params.page - 1) * (params.limit ?? 50) : undefined,
      });
      return Response.json({
        nodes,
        pagination: {
          page: params.page ?? 1,
          limit: params.limit ?? nodes.length,
          total: nodes.length,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
        meta: {
          queryTime: 0,
          filters: params,
        },
      });
    },
    async POST(request: Request) {
      const body = await request.json();
      const input = nodeBatchCreateSchema.parse(body);
      const created = await repo.batchCreate(input.nodes);
      return Response.json({ created, skipped: [], analysisJobId: null }, { status: 201 });
    },
    async PATCH(request: Request) {
      const url = new URL(request.url);
      const id = url.pathname.split('/').pop();
      if (!id) return new Response('Missing id', { status: 400 });
      const body = await request.json();
      const input = nodeUpdateSchema.parse(body);
      const updated = await repo.update(id, input);
      return Response.json(updated);
    },
    async DELETE(request: Request) {
      const url = new URL(request.url);
      const id = url.pathname.split('/').pop();
      if (!id) return new Response('Missing id', { status: 400 });
      const deleted = await repo.delete(id);
      return Response.json({ deleted, edgesRemoved: 0 });
    },
  };
};
