# omi-neuron-web

A drop-in Next.js library for data analysis and 3D visualization with OpenAI-powered insights.

## Features

- 🔮 **AI-powered analysis** - OpenAI integration for embeddings, clustering, and relationship inference
- 🕸️ **Interactive visualization** - Three.js graph with customizable themes and interactions
- 🐘 **Zero-config database** - Docker PostgreSQL with pgvector automatically provisioned
- 📊 **Smart clustering** - K-means and DBSCAN algorithms for grouping similar nodes
- 🎨 **Fully customizable** - Themes, colors, node types, and domains configurable per project
- 🔌 **Simple React API** - Provider and hooks for seamless integration

## Quick Start

```bash
# Initialize in your Next.js project
npx omi-neuron init

# Start the database
npx omi-neuron db:up

# Run your Next.js app
npm run dev
```

## Documentation

- [Getting Started](./docs/getting-started.md)
- [Configuration](./docs/configuration.md)
- [API Reference](./docs/api-reference.md)
- [Hooks Reference](./docs/hooks-reference.md)
- [Component Props](./docs/component-props.md)
- [CLI Reference](./docs/cli-reference.md)
- [Architecture](./docs/architecture.md)
- [Troubleshooting](./docs/troubleshooting.md)

### Phase Overview

1. **Foundation** - Core types, Docker setup, migrations, CLI
2. **Analysis Engine** - Embeddings, clustering, relationships, events
3. **API Layer** - REST endpoints, repositories, query builder
4. **Visualization** - Three.js component, themes, interactions
5. **Integration** - Provider, hooks, examples
6. **Validation** - Tests, documentation, npm publishing

## Development Status

🟥 **In Planning** - Implementation not yet started

See [plans/master-plan-planner.md](./plans/master-plan-planner.md) for current status.

## License

MIT
