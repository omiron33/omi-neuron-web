/**
 * Visualization exports for omi-neuron-web
 */

// Main component
export { NeuronWeb } from './NeuronWeb';

// Scene management
export { SceneManager } from './scene/scene-manager';

// Themes
export { ThemeEngine } from './themes/theme-engine';
export { DEFAULT_THEME, DEFAULT_RENDERING_OPTIONS } from './constants';

// Types
export type { NeuronVisualNode, NeuronVisualEdge } from '../core/types';
export type {
  NeuronWebProps,
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

// Layout helpers
export { applyFuzzyLayout } from './layouts/fuzzy-layout';
