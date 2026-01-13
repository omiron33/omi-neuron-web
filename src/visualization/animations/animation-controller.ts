import * as THREE from 'three';
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export interface AnimationConfig {
  focusDuration: number;
  transitionDuration: number;
  easing: 'linear' | 'easeInOut' | 'easeOut';
  /**
   * When true, constrains focus animations to 2D plane:
   * - Camera maintains fixed Z-axis direction (no rotation drift)
   * - Focus moves camera parallel to XY plane
   */
  constrainTo2D?: boolean;
}

interface CameraTween {
  startTime: number;
  duration: number;
  startPosition: THREE.Vector3;
  startTarget: THREE.Vector3;
  endPosition: THREE.Vector3;
  endTarget: THREE.Vector3;
  onComplete?: () => void;
}

export class AnimationController {
  private focusTween: CameraTween | null = null;

  constructor(
    private camera: THREE.Camera,
    private controls: OrbitControls,
    private config: AnimationConfig
  ) {}

  focusOnNode(position: THREE.Vector3, callback?: () => void): void {
    const distance = this.camera.position.distanceTo(this.controls.target);
    let direction: THREE.Vector3;

    if (this.config.constrainTo2D) {
      // Fixed Z-axis direction to prevent rotation drift in 2D mode
      direction = new THREE.Vector3(0, 0, 1);
    } else {
      direction = this.camera.position.clone().sub(this.controls.target).normalize();
    }

    const targetPosition = position.clone().add(direction.multiplyScalar(distance));
    this.focusOnPosition(targetPosition, position, callback);
  }

  focusOnPosition(position: THREE.Vector3, target: THREE.Vector3, callback?: () => void): void {
    const duration = Math.max(0, this.config.focusDuration);
    if (duration <= 0) {
      this.focusTween = null;
      this.camera.position.copy(position);
      this.controls.target.copy(target);
      this.controls.update();
      if (callback) callback();
      return;
    }
    const now = performance.now();
    this.focusTween = {
      startTime: now,
      duration,
      startPosition: this.camera.position.clone(),
      startTarget: this.controls.target.clone(),
      endPosition: position.clone(),
      endTarget: target.clone(),
      onComplete: callback,
    };
  }

  resetCamera(): void {
    this.controls.reset();
  }

  cancelFocus(): void {
    this.focusTween = null;
  }

  animateNodeAppear(): void {}

  animateNodeDisappear(): void {}

  animateNodesFilter(): void {}

  animatePath(): void {}

  stopPathAnimation(): void {}

  pause(): void {}

  resume(): void {}

  update(): void {
    if (!this.focusTween) return;
    const now = performance.now();
    if (this.focusTween.duration <= 0) {
      const completion = this.focusTween.onComplete;
      this.focusTween = null;
      if (completion) completion();
      return;
    }
    const elapsed = Math.min(1, (now - this.focusTween.startTime) / this.focusTween.duration);
    const eased = this.applyEasing(elapsed);
    this.camera.position.lerpVectors(
      this.focusTween.startPosition,
      this.focusTween.endPosition,
      eased
    );
    this.controls.target.lerpVectors(
      this.focusTween.startTarget,
      this.focusTween.endTarget,
      eased
    );
    this.controls.update();
    if (elapsed >= 1) {
      const completion = this.focusTween.onComplete;
      this.focusTween = null;
      if (completion) completion();
    }
  }

  dispose(): void {}

  private applyEasing(value: number): number {
    if (this.config.easing === 'linear') return value;
    if (this.config.easing === 'easeOut') return 1 - Math.pow(1 - value, 2);
    // easeInOut
    return value < 0.5 ? 2 * value * value : 1 - Math.pow(-2 * value + 2, 2) / 2;
  }
}
