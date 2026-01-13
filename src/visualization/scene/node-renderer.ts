import * as THREE from 'three';
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import type { NeuronVisualNode, NodeTier } from '../../core/types';
import { computeAmbientDrift } from '../animations/ambient-motion';
import type {
  LabelTierRules,
  NodeNumberMappingRule,
  NodeRenderMode,
  NodeStyle,
  NodeStyleResolver,
} from '../types';

export interface NodeRenderConfig {
  domainColors: Record<string, string>;
  /** Status-based colors for workflow visualization (takes priority over domain) */
  statusColors?: Record<string, string>;
  defaultColor: string;
  baseScale: number;
  tierScales: Record<NodeTier, number>;
  glowIntensity: number;
  labelDistance: number;
  maxVisibleLabels: number;
  labelVisibility?: 'auto' | 'interaction' | 'none';
  labelTierRules?: LabelTierRules;
  labelTransitionsEnabled?: boolean;
  labelTransitionDurationMs?: number;
  transitionsEnabled?: boolean;
  transitionDurationMs?: number;
  hitTargetScale?: number;
  labelOffset?: [number, number, number];
  labelFontFamily: string;
  labelFontSize: number;
  labelFontWeight: string;
  labelTextColor: string;
  labelBackground: string;
  ambientMotionEnabled: boolean;
  ambientMotionAmplitude: number;
  ambientMotionSpeed: number;
  hoverScale: number;
  selectedScale: number;
  pulseScale: number;
  pulseDuration: number;
  enableHoverScale: boolean;
  enableSelectionPulse: boolean;
  mode?: NodeRenderMode;
  sizeRule?: NodeNumberMappingRule;
  opacityRule?: NodeNumberMappingRule;
  getNodeStyle?: NodeStyleResolver;
  selectionHighlightColor?: string;
}

interface NodeRenderState {
  id: string;
  slug: string;
  object: THREE.Object3D;
  material: THREE.Material;
  hitMesh: THREE.Mesh | null;
  label: CSS2DObject | null;
  labelInner: HTMLDivElement | null;
  labelTargetVisible: boolean;
  labelHideAt: number | null;
  labelShowRaf: number | null;
  tier: NodeTier;
  transitionPhase: 'entering' | 'alive' | 'exiting';
  transitionStartMs: number;
  transitionDurationMs: number;
  positionTween:
    | { from: THREE.Vector3; to: THREE.Vector3; startMs: number; durationMs: number }
    | null;
  basePosition: THREE.Vector3;
  baseScale: number;
  baseOpacity: number;
  phase: number;
  baseColor: THREE.Color;
  hovered: boolean;
  selected: boolean;
  pulseStart: number | null;
  style: NodeStyle;
}

export class NodeRenderer {
  private group = new THREE.Group();
  private nodeStates = new Map<string, NodeRenderState>();
  private hoveredNodeId: string | null = null;
  private selectedNodeId: string | null = null;
  private glowTexture: THREE.Texture | null = null;
  private meshGeometry: THREE.SphereGeometry | null = null;
  private hitGeometry: THREE.SphereGeometry | null = null;
  private labelOffset = new THREE.Vector3(0, 0.65, 0);
  private selectionHighlightColor: THREE.Color;
  private renderMode: NodeRenderMode;

  constructor(private scene: THREE.Scene, private config: NodeRenderConfig) {
    this.scene.add(this.group);
    this.renderMode = config.mode ?? 'sprite';
    this.selectionHighlightColor = new THREE.Color(config.selectionHighlightColor ?? '#ffffff');
    this.glowTexture = this.createGlowTexture();
    if (this.renderMode === 'mesh') {
      this.meshGeometry = new THREE.SphereGeometry(0.55, 18, 18);
    }
    this.hitGeometry = new THREE.SphereGeometry(0.5, 14, 12);
    if (config.labelOffset) {
      this.labelOffset.set(...config.labelOffset);
    }
  }

