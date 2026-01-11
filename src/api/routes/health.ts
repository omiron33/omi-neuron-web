import type { NeuronConfig } from '../../core/types/settings';
import type { GraphStore } from '../../core/store/graph-store';
import { createDatabase, createGraphStore } from '../../storage/factory';

export const createHealthRoutes = (config: NeuronConfig, injectedStore?: GraphStore) => {
  const store = injectedStore ?? createGraphStore(config);
  return {
    async GET() {
      const ok = store.kind === 'postgres' ? await createDatabase(config).isConnected() : true;
      return Response.json({ status: ok ? 'ok' : 'degraded', time: new Date().toISOString() });
    },
  };
};
