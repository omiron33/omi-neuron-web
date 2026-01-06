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
  fullHeight,
  isFullScreen,
  isLoading,
  error,
  renderEmptyState,
  renderLoadingState,
  ariaLabel,
  theme,
  layout,
  cameraFit,
  cardsMode,
  clickCard,
  clickZoom,
  renderNodeHover,
  renderNodeDetail,
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
  const clickCardRef = useRef<HTMLDivElement>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const fitStateRef = useRef<{ hasFit: boolean; signature: string }>({ hasFit: false, signature: '' });

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
    cameraFov: 52,
    cameraPosition: [4, 8, 20],
    cameraTarget: [0, 0, 0],
    minZoom: 4,
    maxZoom: 42,
    enableStarfield: resolvedTheme.effects.starfieldEnabled,
    starfieldCount: resolvedPerformanceMode === 'normal' ? 1200 : 700,
    starfieldColor: resolvedTheme.effects.starfieldColor,
    pixelRatioCap: 2,
    ambientLightIntensity: 0.9,
    keyLightIntensity: 0.6,
    fillLightIntensity: 0.4,
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
      baseScale: 1.15,
      tierScales: {
        primary: 1.25,
        secondary: 1.1,
        tertiary: 0.95,
        insight: 1.05,
      },
      glowIntensity: resolvedTheme.effects.glowEnabled ? resolvedTheme.effects.glowIntensity : 0,
      labelDistance: resolvedPerformanceMode === 'normal' ? 26 : 0,
      maxVisibleLabels: resolvedPerformanceMode === 'normal' ? 80 : 0,
      labelOffset: [0, 0.65, 0],
      labelFontFamily: resolvedTheme.typography.labelFontFamily,
      labelFontSize: resolvedTheme.typography.labelFontSize,
      labelFontWeight: resolvedTheme.typography.labelFontWeight,
      labelTextColor: resolvedTheme.colors.labelText,
      labelBackground: resolvedTheme.colors.labelBackground,
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
      baseOpacity: 0.45,
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

  const resolvedCameraFit = useMemo(() => {
    const enabled = cameraFit?.enabled ?? Boolean(isFullScreen);
    return {
      enabled,
      mode: cameraFit?.mode ?? 'once',
      viewportFraction: cameraFit?.viewportFraction ?? 0.33,
      padding: cameraFit?.padding ?? 0.15,
    };
  }, [cameraFit, isFullScreen]);

  const fitSignature = useMemo(
    () =>
      resolvedNodes
        .map((node) => `${node.id}:${node.position ? node.position.map((v) => v.toFixed(3)).join(',') : ''}`)
        .join('|'),
    [resolvedNodes]
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
    (cardsMode ? (cardsMode === 'hover' || cardsMode === 'both') : (hoverCard?.enabled ?? true)) &&
    resolvedPerformanceMode !== 'fallback';
  const hoverCardOffset = hoverCard?.offset ?? [18, 18];
  const hoverCardWidth = hoverCard?.width ?? 240;
  const clickCardEnabled =
    (cardsMode ? (cardsMode === 'click' || cardsMode === 'both') : (clickCard?.enabled ?? false)) &&
    resolvedPerformanceMode !== 'fallback';
  const clickCardOffset = clickCard?.offset ?? [24, 24];
  const clickCardWidth = clickCard?.width ?? 320;
  const clickZoomEnabled = clickZoom?.enabled ?? true;

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
    if (!sceneManager || !animationController || !resolvedCameraFit.enabled) return;

    const mode = resolvedCameraFit.mode;
    if (mode === 'once' && fitStateRef.current.hasFit) return;
    if (mode === 'onChange' && fitStateRef.current.signature === fitSignature) return;

    const positions = resolvedNodes
      .map((node) => node.position)
      .filter((pos): pos is [number, number, number] => Array.isArray(pos));
    if (!positions.length) return;

    const points = positions.map((pos) => new THREE.Vector3(...pos));
    const bounds = new THREE.Box3().setFromPoints(points);
    const sphere = new THREE.Sphere();
    bounds.getBoundingSphere(sphere);

    const radius = Math.max(sphere.radius, 0.001);
    const padding = resolvedCameraFit.padding;
    const viewportFraction = Math.min(Math.max(resolvedCameraFit.viewportFraction, 0.05), 1);

    const camera = sceneManager.camera as THREE.PerspectiveCamera;
    const vFov = THREE.MathUtils.degToRad(camera.fov);
    const aspect = camera.aspect || 1;
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * aspect);
    const targetFov = Math.min(vFov, hFov);
    const distance = (radius * (1 + padding)) / Math.tan((targetFov * viewportFraction) / 2);

    const direction = camera.position.clone().sub(sceneManager.controls.target);
    if (direction.lengthSq() < 0.0001) {
      direction.set(0, 0, 1);
    }
    direction.normalize();

    const targetPosition = sphere.center.clone().add(direction.multiplyScalar(distance));
    animationController.focusOnPosition(targetPosition, sphere.center.clone());

    fitStateRef.current = { hasFit: true, signature: fitSignature };
  }, [sceneManager, animationController, resolvedCameraFit, resolvedNodes, fitSignature]);

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
      nodeRenderer.updateLabelVisibility(sceneManager.camera);
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
      if (clickCardRef.current && selectedNodeId) {
        const position = nodeRenderer.getNodePosition(selectedNodeId);
        const rect = containerRef.current?.getBoundingClientRect();
        if (position && rect) {
          const screen = sceneManager.worldToScreen(position);
          const cardWidth = clickCardRef.current.offsetWidth;
          const cardHeight = clickCardRef.current.offsetHeight;
          const rawX = screen.x - rect.left + clickCardOffset[0];
          const rawY = screen.y - rect.top + clickCardOffset[1];
          const maxX = Math.max(8, rect.width - cardWidth - 8);
          const maxY = Math.max(8, rect.height - cardHeight - 8);
          const x = Math.min(Math.max(rawX, 8), maxX);
          const y = Math.min(Math.max(rawY, 8), maxY);
          clickCardRef.current.style.transform = `translate(${x}px, ${y}px)`;
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
    selectedNodeId,
    clickCardOffset,
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
      if (clickZoomEnabled) {
        const nodePosition = nodeRenderer.getNodePosition(node.id);
        if (nodePosition) {
          animationController?.focusOnNode(nodePosition, () => {
            if (onNodeFocused) onNodeFocused(node as unknown as NeuronNode);
          });
        }
      }
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
    clickZoomEnabled,
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

  const resolvedStyle: React.CSSProperties = {
    position: isFullScreen ? 'fixed' : 'relative',
    inset: isFullScreen ? 0 : undefined,
    width: isFullScreen ? '100vw' : '100%',
    height: isFullScreen ? '100vh' : '100%',
    minHeight: !isFullScreen && fullHeight ? '100vh' : undefined,
    overflow: 'hidden',
    background: resolvedTheme.colors.background,
    ...style,
  };

  return (
    <div
      className={className}
      style={resolvedStyle}
      aria-label={ariaLabel}
    >
      <div
        ref={containerRef}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      />
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
      {clickCardEnabled && selectedNodeId && (
        <div
          ref={clickCardRef}
          style={{
            position: 'absolute',
            width: clickCardWidth,
            pointerEvents: 'auto',
            padding: '14px 16px',
            borderRadius: 14,
            background:
              'linear-gradient(140deg, rgba(10, 14, 32, 0.98) 0%, rgba(20, 26, 58, 0.94) 100%)',
            border: '1px solid rgba(140, 170, 255, 0.4)',
            boxShadow: '0 22px 60px rgba(5, 10, 30, 0.6)',
            color: resolvedTheme.colors.labelText,
            fontFamily: resolvedTheme.typography.labelFontFamily,
            fontSize: 13,
            zIndex: 5,
            opacity: 0.98,
            transition: `opacity ${resolvedTheme.animation.hoverCardFadeDuration}ms ease`,
            transform: `translate(${clickCardOffset[0]}px, ${clickCardOffset[1]}px)`,
          }}
        >
          {renderNodeDetail ? (
            renderNodeDetail(nodeMap.get(selectedNodeId) as unknown as NeuronNode)
          ) : (
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                {nodeMap.get(selectedNodeId)?.label ?? 'Selected node'}
              </div>
              <div style={{ opacity: 0.75 }}>
                {typeof nodeMap.get(selectedNodeId)?.metadata?.summary === 'string'
                  ? (nodeMap.get(selectedNodeId)?.metadata?.summary as string)
                  : 'Click another node to explore more details.'}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
