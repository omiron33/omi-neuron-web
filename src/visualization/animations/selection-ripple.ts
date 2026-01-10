import * as THREE from 'three';

export interface SelectionRippleConfig {
  color: string;
  duration: number;
  maxScale: number;
  opacity: number;
}

export class SelectionRipple {
  private mesh: THREE.Mesh;
  private material: THREE.MeshBasicMaterial;
  private startTime: number | null = null;
  private baseScale = 1;

  constructor(private scene: THREE.Scene, private config: SelectionRippleConfig) {
    const geometry = new THREE.RingGeometry(0.75, 0.92, 48);
    this.material = new THREE.MeshBasicMaterial({
      color: new THREE.Color(config.color),
      transparent: true,
      opacity: config.opacity,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    this.mesh = new THREE.Mesh(geometry, this.material);
    this.mesh.visible = false;
    this.scene.add(this.mesh);
  }

  trigger(position: THREE.Vector3, baseScale = 1): void {
    this.baseScale = Math.max(0.1, baseScale);
    this.mesh.position.copy(position);
    this.mesh.scale.setScalar(this.baseScale);
    this.mesh.visible = true;
    this.startTime = null;
  }

  update(elapsed: number, camera?: THREE.Camera): void {
    if (!this.mesh.visible) return;
    if (this.startTime === null) {
      this.startTime = elapsed;
    }
    const progress = (elapsed - this.startTime) / this.config.duration;
    if (progress >= 1) {
      this.mesh.visible = false;
      this.startTime = null;
      return;
    }
    if (camera) {
      this.mesh.quaternion.copy(camera.quaternion);
    }
    const eased = 1 - Math.pow(1 - progress, 2);
    const scale = this.baseScale * (1 + eased * this.config.maxScale);
    this.mesh.scale.setScalar(scale);
    this.material.opacity = this.config.opacity * (1 - eased);
  }

  dispose(): void {
    this.scene.remove(this.mesh);
    this.mesh.geometry.dispose();
    this.material.dispose();
  }
}
