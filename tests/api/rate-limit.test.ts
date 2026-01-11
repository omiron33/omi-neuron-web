import { describe, expect, it } from 'vitest';
import { withRateLimit } from '../../src/api/middleware/rate-limit';
import { withRequestContext } from '../../src/api/middleware/request-context';

describe('withRateLimit', () => {
  it('returns 429 when limiter denies', async () => {
    const handler = withRequestContext(
      withRateLimit(async () => Response.json({ ok: true }), {
        windowMs: 60_000,
        max: 2,
        limiter: async () => ({
          allowed: false,
          limit: 2,
          remaining: 0,
          resetAtMs: Date.now() + 5_000,
        }),
      }),
      undefined
    );

    const response = await handler(
      new Request('https://example.com/api/neuron/nodes', {
        headers: { 'x-request-id': 'req-rl-1' },
      })
    );

    expect(response.status).toBe(429);
    expect(response.headers.get('x-request-id')).toBe('req-rl-1');
    expect(response.headers.get('retry-after')).not.toBeNull();
    expect(await response.json()).toMatchObject({
      code: 'RATE_LIMITED',
      statusCode: 429,
      requestId: 'req-rl-1',
      details: { windowMs: 60_000, max: 2 },
    });
  });

  it('allows requests when limiter allows', async () => {
    const handler = withRequestContext(
      withRateLimit(async () => Response.json({ ok: true }), {
        windowMs: 60_000,
        max: 2,
        limiter: async () => true,
      }),
      undefined
    );

    const response = await handler(
      new Request('https://example.com/api/neuron/nodes', {
        headers: { 'x-request-id': 'req-rl-2' },
      })
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('x-request-id')).toBe('req-rl-2');
    expect(await response.json()).toEqual({ ok: true });
  });
});

