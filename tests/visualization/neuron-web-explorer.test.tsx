import { describe, it, expect } from 'vitest';
import React from 'react';
import { NeuronWebExplorer } from '../../src/visualization/explorer/NeuronWebExplorer';

const mockGraph = { nodes: [], edges: [] };

describe('NeuronWebExplorer', () => {
  it('renders without errors', () => {
    const element = React.createElement(NeuronWebExplorer, { graphData: mockGraph });
    expect(element).toBeTruthy();
  });
});

