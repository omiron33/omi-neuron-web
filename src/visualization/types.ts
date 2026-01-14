import type React from 'react';
import type { NeuronVisualEdge, NeuronVisualNode, NeuronVisualCluster, NeuronNode, NeuronEdge, NodeTier, NodeStatus } from '../core/types';

export interface NeuronStoryBeat {
  id: string;
  label: string;
  nodeIds: string[];
}

export interface StudyPathStep {
  nodeSlug?: string;
  nodeId?: string;
  label?: string;
  summary?: string;
}

export interface StudyPathRequest {
  /**
   * Ordered steps to follow (slugs or ids). When provided, this takes precedence.
   */
  steps?: StudyPathStep[];
  /**
   * Optional label for the study path (consumer UI usage).
   */
  label?: string;
  /**
   * Time to hold each step before advancing (ms). Defaults to 4200.
   */
  stepDurationMs?: number;
  /**
   * Minimal fallback when steps are not provided.
   */
  fromNodeId?: string;
  toNodeId?: string;
}

export interface NeuronWebTheme {
  colors: {
    background: string;
    domainColors: Record<string, string>;
    defaultDomainColor: string;
    /** Status-based node colors for workflow visualization */
    statusColors?: Record<NodeStatus, string>;
    edgeDefault: string;
    edgeActive: string;
    edgeSelected: string;
    labelText: string;
    labelBackground: string;
  };
  typography: {
    labelFontFamily: string;
    labelFontSize: number;
    labelFontWeight: string;
  };
  effects: {
    starfieldEnabled: boolean;
    starfieldColor: string;
    glowEnabled: boolean;
    glowIntensity: number;
    ambientMotionEnabled: boolean;
    ambientMotionSpeed: number;
    ambientMotionAmplitude: number;
    edgeFlowEnabled: boolean;
    edgeFlowSpeed: number;
    autoRotateEnabled: boolean;
    autoRotateSpeed: number;
    postprocessingEnabled: boolean;
    bloomEnabled: boolean;
    bloomStrength: number;
    bloomRadius: number;
    bloomThreshold: number;
    vignetteEnabled: boolean;
    vignetteDarkness: number;
    vignetteOffset: number;
    colorGradeEnabled: boolean;
    colorGradeIntensity: number;
    backgroundIntensity: number;
    fogEnabled: boolean;
    fogColor: string;
    fogNear: number;
    fogFar: number;
  };
  animation: {
    focusDuration: number;
    transitionDuration: number;
    easing: string;
    hoverScale: number;
    selectedScale: number;
    selectionPulseScale: number;
    selectionPulseDuration: number;
    hoverCardFadeDuration: number;
    hoverCardSlideDistance: number;
    enableCameraTween: boolean;
    enableHoverScale: boolean;
    enableSelectionPulse: boolean;
    enableSelectionRipple: boolean;
  };
}

export interface NeuronWebThemeOverride {
  colors?: Partial<NeuronWebTheme['colors']>;
  typography?: Partial<NeuronWebTheme['typography']>;
  effects?: Partial<NeuronWebTheme['effects']>;
  animation?: Partial<NeuronWebTheme['animation']>;
}

export type NeuronLayoutMode = 'auto' | 'positioned' | 'fuzzy' | 'atlas' | 'tree';

export interface TreeLayoutOptions {
  /** Horizontal spacing between sibling nodes (default: 3) */
  horizontalSpacing?: number;
  /** Vertical spacing between parent/child levels (default: 4) */
  verticalSpacing?: number;
  /** Root node ID or slug (if not specified, nodes with no incoming edges are roots) */
  rootNodeId?: string;
  /** Direction the tree grows: 'down'/'up' for vertical, 'left'/'right' for horizontal (default: 'down') */
  direction?: 'down' | 'up' | 'left' | 'right';
  /**
   * When true, reverses edge interpretation: edge.from becomes child and edge.to becomes parent.
   * Use this if your edges point from child to parent (e.g., "derives from" relationships).
   * Default: false (edges point from parent to child)
   */
  reverseEdgeDirection?: boolean;
}

