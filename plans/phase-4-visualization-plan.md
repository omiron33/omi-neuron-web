# Phase 4: Visualization Plan

## Outcomes
- Port and refactor NeuronWeb Three.js component from Technochristian
- Create modular scene management architecture
- Build configurable node and edge renderers
- Implement rich interaction system (hover, click, focus, pan, zoom)
- Create theme engine for dynamic customization via API
- Build fallback 2D component for low-performance devices
- Implement study path/guided traversal feature

## Scope

### In Scope
- Port NeuronWeb component with domain-agnostic refactoring
- SceneManager for Three.js lifecycle management
- NodeRenderer with sprites, labels, and LOD
- EdgeRenderer with line materials and animations
- InteractionManager for pointer/keyboard handling
- AnimationController for focus tweens and transitions
- ThemeEngine for runtime color/style customization
- Fallback2D component for degraded mode
- StudyPathPlayer for guided node traversal
- NodeDetailPanel with customization slots

### Out of Scope
- VR/AR experiences
- Real-time collaborative editing
- Custom shaders (use built-in Three.js materials)

## Assumptions & Constraints
- Three.js as peer dependency (not bundled)
- CSS2DRenderer for HTML labels in 3D space
- OrbitControls for camera manipulation
- Performance modes: normal, degraded, fallback
- Maximum tested node count: ~500 in 3D, higher in 2D fallback

## Dependencies
- Phase 1: Core types (NeuronVisualNode, NeuronVisualEdge)
- Phase 3: Settings API (for theme persistence)

## Execution Phases

### Phase 4.1 – Port NeuronWeb 🟥
- [ ] Copy neuron-web.tsx from Technochristian
- [ ] Remove domain-specific code (scripture, atlas references)
- [ ] Generalize color/domain handling
- [ ] Update types to use library types
- [ ] Add prop interface for customization
- [ ] Extract constants to configuration
- [ ] Add performance mode detection

### Phase 4.2 – Scene Manager 🟥
- [ ] Create SceneManager class
- [ ] Implement scene initialization (camera, renderer, lights)
- [ ] Implement resize handling
- [ ] Implement animation loop management
- [ ] Implement cleanup/disposal
- [ ] Add WebGL context loss handling
- [ ] Create React hook (useSceneManager)

### Phase 4.3 – Node Renderer 🟥
- [ ] Create NodeRenderer class
- [ ] Implement sprite-based node rendering
- [ ] Implement glow texture generation
- [ ] Implement label rendering with CSS2DRenderer
- [ ] Implement node scaling based on tier/connections
- [ ] Implement node positioning (automatic and manual override)
- [ ] Add LOD (level of detail) for distant nodes
- [ ] Implement node show/hide with transitions

### Phase 4.4 – Edge Renderer 🟥
- [ ] Create EdgeRenderer class
- [ ] Implement line geometry for edges
- [ ] Implement edge color based on state (normal, active, selected)
- [ ] Implement edge strength visualization (opacity/thickness)
- [ ] Implement bidirectional edge rendering
- [ ] Add edge label rendering (optional)
- [ ] Implement edge bundling for dense graphs (optional)

### Phase 4.5 – Interaction Manager 🟥
- [ ] Create InteractionManager class
- [ ] Implement raycasting for node/edge detection
- [ ] Implement hover detection and highlighting
- [ ] Implement click selection
- [ ] Implement double-click focus
- [ ] Implement keyboard navigation (arrow keys, escape)
- [ ] Add touch support for mobile
- [ ] Emit events for all interactions

### Phase 4.6 – Animation Controller 🟥
- [ ] Create AnimationController class
- [ ] Implement camera focus tween
- [ ] Implement node appear/disappear animations
- [ ] Implement filter transition animations
- [ ] Implement path traversal animation
- [ ] Add easing function options
- [ ] Implement animation queue for sequencing

### Phase 4.7 – Theme Engine 🟥
- [ ] Create ThemeEngine class
- [ ] Implement domain color management
- [ ] Implement background color/gradient
- [ ] Implement starfield configuration
- [ ] Implement label styling (font, size, color)
- [ ] Wire to Settings API for persistence
- [ ] Add runtime theme switching
- [ ] Create preset themes (dark, light, custom)

### Phase 4.8 – Fallback 2D 🟥
- [ ] Create Fallback2D component
- [ ] Implement Canvas 2D rendering
- [ ] Implement basic pan/zoom
- [ ] Implement node click handling
- [ ] Match visual style with 3D version
- [ ] Add automatic fallback detection
- [ ] Implement graceful degradation path

