import * as THREE from 'three';
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import type { NeuronVisualNode, NodeTier } from '../../core/types';
import { computeAmbientDrift } from '../animations/ambient-motion';

export interface NodeRenderConfig {
  domainColors: Record<string, string>;
  defaultColor: string;
  baseScale: number;
  tierScales: Record<NodeTier, number>;
  glowIntensity: number;
  labelDistance: number;
  maxVisibleLabels: number;
  labelVisibility?: 'auto' | 'interaction' | 'none';
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
}

interface NodeRenderState {
  sprite: THREE.Sprite;
  material: THREE.SpriteMaterial;
  label: CSS2DObject | null;
  basePosition: THREE.Vector3;
  baseScale: number;
  phase: number;
  baseColor: THREE.Color;
  hovered: boolean;
  selected: boolean;
  pulseStart: number | null;
}

export class NodeRenderer {
  private group = new THREE.Group();
  private nodeStates = new Map<string, NodeRenderState>();
  private hoveredNodeId: string | null = null;
  private selectedNodeId: string | null = null;
  private glowTexture: THREE.Texture | null = null;
  private labelOffset = new THREE.Vector3(0, 0.65, 0);

  constructor(private scene: THREE.Scene, private config: NodeRenderConfig) {
    this.scene.add(this.group);
    this.glowTexture = this.createGlowTexture();
    if (config.labelOffset) {
      this.labelOffset.set(...config.labelOffset);
    }
  }

  renderNodes(nodes: NeuronVisualNode[]): void {
    this.clear();
    const seen = new Set<string>();
    const labelVisibility = this.config.labelVisibility ?? 'auto';
    const shouldRenderLabels =
      labelVisibility !== 'none' &&
      (labelVisibility === 'interaction' ||
        (this.config.maxVisibleLabels > 0 && this.config.labelDistance > 0));
    nodes.forEach((node) => {
      if (seen.has(node.id)) return;
      seen.add(node.id);
      const color = new THREE.Color(
        this.config.domainColors[node.domain] ?? this.config.defaultColor
      );
      const material = new THREE.SpriteMaterial({
        map: this.glowTexture ?? undefined,
        color,
        transparent: true,
        opacity: 0.78,
        depthWrite: false,
      });
      const sprite = new THREE.Sprite(material);
      const position = new THREE.Vector3();
      if (node.position) {
        position.set(...node.position);
      }
      sprite.position.copy(position);
      const tierScale = node.tier ? this.config.tierScales[node.tier] ?? 1 : 1;
      const baseScale = this.config.baseScale * tierScale;
      sprite.scale.setScalar(baseScale);
      sprite.userData = { nodeId: node.id, nodeSlug: node.slug };
      this.group.add(sprite);
      let labelObject: CSS2DObject | null = null;
      if (shouldRenderLabels) {
        const labelElement = this.createLabelElement(node, color);
        labelObject = new CSS2DObject(labelElement);
        labelObject.position.copy(sprite.position).add(this.labelOffset);
        this.scene.add(labelObject);
      }
      this.nodeStates.set(node.id, {
        sprite,
        material,
        label: labelObject,
        basePosition: position.clone(),
        baseScale,
        phase: Math.random() * Math.PI * 2,
        baseColor: color,
        hovered: false,
        selected: false,
        pulseStart: null,
      });
    });
  }

  updateNode(nodeId: string, updates: Partial<NeuronVisualNode>): void {
    const state = this.nodeStates.get(nodeId);
    if (!state) return;
    if (updates.position) {
      state.basePosition.set(...updates.position);
      state.sprite.position.set(...updates.position);
    }
    if (updates.tier) {
      const tierScale = this.config.tierScales[updates.tier] ?? 1;
      state.baseScale = this.config.baseScale * tierScale;
    }
    if (updates.domain) {
      const color = new THREE.Color(
        this.config.domainColors[updates.domain] ?? this.config.defaultColor
      );
      state.baseColor = color;
      state.material.color = color;
    }
  }

  removeNode(nodeId: string): void {
    const state = this.nodeStates.get(nodeId);
    if (!state) return;
    this.removeLabel(state.label);
    this.group.remove(state.sprite);
    this.nodeStates.delete(nodeId);
  }

  clear(): void {
    this.nodeStates.forEach((state) => {
      this.removeLabel(state.label);
    });
    this.group.clear();
    this.nodeStates.clear();
    this.hoveredNodeId = null;
    this.selectedNodeId = null;
  }

  showNodes(nodeIds: string[]): void {
    nodeIds.forEach((id) => {
      const state = this.nodeStates.get(id);
      if (state) state.sprite.visible = true;
    });
  }

  hideNodes(nodeIds: string[]): void {
    nodeIds.forEach((id) => {
      const state = this.nodeStates.get(id);
      if (state) state.sprite.visible = false;
    });
  }

  setVisibleNodes(nodeIds: string[] | null): void {
    if (!nodeIds) {
      this.nodeStates.forEach((state) => {
        state.sprite.visible = true;
      });
      return;
    }
    const visibleSet = new Set(nodeIds);
    this.nodeStates.forEach((state, id) => {
      state.sprite.visible = visibleSet.has(id);
    });
  }

