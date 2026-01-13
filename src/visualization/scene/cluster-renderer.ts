/**
 * ClusterRenderer - Renders convex hull boundaries around static clusters
 *
 * Visualizes cluster groupings with semi-transparent boundaries and labels.
 * Used for static/authored clusters with explicit node membership.
 */

import * as THREE from 'three';
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import type { NeuronVisualCluster } from '../../core/types';

export interface ClusterRenderConfig {
  /** Default cluster color if not specified per-cluster */
  defaultColor: string;
  /** Fill opacity for cluster boundary (0-1) */
  fillOpacity: number;
  /** Stroke/border opacity for cluster boundary (0-1) */
  strokeOpacity: number;
  /** Stroke width for cluster boundary */
  strokeWidth: number;
  /** Font family for cluster labels */
  labelFontFamily: string;
  /** Font size for cluster labels */
  labelFontSize: number;
  /** Text color for cluster labels */
  labelTextColor: string;
  /** Background color for cluster labels */
  labelBackground: string;
  /** Enable/disable transitions */
  transitionsEnabled?: boolean;
  /** Transition duration in ms */
  transitionDurationMs?: number;
  /** Vertical offset for cluster plane (to render behind nodes) */
  zOffset?: number;
  /** Padding around convex hull points */
  hullPadding?: number;
}

interface ClusterRenderState {
  id: string;
  mesh: THREE.Mesh | null;
  outline: THREE.Line | null;
  label: CSS2DObject | null;
  labelElement: HTMLDivElement | null;
  color: THREE.Color;
  centroid: THREE.Vector3;
  lastNodePositions: Map<string, THREE.Vector3>;
}

/**
 * Compute 2D convex hull using Graham scan algorithm
 * Projects 3D points to XY plane for hull computation
 */
function computeConvexHull2D(points: THREE.Vector3[]): THREE.Vector2[] {
  if (points.length < 3) {
    return points.map((p) => new THREE.Vector2(p.x, p.y));
  }

  // Project to 2D
  const points2D = points.map((p) => new THREE.Vector2(p.x, p.y));

  // Find the bottom-most point (lowest y, then leftmost x)
  let minIdx = 0;
  for (let i = 1; i < points2D.length; i++) {
    if (
      points2D[i].y < points2D[minIdx].y ||
      (points2D[i].y === points2D[minIdx].y && points2D[i].x < points2D[minIdx].x)
    ) {
      minIdx = i;
    }
  }

  // Swap min point to first position
  [points2D[0], points2D[minIdx]] = [points2D[minIdx], points2D[0]];
  const pivot = points2D[0];

  // Sort by polar angle with respect to pivot
  const rest = points2D.slice(1).sort((a, b) => {
    const angleA = Math.atan2(a.y - pivot.y, a.x - pivot.x);
    const angleB = Math.atan2(b.y - pivot.y, b.x - pivot.x);
    if (angleA !== angleB) return angleA - angleB;
    // If same angle, closer point comes first
    return a.distanceTo(pivot) - b.distanceTo(pivot);
  });

  // Graham scan
  const hull: THREE.Vector2[] = [pivot];

  for (const point of rest) {
    // Remove points that make clockwise turn
    while (hull.length > 1) {
      const top = hull[hull.length - 1];
      const nextToTop = hull[hull.length - 2];
      const cross =
        (top.x - nextToTop.x) * (point.y - nextToTop.y) -
        (top.y - nextToTop.y) * (point.x - nextToTop.x);
      if (cross <= 0) {
        hull.pop();
      } else {
        break;
      }
    }
    hull.push(point);
  }

  return hull;
}

/**
 * Expand hull points outward by padding amount
 */
function expandHull(hull: THREE.Vector2[], padding: number): THREE.Vector2[] {
  if (hull.length < 3 || padding <= 0) return hull;

  // Compute centroid
  const centroid = new THREE.Vector2(0, 0);
  for (const p of hull) {
    centroid.add(p);
  }
  centroid.divideScalar(hull.length);

  // Expand each point outward from centroid
  return hull.map((p) => {
    const dir = new THREE.Vector2().subVectors(p, centroid).normalize();
    return new THREE.Vector2(p.x + dir.x * padding, p.y + dir.y * padding);
  });
}

export class ClusterRenderer {
  private group = new THREE.Group();
  private clusterStates = new Map<string, ClusterRenderState>();
  private config: ClusterRenderConfig;

