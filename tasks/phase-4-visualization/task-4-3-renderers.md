---
title: Node and Edge Renderers
status: not_started
priority: 1
labels:
  - 'Phase:4-Visualization'
  - 'Type:ThreeJS'
assignees:
  - CodingAgent
depends_on:
  - task-4-2-scene-manager
---

# Task 4.3: Node and Edge Renderers

## Objective
Extract node and edge rendering into dedicated classes with configurable appearance.

## Requirements

### 1. NodeRenderer (`src/visualization/scene/node-renderer.ts`)

```typescript
interface NodeRenderConfig {
  domainColors: Record<string, string>;
  defaultColor: string;
  baseScale: number;
  tierScales: Record<NodeTier, number>;
  glowIntensity: number;
  labelDistance: number;
  maxVisibleLabels: number;
}

class NodeRenderer {
  constructor(scene: THREE.Scene, config: NodeRenderConfig);
  
  // Rendering
  renderNodes(nodes: NeuronVisualNode[]): void;
  updateNode(nodeId: string, updates: Partial<NeuronVisualNode>): void;
  removeNode(nodeId: string): void;
  clear(): void;
  
  // Visibility
  showNodes(nodeIds: string[]): void;
  hideNodes(nodeIds: string[]): void;
  setVisibleNodes(nodeIds: string[] | null): void;
  
  // Labels
  updateLabelVisibility(cameraDistance: number): void;
  
  // Highlighting
  highlightNode(nodeId: string): void;
  unhighlightNode(nodeId: string): void;
  clearHighlights(): void;
  
  // Position
  getNodePosition(nodeId: string): THREE.Vector3 | null;
  getNodeObject(nodeId: string): THREE.Object3D | null;
  
  // Utilities
  dispose(): void;
}
```

### 2. EdgeRenderer (`src/visualization/scene/edge-renderer.ts`)

```typescript
interface EdgeRenderConfig {
  defaultColor: string;
  activeColor: string;
  selectedColor: string;
  baseOpacity: number;
  strengthOpacityScale: boolean;
}

class EdgeRenderer {
  constructor(scene: THREE.Scene, config: EdgeRenderConfig);
  
  // Rendering
  renderEdges(edges: NeuronVisualEdge[], nodePositions: Map<string, THREE.Vector3>): void;
  updateEdge(edgeId: string, updates: Partial<NeuronVisualEdge>): void;
  removeEdge(edgeId: string): void;
  clear(): void;
  
  // Filtering
  filterByStrength(minStrength: number): void;
  filterByType(types: string[]): void;
  
  // Highlighting
  highlightEdge(edgeId: string): void;
  highlightEdgesForNode(nodeId: string): void;
  unhighlightEdge(edgeId: string): void;
  clearHighlights(): void;
  
  // Visibility
  showEdges(edgeIds: string[]): void;
  hideEdges(edgeIds: string[]): void;
  
  // Utilities
  dispose(): void;
}
```

### 3. Node Rendering Details
- [ ] Sprite-based points for performance
- [ ] Glow texture generation
- [ ] Color by domain
- [ ] Scale by tier/connections
- [ ] Position calculation (spherical distribution)
- [ ] Position override support
- [ ] CSS2D labels

### 4. Edge Rendering Details
- [ ] LineSegments geometry
- [ ] Color by state
- [ ] Opacity by strength
- [ ] Bidirectional indicator (optional)

## Deliverables
- [ ] `src/visualization/scene/node-renderer.ts`
- [ ] `src/visualization/scene/edge-renderer.ts`
- [ ] Texture utilities
- [ ] Position utilities

## Acceptance Criteria
- Nodes render with correct colors
- Edges connect nodes properly
- Highlighting works
- Filtering works
- Performance acceptable for 200+ nodes

## Notes
- Use Points geometry for many nodes
- Use BufferGeometry for edges
- Frustum culling for off-screen objects
- LOD for distant nodes

