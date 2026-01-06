import type React from 'react';
import type { NeuronVisualEdge, NeuronVisualNode, NeuronNode, NeuronEdge } from '../core/types';

export interface NeuronStoryBeat {
  id: string;
  label: string;
  nodeIds: string[];
}

export interface StudyPathRequest {
  fromNodeId: string;
  toNodeId: string;
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

export type NeuronLayoutMode = 'auto' | 'positioned' | 'fuzzy';

export interface NeuronLayoutOptions {
  mode?: NeuronLayoutMode;
  radius?: number;
  jitter?: number;
  zSpread?: number;
  seed?: string;
  spread?: number;
}

export interface HoverCardOptions {
  enabled?: boolean;
  width?: number;
  offset?: [number, number];
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
  focusNodeSlug?: string | null;
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