  renderNodes(nodes: NeuronVisualNode[]): void {
    const nowMs = performance.now();
    const transitionsEnabled =
      Boolean(this.config.transitionsEnabled) && Math.max(0, this.config.transitionDurationMs ?? 0) > 0;
    const transitionDurationMs = Math.max(0, this.config.transitionDurationMs ?? 0);
    const labelVisibility = this.config.labelVisibility ?? 'auto';
    const labelTransitionsEnabled = Boolean(this.config.labelTransitionsEnabled);
    const labelTransitionDurationMs = Math.max(0, this.config.labelTransitionDurationMs ?? 160);
    const shouldRenderLabels =
      labelVisibility !== 'none' &&
      (labelVisibility === 'interaction' ||
        (this.config.maxVisibleLabels > 0 && this.config.labelDistance > 0));

    const resolveNode = (node: NeuronVisualNode) => {
      const tier = node.tier ?? 'tertiary';
      // Status color takes priority over domain color for workflow visualization
      let baseColor: THREE.Color;
      if (node.status && this.config.statusColors?.[node.status]) {
        baseColor = new THREE.Color(this.config.statusColors[node.status]);
      } else {
        baseColor = new THREE.Color(
          this.config.domainColors[node.domain] ?? this.config.defaultColor
        );
      }
      const position = new THREE.Vector3();
      if (node.position) {
        position.set(...node.position);
      }
      const tierScale = this.config.tierScales[tier] ?? 1;
      const baseScaleRaw = this.config.baseScale * tierScale;
      const staticStyle: NodeStyle = {};
      const mappedScale = this.resolveNodeMapping(node, this.config.sizeRule);
      if (mappedScale !== undefined) staticStyle.scale = mappedScale;
      const mappedOpacity = this.resolveNodeMapping(node, this.config.opacityRule);
      if (mappedOpacity !== undefined) staticStyle.opacity = mappedOpacity;
      const resolverStyle = this.config.getNodeStyle ? this.config.getNodeStyle(node) : undefined;
      const resolvedStyle: NodeStyle = { ...staticStyle, ...(resolverStyle ?? {}) };
      const resolvedColor = this.resolveStyleColor(baseColor, resolvedStyle.color);
      const baseScale = baseScaleRaw * (resolvedStyle.scale ?? 1);
      const baseOpacity = this.clamp01(0.78 * (resolvedStyle.opacity ?? 1));
      return { tier, position, baseScale, baseOpacity, resolvedColor, resolvedStyle };
    };

    if (!transitionsEnabled) {
      this.clear();
      const seen = new Set<string>();
      nodes.forEach((node) => {
        if (seen.has(node.id)) return;
        seen.add(node.id);
        const resolved = resolveNode(node);

        const { object, material } = this.createNodeObject(resolved.resolvedColor, resolved.baseOpacity);
        object.position.copy(resolved.position);
        object.scale.setScalar(resolved.baseScale);
        object.userData = { nodeId: node.id, nodeSlug: node.slug };
        this.group.add(object);

        let hitMesh: THREE.Mesh | null = null;
        const hitScale = this.config.hitTargetScale ?? 1.8;
        if (this.hitGeometry && hitScale > 0) {
          const hitMaterial = new THREE.MeshBasicMaterial({
            transparent: true,
            opacity: 0,
            depthWrite: false,
          });
          hitMesh = new THREE.Mesh(this.hitGeometry, hitMaterial);
          hitMesh.position.copy(resolved.position);
          hitMesh.scale.setScalar(resolved.baseScale * hitScale);
          hitMesh.userData = { nodeId: node.id, nodeSlug: node.slug };
          this.group.add(hitMesh);
        }

        let labelObject: CSS2DObject | null = null;
        let labelInner: HTMLDivElement | null = null;
        if (shouldRenderLabels) {
          const { wrapper, inner } = this.createLabelElements(node, resolved.resolvedColor);
          labelInner = inner;
          if (labelTransitionsEnabled && labelTransitionDurationMs > 0) {
            inner.style.transition = `opacity ${labelTransitionDurationMs}ms ease, transform ${labelTransitionDurationMs}ms ease`;
            inner.style.willChange = 'opacity, transform';
          } else {
            inner.style.transition = '';
            inner.style.willChange = '';
          }
          inner.style.opacity = '0';
          inner.style.transform = 'scale(0.96)';

          labelObject = new CSS2DObject(wrapper);
          labelObject.position.copy(object.position).add(this.labelOffset);
          this.scene.add(labelObject);
          labelObject.visible = false;
        }

        this.nodeStates.set(node.id, {
          id: node.id,
          slug: node.slug,
          object,
          material,
          hitMesh,
          label: labelObject,
          labelInner,
          labelTargetVisible: false,
          labelHideAt: null,
          labelShowRaf: null,
          tier: resolved.tier,
          transitionPhase: 'alive',
          transitionStartMs: nowMs,
          transitionDurationMs: 0,
          positionTween: null,
          basePosition: resolved.position.clone(),
          baseScale: resolved.baseScale,
          baseOpacity: resolved.baseOpacity,
          phase: Math.random() * Math.PI * 2,
          baseColor: resolved.resolvedColor,
          hovered: false,
          selected: false,
          pulseStart: null,
          style: resolved.resolvedStyle,
        });
      });
      return;
    }

    if (!shouldRenderLabels) {
      this.nodeStates.forEach((state) => {
        if (state.labelShowRaf !== null) {
          window.cancelAnimationFrame(state.labelShowRaf);
          state.labelShowRaf = null;
        }
        this.removeLabel(state.label);
        state.label = null;
        state.labelInner = null;
        state.labelTargetVisible = false;
        state.labelHideAt = null;
      });
    }

    const nextIds = new Set<string>();
    const seen = new Set<string>();

    nodes.forEach((node) => {
      if (seen.has(node.id)) return;
      seen.add(node.id);
      nextIds.add(node.id);

      const resolved = resolveNode(node);
      const existing = this.nodeStates.get(node.id);
      if (existing) {
        existing.slug = node.slug;
        existing.tier = resolved.tier;
        existing.style = resolved.resolvedStyle;
        existing.baseScale = resolved.baseScale;
        existing.baseOpacity = resolved.baseOpacity;
        existing.baseColor = resolved.resolvedColor;
        this.setMaterialColor(existing.material, resolved.resolvedColor);
        this.setMaterialOpacity(existing.material, resolved.baseOpacity);

        if (existing.hitMesh) {
          const hitScale = this.config.hitTargetScale ?? 1.8;
          existing.hitMesh.scale.setScalar(resolved.baseScale * hitScale);
        }

        if (shouldRenderLabels && !existing.label) {
          const { wrapper, inner } = this.createLabelElements(node, resolved.resolvedColor);
          if (labelTransitionsEnabled && labelTransitionDurationMs > 0) {
            inner.style.transition = `opacity ${labelTransitionDurationMs}ms ease, transform ${labelTransitionDurationMs}ms ease`;
            inner.style.willChange = 'opacity, transform';
          }
          inner.style.opacity = '0';
          inner.style.transform = 'scale(0.96)';
          const labelObject = new CSS2DObject(wrapper);
          labelObject.position.copy(existing.object.position).add(this.labelOffset);
          this.scene.add(labelObject);
          labelObject.visible = false;
          existing.label = labelObject;
          existing.labelInner = inner;
          existing.labelTargetVisible = false;
          existing.labelHideAt = null;
        }

        const distance = existing.basePosition.distanceTo(resolved.position);
        if (distance > 0.001) {
          existing.positionTween = {
            from: existing.basePosition.clone(),
            to: resolved.position.clone(),
            startMs: nowMs,
            durationMs: transitionDurationMs,
          };
        } else {
          existing.basePosition.copy(resolved.position);
          existing.positionTween = null;
        }

        if (existing.transitionPhase === 'exiting') {
          existing.transitionPhase = 'entering';
          existing.transitionStartMs = nowMs;
          existing.transitionDurationMs = transitionDurationMs;
        }
        return;
      }

      const { object, material } = this.createNodeObject(resolved.resolvedColor, resolved.baseOpacity);
      object.position.copy(resolved.position);
      object.scale.setScalar(Math.max(0.001, resolved.baseScale * 0.01));
      object.userData = { nodeId: node.id, nodeSlug: node.slug };
      this.group.add(object);

      let hitMesh: THREE.Mesh | null = null;
      const hitScale = this.config.hitTargetScale ?? 1.8;
      if (this.hitGeometry && hitScale > 0) {
        const hitMaterial = new THREE.MeshBasicMaterial({
          transparent: true,
          opacity: 0,
          depthWrite: false,
        });
        hitMesh = new THREE.Mesh(this.hitGeometry, hitMaterial);
        hitMesh.position.copy(resolved.position);
        hitMesh.scale.setScalar(Math.max(0.001, resolved.baseScale * hitScale * 0.01));
        hitMesh.userData = { nodeId: node.id, nodeSlug: node.slug };
        this.group.add(hitMesh);
      }

      let labelObject: CSS2DObject | null = null;
      let labelInner: HTMLDivElement | null = null;
      if (shouldRenderLabels) {
        const { wrapper, inner } = this.createLabelElements(node, resolved.resolvedColor);
        labelInner = inner;
        if (labelTransitionsEnabled && labelTransitionDurationMs > 0) {
          inner.style.transition = `opacity ${labelTransitionDurationMs}ms ease, transform ${labelTransitionDurationMs}ms ease`;
          inner.style.willChange = 'opacity, transform';
        } else {
          inner.style.transition = '';
          inner.style.willChange = '';
        }
        inner.style.opacity = '0';
        inner.style.transform = 'scale(0.96)';
        labelObject = new CSS2DObject(wrapper);
        labelObject.position.copy(object.position).add(this.labelOffset);
        this.scene.add(labelObject);
        labelObject.visible = false;
      }

      this.setMaterialOpacity(material, 0);

      this.nodeStates.set(node.id, {
        id: node.id,
        slug: node.slug,
        object,
        material,
        hitMesh,
        label: labelObject,
        labelInner,
        labelTargetVisible: false,
        labelHideAt: null,
        labelShowRaf: null,
        tier: resolved.tier,
        transitionPhase: 'entering',
        transitionStartMs: nowMs,
        transitionDurationMs,
        positionTween: null,
        basePosition: resolved.position.clone(),
        baseScale: resolved.baseScale,
        baseOpacity: resolved.baseOpacity,
        phase: Math.random() * Math.PI * 2,
        baseColor: resolved.resolvedColor,
        hovered: false,
        selected: false,
        pulseStart: null,
        style: resolved.resolvedStyle,
      });
    });

    this.nodeStates.forEach((state, id) => {
      if (nextIds.has(id)) return;
      if (state.transitionPhase === 'exiting') return;
      state.transitionPhase = 'exiting';
      state.transitionStartMs = nowMs;
      state.transitionDurationMs = transitionDurationMs;
      state.hovered = false;
      state.selected = false;
      state.pulseStart = null;
      this.setLabelTargetVisible(state, false, nowMs, labelTransitionsEnabled, labelTransitionDurationMs);
    });
  }

