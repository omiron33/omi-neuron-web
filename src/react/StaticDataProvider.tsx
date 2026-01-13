'use client';

/**
 * StaticDataProvider - Provider for static/authored graphs
 *
 * Use this provider when you have pre-defined graph data that doesn't
 * require database or API connectivity. Perfect for:
 * - Quest/narrative authoring tools
 * - Documentation/knowledge graphs
 * - Workflow/pipeline visualizers
 * - Game skill trees
 * - Org charts and hierarchies
 *
 * @example
 * ```tsx
 * <StaticDataProvider
 *   nodes={myNodes}
 *   edges={myEdges}
 *   clusters={[
 *     { id: 'act1', label: 'Act 1', nodeIds: ['q001', 'q002', 'q003'] },
 *   ]}
 * >
 *   <NeuronWeb />
 * </StaticDataProvider>
 * ```
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  NeuronNode,
  NeuronEdge,
  NeuronVisualNode,
  NeuronVisualEdge,
  NeuronVisualCluster,
  NeuronSettings,
  NeuronConfig,
} from '../core/types';
import type { NeuronEvent } from '../core/types/events';
import { DEFAULT_ANALYSIS_SETTINGS, DEFAULT_VISUALIZATION_SETTINGS } from '../core/types/settings';
import { EventBus } from '../core/events/event-bus';
import { NeuronContext, type ErrorContext } from './context';
import { InMemoryApiClient } from './static/in-memory-api-client';
import type { NeuronApiClient } from './api-client';
import { VERSION } from '../version';

export interface StaticDataProviderProps {
  children: React.ReactNode;
  /** Array of nodes to display */
  nodes: (NeuronNode | NeuronVisualNode)[];
  /** Array of edges connecting nodes */
  edges: (NeuronEdge | NeuronVisualEdge)[];
  /** Optional static cluster definitions for visual grouping */
  clusters?: NeuronVisualCluster[];
  /** Optional settings overrides */
  settings?: Partial<NeuronSettings>;
  /** If true, mutations (create/update/delete) modify in-memory store */
  mutableMode?: boolean;
  /** Callback for events */
  onEvent?: (event: NeuronEvent) => void;
  /** Callback for errors */
  onError?: (error: Error, context: ErrorContext) => void;
}

const buildDefaultConfig = (overrides?: Partial<NeuronSettings>): NeuronConfig => ({
  instance: {
    name: 'static-graph',
    version: VERSION,
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
    port: 0,
    url: undefined,
  },
  api: {
    basePath: '',
    enableCors: false,
  },
  logging: {
    level: 'info',
    prettyPrint: false,
  },
});

export function StaticDataProvider({
  children,
  nodes,
  edges,
  clusters = [],
  settings: settingsOverrides,
  mutableMode = false,
  onEvent,
  onError,
}: StaticDataProviderProps): React.ReactElement {
  const resolvedConfig = useMemo(
    () => buildDefaultConfig(settingsOverrides),
    [settingsOverrides]
  );

  const [settings, setSettings] = useState<NeuronSettings>(
    () => resolvedConfig as NeuronSettings
  );

  const apiClient = useMemo(
    () =>
      new InMemoryApiClient(nodes, edges, clusters, settingsOverrides, {
        mutableMode,
      }),
    // Note: We intentionally don't include nodes/edges/clusters in deps
    // to avoid recreating the client on every render. Use updateData() for updates.
    [mutableMode]
  );

  // Update the in-memory client when data changes
  useEffect(() => {
    apiClient.updateData(nodes, edges, clusters);
  }, [nodes, edges, clusters, apiClient]);

  const eventBus = useMemo(() => new EventBus(), []);

  // Subscribe to events
  useEffect(() => {
    if (onEvent) {
      const subscription = eventBus.subscribeAll(onEvent);
      return () => subscription.unsubscribe();
    }
  }, [eventBus, onEvent]);

  const updateSettings = useCallback(
    async (updates: Partial<NeuronSettings>) => {
      const response = await apiClient.settings_api.update(updates);
      setSettings(response.settings as NeuronSettings);
    },
    [apiClient]
  );

  const resetSettings = useCallback(async () => {
    const response = await apiClient.settings_api.reset();
    setSettings(response.settings as NeuronSettings);
  }, [apiClient]);

  const contextValue = useMemo(
    () => ({
      config: resolvedConfig,
      settings,
      // Cast to NeuronApiClient since we implement the same interface
      api: apiClient as unknown as NeuronApiClient,
      events: eventBus,
      isInitialized: true, // Always initialized since data is provided directly
      isStaticMode: true,
      error: null,
      updateSettings,
      resetSettings,
      onEvent,
      onError,
    }),
    [resolvedConfig, settings, apiClient, eventBus, updateSettings, resetSettings, onEvent, onError]
  );

  return <NeuronContext.Provider value={contextValue}>{children}</NeuronContext.Provider>;
}
