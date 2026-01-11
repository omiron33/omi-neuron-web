import { afterEach, describe, expect, it, vi } from 'vitest';
import { NeuronApiClient } from '../../src/react/api-client';

describe('NeuronApiClient', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('sends x-neuron-scope when scope is configured', async () => {
    const fetchMock = vi.fn(async () => {
      return new Response(JSON.stringify({ settings: {} }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    });
    vi.stubGlobal('fetch', fetchMock);

    const client = new NeuronApiClient('/api/neuron', { scope: 'scope-a' });
    await client.settings.get();

    expect(fetchMock).toHaveBeenCalledOnce();
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const headers = new Headers(init.headers);
    expect(headers.get('x-neuron-scope')).toBe('scope-a');
  });

  it('does not send x-neuron-scope when scope is not configured', async () => {
    const fetchMock = vi.fn(async () => {
      return new Response(JSON.stringify({ settings: {} }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    });
    vi.stubGlobal('fetch', fetchMock);

    const client = new NeuronApiClient('/api/neuron');
    await client.settings.get();

    expect(fetchMock).toHaveBeenCalledOnce();
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const headers = new Headers(init.headers);
    expect(headers.get('x-neuron-scope')).toBeNull();
  });
});

