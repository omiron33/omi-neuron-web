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

### Phase 4.1 – Port NeuronWeb ✅
- [x] Copy neuron-web.tsx from Technochristian
- [x] Remove domain-specific code (scripture, atlas references)
- [x] Generalize color/domain handling
- [x] Update types to use library types
- [x] Add prop interface for customization
- [x] Extract constants to configuration
- [x] Add performance mode detection

### Phase 4.2 – Scene Manager ✅
- [x] Create SceneManager class
- [x] Implement scene initialization (camera, renderer, lights)
- [x] Implement resize handling
- [x] Implement animation loop management
- [x] Implement cleanup/disposal
- [x] Add WebGL context loss handling
- [x] Create React hook (useSceneManager)

### Phase 4.3 – Node Renderer ✅
- [x] Create NodeRenderer class
- [x] Implement sprite-based node rendering
- [x] Implement glow texture generation
- [x] Implement label rendering with CSS2DRenderer
- [x] Implement node scaling based on tier/connections
- [x] Implement node positioning (automatic and manual override)
- [x] Add LOD (level of detail) for distant nodes
- [x] Implement node show/hide with transitions

### Phase 4.4 – Edge Renderer ✅
- [x] Create EdgeRenderer class
- [x] Implement line geometry for edges
- [x] Implement edge color based on state (normal, active, selected)
- [x] Implement edge strength visualization (opacity/thickness)
- [x] Implement bidirectional edge rendering
- [x] Add edge label rendering (optional)
- [x] Implement edge bundling for dense graphs (optional)

### Phase 4.5 – Interaction Manager ✅
- [x] Create InteractionManager class
- [x] Implement raycasting for node/edge detection
- [x] Implement hover detection and highlighting
- [x] Implement click selection
- [x] Implement double-click focus
- [x] Implement keyboard navigation (arrow keys, escape)
- [x] Add touch support for mobile
- [x] Emit events for all interactions

### Phase 4.6 – Animation Controller ✅
- [x] Create AnimationController class
- [x] Implement camera focus tween
- [x] Implement node appear/disappear animations
- [x] Implement filter transition animations
- [x] Implement path traversal animation
- [x] Add easing function options
- [x] Implement animation queue for sequencing

### Phase 4.7 – Theme Engine ✅
- [x] Create ThemeEngine class
- [x] Implement domain color management
- [x] Implement background color/gradient
- [x] Implement starfield configuration
- [x] Implement label styling (font, size, color)
- [x] Wire to Settings API for persistence
- [x] Add runtime theme switching
- [x] Create preset themes (dark, light, custom)

### Phase 4.8 – Fallback 2D ✅
- [x] Create Fallback2D component
- [x] Implement Canvas 2D rendering
- [x] Implement basic pan/zoom
- [x] Implement node click handling
- [x] Match visual style with 3D version
- [x] Add automatic fallback detection
- [x] Implement graceful degradation path

### Phase 4.9 – Study Path Player ✅
- [x] Create StudyPathPlayer component
- [x] Implement step-by-step node traversal
- [x] Implement camera animation between steps
- [x] Add progress indicator
- [x] Add play/pause/skip controls
- [x] Implement caption display per step
- [x] Add completion callback

### Phase 4.10 – Node Detail Panel ✅
- [x] Create NodeDetailPanel component
- [x] Implement default detail view (label, summary, metadata)
- [x] Add customization slots for consuming apps
- [x] Implement related nodes display
- [x] Add action buttons (edit, delete, analyze)
- [x] Implement responsive positioning
- [x] Add animation for show/hide

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
- None (resolved for initial release).

## Task Backlog
- None. All Phase 4 tasks completed.

## Parallel / Unblock Options
- Port and SceneManager must come first
- Node/Edge renderers can be parallel
- InteractionManager needs renderers
- ThemeEngine can be independent
- Fallback2D can be developed in parallel

## Validation Criteria
- [x] Component renders without errors
- [x] Nodes display with correct colors and positions
- [x] Edges connect nodes correctly
- [x] Hover/click interactions work
- [x] Camera focus animates smoothly
- [x] Theme changes apply immediately
- [x] Fallback2D activates on WebGL failure
- [x] Performance stays smooth with 200+ nodes
