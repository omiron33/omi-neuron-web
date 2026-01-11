import type { DensityMode, DensityOptions } from '../types';

export type ResolvedDensityOptions = {
  mode: DensityMode;
  spread: number;
  edgeFade: number;
  minEdgeStrength: number;
  focusExpansion: number;
  labelMaxCount?: number;
  labelDistance?: number;
  labelVisibility: NonNullable<DensityOptions['labelVisibility']>;
};

export function resolveDensityOptions(
  density: DensityOptions | undefined,
  performanceMode: 'normal' | 'degraded' | 'fallback'
): ResolvedDensityOptions {
  const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
  const presets: Record<DensityMode, Omit<ResolvedDensityOptions, 'mode' | 'labelMaxCount' | 'labelDistance' | 'labelVisibility'>> = {
    relaxed: { spread: 1.2, edgeFade: 0.2, focusExpansion: 0.18, minEdgeStrength: 0 },
    balanced: { spread: 1.0, edgeFade: 0.35, focusExpansion: 0.12, minEdgeStrength: 0.05 },
    compact: { spread: 0.9, edgeFade: 0.5, focusExpansion: 0.08, minEdgeStrength: 0.15 },
  };

  const defaultMode: DensityMode =
    density?.mode ??
    (performanceMode === 'normal' ? 'balanced' : performanceMode === 'degraded' ? 'compact' : 'compact');
  const base = presets[defaultMode];

  const edgeFade = clamp01(density?.edgeFade ?? base.edgeFade);
  const minEdgeStrength = clamp01(density?.minEdgeStrength ?? base.minEdgeStrength);

  return {
    mode: defaultMode,
    spread: density?.spread ?? base.spread,
    edgeFade,
    minEdgeStrength,
    focusExpansion: density?.focusExpansion ?? base.focusExpansion,
    labelMaxCount: density?.labelMaxCount,
    labelDistance: density?.labelDistance,
    labelVisibility:
      density?.labelVisibility ??
      (performanceMode === 'normal' ? 'auto' : performanceMode === 'degraded' ? 'interaction' : 'none'),
  };
}

