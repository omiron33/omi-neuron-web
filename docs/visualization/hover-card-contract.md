# NeuronWeb Hover Card Contract

## Purpose
Define the minimal data set and fallback rules for hover cards, plus extensibility hooks for custom content.

## Minimum Field Set

| Field | Type | Source (preferred) | Fallback |
| --- | --- | --- | --- |
| title | string | `node.label` | `node.slug` → `node.id` |
| subtitle | string | `node.domain` | `node.nodeType` → `"Node"` |
| summary | string | `node.summary` | `node.metadata.summary` → `"Click to focus this node."` |
| tags | string[] | `node.metadata.tags` | `node.metadata.keywords` → `[]` |
| metrics | Record<string, string \\| number> | `node.connectionCount`, `node.clusterSimilarity` | `{ connections: 0 }` |

## Mapping to Existing Types

- **NeuronVisualNode**
  - `label`, `slug`, `id`, `domain`, `metadata`, `connectionCount`, `tier`
- **NeuronNode** (if available)
  - `summary`, `description`, `nodeType`, `clusterSimilarity`, `analysisStatus`

Default mapping uses `NeuronVisualNode` only. If the consumer provides richer data (via `renderNodeHover`), it can expose `NeuronNode` fields.

## Truncation + Formatting Rules

- **Title:** max 48 chars, 1 line, ellipsis
- **Subtitle:** max 32 chars, 1 line, uppercase small text
- **Summary:** max 140 chars, 2 lines, ellipsis
- **Tags:** show up to 4 tags, each max 16 chars
- **Metrics:** show up to 3 key/value pairs, order by priority: `connections`, `cluster`, `score`

## Slot Strategy (Custom Content)

Two levels of customization:

1. **Full override (existing):**
   - `renderNodeHover?: (node: NeuronVisualNode) => ReactNode`
   - If provided, it replaces the entire hover card content.

2. **Slot overrides (proposed additions):**
   - `hoverCardSlots?: {
       header?: (node) => ReactNode;
       summary?: (node) => ReactNode;
       tags?: (node) => ReactNode;
       metrics?: (node) => ReactNode;
       footer?: (node) => ReactNode;
     }`
   - Slots render inside the default card layout; omitted slots fall back to defaults.

## Proposed Type Additions

```ts
export interface HoverCardContent {
  title?: string;
  subtitle?: string;
  summary?: string;
  tags?: string[];
  metrics?: Record<string, string | number>;
}

export interface HoverCardOptions {
  enabled?: boolean;
  width?: number;
  offset?: [number, number];
  showTags?: boolean;
  showMetrics?: boolean;
  maxSummaryLength?: number;
}

export interface NeuronWebProps {
  hoverCard?: HoverCardOptions;
  hoverCardSlots?: {
    header?: (node: NeuronVisualNode) => React.ReactNode;
    summary?: (node: NeuronVisualNode) => React.ReactNode;
    tags?: (node: NeuronVisualNode) => React.ReactNode;
    metrics?: (node: NeuronVisualNode) => React.ReactNode;
    footer?: (node: NeuronVisualNode) => React.ReactNode;
  };
}
```

## Example Payload (Default Mapping)

```json
{
  "title": "Node 14",
  "subtitle": "memory",
  "summary": "Synthetic summary for memory node 14.",
  "tags": ["vector", "context"],
  "metrics": { "connections": 12 }
}
```