### Phase 4.9 – Study Path Player 🟥
- [ ] Create StudyPathPlayer component
- [ ] Implement step-by-step node traversal
- [ ] Implement camera animation between steps
- [ ] Add progress indicator
- [ ] Add play/pause/skip controls
- [ ] Implement caption display per step
- [ ] Add completion callback

### Phase 4.10 – Node Detail Panel 🟥
- [ ] Create NodeDetailPanel component
- [ ] Implement default detail view (label, summary, metadata)
- [ ] Add customization slots for consuming apps
- [ ] Implement related nodes display
- [ ] Add action buttons (edit, delete, analyze)
- [ ] Implement responsive positioning
- [ ] Add animation for show/hide

## Task Files

See `tasks/phase-4-visualization/` for individual task tracking:
- `task-4-1-port-neuronweb.md`
- `task-4-2-scene-manager.md`
- `task-4-3-node-renderer.md`
- `task-4-4-edge-renderer.md`
- `task-4-5-interaction-manager.md`
- `task-4-6-animation-controller.md`
- `task-4-7-theme-engine.md`
- `task-4-8-fallback-2d.md`
- `task-4-9-study-path-player.md`
- `task-4-10-node-detail-panel.md`

## Component Architecture

```
NeuronWeb (main component)
├── SceneManager
│   ├── Scene
│   ├── Camera (PerspectiveCamera)
│   ├── Renderer (WebGLRenderer)
│   ├── CSS2DRenderer (labels)
│   └── OrbitControls
│
├── NodeRenderer
│   ├── Node Sprites (Points + PointsMaterial)
│   ├── Node Labels (CSS2DObject)
│   └── Glow Textures (CanvasTexture)
│
├── EdgeRenderer
│   ├── Edge Lines (LineSegments)
│   └── Edge Labels (optional)
│
├── InteractionManager
│   ├── Raycaster
│   ├── Event Handlers
│   └── Selection State
│
├── AnimationController
│   ├── TWEEN.js integration
│   └── Animation Queue
│
├── ThemeEngine
│   └── Color/Style Configuration
│
└── Fallback2D (conditional)
    └── Canvas 2D Renderer
```

## NeuronWeb Props Interface

```typescript
interface NeuronWebProps {
  // Data
  graphData: { nodes: NeuronVisualNode[]; edges: NeuronVisualEdge[]; };
  
  // Layout
  fullHeight?: boolean;
  isFullScreen?: boolean;
  className?: string;
  
  // State
  isLoading?: boolean;
  error?: string | null;
  
  // Selection
  selectedNode?: NeuronNode | null;
  focusNodeSlug?: string | null;
  visibleNodeSlugs?: string[] | null;
  
  // Callbacks
  onNodeClick?: (node: NeuronNode) => void;
  onNodeDoubleClick?: (node: NeuronNode) => void;
  onNodeHover?: (node: NeuronNode | null) => void;
  onBackgroundClick?: () => void;
  
  // Study paths
  studyPathRequest?: StudyPathRequest | null;
  onStudyPathComplete?: () => void;
  
  // Customization
  theme?: Partial<NeuronWebTheme>;
  renderNodeDetail?: (node: NeuronNode) => ReactNode;
  
  // Performance
  performanceMode?: 'auto' | 'normal' | 'degraded' | 'fallback';
}
```

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| WebGL not supported | Automatic Fallback2D detection |
| Memory leaks | Proper disposal in SceneManager |
| Performance degradation | LOD, frustum culling, performance modes |
| Bundle size | Three.js as peer dep, tree shaking |

## Open Questions
- Should we support React Three Fiber as alternative?
- Custom shader support for advanced effects?
- WebGPU support (future Three.js feature)?

## Parallel / Unblock Options
- Port and SceneManager must come first
- Node/Edge renderers can be parallel
- InteractionManager needs renderers
- ThemeEngine can be independent
- Fallback2D can be developed in parallel

## Validation Criteria
- [ ] Component renders without errors
- [ ] Nodes display with correct colors and positions
- [ ] Edges connect nodes correctly
- [ ] Hover/click interactions work
- [ ] Camera focus animates smoothly
- [ ] Theme changes apply immediately
- [ ] Fallback2D activates on WebGL failure
- [ ] Performance stays smooth with 200+ nodes

