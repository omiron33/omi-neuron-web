import { describe, it, expect } from 'vitest';
import { DataProcessor } from '../../src/core/analysis/data-processor';

describe('DataProcessor', () => {
  it('normalizes JSON input to NeuronNodeCreate', () => {
    const processor = new DataProcessor({ labelField: 'title' });
    const node = processor.processItem({ title: 'Hello', content: 'World' });
    expect(node.label).toBe('Hello');
  });

  it('generates unique slugs', () => {
    const processor = new DataProcessor();
    const { unique } = processor.detectDuplicates([
      { label: 'Hello', slug: 'hello' },
      { label: 'Hello', slug: 'hello' },
    ]);
    expect(unique.length).toBe(1);
  });
});
