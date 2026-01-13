import * as THREE from 'three';
import type { NeuronVisualEdge, NeuronVisualNode } from '../../core/types';

export interface InteractionConfig {
  enableHover: boolean;
  enableClick: boolean;
  enableDoubleClick: boolean;
  enableDrag: boolean;
  hoverDelay: number;
  doubleClickDelay: number;
  /** Plane to constrain drag movements to. Default: 'xy' */
  dragConstrainPlane: 'xy' | 'xz' | 'yz';
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

  // Drag state
  private isDragging = false;
  private dragNode: NeuronVisualNode | null = null;
  private dragPlane = new THREE.Plane();
  private dragOffset = new THREE.Vector3();
  private dragIntersection = new THREE.Vector3();
  private pointerDownPosition = new THREE.Vector2();
  private dragThreshold = 5; // pixels

  onNodeHover: (node: NeuronVisualNode | null) => void = () => {};
  onNodeClick: (node: NeuronVisualNode) => void = () => {};
  onNodeDoubleClick: (node: NeuronVisualNode) => void = () => {};
  onEdgeClick: (edge: NeuronVisualEdge) => void = () => {};
  onBackgroundClick: () => void = () => {};
  onNodeDragStart: (node: NeuronVisualNode, position: THREE.Vector3) => void = () => {};
  onNodeDrag: (node: NeuronVisualNode, position: THREE.Vector3) => void = () => {};
  onNodeDragEnd: (node: NeuronVisualNode, position: THREE.Vector3) => void = () => {};

  constructor(
    private scene: THREE.Scene,
    private camera: THREE.Camera,
    private renderer: THREE.WebGLRenderer,
    private config: InteractionConfig
  ) {
    this.raycaster.params.Line = { threshold: 0.25 };
  }

  onPointerMove(event: PointerEvent): void {
    this.updatePointer(event);

    // Handle dragging
    if (this.config.enableDrag && this.dragNode) {
      // Check if we've moved enough to start dragging
      if (!this.isDragging) {
        const dx = (this.pointer.x - this.pointerDownPosition.x) * this.renderer.domElement.clientWidth;
        const dy = (this.pointer.y - this.pointerDownPosition.y) * this.renderer.domElement.clientHeight;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance > this.dragThreshold) {
          this.isDragging = true;
          const nodeObject = this.nodeObjects.find(
            (obj) => obj.userData?.nodeId === this.dragNode!.id
          );
          if (nodeObject) {
            this.onNodeDragStart(this.dragNode, nodeObject.position.clone());
          }
        }
      }

      // Update position during drag
      if (this.isDragging) {
        this.raycaster.setFromCamera(this.pointer, this.camera);
        if (this.raycaster.ray.intersectPlane(this.dragPlane, this.dragIntersection)) {
          const newPosition = this.dragIntersection.clone().add(this.dragOffset);
          this.onNodeDrag(this.dragNode, newPosition);
        }
        return; // Skip hover handling during drag
      }
    }

    // Handle hover
    if (!this.config.enableHover) return;
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

  onPointerDown(event: PointerEvent): void {
    if (!this.config.enableDrag) return;

    this.updatePointer(event);
    this.pointerDownPosition.copy(this.pointer);

    const node = this.getIntersectedNode(this.pointer);
    if (node) {
      // Get the node's 3D object to find its position
      const nodeObject = this.nodeObjects.find(
        (obj) => obj.userData?.nodeId === node.id
      );
      if (nodeObject) {
        // Set up drag plane based on config
        const normal = this.getPlaneNormal();
        this.dragPlane.setFromNormalAndCoplanarPoint(normal, nodeObject.position);

        // Calculate offset from intersection to node center
        this.raycaster.setFromCamera(this.pointer, this.camera);
        if (this.raycaster.ray.intersectPlane(this.dragPlane, this.dragIntersection)) {
          this.dragOffset.copy(nodeObject.position).sub(this.dragIntersection);
          this.dragNode = node;
        }
      }
    }
  }

  private getPlaneNormal(): THREE.Vector3 {
    switch (this.config.dragConstrainPlane) {
      case 'xz':
        return new THREE.Vector3(0, 1, 0);
      case 'yz':
        return new THREE.Vector3(1, 0, 0);
      case 'xy':
      default:
        return new THREE.Vector3(0, 0, 1);
    }
  }

  /** Returns true if currently dragging a node */
  get dragging(): boolean {
    return this.isDragging;
  }

  onPointerUp(event: PointerEvent): void {
    this.updatePointer(event);

    // Handle drag end
    if (this.isDragging && this.dragNode) {
      this.raycaster.setFromCamera(this.pointer, this.camera);
      if (this.raycaster.ray.intersectPlane(this.dragPlane, this.dragIntersection)) {
        const finalPosition = this.dragIntersection.clone().add(this.dragOffset);
        this.onNodeDragEnd(this.dragNode, finalPosition);
      }
      this.isDragging = false;
      this.dragNode = null;
      return; // Don't trigger click after drag
    }

    // Reset drag state even if not dragging
    this.dragNode = null;

    if (!this.config.enableClick) return;
    const node = this.getIntersectedNode(this.pointer);
    if (node) {
      const now = performance.now();
      const isDouble =
        this.config.enableDoubleClick &&
        now - this.lastClickTime < this.config.doubleClickDelay &&
        this.lastClickId === node.id;
      if (
        !this.config.enableDoubleClick &&
        now - this.lastClickTime < this.config.doubleClickDelay &&
        this.lastClickId === node.id
      ) {
        this.lastClickTime = now;
        this.lastClickId = node.id;
        return;
      }
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
