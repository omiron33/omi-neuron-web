import type { ProviderError } from './errors';

export type EmbeddingRequest = {
  input: string | string[];
  model: string;
  dimensions?: number;
  signal?: AbortSignal;
};

export type EmbeddingResponse = {
  embeddings: number[][];
  model: string;
  usage?: {
    promptTokens?: number;
    totalTokens?: number;
  };
};

export interface EmbeddingProvider {
  readonly name: string;

  /**
   * Generate embeddings for one or more input strings.
   *
   * Requirements:
   * - Output order must match input order.
   * - If input is a single string, embeddings.length === 1.
   * - Should throw a ProviderError (or compatible shape) on failure.
   */
  embed(request: EmbeddingRequest): Promise<EmbeddingResponse>;
}

export type EmbeddingProviderError = ProviderError;

