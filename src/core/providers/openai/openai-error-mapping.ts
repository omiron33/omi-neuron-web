import {
  APIConnectionError,
  APIConnectionTimeoutError,
  APIError,
  APIUserAbortError,
  AuthenticationError,
  BadRequestError,
  InternalServerError,
  RateLimitError,
  UnprocessableEntityError,
} from 'openai';
import { getRetryAfterMsFromHeaders, ProviderError } from '../errors';

export const mapOpenAIErrorToProviderError = (error: unknown): ProviderError => {
  if (error instanceof APIUserAbortError) {
    return new ProviderError(error.message, { code: 'canceled', cause: error });
  }

  if (error instanceof AuthenticationError) {
    return new ProviderError(error.message, { code: 'auth_error', status: error.status, cause: error });
  }

  if (error instanceof RateLimitError) {
    return new ProviderError(error.message, {
      code: 'rate_limited',
      status: error.status,
      retryAfterMs: getRetryAfterMsFromHeaders(error.headers),
      cause: error,
    });
  }

  if (error instanceof BadRequestError || error instanceof UnprocessableEntityError) {
    return new ProviderError(error.message, { code: 'invalid_request', status: error.status, cause: error });
  }

  if (error instanceof APIConnectionTimeoutError || error instanceof APIConnectionError) {
    return new ProviderError(error.message, { code: 'transient', status: error.status, cause: error });
  }

  if (error instanceof InternalServerError) {
    return new ProviderError(error.message, { code: 'transient', status: error.status, cause: error });
  }

  if (error instanceof APIError) {
    const status = error.status;
    const code =
      status === 401 || status === 403
        ? 'auth_error'
        : status === 429
          ? 'rate_limited'
          : status && status >= 500
            ? 'transient'
            : 'unknown';

    return new ProviderError(error.message, {
      code,
      status,
      retryAfterMs: status === 429 ? getRetryAfterMsFromHeaders(error.headers) : undefined,
      cause: error,
    });
  }

  const message = error instanceof Error ? error.message : String(error);
  return new ProviderError(message, { code: 'unknown', cause: error });
};

