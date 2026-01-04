import type {
  AnalysisCompletedEventPayload,
  AnalysisFailedEventPayload,
  AnalysisProgressEventPayload,
  AnalysisStartedEventPayload,
  EdgeCreatedEventPayload,
  EdgeDeletedEventPayload,
  EdgeUpdatedEventPayload,
  EventSource,
  NeuronEvent,
  NeuronEventType,
  NodeBatchCreatedEventPayload,
  NodeCreatedEventPayload,
  NodeDeletedEventPayload,
  NodeUpdatedEventPayload,
} from '../types/events';
import { createEvent } from './event-bus';

export const createNodeEvent = (
  type: 'node:created' | 'node:updated' | 'node:deleted' | 'node:batch_created',
  payload:
    | NodeCreatedEventPayload
    | NodeUpdatedEventPayload
    | NodeDeletedEventPayload
    | NodeBatchCreatedEventPayload,
  source: EventSource = 'system'
): NeuronEvent => createEvent(type, payload, source);

export const createEdgeEvent = (
  type: 'edge:created' | 'edge:updated' | 'edge:deleted',
  payload: EdgeCreatedEventPayload | EdgeUpdatedEventPayload | EdgeDeletedEventPayload,
  source: EventSource = 'system'
): NeuronEvent => createEvent(type, payload, source);

export const createAnalysisEvent = (
  type: 'analysis:started' | 'analysis:progress' | 'analysis:completed' | 'analysis:failed',
  payload:
    | AnalysisStartedEventPayload
    | AnalysisProgressEventPayload
    | AnalysisCompletedEventPayload
    | AnalysisFailedEventPayload,
  source: EventSource = 'analysis'
): NeuronEvent => createEvent(type, payload, source);

export const createGenericEvent = <T>(
  type: NeuronEventType,
  payload: T,
  source: EventSource = 'system'
): NeuronEvent<T> => createEvent(type, payload, source);
