import fs from 'node:fs/promises';
import path from 'node:path';
import type {
  ExpandGraphRequest,
  ExpandGraphResponse,
  FindPathRequest,
  FindPathResponse,
  GetGraphParams,
  GetGraphResponse,
} from '../types/api';
import type { NeuronEdge, NeuronEdgeCreate, NeuronEdgeUpdate } from '../types/edge';
import type { NeuronNode, NeuronNodeCreate, NeuronNodeUpdate } from '../types/node';
import type { NeuronSettings, NeuronSettingsUpdate } from '../types/settings';
import type {
  GraphStore,
  GraphStoreContext,
  GraphStoreDeleteNodeResult,
  GraphStoreEmbeddingInfo,
  GraphStoreListOptions,
  GraphStoreSimilarityResult,
} from './graph-store';
import { InMemoryGraphStore } from './inmemory-graph-store';

export type FileBackedGraphStoreOptions = {
  filePath: string;
  /** Optional throttling for writes (defaults to 500ms). Use 0 to write immediately. */
  persistIntervalMs?: number;
  /** Whether to write a `.bak` before replacing the store file (defaults to true). */
  enableBackup?: boolean;
};

type SerializedNeuronNode = Omit<NeuronNode, 'createdAt' | 'updatedAt' | 'embeddingGeneratedAt'> & {
  createdAt: string;
  updatedAt: string;
  embeddingGeneratedAt: string | null;
};

type SerializedNeuronEdge = Omit<NeuronEdge, 'createdAt' | 'updatedAt'> & {
  createdAt: string;
  updatedAt: string;
};

type FileStoreV1 = {
  version: 1;
  updatedAt: string;
  nodes: SerializedNeuronNode[];
  edges: SerializedNeuronEdge[];
  settings: NeuronSettings;
};

const serializeNode = (node: NeuronNode): SerializedNeuronNode => ({
  ...node,
  createdAt: node.createdAt.toISOString(),
  updatedAt: node.updatedAt.toISOString(),
  embeddingGeneratedAt: node.embeddingGeneratedAt ? node.embeddingGeneratedAt.toISOString() : null,
});

const deserializeNode = (node: SerializedNeuronNode): NeuronNode => ({
  ...node,
  createdAt: new Date(node.createdAt),
  updatedAt: new Date(node.updatedAt),
  embeddingGeneratedAt: node.embeddingGeneratedAt ? new Date(node.embeddingGeneratedAt) : null,
});

const serializeEdge = (edge: NeuronEdge): SerializedNeuronEdge => ({
  ...edge,
  createdAt: edge.createdAt.toISOString(),
  updatedAt: edge.updatedAt.toISOString(),
});

const deserializeEdge = (edge: SerializedNeuronEdge): NeuronEdge => ({
  ...edge,
  createdAt: new Date(edge.createdAt),
  updatedAt: new Date(edge.updatedAt),
});

const readFileText = async (filePath: string): Promise<string | null> => {
  try {
    return await fs.readFile(filePath, 'utf8');
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === 'ENOENT') return null;
    throw error;
  }
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value && typeof value === 'object' && !Array.isArray(value));

export class FileBackedGraphStore implements GraphStore {
  readonly kind = 'file';

  private store: InMemoryGraphStore = new InMemoryGraphStore();
  private ready: Promise<void>;
  private persistIntervalMs: number;
  private enableBackup: boolean;
  private persistTimer: ReturnType<typeof setTimeout> | null = null;
  private persistChain: Promise<void> = Promise.resolve();
  private persistRequested = false;

  constructor(private options: FileBackedGraphStoreOptions) {
    this.persistIntervalMs = options.persistIntervalMs ?? 500;
    this.enableBackup = options.enableBackup ?? true;
    this.ready = this.loadFromDisk();
  }

  async flush(): Promise<void> {
    await this.ready;
    if (this.persistTimer) {
      clearTimeout(this.persistTimer);
      this.persistTimer = null;
    }
    if (this.persistRequested) {
      this.persistRequested = false;
      this.persistChain = this.persistChain.then(() => this.persistToDisk());
    }
    await this.persistChain;
  }

