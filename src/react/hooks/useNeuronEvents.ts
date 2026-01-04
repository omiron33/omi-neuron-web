import { useEffect } from 'react';
import type { AnalysisRun, NeuronEventType, NeuronNode } from '../../core/types';
import type {
  AnalysisCompletedEventPayload,
  AnalysisFailedEventPayload,
  AnalysisProgressEventPayload,
  AnalysisStartedEventPayload,
  EventHandler,
  EventSubscription,
  NodeCreatedEventPayload,
  NodeDeletedEventPayload,
  NodeUpdatedEventPayload,
} from '../../core/types/events';
import { useNeuronContext } from './useNeuronContext';
import { createEvent } from '../../core/events/event-bus';

export function useNeuronEvents() {
  const { events } = useNeuronContext();

  return {
    subscribe: <T>(type: NeuronEventType, handler: EventHandler<T>) => {
      useEffect(() => {
        const sub = events.subscribe(type, handler);
        return () => sub.unsubscribe();
      }, [type, handler]);
    },
    emit: <T>(type: NeuronEventType, payload: T) => {
      events.emit(createEvent(type, payload, 'ui'));
    },
  };
}

export function useNodeEvents(handlers: {
  onCreated?: (node: NeuronNode) => void;
  onUpdated?: (node: NeuronNode) => void;
  onDeleted?: (nodeId: string) => void;
}): void {
  const { events } = useNeuronContext();

  useEffect(() => {
    const subs: EventSubscription[] = [];
    if (handlers.onCreated) {
      subs.push(
        events.subscribe('node:created', (event) =>
          handlers.onCreated?.((event.payload as NodeCreatedEventPayload).node)
        )
      );
    }
    if (handlers.onUpdated) {
      subs.push(
        events.subscribe('node:updated', (event) =>
          handlers.onUpdated?.((event.payload as NodeUpdatedEventPayload).node)
        )
      );
    }
    if (handlers.onDeleted) {
      subs.push(
        events.subscribe('node:deleted', (event) =>
          handlers.onDeleted?.((event.payload as NodeDeletedEventPayload).nodeId)
        )
      );
    }
    return () => subs.forEach((sub) => sub.unsubscribe());
  }, [handlers]);
}

export function useAnalysisEvents(handlers: {
  onStarted?: (jobId: string) => void;
  onProgress?: (jobId: string, progress: number) => void;
  onCompleted?: (job: AnalysisRun) => void;
  onFailed?: (jobId: string, error: string) => void;
}): void {
  const { events } = useNeuronContext();

  useEffect(() => {
    const subs: EventSubscription[] = [];
    if (handlers.onStarted) {
      subs.push(
        events.subscribe('analysis:started', (event) =>
          handlers.onStarted?.((event.payload as AnalysisStartedEventPayload).jobId)
        )
      );
    }
    if (handlers.onProgress) {
      subs.push(
        events.subscribe('analysis:progress', (event) => {
          const payload = event.payload as AnalysisProgressEventPayload;
          return handlers.onProgress?.(payload.jobId, payload.progress);
        })
      );
    }
    if (handlers.onCompleted) {
      subs.push(
        events.subscribe('analysis:completed', (event) =>
          handlers.onCompleted?.((event.payload as AnalysisCompletedEventPayload).job)
        )
      );
    }
    if (handlers.onFailed) {
      subs.push(
        events.subscribe('analysis:failed', (event) => {
          const payload = event.payload as AnalysisFailedEventPayload;
          return handlers.onFailed?.(payload.jobId, payload.error);
        })
      );
    }
    return () => subs.forEach((sub) => sub.unsubscribe());
  }, [handlers]);
}
