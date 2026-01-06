import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';

export interface SceneConfig {
  backgroundColor: string;
  cameraFov?: number;
  cameraPosition: [number, number, number];
  cameraTarget: [number, number, number];
  minZoom: number;
  maxZoom: number;
  enableStarfield: boolean;
  starfieldCount: number;
  starfieldColor: string;
  pixelRatioCap: number;
  ambientLightIntensity?: number;
  keyLightIntensity?: number;
  fillLightIntensity?: number;
  fogEnabled?: boolean;
  fogColor?: string;
  fogNear?: number;
  fogFar?: number;
}

export class SceneManager {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  labelRenderer: CSS2DRenderer;
  controls: OrbitControls;
  private animationId: number | null = null;
  private lastFrameTime = 0;
  private elapsedTime = 0;
  private frameListeners = new Set<(delta: number, elapsed: number) => void>();
  private starfield: THREE.Points | null = null;
  private ambientLight: THREE.AmbientLight | null = null;
  private keyLight: THREE.DirectionalLight | null = null;
  private fillLight: THREE.PointLight | null = null;
  private resizeObserver: ResizeObserver | null = null;

  constructor(private container: HTMLElement, private config: SceneConfig) {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(config.cameraFov ?? 52, 1, 0.1, 220);
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.labelRenderer = new CSS2DRenderer();
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
  }

  initialize(): void {
    const { cameraPosition, cameraTarget, backgroundColor } = this.config;
    this.scene.background = new THREE.Color(backgroundColor);
    if (this.config.fogEnabled) {
      const fogColor = this.config.fogColor ?? backgroundColor;
      this.scene.fog = new THREE.Fog(fogColor, this.config.fogNear ?? 32, this.config.fogFar ?? 200);
    }
    this.camera.position.set(...cameraPosition);
    this.controls.target.set(...cameraTarget);
    this.controls.minDistance = this.config.minZoom;
    this.controls.maxDistance = this.config.maxZoom;
    this.controls.update();

    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.config.pixelRatioCap));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.NoToneMapping;
    this.renderer.toneMappingExposure = 1;
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.domElement.style.position = 'absolute';
    this.renderer.domElement.style.top = '0';
    this.renderer.domElement.style.left = '0';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.labelRenderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.labelRenderer.domElement.style.position = 'absolute';
    this.labelRenderer.domElement.style.top = '0';
    this.labelRenderer.domElement.style.left = '0';
    this.labelRenderer.domElement.style.pointerEvents = 'none';
    this.labelRenderer.domElement.style.width = '100%';
    this.labelRenderer.domElement.style.height = '100%';

    this.container.appendChild(this.renderer.domElement);
    this.container.appendChild(this.labelRenderer.domElement);

    this.initLights();
    if (this.config.enableStarfield) {
      this.initStarfield();
    }

    window.addEventListener('resize', this.resize);
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => this.resize());
      this.resizeObserver.observe(this.container);
    }
    this.startAnimationLoop();
  }

  dispose(): void {
    this.stopAnimationLoop();
    window.removeEventListener('resize', this.resize);
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.renderer.dispose();
    this.scene.clear();
    this.container.innerHTML = '';
    this.frameListeners.clear();
    this.starfield = null;
    this.ambientLight = null;
    this.keyLight = null;
    this.fillLight = null;
  }

  startAnimationLoop(): void {
    const loop = (time = performance.now()) => {
      if (!this.lastFrameTime) {
        this.lastFrameTime = time;
      }
      const delta = (time - this.lastFrameTime) / 1000;
      this.lastFrameTime = time;
      this.elapsedTime += delta;
      this.frameListeners.forEach((listener) => listener(delta, this.elapsedTime));
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
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
    this.labelRenderer.render(this.scene, this.camera);
  }

  resize = (): void => {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    if (!width || !height) return;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.labelRenderer.setSize(width, height);
  };

  updateBackground(color: string): void {
    this.scene.background = new THREE.Color(color);
    if (this.scene.fog && this.config.fogEnabled) {
      this.scene.fog.color = new THREE.Color(this.config.fogColor ?? color);
    }
    if (this.starfield) {
      (this.starfield.material as THREE.PointsMaterial).color = new THREE.Color(
        this.config.starfieldColor
      );
    }
  }

  updateCamera(position: [number, number, number]): void {
    this.camera.position.set(...position);
  }

  addFrameListener(listener: (delta: number, elapsed: number) => void): () => void {
    this.frameListeners.add(listener);
    return () => this.frameListeners.delete(listener);
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

  private initStarfield(): void {
    const count = Math.max(0, this.config.starfieldCount);
    if (!count) return;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      positions[i * 3] = THREE.MathUtils.randFloatSpread(70);
      positions[i * 3 + 1] = THREE.MathUtils.randFloatSpread(70);
      positions[i * 3 + 2] = THREE.MathUtils.randFloatSpread(70);
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({
      color: this.config.starfieldColor,
      size: 0.22,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
    });
    this.starfield = new THREE.Points(geometry, material);
    this.starfield.name = 'neuron-starfield';
    this.scene.add(this.starfield);
  }

  private initLights(): void {
    const ambientIntensity = this.config.ambientLightIntensity ?? 0.65;
    const keyIntensity = this.config.keyLightIntensity ?? 1.0;
    const fillIntensity = this.config.fillLightIntensity ?? 0.45;

    this.ambientLight = new THREE.AmbientLight('#ffffff', ambientIntensity);
    this.keyLight = new THREE.DirectionalLight('#b6c6ff', keyIntensity);
    this.keyLight.position.set(12, 18, 16);
    this.fillLight = new THREE.PointLight('#5c7aff', fillIntensity, 120, 2.2);
    this.fillLight.position.set(-18, -6, 10);

    this.scene.add(this.ambientLight, this.keyLight, this.fillLight);
  }
}
