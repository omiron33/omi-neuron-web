import { createNeuronRoutes } from '@omiron33/omi-neuron-web/api';
import config from '../../../../neuron.config';

const routes = createNeuronRoutes(config);

export const GET = routes.health.GET;
export const POST = routes.health.GET;