  private schedulePersist(): void {
    this.persistRequested = true;

    if (this.persistIntervalMs <= 0) {
      this.persistRequested = false;
      this.persistChain = this.persistChain.then(() => this.persistToDisk());
      return;
    }

    if (this.persistTimer) clearTimeout(this.persistTimer);
    this.persistTimer = setTimeout(() => {
      this.persistTimer = null;
      if (!this.persistRequested) return;
      this.persistRequested = false;
      this.persistChain = this.persistChain.then(() => this.persistToDisk());
    }, this.persistIntervalMs);
  }

  private async loadFromDisk(): Promise<void> {
    const filePath = this.options.filePath;
    const backupPath = `${filePath}.bak`;

    const text = await readFileText(filePath);
    if (text !== null) {
      try {
        this.store = new InMemoryGraphStore(this.parseFile(JSON.parse(text)));
        return;
      } catch (primaryError) {
        const backup = await readFileText(backupPath);
        if (backup !== null) {
          try {
            this.store = new InMemoryGraphStore(this.parseFile(JSON.parse(backup)));
            return;
          } catch {
            // Fall through to throw the primary error for clarity.
          }
        }
        throw primaryError;
      }
    }

    const backup = await readFileText(backupPath);
    if (backup !== null) {
      this.store = new InMemoryGraphStore(this.parseFile(JSON.parse(backup)));
    }
  }

  private parseFile(raw: unknown): { nodes?: NeuronNode[]; edges?: NeuronEdge[]; settings?: NeuronSettings } {
    if (!isRecord(raw)) throw new Error('FileBackedGraphStore: invalid file format (expected object)');
    const version = raw.version;
    if (version !== 1) {
      throw new Error(`FileBackedGraphStore: unsupported file version ${String(version)}`);
    }

    const nodes = Array.isArray(raw.nodes) ? (raw.nodes as SerializedNeuronNode[]).map(deserializeNode) : [];
    const edges = Array.isArray(raw.edges) ? (raw.edges as SerializedNeuronEdge[]).map(deserializeEdge) : [];
    const settings = (raw.settings as NeuronSettings | undefined) ?? undefined;

    return { nodes, edges, settings };
  }

  private async persistToDisk(): Promise<void> {
    await this.ready;

    const nodes = (await this.store.listNodes()).map(serializeNode);
    const edges = (await this.store.listEdges()).map(serializeEdge);
    const settings = await this.store.getSettings();

    const payload: FileStoreV1 = {
      version: 1,
      updatedAt: new Date().toISOString(),
      nodes,
      edges,
      settings,
    };

    const dir = path.dirname(this.options.filePath);
    await fs.mkdir(dir, { recursive: true });

    const tmpPath = `${this.options.filePath}.tmp`;
    const bakPath = `${this.options.filePath}.bak`;

    const json = JSON.stringify(payload, null, 2);
    await fs.writeFile(tmpPath, json, 'utf8');

    if (this.enableBackup) {
      try {
        await fs.rm(bakPath, { force: true });
      } catch {
        // ignore
      }
      try {
        await fs.rename(this.options.filePath, bakPath);
      } catch (error) {
        const code = (error as NodeJS.ErrnoException).code;
        if (code !== 'ENOENT') throw error;
      }
    } else {
      try {
        await fs.rm(this.options.filePath, { force: true });
      } catch {
        // ignore
      }
    }

    await fs.rename(tmpPath, this.options.filePath);
  }

  async listNodes(options?: GraphStoreListOptions): Promise<NeuronNode[]> {
    await this.ready;
    return this.store.listNodes(options);
  }

  async getNodeById(id: string, context?: GraphStoreContext): Promise<NeuronNode | null> {
    await this.ready;
    return this.store.getNodeById(id, context);
  }

  async getNodeBySlug(slug: string, context?: GraphStoreContext): Promise<NeuronNode | null> {
    await this.ready;
    return this.store.getNodeBySlug(slug, context);
  }

