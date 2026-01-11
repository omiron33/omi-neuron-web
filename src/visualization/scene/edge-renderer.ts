import * as THREE from 'three';
import type { NeuronVisualEdge } from '../../core/types';
import type { EdgeNumberMappingRule, EdgeRenderMode, EdgeStyle, EdgeStyleResolver } from '../types';

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
  transitionsEnabled?: boolean;
  transitionDurationMs?: number;
  mode?: EdgeRenderMode;
  opacityRule?: EdgeNumberMappingRule;
  widthRule?: EdgeNumberMappingRule;
  arrowsEnabled?: boolean;
  arrowScale?: number;
  curveTension?: number;
  curveSegments?: number;
  flowMode?: 'pulse' | 'dash';
  flowDashSize?: number;
  flowGapSize?: number;
  getEdgeStyle?: EdgeStyleResolver;
}

interface EdgeRenderState {
  id: string;
  fromSlug: string;
  toSlug: string;
  mode: EdgeRenderMode;
  curveSign: number;
  usesDashedMaterial: boolean;
  group: THREE.Group;
  line: THREE.Line;
  arrowhead: THREE.Mesh<THREE.ConeGeometry, THREE.MeshBasicMaterial> | null;
  material: THREE.LineBasicMaterial | THREE.LineDashedMaterial;
  baseColor: THREE.Color;
  baseOpacity: number;
  baseWidth: number;
  phase: number;
  lineDistanceAttribute: THREE.BufferAttribute | null;
  lineDistanceBase: Float32Array | null;
  transitionPhase: 'entering' | 'alive' | 'exiting';
  transitionStartMs: number;
  transitionDurationMs: number;
}

export class EdgeRenderer {
  private group = new THREE.Group();
  private edgeStates = new Map<string, EdgeRenderState>();
  private focusEdges = new Set<string>();
  private defaultColor: THREE.Color;
  private activeColor: THREE.Color;
  private selectedColor: THREE.Color;
  private arrowGeometry: THREE.ConeGeometry;
  private up = new THREE.Vector3(0, 1, 0);
  private tempDirection = new THREE.Vector3();

  constructor(private scene: THREE.Scene, private config: EdgeRenderConfig) {
    this.defaultColor = new THREE.Color(config.defaultColor);
    this.activeColor = new THREE.Color(config.activeColor);
    this.selectedColor = new THREE.Color(config.selectedColor);
    this.arrowGeometry = new THREE.ConeGeometry(0.14, 0.44, 10);
    this.scene.add(this.group);
  }

  renderEdges(edges: NeuronVisualEdge[], nodePositions: Map<string, THREE.Vector3>): void {
    const nowMs = performance.now();
    const transitionsEnabled =
      Boolean(this.config.transitionsEnabled) && Math.max(0, this.config.transitionDurationMs ?? 0) > 0;
    const transitionDurationMs = Math.max(0, this.config.transitionDurationMs ?? 0);

    const directedKeys = new Set<string>();
    edges.forEach((edge) => directedKeys.add(`${edge.from}→${edge.to}`));

    if (!transitionsEnabled) {
      this.clear();
      edges.forEach((edge) => {
        if (this.config.minStrength > 0 && edge.strength < this.config.minStrength) return;
        const from = nodePositions.get(edge.from);
        const to = nodePositions.get(edge.to);
        if (!from || !to) return;
        const hasReverse = directedKeys.has(`${edge.to}→${edge.from}`);
        const state = this.createEdgeState(edge, from, to, hasReverse, nowMs, false, 0);
        this.edgeStates.set(edge.id, state);
      });
      return;
    }

    const nextIds = new Set<string>();

    edges.forEach((edge) => {
      if (this.config.minStrength > 0 && edge.strength < this.config.minStrength) return;
      const from = nodePositions.get(edge.from);
      const to = nodePositions.get(edge.to);
      if (!from || !to) return;
      nextIds.add(edge.id);

      const hasReverse = directedKeys.has(`${edge.to}→${edge.from}`);
      const existing = this.edgeStates.get(edge.id);
      if (existing) {
        const updated = this.updateExistingEdgeState(existing, edge, from, to, hasReverse);
        if (!updated) {
          this.removeEdge(edge.id);
          const fresh = this.createEdgeState(edge, from, to, hasReverse, nowMs, true, transitionDurationMs);
          this.edgeStates.set(edge.id, fresh);
          return;
        }
        existing.fromSlug = edge.from;
        existing.toSlug = edge.to;
        if (existing.transitionPhase === 'exiting') {
          existing.transitionPhase = 'entering';
          existing.transitionStartMs = nowMs;
          existing.transitionDurationMs = transitionDurationMs;
        }
        return;
      }

      const fresh = this.createEdgeState(edge, from, to, hasReverse, nowMs, true, transitionDurationMs);
      this.edgeStates.set(edge.id, fresh);
    });

    this.edgeStates.forEach((state, id) => {
      if (nextIds.has(id)) return;
      if (state.transitionPhase === 'exiting') return;
      state.transitionPhase = 'exiting';
      state.transitionStartMs = nowMs;
      state.transitionDurationMs = transitionDurationMs;
      this.focusEdges.delete(id);
    });
  }

