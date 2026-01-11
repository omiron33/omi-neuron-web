import { describe, it, expect } from 'vitest';
import {
  createStoryBeat,
  createStudyPathFromBeat,
  createStudyPathFromNodeIds,
  normalizeStoryBeat,
  validateStoryBeat,
} from '../../src/visualization/story';

describe('story tooling', () => {
  it('normalizes beats by deduping nodeIds and trimming fields', () => {
    const normalized = normalizeStoryBeat({
      id: ' beat-1 ',
      label: ' My Beat ',
      nodeIds: ['a', 'b', 'a', '  ', 'c'],
    });

    expect(normalized.id).toBe('beat-1');
    expect(normalized.label).toBe('My Beat');
    expect(normalized.nodeIds).toEqual(['a', 'b', 'c']);
  });

  it('validates beats require at least 2 nodes', () => {
    const tooSmall = createStoryBeat({ label: 'Solo', nodeIds: ['node-1'] });
    const result = validateStoryBeat(tooSmall);
    expect(result.ok).toBe(false);
  });

  it('creates study paths from nodeIds and beats', () => {
    const path = createStudyPathFromNodeIds(['a', 'b', 'a'], { label: 'Path', stepDurationMs: 1234 });
    expect(path.steps?.map((step) => step.nodeId)).toEqual(['a', 'b']);
    expect(path.label).toBe('Path');
    expect(path.stepDurationMs).toBe(1234);

    const beat = createStoryBeat({ label: 'Beat', nodeIds: ['x', 'y', 'x'] });
    const fromBeat = createStudyPathFromBeat(beat, { stepDurationMs: 2222 });
    expect(fromBeat.steps?.map((step) => step.nodeId)).toEqual(['x', 'y']);
    expect(fromBeat.label).toBe('Beat');
    expect(fromBeat.stepDurationMs).toBe(2222);
  });
});

