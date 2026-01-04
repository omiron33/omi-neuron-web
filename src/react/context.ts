import { createContext } from 'react';
import type { NeuronSettings, NeuronConfig } from '../core/types/settings';
import type { NeuronEvent } from '../core/types/events';
import type { EventBus } from '../core/events/event-bus';
import type { NeuronApiClient } from './api-client';

export interface ErrorContext {
  message: string;
}

export interface NeuronContextValue {
  config: NeuronConfig;
  settings: NeuronSettings;
  api: NeuronApiClient;
  events: EventBus;
  isInitialized: boolean;
  error: Error | null;
  updateSettings: (settings: Partial<NeuronSettings>) => Promise<void>;
  resetSettings: () => Promise<void>;
  onEvent?: (event: NeuronEvent) => void;
  onError?: (error: Error, context: ErrorContext) => void;
}

export const NeuronContext = createContext<NeuronContextValue | null>(null);
