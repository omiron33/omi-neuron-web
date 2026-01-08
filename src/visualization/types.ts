import type React from 'react';
import type { NeuronVisualEdge, NeuronVisualNode, NeuronNode, NeuronEdge } from '../core/types';

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
  };
}

export interface NeuronWebThemeOverride {
  colors?: Partial<NeuronWebTheme['colors']>;
  typography?: Partial<NeuronWebTheme['typography']>;
  effects?: Partial<NeuronWebTheme['effects']>;
  animation?: Partial<NeuronWebTheme['animation']>;
}

export type NeuronLayoutMode = 'auto' | 'positioned' | 'fuzzy' | 'atlas';

export interface NeuronLayoutOptions {
  mode?: NeuronLayoutMode;
  radius?: number;
  insightRadius?: number;
  jitter?: number;
  zSpread?: number;
  seed?: string;
  spread?: number;
  overrides?: Record<string, [number, number, number]>;
}

export interface HoverCardOptions {
  enabled?: boolean;
  width?: number;
  offset?: [number, number];
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

export interface NeuronWebProps {
  graphData: {
    nodes: NeuronVisualNode[];
    edges: NeuronVisualEdge[];
    storyBeats?: NeuronStoryBeat[];
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
  renderNodeDetail?: (node: NeuronNode) => React.ReactNode;
  renderEmptyState?: () => React.ReactNode;
  renderLoadingState?: () => React.ReactNode;
  performanceMode?: 'auto' | 'normal' | 'degraded' | 'fallback';
  ariaLabel?: string;
}
