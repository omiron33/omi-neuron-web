import type { NeuronConfig } from '../core/types/settings';
import type { NeuronClientConfig, NeuronServerConfig } from '../core/types/settings';
import { defineNeuronClientConfig } from './client';
import { defineNeuronServerConfig, resolveNeuronConfig } from './server';

export const defineNeuronConfig = (config: NeuronConfig): NeuronConfig => config;

export { defineNeuronClientConfig, defineNeuronServerConfig, resolveNeuronConfig };
export type { NeuronClientConfig, NeuronServerConfig };
