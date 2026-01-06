import { useMemo, useState } from 'react';
import type { NeuronWebTheme, NeuronWebThemeOverride } from '../types';
import { ThemeEngine } from '../themes/theme-engine';

export function useNeuronTheme(initialTheme?: NeuronWebThemeOverride) {
  const [theme, setThemeState] = useState<NeuronWebTheme>(() =>
    new ThemeEngine(initialTheme).getTheme()
  );

  const engine = useMemo(() => {
    const engineInstance = new ThemeEngine(initialTheme);
    engineInstance.onThemeChange = (nextTheme) => setThemeState({ ...nextTheme });
    return engineInstance;
  }, []);

  return {
    theme,
    setTheme: (next: Partial<NeuronWebTheme>) => engine.setTheme(next),
    setDomainColor: (domain: string, color: string) => engine.setDomainColor(domain, color),
    applyPreset: (preset: 'dark' | 'light' | 'custom') => engine.applyPreset(preset),
    resetTheme: () => engine.resetTheme(),
  };
}
