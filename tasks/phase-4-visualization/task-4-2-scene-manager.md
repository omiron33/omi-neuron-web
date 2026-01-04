---
title: Scene Manager - Three.js Lifecycle
status: completed
priority: 1
labels:
  - 'Phase:4-Visualization'
  - 'Type:ThreeJS'
assignees:
  - CodingAgent
depends_on:
  - task-4-1-neuronweb-component
---

# Task 4.2: Scene Manager

## Objective
Extract scene management into a dedicated class for Three.js lifecycle, rendering, and resource cleanup.

## Requirements

### 1. SceneManager Class (`src/visualization/scene/scene-manager.ts`)

```typescript
interface SceneConfig {
  backgroundColor: string;
  cameraPosition: [number, number, number];
  cameraTarget: [number, number, number];
  minZoom: number;
  maxZoom: number;
  enableStarfield: boolean;
  starfieldCount: number;
  pixelRatioCap: number;
}

class SceneManager {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  labelRenderer: CSS2DRenderer;
  controls: OrbitControls;
  
  constructor(container: HTMLElement, config: SceneConfig);
  
  // Lifecycle
  initialize(): void;
  dispose(): void;
  
  // Rendering
  startAnimationLoop(): void;
  stopAnimationLoop(): void;
  render(): void;
  
  // Updates
  resize(): void;
  updateBackground(color: string): void;
  updateCamera(position: [number, number, number]): void;
  
  // Utilities
  getWorldPosition(screenX: number, screenY: number): THREE.Vector3;
  screenToWorld(x: number, y: number): THREE.Vector3;
  worldToScreen(position: THREE.Vector3): { x: number; y: number };
  
  // Context loss handling
  onContextLost: () => void;
  onContextRestored: () => void;
}
```

### 2. Initialization
- [ ] Create Scene with background
- [ ] Create PerspectiveCamera
- [ ] Create WebGLRenderer with antialias
- [ ] Create CSS2DRenderer for labels
- [ ] Create OrbitControls
- [ ] Set up resize observer
- [ ] Start animation loop

### 3. Cleanup/Disposal
- [ ] Stop animation loop
- [ ] Dispose renderer
- [ ] Dispose all geometries
- [ ] Dispose all materials
- [ ] Dispose all textures
- [ ] Remove event listeners
- [ ] Clear scene

### 4. Context Loss Handling
- [ ] Listen for webglcontextlost
- [ ] Listen for webglcontextrestored
- [ ] Graceful degradation on loss
- [ ] Restore state on recovery

### 5. React Hook (`src/visualization/hooks/useSceneManager.ts`)

```typescript
function useSceneManager(
  containerRef: RefObject<HTMLElement>,
  config: SceneConfig
): SceneManager | null;
```

## Deliverables
- [ ] `src/visualization/scene/scene-manager.ts`
- [ ] `src/visualization/hooks/useSceneManager.ts`
- [ ] Disposal utilities
- [ ] Context loss handling

## Acceptance Criteria
- Scene initializes correctly
- Animation loop runs smoothly
- Resize handled properly
- Memory cleaned up on disposal
- Context loss recovered gracefully

## Notes
- Use requestAnimationFrame for loop
- Respect device pixel ratio (capped)
- OrbitControls for camera manipulation
- CSS2DRenderer for HTML labels in 3D

