import { describe, expect, it } from 'vitest';
import { withBodySizeLimit } from '../../src/api/middleware/body-size-limit';
import { withRequestContext } from '../../src/api/middleware/request-context';

describe('withBodySizeLimit', () => {
  it('returns 413 when Content-Length exceeds maxBytes', async () => {
    const handler = withRequestContext(
      withBodySizeLimit(async () => Response.json({ ok: true }), { maxBytes: 100 }),
      undefined
    );

    const response = await handler(
      new Request('https://example.com/api/neuron/nodes', {
        method: 'POST',
        headers: { 'content-length': '101', 'x-request-id': 'req-size-1' },
      })
    );

    expect(response.status).toBe(413);
    expect(response.headers.get('x-request-id')).toBe('req-size-1');
    expect(await response.json()).toMatchObject({
      code: 'PAYLOAD_TOO_LARGE',
      statusCode: 413,
      requestId: 'req-size-1',
      details: { maxBytes: 100, contentLength: 101 },
    });
  });

  it('allows requests when Content-Length is within the limit', async () => {
    const handler = withRequestContext(
      withBodySizeLimit(async () => Response.json({ ok: true }), { maxBytes: 100 }),
      undefined
    );

    const response = await handler(
      new Request('https://example.com/api/neuron/nodes', {
        method: 'POST',
        headers: { 'content-length': '99', 'x-request-id': 'req-size-2' },
      })
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('x-request-id')).toBe('req-size-2');
    expect(await response.json()).toEqual({ ok: true });
  });
});

