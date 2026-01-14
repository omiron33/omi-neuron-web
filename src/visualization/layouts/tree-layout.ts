import type { NeuronVisualNode, NeuronVisualEdge } from '../../core/types';
import type { NeuronLayoutOptions } from '../types';

interface TreeNode {
  id: string;
  children: string[];
  width: number;
  depth: number;
  x: number;
}

/**
 * Applies a hierarchical tree layout to nodes, positioning them in a 2D plane (z=0).
 * Supports four directions:
 * - 'down': root at top, children below (default)
 * - 'up': root at bottom, children above
 * - 'right': root on left, children to the right
 * - 'left': root on right, children to the left
 */
export function applyTreeLayout(
  nodes: NeuronVisualNode[],
  edges: NeuronVisualEdge[],
  options: NeuronLayoutOptions = {}
): NeuronVisualNode[] {
  if (nodes.length === 0) return nodes;

  const treeOptions = options.tree ?? {};
  const horizontalSpacing = treeOptions.horizontalSpacing ?? 3;
  const verticalSpacing = treeOptions.verticalSpacing ?? 4;
  const direction = treeOptions.direction ?? 'down';
  const rootNodeId = treeOptions.rootNodeId;
  const reverseEdgeDirection = treeOptions.reverseEdgeDirection ?? false;

  // Build node lookup by id and slug
  const nodeById = new Map<string, NeuronVisualNode>();
  const nodeBySlug = new Map<string, NeuronVisualNode>();
  for (const node of nodes) {
    nodeById.set(node.id, node);
    if (node.slug) {
      nodeBySlug.set(node.slug, node);
    }
  }

  // Build parent/children maps from edges
  const parentMap = new Map<string, string>(); // child -> parent
  const childrenMap = new Map<string, string[]>(); // parent -> children

  for (const edge of edges) {
    // Resolve from/to node IDs (edge.from/to can be slug or id)
    const fromNode = nodeBySlug.get(edge.from) ?? nodeById.get(edge.from);
    const toNode = nodeBySlug.get(edge.to) ?? nodeById.get(edge.to);

    if (!fromNode || !toNode) continue;

    // When reverseEdgeDirection is true, treat edge.to as parent and edge.from as child
    const parentId = reverseEdgeDirection ? toNode.id : fromNode.id;
    const childId = reverseEdgeDirection ? fromNode.id : toNode.id;

    // Only set parent if this node doesn't already have one (first edge wins)
    if (!parentMap.has(childId)) {
      parentMap.set(childId, parentId);

      const siblings = childrenMap.get(parentId) ?? [];
      siblings.push(childId);
      childrenMap.set(parentId, siblings);
    }
  }

  // Find root nodes (no parent, or specified root)
  let roots: string[];
  if (rootNodeId) {
    const rootNode = nodeBySlug.get(rootNodeId) ?? nodeById.get(rootNodeId);
    roots = rootNode ? [rootNode.id] : [];
  } else {
    roots = nodes.filter((n) => !parentMap.has(n.id)).map((n) => n.id);
  }

  // If no roots found (circular graph), pick the first node
  if (roots.length === 0 && nodes.length > 0) {
    roots = [nodes[0].id];
  }

  // Build tree structure with widths
  const treeNodes = new Map<string, TreeNode>();

  function calculateWidth(nodeId: string, depth: number): number {
    const children = childrenMap.get(nodeId) ?? [];
    let width: number;

    if (children.length === 0) {
      width = 1;
    } else {
      width = 0;
      for (const childId of children) {
        width += calculateWidth(childId, depth + 1);
      }
    }

    treeNodes.set(nodeId, {
      id: nodeId,
      children,
      width,
      depth,
      x: 0,
    });

    return width;
  }

  // Calculate total width across all roots
  let totalWidth = 0;
  for (const rootId of roots) {
    totalWidth += calculateWidth(rootId, 0);
  }

  // Assign x positions
  function assignPositions(nodeId: string, leftBound: number): void {
    const treeNode = treeNodes.get(nodeId);
    if (!treeNode) return;

    const children = treeNode.children;

    if (children.length === 0) {
      // Leaf node: center in its allocated space
      treeNode.x = leftBound + 0.5;
    } else {
      // Parent node: position children, then center over them
      let childLeft = leftBound;
      for (const childId of children) {
        assignPositions(childId, childLeft);
        const childNode = treeNodes.get(childId);
        if (childNode) {
          childLeft += childNode.width;
        }
      }

      // Center parent over children
      const firstChild = treeNodes.get(children[0]);
      const lastChild = treeNodes.get(children[children.length - 1]);
      if (firstChild && lastChild) {
        treeNode.x = (firstChild.x + lastChild.x) / 2;
      }
    }
  }

  // Assign positions for each root tree
  let currentLeft = 0;
  for (const rootId of roots) {
    assignPositions(rootId, currentLeft);
    const rootTree = treeNodes.get(rootId);
    if (rootTree) {
      currentLeft += rootTree.width;
    }
  }

  // Convert tree positions to node positions
  const positions = new Map<string, [number, number, number]>();
  const centerOffset = totalWidth / 2;
  const isHorizontal = direction === 'left' || direction === 'right';

  for (const [nodeId, treeNode] of treeNodes) {
    // siblingPos is the position along the sibling axis (perpendicular to tree growth)
    const siblingPos = (treeNode.x - centerOffset) * horizontalSpacing;
    // depthPos is the position along the depth axis (direction of tree growth)
    let depthPos: number;
    switch (direction) {
      case 'up':
        depthPos = treeNode.depth * verticalSpacing;
        break;
      case 'left':
        depthPos = -treeNode.depth * verticalSpacing;
        break;
      case 'right':
        depthPos = treeNode.depth * verticalSpacing;
        break;
      case 'down':
      default:
        depthPos = -treeNode.depth * verticalSpacing;
        break;
    }

    // For horizontal layouts, swap x/y
    const x = isHorizontal ? depthPos : siblingPos;
    const y = isHorizontal ? siblingPos : depthPos;
    positions.set(nodeId, [x, y, 0]);
  }

  // Handle orphan nodes (not connected to any tree)
  const positionedIds = new Set(positions.keys());
  const orphans = nodes.filter((n) => !positionedIds.has(n.id));

  if (orphans.length > 0) {
    const maxDepth = Math.max(...Array.from(treeNodes.values()).map((t) => t.depth), 0);
    const orphanDepth = (maxDepth + 2) * verticalSpacing;
    const orphanSpread = ((orphans.length - 1) * horizontalSpacing) / 2;

    orphans.forEach((orphan, index) => {
      const siblingPos = -orphanSpread + index * horizontalSpacing;
      let depthPos: number;
      switch (direction) {
        case 'up':
          depthPos = orphanDepth;
          break;
        case 'left':
          depthPos = -orphanDepth;
          break;
        case 'right':
          depthPos = orphanDepth;
          break;
        case 'down':
        default:
          depthPos = -orphanDepth;
          break;
      }
      const x = isHorizontal ? depthPos : siblingPos;
      const y = isHorizontal ? siblingPos : depthPos;
      positions.set(orphan.id, [x, y, 0]);
    });
  }

  // Apply positions to nodes, respecting overrides
  const overrides = options.overrides ?? {};
  return nodes.map((node) => {
    // Check for override first (by id or slug)
    const override = overrides[node.id] ?? (node.slug ? overrides[node.slug] : undefined);
    if (override) {
      return { ...node, position: [...override] as [number, number, number] };
    }
    // Fall back to calculated position
    const position = positions.get(node.id);
    if (position) {
      return { ...node, position };
    }
    return node;
  });
}
