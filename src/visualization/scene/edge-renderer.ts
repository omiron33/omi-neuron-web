import * as THREE from 'three';
import type { NeuronVisualEdge } from '../../core/types';

export interface EdgeRenderConfig {
  defaultColor: string;
  activeColor: string;
  selectedColor: string;
  baseOpacity: number;
  strengthOpacityScale: boolean;
  edgeFlowEnabled: boolean;
  edgeFlowSpeed: number;
  focusFadeOpacity: number;
  minStrength: number;
}

interface EdgeRenderState {
  line: THREE.Line;
  baseOpacity: number;
  phase: number;
}

export class EdgeRenderer {
  private group = new THREE.Group();
  private edgeStates = new Map<string, EdgeRenderState>();
  private focusEdges = new Set<string>();

  constructor(private scene: THREE.Scene, private config: EdgeRenderConfig) {
    this.scene.add(this.group);
  }

  renderEdges(edges: NeuronVisualEdge[], nodePositions: Map<string, THREE.Vector3>): void {
    this.clear();
    edges.forEach((edge) => {
      if (this.config.minStrength > 0 && edge.strength < this.config.minStrength) return;
      const from = nodePositions.get(edge.from);
      const to = nodePositions.get(edge.to);
      if (!from || !to) return;
      const geometry = new THREE.BufferGeometry().setFromPoints([from, to]);
      const opacity = this.config.strengthOpacityScale ? edge.strength : this.config.baseOpacity;
      const material = new THREE.LineBasicMaterial({
        color: this.config.defaultColor,
        transparent: true,
        opacity,
        depthWrite: false,
      });
      const line = new THREE.Line(geometry, material);
      line.userData = { edgeId: edge.id };
      this.group.add(line);
      this.edgeStates.set(edge.id, {
        line,
        baseOpacity: opacity,
        phase: Math.random() * Math.PI * 2,
      });
    });
  }

  updateEdge(edgeId: string, updates: Partial<NeuronVisualEdge>): void {
    const state = this.edgeStates.get(edgeId);
    if (!state) return;
    if (updates.strength !== undefined) {
      const opacity = this.config.strengthOpacityScale ? updates.strength : this.config.baseOpacity;
      state.baseOpacity = opacity;
      (state.line.material as THREE.LineBasicMaterial).opacity = opacity;
    }
  }

  removeEdge(edgeId: string): void {
    const state = this.edgeStates.get(edgeId);
    if (!state) return;
    this.group.remove(state.line);
    this.edgeStates.delete(edgeId);
  }

  clear(): void {
    this.group.clear();
    this.edgeStates.clear();
    this.focusEdges.clear();
  }

  filterByStrength(minStrength: number): void {
    this.edgeStates.forEach((state) => {
      state.line.visible = (state.line.material as THREE.LineBasicMaterial).opacity >= minStrength;
    });
  }

  filterByType(): void {
    // Not implemented in stub.
  }

  highlightEdge(edgeId: string): void {
    this.setFocusEdges([edgeId]);
  }

  highlightEdgesForNode(): void {
    // Not implemented in stub.
  }

  unhighlightEdge(edgeId: string): void {
    if (this.focusEdges.has(edgeId)) {
      this.focusEdges.delete(edgeId);
    }
  }

  clearHighlights(): void {
    this.focusEdges.clear();
  }

  showEdges(edgeIds: string[]): void {
    edgeIds.forEach((id) => {
      const state = this.edgeStates.get(id);
      if (state) state.line.visible = true;
    });
  }

  hideEdges(edgeIds: string[]): void {
    edgeIds.forEach((id) => {
      const state = this.edgeStates.get(id);
      if (state) state.line.visible = false;
    });
  }

  setFocusEdges(edgeIds: string[] | null): void {
    this.focusEdges = new Set(edgeIds ?? []);
  }

  update(_: number, elapsed: number): void {
    const hasFocus = this.focusEdges.size > 0;
    this.edgeStates.forEach((state, id) => {
      const material = state.line.material as THREE.LineBasicMaterial;
      const isFocused = this.focusEdges.has(id);
      let opacity = state.baseOpacity;
      if (hasFocus) {
        if (isFocused) {
          const pulse = this.config.edgeFlowEnabled
            ? Math.sin(elapsed * this.config.edgeFlowSpeed + state.phase) * 0.25 + 0.75
            : 1;
          opacity = Math.min(1, state.baseOpacity + pulse * 0.4);
          material.color = new THREE.Color(this.config.activeColor);
        } else {
          opacity = Math.max(0.05, state.baseOpacity * this.config.focusFadeOpacity);
          material.color = new THREE.Color(this.config.defaultColor);
        }
      } else {
        if (this.config.edgeFlowEnabled) {
          const pulse = Math.sin(elapsed * this.config.edgeFlowSpeed + state.phase) * 0.15 + 0.85;
          opacity = Math.min(1, state.baseOpacity * pulse);
        }
        material.color = new THREE.Color(this.config.defaultColor);
      }
      material.opacity = opacity;
    });
  }

  dispose(): void {
    this.clear();
    this.scene.remove(this.group);
  }
}
