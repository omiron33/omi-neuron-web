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
}

export class NodeRenderer {
  private group = new THREE.Group();
  private nodeObjects = new Map<string, THREE.Mesh>();

  constructor(private scene: THREE.Scene, private config: NodeRenderConfig) {
    this.scene.add(this.group);
  }

  renderNodes(nodes: NeuronVisualNode[]): void {
    this.clear();
    nodes.forEach((node) => {
      const color = this.config.domainColors[node.domain] ?? this.config.defaultColor;
      const geometry = new THREE.SphereGeometry(this.config.baseScale, 16, 16);
      const material = new THREE.MeshBasicMaterial({ color });
      const mesh = new THREE.Mesh(geometry, material);
      if (node.position) {
        mesh.position.set(...node.position);
      }
      mesh.userData = { nodeId: node.id };
      this.group.add(mesh);
      this.nodeObjects.set(node.id, mesh);
    });
  }

  updateNode(nodeId: string, updates: Partial<NeuronVisualNode>): void {
    const obj = this.nodeObjects.get(nodeId) as THREE.Mesh | undefined;
    if (!obj) return;
    if (updates.position) {
      obj.position.set(...updates.position);
    }
    if (updates.domain) {
      const color = this.config.domainColors[updates.domain] ?? this.config.defaultColor;
      (obj.material as THREE.MeshBasicMaterial).color = new THREE.Color(color);
    }
  }

  removeNode(nodeId: string): void {
    const obj = this.nodeObjects.get(nodeId);
    if (!obj) return;
    this.group.remove(obj);
    this.nodeObjects.delete(nodeId);
  }

  clear(): void {
    this.group.clear();
    this.nodeObjects.clear();
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
      this.nodeObjects.forEach((obj) => {
        obj.visible = true;
      });
      return;
    }
    const visibleSet = new Set(nodeIds);
    this.nodeObjects.forEach((obj, id) => {
      obj.visible = visibleSet.has(id);
    });
  }

  updateLabelVisibility(): void {
    // Labels not implemented in this stub.
  }

  highlightNode(nodeId: string): void {
    const obj = this.nodeObjects.get(nodeId) as THREE.Mesh | undefined;
    if (obj) {
      (obj.material as THREE.MeshBasicMaterial).color = new THREE.Color('#ffffff');
    }
  }

  unhighlightNode(nodeId: string): void {
    const obj = this.nodeObjects.get(nodeId) as THREE.Mesh | undefined;
    if (obj) {
      const color = this.config.defaultColor;
      (obj.material as THREE.MeshBasicMaterial).color = new THREE.Color(color);
    }
  }

  clearHighlights(): void {
    this.nodeObjects.forEach((obj) => {
      (obj.material as THREE.MeshBasicMaterial).color = new THREE.Color(this.config.defaultColor);
    });
  }

  getNodePosition(nodeId: string): THREE.Vector3 | null {
    const obj = this.nodeObjects.get(nodeId);
    return obj ? obj.position.clone() : null;
  }

  getNodeObject(nodeId: string): THREE.Object3D | null {
    return this.nodeObjects.get(nodeId) ?? null;
  }

  dispose(): void {
    this.clear();
    this.scene.remove(this.group);
  }
}
