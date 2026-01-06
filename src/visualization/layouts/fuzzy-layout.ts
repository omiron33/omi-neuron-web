import type { NeuronVisualNode } from '../../core/types';
import type { NeuronLayoutOptions } from '../types';

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
const ATLAS_POSITION_OVERRIDES: Record<string, [number, number, number]> = {
  uap: [6, 2, 2],
  ez1: [2, 4, 0],
  neph: [-3, 3, 2],
  jude6: [-1, 1.5, 2.5],
  '2p24': [1.2, 0.3, 2.6],
  aiimg: [4.6, -1.6, 1.8],
  rev13: [2.7, -2.8, 0.6],
  xhuman: [0.4, -3.4, -1.8],
  dan243: [-1.6, -2.1, -2.9],
  llm: [3.4, 0.3, -2.4],
  babel: [0.9, 1.4, -3.4],
  warfare: [-4.6, 0.4, -1.5],
  eph612: [-5.5, -1.7, 0.5],
  berea: [-0.2, 4.6, -1.3],
  pharm: [-3.1, -2.4, 1.2],
  testsp: [5.4, 3.2, 1.6],
};

function generateSpherePosition(index: number, total: number, radius: number): [number, number, number] {
  if (total <= 1) {
    return [0, 0, 0];
  }
  const offset = 2 / total;
  const increment = Math.PI * (3 - Math.sqrt(5));
  const y = 1 - index * offset;
  const r = Math.sqrt(Math.max(0, 1 - y * y));
  const phi = index * increment;
  return [Math.cos(phi) * r * radius, y * radius, Math.sin(phi) * r * radius];
}

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
  const mode = options.mode ?? 'atlas';
  if (mode === 'positioned') {
    return nodes;
  }

  const needsLayout = nodes.some((node) => !node.position);
  if (mode === 'auto' && !needsLayout) {
    return nodes;
  }

  const spread = options.spread ?? 1;
  const overrides = { ...ATLAS_POSITION_OVERRIDES, ...(options.overrides ?? {}) };

  if (mode === 'atlas' || mode === 'auto') {
    const baseRadius = (options.radius ?? 12) * spread;
    const insightRadius = (options.insightRadius ?? Math.max(5, baseRadius * 0.4)) * spread;
    const canonicalNodes = nodes.filter(
      (node) => node.tier !== 'insight' && node.domain !== 'insight'
    );
    const insightNodes = nodes.filter(
      (node) => node.tier === 'insight' || node.domain === 'insight'
    );
    const canonicalPositions = new Map<string, [number, number, number]>();
    const insightPositions = new Map<string, [number, number, number]>();
    canonicalNodes.forEach((node, index) => {
      canonicalPositions.set(
        node.id,
        generateSpherePosition(index, canonicalNodes.length, baseRadius)
      );
    });
    insightNodes.forEach((node, index) => {
      insightPositions.set(
        node.id,
        generateSpherePosition(index, insightNodes.length || 1, insightRadius)
      );
    });

    return nodes.map((node) => {
      const override = overrides[node.id] ?? overrides[node.slug];
      if (node.position && !override) {
        return node;
      }
      if (override) {
        return { ...node, position: [...override] as [number, number, number] };
      }
      const fallback =
        (node.tier === 'insight' || node.domain === 'insight'
          ? insightPositions.get(node.id)
          : canonicalPositions.get(node.id)) ?? [0, 0, 0];
      return { ...node, position: fallback };
    });
  }

  const baseSeed = options.seed ?? 'omi-neuron-web';
  const count = Math.max(nodes.length, 1);
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
