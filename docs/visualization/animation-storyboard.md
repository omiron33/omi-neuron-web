# NeuronWeb Animation Storyboard

This storyboard defines the core interaction sequences and timing guidance for the visualization polish pass. Values align with the existing theme defaults unless otherwise noted.

## Timing Reference

- **Easing:** `easeInOut` for camera and major transitions; `easeOut` for hover cards.
- **Focus duration:** 800ms (camera tween)
- **Transition duration:** 650ms (filter/fade transitions)
- **Hover card fade:** 160ms
- **Selection pulse:** 520ms

## Idle State (ambient)

**Goal:** Subtle motion that keeps the scene alive without distracting.

- **Node drift:** Sinusoidal float, amplitude 0.25, speed 0.6 (normal mode only).
- **Edge flow:** Low-amplitude pulse along edges (normal mode only).
- **Starfield:** Slow parallax drift; reduce count in degraded mode.
- **Insight nodes:** Optional slow pulse every 5–7s (pulse scale +0.12, 400ms).

## Hover State

**Trigger:** Pointer enters a node hit target.

**Sequence:**
1. **Node highlight:** scale to `hoverScale` (1.12) over 120ms, slight glow gain (+0.1).
2. **Edge emphasis:** edges connected to node pulse slightly; others fade to 35–50% opacity.
3. **Hover card:** fade + slide in (opacity 0 → 1, translateY -6px → 0) over 160ms; lock position to node.
4. **Cursor:** switch to pointer.

**Exit:**
- Reverse scale/glow in 120ms.
- Hover card fade out over 120ms.
- Restore edge opacities over 180ms.

## Click / Focus State

**Trigger:** Pointer click on node.

**Sequence:**
1. **Selection ring:** spawn ripple ring at node (600ms) with opacity falloff.
2. **Selected scale:** scale to `selectedScale` (1.4) over 160ms.
3. **Selection pulse:** run 520ms pulse (scale +0.35) once, then settle.
4. **Camera tween:** 800ms `easeInOut` to focus on node (respect reduced-motion).
5. **Edge emphasis:** connected edges move to active color and 100% opacity; others dim to 20%.
6. **Click card:** fade in after 180ms, pinned to node with slight offset.

**Exit (background click):**
- Fade selection ring if active (120ms).
- Return scale to base over 160ms.
- Restore edge opacities over 200ms.
- Hide click card over 160ms.

## Filter / Visibility Transitions

**Trigger:** `visibleNodeSlugs` or layout changes.

**Sequence:**
1. **Scene fade:** opacity 1 → 0.85 over 650ms.
2. **Micro zoom:** scale 1 → 0.985 over 650ms.
3. **Blur:** subtle blur in/out (1px max) over 650ms.
4. **Overlay shimmer:** radial gradient overlay fades in/out with the same timing.

**Notes:** Avoid per-node entrance/exit animations in degraded/fallback; keep global transition only.

## Reduced Motion Rules

- Disable node drift and edge flow.
- Limit camera tween to ≤400ms or snap if user preference indicates.
- Keep hover/click cards but remove slide (fade only).

## Mode Overrides (summary)

- **Normal:** All sequences enabled.
- **Degraded:** No drift/edge flow, reduced pulse intensity, fewer labels.
- **Fallback:** No drift/edge flow, no hover cards, minimal selection pulse.
