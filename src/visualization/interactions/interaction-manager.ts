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
  private nodeObjects: THREE.Object3D[] = [];
  private edgeObjects: THREE.Object3D[] = [];
  private nodeLookup = new Map<string, NeuronVisualNode>();
  private edgeLookup = new Map<string, NeuronVisualEdge>();
  private hoverTimeout: number | null = null;
  private lastHoverId: string | null = null;
  private lastClickTime = 0;
  private lastClickId: string | null = null;

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
  ) {
    this.raycaster.params.Line = { threshold: 0.25 };
  }

  onPointerMove(event: PointerEvent): void {
    if (!this.config.enableHover) return;
    this.updatePointer(event);
    const node = this.getIntersectedNode(this.pointer);
    if (this.hoverTimeout) {
      window.clearTimeout(this.hoverTimeout);
    }
    this.hoverTimeout = window.setTimeout(() => {
      if (node?.id !== this.lastHoverId) {
        this.lastHoverId = node?.id ?? null;
        this.onNodeHover(node);
      }
    }, this.config.hoverDelay);
  }

  onPointerDown(): void {}

  onPointerUp(event: PointerEvent): void {
    if (!this.config.enableClick) return;
    this.updatePointer(event);
    const node = this.getIntersectedNode(this.pointer);
    if (node) {
      const now = performance.now();
      const isDouble =
        this.config.enableDoubleClick &&
        now - this.lastClickTime < this.config.doubleClickDelay &&
        this.lastClickId === node.id;
      this.lastClickTime = now;
      this.lastClickId = node.id;
      if (isDouble) {
        this.onNodeDoubleClick(node);
      } else {
        this.onNodeClick(node);
      }
    } else {
      const edge = this.getIntersectedEdge(this.pointer);
      if (edge) {
        this.onEdgeClick(edge);
      } else {
        this.onBackgroundClick();
      }
    }
  }

  onKeyDown(): void {}

  onPointerLeave(): void {
    if (!this.config.enableHover) return;
    if (this.hoverTimeout) {
      window.clearTimeout(this.hoverTimeout);
    }
    this.hoverTimeout = window.setTimeout(() => {
      if (this.lastHoverId !== null) {
        this.lastHoverId = null;
        this.onNodeHover(null);
      }
    }, Math.max(0, this.config.hoverDelay));
  }

  getIntersectedNode(point: THREE.Vector2): NeuronVisualNode | null {
    this.raycaster.setFromCamera(point, this.camera);
    const intersects = this.raycaster.intersectObjects(this.nodeObjects, true);
    if (!intersects.length) return null;
    const hit = intersects[0].object;
    if (!hit.userData?.nodeId) return null;
    return this.nodeLookup.get(hit.userData.nodeId) ?? null;
  }

  getIntersectedEdge(point: THREE.Vector2): NeuronVisualEdge | null {
    this.raycaster.setFromCamera(point, this.camera);
    const intersects = this.raycaster.intersectObjects(this.edgeObjects, true);
    if (!intersects.length) return null;
    let hit: THREE.Object3D | null = intersects[0].object;
    while (hit && !hit.userData?.edgeId) {
      hit = hit.parent;
    }
    if (!hit?.userData?.edgeId) return null;
    return this.edgeLookup.get(hit.userData.edgeId) ?? null;
  }

  dispose(): void {
    if (this.hoverTimeout) {
      window.clearTimeout(this.hoverTimeout);
      this.hoverTimeout = null;
    }
  }

  setTargets(
    nodeObjects: THREE.Object3D[],
    nodeLookup: Map<string, NeuronVisualNode>,
    edgeObjects?: THREE.Object3D[],
    edgeLookup?: Map<string, NeuronVisualEdge>
  ): void {
    this.nodeObjects = nodeObjects;
    this.nodeLookup = nodeLookup;
    this.edgeObjects = edgeObjects ?? [];
    this.edgeLookup = edgeLookup ?? new Map();
  }

  private updatePointer(event: PointerEvent): void {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }
}
