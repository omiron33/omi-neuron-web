'use client';

import { NeuronWeb, type RenderingOptions, type RenderingPreset } from '@omiron33/omi-neuron-web/visualization';

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

function parseOptionalBool(value: string | undefined): boolean | undefined {
  if (value === undefined) return undefined;
  if (value === '1' || value === 'true' || value === 'yes') return true;
  if (value === '0' || value === 'false' || value === 'no') return false;
  return undefined;
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
    preset?: string;
    resolver?: string;
    beat?: string;
    edges?: string;
    arrows?: string;
    flow?: string;
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
  const preset = (parseEnum(searchParams?.preset, ['minimal', 'subtle', 'cinematic']) ?? 'subtle') as RenderingPreset;
  const resolverEnabled = parseBool(searchParams?.resolver, false);
  const edgeMode = parseEnum(searchParams?.edges, ['straight', 'curved']);
  const arrowsEnabled = parseOptionalBool(searchParams?.arrows);
  const flowMode = parseEnum(searchParams?.flow, ['pulse', 'dash', 'off']);
  const { nodes, edges } = buildGraph(count);

  const storyBeats = (() => {
    const intro = ['node-1', 'node-5', 'node-9', 'node-12'].filter((id) =>
      nodes.some((node) => node.id === id)
    );
    const insightIds = nodes
      .filter((node) => node.tier === 'insight' || node.domain === 'insight')
      .slice(0, 4)
      .map((node) => node.id);

    const beats = [
      { id: 'beat-1', label: 'Intro sweep', nodeIds: intro.length ? intro : nodes.slice(0, 4).map((n) => n.id) },
    ];
    if (insightIds.length) {
      beats.push({ id: 'beat-insights', label: 'Insight sweep', nodeIds: insightIds });
    }
    return beats;
  })();

  const activeStoryBeatId =
    searchParams?.beat && searchParams.beat !== 'off' ? searchParams.beat : null;

  const presetDefaults: Record<RenderingPreset, RenderingOptions> = {
    minimal: {
      preset: 'minimal',
      nodes: { mode: 'sprite' },
      edges: {
        mode: 'straight',
        arrows: { enabled: false },
        flow: { enabled: false },
      },
      labels: { transitions: { enabled: false } },
    },
    subtle: {
      preset: 'subtle',
      nodes: { mode: 'sprite' },
      edges: {
        mode: 'straight',
        arrows: { enabled: false },
        flow: { enabled: true, mode: 'pulse', speed: 1.1 },
      },
      labels: {
        tiers: { insight: 'always', primary: 'always' },
        transitions: { enabled: true, durationMs: 160 },
      },
    },
    cinematic: {
      preset: 'cinematic',
      nodes: { mode: 'mesh' },
      edges: {
        mode: 'curved',
        arrows: { enabled: true, scale: 0.85 },
        flow: { enabled: true, mode: 'dash', speed: 1.4, dashSize: 0.7, gapSize: 0.45 },
        curve: { tension: 0.18, segments: 18 },
      },
      labels: {
        tiers: { insight: 'always', primary: 'always' },
        transitions: { enabled: true, durationMs: 200 },
      },
    },
  };

  const baseRendering = presetDefaults[preset];
  const resolvedEdgeMode = edgeMode ?? baseRendering.edges?.mode ?? 'straight';
  const resolvedArrowsEnabled = arrowsEnabled ?? Boolean(baseRendering.edges?.arrows?.enabled);

  const resolvedFlow = (() => {
    if (flowMode === 'off') return { enabled: false as const };
    if (flowMode === 'pulse' || flowMode === 'dash') {
      return { enabled: true as const, mode: flowMode, speed: 1.4, dashSize: 0.7, gapSize: 0.45 };
    }
    return baseRendering.edges?.flow;
  })();

  const rendering: RenderingOptions = {
    preset,
    nodes: baseRendering.nodes ?? { mode: 'sprite' },
    labels: baseRendering.labels,
    edges: {
      ...(baseRendering.edges ?? {}),
      mode: resolvedEdgeMode,
      arrows: resolvedArrowsEnabled ? { enabled: true, scale: 0.85 } : { enabled: false },
      flow: resolvedFlow,
      curve: resolvedEdgeMode === 'curved' ? { tension: 0.18, segments: 18 } : undefined,
    },
    resolvers: resolverEnabled
      ? {
          getNodeStyle: (node) =>
            node.tier === 'insight'
              ? { scale: 1.25, opacity: 1, color: '#b08cff' }
              : node.connectionCount > 10
                ? { scale: 1.1, opacity: 0.95 }
                : {},
          getEdgeStyle: (edge) =>
            edge.strength > 0.8 ? { opacity: 0.9, width: 1.4 } : edge.strength < 0.25 ? { opacity: 0.15 } : {},
        }
      : undefined,
  };

  return (
    <div style={{ position: 'relative', height: '100vh' }}>
      <div
        style={{
          position: 'absolute',
          top: 14,
          left: 14,
          zIndex: 10,
          pointerEvents: 'none',
          padding: '10px 12px',
          borderRadius: 12,
          border: '1px solid rgba(255, 255, 255, 0.14)',
          background: 'rgba(6, 7, 28, 0.72)',
          color: '#ffffff',
          fontFamily: 'system-ui, sans-serif',
          fontSize: 12,
          maxWidth: 320,
          boxShadow: '0 16px 38px rgba(0,0,0,0.45)',
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: 6 }}>omi-neuron-web rendering demos</div>
        <div>preset: {preset}</div>
        <div>performanceMode: {performanceMode ?? 'auto'}</div>
        <div>resolver demo: {resolverEnabled ? 'on' : 'off'}</div>
        <div>story beat: {activeStoryBeatId ?? 'off'}</div>
        <div style={{ opacity: 0.8, marginTop: 8, lineHeight: 1.4 }}>
          Tip: curved edges, arrows, edge flow, mesh nodes, and graph transitions are gated to
          <span style={{ fontWeight: 600 }}> normal</span> mode.
          Try: <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>
            ?preset=cinematic&amp;perf=normal
          </span>
        </div>
        <div style={{ opacity: 0.8, marginTop: 6, lineHeight: 1.4 }}>
          Story playback: <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>
            ?beat=beat-1
          </span>
        </div>
      </div>

      <NeuronWeb
        graphData={{ nodes, edges, storyBeats }}
        layout={{ mode: 'fuzzy', seed: 'baseline' }}
        density={{ mode: densityMode }}
        cardsMode={cardsMode}
        performanceMode={performanceMode}
        activeStoryBeatId={activeStoryBeatId}
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
        rendering={rendering}
        fullHeight
      />
    </div>
  );
}
