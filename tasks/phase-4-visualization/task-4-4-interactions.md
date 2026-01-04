---
title: Interaction and Animation Systems
status: completed
priority: 2
labels:
  - 'Phase:4-Visualization'
  - 'Type:ThreeJS'
assignees:
  - CodingAgent
depends_on:
  - task-4-3-renderers
---

# Task 4.4: Interactions and Animations

## Objective
Build interaction handling (hover, click, focus) and animation systems (tweens, transitions).

## Requirements

### 1. InteractionManager (`src/visualization/interactions/interaction-manager.ts`)

```typescript
interface InteractionConfig {
  enableHover: boolean;
  enableClick: boolean;
  enableDoubleClick: boolean;
  hoverDelay: number;
  doubleClickDelay: number;
}

class InteractionManager {
  constructor(
    scene: THREE.Scene,
    camera: THREE.Camera,
    renderer: THREE.WebGLRenderer,
    config: InteractionConfig
  );
  
  // Event handling
  onPointerMove(event: PointerEvent): void;
  onPointerDown(event: PointerEvent): void;
  onPointerUp(event: PointerEvent): void;
  onKeyDown(event: KeyboardEvent): void;
  
  // Raycasting
  getIntersectedNode(point: { x: number; y: number }): NeuronVisualNode | null;
  getIntersectedEdge(point: { x: number; y: number }): NeuronVisualEdge | null;
  
  // Callbacks
  onNodeHover: (node: NeuronVisualNode | null) => void;
  onNodeClick: (node: NeuronVisualNode) => void;
  onNodeDoubleClick: (node: NeuronVisualNode) => void;
  onEdgeClick: (edge: NeuronVisualEdge) => void;
  onBackgroundClick: () => void;
  
  // Cleanup
  dispose(): void;
}
```

### 2. AnimationController (`src/visualization/animations/animation-controller.ts`)

```typescript
interface AnimationConfig {
  focusDuration: number;
  transitionDuration: number;
  easing: 'linear' | 'easeInOut' | 'easeOut';
}

class AnimationController {
  constructor(
    camera: THREE.Camera,
    controls: OrbitControls,
    config: AnimationConfig
  );
  
  // Camera animations
  focusOnNode(position: THREE.Vector3, callback?: () => void): void;
  focusOnPosition(position: THREE.Vector3, target: THREE.Vector3): void;
  resetCamera(): void;
  
  // Node animations
  animateNodeAppear(nodeId: string): void;
  animateNodeDisappear(nodeId: string): void;
  animateNodesFilter(visibleIds: string[]): void;
  
  // Path animations
  animatePath(path: THREE.Vector3[]): void;
  stopPathAnimation(): void;
  
  // Control
  pause(): void;
  resume(): void;
  update(delta: number): void;
  
  // Cleanup
  dispose(): void;
}
```

### 3. Raycasting
- [ ] Convert screen to NDC coordinates
- [ ] Cast ray from camera
- [ ] Intersect with node objects
- [ ] Return nearest intersection

### 4. Camera Focus
- [ ] Calculate target position
- [ ] Smooth tween to position
- [ ] Update OrbitControls target
- [ ] Emit completion callback

### 5. Keyboard Navigation
- [ ] Arrow keys for node selection
- [ ] Escape to deselect
- [ ] Enter to focus
- [ ] Space for details

### 6. Touch Support
- [ ] Touch start/move/end
- [ ] Pinch to zoom
- [ ] Pan gestures

## Deliverables
- [ ] `src/visualization/interactions/interaction-manager.ts`
- [ ] `src/visualization/animations/animation-controller.ts`
- [ ] Touch utilities
- [ ] Unit tests

## Acceptance Criteria
- Hover highlights correctly
- Click selects node
- Double-click focuses camera
- Animations are smooth
- Touch works on mobile

## Notes
- Use TWEEN.js or similar for animations
- Debounce rapid events
- Consider accessibility (keyboard nav)
- Test on touch devices

