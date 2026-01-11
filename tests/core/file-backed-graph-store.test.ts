import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { FileBackedGraphStore } from '../../src/core/store';

const makeTempStorePath = async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'omi-neuron-store-'));
  const filePath = path.join(dir, 'graph.json');
  return { dir, filePath };
};

describe('FileBackedGraphStore', () => {
  it('persists nodes and edges to disk', async () => {
    const { dir, filePath } = await makeTempStorePath();
    try {
      const store = new FileBackedGraphStore({ filePath, persistIntervalMs: 0 });
      const [a, b] = await store.createNodes([{ label: 'A' }, { label: 'B' }]);
      await store.createEdges([{ fromNodeId: a.id, toNodeId: b.id }]);
      await store.flush();

      const file = JSON.parse(await fs.readFile(filePath, 'utf8')) as { version: number };
      expect(file.version).toBe(1);

      const reloaded = new FileBackedGraphStore({ filePath, persistIntervalMs: 0 });
      const nodes = await reloaded.listNodes();
      const edges = await reloaded.listEdges();
      expect(nodes).toHaveLength(2);
      expect(edges).toHaveLength(1);
    } finally {
      await fs.rm(dir, { recursive: true, force: true });
    }
  });

  it('falls back to .bak when the primary file is corrupted', async () => {
    const { dir, filePath } = await makeTempStorePath();
    try {
      const store = new FileBackedGraphStore({ filePath, persistIntervalMs: 0, enableBackup: true });
      await store.createNodes([{ label: 'A' }]);
      await store.flush();
      await store.createNodes([{ label: 'B' }]);
      await store.flush();

      const backupPath = `${filePath}.bak`;
      const backupText = await fs.readFile(backupPath, 'utf8');
      expect(backupText).toContain('"version": 1');

      await fs.writeFile(filePath, '{not-json', 'utf8');

      const reloaded = new FileBackedGraphStore({ filePath, persistIntervalMs: 0, enableBackup: true });
      const nodes = await reloaded.listNodes();
      expect(nodes).toHaveLength(1);
      expect(nodes[0].slug).toBe('a');
    } finally {
      await fs.rm(dir, { recursive: true, force: true });
    }
  });

  it('rejects unknown versions', async () => {
    const { dir, filePath } = await makeTempStorePath();
    try {
      await fs.writeFile(
        filePath,
        JSON.stringify({ version: 999, updatedAt: new Date().toISOString(), nodes: [], edges: [], settings: {} }),
        'utf8'
      );

      const store = new FileBackedGraphStore({ filePath, persistIntervalMs: 0 });
      await expect(store.listNodes()).rejects.toThrow(/unsupported file version/i);
    } finally {
      await fs.rm(dir, { recursive: true, force: true });
    }
  });
});

