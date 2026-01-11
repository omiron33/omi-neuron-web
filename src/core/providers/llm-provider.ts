import type { ProviderError } from './errors';

export type LLMResponseFormat = 'json';

export type LLMRequest = {
  model: string;
  prompt: string;
  responseFormat: LLMResponseFormat;
  signal?: AbortSignal;
};

export type LLMResponse = {
  content: string;
  model: string;
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
  };
};

export interface LLMProvider {
  readonly name: string;

  /**
   * Generate a completion for the given prompt.
   *
   * v1 supports only JSON-mode outputs (relationship inference).
   */
  generate(request: LLMRequest): Promise<LLMResponse>;
}

export type LLMProviderError = ProviderError;