export interface NeuronLayoutOptions {
  mode?: NeuronLayoutMode;
  radius?: number;
  insightRadius?: number;
  jitter?: number;
  zSpread?: number;
  seed?: string;
  spread?: number;
  overrides?: Record<string, [number, number, number]>;
  /** Tree layout specific options (used when mode is 'tree') */
  tree?: TreeLayoutOptions;
}

export type DensityMode = 'relaxed' | 'balanced' | 'compact';

export interface DensityOptions {
  mode?: DensityMode;
  spread?: number;
  edgeFade?: number;
  minEdgeStrength?: number;
  focusExpansion?: number;
  labelMaxCount?: number;
  labelDistance?: number;
  labelVisibility?: 'auto' | 'interaction' | 'none';
}

export interface HoverCardOptions {
  enabled?: boolean;
  width?: number;
  offset?: [number, number];
  showTags?: boolean;
  showMetrics?: boolean;
  maxSummaryLength?: number;
}

export interface ClickCardOptions {
  enabled?: boolean;
  width?: number;
  offset?: [number, number];
}

export interface ClickZoomOptions {
  enabled?: boolean;
  /**
   * Fixed distance from the focused node (camera stays this far away).
   * If omitted, focus preserves the current camera distance.
   */
  distance?: number;
  /**
   * Fixed offset added to the focused node position (e.g. [0, 2, 8]).
   * Overrides distance when provided.
   */
  offset?: [number, number, number];
}

export type CardsMode = 'none' | 'hover' | 'click' | 'both';

export interface CameraFitOptions {
  /** Enable auto-fitting camera to node bounds */
  enabled?: boolean;
  /** Apply once on mount or whenever node positions change */
  mode?: 'once' | 'onChange';
  /** Fraction of viewport the graph should occupy (0-1). 0.33 ~= center third. */
  viewportFraction?: number;
  /** Extra padding applied to bounds (0.1 = 10%) */
  padding?: number;
}

export type RenderingPreset = 'minimal' | 'subtle' | 'cinematic';

export type AnimationProfile = 'off' | 'minimal' | 'subtle' | 'cinematic';

export type NodeRenderMode = 'sprite' | 'mesh';

export type EdgeRenderMode = 'straight' | 'curved';

export type NumberMappingCurve = 'linear' | 'sqrt' | 'log';

export interface NumberMappingRule<TField extends string = string> {
  /** Use a constant value (simple mode). */
  value?: number;
  /** Map from a known numeric field (advanced mode). */
  fromField?: TField;
  /** Input range for mapping (defaults depend on field). */
  inputMin?: number;
  inputMax?: number;
  /** Output range for mapping (required for fromField mapping). */
  outputMin?: number;
  outputMax?: number;
  /** Clamp mapped value into [outputMin,outputMax]. Defaults to true when output range is set. */
  clamp?: boolean;
  /** Optional mapping curve. Defaults to linear. */
  curve?: NumberMappingCurve;
}

export type NodeStyleNumberField = 'connectionCount';
export type EdgeStyleNumberField = 'strength';

export type NodeNumberMappingRule = NumberMappingRule<NodeStyleNumberField>;
export type EdgeNumberMappingRule = NumberMappingRule<EdgeStyleNumberField>;

export interface NodeStyle {
  /** CSS-like color string (hex/rgb/rgba). */
  color?: string;
  /** Multiplier applied to the base node scale. */
  scale?: number;
  /** 0..1 opacity multiplier for the node material. */
  opacity?: number;
}

export interface EdgeStyle {
  /** CSS-like color string (hex/rgb/rgba). */
  color?: string;
  /** 0..1 opacity multiplier for the edge material. */
  opacity?: number;
  /** Intended edge width in pixels or world units (implementation-defined). */
  width?: number;
  /** Optional dashed styling (implementation-defined). */
  dashed?: boolean;
}

export type NodeStyleResolver = (node: NeuronVisualNode) => NodeStyle;
export type EdgeStyleResolver = (edge: NeuronVisualEdge) => EdgeStyle;

export interface NodeStyleOptions {
  mode?: NodeRenderMode;
  /** Size mapping rule (tier scaling remains the default when omitted). */
  size?: NodeNumberMappingRule;
  opacity?: NodeNumberMappingRule;
  glow?: {
    enabled?: boolean;
    intensity?: number;
  };
  hover?: {
    scale?: number;
  };
  selection?: {
    scale?: number;
    highlightColor?: string;
  };
}