  updateLabelVisibility(camera: THREE.PerspectiveCamera): void {
    const labelVisibility = this.config.labelVisibility ?? 'auto';
    if (labelVisibility === 'none') {
      this.nodeStates.forEach((state) => {
        if (state.label) state.label.visible = false;
      });
      return;
    }
    if (labelVisibility === 'interaction') {
      this.nodeStates.forEach((state) => {
        if (state.label) state.label.visible = state.hovered || state.selected;
      });
      return;
    }
    if (this.config.maxVisibleLabels <= 0 || this.config.labelDistance <= 0) {
      this.nodeStates.forEach((state) => {
        if (state.label) state.label.visible = false;
      });
      return;
    }

    const entries: Array<{ state: NodeRenderState; distance: number }> = [];
    this.nodeStates.forEach((state) => {
      if (!state.label) return;
      if (!state.sprite.visible) {
        state.label.visible = false;
        return;
      }
      const distance = camera.position.distanceTo(state.sprite.position);
      entries.push({ state, distance });
    });

    entries.sort((a, b) => a.distance - b.distance);
    entries.forEach((entry, index) => {
      const visible =
        entry.distance <= this.config.labelDistance && index < this.config.maxVisibleLabels;
      entry.state.label!.visible = visible;
    });
  }

  private createLabelElement(node: NeuronVisualNode, accent: THREE.Color): HTMLDivElement {
    const wrapper = document.createElement('div');
    wrapper.style.borderRadius = '10px';
    wrapper.style.border = '1px solid rgba(255, 255, 255, 0.12)';
    wrapper.style.background = this.config.labelBackground;
    wrapper.style.color = this.config.labelTextColor;
    wrapper.style.fontFamily = this.config.labelFontFamily;
    wrapper.style.fontSize = `${this.config.labelFontSize}px`;
    wrapper.style.fontWeight = this.config.labelFontWeight;
    wrapper.style.padding = '6px 8px';
    wrapper.style.boxShadow = '0 10px 30px rgba(5, 10, 20, 0.35)';
    wrapper.style.backdropFilter = 'blur(10px)';
    wrapper.style.pointerEvents = 'none';
    wrapper.style.maxWidth = '220px';

    const isInsight = node.tier === 'insight' || node.domain === 'insight';
    if (isInsight) {
      const accentBright = accent.clone().lerp(new THREE.Color('#ffffff'), 0.35);
      wrapper.style.border = `1px solid ${this.toRgba(accentBright, 0.6)}`;
      wrapper.style.background = this.toRgba(accent, 0.2);
      wrapper.style.color = this.toRgba(accentBright, 0.95);
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
      wrapper.appendChild(badgeRow);
    }

    const title = document.createElement('div');
    title.textContent = node.label;
    title.style.fontSize = '0.8rem';
    title.style.fontWeight = '600';
    wrapper.appendChild(title);

    if (node.ref) {
      const reference = document.createElement('div');
      reference.textContent = node.ref;
      reference.style.fontSize = '0.65rem';
      reference.style.opacity = '0.7';
      wrapper.appendChild(reference);
    }

    return wrapper;
  }

  private toRgba(color: THREE.Color, alpha: number): string {
    const r = Math.round(color.r * 255);
    const g = Math.round(color.g * 255);
    const b = Math.round(color.b * 255);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
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
    return state ? state.sprite.position.clone() : null;
  }

  getNodeObject(nodeId: string): THREE.Object3D | null {
    const state = this.nodeStates.get(nodeId);
    return state?.sprite ?? null;
  }

  getNodeObjects(): THREE.Object3D[] {
    return Array.from(this.nodeStates.values()).map((state) => state.sprite);
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
    const now = performance.now() / 1000;
    this.nodeStates.forEach((state) => {
      if (this.config.ambientMotionEnabled) {
        const { x: driftX, y: drift, z: driftZ } = computeAmbientDrift(
          elapsed,
          state.phase,
          this.config.ambientMotionSpeed,
          this.config.ambientMotionAmplitude
        );
        state.sprite.position.set(
          state.basePosition.x + driftX,
          state.basePosition.y + drift,
          state.basePosition.z + driftZ
        );
      } else {
        state.sprite.position.copy(state.basePosition);
      }

      if (state.label) {
        state.label.position.copy(state.sprite.position).add(this.labelOffset);
      }

      const hoverScale =
        state.hovered && this.config.enableHoverScale ? this.config.hoverScale : 1;
      const selectedScale = state.selected ? this.config.selectedScale : 1;
      let pulseScale = 0;
      if (state.pulseStart !== null && this.config.enableSelectionPulse) {
        const progress = (now - state.pulseStart) / this.config.pulseDuration;
        if (progress >= 1) {
          state.pulseStart = null;
        } else {
          pulseScale = Math.sin(progress * Math.PI) * this.config.pulseScale;
        }
      }
      const targetScale = state.baseScale * hoverScale * selectedScale * (1 + pulseScale);
      const currentScale = state.sprite.scale.x;
      const nextScale = currentScale + (targetScale - currentScale) * 0.18;
      state.sprite.scale.setScalar(nextScale);

      const material = state.material;
      const baseOpacity = 0.78;
      const hoverOpacity = Math.min(0.95, baseOpacity + 0.12);
      const selectedOpacity = 1;
      material.opacity = state.selected
        ? selectedOpacity
        : state.hovered
          ? hoverOpacity
          : baseOpacity;
      material.color.copy(state.baseColor);
      if (state.selected) {
        material.color.lerp(new THREE.Color('#ffffff'), 0.25);
      }
    });
  }

  dispose(): void {
    this.clear();
    this.scene.remove(this.group);
    this.glowTexture?.dispose();
    this.glowTexture = null;
  }

  private removeLabel(label: CSS2DObject | null): void {
    if (!label) return;
    label.removeFromParent();
    label.element?.remove();
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
