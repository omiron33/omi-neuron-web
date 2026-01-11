import { describe, it, expect } from 'vitest';
import { getAutoPerformanceMode } from '../../src/visualization/performance/auto-performance-mode';
import { resolveDensityOptions } from '../../src/visualization/density/resolve-density';
import { applyExplorerFilters, normalizeExplorerFilters } from '../../src/visualization/explorer/explorer-filters';

describe('deterministic behaviors', () => {
  describe('auto performance mode', () => {
    it('selects normal/degraded/fallback with default thresholds', () => {
      expect(getAutoPerformanceMode({ nodeCount: 180, pixelRatio: 1 })).toBe('normal');
      expect(getAutoPerformanceMode({ nodeCount: 181, pixelRatio: 1 })).toBe('degraded');
      expect(getAutoPerformanceMode({ nodeCount: 360, pixelRatio: 1 })).toBe('degraded');
      expect(getAutoPerformanceMode({ nodeCount: 361, pixelRatio: 1 })).toBe('fallback');
    });

    it('accounts for device pixel ratio', () => {
      // 180 nodes on a high-DPI display should degrade earlier due to effective count scaling.
      expect(getAutoPerformanceMode({ nodeCount: 180, pixelRatio: 2, pixelRatioCap: 2 })).toBe('degraded');
    });
  });

  describe('density mapping', () => {
    it('defaults density + label policy by performance mode', () => {
      expect(resolveDensityOptions(undefined, 'normal')).toMatchObject({
        mode: 'balanced',
        edgeFade: 0.35,
        minEdgeStrength: 0.05,
        labelVisibility: 'auto',
      });

      expect(resolveDensityOptions(undefined, 'degraded')).toMatchObject({
        mode: 'compact',
        edgeFade: 0.5,
        minEdgeStrength: 0.15,
        labelVisibility: 'interaction',
      });

      expect(resolveDensityOptions(undefined, 'fallback')).toMatchObject({
        mode: 'compact',
        labelVisibility: 'none',
      });
    });

    it('clamps edge declutter knobs into [0..1]', () => {
      const resolved = resolveDensityOptions({ edgeFade: 2, minEdgeStrength: -1 }, 'normal');
      expect(resolved.edgeFade).toBe(1);
      expect(resolved.minEdgeStrength).toBe(0);
    });
  });

  describe('explorer filtering', () => {
    const graphData = {
      nodes: [
        { id: 'n1', slug: 'n1', label: 'Alpha', domain: 'core', metadata: {}, connectionCount: 1 },
        { id: 'n2', slug: 'n2', label: 'Beta', domain: 'core', metadata: {}, connectionCount: 2 },
        { id: 'n3', slug: 'n3', label: 'Gamma', domain: 'insight', metadata: {}, connectionCount: 3 },
      ],
      edges: [
        { id: 'e1', from: 'n1', to: 'n2', relationshipType: 'related_to', strength: 0.4 },
        { id: 'e2', from: 'n2', to: 'n3', relationshipType: 'supports', strength: 0.9 },
      ],
      storyBeats: [
        { id: 'beat-1', label: 'Core pair', nodeIds: ['n1', 'n2'] },
        { id: 'beat-2', label: 'Cross', nodeIds: ['n2', 'n3'] },
      ],
    };

    it('filters induced subgraph by domain and edge strength/type', () => {
      const filters = normalizeExplorerFilters({
        domains: ['core'],
        relationshipTypes: ['supports'],
        minEdgeStrength: 0.5,
      });

      const filtered = applyExplorerFilters(graphData, filters, '');

      expect(filtered.nodes.map((n) => n.id)).toEqual(['n1', 'n2']);
      expect(filtered.edges).toEqual([]);
      expect(filtered.storyBeats).toEqual([{ id: 'beat-1', label: 'Core pair', nodeIds: ['n1', 'n2'] }]);
    });

    it('filters nodes by query against label/slug (case-insensitive)', () => {
      const filters = normalizeExplorerFilters();
      const filtered = applyExplorerFilters(graphData, filters, 'ALP');
      expect(filtered.nodes.map((n) => n.id)).toEqual(['n1']);
      expect(filtered.edges).toEqual([]);
      expect(filtered.storyBeats).toEqual([]);
    });
  });
});

