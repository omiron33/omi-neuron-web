import { useState } from 'react';
import type { NeuronSettings, NeuronSettingsUpdate, VisualizationSettings } from '../../core/types';
import { useNeuronContext } from './useNeuronContext';

export function useNeuronSettings() {
  const { settings, api, updateSettings } = useNeuronContext();
  const [isLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const update = async (updates: NeuronSettingsUpdate) => {
    try {
      setIsUpdating(true);
      await updateSettings(updates as Partial<NeuronSettings>);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsUpdating(false);
    }
  };

  const reset = async (sections?: string[]) => {
    await api.settings.reset();
    if (sections?.length) {
      await update({});
    }
  };

  return {
    settings,
    isLoading,
    isUpdating,
    error,
    updateSettings: update,
    resetSettings: reset,
    setDomainColor: async (domain: string, color: string) => {
      await update({
        visualization: {
          ...(settings.visualization as VisualizationSettings),
          domainColors: { ...settings.visualization.domainColors, [domain]: color },
        },
      });
    },
    setVisualization: async (updates: Partial<VisualizationSettings>) => {
      await update({ visualization: updates });
    },
  };
}
