'use client';

import { NeuronWeb } from '@omiron33/omi-neuron-web/visualization';

type GraphNodeTier = 'primary' | 'secondary' | 'tertiary' | 'insight';

type GraphNode = {
  id: string;
  slug: string;
  label: string;
  domain: string;
  tier?: GraphNodeTier;
  metadata: Record<string, unknown>;
  connectionCount: number;
};

type GraphEdge = {
  id: string;
  from: string;
  to: string;
  relationshipType: string;
  strength: number;
  label?: string;
};

const DEFAULT_COUNT = 50;
const MAX_COUNT = 800;
const MIN_COUNT = 12;

const DOMAINS = ['core', 'signal', 'memory', 'pattern', 'insight', 'atlas'];
const TIERS: GraphNodeTier[] = ['primary', 'secondary', 'tertiary', 'insight'];

function mulberry32(seed: number) {
  let t = seed;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), t | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function pickTier(index: number): GraphNodeTier {
  if (index % 29 === 0) return 'primary';
  if (index % 13 === 0) return 'insight';
  if (index % 5 === 0) return 'secondary';
  return 'tertiary';
}

function buildGraph(count: number): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const rand = mulberry32(count * 97 + 23);
  const nodes: GraphNode[] = Array.from({ length: count }, (_, index) => {
    const id = `node-${index + 1}`;
    const domain = DOMAINS[index % DOMAINS.length];
    const tier = pickTier(index);
    return {
      id,
      slug: id,
      label: `Node ${index + 1}`,
      domain,
      tier,
      metadata: {
        summary: `Synthetic summary for ${domain} node ${index + 1}.`,
      },
      connectionCount: 0,
    };
  });

  const edges: GraphEdge[] = [];
  const used = new Set<string>();
  const targetEdges = Math.max(Math.floor(count * 1.6), count + 8);

  while (edges.length < targetEdges) {
    const fromIndex = Math.floor(rand() * count);
    let toIndex = Math.floor(rand() * count);
    if (toIndex === fromIndex) {
      toIndex = (toIndex + 1) % count;
    }
    const from = nodes[fromIndex];
    const to = nodes[toIndex];
    const key = fromIndex < toIndex ? `${from.slug}:${to.slug}` : `${to.slug}:${from.slug}`;
    if (used.has(key)) continue;
    used.add(key);
    edges.push({
      id: `edge-${edges.length + 1}`,
      from: from.slug,
      to: to.slug,
      relationshipType: 'related_to',
      strength: 0.25 + rand() * 0.7,
      label: rand() > 0.88 ? 'Reference' : undefined,
    });
  }

  edges.forEach((edge) => {
    const fromNode = nodes.find((node) => node.slug === edge.from);
    const toNode = nodes.find((node) => node.slug === edge.to);
    if (fromNode) fromNode.connectionCount += 1;
    if (toNode) toNode.connectionCount += 1;
  });

  return { nodes, edges };
}

function parseCount(value?: string): number {
  if (!value) return DEFAULT_COUNT;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return DEFAULT_COUNT;
  return Math.min(Math.max(parsed, MIN_COUNT), MAX_COUNT);
}

function parseEnum<T extends string>(value: string | undefined, options: readonly T[]): T | undefined {
  if (!value) return undefined;
  const match = options.find((option) => option === value);
  return match;
}

function parseBool(value: string | undefined, fallback: boolean): boolean {
  if (!value) return fallback;
  if (value === '1' || value === 'true' || value === 'yes') return true;
  if (value === '0' || value === 'false' || value === 'no') return false;
  return fallback;
}

export default function Page({
  searchParams,
}: {
  searchParams?: {
    count?: string;
    perf?: string;
    density?: string;
    cards?: string;
    effects?: string;
  };
}) {
  const count = parseCount(searchParams?.count);
  const performanceMode = parseEnum(searchParams?.perf, [
    'auto',
    'normal',
    'degraded',
    'fallback',
  ]);
  const densityMode = parseEnum(searchParams?.density, ['relaxed', 'balanced', 'compact']);
  const cardsMode = parseEnum(searchParams?.cards, ['hover', 'click', 'both', 'none']);
  const effectsEnabled = parseBool(searchParams?.effects, true);
  const { nodes, edges } = buildGraph(count);

  return (
    <NeuronWeb
      graphData={{ nodes, edges }}
      layout={{ mode: 'fuzzy', seed: 'baseline' }}
      density={{ mode: densityMode }}
      cardsMode={cardsMode}
      performanceMode={performanceMode}
      hoverCard={{ showTags: true, showMetrics: true, maxSummaryLength: 120 }}
      theme={
        effectsEnabled
          ? undefined
          : {
              effects: {
                postprocessingEnabled: false,
                bloomEnabled: false,
                vignetteEnabled: false,
                colorGradeEnabled: false,
                ambientMotionEnabled: false,
                edgeFlowEnabled: false,
              },
            }
      }
      fullHeight
    />
  );
}
