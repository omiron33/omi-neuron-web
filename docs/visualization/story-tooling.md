# Story Tooling (Beats + Study Paths)

`NeuronWeb` supports two “story” mechanisms:
- **Story beats**: `graphData.storyBeats[]` + `activeStoryBeatId` (play a named beat)
- **Study paths**: `studyPathRequest` (play an ordered path of steps)

Phase 7F adds small, optional **helper utilities** so consuming apps can build and validate story data without re-implementing glue logic.

## Imports

```ts
import {
  validateStoryBeat,
  normalizeStoryBeat,
  createStoryBeat,
  createStudyPathFromNodeIds,
  createStudyPathFromBeat,
} from '@omiron33/omi-neuron-web/visualization';
```

Types:

```ts
import type { NeuronStoryBeat, StudyPathRequest } from '@omiron33/omi-neuron-web/visualization';
```

## Story beats

Minimal contract:

```ts
export interface NeuronStoryBeat {
  id: string;
  label: string;
  nodeIds: string[];
}
```

### `validateStoryBeat(beat)`

Validates the minimal contract and returns a small tagged result:

- ensures `id` and `label` are non-empty
- ensures `nodeIds` is an array
- normalizes/dedupes ids (via `normalizeStoryBeat`)
- requires at least **2 node ids** after normalization (a beat should move somewhere)

```ts
const result = validateStoryBeat(beat);
if (!result.ok) {
  throw new Error(result.error);
}
```

### `normalizeStoryBeat(beat)`

Normalizes a beat into a stable representation:
- trims `id` and `label`
- removes empty ids
- de-duplicates `nodeIds` while **preserving order**

This is useful before persisting beats or using them as keys in UI state.

### `createStoryBeat({ id?, label, nodeIds })`

Creates a normalized beat. If `id` is omitted, it generates one via `crypto.randomUUID()`.

```ts
const beat = createStoryBeat({
  label: 'UAP → Nephilim → Jude 6',
  nodeIds: ['uap', 'neph', 'jude6'],
});
```

## Study paths

`StudyPathRequest` drives the playback engine directly:

```ts
export interface StudyPathRequest {
  steps?: { nodeSlug?: string; nodeId?: string; label?: string; summary?: string }[];
  label?: string;
  stepDurationMs?: number;
  fromNodeId?: string;
  toNodeId?: string;
}
```

### `createStudyPathFromNodeIds(nodeIds, options?)`

Builds `steps[]` from an ordered list of node ids:
- removes empty ids
- de-duplicates while preserving order
- maps to `{ nodeId }` steps

```ts
const request = createStudyPathFromNodeIds(['uap', 'neph', 'jude6'], {
  label: 'My Tour',
  stepDurationMs: 4200,
});
```

### `createStudyPathFromBeat(beat, options?)`

Convenience wrapper:
- normalizes the beat
- uses `beat.label` as the study path label
- passes through `stepDurationMs` override if provided

```ts
const request = createStudyPathFromBeat(beat, { stepDurationMs: 3200 });
```

## Wiring into `NeuronWeb`

### 1) Play a story beat by id

```tsx
<NeuronWeb
  graphData={{ nodes, edges, storyBeats: [beat] }}
  activeStoryBeatId={beat.id}
  onStoryBeatComplete={(completedBeat) => console.log('Beat finished:', completedBeat.id)}
/>;
```

### 2) Play a study path

```tsx
<NeuronWeb
  graphData={{ nodes, edges }}
  studyPathRequest={request}
  onStudyPathComplete={() => console.log('Path complete')}
/>;
```

Notes:
- If `studyPathRequest` is set, it takes precedence over `activeStoryBeatId`.
- Beats and paths are purely client-side playback; they do not mutate storage.

