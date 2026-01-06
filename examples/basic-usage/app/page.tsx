import { NeuronWeb } from '@omiron33/omi-neuron-web';

export default function Page() {
  return (
    <NeuronWeb
      graphData={{ nodes: [], edges: [] }}
      layout={{ mode: 'fuzzy' }}
    />
  );
}
