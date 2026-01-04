import { useEffect } from 'react';
import { useNeuronContext } from '../../react/hooks/useNeuronContext';
import type { EventHandler, EventSource, NeuronEventType } from '../types/events';
import { createEvent } from './event-bus';

export function useNeuronEvents() {
  const { events } = useNeuronContext();

  return {
    subscribe: <T>(type: NeuronEventType, handler: EventHandler<T>) => {
      useEffect(() => {
        const sub = events.subscribe(type, handler);
        return () => sub.unsubscribe();
      }, [type, handler]);
    },
    emit: <T>(type: NeuronEventType, payload: T, source: EventSource = 'ui') => {
      events.emit(createEvent(type, payload, source));
    },
  };
}
