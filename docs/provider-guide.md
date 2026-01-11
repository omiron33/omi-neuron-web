# Provider Guide (Embeddings + LLM)

`omi-neuron-web` supports pluggable providers for:
- embeddings generation (`EmbeddingProvider`)
- relationship inference (`LLMProvider`)

By default, core services use OpenAI adapters, but you can inject your own providers (Azure OpenAI, local models, mocks for tests).

## Embeddings

### Default (OpenAI)
```ts
import { EmbeddingsService } from '@omiron33/omi-neuron-web';
import { OpenAIEmbeddingProvider } from '@omiron33/omi-neuron-web';

const provider = new OpenAIEmbeddingProvider({ apiKey: process.env.OPENAI_API_KEY ?? '' });
const embeddings = new EmbeddingsService(
  {
    openaiApiKey: process.env.OPENAI_API_KEY ?? '',
    model: 'text-embedding-3-small',
    batchSize: 20,
    rateLimit: 60,
    cacheTTL: 86400,
    maxRetries: 3,
  },
  db,
  provider
);
```

Notes:
- The provider injection is optional; passing it lets you swap vendors without forking `EmbeddingsService`.
- Keep API keys server-side.

### Testing (mock provider)
```ts
import { MockEmbeddingProvider } from '@omiron33/omi-neuron-web';

const provider = new MockEmbeddingProvider({ dimensions: 8 });
```

## Relationship inference (LLM)

### Default (OpenAI)
```ts
import { RelationshipEngine, OpenAILLMProvider } from '@omiron33/omi-neuron-web';

const llm = new OpenAILLMProvider({ apiKey: process.env.OPENAI_API_KEY ?? '' });
const relationships = new RelationshipEngine(db, { model: 'gpt-4o-mini', minConfidence: 0.7, maxPerNode: 10, similarityThreshold: 0.75, includeExisting: true, batchSize: 10, rateLimit: 60 }, llm);
```

### Testing (mock provider)
```ts
import { MockLLMProvider } from '@omiron33/omi-neuron-web';

const llm = new MockLLMProvider({
  defaultJson: { hasRelationship: false },
});
```

## Error handling

Provider adapters throw a consistent `ProviderError` shape:
- `code`: `auth_error | rate_limited | invalid_request | transient | canceled | unknown`
- `status?` (HTTP status when applicable)
- `retryAfterMs?` for rate limits

This allows higher-level services to implement retry/backoff consistently.

