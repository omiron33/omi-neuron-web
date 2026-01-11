export type ProviderErrorCode =
  | 'auth_error'
  | 'rate_limited'
  | 'invalid_request'
  | 'transient'
  | 'canceled'
  | 'unknown';

export type ProviderErrorOptions = {
  code: ProviderErrorCode;
  status?: number;
  retryAfterMs?: number;
  cause?: unknown;
};

export class ProviderError extends Error {
  readonly code: ProviderErrorCode;
  readonly status?: number;
  readonly retryAfterMs?: number;

  constructor(message: string, options: ProviderErrorOptions) {
    super(message);
    this.name = 'ProviderError';
    this.code = options.code;
    this.status = options.status;
    this.retryAfterMs = options.retryAfterMs;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this as any).cause = options.cause;
  }
}

export const isProviderError = (error: unknown): error is ProviderError => {
  return Boolean(
    error &&
      typeof error === 'object' &&
      'name' in error &&
      (error as { name?: unknown }).name === 'ProviderError' &&
      'code' in error
  );
};

export const getRetryAfterMsFromHeaders = (headers: Headers | undefined): number | undefined => {
  if (!headers) return undefined;
  const raw = headers.get('retry-after');
  if (!raw) return undefined;
  const seconds = Number(raw);
  if (!Number.isFinite(seconds)) return undefined;
  return Math.max(0, seconds * 1000);
};

