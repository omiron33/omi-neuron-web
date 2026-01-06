import type { NeuronVisualNode } from '../../core/types';
import type { NeuronLayoutOptions } from '../types';

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

function hashString(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed: number): () => number {
  let t = seed;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), t | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function buildSeed(baseSeed: string, nodeKey: string): () => number {
  return mulberry32(hashString(`${baseSeed}:${nodeKey}`));
}

export function applyFuzzyLayout(
  nodes: NeuronVisualNode[],
  options: NeuronLayoutOptions = {}
): NeuronVisualNode[] {
  const mode = options.mode ?? 'auto';
  if (mode === 'positioned') {
    return nodes;
  }

  const needsLayout = mode === 'fuzzy' || nodes.some((node) => !node.position);
  if (!needsLayout) {
    return nodes;
  }

  const baseSeed = options.seed ?? 'omi-neuron-web';
  const count = Math.max(nodes.length, 1);
  const spread = options.spread ?? 1.2;
  const baseRadius = (options.radius ?? Math.max(4, Math.sqrt(count) * 2.4)) * spread;
  const jitter = (options.jitter ?? baseRadius * 0.12) * spread;
  const zSpread = (options.zSpread ?? baseRadius * 0.6) * spread;

  return nodes.map((node, index) => {
    const shouldApply = mode === 'fuzzy' || !node.position;
    if (!shouldApply) {
      return node;
    }

    const nodeKey = node.slug || node.id || String(index);
    const rand = buildSeed(baseSeed, nodeKey);
    const angle = rand() * Math.PI * 2 + index * GOLDEN_ANGLE * 0.05;
    const radius = baseRadius * Math.sqrt(rand());
    const jitterOffset = (rand() - 0.5) * jitter;
    const r = Math.max(0.6, radius + jitterOffset);
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r;
    const z = (rand() - 0.5) * zSpread;

    return { ...node, position: [x, y, z] };
  });
}