  updateNode(nodeId: string, updates: Partial<NeuronVisualNode>): void {
    const state = this.nodeStates.get(nodeId);
    if (!state) return;
    if (updates.position) {
      const next = new THREE.Vector3(...updates.position);
      const transitionsEnabled =
        Boolean(this.config.transitionsEnabled) && Math.max(0, this.config.transitionDurationMs ?? 0) > 0;
      if (transitionsEnabled) {
        const nowMs = performance.now();
        state.positionTween = {
          from: state.basePosition.clone(),
          to: next,
          startMs: nowMs,
          durationMs: Math.max(0, this.config.transitionDurationMs ?? 0),
        };
      } else {
        state.basePosition.copy(next);
        state.object.position.copy(next);
        if (state.hitMesh) {
          state.hitMesh.position.copy(next);
        }
      }
    }
    if (updates.tier) {
      state.tier = updates.tier;
      const tierScale = this.config.tierScales[updates.tier] ?? 1;
      state.baseScale = this.config.baseScale * tierScale * (state.style.scale ?? 1);
      if (state.hitMesh) {
        const hitScale = this.config.hitTargetScale ?? 1.8;
        state.hitMesh.scale.setScalar(state.baseScale * hitScale);
      }
    }
    if (updates.domain) {
      const color = new THREE.Color(
        this.config.domainColors[updates.domain] ?? this.config.defaultColor
      );
      state.baseColor = color;
      this.setMaterialColor(state.material, color);
    }
  }

