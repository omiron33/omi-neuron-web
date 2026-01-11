export type AutoPerformanceMode = 'normal' | 'degraded' | 'fallback';

export interface AutoPerformanceModeOptions {
  nodeCount: number;
  pixelRatio?: number;
  pixelRatioCap?: number;
  normalMaxNodes?: number;
  degradedMaxNodes?: number;
}

export function getAutoPerformanceMode(options: AutoPerformanceModeOptions): AutoPerformanceMode {
  const nodeCountRaw = typeof options.nodeCount === 'number' && Number.isFinite(options.nodeCount) ? options.nodeCount : 0;
  const nodeCount = Math.max(0, Math.floor(nodeCountRaw));

  const pixelRatioRaw =
    typeof options.pixelRatio === 'number' && Number.isFinite(options.pixelRatio) ? options.pixelRatio : 1;
  const pixelRatioCapRaw =
    typeof options.pixelRatioCap === 'number' && Number.isFinite(options.pixelRatioCap) ? options.pixelRatioCap : 2;
  const pixelRatioCap = Math.max(0, pixelRatioCapRaw);
  const pixelRatio = Math.min(Math.max(0, pixelRatioRaw), pixelRatioCap || pixelRatioRaw);

  const normalMaxRaw =
    typeof options.normalMaxNodes === 'number' && Number.isFinite(options.normalMaxNodes)
      ? options.normalMaxNodes
      : 180;
  const degradedMaxRaw =
    typeof options.degradedMaxNodes === 'number' && Number.isFinite(options.degradedMaxNodes)
      ? options.degradedMaxNodes
      : 360;

  let normalMaxNodes = Math.max(1, Math.floor(normalMaxRaw));
  let degradedMaxNodes = Math.max(normalMaxNodes + 1, Math.floor(degradedMaxRaw));

  // Guard against weird inversions from custom config.
  if (degradedMaxNodes <= normalMaxNodes) {
    degradedMaxNodes = normalMaxNodes + 1;
  }

  const effectiveCount = nodeCount * Math.sqrt(pixelRatio || 1);

  if (effectiveCount > degradedMaxNodes) return 'fallback';
  if (effectiveCount > normalMaxNodes) return 'degraded';
  return 'normal';
}

