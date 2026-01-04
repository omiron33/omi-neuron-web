import * as THREE from 'three';
import type { NeuronVisualEdge } from '../../core/types';

export interface EdgeRenderConfig {
  defaultColor: string;
  activeColor: string;
  selectedColor: string;
  baseOpacity: number;
  strengthOpacityScale: boolean;
}

export class EdgeRenderer {
  private group = new THREE.Group();
  private edgeObjects = new Map<string, THREE.Line>();

  constructor(private scene: THREE.Scene, private config: EdgeRenderConfig) {
    this.scene.add(this.group);
  }

  renderEdges(edges: NeuronVisualEdge[], nodePositions: Map<string, THREE.Vector3>): void {
    this.clear();
    edges.forEach((edge) => {
      const from = nodePositions.get(edge.from);
      const to = nodePositions.get(edge.to);
      if (!from || !to) return;
      const geometry = new THREE.BufferGeometry().setFromPoints([from, to]);
      const opacity = this.config.strengthOpacityScale ? edge.strength : this.config.baseOpacity;
      const material = new THREE.LineBasicMaterial({ color: this.config.defaultColor, transparent: true, opacity });
      const line = new THREE.Line(geometry, material);
      line.userData = { edgeId: edge.id };
      this.group.add(line);
      this.edgeObjects.set(edge.id, line);
    });
  }

  updateEdge(edgeId: string, updates: Partial<NeuronVisualEdge>): void {
    const line = this.edgeObjects.get(edgeId);
    if (!line) return;
    if (updates.strength !== undefined) {
      const opacity = this.config.strengthOpacityScale ? updates.strength : this.config.baseOpacity;
      (line.material as THREE.LineBasicMaterial).opacity = opacity;
    }
  }

  removeEdge(edgeId: string): void {
    const line = this.edgeObjects.get(edgeId);
    if (!line) return;
    this.group.remove(line);
    this.edgeObjects.delete(edgeId);
  }

  clear(): void {
    this.group.clear();
    this.edgeObjects.clear();
  }

  filterByStrength(minStrength: number): void {
    this.edgeObjects.forEach((line) => {
      line.visible = (line.material as THREE.LineBasicMaterial).opacity >= minStrength;
    });
  }

  filterByType(): void {
    // Not implemented in stub.
  }

  highlightEdge(edgeId: string): void {
    const line = this.edgeObjects.get(edgeId);
    if (line) {
      (line.material as THREE.LineBasicMaterial).color = new THREE.Color(this.config.activeColor);
    }
  }

  highlightEdgesForNode(): void {
    // Not implemented in stub.
  }

  unhighlightEdge(edgeId: string): void {
    const line = this.edgeObjects.get(edgeId);
    if (line) {
      (line.material as THREE.LineBasicMaterial).color = new THREE.Color(this.config.defaultColor);
    }
  }

  clearHighlights(): void {
    this.edgeObjects.forEach((line) => {
      (line.material as THREE.LineBasicMaterial).color = new THREE.Color(this.config.defaultColor);
    });
  }

  showEdges(edgeIds: string[]): void {
    edgeIds.forEach((id) => {
      const line = this.edgeObjects.get(id);
      if (line) line.visible = true;
    });
  }

  hideEdges(edgeIds: string[]): void {
    edgeIds.forEach((id) => {
      const line = this.edgeObjects.get(id);
      if (line) line.visible = false;
    });
  }

  dispose(): void {
    this.clear();
    this.scene.remove(this.group);
  }
}
