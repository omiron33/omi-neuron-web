---
title: Example Applications
status: completed
priority: 2
labels:
  - 'Phase:5-Integration'
  - 'Type:Examples'
assignees:
  - CodingAgent
depends_on:
  - task-5-2-hooks
---

# Task 5.3: Example Applications

## Objective
Create working example applications demonstrating library usage for different use cases.

## Requirements

### 1. Basic Usage Example (`examples/basic-usage/`)

Minimal Next.js app showing core functionality.

**Features:**
- [ ] Graph visualization
- [ ] Node creation form
- [ ] Analysis trigger
- [ ] Settings panel

**Structure:**
```
examples/basic-usage/
├── app/
│   ├── layout.tsx        # NeuronWebProvider setup
│   ├── page.tsx          # Graph page
│   └── api/
│       └── neuron/
│           └── [...path]/route.ts
├── components/
│   ├── NodeForm.tsx
│   ├── AnalysisPanel.tsx
│   └── SettingsPanel.tsx
├── neuron.config.ts
├── docker-compose.yml
├── package.json
└── README.md
```

### 2. Narrative Analysis Example (`examples/narrative-analysis/`)

Psyopbuilder-style use case for analyzing claims and narratives.

**Features:**
- [ ] Claim node type
- [ ] Entity node type
- [ ] Narrative threading
- [ ] Bias lens filtering
- [ ] Evidence tracking

**Configuration:**
```typescript
// neuron.config.ts
export default defineNeuronConfig({
  nodeTypes: [
    { type: 'claim', label: 'Claim', defaultDomain: 'narrative', icon: '📢' },
    { type: 'entity', label: 'Entity', defaultDomain: 'actors', icon: '👤' },
    { type: 'source', label: 'Source', defaultDomain: 'evidence', icon: '📄' },
  ],
  domains: [
    { key: 'narrative', label: 'Narrative', color: '#ff73fa' },
    { key: 'actors', label: 'Actors', color: '#00f5d4' },
    { key: 'evidence', label: 'Evidence', color: '#ffa94d' },
  ],
  relationshipTypes: [
    { type: 'supports', label: 'Supports', bidirectional: false },
    { type: 'contradicts', label: 'Contradicts', bidirectional: true },
    { type: 'mentions', label: 'Mentions', bidirectional: false },
  ],
});
```

### 3. Knowledge Graph Example (`examples/knowledge-graph/`)

Technochristian-style use case for theological knowledge mapping.

**Features:**
- [ ] Concept node type
- [ ] Scripture references
- [ ] Study paths
- [ ] Domain-based coloring
- [ ] Connection hints

**Configuration:**
```typescript
// neuron.config.ts
export default defineNeuronConfig({
  nodeTypes: [
    { type: 'concept', label: 'Concept', defaultDomain: 'theology' },
    { type: 'doctrine', label: 'Doctrine', defaultDomain: 'theology' },
    { type: 'passage', label: 'Passage', defaultDomain: 'scripture' },
  ],
  domains: [
    { key: 'theology', label: 'Theology', color: '#9d7bff' },
    { key: 'scripture', label: 'Scripture', color: '#22d3ee' },
    { key: 'history', label: 'History', color: '#ff5f71' },
    { key: 'practice', label: 'Practice', color: '#00f5d4' },
  ],
});
```

### 4. Common Example Components

```typescript
// Shared components across examples
examples/shared/
├── NodeDetailPanel.tsx    # Display node details
├── GraphControls.tsx      # Filter/search controls
├── AnalysisStatus.tsx     # Show running analyses
└── ImportExport.tsx       # Data import/export
```

## Deliverables
- [ ] `examples/basic-usage/` - Complete working example
- [ ] `examples/narrative-analysis/` - Complete working example
- [ ] `examples/knowledge-graph/` - Complete working example
- [ ] READMEs for each example

## Example README Template

```markdown
# Basic Usage Example

Demonstrates the core features of omi-neuron-web.

## Quick Start

1. Clone this example
2. Install dependencies: `pnpm install`
3. Set up environment: `cp .env.example .env.local`
4. Start database: `pnpm neuron:db:up`
5. Run dev server: `pnpm dev`
6. Open http://localhost:3000

## Features Demonstrated

- Graph visualization with NeuronWeb component
- Node CRUD operations
- Semantic search
- Analysis pipeline
- Settings customization

## Configuration

See `neuron.config.ts` for configuration options.
```

## Acceptance Criteria
- All examples run successfully
- Documentation is clear
- Configuration demonstrates customization
- Shows realistic use cases

## Notes
- Keep examples self-contained
- Use minimal dependencies
- Include seed data
- Test with fresh setup


