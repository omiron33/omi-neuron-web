import type { NeuronConfig } from '../../core/types/settings';
import { createDatabase } from '../../storage/factory';

export const createHealthRoutes = (config: NeuronConfig) => {
  const db = createDatabase(config);
  return {
    async GET() {
      const ok = await db.isConnected();
      return Response.json({ status: ok ? 'ok' : 'degraded', time: new Date().toISOString() });
    },
  };
};
