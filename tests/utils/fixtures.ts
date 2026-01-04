import type { NeuronNode, NeuronEdge } from '../../src/core/types';

export const mockNodes: NeuronNode[] = [
  {
    id: 'node-1',
    slug: 'node-1',
    label: 'Node 1',
    nodeType: 'concept',
    domain: 'general',
    createdAt: new Date(),
    updatedAt: new Date(),
    metadata: {},
  },
];

export const mockEdges: NeuronEdge[] = [
  {
    id: 'edge-1',
    fromNodeId: 'node-1',
    toNodeId: 'node-1',
    relationshipType: 'related_to',
    strength: 0.5,
    confidence: 1,
    evidence: [],
    metadata: {},
    source: 'manual',
    createdAt: new Date(),
    updatedAt: new Date(),
    bidirectional: false,
  },
];

export const mockGraphData = { nodes: mockNodes, edges: mockEdges };
