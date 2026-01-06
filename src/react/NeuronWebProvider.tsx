'use client';

import React, { useEffect, useMemo, useState } from 'react';
import type { NeuronSettings, NeuronConfig, NeuronSettingsUpdate } from '../core/types/settings';
import type { NeuronEvent } from '../core/types/events';
import { DEFAULT_ANALYSIS_SETTINGS, DEFAULT_VISUALIZATION_SETTINGS } from '../core/types/settings';
import { EventBus } from '../core/events/event-bus';
import { NeuronApiClient } from './api-client';
import { NeuronContext, type ErrorContext } from './context';

export interface NeuronWebProviderProps {
  children: React.ReactNode;
  config: {
    openaiApiKey?: string;
    databaseUrl?: string;
    settings?: Partial<NeuronSettings>;
    onEvent?: (event: NeuronEvent) => void;
    onError?: (error: Error, context: ErrorContext) => void;
  };
}

const buildDefaultConfig = (overrides?: Partial<NeuronSettings>): NeuronConfig => ({
  instance: {
    name: 'default',
    version: '0.1.1',
    repoName: 'omi-neuron-web',
  },
  visualization: { ...DEFAULT_VISUALIZATION_SETTINGS, ...(overrides?.visualization ?? {}) },
  analysis: { ...DEFAULT_ANALYSIS_SETTINGS, ...(overrides?.analysis ?? {}) },
  nodeTypes: overrides?.nodeTypes ?? [],
  domains: overrides?.domains ?? [],
  relationshipTypes: overrides?.relationshipTypes ?? [],
  openai: {
    apiKey: '',
  },
  database: {
    mode: 'external',
    port: 5433,
    url: undefined,
  },
  api: {
    basePath: '/api/neuron',
    enableCors: false,
  },
  logging: {
    level: 'info',
    prettyPrint: true,
  },
});

export function NeuronWebProvider({ children, config }: NeuronWebProviderProps): React.ReactElement {
  const [settings, setSettings] = useState<NeuronSettings>(() =>
    buildDefaultConfig(config.settings) as NeuronSettings
  );
  const [error, setError] = useState<Error | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const resolvedConfig = useMemo(() => {
    const base = buildDefaultConfig(config.settings);
    return {
      ...base,
      openai: {
        apiKey: config.openaiApiKey ?? base.openai.apiKey,
      },
      database: {
        ...base.database,
        url: config.databaseUrl ?? base.database.url,
      },
    } as NeuronConfig;
  }, [config]);

  const apiClient = useMemo(() => new NeuronApiClient(resolvedConfig.api.basePath), [resolvedConfig]);
  const eventBus = useMemo(() => new EventBus(), []);

  useEffect(() => {
    eventBus.subscribeAll((event) => config.onEvent?.(event));
  }, [eventBus, config]);

  useEffect(() => {
    let mounted = true;
    apiClient
      .settings.get()
      .then((response) => {
        if (mounted) {
          setSettings(response.settings as NeuronSettings);
          setIsInitialized(true);
        }
      })
      .catch((err) => {
        setError(err as Error);
        config.onError?.(err as Error, { message: 'Failed to load settings' });
      });
    return () => {
      mounted = false;
    };
  }, [apiClient]);

  const updateSettings = async (updates: Partial<NeuronSettings>) => {
    const response = await apiClient.settings.update(updates as NeuronSettingsUpdate);
    setSettings(response.settings as NeuronSettings);
  };

  const resetSettings = async () => {
    const response = await apiClient.settings.reset();
    setSettings(response.settings as NeuronSettings);
  };

  const contextValue = useMemo(
    () => ({
      config: resolvedConfig,
      settings,
      api: apiClient,
      events: eventBus,
      isInitialized,
      error,
      updateSettings,
      resetSettings,
      onEvent: config.onEvent,
      onError: config.onError,
    }),
    [resolvedConfig, settings, apiClient, eventBus, isInitialized, error, config]
  );

  return <NeuronContext.Provider value={contextValue}>{children}</NeuronContext.Provider>;
}
