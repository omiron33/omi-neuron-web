import * as THREE from 'three';
import type { NeuronVisualNode, NodeTier } from '../../core/types';

export interface NodeRenderConfig {
  domainColors: Record<string, string>;
  defaultColor: string;
  baseScale: number;
  tierScales: Record<NodeTier, number>;
  glowIntensity: number;
  labelDistance: number;
  maxVisibleLabels: number;
  ambientMotionEnabled: boolean;
  ambientMotionAmplitude: number;
  ambientMotionSpeed: number;
  hoverScale: number;
  selectedScale: number;
  pulseScale: number;
  pulseDuration: number;
}

interface NodeRenderState {
  mesh: THREE.Mesh;
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

  constructor(private scene: THREE.Scene, private config: NodeRenderConfig) {
    this.scene.add(this.group);
  }

  renderNodes(nodes: NeuronVisualNode[]): void {
    this.clear();
    nodes.forEach((node) => {
      const color = new THREE.Color(
        this.config.domainColors[node.domain] ?? this.config.defaultColor
      );
      const geometry = new THREE.SphereGeometry(this.config.baseScale, 18, 18);
      const material = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.45,
        metalness: 0.1,
        emissive: color.clone().multiplyScalar(this.config.glowIntensity * 0.4),
        emissiveIntensity: 1,
      });
      const mesh = new THREE.Mesh(geometry, material);
      const position = new THREE.Vector3();
      if (node.position) {
        position.set(...node.position);
      }
      mesh.position.copy(position);
      const tierScale = node.tier ? this.config.tierScales[node.tier] ?? 1 : 1;
      const baseScale = this.config.baseScale * tierScale;
      mesh.scale.setScalar(baseScale);
      mesh.userData = { nodeId: node.id, nodeSlug: node.slug };
      this.group.add(mesh);
      this.nodeStates.set(node.id, {
        mesh,
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
      state.mesh.position.set(...updates.position);
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
      const material = state.mesh.material as THREE.MeshStandardMaterial;
      material.color = color;
      material.emissive = color.clone().multiplyScalar(this.config.glowIntensity * 0.4);
    }
  }

  removeNode(nodeId: string): void {
    const state = this.nodeStates.get(nodeId);
    if (!state) return;
    this.group.remove(state.mesh);
    this.nodeStates.delete(nodeId);
  }

  clear(): void {
    this.group.clear();
    this.nodeStates.clear();
    this.hoveredNodeId = null;
    this.selectedNodeId = null;
  }

  showNodes(nodeIds: string[]): void {
    nodeIds.forEach((id) => {
      const obj = this.nodeObjects.get(id);
      if (obj) obj.visible = true;
    });
  }

  hideNodes(nodeIds: string[]): void {
    nodeIds.forEach((id) => {
      const obj = this.nodeObjects.get(id);
      if (obj) obj.visible = false;
    });
  }

  setVisibleNodes(nodeIds: string[] | null): void {
    if (!nodeIds) {
      this.nodeStates.forEach((state) => {
        state.mesh.visible = true;
      });
      return;
    }
    const visibleSet = new Set(nodeIds);
    this.nodeStates.forEach((state, id) => {
      state.mesh.visible = visibleSet.has(id);
    });
  }

  updateLabelVisibility(): void {
    // Labels not implemented in this stub.
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
    return state ? state.mesh.position.clone() : null;
  }

  getNodeObject(nodeId: string): THREE.Object3D | null {
    const state = this.nodeStates.get(nodeId);
    return state?.mesh ?? null;
  }

  getNodeObjects(): THREE.Object3D[] {
    return Array.from(this.nodeStates.values()).map((state) => state.mesh);
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
        const drift =
          Math.sin(elapsed * this.config.ambientMotionSpeed + state.phase) *
          this.config.ambientMotionAmplitude;
        const driftX =
          Math.cos(elapsed * this.config.ambientMotionSpeed * 0.6 + state.phase) *
          this.config.ambientMotionAmplitude *
          0.45;
        const driftZ =
          Math.sin(elapsed * this.config.ambientMotionSpeed * 0.4 + state.phase) *
          this.config.ambientMotionAmplitude *
          0.35;
        state.mesh.position.set(
          state.basePosition.x + driftX,
          state.basePosition.y + drift,
          state.basePosition.z + driftZ
        );
      } else {
        state.mesh.position.copy(state.basePosition);
      }

      const hoverScale = state.hovered ? this.config.hoverScale : 1;
      const selectedScale = state.selected ? this.config.selectedScale : 1;
      let pulseScale = 0;
      if (state.pulseStart !== null) {
        const progress = (now - state.pulseStart) / this.config.pulseDuration;
        if (progress >= 1) {
          state.pulseStart = null;
        } else {
          pulseScale = Math.sin(progress * Math.PI) * this.config.pulseScale;
        }
      }
      const targetScale = state.baseScale * hoverScale * selectedScale * (1 + pulseScale);
      const currentScale = state.mesh.scale.x;
      const nextScale = currentScale + (targetScale - currentScale) * 0.18;
      state.mesh.scale.setScalar(nextScale);

      const material = state.mesh.material as THREE.MeshStandardMaterial;
      const emissiveBoost = state.selected ? 0.65 : state.hovered ? 0.45 : 0.25;
      material.emissive = state.baseColor.clone().multiplyScalar(this.config.glowIntensity * emissiveBoost);
    });
  }

  dispose(): void {
    this.clear();
    this.scene.remove(this.group);
  }
}
