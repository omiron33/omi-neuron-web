import crypto from 'node:crypto';
import type { EmbeddingProvider, EmbeddingRequest, EmbeddingResponse } from '../embedding-provider';

export type MockEmbeddingProviderOptions = {
  dimensions?: number;
};

/**
 * Deterministic embedding provider for tests.
 * Produces a stable vector per input string (not meaningful semantically).
 */
export class MockEmbeddingProvider implements EmbeddingProvider {
  readonly name = 'mock';

  private dimensions: number;

  constructor(options?: MockEmbeddingProviderOptions) {
    this.dimensions = Math.max(1, options?.dimensions ?? 8);
  }

  async embed(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    const inputs = Array.isArray(request.input) ? request.input : [request.input];
    const dims = request.dimensions ?? this.dimensions;

    const embeddings = inputs.map((text) => this.embedText(text, dims));
    return {
      embeddings,
      model: request.model,
      usage: {
        promptTokens: inputs.reduce((sum, t) => sum + Math.ceil(t.length / 4), 0),
        totalTokens: inputs.reduce((sum, t) => sum + Math.ceil(t.length / 4), 0),
      },
    };
  }

  private embedText(text: string, dims: number): number[] {
    const hash = crypto.createHash('sha256').update(text).digest();
    const vector = new Array(dims).fill(0).map((_, idx) => {
      const byte = hash[idx % hash.length];
      // map 0..255 -> -1..1
      return (byte / 127.5) - 1;
    });
    return vector;
  }
}

