import * as THREE from 'three';
import type { NeuronVisualEdge, NeuronVisualNode } from '../../core/types';

export interface InteractionConfig {
  enableHover: boolean;
  enableClick: boolean;
  enableDoubleClick: boolean;
  hoverDelay: number;
  doubleClickDelay: number;
}

export class InteractionManager {
  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2();

  onNodeHover: (node: NeuronVisualNode | null) => void = () => {};
  onNodeClick: (node: NeuronVisualNode) => void = () => {};
  onNodeDoubleClick: (node: NeuronVisualNode) => void = () => {};
  onEdgeClick: (edge: NeuronVisualEdge) => void = () => {};
  onBackgroundClick: () => void = () => {};

  constructor(
    private scene: THREE.Scene,
    private camera: THREE.Camera,
    private renderer: THREE.WebGLRenderer,
    private config: InteractionConfig
  ) {}

  onPointerMove(event: PointerEvent): void {
    if (!this.config.enableHover) return;
    this.updatePointer(event);
    const node = this.getIntersectedNode(this.pointer);
    this.onNodeHover(node);
  }

  onPointerDown(): void {}

  onPointerUp(event: PointerEvent): void {
    if (!this.config.enableClick) return;
    this.updatePointer(event);
    const node = this.getIntersectedNode(this.pointer);
    if (node) {
      this.onNodeClick(node);
    } else {
      this.onBackgroundClick();
    }
  }

  onKeyDown(): void {}

  getIntersectedNode(point: THREE.Vector2): NeuronVisualNode | null {
    this.raycaster.setFromCamera(point, this.camera);
    const intersects = this.raycaster.intersectObjects(this.scene.children, true);
    if (!intersects.length) return null;
    const hit = intersects[0].object;
    if (!hit.userData?.nodeId) return null;
    return { id: hit.userData.nodeId, slug: hit.userData.nodeId, label: hit.userData.nodeId, domain: 'default', metadata: {}, connectionCount: 0 };
  }

  getIntersectedEdge(): NeuronVisualEdge | null {
    return null;
  }

  dispose(): void {
    // no-op
  }

  private updatePointer(event: PointerEvent): void {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }
}
