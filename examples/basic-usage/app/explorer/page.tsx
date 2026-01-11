'use client';

import React, { useMemo, useState } from 'react';
import {
  DEFAULT_RENDERING_OPTIONS,
  NeuronWebExplorer,
  type NeuronWebExplorerFilters,
  type RenderingOptions,
  type RenderingPreset,
} from '@omiron33/omi-neuron-web/visualization';

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

const DEFAULT_COUNT = 120;
const MAX_COUNT = 800;
const MIN_COUNT = 12;

const DOMAINS = ['core', 'signal', 'memory', 'pattern', 'insight', 'atlas'] as const;
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
        tags: [domain, tier].filter(Boolean),
      },
      connectionCount: 0,
    };
  });

  const edges: GraphEdge[] = [];
  const used = new Set<string>();
  const targetEdges = Math.max(Math.floor(count * 1.9), count + 12);

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
      relationshipType: rand() > 0.82 ? 'supports' : 'related_to',
      strength: 0.18 + rand() * 0.82,
      label: rand() > 0.9 ? 'Reference' : undefined,
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

const presetDefaults: Record<RenderingPreset, RenderingOptions> = {
  minimal: {
    preset: 'minimal',
    nodes: { mode: 'sprite' },
    edges: { mode: 'straight', arrows: { enabled: false }, flow: { enabled: false } },
    labels: { transitions: { enabled: false } },
  },
  subtle: {
    preset: 'subtle',
    nodes: { mode: 'sprite' },
    edges: { mode: 'straight', arrows: { enabled: false }, flow: { enabled: true, mode: 'pulse', speed: 1.1 } },
    labels: { tiers: { insight: 'always', primary: 'always' }, transitions: { enabled: true, durationMs: 160 } },
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
    labels: { tiers: { insight: 'always', primary: 'always' }, transitions: { enabled: true, durationMs: 180 } },
  },
};