  updateEdge(edgeId: string, updates: Partial<NeuronVisualEdge>): void {
    const state = this.edgeStates.get(edgeId);
    if (!state) return;
    if (updates.strength !== undefined) {
      const opacity = this.resolveOpacity({ ...updates, id: edgeId } as NeuronVisualEdge, {});
      state.baseOpacity = opacity;
      state.material.opacity = opacity;
      if (state.arrowhead) {
        state.arrowhead.material.opacity = opacity;
      }
    }
  }

  removeEdge(edgeId: string): void {
    const state = this.edgeStates.get(edgeId);
    if (!state) return;
    this.group.remove(state.group);
    this.edgeStates.delete(edgeId);
    this.focusEdges.delete(edgeId);
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

  getEdgeObjects(): THREE.Object3D[] {
    return Array.from(this.edgeStates.values()).map((state) => state.group);
  }

  updatePositions(nodePositions: Map<string, THREE.Vector3>): void {
    this.edgeStates.forEach((state) => {
      const from = nodePositions.get(state.fromSlug);
      const to = nodePositions.get(state.toSlug);
      if (!from || !to) return;

      const geometry = state.line.geometry as THREE.BufferGeometry;
      const positionAttribute = geometry.getAttribute('position') as THREE.BufferAttribute | undefined;
      if (!positionAttribute) return;
      const positionArray = positionAttribute.array;
      if (!(positionArray instanceof Float32Array)) return;

      if (state.mode === 'curved') {
        const segments = Math.max(1, positionAttribute.count - 1);
        this.writeQuadraticCurve(positionArray, from, to, state.curveSign, segments);
      } else {
        this.writeLinear(positionArray, from, to, positionAttribute.count);
      }
      positionAttribute.needsUpdate = true;

      if (state.lineDistanceAttribute && state.lineDistanceBase) {
        this.updateLineDistances(
          positionArray,
          positionAttribute.count,
          state.lineDistanceAttribute,
          state.lineDistanceBase
        );
      }

      if (state.arrowhead) {
        this.positionArrowheadFromPositions(state.arrowhead, from, to, positionArray, positionAttribute.count);
      }
    });
  }

  update(_: number, elapsed: number): void {
    const nowMs = performance.now();
    const transitionsEnabled =
      Boolean(this.config.transitionsEnabled) && Math.max(0, this.config.transitionDurationMs ?? 0) > 0;
    const toRemove: string[] = [];
    const hasFocus = this.focusEdges.size > 0;
    this.edgeStates.forEach((state, id) => {
      let lifecycle = 1;
      if (transitionsEnabled && state.transitionPhase !== 'alive') {
        const duration = Math.max(1, state.transitionDurationMs);
        const t = Math.min(1, (nowMs - state.transitionStartMs) / duration);
        const eased = this.easeInOut(t);
        if (state.transitionPhase === 'entering') {
          lifecycle = eased;
          if (t >= 1) {
            state.transitionPhase = 'alive';
          }
        } else {
          lifecycle = 1 - eased;
          if (t >= 1) {
            toRemove.push(id);
            return;
          }
        }
      }

      const material = state.material;
      const isFocused = this.focusEdges.has(id);
      let opacity = state.baseOpacity;
      let dashOffset = 0;
      const flowMode = this.config.flowMode ?? 'pulse';
      if (hasFocus) {
        if (isFocused) {
          if (this.config.edgeFlowEnabled && flowMode === 'pulse') {
            const pulse = Math.sin(elapsed * this.config.edgeFlowSpeed + state.phase) * 0.25 + 0.75;
            opacity = Math.min(1, state.baseOpacity + pulse * 0.4);
          } else {
            opacity = Math.min(1, state.baseOpacity + 0.2);
          }
          if (this.config.edgeFlowEnabled && flowMode === 'dash') {
            dashOffset = elapsed * this.config.edgeFlowSpeed + state.phase;
          }
          material.color.copy(this.activeColor);
        } else {
          opacity = Math.max(0.05, state.baseOpacity * this.config.focusFadeOpacity);
          material.color.copy(state.baseColor);
        }
      } else {
        if (this.config.edgeFlowEnabled) {
          if (flowMode === 'pulse') {
            const pulse = Math.sin(elapsed * this.config.edgeFlowSpeed + state.phase) * 0.15 + 0.85;
            opacity = Math.min(1, state.baseOpacity * pulse);
          } else if (flowMode === 'dash') {
            dashOffset = elapsed * this.config.edgeFlowSpeed + state.phase;
          }
        }
        material.color.copy(state.baseColor);
      }
      material.opacity = opacity * Math.max(0, Math.min(1, lifecycle));
      if (state.arrowhead) {
        state.arrowhead.material.opacity = material.opacity;
        state.arrowhead.material.color.copy(material.color);
      }
      if (dashOffset && state.lineDistanceAttribute && state.lineDistanceBase) {
        const array = state.lineDistanceAttribute.array;
        if (array instanceof Float32Array) {
          for (let i = 0; i < array.length && i < state.lineDistanceBase.length; i += 1) {
            array[i] = state.lineDistanceBase[i] + dashOffset;
          }
          state.lineDistanceAttribute.needsUpdate = true;
        }
      }
    });

    toRemove.forEach((edgeId) => this.removeEdge(edgeId));
  }

  dispose(): void {
    this.clear();
    this.scene.remove(this.group);
    this.arrowGeometry.dispose();
  }

  private clamp01(value: number): number {
    return Math.min(1, Math.max(0, value));
  }

  private easeInOut(value01: number): number {
    const value = Math.min(1, Math.max(0, value01));
    return value < 0.5 ? 2 * value * value : 1 - Math.pow(-2 * value + 2, 2) / 2;
  }

  private createEdgeState(
    edge: NeuronVisualEdge,
    from: THREE.Vector3,
    to: THREE.Vector3,
    hasReverse: boolean,
    nowMs: number,
    entering: boolean,
    transitionDurationMs: number
  ): EdgeRenderState {
    const style = this.config.getEdgeStyle?.(edge) ?? {};
    const opacity = this.resolveOpacity(edge, style);
    const width = this.resolveWidth(edge, style);
    const dashed = Boolean(style.dashed);
    const flowMode = this.config.flowMode ?? 'pulse';
    const usesDashedMaterial = dashed || (this.config.edgeFlowEnabled && flowMode === 'dash');
    const baseColor = style.color ? new THREE.Color(style.color) : this.defaultColor.clone();
    const mode: EdgeRenderMode = this.config.mode ?? 'straight';
    const curveSign = mode === 'curved' ? (hasReverse ? (edge.from < edge.to ? 1 : -1) : this.stableHashToSign(edge.id)) : 1;

    const curvePoints = mode === 'curved' ? this.sampleCurve(from, to, edge, hasReverse) : [from, to];
    const geometry = new THREE.BufferGeometry().setFromPoints(curvePoints);

    const material = usesDashedMaterial
      ? new THREE.LineDashedMaterial({
          color: baseColor,
          transparent: true,
          opacity: entering ? 0 : opacity,
          depthWrite: false,
          dashSize: this.config.flowDashSize ?? 0.65,
          gapSize: this.config.flowGapSize ?? 0.45,
          scale: 1,
        })
      : new THREE.LineBasicMaterial({
          color: baseColor,
          transparent: true,
          opacity: entering ? 0 : opacity,
          depthWrite: false,
        });

    this.applyLineWidth(material, width);

    const line = new THREE.Line(geometry, material);
    line.userData = { edgeId: edge.id };
    line.frustumCulled = false;

    let lineDistanceAttribute: THREE.BufferAttribute | null = null;
    let lineDistanceBase: Float32Array | null = null;
    if (usesDashedMaterial) {
      line.computeLineDistances();
      const attribute = geometry.getAttribute('lineDistance') as THREE.BufferAttribute | undefined;
      if (attribute && attribute.array instanceof Float32Array) {
        lineDistanceAttribute = attribute;
        lineDistanceBase = attribute.array.slice() as Float32Array;
      }
    }

    const group = new THREE.Group();
    group.userData = { edgeId: edge.id };
    group.add(line);

    const arrowhead = this.config.arrowsEnabled
      ? this.createArrowhead(edge.id, baseColor, entering ? 0 : opacity, width)
      : null;
    if (arrowhead) {
      arrowhead.frustumCulled = false;
      this.positionArrowhead(arrowhead, from, to, curvePoints);
      group.add(arrowhead);
    }

    this.group.add(group);

    return {
      id: edge.id,
      fromSlug: edge.from,
      toSlug: edge.to,
      mode,
      curveSign,
      usesDashedMaterial,
      group,
      line,
      arrowhead,
      material,
      baseColor,
      baseOpacity: opacity,
      baseWidth: width,
      phase: Math.random() * Math.PI * 2,
      lineDistanceAttribute,
      lineDistanceBase,
      transitionPhase: entering ? 'entering' : 'alive',
      transitionStartMs: nowMs,
      transitionDurationMs: entering ? transitionDurationMs : 0,
    };
  }

  private updateExistingEdgeState(
    existing: EdgeRenderState,
    edge: NeuronVisualEdge,
    from: THREE.Vector3,
    to: THREE.Vector3,
    hasReverse: boolean
  ): boolean {
    const style = this.config.getEdgeStyle?.(edge) ?? {};
    const opacity = this.resolveOpacity(edge, style);
    const width = this.resolveWidth(edge, style);
    const dashed = Boolean(style.dashed);
    const flowMode = this.config.flowMode ?? 'pulse';
    const usesDashedMaterial = dashed || (this.config.edgeFlowEnabled && flowMode === 'dash');
    if (existing.usesDashedMaterial !== usesDashedMaterial) return false;
    if (existing.mode !== (this.config.mode ?? 'straight')) return false;

    existing.baseOpacity = opacity;
    existing.baseWidth = width;
    existing.baseColor.copy(style.color ? new THREE.Color(style.color) : this.defaultColor);

    existing.material.color.copy(existing.baseColor);
    existing.material.opacity = opacity;
    this.applyLineWidth(existing.material, width);

    if (existing.arrowhead) {
      const arrowScale = Math.min(4, Math.max(0.35, (this.config.arrowScale ?? 1) * Math.max(1, width)));
      existing.arrowhead.scale.setScalar(arrowScale);
      existing.arrowhead.material.opacity = existing.material.opacity;
      existing.arrowhead.material.color.copy(existing.material.color);
    }

    if (existing.mode === 'curved') {
      existing.curveSign = hasReverse
        ? edge.from < edge.to
          ? 1
          : -1
        : this.stableHashToSign(edge.id);
      const geometry = existing.line.geometry as THREE.BufferGeometry;
      const positionAttribute = geometry.getAttribute('position') as THREE.BufferAttribute | undefined;
      const positionArray = positionAttribute?.array;
      if (positionAttribute && positionArray instanceof Float32Array) {
        const segments = Math.max(1, positionAttribute.count - 1);
        this.writeQuadraticCurve(positionArray, from, to, existing.curveSign, segments);
        positionAttribute.needsUpdate = true;
        if (existing.lineDistanceAttribute && existing.lineDistanceBase) {
          this.updateLineDistances(
            positionArray,
            positionAttribute.count,
            existing.lineDistanceAttribute,
            existing.lineDistanceBase
          );
        }
        if (existing.arrowhead) {
          this.positionArrowheadFromPositions(existing.arrowhead, from, to, positionArray, positionAttribute.count);
        }
      }
    }

    return true;
  }

  private writeLinear(array: Float32Array, from: THREE.Vector3, to: THREE.Vector3, points: number): void {
    const count = Math.max(2, points);
    for (let i = 0; i < count; i += 1) {
      const t = count <= 1 ? 1 : i / (count - 1);
      const idx = i * 3;
      if (idx + 2 >= array.length) break;
      array[idx] = from.x + (to.x - from.x) * t;
      array[idx + 1] = from.y + (to.y - from.y) * t;
      array[idx + 2] = from.z + (to.z - from.z) * t;
    }
  }

  private writeQuadraticCurve(
    array: Float32Array,
    from: THREE.Vector3,
    to: THREE.Vector3,
    sign: number,
    segments: number
  ): void {
    const points = Math.max(2, segments + 1);
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const dz = to.z - from.z;
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (!Number.isFinite(distance) || distance <= 0.0001 || !Number.isFinite(sign)) {
      this.writeLinear(array, from, to, points);
      return;
    }

    const invDistance = 1 / distance;
    const dirX = dx * invDistance;
    const dirY = dy * invDistance;
    const dirZ = dz * invDistance;

    // perp = dir x up(0,1,0) => (-dirZ, 0, dirX)
    let perpX = -dirZ;
    let perpY = 0;
    let perpZ = dirX;
    let perpLen = Math.sqrt(perpX * perpX + perpY * perpY + perpZ * perpZ);
    if (perpLen < 1e-6) {
      // dir x (1,0,0) => (0, dirZ, -dirY)
      perpX = 0;
      perpY = dirZ;
      perpZ = -dirY;
      perpLen = Math.sqrt(perpX * perpX + perpY * perpY + perpZ * perpZ);
    }
    if (perpLen < 1e-6) {
      this.writeLinear(array, from, to, points);
      return;
    }
    perpX /= perpLen;
    perpY /= perpLen;
    perpZ /= perpLen;

    const tension = Math.min(0.9, Math.max(0, this.config.curveTension ?? 0.18));
    const scale = distance * tension * sign;

    const midX = (from.x + to.x) * 0.5;
    const midY = (from.y + to.y) * 0.5;
    const midZ = (from.z + to.z) * 0.5;

    const ctrlX = midX + perpX * scale;
    const ctrlY = midY + perpY * scale;
    const ctrlZ = midZ + perpZ * scale;

    const seg = Math.max(1, segments);
    for (let i = 0; i <= seg; i += 1) {
      const t = i / seg;
      const inv = 1 - t;
      const inv2 = inv * inv;
      const t2 = t * t;
      const k = 2 * inv * t;
      const x = inv2 * from.x + k * ctrlX + t2 * to.x;
      const y = inv2 * from.y + k * ctrlY + t2 * to.y;
      const z = inv2 * from.z + k * ctrlZ + t2 * to.z;
      const idx = i * 3;
      if (idx + 2 >= array.length) break;
      array[idx] = x;
      array[idx + 1] = y;
      array[idx + 2] = z;
    }
  }

  private updateLineDistances(
    positionArray: Float32Array,
    pointCount: number,
    attribute: THREE.BufferAttribute,
    base: Float32Array
  ): void {
    const array = attribute.array;
    if (!(array instanceof Float32Array)) return;
    const count = Math.min(pointCount, attribute.count, base.length, array.length);
    if (count <= 0) return;
    let cumulative = 0;
    base[0] = 0;
    array[0] = 0;
    let prevX = positionArray[0] ?? 0;
    let prevY = positionArray[1] ?? 0;
    let prevZ = positionArray[2] ?? 0;
    for (let i = 1; i < count; i += 1) {
      const idx = i * 3;
      const x = positionArray[idx] ?? prevX;
      const y = positionArray[idx + 1] ?? prevY;
      const z = positionArray[idx + 2] ?? prevZ;
      const dx = x - prevX;
      const dy = y - prevY;
      const dz = z - prevZ;
      cumulative += Math.sqrt(dx * dx + dy * dy + dz * dz);
      base[i] = cumulative;
      array[i] = cumulative;
      prevX = x;
      prevY = y;
      prevZ = z;
    }
    attribute.needsUpdate = true;
  }

  private positionArrowheadFromPositions(
    arrow: THREE.Mesh<THREE.ConeGeometry, THREE.MeshBasicMaterial>,
    from: THREE.Vector3,
    to: THREE.Vector3,
    positionArray: Float32Array,
    pointCount: number
  ): void {
    let dirX = to.x - from.x;
    let dirY = to.y - from.y;
    let dirZ = to.z - from.z;
    if (pointCount >= 2) {
      const prevIndex = (pointCount - 2) * 3;
      const prevX = positionArray[prevIndex] ?? from.x;
      const prevY = positionArray[prevIndex + 1] ?? from.y;
      const prevZ = positionArray[prevIndex + 2] ?? from.z;
      dirX = to.x - prevX;
      dirY = to.y - prevY;
      dirZ = to.z - prevZ;
    }
    const len = Math.sqrt(dirX * dirX + dirY * dirY + dirZ * dirZ);
    if (len < 1e-6) {
      this.tempDirection.set(0, 1, 0);
    } else {
      this.tempDirection.set(dirX / len, dirY / len, dirZ / len);
    }

    const baseClearance = 0.8;
    const arrowLength = 0.44 * arrow.scale.y;
    const tipX = to.x - this.tempDirection.x * baseClearance;
    const tipY = to.y - this.tempDirection.y * baseClearance;
    const tipZ = to.z - this.tempDirection.z * baseClearance;
    const originX = tipX - this.tempDirection.x * (arrowLength * 0.5);
    const originY = tipY - this.tempDirection.y * (arrowLength * 0.5);
    const originZ = tipZ - this.tempDirection.z * (arrowLength * 0.5);
    arrow.position.set(originX, originY, originZ);
    arrow.quaternion.setFromUnitVectors(this.up, this.tempDirection);
  }

  private applyCurve(value01: number, curve: 'linear' | 'sqrt' | 'log' = 'linear'): number {
    const clamped = Math.min(1, Math.max(0, value01));
    if (curve === 'sqrt') {
      return Math.sqrt(clamped);
    }
    if (curve === 'log') {
      return Math.log10(1 + 9 * clamped);
    }
    return clamped;
  }

  private resolveEdgeMapping(strength: number, rule?: EdgeNumberMappingRule): number | undefined {
    if (!rule) return undefined;
    if (typeof rule.value === 'number' && Number.isFinite(rule.value)) {
      return rule.value;
    }
    if (rule.fromField !== 'strength') return undefined;
    const outMin = rule.outputMin;
    const outMax = rule.outputMax;
    if (typeof outMin !== 'number' || typeof outMax !== 'number') return undefined;

    const inputMin = rule.inputMin ?? 0;
    const inputMax = rule.inputMax ?? 1;
    const denom = inputMax - inputMin;
    if (!Number.isFinite(denom) || denom <= 0) return undefined;

    const clamp = rule.clamp ?? true;
    let t = (strength - inputMin) / denom;
    if (clamp) {
      t = Math.min(1, Math.max(0, t));
    }
    t = this.applyCurve(t, rule.curve ?? 'linear');

    const value = outMin + (outMax - outMin) * t;
    if (!clamp) return value;
    const lo = Math.min(outMin, outMax);
    const hi = Math.max(outMin, outMax);
    return Math.min(hi, Math.max(lo, value));
  }

  private resolveOpacity(edge: NeuronVisualEdge, style: EdgeStyle): number {
    if (typeof style.opacity === 'number' && Number.isFinite(style.opacity)) {
      return this.clamp01(style.opacity);
    }
    const mapped = this.resolveEdgeMapping(edge.strength, this.config.opacityRule);
    if (typeof mapped === 'number' && Number.isFinite(mapped)) {
      return this.clamp01(mapped);
    }
    if (this.config.strengthOpacityScale) {
      return this.clamp01(edge.strength);
    }
    return this.clamp01(this.config.baseOpacity);
  }

  private resolveWidth(edge: NeuronVisualEdge, style: EdgeStyle): number {
    if (typeof style.width === 'number' && Number.isFinite(style.width)) {
      return Math.max(0.1, style.width);
    }
    const mapped = this.resolveEdgeMapping(edge.strength, this.config.widthRule);
    if (typeof mapped === 'number' && Number.isFinite(mapped)) {
      return Math.max(0.1, mapped);
    }
    return 1;
  }

  private applyLineWidth(material: THREE.LineBasicMaterial | THREE.LineDashedMaterial, width: number): void {
    const cast = material as unknown as { linewidth?: number };
    if (typeof cast.linewidth === 'number') {
      cast.linewidth = width;
    }
  }

  private stableHashToSign(value: string): number {
    let hash = 0;
    for (let i = 0; i < value.length; i += 1) {
      hash = (hash << 5) - hash + value.charCodeAt(i);
      hash |= 0;
    }
    return hash % 2 === 0 ? 1 : -1;
  }

  private sampleCurve(
    from: THREE.Vector3,
    to: THREE.Vector3,
    edge: NeuronVisualEdge,
    hasReverse: boolean
  ): THREE.Vector3[] {
    const dir = new THREE.Vector3().subVectors(to, from);
    const distance = dir.length();
    if (!Number.isFinite(distance) || distance <= 0.0001) return [from, to];

    dir.normalize();
    const up = new THREE.Vector3(0, 1, 0);
    let perp = new THREE.Vector3().crossVectors(dir, up);
    if (perp.lengthSq() < 1e-6) {
      perp = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(1, 0, 0));
    }
    perp.normalize();

    const midpoint = new THREE.Vector3().addVectors(from, to).multiplyScalar(0.5);
    const tension = Math.min(0.9, Math.max(0, this.config.curveTension ?? 0.18));
    const sign = hasReverse ? (edge.from < edge.to ? 1 : -1) : this.stableHashToSign(edge.id);
    const control = midpoint.add(perp.multiplyScalar(distance * tension * sign));

    const segments = Math.min(64, Math.max(4, Math.round(this.config.curveSegments ?? 16)));
    const curve = new THREE.QuadraticBezierCurve3(from, control, to);
    return curve.getPoints(segments);
  }

