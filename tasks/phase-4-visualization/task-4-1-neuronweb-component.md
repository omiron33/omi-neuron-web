---
title: NeuronWeb Component - Port and Refactor
status: completed
priority: 1
labels:
  - 'Phase:4-Visualization'
  - 'Type:Component'
assignees:
  - CodingAgent
depends_on:
  - task-1-2-type-system
---

# Task 4.1: NeuronWeb Component

## Objective
Port the NeuronWeb Three.js visualization component from Technochristian and refactor for library use.

## Requirements

### 1. Port from Technochristian
- [ ] Copy `src/components/home/neuron-web.tsx`
- [ ] Remove domain-specific references (atlas, scripture, etc.)
- [ ] Update imports to use library types
- [ ] Generalize color handling

### 2. Component Structure (`src/visualization/NeuronWeb.tsx`)

```typescript
interface NeuronWebProps {
  // Data
  graphData: {
    nodes: NeuronVisualNode[];
    edges: NeuronVisualEdge[];
    storyBeats?: NeuronStoryBeat[];
  };
  
  // Layout
  fullHeight?: boolean;
  isFullScreen?: boolean;
  className?: string;
  style?: React.CSSProperties;
  
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
  onNodeFocused?: (node: NeuronNode) => void;
  onEdgeClick?: (edge: NeuronEdge) => void;
  onBackgroundClick?: () => void;
  onCameraChange?: (position: [number, number, number]) => void;
  
  // Study paths
  studyPathRequest?: StudyPathRequest | null;
  onStudyPathComplete?: () => void;
  
  // Customization
  theme?: Partial<NeuronWebTheme>;
  domainColors?: Record<string, string>;
  renderNodeDetail?: (node: NeuronNode) => React.ReactNode;
  renderEmptyState?: () => React.ReactNode;
  renderLoadingState?: () => React.ReactNode;
  
  // Performance
  performanceMode?: 'auto' | 'normal' | 'degraded' | 'fallback';
  
  // Accessibility
  ariaLabel?: string;
}

export function NeuronWeb(props: NeuronWebProps): JSX.Element;
```

### 3. Refactoring Tasks
- [ ] Extract DOMAIN_COLORS to configuration
- [ ] Extract POSITION_OVERRIDES handling
- [ ] Generalize resolveNodeColor function
- [ ] Generalize resolveNodeScale function
- [ ] Extract createGlowTexture utility
- [ ] Extract createStarfield utility
- [ ] Split into smaller components/hooks

### 4. Configuration Points
- [ ] Colors (domain, edge, background)
- [ ] Camera (position, target, zoom limits)
- [ ] Rendering (starfield, labels, performance)
- [ ] Interactions (hover, click, pan, zoom)

### 5. Performance Modes
- [ ] `normal` - Full quality
- [ ] `degraded` - Reduced labels, simplified effects
- [ ] `fallback` - 2D canvas rendering
- [ ] `auto` - Detect based on node count

## Deliverables
- [ ] `src/visualization/NeuronWeb.tsx`
- [ ] `src/visualization/types.ts`
- [ ] `src/visualization/constants.ts`
- [ ] `src/visualization/utils/`

## Acceptance Criteria
- Component renders without errors
- All props work as documented
- Performance modes switch correctly
- Callbacks fire at appropriate times
- No domain-specific code remains

## Source Reference
Port from: `/Users/shanefisher/Code/Technochristian/src/components/home/neuron-web.tsx`

## Notes
- Use "use client" directive
- Three.js must be peer dependency
- Handle SSR (null render on server)
- Clean up on unmount

