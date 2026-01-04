import type { NeuronWebTheme } from './types';

export const DEFAULT_THEME: NeuronWebTheme = {
  colors: {
    background: '#020314',
    domainColors: {},
    defaultDomainColor: '#c0c5ff',
    edgeDefault: '#4d4d55',
    edgeActive: '#c6d4ff',
    edgeSelected: '#ffffff',
    labelText: '#ffffff',
    labelBackground: 'rgba(0, 0, 0, 0.8)',
  },
  typography: {
    labelFontFamily: 'system-ui, sans-serif',
    labelFontSize: 12,
    labelFontWeight: '500',
  },
  effects: {
    starfieldEnabled: true,
    starfieldColor: '#ffffff',
    glowEnabled: true,
    glowIntensity: 0.6,
  },
  animation: {
    focusDuration: 800,
    transitionDuration: 650,
    easing: 'easeInOut',
  },
};
