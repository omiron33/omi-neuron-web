import type { ContextualRouteHandler, RequestContext } from './request-context';

export type BodySizeLimitOptions = {
  /**
   * Max allowed request body size in bytes.
   *
   * Defaults to 1MB when the middleware is enabled.
   */
  maxBytes?: number;

  /**
   * Header name to read for size checks (defaults to `content-length`).
   * If absent or unparsable, the middleware will not block the request.
   */
  contentLengthHeader?: string;
};

const DEFAULT_MAX_BYTES = 1_000_000;

const parseContentLength = (value: string | null): number | null => {
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return parsed;
};

const payloadTooLarge = (context: RequestContext, maxBytes: number, contentLength: number | null): Response => {
  return Response.json(
    {
      error: 'Payload too large',
      code: 'PAYLOAD_TOO_LARGE',
      statusCode: 413,
      requestId: context.requestId,
      details: {
        maxBytes,
        contentLength,
      },
    },
    { status: 413 }
  );
};

/**
 * Enforces a max request size using the `Content-Length` header when available.
 * This middleware does not read the request body; it is designed to be portable across runtimes.
 */
export const withBodySizeLimit = (
  handler: ContextualRouteHandler,
  options?: BodySizeLimitOptions
): ContextualRouteHandler => {
  return async (request, context) => {
    if (!options) return handler(request, context);

    const maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES;
    const headerName = options.contentLengthHeader ?? 'content-length';

    if (request.method === 'GET' || request.method === 'HEAD' || request.method === 'OPTIONS') {
      return handler(request, context);
    }

    const contentLength = parseContentLength(request.headers.get(headerName));
    if (contentLength !== null && contentLength > maxBytes) {
      return payloadTooLarge(context, maxBytes, contentLength);
    }

    return handler(request, context);
  };
};

