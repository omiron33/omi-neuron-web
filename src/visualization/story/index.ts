import type { NeuronStoryBeat, StudyPathRequest } from '../types';

export function validateStoryBeat(
  beat: NeuronStoryBeat
): { ok: true } | { ok: false; error: string } {
  if (!beat) return { ok: false, error: 'Story beat is required.' };
  if (!beat.id || !beat.id.trim()) return { ok: false, error: 'Story beat id is required.' };
  if (!beat.label || !beat.label.trim()) return { ok: false, error: 'Story beat label is required.' };
  if (!Array.isArray(beat.nodeIds)) return { ok: false, error: 'Story beat nodeIds must be an array.' };
  const normalized = normalizeStoryBeat(beat);
  if (normalized.nodeIds.length < 2) {
    return { ok: false, error: 'Story beat must include at least 2 node ids.' };
  }
  return { ok: true };
}

export function normalizeStoryBeat(beat: NeuronStoryBeat): NeuronStoryBeat {
  const deduped = dedupePreserveOrder(
    Array.isArray(beat.nodeIds) ? beat.nodeIds : []
  ).filter((value) => typeof value === 'string' && value.trim().length > 0);

  return {
    ...beat,
    id: beat.id.trim(),
    label: beat.label.trim(),
    nodeIds: deduped,
  };
}

export function createStoryBeat(input: {
  id?: string;
  label: string;
  nodeIds: string[];
}): NeuronStoryBeat {
  const beat: NeuronStoryBeat = {
    id: input.id?.trim() ? input.id.trim() : crypto.randomUUID(),
    label: input.label,
    nodeIds: input.nodeIds,
  };

  return normalizeStoryBeat(beat);
}

export function createStudyPathFromNodeIds(
  nodeIds: string[],
  options?: { label?: string; stepDurationMs?: number }
): StudyPathRequest {
  const deduped = dedupePreserveOrder(nodeIds).filter(
    (value) => typeof value === 'string' && value.trim().length > 0
  );

  return {
    label: options?.label,
    stepDurationMs: options?.stepDurationMs,
    steps: deduped.map((nodeId) => ({ nodeId })),
  };
}

export function createStudyPathFromBeat(
  beat: NeuronStoryBeat,
  options?: { stepDurationMs?: number }
): StudyPathRequest {
  const normalized = normalizeStoryBeat(beat);
  return createStudyPathFromNodeIds(normalized.nodeIds, {
    label: normalized.label,
    stepDurationMs: options?.stepDurationMs,
  });
}

function dedupePreserveOrder<T>(values: T[]): T[] {
  const seen = new Set<T>();
  const result: T[] = [];
  values.forEach((value) => {
    if (seen.has(value)) return;
    seen.add(value);
    result.push(value);
  });
  return result;
}

