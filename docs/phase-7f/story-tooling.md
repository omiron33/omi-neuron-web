# Phase 7F — Story Tooling Improvements (Design Draft)

`NeuronWeb` already supports two “story” mechanisms:
- `graphData.storyBeats[]` + `activeStoryBeatId` (play a beat by id)
- `studyPathRequest` (explicit ordered steps)

This document proposes a small set of **utilities** (not a UI editor) to make it easier for consumers to build curated tours and story beats without re-implementing glue logic.

## Goals
- Provide a **portable, serializable** story description format (already mostly true with `NeuronStoryBeat`).
- Provide **helper utilities** to build/validate story beats and study paths.
- Keep story tooling **optional and headless** (no design-system UI).

## Non-goals
- A full story editor UI
- A full “tour engine” with branching logic / workflow state machines

## Current Contract (baseline)

### Story beats
```ts
export interface NeuronStoryBeat {
  id: string;
  label: string;
  nodeIds: string[];
}
```

### Study path
```ts
export interface StudyPathRequest {
  steps?: StudyPathStep[];
  label?: string;
  stepDurationMs?: number;
  fromNodeId?: string;
  toNodeId?: string;
}
```

## Proposed Utilities (v1)

Recommended export location:
- `src/visualization/story/` (new)
- re-export from `src/visualization/index.ts` as optional helpers

### 1) Validation helpers

```ts
export function validateStoryBeat(beat: NeuronStoryBeat): { ok: true } | { ok: false; error: string };
export function normalizeStoryBeat(beat: NeuronStoryBeat): NeuronStoryBeat;
```

Rules:
- `nodeIds.length >= 2` (a beat needs at least two nodes to be meaningful)
- stable ordering (dedupe while preserving order)

### 2) Study path composition

```ts
export function createStudyPathFromNodeIds(
  nodeIds: string[],
  options?: { label?: string; stepDurationMs?: number }
): StudyPathRequest;

export function createStudyPathFromBeat(
  beat: NeuronStoryBeat,
  options?: { stepDurationMs?: number }
): StudyPathRequest;
```

### 3) “Beat building” helpers

```ts
export function createStoryBeat(input: {
  id?: string;
  label: string;
  nodeIds: string[];
}): NeuronStoryBeat;
```

Default behavior:
- generate id when missing (e.g. `crypto.randomUUID()` on the server; allow consumer-supplied id in the browser)

## Integration with Explorer

Explorer wrapper can expose:
- list of story beats (from `graphData.storyBeats`)
- play action (sets `activeStoryBeatId`)
- optional “build study path” action for custom tours

## Open Questions
- Should the library provide an id generator fallback for the browser, or require the consumer to supply ids?
- Should story beats support metadata (e.g. description, accent color, “camera hint”) or keep minimal?

