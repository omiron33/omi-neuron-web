'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { NeuronWebProps } from './types';
import { DEFAULT_THEME } from './constants';
import { useSceneManager } from './hooks/useSceneManager';
import { NodeRenderer } from './scene/node-renderer';
import { EdgeRenderer } from './scene/edge-renderer';

export function NeuronWeb({
  graphData,
  className,
  style,
  isLoading,
  error,
  renderEmptyState,
  renderLoadingState,
  ariaLabel,
  theme,
}: NeuronWebProps): React.ReactElement {
  const containerRef = useRef<HTMLDivElement>(null);
  const resolvedTheme = { ...DEFAULT_THEME, ...theme };

  const sceneManager = useSceneManager(containerRef, {
    backgroundColor: resolvedTheme.colors.background,
    cameraPosition: [4, 8, 20],
    cameraTarget: [0, 0, 0],
    minZoom: 4,
    maxZoom: 42,
    enableStarfield: resolvedTheme.effects.starfieldEnabled,
    starfieldCount: 1200,
    pixelRatioCap: 2,
  });

  const nodeRenderer = useMemo(() => {
    if (!sceneManager) return null;
    return new NodeRenderer(sceneManager.scene, {
      domainColors: resolvedTheme.colors.domainColors,
      defaultColor: resolvedTheme.colors.defaultDomainColor,
      baseScale: 0.4,
      tierScales: {
        primary: 1.6,
        secondary: 1.2,
        tertiary: 1,
        insight: 1,
      },
      glowIntensity: resolvedTheme.effects.glowIntensity,
      labelDistance: 20,
      maxVisibleLabels: 50,
    });
  }, [sceneManager]);

  const edgeRenderer = useMemo(() => {
    if (!sceneManager) return null;
    return new EdgeRenderer(sceneManager.scene, {
      defaultColor: resolvedTheme.colors.edgeDefault,
      activeColor: resolvedTheme.colors.edgeActive,
      selectedColor: resolvedTheme.colors.edgeSelected,
      baseOpacity: 0.5,
      strengthOpacityScale: true,
    });
  }, [sceneManager]);

  useEffect(() => {
    if (!sceneManager || !nodeRenderer || !edgeRenderer) return;
    nodeRenderer.renderNodes(graphData.nodes);
    const positions = new Map<string, THREE.Vector3>();
    graphData.nodes.forEach((node) => {
      if (!node.position) return;
      positions.set(node.slug, new THREE.Vector3(...node.position));
    });
    edgeRenderer.renderEdges(graphData.edges, positions);
  }, [graphData, sceneManager, nodeRenderer, edgeRenderer]);

  if (isLoading) {
    return (
      <div className={className} style={style} aria-label={ariaLabel}>
        {renderLoadingState ? renderLoadingState() : <div>Loading…</div>}
      </div>
    );
  }

  if (error) {
    return (
      <div className={className} style={style} aria-label={ariaLabel}>
        {renderEmptyState ? renderEmptyState() : <div>{error}</div>}
      </div>
    );
  }

  if (!graphData.nodes.length) {
    return (
      <div className={className} style={style} aria-label={ariaLabel}>
        {renderEmptyState ? renderEmptyState() : <div>No data</div>}
      </div>
    );
  }

  return <div ref={containerRef} className={className} style={style} aria-label={ariaLabel} />;
}