  async createNodes(nodes: NeuronNodeCreate[], context?: GraphStoreContext): Promise<NeuronNode[]> {
    await this.ready;
    const created = await this.store.createNodes(nodes, context);
    this.schedulePersist();
    return created;
  }

  async updateNode(id: string, patch: NeuronNodeUpdate, context?: GraphStoreContext): Promise<NeuronNode | null> {
    await this.ready;
    const updated = await this.store.updateNode(id, patch, context);
    if (updated) this.schedulePersist();
    return updated;
  }

  async deleteNode(id: string, context?: GraphStoreContext): Promise<GraphStoreDeleteNodeResult> {
    await this.ready;
    const result = await this.store.deleteNode(id, context);
    if (result.deleted) this.schedulePersist();
    return result;
  }

  async listEdges(options?: GraphStoreListOptions): Promise<NeuronEdge[]> {
    await this.ready;
    return this.store.listEdges(options);
  }

  async createEdges(edges: NeuronEdgeCreate[], context?: GraphStoreContext): Promise<NeuronEdge[]> {
    await this.ready;
    const created = await this.store.createEdges(edges, context);
    if (created.length) this.schedulePersist();
    return created;
  }

  async updateEdge(id: string, patch: NeuronEdgeUpdate, context?: GraphStoreContext): Promise<NeuronEdge | null> {
    await this.ready;
    const updated = await this.store.updateEdge(id, patch, context);
    if (updated) this.schedulePersist();
    return updated;
  }

  async deleteEdge(id: string, context?: GraphStoreContext): Promise<boolean> {
    await this.ready;
    const deleted = await this.store.deleteEdge(id, context);
    if (deleted) this.schedulePersist();
    return deleted;
  }

  async getSettings(context?: GraphStoreContext): Promise<NeuronSettings> {
    await this.ready;
    return this.store.getSettings(context);
  }

  async updateSettings(update: NeuronSettingsUpdate, context?: GraphStoreContext): Promise<NeuronSettings> {
    await this.ready;
    const updated = await this.store.updateSettings(update, context);
    this.schedulePersist();
    return updated;
  }

  async resetSettings(sections?: string[], context?: GraphStoreContext): Promise<NeuronSettings> {
    await this.ready;
    const updated = await this.store.resetSettings(sections, context);
    this.schedulePersist();
    return updated;
  }

  async getGraph(params: GetGraphParams, context?: GraphStoreContext): Promise<GetGraphResponse> {
    await this.ready;
    return this.store.getGraph(params, context);
  }

  async expandGraph(params: ExpandGraphRequest, context?: GraphStoreContext): Promise<ExpandGraphResponse> {
    await this.ready;
    return this.store.expandGraph(params, context);
  }

  async findPaths(params: FindPathRequest, context?: GraphStoreContext): Promise<FindPathResponse> {
    await this.ready;
    return this.store.findPaths(params, context);
  }

  async getNodeEmbeddingInfo(nodeId: string, context?: GraphStoreContext): Promise<GraphStoreEmbeddingInfo | null> {
    await this.ready;
    return this.store.getNodeEmbeddingInfo(nodeId, context);
  }

  async setNodeEmbedding(nodeId: string, embedding: number[], model: string, context?: GraphStoreContext): Promise<void> {
    await this.ready;
    await this.store.setNodeEmbedding(nodeId, embedding, model, context);
    this.schedulePersist();
  }

  async clearNodeEmbeddings(nodeIds?: string[], context?: GraphStoreContext): Promise<void> {
    await this.ready;
    await this.store.clearNodeEmbeddings(nodeIds, context);
    this.schedulePersist();
  }

  async findSimilarNodeIds(
    nodeId: string,
    options?: { limit?: number; minSimilarity?: number },
    context?: GraphStoreContext
  ): Promise<GraphStoreSimilarityResult[]> {
    await this.ready;
    return this.store.findSimilarNodeIds(nodeId, options, context);
  }
}

