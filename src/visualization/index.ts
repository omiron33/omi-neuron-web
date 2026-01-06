/**
 * Visualization exports for omi-neuron-web
 */

// Main component
export { NeuronWeb } from './NeuronWeb';

// Scene management
export { SceneManager } from './scene/scene-manager';

// Themes
export { ThemeEngine } from './themes/theme-engine';
export { DEFAULT_THEME } from './constants';

// Types
export type { NeuronVisualNode, NeuronVisualEdge } from '../core/types';
export type {
  NeuronWebProps,
  NeuronWebTheme,
  NeuronWebThemeOverride,
  NeuronLayoutOptions,
  NeuronLayoutMode,
  HoverCardOptions,
  CameraFitOptions,
} from './types';

// Layout helpers
export { applyFuzzyLayout } from './layouts/fuzzy-layout';