export default function ExplorerDemoPage({
  searchParams,
}: {
  searchParams?: {
    count?: string;
    preset?: string;
  };
}) {
  const count = parseCount(searchParams?.count);
  const initialPreset =
    (parseEnum(searchParams?.preset, ['minimal', 'subtle', 'cinematic']) ?? 'subtle') as RenderingPreset;

  const { nodes, edges } = useMemo(() => buildGraph(count), [count]);

  const [preset, setPreset] = useState<RenderingPreset>(initialPreset);
  const [performanceMode, setPerformanceMode] = useState<'auto' | 'normal' | 'degraded' | 'fallback'>('auto');
  const [densityMode, setDensityMode] = useState<'relaxed' | 'balanced' | 'compact'>('balanced');

  const storyBeats = useMemo(() => {
    const intro = ['node-1', 'node-5', 'node-9', 'node-12'].filter((id) => nodes.some((node) => node.id === id));
    const insightIds = nodes
      .filter((node) => node.tier === 'insight' || node.domain === 'insight')
      .slice(0, 4)
      .map((node) => node.id);

    const beats = [
      {
        id: 'beat-1',
        label: 'Intro sweep',
        nodeIds: intro.length ? intro : nodes.slice(0, 4).map((n) => n.id),
      },
    ];
    if (insightIds.length) {
      beats.push({ id: 'beat-insights', label: 'Insight sweep', nodeIds: insightIds });
    }
    return beats;
  }, [nodes]);

  const domainCounts = useMemo(() => {
    const counts = new Map<string, number>();
    nodes.forEach((node) => counts.set(node.domain, (counts.get(node.domain) ?? 0) + 1));
    return Array.from(counts.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [nodes]);

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
          maxWidth: 360,
          boxShadow: '0 16px 38px rgba(0,0,0,0.45)',
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: 6 }}>NeuronWebExplorer demo</div>
        <div>nodes: {count}</div>
        <div>preset: {preset}</div>
        <div>performanceMode: {performanceMode}</div>
        <div>density: {densityMode}</div>
        <div style={{ opacity: 0.8, marginTop: 8, lineHeight: 1.4 }}>
          Tip: labels default to <span style={{ fontWeight: 600 }}>interaction</span> in degraded mode and{' '}
          <span style={{ fontWeight: 600 }}>none</span> in fallback.
        </div>
      </div>

      <NeuronWebExplorer
        graphData={{ nodes, edges, storyBeats }}
        initialFilters={{ domains: [], relationshipTypes: [], minEdgeStrength: 0 }}
        neuronWebProps={{
          fullHeight: true,
          layout: { mode: 'fuzzy', seed: 'explorer-demo' },
          performanceMode,
          density: { mode: densityMode },
          rendering: { ...DEFAULT_RENDERING_OPTIONS, ...presetDefaults[preset] },
          hoverCard: { showTags: true, showMetrics: true, maxSummaryLength: 120 },
        }}
        renderToolbar={({ query, setQuery, filters, setFilters }) => {
          const toggleDomain = (domain: string) => {
            const next = new Set(filters.domains);
            if (next.has(domain)) next.delete(domain);
            else next.add(domain);
            setFilters({ ...filters, domains: Array.from(next) });
          };

          const toggleRelationshipType = (type: string) => {
            const next = new Set(filters.relationshipTypes);
            if (next.has(type)) next.delete(type);
            else next.add(type);
            setFilters({ ...filters, relationshipTypes: Array.from(next) });
          };

          const setMinEdgeStrength = (nextValue: number) => {
            const next: NeuronWebExplorerFilters = { ...filters, minEdgeStrength: nextValue };
            setFilters(next);
          };

          return (
            <div
              className="neuron-explorer__toolbar"
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr',
                gap: 10,
                padding: 12,
                borderRadius: 14,
                border: '1px solid rgba(255,255,255,0.12)',
                background: 'rgba(5, 6, 31, 0.72)',
                color: '#ffffff',
                fontFamily: 'system-ui, sans-serif',
              }}
            >
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <input
                  aria-label="Search nodes"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search label/slug…"
                  style={{
                    flex: 1,
                    minWidth: 220,
                    padding: '10px 12px',
                    borderRadius: 10,
                    border: '1px solid rgba(255,255,255,0.14)',
                    background: 'rgba(255,255,255,0.06)',
                    color: 'inherit',
                  }}
                />
                <select
                  aria-label="Rendering preset"
                  value={preset}
                  onChange={(e) => setPreset(e.target.value as RenderingPreset)}
                  style={{
                    padding: '10px 10px',
                    borderRadius: 10,
                    border: '1px solid rgba(255,255,255,0.14)',
                    background: 'rgba(255,255,255,0.06)',
                    color: 'inherit',
                  }}
                >
                  {(['minimal', 'subtle', 'cinematic'] as const).map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
                <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 12, opacity: 0.85 }}>performance</span>
                  <select
                    aria-label="Performance mode"
                    value={performanceMode}
                    onChange={(e) =>
                      setPerformanceMode(e.target.value as 'auto' | 'normal' | 'degraded' | 'fallback')
                    }
                    style={{
                      padding: '8px 10px',
                      borderRadius: 10,
                      border: '1px solid rgba(255,255,255,0.14)',
                      background: 'rgba(255,255,255,0.06)',
                      color: 'inherit',
                    }}
                  >
                    {(['auto', 'normal', 'degraded', 'fallback'] as const).map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </label>

                <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 12, opacity: 0.85 }}>density</span>
                  <select
                    aria-label="Density preset"
                    value={densityMode}
                    onChange={(e) => setDensityMode(e.target.value as 'relaxed' | 'balanced' | 'compact')}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 10,
                      border: '1px solid rgba(255,255,255,0.14)',
                      background: 'rgba(255,255,255,0.06)',
                      color: 'inherit',
                    }}
                  >
                    {(['relaxed', 'balanced', 'compact'] as const).map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </label>

                <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 12, opacity: 0.85 }}>min edge</span>
                  <input
                    aria-label="Minimum edge strength"
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={filters.minEdgeStrength ?? 0}
                    onChange={(e) => setMinEdgeStrength(Number(e.target.value))}
                  />
                  <span style={{ fontSize: 12, opacity: 0.9 }}>
                    {(filters.minEdgeStrength ?? 0).toFixed(2)}
                  </span>
                </label>
              </div>

              <div style={{ display: 'grid', gap: 8 }}>
                <div style={{ fontSize: 12, opacity: 0.85 }}>domains</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {DOMAINS.map((domain) => {
                    const checked = filters.domains.includes(domain);
                    return (
                      <label
                        key={domain}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '6px 8px',
                          borderRadius: 999,
                          border: '1px solid rgba(255,255,255,0.12)',
                          background: checked ? 'rgba(176, 140, 255, 0.22)' : 'rgba(255,255,255,0.06)',
                          cursor: 'pointer',
                          userSelect: 'none',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleDomain(domain)}
                          aria-label={`Toggle domain ${domain}`}
                        />
                        <span style={{ fontSize: 12 }}>{domain}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'grid', gap: 8 }}>
                <div style={{ fontSize: 12, opacity: 0.85 }}>relationship types</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {(['related_to', 'supports'] as const).map((type) => {
                    const checked = filters.relationshipTypes.includes(type);
                    return (
                      <label
                        key={type}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '6px 8px',
                          borderRadius: 999,
                          border: '1px solid rgba(255,255,255,0.12)',
                          background: checked ? 'rgba(198, 212, 255, 0.2)' : 'rgba(255,255,255,0.06)',
                          cursor: 'pointer',
                          userSelect: 'none',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleRelationshipType(type)}
                          aria-label={`Toggle relationship type ${type}`}
                        />
                        <span style={{ fontSize: 12 }}>{type}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    setFilters({ domains: [], relationshipTypes: [], minEdgeStrength: 0 });
                  }}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 10,
                    border: '1px solid rgba(255,255,255,0.14)',
                    background: 'rgba(255,255,255,0.08)',
                    color: 'inherit',
                    cursor: 'pointer',
                  }}
                >
                  Clear filters
                </button>
                <div style={{ fontSize: 12, opacity: 0.8 }}>
                  tiers: {TIERS.join(' / ')}
                </div>
              </div>
            </div>
          );
        }}
        renderLegend={() => {
          return (
            <div
              style={{
                padding: 12,
                borderRadius: 14,
                border: '1px solid rgba(255,255,255,0.12)',
                background: 'rgba(5, 6, 31, 0.72)',
                color: '#ffffff',
                fontFamily: 'system-ui, sans-serif',
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: 8 }}>Legend</div>
              <div style={{ fontSize: 12, opacity: 0.85, marginBottom: 6 }}>Domains</div>
              <div style={{ display: 'grid', gap: 4 }}>
                {domainCounts.map(([domain, count]) => (
                  <div key={domain} style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                    <span>{domain}</span>
                    <span style={{ opacity: 0.75 }}>{count}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        }}
        renderSelectionPanel={({ selectedNode }) => {
          return (
            <div
              style={{
                padding: 12,
                borderRadius: 14,
                border: '1px solid rgba(255,255,255,0.12)',
                background: 'rgba(5, 6, 31, 0.72)',
                color: '#ffffff',
                fontFamily: 'system-ui, sans-serif',
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: 8 }}>Selection</div>
              {selectedNode ? (
                <div style={{ display: 'grid', gap: 6 }}>
                  <div style={{ fontSize: 13 }}>{selectedNode.label}</div>
                  <div style={{ fontSize: 12, opacity: 0.8 }}>{selectedNode.slug}</div>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', opacity: 0.85 }}>
                    <span>domain: {selectedNode.domain}</span>
                    <span>connections: {selectedNode.connectionCount}</span>
                  </div>
                  {(() => {
                    const summary = selectedNode.metadata['summary'];
                    if (typeof summary !== 'string') return null;
                    return (
                      <div style={{ fontSize: 12, opacity: 0.8, lineHeight: 1.4 }}>
                        {summary}
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div style={{ fontSize: 12, opacity: 0.8 }}>Click a node to see details.</div>
              )}
            </div>
          );
        }}
      />
    </div>
  );
}
