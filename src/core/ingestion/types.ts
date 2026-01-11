import type { ConnectorType, IngestionDeleteMode, SyncRunStatus } from '../types/ingestion';

export type IngestionRecord = {
  externalId: string;
  title: string;
  content: string;
  url?: string;
  updatedAt?: Date;
  metadata?: Record<string, unknown>;
  nodeType?: string;
  domain?: string;
  references?: string[];
  parentExternalId?: string;
};

export type ConnectorListOptions = {
  limit?: number;
  since?: Date;
  signal?: AbortSignal;
};

export interface Connector {
  readonly type: ConnectorType;
  listRecords(options?: ConnectorListOptions): Promise<IngestionRecord[]>;
}

export type IngestSourceIdentity = {
  type: ConnectorType;
  name: string;
  config: Record<string, unknown>;
};

export type IngestOptions = {
  source: IngestSourceIdentity;
  deleteMode?: IngestionDeleteMode;
  dryRun?: boolean;
  limit?: number;
  since?: Date;
};

export type IngestStats = {
  total: number;
  created: number;
  updated: number;
  skipped: number;
  deleted: number;
  errors: number;
};

export type IngestItemError = {
  externalId: string;
  error: string;
};

export type IngestResult = {
  sourceId?: string;
  syncRunId?: string;
  status: SyncRunStatus;
  stats: IngestStats;
  errors: IngestItemError[];
};

