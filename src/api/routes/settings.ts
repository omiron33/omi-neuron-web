import type { NeuronConfig, NeuronSettingsUpdate } from '../../core/types/settings';
import { neuronSettingsUpdateSchema } from '../../core/schemas/settings';
import { createDatabase } from '../../storage/factory';
import { SettingsRepository } from '../repositories/settings-repository';

export const createSettingsRoutes = (config: NeuronConfig) => {
  const db = createDatabase(config);
  const repo = new SettingsRepository(db);

  return {
    async GET() {
      const settings = await repo.get();
      return Response.json({ settings });
    },
    async PATCH(request: Request) {
      const body = await request.json();
      const input = neuronSettingsUpdateSchema.parse(body) as NeuronSettingsUpdate;
      const settings = await repo.update(input);
      return Response.json({ settings });
    },
    async POST(request: Request) {
      const url = new URL(request.url);
      if (!url.pathname.endsWith('/reset')) {
        return new Response('Not found', { status: 404 });
      }
      const body = await request.json().catch(() => ({}));
      const settings = await repo.reset(body?.sections);
      return Response.json({ settings });
    },
  };
};
