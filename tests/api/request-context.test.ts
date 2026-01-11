import { describe, expect, it } from 'vitest';
import { buildRequestContext, toGraphStoreContext, withRequestContext } from '../../src/api/middleware/request-context';

describe('request-context middleware', () => {
  it('prefers x-neuron-scope header over resolveScope', async () => {
    const request = new Request('https://example.com/api/neuron/nodes', {
      headers: {
        'x-neuron-scope': '  header-scope  ',
      },
    });

    const context = await buildRequestContext(request, {
      resolveScope: async () => 'resolved-scope',
    });

    expect(context.scope).toBe('header-scope');
  });

  it('falls back to resolveScope when scope header is absent', async () => {
    const request = new Request('https://example.com/api/neuron/nodes');

    const context = await buildRequestContext(request, {
      resolveScope: async () => 'resolved-scope',
    });

    expect(context.scope).toBe('resolved-scope');
  });

  it('falls back to default scope when no header or callback is provided', async () => {
    const request = new Request('https://example.com/api/neuron/nodes');
    const context = await buildRequestContext(request);
    expect(context.scope).toBe('default');
  });

  it('uses x-request-id when present', async () => {
    const request = new Request('https://example.com/api/neuron/nodes', {
      headers: {
        'x-request-id': 'req-123',
      },
    });

    const context = await buildRequestContext(request);
    expect(context.requestId).toBe('req-123');
  });

  it('generates requestId when missing', async () => {
    const request = new Request('https://example.com/api/neuron/nodes');
    const context = await buildRequestContext(request);
    expect(context.requestId.length).toBeGreaterThan(0);
  });

  it('adapts RequestContext to GraphStoreContext', async () => {
    const request = new Request('https://example.com/api/neuron/nodes', {
      headers: { 'x-neuron-scope': 'scope-a' },
    });

    const context = await buildRequestContext(request);
    expect(toGraphStoreContext(context)).toEqual({ scope: 'scope-a' });
  });

  it('withRequestContext passes derived context to handler', async () => {
    const handler = withRequestContext(async (_request, context) => {
      return Response.json({ requestId: context.requestId, scope: context.scope });
    });

    const request = new Request('https://example.com/api/neuron/nodes', {
      headers: { 'x-neuron-scope': 'scope-a' },
    });

    const response = await handler(request);
    const body = (await response.json()) as { requestId: string; scope: string };
    expect(body.scope).toBe('scope-a');
    expect(body.requestId.length).toBeGreaterThan(0);
  });
});

