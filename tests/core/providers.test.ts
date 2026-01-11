import { describe, it, expect } from 'vitest';
import { MockEmbeddingProvider } from '../../src/core/providers/testing/mock-embedding-provider';
import { MockLLMProvider } from '../../src/core/providers/testing/mock-llm-provider';
import { ProviderError } from '../../src/core/providers/errors';
import { mapOpenAIErrorToProviderError } from '../../src/core/providers/openai/openai-error-mapping';
import { APIUserAbortError, AuthenticationError, RateLimitError } from 'openai';

describe('Providers', () => {
  it('MockEmbeddingProvider returns deterministic embeddings with preserved order', async () => {
    const provider = new MockEmbeddingProvider({ dimensions: 6 });

    const first = await provider.embed({ model: 'mock', input: ['a', 'b'] });
    const second = await provider.embed({ model: 'mock', input: ['a', 'b'] });

    expect(first.embeddings).toHaveLength(2);
    expect(first.embeddings[0]).toHaveLength(6);
    expect(first.embeddings[1]).toHaveLength(6);
    expect(first.embeddings).toEqual(second.embeddings);

    const swapped = await provider.embed({ model: 'mock', input: ['b', 'a'] });
    expect(swapped.embeddings[0]).toEqual(first.embeddings[1]);
    expect(swapped.embeddings[1]).toEqual(first.embeddings[0]);
  });

  it('MockLLMProvider returns JSON by default', async () => {
    const provider = new MockLLMProvider();
    const response = await provider.generate({
      model: 'mock',
      prompt: 'hello',
      responseFormat: 'json',
    });

    expect(response.content).toMatch(/^\s*\{/);
    const parsed = JSON.parse(response.content) as { hasRelationship?: boolean };
    expect(parsed.hasRelationship).toBe(false);
  });

  it('maps OpenAI abort errors to ProviderError(canceled)', () => {
    const mapped = mapOpenAIErrorToProviderError(new APIUserAbortError());
    expect(mapped).toBeInstanceOf(ProviderError);
    expect(mapped.code).toBe('canceled');
  });

  it('maps OpenAI auth errors to ProviderError(auth_error)', () => {
    const err = new AuthenticationError(401, { message: 'bad key' }, 'bad key', new Headers());
    const mapped = mapOpenAIErrorToProviderError(err);
    expect(mapped).toBeInstanceOf(ProviderError);
    expect(mapped.code).toBe('auth_error');
    expect(mapped.status).toBe(401);
  });

  it('maps OpenAI rate limits to ProviderError(rate_limited) and captures retry-after', () => {
    const headers = new Headers({ 'retry-after': '2' });
    const err = new RateLimitError(429, { message: 'too many' }, 'too many', headers);
    const mapped = mapOpenAIErrorToProviderError(err);
    expect(mapped).toBeInstanceOf(ProviderError);
    expect(mapped.code).toBe('rate_limited');
    expect(mapped.status).toBe(429);
    expect(mapped.retryAfterMs).toBe(2000);
  });
});

