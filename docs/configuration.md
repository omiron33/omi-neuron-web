# Configuration

`neuron.config.ts` defines instance settings, database configuration, and visualization defaults.

## Example

```ts
import { defineNeuronConfig, DEFAULT_ANALYSIS_SETTINGS, DEFAULT_VISUALIZATION_SETTINGS } from '@omiron33/omi-neuron-web';

export default defineNeuronConfig({
  instance: {
    name: 'My Graph',
    version: '0.1.1',
    repoName: 'my-graph',
  },
  visualization: DEFAULT_VISUALIZATION_SETTINGS,
  analysis: DEFAULT_ANALYSIS_SETTINGS,
  nodeTypes: [],
  domains: [],
  relationshipTypes: [],
  openai: {
    apiKey: process.env.OPENAI_API_KEY ?? '',
  },
  database: {
    mode: 'docker',
    port: 5433,
  },
  api: {
    basePath: '/api/neuron',
    enableCors: false,
  },
  logging: {
    level: 'info',
    prettyPrint: true,
  },
});
```

## Environment Variables

- `OPENAI_API_KEY`
- `DATABASE_URL`
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