  constructor(private scene: THREE.Scene, config: Partial<ClusterRenderConfig> = {}) {
    this.config = {
      defaultColor: config.defaultColor ?? '#4a5568',
      fillOpacity: config.fillOpacity ?? 0.08,
      strokeOpacity: config.strokeOpacity ?? 0.25,
      strokeWidth: config.strokeWidth ?? 1.5,
      labelFontFamily: config.labelFontFamily ?? 'system-ui, sans-serif',
      labelFontSize: config.labelFontSize ?? 11,
      labelTextColor: config.labelTextColor ?? '#ffffff',
      labelBackground: config.labelBackground ?? 'rgba(0, 0, 0, 0.6)',
      transitionsEnabled: config.transitionsEnabled ?? true,
      transitionDurationMs: config.transitionDurationMs ?? 300,
      zOffset: config.zOffset ?? -0.5,
      hullPadding: config.hullPadding ?? 1.2,
    };

    this.scene.add(this.group);
  }

  /**
   * Render clusters with convex hull boundaries
   */
  renderClusters(
    clusters: NeuronVisualCluster[],
    nodePositions: Map<string, THREE.Vector3>
  ): void {
    const currentIds = new Set(clusters.map((c) => c.id));

    // Remove clusters that no longer exist
    for (const [id, state] of this.clusterStates) {
      if (!currentIds.has(id)) {
        this.removeClusterState(state);
        this.clusterStates.delete(id);
      }
    }

    // Update or create clusters
    for (const cluster of clusters) {
      const memberPositions = this.getMemberPositions(cluster.nodeIds, nodePositions);

      if (memberPositions.length < 1) {
        // No valid positions, skip this cluster
        continue;
      }

      let state = this.clusterStates.get(cluster.id);

      if (!state) {
        state = this.createClusterState(cluster);
        this.clusterStates.set(cluster.id, state);
      }

      this.updateClusterGeometry(state, cluster, memberPositions);
    }
  }

  /**
   * Update cluster positions when nodes move (e.g., ambient motion)
   */
  updatePositions(nodePositions: Map<string, THREE.Vector3>): void {
    for (const [clusterId, state] of this.clusterStates) {
      // Check if any node positions have changed
      let hasChanged = false;
      for (const [nodeId, lastPos] of state.lastNodePositions) {
        const currentPos = nodePositions.get(nodeId);
        if (currentPos && !currentPos.equals(lastPos)) {
          hasChanged = true;
          break;
        }
      }

      if (hasChanged) {
        // Find the cluster data (we need nodeIds)
        // Since we don't store the full cluster, we use the lastNodePositions keys
        const nodeIds = Array.from(state.lastNodePositions.keys());
        const memberPositions = this.getMemberPositions(nodeIds, nodePositions);
        if (memberPositions.length > 0) {
          this.updateClusterGeometry(state, { id: clusterId, label: '', nodeIds }, memberPositions);
        }
      }
    }
  }

  /**
   * Update method called each frame
   */
  update(_delta: number, _elapsed: number): void {
    // Future: Add animations, pulsing effects, etc.
  }

  /**
   * Clear all clusters
   */
  clear(): void {
    for (const state of this.clusterStates.values()) {
      this.removeClusterState(state);
    }
    this.clusterStates.clear();
  }

  /**
   * Dispose of all resources
   */
  dispose(): void {
    this.clear();
    this.scene.remove(this.group);
  }

  private getMemberPositions(
    nodeIds: string[],
    nodePositions: Map<string, THREE.Vector3>
  ): THREE.Vector3[] {
    const positions: THREE.Vector3[] = [];
    for (const nodeId of nodeIds) {
      const pos = nodePositions.get(nodeId);
      if (pos) {
        positions.push(pos.clone());
      }
    }
    return positions;
  }

  private createClusterState(cluster: NeuronVisualCluster): ClusterRenderState {
    const color = new THREE.Color(cluster.color ?? this.config.defaultColor);

    // Create label
    const labelElement = document.createElement('div');
    labelElement.className = 'neuron-cluster-label';
    labelElement.style.cssText = `
      font-family: ${this.config.labelFontFamily};
      font-size: ${this.config.labelFontSize}px;
      font-weight: 500;
      color: ${this.config.labelTextColor};
      background: ${this.config.labelBackground};
      padding: 4px 10px;
      border-radius: 12px;
      white-space: nowrap;
      pointer-events: none;
      user-select: none;
      opacity: 0.85;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    `;
    labelElement.textContent = cluster.label;

    const label = new CSS2DObject(labelElement);
    label.position.set(0, 0, 0);
    this.group.add(label);

    return {
      id: cluster.id,
      mesh: null,
      outline: null,
      label,
      labelElement,
      color,
      centroid: new THREE.Vector3(),
      lastNodePositions: new Map(),
    };
  }