  removeNode(nodeId: string): void {
    const state = this.nodeStates.get(nodeId);
    if (!state) return;
    if (this.hoveredNodeId === nodeId) {
      this.hoveredNodeId = null;
    }
    if (this.selectedNodeId === nodeId) {
      this.selectedNodeId = null;
    }
    if (state.labelShowRaf !== null) {
      window.cancelAnimationFrame(state.labelShowRaf);
      state.labelShowRaf = null;
    }
    this.removeLabel(state.label);
    this.group.remove(state.object);
    if (state.hitMesh) {
      this.group.remove(state.hitMesh);
    }
    this.nodeStates.delete(nodeId);
  }

  clear(): void {
    this.nodeStates.forEach((state) => {
      if (state.labelShowRaf !== null) {
        window.cancelAnimationFrame(state.labelShowRaf);
        state.labelShowRaf = null;
      }
      this.removeLabel(state.label);
      if (state.hitMesh) {
        this.group.remove(state.hitMesh);
      }
    });
    this.group.clear();
    this.nodeStates.clear();
    this.hoveredNodeId = null;
    this.selectedNodeId = null;
  }

  showNodes(nodeIds: string[]): void {
    nodeIds.forEach((id) => {
      const state = this.nodeStates.get(id);
      if (state) {
        state.object.visible = true;
        if (state.hitMesh) state.hitMesh.visible = true;
      }
    });
  }

  hideNodes(nodeIds: string[]): void {
    nodeIds.forEach((id) => {
      const state = this.nodeStates.get(id);
      if (state) {
        state.object.visible = false;
        if (state.hitMesh) state.hitMesh.visible = false;
      }
    });
  }

  setVisibleNodes(nodeIds: string[] | null): void {
    if (!nodeIds) {
      this.nodeStates.forEach((state) => {
        state.object.visible = true;
      });
      return;
    }
    const visibleSet = new Set(nodeIds);
    this.nodeStates.forEach((state, id) => {
      const visible = visibleSet.has(id);
      state.object.visible = visible;
      if (state.hitMesh) state.hitMesh.visible = visible;
    });
  }

