# Getting Started

## Installation

```bash
pnpm add @omiron33/omi-neuron-web
```

## Project Setup

1. Initialize config and Docker files:
   ```bash
   npx @omiron33/omi-neuron-web init
   ```
2. Start the database:
   ```bash
   npx @omiron33/omi-neuron-web db:up
   ```

## First Graph

```tsx
import { NeuronWeb } from '@omiron33/omi-neuron-web';

export default function Page() {
  return (
    <NeuronWeb
      graphData={{ nodes: [], edges: [] }}
      layout={{ mode: 'fuzzy' }}
    />
  );
}
```

## Adding Nodes

Use the API client or REST routes to create nodes:

```ts
await api.nodes.create({ nodes: [{ label: 'Example', nodeType: 'concept' }] });
```

## Running Analysis

```bash
npx @omiron33/omi-neuron-web analyze:full
```
