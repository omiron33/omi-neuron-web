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

  it('calls suggestions endpoints with expected paths and methods', async () => {
    const fetchMock = vi.fn(async () => {
      return new Response(JSON.stringify({ suggestions: [], pagination: { page: 1, limit: 50, total: 0, totalPages: 1, hasNext: false, hasPrev: false } }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    });
    vi.stubGlobal('fetch', fetchMock);

    const client = new NeuronApiClient('/api/neuron', { scope: 'scope-a' });
    await client.suggestions.list({ status: 'pending', page: 2, limit: 25 });

    expect(fetchMock).toHaveBeenCalledOnce();
    const url = fetchMock.mock.calls[0]?.[0] as string;
    expect(url).toContain('/api/neuron/suggestions?');
    expect(url).toContain('status=pending');
    expect(url).toContain('page=2');
    expect(url).toContain('limit=25');

    fetchMock.mockClear();
    await client.suggestions.approve('s-1');
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/neuron/suggestions/s-1/approve');
    expect((fetchMock.mock.calls[0]?.[1] as RequestInit).method).toBe('POST');

    fetchMock.mockClear();
    await client.suggestions.bulkApprove({ ids: ['s-1', 's-2'] });
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/neuron/suggestions/approve');
    expect((fetchMock.mock.calls[0]?.[1] as RequestInit).method).toBe('POST');

    fetchMock.mockClear();
    await client.suggestions.reject('s-1', { reason: 'nope' });
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/neuron/suggestions/s-1/reject');
    expect((fetchMock.mock.calls[0]?.[1] as RequestInit).method).toBe('POST');

    fetchMock.mockClear();
    await client.suggestions.bulkReject({ ids: ['s-1'], reason: 'nope' });
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/neuron/suggestions/reject');
    expect((fetchMock.mock.calls[0]?.[1] as RequestInit).method).toBe('POST');
  });
});