  private createArrowhead(
    edgeId: string,
    color: THREE.Color,
    opacity: number,
    width: number
  ): THREE.Mesh<THREE.ConeGeometry, THREE.MeshBasicMaterial> {
    const arrowScale = Math.min(4, Math.max(0.35, (this.config.arrowScale ?? 1) * Math.max(1, width)));
    const material = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(this.arrowGeometry, material);
    mesh.userData = { edgeId };
    mesh.scale.setScalar(arrowScale);
    return mesh;
  }

  private positionArrowhead(
    arrow: THREE.Mesh<THREE.ConeGeometry, THREE.MeshBasicMaterial>,
    from: THREE.Vector3,
    to: THREE.Vector3,
    points: THREE.Vector3[]
  ): void {
    const direction = new THREE.Vector3();
    if (points.length > 2) {
      const a = points[Math.max(0, points.length - 2)];
      direction.subVectors(to, a);
    } else {
      direction.subVectors(to, from);
    }
    if (direction.lengthSq() < 1e-6) {
      direction.set(0, 1, 0);
    } else {
      direction.normalize();
    }

    const baseClearance = 0.8;
    const arrowLength = 0.44 * arrow.scale.y;
    const tipPosition = new THREE.Vector3().copy(to).sub(direction.clone().multiplyScalar(baseClearance));
    const origin = tipPosition.sub(direction.clone().multiplyScalar(arrowLength * 0.5));
    arrow.position.copy(origin);
    arrow.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
  }
}
