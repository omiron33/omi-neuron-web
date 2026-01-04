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
  };
  animation: {
    focusDuration: number;
    transitionDuration: number;
    easing: string;
  };
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
  theme?: Partial<NeuronWebTheme>;
  domainColors?: Record<string, string>;
  renderNodeDetail?: (node: NeuronNode) => React.ReactNode;
  renderEmptyState?: () => React.ReactNode;
  renderLoadingState?: () => React.ReactNode;
  performanceMode?: 'auto' | 'normal' | 'degraded' | 'fallback';
  ariaLabel?: string;
}
