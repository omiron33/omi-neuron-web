import { vi } from 'vitest';

export const mockDatabase = () => ({
  query: vi.fn().mockResolvedValue([]),
  queryOne: vi.fn().mockResolvedValue(null),
  execute: vi.fn().mockResolvedValue(0),
  transaction: vi.fn(async (fn) => fn({ query: vi.fn().mockResolvedValue([]) })),
  connect: vi.fn(),
  disconnect: vi.fn(),
  isConnected: vi.fn().mockResolvedValue(true),
});
