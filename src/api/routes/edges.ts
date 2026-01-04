import { listEdgesParamsSchema } from '../../core/schemas/api';
import { edgeCreateSchema, edgeUpdateSchema } from '../../core/schemas/edge';
import type { NeuronConfig } from '../../core/types/settings';
import { createDatabase } from '../../storage/factory';
import { EdgeRepository } from '../repositories/edge-repository';

export const createEdgesRoutes = (config: NeuronConfig) => {
  const db = createDatabase(config);
  const repo = new EdgeRepository(db);

  return {
    async GET(request: Request) {
      const url = new URL(request.url);
      const params = listEdgesParamsSchema.parse(Object.fromEntries(url.searchParams));
      const edges = await repo.findAll();
      return Response.json({
        edges,
        pagination: {
          page: params.page ?? 1,
          limit: params.limit ?? edges.length,
          total: edges.length,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
      });
    },
    async POST(request: Request) {
      const body = await request.json();
      const input = edgeCreateSchema.array().safeParse(body.edges ?? body);
      if (!input.success) {
        return Response.json({ error: input.error.message }, { status: 400 });
      }
      const created = await repo.batchCreate(input.data);
      return Response.json({ created, errors: [] }, { status: 201 });
    },
    async PATCH(request: Request) {
      const url = new URL(request.url);
      const id = url.pathname.split('/').pop();
      if (!id) return new Response('Missing id', { status: 400 });
      const body = await request.json();
      const input = edgeUpdateSchema.parse(body);
      const updated = await repo.update(id, input);
      return Response.json(updated);
    },
    async DELETE(request: Request) {
      const url = new URL(request.url);
      const id = url.pathname.split('/').pop();
      if (!id) return new Response('Missing id', { status: 400 });
      const deleted = await repo.delete(id);
      return Response.json({ deleted });
    },
  };
};