  updateLabelVisibility(camera: THREE.PerspectiveCamera): void {
    const labelVisibility = this.config.labelVisibility ?? 'auto';
    const nowMs = performance.now();
    const transitionsEnabled = Boolean(this.config.labelTransitionsEnabled);
    const transitionDurationMs = Math.max(0, this.config.labelTransitionDurationMs ?? 160);

    this.nodeStates.forEach((state) => {
      if (!state.label) return;
      if (state.labelHideAt !== null && nowMs >= state.labelHideAt) {
        state.label.visible = false;
        state.labelHideAt = null;
      }
      if (!state.object.visible) {
        this.setLabelTargetVisible(state, false, nowMs, transitionsEnabled, transitionDurationMs);
      }
    });

    if (labelVisibility === 'none') {
      this.nodeStates.forEach((state) => {
        if (!state.label) return;
        this.setLabelTargetVisible(state, false, nowMs, transitionsEnabled, transitionDurationMs);
      });
      return;
    }
    if (labelVisibility === 'interaction') {
      this.nodeStates.forEach((state) => {
        if (!state.label) return;
        const visible = state.hovered || state.selected;
        this.setLabelTargetVisible(state, visible, nowMs, transitionsEnabled, transitionDurationMs);
      });
      return;
    }
    if (this.config.maxVisibleLabels <= 0 || this.config.labelDistance <= 0) {
      this.nodeStates.forEach((state) => {
        if (!state.label) return;
        this.setLabelTargetVisible(state, false, nowMs, transitionsEnabled, transitionDurationMs);
      });
      return;
    }

    const maxCount = Math.max(0, this.config.maxVisibleLabels);
    const maxDistance = Math.max(0, this.config.labelDistance);
    const hysteresisMultiplier = 1.08;

    const candidates: Array<{ id: string; state: NodeRenderState; distance: number; priority: number }> = [];
    this.nodeStates.forEach((state, id) => {
      if (!state.label) return;
      const distance = camera.position.distanceTo(state.object.position);
      const tierRule = this.config.labelTierRules?.[state.tier] ?? 'auto';
      const isInteracting = state.hovered || state.selected;
      if (!isInteracting && tierRule === 'none') return;

      const threshold = state.labelTargetVisible ? maxDistance * hysteresisMultiplier : maxDistance;
      if (!isInteracting && distance > threshold) return;

      const priority = isInteracting ? 0 : tierRule === 'always' ? 1 : 2;
      candidates.push({ id, state, distance, priority });
    });

    candidates.sort((a, b) => (a.priority - b.priority ? a.priority - b.priority : a.distance - b.distance));

    const visibleIds = new Set<string>();
    candidates.forEach((entry) => {
      if (entry.priority === 0) {
        visibleIds.add(entry.id);
      }
    });

    const remaining = Math.max(0, maxCount - visibleIds.size);
    let added = 0;
    for (const entry of candidates) {
      if (visibleIds.has(entry.id)) continue;
      if (added >= remaining) break;
      visibleIds.add(entry.id);
      added += 1;
    }

    this.nodeStates.forEach((state, id) => {
      if (!state.label) return;
      this.setLabelTargetVisible(
        state,
        visibleIds.has(id),
        nowMs,
        transitionsEnabled,
        transitionDurationMs
      );
    });
  }

  private createLabelElements(
    node: NeuronVisualNode,
    accent: THREE.Color
  ): { wrapper: HTMLDivElement; inner: HTMLDivElement } {
    const wrapper = document.createElement('div');
    wrapper.style.pointerEvents = 'none';

    const inner = document.createElement('div');
    inner.style.borderRadius = '10px';
    inner.style.border = '1px solid rgba(255, 255, 255, 0.12)';
    inner.style.background = this.config.labelBackground;
    inner.style.color = this.config.labelTextColor;
    inner.style.fontFamily = this.config.labelFontFamily;
    inner.style.fontSize = `${this.config.labelFontSize}px`;
    inner.style.fontWeight = this.config.labelFontWeight;
    inner.style.padding = '6px 8px';
    inner.style.boxShadow = '0 10px 30px rgba(5, 10, 20, 0.35)';
    inner.style.backdropFilter = 'blur(10px)';
    inner.style.maxWidth = '220px';

    const isInsight = node.tier === 'insight' || node.domain === 'insight';
    if (isInsight) {
      const accentBright = accent.clone().lerp(new THREE.Color('#ffffff'), 0.35);
      inner.style.border = `1px solid ${this.toRgba(accentBright, 0.6)}`;
      inner.style.background = this.toRgba(accent, 0.2);
      inner.style.color = this.toRgba(accentBright, 0.95);
    }

    const badgeRow = document.createElement('div');
    badgeRow.style.display = 'flex';
    badgeRow.style.flexWrap = 'wrap';
    badgeRow.style.gap = '4px';
    badgeRow.style.marginBottom = '4px';

    const makeBadge = (text: string, tone: 'accent' | 'muted') => {
      const badge = document.createElement('span');
      badge.textContent = text;
      badge.style.display = 'inline-flex';
      badge.style.alignItems = 'center';
      badge.style.gap = '4px';
      badge.style.borderRadius = '999px';
      badge.style.padding = '2px 6px';
      badge.style.fontSize = '0.6rem';
      badge.style.fontWeight = '600';
      badge.style.textTransform = 'uppercase';
      badge.style.letterSpacing = '0.2em';
      if (tone === 'accent') {
        badge.style.border = `1px solid ${this.toRgba(accent, 0.6)}`;
        badge.style.background = this.toRgba(accent, 0.4);
        badge.style.color = '#f5f7ff';
      } else {
        badge.style.border = '1px solid rgba(255, 255, 255, 0.2)';
        badge.style.background = 'rgba(255, 255, 255, 0.08)';
        badge.style.color = 'rgba(255, 255, 255, 0.8)';
      }
      return badge;
    };

    if (isInsight) {
      badgeRow.appendChild(makeBadge('Insight', 'accent'));
      const statusRaw =
        (node.metadata?.status as string | undefined) ??
        (node.metadata?.draftNodeStatus as string | undefined) ??
        (node.metadata?.studyPathStatus as string | undefined);
      if (statusRaw) {
        const formatted = statusRaw
          .replace(/[_-]/g, ' ')
          .replace(/\b\w/g, (char) => char.toUpperCase());
        badgeRow.appendChild(makeBadge(formatted, 'muted'));
      }
    }

    const tagList = Array.isArray(node.metadata?.tags)
      ? (node.metadata?.tags as string[])
      : Array.isArray(node.metadata?.keywords)
        ? (node.metadata?.keywords as string[])
        : [];
    tagList.slice(0, 2).forEach((tag) => {
      if (typeof tag === 'string' && tag.trim()) {
        badgeRow.appendChild(makeBadge(tag.trim(), 'muted'));
      }
    });

    if (badgeRow.childElementCount > 0) {
      inner.appendChild(badgeRow);
    }

    const title = document.createElement('div');
    title.textContent = node.label;
    title.style.fontSize = '0.8rem';
    title.style.fontWeight = '600';
    inner.appendChild(title);

    if (node.ref) {
      const reference = document.createElement('div');
      reference.textContent = node.ref;
      reference.style.fontSize = '0.65rem';
      reference.style.opacity = '0.7';
      inner.appendChild(reference);
    }

    wrapper.appendChild(inner);
    return { wrapper, inner };
  }