  private updateClusterGeometry(
    state: ClusterRenderState,
    cluster: NeuronVisualCluster,
    memberPositions: THREE.Vector3[]
  ): void {
    // Update color if changed
    if (cluster.color) {
      state.color.set(cluster.color);
    }

    // Update label text if changed
    if (state.labelElement && cluster.label) {
      state.labelElement.textContent = cluster.label;
    }

    // Store current node positions for change detection
    state.lastNodePositions.clear();
    for (let i = 0; i < cluster.nodeIds.length; i++) {
      if (memberPositions[i]) {
        state.lastNodePositions.set(cluster.nodeIds[i], memberPositions[i].clone());
      }
    }

    // Compute centroid
    state.centroid.set(0, 0, 0);
    for (const pos of memberPositions) {
      state.centroid.add(pos);
    }
    state.centroid.divideScalar(memberPositions.length);

    // Use fixed position if provided
    if (cluster.position) {
      state.centroid.set(cluster.position.x, cluster.position.y, cluster.position.z);
    }

    // Update label position (slightly above centroid)
    if (state.label) {
      state.label.position.copy(state.centroid);
      state.label.position.y += 1.5;
    }

    // Handle single node case - just show label, no hull
    if (memberPositions.length < 3) {
      this.removeClusterMesh(state);
      return;
    }

    // Compute convex hull
    const hull2D = computeConvexHull2D(memberPositions);
    const expandedHull = expandHull(hull2D, this.config.hullPadding ?? 1.2);

    if (expandedHull.length < 3) {
      this.removeClusterMesh(state);
      return;
    }

    // Create or update fill mesh
    const shape = new THREE.Shape(expandedHull);
    const geometry = new THREE.ShapeGeometry(shape);

    // Position the geometry at the average Z (with offset to render behind nodes)
    const avgZ =
      memberPositions.reduce((sum, p) => sum + p.z, 0) / memberPositions.length +
      (this.config.zOffset ?? -0.5);

    if (state.mesh) {
      state.mesh.geometry.dispose();
      state.mesh.geometry = geometry;
      state.mesh.position.z = avgZ;
      (state.mesh.material as THREE.MeshBasicMaterial).color.copy(state.color);
    } else {
      const material = new THREE.MeshBasicMaterial({
        color: state.color,
        transparent: true,
        opacity: this.config.fillOpacity,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      state.mesh = new THREE.Mesh(geometry, material);
      state.mesh.position.z = avgZ;
      state.mesh.renderOrder = -1; // Render before nodes
      this.group.add(state.mesh);
    }

    // Create or update outline
    const outlinePoints = [...expandedHull, expandedHull[0]].map(
      (p) => new THREE.Vector3(p.x, p.y, avgZ + 0.01)
    );

    if (state.outline) {
      state.outline.geometry.dispose();
      state.outline.geometry = new THREE.BufferGeometry().setFromPoints(outlinePoints);
      (state.outline.material as THREE.LineBasicMaterial).color.copy(state.color);
    } else {
      const outlineGeometry = new THREE.BufferGeometry().setFromPoints(outlinePoints);
      const outlineMaterial = new THREE.LineBasicMaterial({
        color: state.color,
        transparent: true,
        opacity: this.config.strokeOpacity,
        linewidth: this.config.strokeWidth,
      });
      state.outline = new THREE.Line(outlineGeometry, outlineMaterial);
      state.outline.renderOrder = -1;
      this.group.add(state.outline);
    }
  }

  private removeClusterMesh(state: ClusterRenderState): void {
    if (state.mesh) {
      state.mesh.geometry.dispose();
      (state.mesh.material as THREE.Material).dispose();
      this.group.remove(state.mesh);
      state.mesh = null;
    }
    if (state.outline) {
      state.outline.geometry.dispose();
      (state.outline.material as THREE.Material).dispose();
      this.group.remove(state.outline);
      state.outline = null;
    }
  }

  private removeClusterState(state: ClusterRenderState): void {
    this.removeClusterMesh(state);
    if (state.label) {
      if (state.labelElement?.parentNode) {
        state.labelElement.parentNode.removeChild(state.labelElement);
      }
      this.group.remove(state.label);
    }
  }

  /**
   * Get cluster visibility state for external use
   */
  getClusterIds(): string[] {
    return Array.from(this.clusterStates.keys());
  }

  /**
   * Get centroid position for a cluster
   */
  getClusterCentroid(clusterId: string): THREE.Vector3 | null {
    const state = this.clusterStates.get(clusterId);
    return state ? state.centroid.clone() : null;
  }
}
