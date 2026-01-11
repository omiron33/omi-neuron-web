import crypto from 'node:crypto';
import type { IngestionRecord } from '../types';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value && typeof value === 'object' && !Array.isArray(value));

const stableStringify = (value: unknown): string => {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'string') return JSON.stringify(value);
  if (typeof value === 'number' || typeof value === 'boolean') return JSON.stringify(value);
  if (value instanceof Date) return JSON.stringify(value.toISOString());
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (isRecord(value)) {
    const keys = Object.keys(value).sort();
    const entries = keys.map((k) => `${JSON.stringify(k)}:${stableStringify(value[k])}`);
    return `{${entries.join(',')}}`;
  }
  return JSON.stringify(String(value));
};

export const sha256 = (text: string): string => crypto.createHash('sha256').update(text).digest('hex');

/**
 * Deterministic content hash for change detection.
 *
 * The hash should reflect semantic content changes, not transient fields like sync timestamps.
 */
export const hashIngestionRecord = (record: IngestionRecord): string => {
  const canonical = stableStringify({
    externalId: record.externalId,
    title: record.title,
    content: record.content,
    url: record.url ?? null,
    metadata: record.metadata ?? {},
    nodeType: record.nodeType ?? null,
    domain: record.domain ?? null,
    references: record.references ?? [],
    parentExternalId: record.parentExternalId ?? null,
  });
  return sha256(canonical);
};