export interface EdgeStyleOptions {
  mode?: EdgeRenderMode;
  opacity?: EdgeNumberMappingRule;
  width?: EdgeNumberMappingRule;
  arrows?: {
    enabled?: boolean;
    scale?: number;
  };
  flow?: {
    enabled?: boolean;
    speed?: number;
    /** Animation mode. Defaults to 'pulse' to preserve existing behavior. */
    mode?: 'pulse' | 'dash';
    /** Dash size when flow.mode is 'dash' (world-units; best-effort). */
    dashSize?: number;
    /** Gap size when flow.mode is 'dash' (world-units; best-effort). */
    gapSize?: number;
  };
  curve?: {
    tension?: number;
    segments?: number;
  };
}

export type LabelTierVisibility = 'always' | 'auto' | 'none';
export type LabelTierRules = Partial<Record<NodeTier, LabelTierVisibility>>;

export interface LabelOptions {
  visibility?: 'auto' | 'interaction' | 'none';
  maxCount?: number;
  distance?: number;
  tiers?: LabelTierRules;
  transitions?: {
    enabled?: boolean;
    durationMs?: number;
  };
}

export interface AnimationOptions {
  profile?: AnimationProfile;
  enableCameraTween?: boolean;
  focusDurationMs?: number;
  transitionDurationMs?: number;
  easing?: 'linear' | 'easeInOut' | 'easeOut';
}

export interface RenderingPerformanceOptions {
  /** Upper bound for normal-mode auto selection (exclusive). */
  normalMaxNodes?: number;
  /** Upper bound for degraded-mode auto selection (exclusive). */
  degradedMaxNodes?: number;
}

export interface RenderingOptions {
  preset?: RenderingPreset;
  nodes?: NodeStyleOptions;
  edges?: EdgeStyleOptions;
  labels?: LabelOptions;
  animations?: AnimationOptions;
  performance?: RenderingPerformanceOptions;
  resolvers?: {
    getNodeStyle?: NodeStyleResolver;
    getEdgeStyle?: EdgeStyleResolver;
  };
}

