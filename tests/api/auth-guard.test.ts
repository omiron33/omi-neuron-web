import { describe, expect, it } from 'vitest';
import { withAuthGuard } from '../../src/api/middleware/auth';
import { withRequestContext } from '../../src/api/middleware/request-context';

describe('withAuthGuard', () => {
  it('is a no-op when authorize is not provided', async () => {
    const handler = withRequestContext(
      withAuthGuard(async (_request, context) => Response.json({ ok: true, scope: context.scope }), undefined),
      undefined
    );

    const response = await handler(
      new Request('https://example.com/api/neuron/nodes', {
        headers: { 'x-neuron-scope': 'scope-a', 'x-request-id': 'req-1' },
      })
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('x-request-id')).toBe('req-1');
    expect(await response.json()).toEqual({ ok: true, scope: 'scope-a' });
  });

  it('returns 401 when authorize returns false', async () => {
    const handler = withRequestContext(
      withAuthGuard(
        async () => Response.json({ ok: true }),
        {
          authorize: async () => false,
        }
      ),
      undefined
    );

    const response = await handler(
      new Request('https://example.com/api/neuron/nodes', {
        headers: { 'x-neuron-scope': 'scope-a', 'x-request-id': 'req-2' },
      })
    );

    expect(response.status).toBe(401);
    expect(response.headers.get('x-request-id')).toBe('req-2');
    expect(await response.json()).toMatchObject({
      code: 'UNAUTHORIZED',
      error: 'Unauthorized',
      statusCode: 401,
      requestId: 'req-2',
    });
  });

  it('respects custom deny response details', async () => {
    const handler = withRequestContext(
      withAuthGuard(
        async () => Response.json({ ok: true }),
        {
          authorize: async () => ({
            allowed: false,
            statusCode: 403,
            code: 'FORBIDDEN',
            error: 'Forbidden',
            details: { reason: 'nope' },
          }),
        }
      ),
      undefined
    );

    const response = await handler(
      new Request('https://example.com/api/neuron/nodes', {
        headers: { 'x-neuron-scope': 'scope-a', 'x-request-id': 'req-3' },
      })
    );

    expect(response.status).toBe(403);
    expect(response.headers.get('x-request-id')).toBe('req-3');
    expect(await response.json()).toMatchObject({
      code: 'FORBIDDEN',
      error: 'Forbidden',
      statusCode: 403,
      requestId: 'req-3',
      details: { reason: 'nope' },
    });
  });
});

