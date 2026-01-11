export type ConnectorType = 'markdown' | 'github' | 'rss' | 'notion';

export type IngestionDeleteMode = 'none' | 'soft' | 'hard';

export type SyncRunStatus = 'success' | 'failed' | 'partial';

export type IngestionSource = {
  id: string;
  type: ConnectorType;
  name: string;
  config: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
};

export type IngestionSourceItem = {
  id: string;
  sourceId: string;
  externalId: string;
  contentHash: string;
  lastSeenAt: Date;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type IngestionSourceItemNode = {
  sourceItemId: string;
  nodeId: string;
  createdAt: Date;
};

export type IngestionSyncRun = {
  id: string;
  sourceId: string;
  startedAt: Date;
  completedAt: Date | null;
  status: SyncRunStatus;
  stats: Record<string, unknown>;
  error: string | null;
};

