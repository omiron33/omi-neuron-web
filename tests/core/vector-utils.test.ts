import { describe, expect, it } from 'vitest';
import { l2Norm, normalizeVector } from '../../src/core/store/utils/vector';

describe('vector utils', () => {
  it('normalizes vectors to unit length', () => {
    const normalized = normalizeVector([3, 4]);
    expect(l2Norm(normalized)).toBeCloseTo(1, 6);
  });

  it('handles zero vectors', () => {
    expect(normalizeVector([0, 0, 0])).toEqual([0, 0, 0]);
  });
});

