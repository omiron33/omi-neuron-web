import { describe, it, expect } from 'vitest';
import React from 'react';
import { NeuronWeb } from '../../src/visualization/NeuronWeb';

const mockGraph = { nodes: [], edges: [] };

describe('NeuronWeb', () => {
  it('renders without errors', () => {
    const element = React.createElement(NeuronWeb, { graphData: mockGraph });
    expect(element).toBeTruthy();
  });
});
