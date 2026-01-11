import type { LLMProvider, LLMRequest, LLMResponse } from '../llm-provider';

export type MockLLMProviderOptions = {
  responder?: (request: LLMRequest) => Promise<LLMResponse> | LLMResponse;
  defaultJson?: Record<string, unknown>;
};

/**
 * Deterministic LLM provider for tests.
 * By default returns a minimal JSON payload with hasRelationship=false.
 */
export class MockLLMProvider implements LLMProvider {
  readonly name = 'mock';

  private responder: (request: LLMRequest) => Promise<LLMResponse>;

  constructor(options?: MockLLMProviderOptions) {
    const fallback = options?.defaultJson ?? { hasRelationship: false };
    this.responder = async (request) => {
      const response = options?.responder?.(request);
      if (response) return await response;
      return {
        content: JSON.stringify(fallback),
        model: request.model,
        usage: {
          inputTokens: Math.ceil(request.prompt.length / 4),
          outputTokens: Math.ceil(JSON.stringify(fallback).length / 4),
          totalTokens: Math.ceil((request.prompt.length + JSON.stringify(fallback).length) / 4),
        },
      };
    };
  }

  async generate(request: LLMRequest): Promise<LLMResponse> {
    return this.responder(request);
  }
}

