import type { ContextualRouteHandler, RequestContext } from './request-context';

export type RateLimitDecision =
  | boolean
  | {
      allowed: boolean;
      /**
       * Optional total limit for the current window.
       */
      limit?: number;
      /**
       * Optional remaining requests in the current window.
       */
      remaining?: number;
      /**
       * Optional timestamp (ms since epoch) when the window resets.
       */
      resetAtMs?: number;
      /**
       * Optional status code override (defaults to 429).
       */
      statusCode?: number;
      /**
       * Optional error code override (defaults to RATE_LIMITED).
       */
      code?: string;
      /**
       * Optional human-readable error override.
       */
      error?: string;
      /**
       * Optional structured details for consumers.
       */
      details?: Record<string, unknown>;
    };

export type RateLimitKeyFn = (request: Request, context: RequestContext) => string | null | Promise<string | null>;

export type RateLimitLimiter = (
  key: string,
  windowMs: number,
  max: number
) => RateLimitDecision | Promise<RateLimitDecision>;

export type RateLimitOptions = {
  windowMs: number;
  max: number;
  keyFn?: RateLimitKeyFn;
  limiter?: RateLimitLimiter;
};

const defaultKeyFn: RateLimitKeyFn = async (request, context) => {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }

  const realIp = request.headers.get('x-real-ip')?.trim();
  if (realIp) return realIp;

  const cfIp = request.headers.get('cf-connecting-ip')?.trim();
  if (cfIp) return cfIp;

  const userId = context.user?.id?.trim();
  if (userId) return `user:${userId}`;

  return `request:${context.requestId}`;
};

const buildRateLimitedResponse = (context: RequestContext, decision: Exclude<RateLimitDecision, true>, options: RateLimitOptions) => {
  const normalized =
    typeof decision === 'boolean'
      ? { allowed: false as const }
      : {
          allowed: decision.allowed,
          limit: decision.limit,
          remaining: decision.remaining,
          resetAtMs: decision.resetAtMs,
          statusCode: decision.statusCode,
          code: decision.code,
          error: decision.error,
          details: decision.details,
        };

  const statusCode = normalized.statusCode ?? 429;
  const code = normalized.code ?? 'RATE_LIMITED';
  const error = normalized.error ?? 'Rate limited';

  const headers = new Headers();
  if (typeof normalized.limit === 'number') headers.set('x-ratelimit-limit', String(normalized.limit));
  if (typeof normalized.remaining === 'number') headers.set('x-ratelimit-remaining', String(normalized.remaining));
  if (typeof normalized.resetAtMs === 'number') {
    headers.set('x-ratelimit-reset', String(Math.ceil(normalized.resetAtMs / 1000)));
    const retryAfterSeconds = Math.max(0, Math.ceil((normalized.resetAtMs - Date.now()) / 1000));
    headers.set('retry-after', String(retryAfterSeconds));
  }
  headers.set('content-type', 'application/json');

  return new Response(
    JSON.stringify({
      error,
      code,
      statusCode,
      requestId: context.requestId,
      details: {
        windowMs: options.windowMs,
        max: options.max,
        ...normalized.details,
      },
    }),
    { status: statusCode, headers }
  );
};

/**
 * Hook-based rate limiting middleware.
 *
 * This does not ship with a built-in counter store; consumers provide `limiter` to integrate
 * with Redis / KV / in-memory dev implementations.
 */
export const withRateLimit = (handler: ContextualRouteHandler, options?: RateLimitOptions): ContextualRouteHandler => {
  return async (request, context) => {
    if (!options?.limiter) return handler(request, context);

    const keyFn = options.keyFn ?? defaultKeyFn;
    const key = (await keyFn(request, context)) ?? `request:${context.requestId}`;

    const decision = await options.limiter(key, options.windowMs, options.max);
    const allowed = typeof decision === 'boolean' ? decision : decision.allowed;

    if (allowed) {
      return handler(request, context);
    }

    return buildRateLimitedResponse(context, (decision === true ? false : decision) as Exclude<RateLimitDecision, true>, options);
  };
};
