import OpenAI from 'openai';
import type { LLMProvider, LLMRequest, LLMResponse } from '../llm-provider';
import { mapOpenAIErrorToProviderError } from './openai-error-mapping';

export type OpenAILLMProviderConfig = {
  apiKey: string;
  organization?: string;
};

export class OpenAILLMProvider implements LLMProvider {
  readonly name = 'openai';

  private client: OpenAI;

  constructor(config: OpenAILLMProviderConfig) {
    this.client = new OpenAI({ apiKey: config.apiKey, organization: config.organization });
  }

  async generate(request: LLMRequest): Promise<LLMResponse> {
    try {
      const response = await this.client.chat.completions.create(
        {
          model: request.model,
          messages: [{ role: 'user', content: request.prompt }],
          response_format: request.responseFormat === 'json' ? { type: 'json_object' } : undefined,
        },
        { signal: request.signal }
      );

      const content = response.choices[0]?.message?.content ?? '';
      return {
        content,
        model: response.model ?? request.model,
        usage: response.usage
          ? {
              inputTokens: response.usage.prompt_tokens,
              outputTokens: response.usage.completion_tokens,
              totalTokens: response.usage.total_tokens,
            }
          : undefined,
      };
    } catch (error) {
      throw mapOpenAIErrorToProviderError(error);
    }
  }
}

