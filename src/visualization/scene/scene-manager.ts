import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';

export interface SceneConfig {
  backgroundColor: string;
  cameraPosition: [number, number, number];
  cameraTarget: [number, number, number];
  minZoom: number;
  maxZoom: number;
  enableStarfield: boolean;
  starfieldCount: number;
  pixelRatioCap: number;
}

export class SceneManager {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  labelRenderer: CSS2DRenderer;
  controls: OrbitControls;
  private animationId: number | null = null;

  constructor(private container: HTMLElement, private config: SceneConfig) {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(60, 1, 0.1, 2000);
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.labelRenderer = new CSS2DRenderer();
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
  }

  initialize(): void {
    const { cameraPosition, cameraTarget, backgroundColor } = this.config;
    this.scene.background = new THREE.Color(backgroundColor);
    this.camera.position.set(...cameraPosition);
    this.controls.target.set(...cameraTarget);
    this.controls.update();

    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.config.pixelRatioCap));
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.labelRenderer.setSize(this.container.clientWidth, this.container.clientHeight);

    this.container.appendChild(this.renderer.domElement);
    this.container.appendChild(this.labelRenderer.domElement);

    window.addEventListener('resize', this.resize);
    this.startAnimationLoop();
  }

  dispose(): void {
    this.stopAnimationLoop();
    window.removeEventListener('resize', this.resize);
    this.renderer.dispose();
    this.scene.clear();
    this.container.innerHTML = '';
  }

  startAnimationLoop(): void {
    const loop = () => {
      this.render();
      this.animationId = requestAnimationFrame(loop);
    };
    loop();
  }

  stopAnimationLoop(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  render(): void {
    this.renderer.render(this.scene, this.camera);
    this.labelRenderer.render(this.scene, this.camera);
  }

  resize = (): void => {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.labelRenderer.setSize(width, height);
  };

  updateBackground(color: string): void {
    this.scene.background = new THREE.Color(color);
  }

  updateCamera(position: [number, number, number]): void {
    this.camera.position.set(...position);
  }

  getWorldPosition(screenX: number, screenY: number): THREE.Vector3 {
    return this.screenToWorld(screenX, screenY);
  }

  screenToWorld(x: number, y: number): THREE.Vector3 {
    const rect = this.container.getBoundingClientRect();
    const ndc = new THREE.Vector3(
      ((x - rect.left) / rect.width) * 2 - 1,
      -((y - rect.top) / rect.height) * 2 + 1,
      0.5
    );
    ndc.unproject(this.camera);
    return ndc;
  }

  worldToScreen(position: THREE.Vector3): { x: number; y: number } {
    const vector = position.clone().project(this.camera);
    const rect = this.container.getBoundingClientRect();
    return {
      x: (vector.x * 0.5 + 0.5) * rect.width + rect.left,
      y: (-vector.y * 0.5 + 0.5) * rect.height + rect.top,
    };
  }

  onContextLost = () => {};
  onContextRestored = () => {};
}