export interface NeuronWebProps {
  graphData: {
    nodes: NeuronVisualNode[];
    edges: NeuronVisualEdge[];
    storyBeats?: NeuronStoryBeat[];
    /** Static cluster definitions for visual grouping */
    clusters?: NeuronVisualCluster[];
  };
  fullHeight?: boolean;
  isFullScreen?: boolean;
  className?: string;
  style?: React.CSSProperties;
  isLoading?: boolean;
  error?: string | null;
  selectedNode?: NeuronNode | null;
  /** Programmatically focus/select a node by slug (or id fallback). */
  focusNodeSlug?: string | null;
  /** Called after a focusNodeSlug request is processed. */
  onFocusConsumed?: () => void;
  /** Limit the rendered graph to these node slugs/ids; null shows all, empty array shows none. */
  visibleNodeSlugs?: string[] | null;
  onNodeClick?: (node: NeuronNode) => void;
  onNodeDoubleClick?: (node: NeuronNode) => void;
  onNodeHover?: (node: NeuronNode | null) => void;
  onNodeFocused?: (node: NeuronNode) => void;
  onEdgeClick?: (edge: NeuronEdge) => void;
  onBackgroundClick?: () => void;
  onCameraChange?: (position: [number, number, number]) => void;
  /**
   * Enable node dragging for manual arrangement.
   * Use Shift+click to drag nodes (regular click still works for selection/pan).
   * - `true` or `{ enabled: true }`: Enable dragging, constrain to XY plane
   * - `{ enabled: true, constrainToPlane: 'xy' | 'xz' | 'yz' }`: Constrain to specific plane
   */
  draggable?: boolean | { enabled: boolean; constrainToPlane?: 'xy' | 'xz' | 'yz' };
  /** Called continuously while a node is being dragged. */
  onNodeDrag?: (node: NeuronNode, position: [number, number, number]) => void;
  /** Called when a node drag operation completes. */
  onNodeDragEnd?: (node: NeuronNode, position: [number, number, number]) => void;
  /**
   * Enable keyboard controls for camera movement:
   * - WASD: Pan camera
   * - Q/E: Zoom in/out
   * This frees the mouse for node interaction.
   */
  keyboardControls?: boolean | {
    enabled: boolean;
    /** Pan speed multiplier (default: 1) */
    panSpeed?: number;
    /** Zoom speed multiplier (default: 1) */
    zoomSpeed?: number;
  };
  /** When set, plays a story beat by id using the built-in study path player. */
  activeStoryBeatId?: string | null;
  /** Optional override for story beat step duration (ms). */
  storyBeatStepDurationMs?: number;
  /** Called when a story beat playback completes. */
  onStoryBeatComplete?: (beat: NeuronStoryBeat) => void;
  studyPathRequest?: StudyPathRequest | null;
  onStudyPathComplete?: () => void;
  layout?: NeuronLayoutOptions;
  cameraFit?: CameraFitOptions;
  cardsMode?: CardsMode;
  clickCard?: ClickCardOptions;
  clickZoom?: ClickZoomOptions;
  theme?: NeuronWebThemeOverride;
  domainColors?: Record<string, string>;
  renderNodeHover?: (node: NeuronVisualNode) => React.ReactNode;
  hoverCard?: HoverCardOptions;
  hoverCardSlots?: {
    header?: (node: NeuronVisualNode) => React.ReactNode;
    summary?: (node: NeuronVisualNode) => React.ReactNode;
    tags?: (node: NeuronVisualNode) => React.ReactNode;
    metrics?: (node: NeuronVisualNode) => React.ReactNode;
    footer?: (node: NeuronVisualNode) => React.ReactNode;
  };
  renderNodeDetail?: (node: NeuronNode) => React.ReactNode;
  renderEmptyState?: () => React.ReactNode;
  renderLoadingState?: () => React.ReactNode;
  performanceMode?: 'auto' | 'normal' | 'degraded' | 'fallback';
  /** Rendering depth options (styles, mapping, animation presets). Additive; defaults preserve current behavior. */
  rendering?: RenderingOptions;
  /** Controls spacing and declutter behavior for dense graphs. */
  density?: DensityOptions;
  ariaLabel?: string;
}

export interface NeuronWebExplorerFilters {
  domains?: string[];
  nodeTypes?: string[];
  relationshipTypes?: string[];
  minEdgeStrength?: number;
}

export type NeuronWebExplorerResolvedFilters = {
  domains: string[];
  nodeTypes: string[];
  relationshipTypes: string[];
  minEdgeStrength?: number;
};

export interface NeuronWebExplorerProps {
  /** Optional: provide graph data directly (controlled/headless mode). */
  graphData?: NeuronWebProps['graphData'];

  /** Optional: initial filter state (uncontrolled mode). */
  initialFilters?: NeuronWebExplorerFilters;

  /** Optional: controlled filter state. */
  filters?: NeuronWebExplorerFilters;
  onFiltersChange?: (next: NeuronWebExplorerFilters) => void;

  /** Selection wiring */
  selectedNodeId?: string | null;
  onSelectedNodeIdChange?: (id: string | null) => void;

  /** Forwarded to NeuronWeb (graphData is always provided by the explorer). */
  neuronWebProps?: Omit<Partial<NeuronWebProps>, 'graphData'>;

  /** Layout/styling hooks */
  className?: string;
  style?: React.CSSProperties;

  /** Slot-based UI customization */
  renderToolbar?: (ctx: {
    query: string;
    setQuery: (q: string) => void;
    filters: NeuronWebExplorerResolvedFilters;
    setFilters: (f: NeuronWebExplorerFilters) => void;
    isSearching: boolean;
    selectedNodeId: string | null;
    setSelectedNodeId: (id: string | null) => void;
    selectedNode: NeuronVisualNode | null;
    focusNodeSlug: string | null;
    setFocusNodeSlug: (slug: string | null) => void;
  }) => React.ReactNode;

  renderLegend?: (ctx: { filters: NeuronWebExplorerResolvedFilters }) => React.ReactNode;
  renderSelectionPanel?: (ctx: { selectedNode: NeuronVisualNode | null }) => React.ReactNode;
  renderEmptyState?: () => React.ReactNode;
  renderLoadingState?: () => React.ReactNode;
}