  private toRgba(color: THREE.Color, alpha: number): string {
    const r = Math.round(color.r * 255);
    const g = Math.round(color.g * 255);
    const b = Math.round(color.b * 255);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  private setLabelTargetVisible(
    state: NodeRenderState,
    visible: boolean,
    nowMs: number,
    transitionsEnabled: boolean,
    durationMs: number
  ): void {
    if (!state.label || !state.labelInner) return;
    if (state.labelTargetVisible === visible) return;
    state.labelTargetVisible = visible;

    if (state.labelShowRaf !== null) {
      window.cancelAnimationFrame(state.labelShowRaf);
      state.labelShowRaf = null;
    }
    state.labelHideAt = null;

    if (!transitionsEnabled || durationMs <= 0) {
      state.label.visible = visible;
      state.labelInner.style.opacity = visible ? '1' : '0';
      state.labelInner.style.transform = visible ? 'scale(1)' : 'scale(0.96)';
      return;
    }

    if (visible) {
      state.label.visible = true;
      state.labelInner.style.opacity = '0';
      state.labelInner.style.transform = 'scale(0.96)';
      state.labelShowRaf = window.requestAnimationFrame(() => {
        state.labelShowRaf = null;
        if (!state.label || !state.labelInner) return;
        if (!state.labelTargetVisible) return;
        state.labelInner.style.opacity = '1';
        state.labelInner.style.transform = 'scale(1)';
      });
      return;
    }

    state.labelInner.style.opacity = '0';
    state.labelInner.style.transform = 'scale(0.96)';
    state.labelHideAt = nowMs + durationMs;
  }

  highlightNode(nodeId: string): void {
    this.setHoveredNode(nodeId);
  }

  unhighlightNode(nodeId: string): void {
    if (this.hoveredNodeId === nodeId) {
      this.setHoveredNode(null);
    }
  }

  clearHighlights(): void {
    this.setHoveredNode(null);
  }

  getNodePosition(nodeId: string): THREE.Vector3 | null {
    const state = this.nodeStates.get(nodeId);
    return state ? state.object.position.clone() : null;
  }

  /** Updates a node's position during drag operations */
  updateNodePosition(nodeId: string, position: THREE.Vector3): void {
    const state = this.nodeStates.get(nodeId);
    if (!state) return;

    // Update the base position (used for ambient motion calculations)
    state.basePosition.copy(position);

    // Update the actual object position
    state.object.position.copy(position);

    // Cancel any ongoing position tween
    state.positionTween = null;
  }

  getNodeObject(nodeId: string): THREE.Object3D | null {
    const state = this.nodeStates.get(nodeId);
    return state?.object ?? null;
  }

  getNodeObjects(): THREE.Object3D[] {
    return Array.from(this.nodeStates.values()).map((state) => state.hitMesh ?? state.object);
  }

  hasDynamicPositions(): boolean {
    if (this.config.ambientMotionEnabled) return true;
    return this.hasActiveTransitions();
  }

  hasActiveTransitions(): boolean {
    const transitionsEnabled =
      Boolean(this.config.transitionsEnabled) && Math.max(0, this.config.transitionDurationMs ?? 0) > 0;
    if (!transitionsEnabled) return false;
    for (const state of this.nodeStates.values()) {
      if (state.transitionPhase !== 'alive') return true;
      if (state.positionTween) return true;
    }
    return false;
  }

  getNodePositionsBySlug(target?: Map<string, THREE.Vector3>): Map<string, THREE.Vector3> {
    const out = target ?? new Map<string, THREE.Vector3>();
    out.clear();
    this.nodeStates.forEach((state) => {
      out.set(state.slug, state.object.position);
    });
    return out;
  }

  setHoveredNode(nodeId: string | null): void {
    if (this.hoveredNodeId === nodeId) return;
    if (this.hoveredNodeId) {
      const prev = this.nodeStates.get(this.hoveredNodeId);
      if (prev) prev.hovered = false;
    }
    this.hoveredNodeId = nodeId;
    if (nodeId) {
      const next = this.nodeStates.get(nodeId);
      if (next) next.hovered = true;
    }
  }

  setSelectedNode(nodeId: string | null): void {
    if (this.selectedNodeId === nodeId) return;
    if (this.selectedNodeId) {
      const prev = this.nodeStates.get(this.selectedNodeId);
      if (prev) prev.selected = false;
    }
    this.selectedNodeId = nodeId;
    if (nodeId) {
      const next = this.nodeStates.get(nodeId);
      if (next) next.selected = true;
    }
  }

  pulseNode(nodeId: string): void {
    const state = this.nodeStates.get(nodeId);
    if (!state) return;
    state.pulseStart = performance.now() / 1000;
  }

  update(_: number, elapsed: number): void {
    const nowSeconds = performance.now() / 1000;
    const nowMs = nowSeconds * 1000;
    const transitionsEnabled =
      Boolean(this.config.transitionsEnabled) && Math.max(0, this.config.transitionDurationMs ?? 0) > 0;
    const toRemove: string[] = [];

    this.nodeStates.forEach((state, id) => {
      if (transitionsEnabled && state.positionTween) {
        const duration = Math.max(1, state.positionTween.durationMs);
        const t = Math.min(1, (nowMs - state.positionTween.startMs) / duration);
        const eased = this.easeInOut(t);
        state.basePosition.lerpVectors(state.positionTween.from, state.positionTween.to, eased);
        if (t >= 1) {
          state.basePosition.copy(state.positionTween.to);
          state.positionTween = null;
        }
      }

      let lifecycle = 1;
      if (transitionsEnabled && state.transitionPhase !== 'alive') {
        const duration = Math.max(1, state.transitionDurationMs);
        const t = Math.min(1, (nowMs - state.transitionStartMs) / duration);
        const eased = this.easeInOut(t);
        if (state.transitionPhase === 'entering') {
          lifecycle = eased;
          if (t >= 1) {
            state.transitionPhase = 'alive';
          }
        } else {
          lifecycle = 1 - eased;
          if (t >= 1) {
            toRemove.push(id);
            return;
          }
        }
      }

      if (this.config.ambientMotionEnabled) {
        const { x: driftX, y: drift, z: driftZ } = computeAmbientDrift(
          elapsed,
          state.phase,
          this.config.ambientMotionSpeed,
          this.config.ambientMotionAmplitude
        );
        state.object.position.set(
          state.basePosition.x + driftX,
          state.basePosition.y + drift,
          state.basePosition.z + driftZ
        );
      } else {
        state.object.position.copy(state.basePosition);
      }

      if (state.label) {
        state.label.position.copy(state.object.position).add(this.labelOffset);
      }
      if (state.hitMesh) {
        const hitScale = this.config.hitTargetScale ?? 1.8;
        state.hitMesh.position.copy(state.object.position);
        state.hitMesh.scale.setScalar(state.baseScale * hitScale);
      }

      const hoverScale =
        state.hovered && this.config.enableHoverScale ? this.config.hoverScale : 1;
      const selectedScale = state.selected ? this.config.selectedScale : 1;
      let pulseScale = 0;
      if (state.pulseStart !== null && this.config.enableSelectionPulse) {
        const progress = (nowSeconds - state.pulseStart) / this.config.pulseDuration;
        if (progress >= 1) {
          state.pulseStart = null;
        } else {
          pulseScale = Math.sin(progress * Math.PI) * this.config.pulseScale;
        }
      }
      const targetScale = state.baseScale * hoverScale * selectedScale * (1 + pulseScale) * Math.max(0.001, lifecycle);
      const currentScale = state.object.scale.x;
      const nextScale = currentScale + (targetScale - currentScale) * 0.18;
      state.object.scale.setScalar(nextScale);

      const baseOpacity = state.baseOpacity;
      const hoverOpacity = Math.min(0.95, baseOpacity + 0.12);
      const selectedOpacity = 1;
      const opacity = state.selected
        ? selectedOpacity
        : state.hovered
          ? hoverOpacity
          : baseOpacity;
      this.setMaterialOpacity(state.material, opacity * Math.max(0, Math.min(1, lifecycle)));
      const materialColor = this.getMaterialColor(state.material);
      if (materialColor) {
        materialColor.copy(state.baseColor);
        if (state.selected) {
          materialColor.lerp(this.selectionHighlightColor, 0.25);
        }
      }
    });

    toRemove.forEach((nodeId) => this.removeNode(nodeId));
  }

  dispose(): void {
    this.clear();
    this.scene.remove(this.group);
    this.glowTexture?.dispose();
    this.glowTexture = null;
    this.meshGeometry?.dispose();
    this.meshGeometry = null;
  }

  private removeLabel(label: CSS2DObject | null): void {
    if (!label) return;
    label.removeFromParent();
    label.element?.remove();
  }

  private clamp01(value: number): number {
    return Math.min(1, Math.max(0, value));
  }

  private applyCurve(value01: number, curve: 'linear' | 'sqrt' | 'log' = 'linear'): number {
    const clamped = Math.min(1, Math.max(0, value01));
    if (curve === 'sqrt') {
      return Math.sqrt(clamped);
    }
    if (curve === 'log') {
      // Maps 0..1 → 0..1 with a log-like curve.
      return Math.log10(1 + 9 * clamped);
    }
    return clamped;
  }

  private easeInOut(value01: number): number {
    const value = Math.min(1, Math.max(0, value01));
    return value < 0.5 ? 2 * value * value : 1 - Math.pow(-2 * value + 2, 2) / 2;
  }

  private resolveNodeMapping(node: NeuronVisualNode, rule?: NodeNumberMappingRule): number | undefined {
    if (!rule) return undefined;
    if (typeof rule.value === 'number' && Number.isFinite(rule.value)) {
      return rule.value;
    }
    if (rule.fromField !== 'connectionCount') return undefined;

    const outMin = rule.outputMin;
    const outMax = rule.outputMax;
    if (typeof outMin !== 'number' || typeof outMax !== 'number') return undefined;

    const inputMin = rule.inputMin ?? 0;
    const inputMax = rule.inputMax ?? 24;
    const denom = inputMax - inputMin;
    if (!Number.isFinite(denom) || denom <= 0) return undefined;

    const clamp = rule.clamp ?? true;
    let t = (node.connectionCount - inputMin) / denom;
    if (clamp) {
      t = Math.min(1, Math.max(0, t));
    }
    t = this.applyCurve(t, rule.curve ?? 'linear');

    const value = outMin + (outMax - outMin) * t;
    if (!clamp) return value;
    const lo = Math.min(outMin, outMax);
    const hi = Math.max(outMin, outMax);
    return Math.min(hi, Math.max(lo, value));
  }

  private resolveStyleColor(base: THREE.Color, override?: string): THREE.Color {
    if (!override) return base;
    return new THREE.Color(override);
  }

  private createNodeObject(
    color: THREE.Color,
    opacity: number
  ): { object: THREE.Object3D; material: THREE.Material } {
    if (this.renderMode === 'mesh' && this.meshGeometry) {
      const emissiveIntensity = Math.min(1, Math.max(0, this.config.glowIntensity)) * 0.7;
      const material = new THREE.MeshStandardMaterial({
        color,
        transparent: true,
        opacity,
        depthWrite: false,
        roughness: 0.6,
        metalness: 0.08,
        emissive: color.clone(),
        emissiveIntensity,
      });
      const mesh = new THREE.Mesh(this.meshGeometry, material);
      return { object: mesh, material };
    }

    const material = new THREE.SpriteMaterial({
      map: this.glowTexture ?? undefined,
      color,
      transparent: true,
      opacity,
      depthWrite: false,
    });
    const sprite = new THREE.Sprite(material);
    return { object: sprite, material };
  }

  private getMaterialColor(material: THREE.Material): THREE.Color | null {
    const maybeColor = (material as { color?: unknown }).color;
    return maybeColor instanceof THREE.Color ? maybeColor : null;
  }

  private setMaterialColor(material: THREE.Material, color: THREE.Color): void {
    const materialColor = this.getMaterialColor(material);
    if (materialColor) {
      materialColor.copy(color);
    }
  }

  private setMaterialOpacity(material: THREE.Material, opacity: number): void {
    const maybeOpacity = (material as { opacity?: unknown }).opacity;
    if (typeof maybeOpacity !== 'number') return;
    const cast = material as unknown as { opacity: number; transparent: boolean };
    cast.opacity = this.clamp01(opacity);
    cast.transparent = true;
  }

  private createGlowTexture(): THREE.Texture | null {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, 'rgba(255,255,255,0.95)');
    gradient.addColorStop(0.4, 'rgba(255,255,255,0.45)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }
}
