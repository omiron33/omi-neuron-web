'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import type { NeuronWebProps } from './types';
import type { NeuronNode } from '../core/types';
import { DEFAULT_THEME } from './constants';
import { useSceneManager } from './hooks/useSceneManager';
import { NodeRenderer } from './scene/node-renderer';
import { EdgeRenderer } from './scene/edge-renderer';
import { applyFuzzyLayout } from './layouts/fuzzy-layout';
import { InteractionManager } from './interactions/interaction-manager';
import { AnimationController } from './animations/animation-controller';

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
  layout,
  renderNodeHover,
  hoverCard,
  onNodeHover,
  onNodeClick,
  onNodeDoubleClick,
  onNodeFocused,
  onBackgroundClick,
  performanceMode,
}: NeuronWebProps): React.ReactElement {
  const containerRef = useRef<HTMLDivElement>(null);
  const hoverCardRef = useRef<HTMLDivElement>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const resolvedTheme = useMemo(
    () => ({
      ...DEFAULT_THEME,
      colors: { ...DEFAULT_THEME.colors, ...(theme?.colors ?? {}) },
      typography: { ...DEFAULT_THEME.typography, ...(theme?.typography ?? {}) },
      effects: { ...DEFAULT_THEME.effects, ...(theme?.effects ?? {}) },
      animation: { ...DEFAULT_THEME.animation, ...(theme?.animation ?? {}) },
    }),
    [theme]
  );

  const resolvedPerformanceMode = useMemo(() => {
    if (performanceMode && performanceMode !== 'auto') return performanceMode;
    const count = graphData.nodes.length;
    if (count > 360) return 'fallback';
    if (count > 180) return 'degraded';
    return 'normal';
  }, [performanceMode, graphData.nodes.length]);

  const sceneManager = useSceneManager(containerRef, {
    backgroundColor: resolvedTheme.colors.background,
    cameraPosition: [4, 8, 20],
    cameraTarget: [0, 0, 0],
    minZoom: 4,
    maxZoom: 42,
    enableStarfield: resolvedTheme.effects.starfieldEnabled,
    starfieldCount: 1200,
    starfieldColor: resolvedTheme.effects.starfieldColor,
    pixelRatioCap: 2,
    ambientLightIntensity: 0.7,
    keyLightIntensity: 1.1,
    fillLightIntensity: 0.6,
    fogEnabled: resolvedTheme.effects.fogEnabled,
    fogColor: resolvedTheme.effects.fogColor,
    fogNear: resolvedTheme.effects.fogNear,
    fogFar: resolvedTheme.effects.fogFar,
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
      glowIntensity: resolvedTheme.effects.glowEnabled ? resolvedTheme.effects.glowIntensity : 0,
      labelDistance: 20,
      maxVisibleLabels: 50,
      ambientMotionEnabled:
        resolvedTheme.effects.ambientMotionEnabled && resolvedPerformanceMode === 'normal',
      ambientMotionAmplitude: resolvedTheme.effects.ambientMotionAmplitude,
      ambientMotionSpeed: resolvedTheme.effects.ambientMotionSpeed,
      hoverScale: resolvedTheme.animation.hoverScale,
      selectedScale: resolvedTheme.animation.selectedScale,
      pulseScale: resolvedTheme.animation.selectionPulseScale,
      pulseDuration: resolvedTheme.animation.selectionPulseDuration / 1000,
    });
  }, [sceneManager, resolvedTheme, resolvedPerformanceMode]);

  const edgeRenderer = useMemo(() => {
    if (!sceneManager) return null;
    return new EdgeRenderer(sceneManager.scene, {
      defaultColor: resolvedTheme.colors.edgeDefault,
      activeColor: resolvedTheme.colors.edgeActive,
      selectedColor: resolvedTheme.colors.edgeSelected,
      baseOpacity: 0.5,
      strengthOpacityScale: true,
      edgeFlowEnabled:
        resolvedTheme.effects.edgeFlowEnabled && resolvedPerformanceMode === 'normal',
      edgeFlowSpeed: resolvedTheme.effects.edgeFlowSpeed,
    });
  }, [sceneManager, resolvedTheme, resolvedPerformanceMode]);

  const interactionManager = useMemo(() => {
    if (!sceneManager) return null;
    return new InteractionManager(sceneManager.scene, sceneManager.camera, sceneManager.renderer, {
      enableHover: true,
      enableClick: true,
      enableDoubleClick: true,
      hoverDelay: Math.max(40, resolvedTheme.animation.hoverCardFadeDuration * 0.6),
      doubleClickDelay: 280,
    });
  }, [sceneManager, resolvedTheme.animation.hoverCardFadeDuration]);

  const animationController = useMemo(() => {
    if (!sceneManager) return null;
    return new AnimationController(sceneManager.camera, sceneManager.controls, {
      focusDuration: resolvedTheme.animation.focusDuration,
      transitionDuration: resolvedTheme.animation.transitionDuration,
      easing: resolvedTheme.animation.easing as 'linear' | 'easeInOut' | 'easeOut',
    });
  }, [sceneManager, resolvedTheme]);

  const resolvedNodes = useMemo(
    () => applyFuzzyLayout(graphData.nodes, layout),
    [graphData.nodes, layout]
  );

  const nodeMap = useMemo(
    () => new Map(resolvedNodes.map((node) => [node.id, node])),
    [resolvedNodes]
  );

  const nodeSlugById = useMemo(() => {
    const map = new Map<string, string>();
    resolvedNodes.forEach((node) => map.set(node.id, node.slug));
    return map;
  }, [resolvedNodes]);

  const edgesBySlug = useMemo(() => {
    const map = new Map<string, string[]>();
    graphData.edges.forEach((edge) => {
      const add = (slug: string) => {
        const list = map.get(slug);
        if (list) list.push(edge.id);
        else map.set(slug, [edge.id]);
      };
      add(edge.from);
      add(edge.to);
    });
    return map;
  }, [graphData.edges]);

  const hoveredNode = hoveredNodeId ? nodeMap.get(hoveredNodeId) ?? null : null;
  const hoverCardEnabled =
    (hoverCard?.enabled ?? true) && resolvedPerformanceMode !== 'fallback';
  const hoverCardOffset = hoverCard?.offset ?? [18, 18];
  const hoverCardWidth = hoverCard?.width ?? 240;

  useEffect(() => {
    if (!sceneManager || !nodeRenderer || !edgeRenderer) return;
    nodeRenderer.renderNodes(resolvedNodes);
    const positions = new Map<string, THREE.Vector3>();
    resolvedNodes.forEach((node) => {
      if (!node.position) return;
      positions.set(node.slug, new THREE.Vector3(...node.position));
    });
    edgeRenderer.renderEdges(graphData.edges, positions);
  }, [resolvedNodes, graphData.edges, sceneManager, nodeRenderer, edgeRenderer]);

  useEffect(() => {
    if (!sceneManager) return;
    sceneManager.updateBackground(resolvedTheme.colors.background);
  }, [sceneManager, resolvedTheme.colors.background]);

  useEffect(() => {
    if (!sceneManager) return;
    sceneManager.controls.enableDamping = true;
    sceneManager.controls.dampingFactor = 0.08;
  }, [sceneManager]);

  useEffect(() => {
    if (!sceneManager) return;
    sceneManager.renderer.domElement.style.cursor = hoveredNodeId ? 'pointer' : 'grab';
  }, [sceneManager, hoveredNodeId]);

  useEffect(() => {
    if (!sceneManager || !nodeRenderer || !edgeRenderer) return;
    return sceneManager.addFrameListener((delta, elapsed) => {
      nodeRenderer.update(delta, elapsed);
      edgeRenderer.update(delta, elapsed);
      animationController?.update();
      if (hoverCardRef.current && hoveredNodeId) {
        const position = nodeRenderer.getNodePosition(hoveredNodeId);
        const rect = containerRef.current?.getBoundingClientRect();
        if (position && rect) {
          const screen = sceneManager.worldToScreen(position);
          const cardWidth = hoverCardRef.current.offsetWidth;
          const cardHeight = hoverCardRef.current.offsetHeight;
          const rawX = screen.x - rect.left + hoverCardOffset[0];
          const rawY = screen.y - rect.top + hoverCardOffset[1];
          const maxX = Math.max(8, rect.width - cardWidth - 8);
          const maxY = Math.max(8, rect.height - cardHeight - 8);
          const x = Math.min(Math.max(rawX, 8), maxX);
          const y = Math.min(Math.max(rawY, 8), maxY);
          hoverCardRef.current.style.transform = `translate(${x}px, ${y}px)`;
        }
      }
    });
  }, [
    sceneManager,
    nodeRenderer,
    edgeRenderer,
    animationController,
    hoveredNodeId,
    hoverCardOffset,
  ]);

  useEffect(() => {
    if (!interactionManager || !nodeRenderer) return;
    interactionManager.setTargets(nodeRenderer.getNodeObjects(), nodeMap);
  }, [interactionManager, nodeRenderer, nodeMap]);

  useEffect(() => {
    if (!interactionManager || !nodeRenderer || !edgeRenderer) return;
    interactionManager.onNodeHover = (node) => {
      const nodeId = node?.id ?? null;
      setHoveredNodeId(nodeId);
      nodeRenderer.setHoveredNode(nodeId);
      if (nodeId) {
        const slug = nodeSlugById.get(nodeId);
        edgeRenderer.setFocusEdges(slug ? edgesBySlug.get(slug) ?? [] : []);
      } else {
        const selectedSlug = selectedNodeId ? nodeSlugById.get(selectedNodeId) : null;
        if (selectedSlug) {
          edgeRenderer.setFocusEdges(edgesBySlug.get(selectedSlug) ?? []);
        } else {
          edgeRenderer.setFocusEdges(null);
        }
      }
      if (onNodeHover) {
        onNodeHover(node ? (node as unknown as NeuronNode) : null);
      }
    };
    interactionManager.onNodeClick = (node) => {
      setSelectedNodeId(node.id);
      nodeRenderer.setSelectedNode(node.id);
      nodeRenderer.pulseNode(node.id);
      const slug = nodeSlugById.get(node.id);
      edgeRenderer.setFocusEdges(slug ? edgesBySlug.get(slug) ?? [] : []);
      if (onNodeClick) {
        onNodeClick(node as unknown as NeuronNode);
      }
    };
    interactionManager.onNodeDoubleClick = (node) => {
      const nodePosition = nodeRenderer.getNodePosition(node.id);
      if (nodePosition) {
        animationController?.focusOnNode(nodePosition, () => {
          if (onNodeFocused) onNodeFocused(node as unknown as NeuronNode);
        });
      }
      if (onNodeDoubleClick) {
        onNodeDoubleClick(node as unknown as NeuronNode);
      }
    };
    interactionManager.onBackgroundClick = () => {
      setSelectedNodeId(null);
      nodeRenderer.setSelectedNode(null);
      if (!hoveredNodeId) {
        edgeRenderer.setFocusEdges(null);
      }
      if (onBackgroundClick) onBackgroundClick();
    };
  }, [
    interactionManager,
    nodeRenderer,
    edgeRenderer,
    nodeSlugById,
    edgesBySlug,
    animationController,
    hoveredNodeId,
    selectedNodeId,
    onNodeHover,
    onNodeClick,
    onNodeDoubleClick,
    onNodeFocused,
    onBackgroundClick,
  ]);

  useEffect(() => {
    if (!sceneManager || !interactionManager) return;
    const element = sceneManager.renderer.domElement;
    const handleMove = (event: PointerEvent) => interactionManager.onPointerMove(event);
    const handleUp = (event: PointerEvent) => interactionManager.onPointerUp(event);
    const handleLeave = () => interactionManager.onPointerLeave();
    element.addEventListener('pointermove', handleMove);
    element.addEventListener('pointerup', handleUp);
    element.addEventListener('pointerleave', handleLeave);
    return () => {
      element.removeEventListener('pointermove', handleMove);
      element.removeEventListener('pointerup', handleUp);
      element.removeEventListener('pointerleave', handleLeave);
    };
  }, [sceneManager, interactionManager]);

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

  if (!resolvedNodes.length) {
    return (
      <div className={className} style={style} aria-label={ariaLabel}>
        {renderEmptyState ? renderEmptyState() : <div>No data</div>}
      </div>
    );
  }

  return (
    <div
      className={className}
      style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', ...style }}
      aria-label={ariaLabel}
    >
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      {hoverCardEnabled && hoveredNode && (
        <div
          ref={hoverCardRef}
          style={{
            position: 'absolute',
            width: hoverCardWidth,
            pointerEvents: 'none',
            padding: '12px 14px',
            borderRadius: 12,
            background:
              'linear-gradient(135deg, rgba(11, 15, 35, 0.95) 0%, rgba(20, 24, 52, 0.9) 100%)',
            border: '1px solid rgba(120, 140, 255, 0.35)',
            boxShadow: '0 18px 45px rgba(5, 10, 30, 0.55)',
            color: resolvedTheme.colors.labelText,
            fontFamily: resolvedTheme.typography.labelFontFamily,
            fontSize: 12,
            zIndex: 4,
            opacity: 0.98,
            transition: `opacity ${resolvedTheme.animation.hoverCardFadeDuration}ms ease`,
            transform: `translate(${hoverCardOffset[0]}px, ${hoverCardOffset[1]}px)`,
          }}
        >
          {renderNodeHover ? (
            renderNodeHover(hoveredNode)
          ) : (
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                {hoveredNode.label}
              </div>
              <div style={{ opacity: 0.75 }}>
                {typeof hoveredNode.metadata?.summary === 'string'
                  ? hoveredNode.metadata.summary
                  : 'Click to focus this node and explore connections.'}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
