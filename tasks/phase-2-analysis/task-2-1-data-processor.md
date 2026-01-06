---
title: Data Processor - Input Normalization
status: completed
priority: 1
labels:
  - 'Phase:2-Analysis'
  - 'Type:DataProcessing'
assignees:
  - CodingAgent
depends_on:
  - phase-1-foundation
---

# Task 2.1: Data Processor

## Objective
Build a DataProcessor class that normalizes any input format into the NeuronNode structure for consistent processing.

## Requirements

### 1. DataProcessor Class (`src/core/analysis/data-processor.ts`)

```typescript
interface ProcessingOptions {
  skipDuplicates?: boolean;
  updateOnConflict?: boolean;
  defaultNodeType?: string;
  defaultDomain?: string;
  contentFields?: string[];    // Fields to combine for content
  labelField?: string;         // Field to use as label
  slugField?: string;          // Field to use as slug
  metadataFields?: string[];   // Fields to include in metadata
}

class DataProcessor {
  constructor(options?: ProcessingOptions);
  
  // Process single item
  processItem(item: Record<string, unknown>): NeuronNodeCreate;
  
  // Process batch
  processBatch(items: Record<string, unknown>[]): {
    nodes: NeuronNodeCreate[];
    errors: Array<{ index: number; error: string }>;
  };
  
  // Process from different formats
  processJSON(json: string): NeuronNodeCreate[];
  processCSV(csv: string): NeuronNodeCreate[];
  
  // Slug generation
  generateSlug(label: string, existingSlugs?: Set<string>): string;
  
  // Content extraction
  extractContent(item: Record<string, unknown>): string;
  
  // Duplicate detection
  detectDuplicates(nodes: NeuronNodeCreate[]): {
    unique: NeuronNodeCreate[];
    duplicates: Array<{ node: NeuronNodeCreate; reason: string }>;
  };
}
```

### 2. Input Normalization Rules
- [ ] Handle nested objects (flatten with dot notation)
- [ ] Handle arrays (join or first element)
- [ ] Handle dates (convert to ISO strings)
- [ ] Handle null/undefined (skip or default)
- [ ] Handle numbers (convert to strings where needed)
- [ ] Sanitize HTML in content fields

### 3. Slug Generation
- [ ] Use slugify library
- [ ] Handle special characters
- [ ] Handle Unicode
- [ ] Ensure uniqueness with suffix
- [ ] Max length enforcement (255 chars)

### 4. Content Preparation
- [ ] Combine multiple fields for embedding
- [ ] Strip HTML tags
- [ ] Normalize whitespace
- [ ] Truncate to token limit
- [ ] Handle empty content gracefully

### 5. Validation
- [ ] Validate against Zod schemas
- [ ] Collect all errors (don't fail fast)
- [ ] Return detailed error messages

## Deliverables
- [ ] `src/core/analysis/data-processor.ts`
- [ ] Unit tests for all processing scenarios

## Acceptance Criteria
- Any JSON structure can be processed
- CSV files parse correctly
- Slugs are unique and URL-safe
- Content is clean and ready for embedding
- Duplicate detection works accurately
- Errors are detailed and helpful

## Example Usage

```typescript
const processor = new DataProcessor({
  labelField: 'title',
  contentFields: ['title', 'description', 'body'],
  metadataFields: ['author', 'source', 'date'],
  defaultDomain: 'knowledge',
});

// Process JSON data
const nodes = processor.processJSON(rawData);

// Process with duplicate detection
const { unique, duplicates } = processor.detectDuplicates(nodes);
```

## Notes
- Use slugify library for slug generation
- Consider token limits for OpenAI (8192 for ada-002)
- Preserve original data in metadata for reference


