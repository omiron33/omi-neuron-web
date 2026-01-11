import type { Database } from '../../storage/database';
import type { NeuronSettings, NeuronSettingsUpdate } from '../../core/types/settings';
import { DEFAULT_ANALYSIS_SETTINGS, DEFAULT_VISUALIZATION_SETTINGS } from '../../core/types/settings';
import type { GraphStoreContext } from '../../core/store/graph-store';
import { resolveScope } from '../../core/store/graph-store';

const deepMerge = (target: Record<string, unknown>, source: Record<string, unknown>) => {
  const output = { ...target };
  Object.entries(source).forEach(([key, value]) => {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      output[key] = deepMerge((output[key] as Record<string, unknown>) ?? {}, value as Record<string, unknown>);
    } else if (value !== undefined) {
      output[key] = value as unknown;
    }
  });
  return output;
};

const defaultSettings = (): NeuronSettings => ({
  instance: {
    name: 'default',
    version: '0.1.0',
    repoName: 'omi-neuron-web',
  },
  visualization: DEFAULT_VISUALIZATION_SETTINGS,
  analysis: DEFAULT_ANALYSIS_SETTINGS,
  nodeTypes: [],
  domains: [],
  relationshipTypes: [],
});

export class SettingsRepository {
  constructor(private db: Database) {}

  async get(context?: GraphStoreContext): Promise<NeuronSettings> {
    const scope = resolveScope(context);
    const row = await this.db.queryOne<{
      visualization: Record<string, unknown> | null;
      analysis: Record<string, unknown> | null;
      node_types: NeuronSettings['nodeTypes'] | null;
      domains: NeuronSettings['domains'] | null;
      relationship_types: NeuronSettings['relationshipTypes'] | null;
    }>('SELECT visualization, analysis, node_types, domains, relationship_types FROM settings WHERE id = $1', [
      scope,
    ]);

    if (!row) {
      return defaultSettings();
    }

    return {
      ...defaultSettings(),
      visualization: { ...DEFAULT_VISUALIZATION_SETTINGS, ...(row.visualization ?? {}) },
      analysis: { ...DEFAULT_ANALYSIS_SETTINGS, ...(row.analysis ?? {}) },
      nodeTypes: row.node_types ?? [],
      domains: row.domains ?? [],
      relationshipTypes: row.relationship_types ?? [],
    };
  }

  async update(settings: NeuronSettingsUpdate, context?: GraphStoreContext): Promise<NeuronSettings> {
    const scope = resolveScope(context);
    const current = await this.get(context);
    const merged = deepMerge(current as unknown as Record<string, unknown>, settings as Record<string, unknown>);
    await this.db.execute(
      `INSERT INTO settings (id, visualization, analysis, node_types, domains, relationship_types)
       VALUES ($6, $1, $2, $3, $4, $5)
       ON CONFLICT (id) DO UPDATE SET visualization = $1, analysis = $2, node_types = $3, domains = $4, relationship_types = $5, updated_at = NOW()`,
      [
        merged.visualization,
        merged.analysis,
        merged.nodeTypes,
        merged.domains,
        merged.relationshipTypes,
        scope,
      ]
    );
    return merged as unknown as NeuronSettings;
  }

  async reset(sections?: string[], context?: GraphStoreContext): Promise<NeuronSettings> {
    const scope = resolveScope(context);
    const defaults = defaultSettings() as unknown as Record<string, unknown>;
    if (sections?.length) {
      const current = await this.get(context);
      const updated = { ...(current as unknown as Record<string, unknown>) };
      sections.forEach((section) => {
        updated[section] = defaults[section];
      });
      return this.update(updated as NeuronSettingsUpdate, context);
    }

    await this.db.execute(
      `INSERT INTO settings (id, visualization, analysis, node_types, domains, relationship_types)
       VALUES ($6, $1, $2, $3, $4, $5)
       ON CONFLICT (id) DO UPDATE SET visualization = $1, analysis = $2, node_types = $3, domains = $4, relationship_types = $5, updated_at = NOW()`,
      [
        defaults.visualization,
        defaults.analysis,
        defaults.nodeTypes,
        defaults.domains,
        defaults.relationshipTypes,
        scope,
      ]
    );

    return defaults as unknown as NeuronSettings;
  }
}
