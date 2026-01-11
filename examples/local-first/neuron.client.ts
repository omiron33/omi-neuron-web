import { defineNeuronClientConfig } from '@omiron33/omi-neuron-web';

export const neuronClientConfig = defineNeuronClientConfig({
  api: { basePath: '/api/neuron' },
});

