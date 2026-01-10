'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import type { NeuronStoryBeat, NeuronWebProps, StudyPathStep } from './types';
import type { NeuronEdge, NeuronNode } from '../core/types';
import { DEFAULT_THEME } from './constants';
import { useSceneManager } from './hooks/useSceneManager';
import { NodeRenderer } from './scene/node-renderer';
import { EdgeRenderer } from './scene/edge-renderer';
import { applyFuzzyLayout } from './layouts/fuzzy-layout';
import { InteractionManager } from './interactions/interaction-manager';
import { AnimationController } from './animations/animation-controller';
import { SelectionRipple } from './animations/selection-ripple';

type StudyPathPlayer = {
  steps: StudyPathStep[];
  index: number;
  playing: boolean;
  stepDurationMs: number;
};

export function NeuronWeb({
  graphData,
  className,
  style,
  fullHeight,
  isFullScreen,
  isLoading,
  error,
  selectedNode,
  focusNodeSlug,
  onFocusConsumed,
  visibleNodeSlugs,
  renderEmptyState,
  renderLoadingState,
  ariaLabel,
  theme,
  domainColors,
  layout,
  cameraFit,
  cardsMode,
  clickCard,
  clickZoom,
  studyPathRequest,
  onStudyPathComplete,
  renderNodeHover,
  renderNodeDetail,
  hoverCard,
  hoverCardSlots,
  onNodeHover,
  onNodeClick,
  onNodeDoubleClick,
  onNodeFocused,
  onEdgeClick,
  onBackgroundClick,
  onCameraChange,
  performanceMode,
  density,
  activeStoryBeatId,
  storyBeatStepDurationMs,
  onStoryBeatComplete,
}: NeuronWebProps): React.ReactElement {
  const containerRef = useRef<HTMLDivElement>(null);
  const hoverCardRef = useRef<HTMLDivElement>(null);
  const clickCardRef = useRef<HTMLDivElement>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [hoverCardNodeId, setHoverCardNodeId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [studyPathPlayer, setStudyPathPlayer] = useState<StudyPathPlayer | null>(null);
  const fitStateRef = useRef<{ hasFit: boolean; signature: string }>({ hasFit: false, signature: '' });
  const firstFilterChangeRef = useRef(true);
  const [filterTransitioning, setFilterTransitioning] = useState(false);
  const pathEdgeIdsRef = useRef<string[]>([]);
  const focusEdgesRef = useRef<string[] | null>(null);
  const hoverCardHideTimeout = useRef<number | null>(null);
  const hoverCardPositionRef = useRef<{ x: number; y: number } | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const activeStoryBeatRef = useRef<NeuronStoryBeat | null>(null);

  const filteredGraphData = useMemo(() => {
    if (visibleNodeSlugs === null || visibleNodeSlugs === undefined) {
      return graphData;
    }
    const allowed = new Set(visibleNodeSlugs);
    const filteredNodes = graphData.nodes.filter(
      (node) => allowed.has(node.slug) || allowed.has(node.id)
    );
    const filteredEdges = graphData.edges.filter(
      (edge) => allowed.has(edge.from) && allowed.has(edge.to)
    );
    const filteredStoryBeats = graphData.storyBeats
      ?.map((beat) => ({
        ...beat,
        nodeIds: beat.nodeIds.filter((id) => allowed.has(id)),
      }))
      .filter((beat) => beat.nodeIds.length >= 2);
    return {
      ...graphData,
      nodes: filteredNodes,
      edges: filteredEdges,
      storyBeats: filteredStoryBeats,
    };
  }, [graphData, visibleNodeSlugs]);

  const resolvedTheme = useMemo(
    () => ({
      ...DEFAULT_THEME,
      colors: {
        ...DEFAULT_THEME.colors,
        ...(theme?.colors ?? {}),
        domainColors: {
          ...DEFAULT_THEME.colors.domainColors,
          ...(theme?.colors?.domainColors ?? {}),
          ...(domainColors ?? {}),
        },
      },
      typography: { ...DEFAULT_THEME.typography, ...(theme?.typography ?? {}) },
      effects: { ...DEFAULT_THEME.effects, ...(theme?.effects ?? {}) },
      animation: { ...DEFAULT_THEME.animation, ...(theme?.animation ?? {}) },
    }),
    [theme, domainColors]
  );

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setPrefersReducedMotion(media.matches);
    update();
    if (media.addEventListener) {
      media.addEventListener('change', update);
      return () => media.removeEventListener('change', update);
    }
    media.addListener(update);
    return () => media.removeListener(update);
  }, []);

  const filterSignature = useMemo(() => {
    if (visibleNodeSlugs === null || visibleNodeSlugs === undefined) return 'all';
    return visibleNodeSlugs.length ? visibleNodeSlugs.join('|') : 'none';
  }, [visibleNodeSlugs]);

  useEffect(() => {
    if (firstFilterChangeRef.current) {
      firstFilterChangeRef.current = false;
      return;
    }
    setFilterTransitioning(true);
    const timer = setTimeout(() => setFilterTransitioning(false), resolvedTheme.animation.transitionDuration);
    return () => clearTimeout(timer);
  }, [filterSignature, resolvedTheme.animation.transitionDuration]);

  const workingGraph = filteredGraphData;

  const resolvedPerformanceMode = useMemo(() => {
    if (performanceMode && performanceMode !== 'auto') return performanceMode;
    const count = workingGraph.nodes.length;
    if (count > 360) return 'fallback';
    if (count > 180) return 'degraded';
    return 'normal';
  }, [performanceMode, workingGraph.nodes.length]);

  const resolvedDensity = useMemo(() => {
    const presets = {
      relaxed: { spread: 1.2, edgeFade: 0.2, focusExpansion: 0.18, minEdgeStrength: 0 },
      balanced: { spread: 1.0, edgeFade: 0.35, focusExpansion: 0.12, minEdgeStrength: 0.05 },
      compact: { spread: 0.9, edgeFade: 0.5, focusExpansion: 0.08, minEdgeStrength: 0.15 },
    };
    const defaultMode =
      density?.mode ??
      (resolvedPerformanceMode === 'normal'
        ? 'balanced'
        : resolvedPerformanceMode === 'degraded'
          ? 'compact'
          : 'compact');
    const base = presets[defaultMode];
    return {
      mode: defaultMode,
      spread: density?.spread ?? base.spread,
      edgeFade: density?.edgeFade ?? base.edgeFade,
      minEdgeStrength: density?.minEdgeStrength ?? base.minEdgeStrength,
      focusExpansion: density?.focusExpansion ?? base.focusExpansion,
      labelMaxCount: density?.labelMaxCount,
      labelDistance: density?.labelDistance,
      labelVisibility: density?.labelVisibility ?? 'auto',
    };
  }, [density, resolvedPerformanceMode]);

  const sceneManager = useSceneManager(containerRef, {
    backgroundColor: resolvedTheme.colors.background,
    cameraFov: 52,
    cameraPosition: [4, 8, 20],
    cameraTarget: [0, 0, 0],
    minZoom: 4,
    maxZoom: 42,
    autoRotateEnabled: resolvedTheme.effects.autoRotateEnabled,
    autoRotateSpeed: resolvedTheme.effects.autoRotateSpeed,
    enableStarfield: resolvedTheme.effects.starfieldEnabled,
    starfieldCount:
      resolvedPerformanceMode === 'normal'
        ? 1200
        : resolvedPerformanceMode === 'degraded'
          ? 700
          : 0,
    starfieldColor: resolvedTheme.effects.starfieldColor,
    pixelRatioCap: 2,
    ambientLightIntensity: 0.9,
    keyLightIntensity: 0.6,
    fillLightIntensity: 0.4,
    backgroundIntensity: resolvedTheme.effects.backgroundIntensity,
    postprocessingEnabled:
      resolvedTheme.effects.postprocessingEnabled && resolvedPerformanceMode === 'normal',
    bloomEnabled: resolvedTheme.effects.bloomEnabled,
    bloomStrength: resolvedTheme.effects.bloomStrength,
    bloomRadius: resolvedTheme.effects.bloomRadius,
    bloomThreshold: resolvedTheme.effects.bloomThreshold,
    vignetteEnabled: resolvedTheme.effects.vignetteEnabled,
    vignetteDarkness: resolvedTheme.effects.vignetteDarkness,
    vignetteOffset: resolvedTheme.effects.vignetteOffset,
    colorGradeEnabled: resolvedTheme.effects.colorGradeEnabled,
    colorGradeIntensity: resolvedTheme.effects.colorGradeIntensity,
    fogEnabled: resolvedTheme.effects.fogEnabled,
    fogColor: resolvedTheme.effects.fogColor,
    fogNear: resolvedTheme.effects.fogNear,
    fogFar: resolvedTheme.effects.fogFar,
  });

  const nodeRenderer = useMemo(() => {
    if (!sceneManager) return null;
    const defaultLabelDistance = resolvedPerformanceMode === 'normal' ? 26 : 0;
    const defaultLabelMax = resolvedPerformanceMode === 'normal' ? 80 : 0;
    const labelDistance = resolvedDensity.labelDistance ?? defaultLabelDistance;
    const labelMax = resolvedDensity.labelMaxCount ?? defaultLabelMax;
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
      labelDistance,
      maxVisibleLabels: labelMax,
      labelVisibility: resolvedDensity.labelVisibility,
      labelOffset: [0, 0.65, 0],
      labelFontFamily: resolvedTheme.typography.labelFontFamily,
      labelFontSize: resolvedTheme.typography.labelFontSize,
      labelFontWeight: resolvedTheme.typography.labelFontWeight,
      labelTextColor: resolvedTheme.colors.labelText,
      labelBackground: resolvedTheme.colors.labelBackground,
      ambientMotionEnabled:
        resolvedTheme.effects.ambientMotionEnabled &&
        resolvedPerformanceMode === 'normal' &&
        !prefersReducedMotion,
      ambientMotionAmplitude: resolvedTheme.effects.ambientMotionAmplitude,
      ambientMotionSpeed: resolvedTheme.effects.ambientMotionSpeed,
      hoverScale: resolvedTheme.animation.hoverScale,
      selectedScale: resolvedTheme.animation.selectedScale,
      pulseScale: resolvedTheme.animation.selectionPulseScale,
      pulseDuration: resolvedTheme.animation.selectionPulseDuration / 1000,
      enableHoverScale: resolvedTheme.animation.enableHoverScale && !prefersReducedMotion,
      enableSelectionPulse: resolvedTheme.animation.enableSelectionPulse && !prefersReducedMotion,
    });
  }, [sceneManager, resolvedTheme, resolvedPerformanceMode, resolvedDensity, prefersReducedMotion]);

  const edgeRenderer = useMemo(() => {
    if (!sceneManager) return null;
    return new EdgeRenderer(sceneManager.scene, {
      defaultColor: resolvedTheme.colors.edgeDefault,
      activeColor: resolvedTheme.colors.edgeActive,
      selectedColor: resolvedTheme.colors.edgeSelected,
      baseOpacity: 0.45,
      strengthOpacityScale: true,
      edgeFlowEnabled:
        resolvedTheme.effects.edgeFlowEnabled &&
        resolvedPerformanceMode === 'normal' &&
        !prefersReducedMotion,
      edgeFlowSpeed: resolvedTheme.effects.edgeFlowSpeed,
      focusFadeOpacity: resolvedDensity.edgeFade,
      minStrength: resolvedDensity.minEdgeStrength,
    });
  }, [sceneManager, resolvedTheme, resolvedPerformanceMode, resolvedDensity, prefersReducedMotion]);

  const doubleClickEnabled = false;

  const interactionManager = useMemo(() => {
    if (!sceneManager) return null;
    return new InteractionManager(sceneManager.scene, sceneManager.camera, sceneManager.renderer, {
      enableHover: true,
      enableClick: true,
      enableDoubleClick: doubleClickEnabled,
      hoverDelay: Math.max(40, resolvedTheme.animation.hoverCardFadeDuration * 0.6),
      doubleClickDelay: 280,
    });
  }, [sceneManager, resolvedTheme.animation.hoverCardFadeDuration, doubleClickEnabled]);

  const animationController = useMemo(() => {
    if (!sceneManager) return null;
    return new AnimationController(sceneManager.camera, sceneManager.controls, {
      focusDuration: resolvedTheme.animation.focusDuration,
      transitionDuration: resolvedTheme.animation.transitionDuration,
      easing: resolvedTheme.animation.easing as 'linear' | 'easeInOut' | 'easeOut',
    });
  }, [sceneManager, resolvedTheme]);

  const rippleEnabled =
    resolvedTheme.animation.enableSelectionRipple &&
    resolvedPerformanceMode !== 'fallback' &&
    !prefersReducedMotion;

  const selectionRipple = useMemo(() => {
    if (!sceneManager || !rippleEnabled) return null;
    return new SelectionRipple(sceneManager.scene, {
      color: resolvedTheme.colors.edgeSelected,
      duration: Math.max(0.2, resolvedTheme.animation.selectionPulseDuration / 1000),
      maxScale: 1.4,
      opacity: 0.6,
    });
  }, [sceneManager, resolvedTheme, rippleEnabled]);

  useEffect(() => {
    return () => {
      selectionRipple?.dispose();
    };
  }, [selectionRipple]);

  const layoutOptions = useMemo(
    () => ({
      ...layout,
      spread: layout?.spread ?? resolvedDensity.spread,
    }),
    [layout, resolvedDensity.spread]
  );

  const resolvedNodes = useMemo(
    () => applyFuzzyLayout(workingGraph.nodes, layoutOptions),
    [workingGraph.nodes, layoutOptions]
  );

  const displayNodes = useMemo(() => {
    if (!selectedNodeId || !resolvedDensity.focusExpansion) return resolvedNodes;
    const selected = resolvedNodes.find((node) => node.id === selectedNodeId);
    if (!selected?.position) return resolvedNodes;
    const anchor = new THREE.Vector3(...selected.position);
    const expansion = 1 + resolvedDensity.focusExpansion;
    return resolvedNodes.map((node) => {
      if (!node.position || node.id === selectedNodeId) return node;
      const position = new THREE.Vector3(...node.position)
        .sub(anchor)
        .multiplyScalar(expansion)
        .add(anchor);
      return { ...node, position: [position.x, position.y, position.z] as [number, number, number] };
    });
  }, [resolvedNodes, selectedNodeId, resolvedDensity.focusExpansion]);

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

  const edgeMap = useMemo(
    () => new Map(workingGraph.edges.map((edge) => [edge.id, edge])),
    [workingGraph.edges]
  );

  const nodeSlugById = useMemo(() => {
    const map = new Map<string, string>();
    resolvedNodes.forEach((node) => map.set(node.id, node.slug));
    return map;
  }, [resolvedNodes]);

  const edgesBySlug = useMemo(() => {
    const map = new Map<string, string[]>();
    workingGraph.edges.forEach((edge) => {
      const add = (slug: string) => {
        const list = map.get(slug);
        if (list) list.push(edge.id);
        else map.set(slug, [edge.id]);
      };
      add(edge.from);
      add(edge.to);
    });
    return map;
  }, [workingGraph.edges]);

  const applyFocusEdges = useCallback(
    (edgeIds: string[] | null) => {
      if (!edgeRenderer) return;
      focusEdgesRef.current = edgeIds;
      const merged = new Set(edgeIds ?? []);
      pathEdgeIdsRef.current.forEach((id) => merged.add(id));
      edgeRenderer.setFocusEdges(merged.size ? Array.from(merged) : null);
    },
    [edgeRenderer]
  );

  const resolvedStudyPathSteps = useMemo<StudyPathStep[] | null>(() => {
    if (!studyPathRequest) return null;
    if (studyPathRequest.steps && studyPathRequest.steps.length) {
      return studyPathRequest.steps;
    }
    if (studyPathRequest.fromNodeId && studyPathRequest.toNodeId) {
      return [
        { nodeId: studyPathRequest.fromNodeId },
        { nodeId: studyPathRequest.toNodeId },
      ];
    }
    return null;
  }, [studyPathRequest]);

  const activeStoryBeat = useMemo(() => {
    if (!activeStoryBeatId || !workingGraph.storyBeats) return null;
    return workingGraph.storyBeats.find((beat) => beat.id === activeStoryBeatId) ?? null;
  }, [activeStoryBeatId, workingGraph.storyBeats]);

  const resolvedBeatSteps = useMemo<StudyPathStep[] | null>(() => {
    if (!activeStoryBeat) return null;
    if (!activeStoryBeat.nodeIds || activeStoryBeat.nodeIds.length === 0) return null;
    return activeStoryBeat.nodeIds.map((nodeId) => ({ nodeId }));
  }, [activeStoryBeat]);

  useEffect(() => {
    const steps = resolvedStudyPathSteps ?? resolvedBeatSteps;
    if (!steps || steps.length === 0) {
      setStudyPathPlayer(null);
      pathEdgeIdsRef.current = [];
      applyFocusEdges(focusEdgesRef.current);
      activeStoryBeatRef.current = null;
      return;
    }
    activeStoryBeatRef.current = resolvedBeatSteps ? activeStoryBeat : null;
    setStudyPathPlayer({
      steps,
      index: 0,
      playing: true,
      stepDurationMs:
        resolvedBeatSteps && storyBeatStepDurationMs
          ? storyBeatStepDurationMs
          : studyPathRequest?.stepDurationMs ?? 4200,
    });
  }, [
    resolvedStudyPathSteps,
    resolvedBeatSteps,
    studyPathRequest?.stepDurationMs,
    storyBeatStepDurationMs,
    activeStoryBeat,
    applyFocusEdges,
  ]);

  const nodeByIdentifier = useMemo(() => {
    const map = new Map<string, typeof resolvedNodes[number]>();
    resolvedNodes.forEach((node) => {
      map.set(node.slug, node);
      map.set(node.id, node);
    });
    return map;
  }, [resolvedNodes]);

  const selectionControlled = selectedNode !== undefined;


  const hoverCardEnabled =
    (cardsMode ? (cardsMode === 'hover' || cardsMode === 'both') : (hoverCard?.enabled ?? true)) &&
    resolvedPerformanceMode !== 'fallback';
  const hoverCardOffset = hoverCard?.offset ?? [18, 18];
  const hoverCardWidth = hoverCard?.width ?? 240;
  const hoverCardVisible = hoverCardEnabled && Boolean(hoverCardNodeId);
  const hoverCardActive =
    hoverCardEnabled && Boolean(hoveredNodeId && hoverCardNodeId === hoveredNodeId);
  const hoverCardSlideDistance = prefersReducedMotion ? 0 : resolvedTheme.animation.hoverCardSlideDistance;
  const hoverCardNode = hoverCardNodeId ? nodeMap.get(hoverCardNodeId) ?? null : null;
  const hoverSummaryMax = hoverCard?.maxSummaryLength ?? 140;
  const showHoverTags = hoverCard?.showTags ?? true;
  const showHoverMetrics = hoverCard?.showMetrics ?? true;
  const clickCardEnabled =
    (cardsMode ? (cardsMode === 'click' || cardsMode === 'both') : (clickCard?.enabled ?? false)) &&
    resolvedPerformanceMode !== 'fallback';
  const clickCardOffset = clickCard?.offset ?? [24, 24];
  const clickCardWidth = clickCard?.width ?? 320;
  const clickZoomEnabled = clickZoom?.enabled ?? true;
  const clickZoomDistance = clickZoom?.distance;
  const clickZoomOffset = clickZoom?.offset;
  const cameraTweenEnabled = resolvedTheme.animation.enableCameraTween && !prefersReducedMotion;

  const truncateText = useCallback((value: string, maxLength: number) => {
    if (value.length <= maxLength) return value;
    return `${value.slice(0, Math.max(0, maxLength - 1))}…`;
  }, []);

  useEffect(() => {
    if (!hoverCardEnabled) {
      setHoverCardNodeId(null);
      return;
    }
    if (hoveredNodeId) {
      if (hoverCardHideTimeout.current) {
        window.clearTimeout(hoverCardHideTimeout.current);
        hoverCardHideTimeout.current = null;
      }
      setHoverCardNodeId(hoveredNodeId);
      return;
    }
    if (hoverCardNodeId) {
      if (hoverCardHideTimeout.current) {
        window.clearTimeout(hoverCardHideTimeout.current);
      }
      hoverCardHideTimeout.current = window.setTimeout(() => {
        setHoverCardNodeId(null);
        hoverCardHideTimeout.current = null;
      }, Math.max(80, resolvedTheme.animation.hoverCardFadeDuration));
    }
  }, [
    hoveredNodeId,
    hoverCardEnabled,
    hoverCardNodeId,
    resolvedTheme.animation.hoverCardFadeDuration,
  ]);

  useEffect(() => {
    hoverCardPositionRef.current = null;
  }, [hoverCardNodeId]);

  const hoverCardTags = useMemo(() => {
    if (!hoverCardNode) return [];
    const rawTags =
      (Array.isArray(hoverCardNode.metadata?.tags)
        ? hoverCardNode.metadata?.tags
        : Array.isArray(hoverCardNode.metadata?.keywords)
          ? hoverCardNode.metadata?.keywords
          : []) as string[];
    return rawTags.map((tag) => String(tag)).filter(Boolean).slice(0, 4);
  }, [hoverCardNode]);

  const hoverCardMetrics = useMemo(() => {
    if (!hoverCardNode) return [];
    const metrics: Array<{ label: string; value: string | number }> = [];
    metrics.push({ label: 'Connections', value: hoverCardNode.connectionCount ?? 0 });
    const cluster = hoverCardNode.metadata?.clusterSimilarity as number | undefined;
    if (typeof cluster === 'number') {
      metrics.push({ label: 'Cluster', value: cluster.toFixed(2) });
    }
    return metrics.slice(0, 3);
  }, [hoverCardNode]);

  const focusOnNodePosition = useCallback(
    (nodePosition: THREE.Vector3, callback?: () => void) => {
      if (!animationController && !sceneManager) return;
      if (Array.isArray(clickZoomOffset) && clickZoomOffset.length === 3) {
        const offset = new THREE.Vector3(...clickZoomOffset);
        const targetPosition = nodePosition.clone().add(offset);
        if (cameraTweenEnabled && animationController) {
          animationController.focusOnPosition(targetPosition, nodePosition, callback);
        } else if (sceneManager) {
          sceneManager.camera.position.copy(targetPosition);
          sceneManager.controls.target.copy(nodePosition);
          sceneManager.controls.update();
          if (callback) callback();
        }
        return;
      }
      if (typeof clickZoomDistance === 'number' && Number.isFinite(clickZoomDistance)) {
        if (!sceneManager) {
          if (cameraTweenEnabled && animationController) {
            animationController.focusOnNode(nodePosition, callback);
          }
          return;
        }
        const direction = sceneManager.camera.position.clone().sub(sceneManager.controls.target);
        if (direction.lengthSq() < 0.0001) {
          direction.set(0, 0, 1);
        }
        direction.normalize();
        const targetPosition = nodePosition.clone().add(direction.multiplyScalar(clickZoomDistance));
        if (cameraTweenEnabled && animationController) {
          animationController.focusOnPosition(targetPosition, nodePosition, callback);
        } else {
          sceneManager.camera.position.copy(targetPosition);
          sceneManager.controls.target.copy(nodePosition);
          sceneManager.controls.update();
          if (callback) callback();
        }
        return;
      }
      if (cameraTweenEnabled && animationController) {
        animationController.focusOnNode(nodePosition, callback);
      } else if (sceneManager) {
        const direction = sceneManager.camera.position.clone().sub(sceneManager.controls.target);
        if (direction.lengthSq() < 0.0001) {
          direction.set(0, 0, 1);
        }
        direction.normalize();
        const distance = sceneManager.camera.position.distanceTo(sceneManager.controls.target);
        const targetPosition = nodePosition.clone().add(direction.multiplyScalar(distance));
        sceneManager.camera.position.copy(targetPosition);
        sceneManager.controls.target.copy(nodePosition);
        sceneManager.controls.update();
        if (callback) callback();
      }
    },
    [animationController, clickZoomOffset, clickZoomDistance, sceneManager, cameraTweenEnabled]
  );

  useEffect(() => {
    if (!studyPathPlayer) return;
    const step = studyPathPlayer.steps[studyPathPlayer.index];
    const stepKey = step?.nodeSlug ?? step?.nodeId ?? null;
    const node = stepKey ? nodeByIdentifier.get(stepKey) ?? null : null;

    if (node && nodeRenderer && edgeRenderer) {
      setSelectedNodeId(node.id);
      nodeRenderer.setSelectedNode(node.id);
      nodeRenderer.pulseNode(node.id);
      if (selectionRipple) {
        const nodePosition = nodeRenderer.getNodePosition(node.id);
        if (nodePosition) {
          const nodeObject = nodeRenderer.getNodeObject(node.id);
          selectionRipple.trigger(nodePosition, nodeObject?.scale.x ?? 1);
        }
      }
      if (clickZoomEnabled) {
        const nodePosition = nodeRenderer.getNodePosition(node.id);
        if (nodePosition) {
          focusOnNodePosition(nodePosition, () => {
            if (onNodeFocused) onNodeFocused(node as unknown as NeuronNode);
          });
        }
      }
      const slug = node.slug;
      applyFocusEdges(slug ? edgesBySlug.get(slug) ?? [] : []);
    }

    const nextStep =
      studyPathPlayer.index < studyPathPlayer.steps.length - 1
        ? studyPathPlayer.steps[studyPathPlayer.index + 1]
        : null;
    const currentSlug = node?.slug ?? (step?.nodeSlug ?? null);
    const nextKey = nextStep?.nodeSlug ?? nextStep?.nodeId ?? null;
    const nextNode = nextKey ? nodeByIdentifier.get(nextKey) ?? null : null;
    const nextSlug = nextNode?.slug ?? (nextStep?.nodeSlug ?? null);

    if (currentSlug && nextSlug) {
      pathEdgeIdsRef.current = workingGraph.edges
        .filter(
          (edge) =>
            (edge.from === currentSlug && edge.to === nextSlug) ||
            (edge.to === currentSlug && edge.from === nextSlug)
        )
        .map((edge) => edge.id);
    } else {
      pathEdgeIdsRef.current = [];
    }

    applyFocusEdges(focusEdgesRef.current);
  }, [
    studyPathPlayer,
    nodeByIdentifier,
    nodeRenderer,
    edgeRenderer,
    selectionRipple,
    edgesBySlug,
    workingGraph.edges,
    animationController,
    clickZoomEnabled,
    onNodeFocused,
    applyFocusEdges,
  ]);

  useEffect(() => {
    if (!studyPathPlayer || !studyPathPlayer.playing) return;
    const timer = window.setTimeout(() => {
      setStudyPathPlayer((prev) => {
        if (!prev) return prev;
        if (prev.index >= prev.steps.length - 1) {
          if (activeStoryBeatRef.current && onStoryBeatComplete) {
            onStoryBeatComplete(activeStoryBeatRef.current);
          }
          if (onStudyPathComplete) onStudyPathComplete();
          return { ...prev, playing: false };
        }
        return { ...prev, index: prev.index + 1 };
      });
    }, studyPathPlayer.stepDurationMs);
    return () => window.clearTimeout(timer);
  }, [studyPathPlayer, onStudyPathComplete, onStoryBeatComplete]);

  useEffect(() => {
    if (!studyPathPlayer || studyPathPlayer.playing) return;
    pathEdgeIdsRef.current = [];
    applyFocusEdges(focusEdgesRef.current);
  }, [studyPathPlayer, applyFocusEdges]);

  useEffect(() => {
    if (!sceneManager || !nodeRenderer || !edgeRenderer) return;
    nodeRenderer.renderNodes(displayNodes);
    const positions = new Map<string, THREE.Vector3>();
    displayNodes.forEach((node) => {
      if (!node.position) return;
      positions.set(node.slug, new THREE.Vector3(...node.position));
    });
    edgeRenderer.renderEdges(workingGraph.edges, positions);
  }, [displayNodes, workingGraph.edges, sceneManager, nodeRenderer, edgeRenderer]);

  useEffect(() => {
    if (!sceneManager) return;
    sceneManager.updateBackground(resolvedTheme.colors.background);
  }, [sceneManager, resolvedTheme.colors.background]);

  useEffect(() => {
    if (!sceneManager || !nodeRenderer) return;

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const tempDir = new THREE.Vector3();
    const plane = new THREE.Plane();
    const intersection = new THREE.Vector3();

    const updatePointer = (event: PointerEvent) => {
      const rect = sceneManager.renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    };

    const onPointerDown = (event: PointerEvent) => {
      updatePointer(event);
      raycaster.setFromCamera(pointer, sceneManager.camera);

      const nodes = nodeRenderer.getNodeObjects();
      if (nodes.length) {
        const intersects = raycaster.intersectObjects(nodes, true);
        if (intersects.length) {
          const hit = intersects[0].object;
          const nodeId = hit.userData?.nodeId as string | undefined;
          if (nodeId) {
            const nodePosition = nodeRenderer.getNodePosition(nodeId);
            if (nodePosition) {
              if (!clickZoomEnabled) {
                sceneManager.controls.target.copy(nodePosition);
                sceneManager.controls.update();
                return;
              }
            }
          }
          if (intersects[0].point) {
            sceneManager.controls.target.copy(intersects[0].point);
            sceneManager.controls.update();
            return;
          }
        }
      }

      sceneManager.camera.getWorldDirection(tempDir).normalize();
      plane.setFromNormalAndCoplanarPoint(tempDir, sceneManager.controls.target.clone());
      if (raycaster.ray.intersectPlane(plane, intersection)) {
        sceneManager.controls.target.copy(intersection);
        sceneManager.controls.update();
      }
    };

    const dom = sceneManager.renderer.domElement;
    dom.addEventListener('pointerdown', onPointerDown);
    return () => {
      dom.removeEventListener('pointerdown', onPointerDown);
    };
  }, [sceneManager, nodeRenderer, clickZoomEnabled]);

  const cameraFitSuspended = Boolean(selectedNodeId || focusNodeSlug);

  useEffect(() => {
    if (!sceneManager || !animationController || !resolvedCameraFit.enabled) return;
    if (cameraFitSuspended) return;

    const mode = resolvedCameraFit.mode;
    if (mode === 'once' && fitStateRef.current.hasFit) return;
    if (mode === 'onChange' && fitStateRef.current.signature === fitSignature) return;

    const positions = displayNodes
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
  }, [
    sceneManager,
    animationController,
    resolvedCameraFit,
    displayNodes,
    fitSignature,
    cameraFitSuspended,
  ]);

  useEffect(() => {
    if (!sceneManager) return;
    sceneManager.controls.enableDamping = true;
    sceneManager.controls.dampingFactor = 0.08;
  }, [sceneManager]);

  useEffect(() => {
    if (!sceneManager || !onCameraChange) return;
    let frame: number | null = null;
    const handler = () => {
      if (frame !== null) return;
      frame = window.requestAnimationFrame(() => {
        frame = null;
        const pos = sceneManager.camera.position;
        onCameraChange([pos.x, pos.y, pos.z]);
      });
    };
    sceneManager.controls.addEventListener('change', handler);
    handler();
    return () => {
      sceneManager.controls.removeEventListener('change', handler);
      if (frame !== null) {
        window.cancelAnimationFrame(frame);
      }
    };
  }, [sceneManager, onCameraChange]);

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
      selectionRipple?.update(elapsed, sceneManager.camera);
      if (hoverCardRef.current && hoverCardVisible && hoverCardNodeId) {
        const position = nodeRenderer.getNodePosition(hoverCardNodeId);
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
          // Snap hover card to node position to avoid slide-in motion.
          const nextX = x;
          const nextY = y;
          hoverCardPositionRef.current = { x: nextX, y: nextY };
          const slide = hoverCardActive ? 0 : hoverCardSlideDistance;
          hoverCardRef.current.style.transform = `translate(${nextX}px, ${nextY}px) translateY(${slide}px)`;
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
    hoverCardVisible,
    hoverCardNodeId,
    hoverCardActive,
    hoverCardOffset,
    selectedNodeId,
    clickCardOffset,
    hoverCardSlideDistance,
    selectionRipple,
  ]);

  useEffect(() => {
    if (!interactionManager || !nodeRenderer) return;
    const edgeObjects = edgeRenderer ? edgeRenderer.getEdgeObjects() : [];
    interactionManager.setTargets(nodeRenderer.getNodeObjects(), nodeMap, edgeObjects, edgeMap);
  }, [interactionManager, nodeRenderer, edgeRenderer, nodeMap, edgeMap]);

  useEffect(() => {
    if (!nodeRenderer) return;
    if (hoveredNodeId && !nodeMap.has(hoveredNodeId)) {
      setHoveredNodeId(null);
      nodeRenderer.setHoveredNode(null);
    }
  }, [hoveredNodeId, nodeMap, nodeRenderer]);

  useEffect(() => {
    if (!nodeRenderer || !edgeRenderer) return;
    if (selectedNodeId && !nodeMap.has(selectedNodeId)) {
      setSelectedNodeId(null);
      nodeRenderer.setSelectedNode(null);
      applyFocusEdges(null);
    }
  }, [selectedNodeId, nodeMap, nodeRenderer, edgeRenderer, applyFocusEdges]);

  useEffect(() => {
    if (!selectionControlled || !nodeRenderer || !edgeRenderer) return;
    if (!selectedNode) {
      setSelectedNodeId(null);
      nodeRenderer.setSelectedNode(null);
      applyFocusEdges(null);
      return;
    }
    const key = selectedNode.slug ?? selectedNode.id;
    const next = nodeByIdentifier.get(key) ?? null;
    if (!next) {
      setSelectedNodeId(null);
      nodeRenderer.setSelectedNode(null);
      applyFocusEdges(null);
      return;
    }
    setSelectedNodeId(next.id);
    nodeRenderer.setSelectedNode(next.id);
    applyFocusEdges(next.slug ? edgesBySlug.get(next.slug) ?? [] : []);
  }, [
    selectionControlled,
    selectedNode,
    nodeByIdentifier,
    nodeRenderer,
    edgeRenderer,
    edgesBySlug,
    applyFocusEdges,
  ]);

  useEffect(() => {
    if (!focusNodeSlug || !nodeRenderer || !edgeRenderer) return;
    const node = nodeByIdentifier.get(focusNodeSlug);
    if (!node) {
      onFocusConsumed?.();
      return;
    }
    setSelectedNodeId(node.id);
    nodeRenderer.setSelectedNode(node.id);
    nodeRenderer.pulseNode(node.id);
    if (selectionRipple) {
      const nodePosition = nodeRenderer.getNodePosition(node.id);
      if (nodePosition) {
        const nodeObject = nodeRenderer.getNodeObject(node.id);
        selectionRipple.trigger(nodePosition, nodeObject?.scale.x ?? 1);
      }
    }
    applyFocusEdges(node.slug ? edgesBySlug.get(node.slug) ?? [] : []);
    if (clickZoomEnabled) {
      const nodePosition = nodeRenderer.getNodePosition(node.id);
      if (nodePosition) {
        focusOnNodePosition(nodePosition, () => {
          if (onNodeFocused) onNodeFocused(node as unknown as NeuronNode);
        });
      } else if (onNodeFocused) {
        onNodeFocused(node as unknown as NeuronNode);
      }
    } else if (onNodeFocused) {
      onNodeFocused(node as unknown as NeuronNode);
    }
    onFocusConsumed?.();
  }, [
    focusNodeSlug,
    nodeByIdentifier,
    nodeRenderer,
    edgeRenderer,
    edgesBySlug,
    clickZoomEnabled,
    animationController,
    onNodeFocused,
    onFocusConsumed,
    applyFocusEdges,
    selectionRipple,
  ]);

  useEffect(() => {
    if (!interactionManager || !nodeRenderer || !edgeRenderer) return;
    interactionManager.onNodeHover = (node) => {
      const nodeId = node?.id ?? null;
      setHoveredNodeId(nodeId);
      nodeRenderer.setHoveredNode(nodeId);
      if (nodeId) {
        const slug = nodeSlugById.get(nodeId);
        applyFocusEdges(slug ? edgesBySlug.get(slug) ?? [] : []);
      } else {
        const selectedSlug = selectedNodeId ? nodeSlugById.get(selectedNodeId) : null;
        if (selectedSlug) {
          applyFocusEdges(edgesBySlug.get(selectedSlug) ?? []);
        } else {
          applyFocusEdges(null);
        }
      }
      if (onNodeHover) {
        onNodeHover(node ? (node as unknown as NeuronNode) : null);
      }
    };
    interactionManager.onNodeClick = (node) => {
      if (!selectionControlled) {
        setSelectedNodeId(node.id);
        nodeRenderer.setSelectedNode(node.id);
      }
      nodeRenderer.pulseNode(node.id);
      if (selectionRipple) {
        const nodePosition = nodeRenderer.getNodePosition(node.id);
        if (nodePosition) {
          const nodeObject = nodeRenderer.getNodeObject(node.id);
          selectionRipple.trigger(nodePosition, nodeObject?.scale.x ?? 1);
        }
      }
      if (clickZoomEnabled) {
        const nodePosition = nodeRenderer.getNodePosition(node.id);
        if (nodePosition) {
          focusOnNodePosition(nodePosition, () => {
            if (onNodeFocused) onNodeFocused(node as unknown as NeuronNode);
          });
        }
      }
      const slug = nodeSlugById.get(node.id);
      applyFocusEdges(slug ? edgesBySlug.get(slug) ?? [] : []);
      if (onNodeClick) {
        onNodeClick(node as unknown as NeuronNode);
      }
    };
    if (doubleClickEnabled) {
      interactionManager.onNodeDoubleClick = (node) => {
        const nodePosition = nodeRenderer.getNodePosition(node.id);
        if (nodePosition) {
          focusOnNodePosition(nodePosition, () => {
            if (onNodeFocused) onNodeFocused(node as unknown as NeuronNode);
          });
        }
        if (onNodeDoubleClick) {
          onNodeDoubleClick(node as unknown as NeuronNode);
        }
      };
    } else {
      interactionManager.onNodeDoubleClick = () => {};
    }
    interactionManager.onBackgroundClick = () => {
      if (!selectionControlled) {
        setSelectedNodeId(null);
        nodeRenderer.setSelectedNode(null);
      }
      if (!hoveredNodeId) {
        applyFocusEdges(null);
      }
      if (onBackgroundClick) onBackgroundClick();
    };
    interactionManager.onEdgeClick = (edge) => {
      if (onEdgeClick) {
        onEdgeClick(edge as unknown as NeuronEdge);
      }
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
    onEdgeClick,
    onBackgroundClick,
    applyFocusEdges,
    selectionRipple,
    selectionControlled,
    doubleClickEnabled,
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

  const sceneTransitionStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    transition: `opacity ${resolvedTheme.animation.transitionDuration}ms ease, transform ${resolvedTheme.animation.transitionDuration}ms ease, filter ${resolvedTheme.animation.transitionDuration}ms ease`,
    opacity: filterTransitioning ? 0.85 : 1,
    transform: filterTransitioning ? 'scale(0.985)' : 'scale(1)',
    filter: filterTransitioning ? 'blur(1px)' : 'blur(0px)',
    transformOrigin: 'center',
    willChange: 'transform, filter, opacity',
  };

  const filterOverlayStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    background: 'radial-gradient(circle at 50% 35%, rgba(255,255,255,0.35), transparent 60%)',
    opacity: filterTransitioning ? 1 : 0,
    transition: `opacity ${resolvedTheme.animation.transitionDuration}ms ease`,
    zIndex: 2,
  };

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
        style={sceneTransitionStyle}
      />
      <div style={filterOverlayStyle} />
      {hoverCardVisible && hoverCardNode && (
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
            opacity: hoverCardActive ? 0.98 : 0,
            transition: `opacity ${resolvedTheme.animation.hoverCardFadeDuration}ms ease`,
            transform: `translate(${hoverCardOffset[0]}px, ${hoverCardOffset[1]}px) translateY(${hoverCardActive ? 0 : hoverCardSlideDistance}px)`,
          }}
        >
          {renderNodeHover ? (
            renderNodeHover(hoverCardNode)
          ) : (
            <div>
              {hoverCardSlots?.header ? (
                hoverCardSlots.header(hoverCardNode)
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 6 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>
                    {truncateText(hoverCardNode.label, 48)}
                  </div>
                  <div style={{ fontSize: 11, opacity: 0.7, letterSpacing: '0.08em' }}>
                    {truncateText(hoverCardNode.domain?.toUpperCase?.() ?? 'NODE', 24)}
                  </div>
                </div>
              )}
              {hoverCardSlots?.summary ? (
                hoverCardSlots.summary(hoverCardNode)
              ) : (
                <div style={{ opacity: 0.75, marginBottom: 8 }}>
                  {truncateText(
                    typeof hoverCardNode.metadata?.summary === 'string'
                      ? hoverCardNode.metadata.summary
                      : 'Click to focus this node and explore connections.',
                    hoverSummaryMax
                  )}
                </div>
              )}
              {showHoverTags && (hoverCardSlots?.tags || hoverCardTags.length > 0) && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                  {hoverCardSlots?.tags
                    ? hoverCardSlots.tags(hoverCardNode)
                    : hoverCardTags.map((tag) => (
                        <span
                          key={tag}
                          style={{
                            fontSize: 10,
                            padding: '3px 6px',
                            borderRadius: 8,
                            background: 'rgba(120, 140, 255, 0.2)',
                            border: '1px solid rgba(120, 140, 255, 0.35)',
                          }}
                        >
                          {truncateText(tag, 16)}
                        </span>
                      ))}
                </div>
              )}
              {showHoverMetrics && (hoverCardSlots?.metrics || hoverCardMetrics.length > 0) && (
                <div style={{ display: 'flex', gap: 12, fontSize: 11, opacity: 0.8 }}>
                  {hoverCardSlots?.metrics
                    ? hoverCardSlots.metrics(hoverCardNode)
                    : hoverCardMetrics.map((metric) => (
                        <div key={metric.label}>
                          <div style={{ opacity: 0.6 }}>{metric.label}</div>
                          <div style={{ fontWeight: 600 }}>{metric.value}</div>
                        </div>
                      ))}
                </div>
              )}
              {hoverCardSlots?.footer && hoverCardSlots.footer(hoverCardNode)}
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
