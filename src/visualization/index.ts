/**
 * Visualization exports for omi-neuron-web
 */

// Main component
export { NeuronWeb } from './NeuronWeb';
export { NeuronWebExplorer } from './explorer/NeuronWebExplorer';

// Scene management
export { SceneManager } from './scene/scene-manager';

// Themes
export { ThemeEngine } from './themes/theme-engine';
export { DEFAULT_THEME, DEFAULT_RENDERING_OPTIONS } from './constants';

// Performance helpers
export { getAutoPerformanceMode } from './performance/auto-performance-mode';
export type { AutoPerformanceMode, AutoPerformanceModeOptions } from './performance/auto-performance-mode';

// Types
export type { NeuronVisualNode, NeuronVisualEdge } from '../core/types';
export type {
  NeuronWebProps,
  NeuronWebExplorerProps,
  NeuronWebExplorerFilters,
  NeuronWebExplorerResolvedFilters,
  NeuronStoryBeat,
  StudyPathRequest,
  StudyPathStep,
  NeuronWebTheme,
  NeuronWebThemeOverride,
  NeuronLayoutOptions,
  NeuronLayoutMode,
  DensityOptions,
  DensityMode,
  HoverCardOptions,
  CameraFitOptions,
  ClickCardOptions,
  ClickZoomOptions,
  CardsMode,
  RenderingOptions,
  RenderingPreset,
  AnimationProfile,
  AnimationOptions,
  LabelOptions,
  LabelTierRules,
  LabelTierVisibility,
  NodeRenderMode,
  EdgeRenderMode,
  NodeStyleOptions,
  EdgeStyleOptions,
  NodeStyle,
  EdgeStyle,
  NodeStyleResolver,
  EdgeStyleResolver,
} from './types';

// Story tooling helpers
export {
  validateStoryBeat,
  normalizeStoryBeat,
  createStoryBeat,
  createStudyPathFromNodeIds,
  createStudyPathFromBeat,
} from './story';

// Layout helpers
export { applyFuzzyLayout } from './layouts/fuzzy-layout';
