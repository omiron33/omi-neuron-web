import OpenAI from 'openai';
import type { EmbeddingProvider, EmbeddingRequest, EmbeddingResponse } from '../embedding-provider';
import { mapOpenAIErrorToProviderError } from './openai-error-mapping';

export type OpenAIEmbeddingProviderConfig = {
  apiKey: string;
  organization?: string;
};

export class OpenAIEmbeddingProvider implements EmbeddingProvider {
  readonly name = 'openai';

  private client: OpenAI;

  constructor(config: OpenAIEmbeddingProviderConfig) {
    this.client = new OpenAI({ apiKey: config.apiKey, organization: config.organization });
  }

  async embed(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    try {
      const inputs = Array.isArray(request.input) ? request.input : [request.input];
      const response = await this.client.embeddings.create(
        {
          model: request.model,
          input: inputs,
          dimensions: request.dimensions,
        },
        { signal: request.signal }
      );

      return {
        embeddings: response.data.map((item) => item.embedding as number[]),
        model: response.model,
        usage: {
          promptTokens: response.usage?.prompt_tokens,
          totalTokens: response.usage?.total_tokens,
        },
      };
    } catch (error) {
      throw mapOpenAIErrorToProviderError(error);
    }
  }
}

