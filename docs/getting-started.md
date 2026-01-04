# Getting Started

## Installation

```bash
pnpm add omi-neuron-web
```

## Project Setup

1. Initialize config and Docker files:
   ```bash
   npx omi-neuron init
   ```
2. Start the database:
   ```bash
   npx omi-neuron db:up
   ```

## First Graph

```tsx
import { NeuronWeb } from 'omi-neuron-web/visualization';

export default function Page() {
  return <NeuronWeb graphData={{ nodes: [], edges: [] }} />;
}
```

## Adding Nodes

Use the API client or REST routes to create nodes:

```ts
await api.nodes.create({ nodes: [{ label: 'Example', nodeType: 'concept' }] });
```

## Running Analysis

```bash
npx omi-neuron analyze:full
```
