import { DEFAULT_THEME } from '../constants';
import type { NeuronWebTheme, NeuronWebThemeOverride } from '../types';

export class ThemeEngine {
  private theme: NeuronWebTheme;
  onThemeChange: (theme: NeuronWebTheme) => void = () => {};

  constructor(initialTheme?: NeuronWebThemeOverride) {
    this.theme = this.mergeTheme(DEFAULT_THEME, initialTheme);
  }

  getTheme(): NeuronWebTheme {
    return this.theme;
  }

  setTheme(theme: NeuronWebThemeOverride): void {
    this.theme = this.mergeTheme(this.theme, theme);
    this.onThemeChange(this.theme);
  }

  resetTheme(): void {
    this.theme = { ...DEFAULT_THEME };
    this.onThemeChange(this.theme);
  }

  setDomainColor(domain: string, color: string): void {
    this.theme.colors.domainColors[domain] = color;
    this.onThemeChange(this.theme);
  }

  setBackground(color: string): void {
    this.theme.colors.background = color;
    this.onThemeChange(this.theme);
  }

  setLabelStyle(style: Partial<NeuronWebTheme['typography']>): void {
    this.theme.typography = { ...this.theme.typography, ...style };
    this.onThemeChange(this.theme);
  }

  applyPreset(preset: 'dark' | 'light' | 'custom'): void {
    if (preset === 'light') {
      this.theme = this.mergeTheme(DEFAULT_THEME, {
        colors: { background: '#f7f7fb', labelText: '#111' },
      });
    } else if (preset === 'dark') {
      this.theme = { ...DEFAULT_THEME };
    }
    this.onThemeChange(this.theme);
  }

  saveToStorage(): void {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('omi-neuron-theme', JSON.stringify(this.theme));
  }

  loadFromStorage(): void {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem('omi-neuron-theme');
    if (stored) {
      this.theme = this.mergeTheme(this.theme, JSON.parse(stored) as NeuronWebTheme);
    }
  }

  private mergeTheme(base: NeuronWebTheme, next?: NeuronWebThemeOverride): NeuronWebTheme {
    if (!next) return { ...base };
    return {
      ...base,
      ...next,
      colors: { ...base.colors, ...(next.colors ?? {}) },
      typography: { ...base.typography, ...(next.typography ?? {}) },
      effects: { ...base.effects, ...(next.effects ?? {}) },
      animation: { ...base.animation, ...(next.animation ?? {}) },
    } as NeuronWebTheme;
  }
}
