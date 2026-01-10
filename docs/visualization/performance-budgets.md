# NeuronWeb Performance Budgets

## Goals
- Preserve cinematic motion in **normal** mode without sacrificing interactivity.
- Maintain **degraded** mode readability and hover/click affordances with reduced visual load.
- Ensure **fallback** mode remains responsive and safe for large graphs.

## Mode Targets

| Mode | Node Count Range | FPS Target | Primary Goal |
| --- | --- | --- | --- |
| normal | 0–180 nodes | 60 fps (floor 55) | Full cinematic feel; rich interactions |
| degraded | 181–360 nodes | 45–55 fps (floor 40) | Maintain clarity; reduce density + effects |
| fallback | 361–800 nodes | 30–45 fps (floor 28) | Keep interaction stable; minimal effects |

> Note: In auto mode, the thresholds above are the default gating boundaries. Manual `performanceMode` overrides auto gating.

## Effect Tier Matrix

| Feature | normal | degraded | fallback |
| --- | --- | --- | --- |
| Labels | On (distance + max count) | Off by default | Off |
| Hover cards | On | On | Off |
| Click card | On | On | Off |
| Click zoom | On | On | On (shorter duration) |
| Ambient node motion | On | Off (or low amplitude) | Off |
| Edge flow animation | On | Off | Off |
| Selection pulse/ripple | On | On (reduced) | On (minimal) |
| Starfield | On (full count) | On (reduced count) | Optional (off by default) |
| Fog + atmosphere | On | On (reduced intensity) | Off |
| Postprocessing (bloom/vignette/grade) | On | Off | Off |

## Default Gating Rules

1. **Auto mode** selects `normal`, `degraded`, or `fallback` based on node count.
2. **Manual `performanceMode`** overrides all auto gating.
3. **Reduced motion** (prefers-reduced-motion) disables ambient motion, edge flow, and any camera tween longer than 400ms.
4. **Labels** render only in `normal` mode; if enabled, cap counts and distance thresholds to avoid overdraw.
5. **Hover + click cards** disable in fallback to prevent layout thrash and keep pointer latency low.
6. **Postprocessing** is opt-in for `normal` and always disabled in `degraded` and `fallback`.
7. **Starfield density** scales with mode (normal > degraded > fallback).
8. **Density controls** should tighten edge opacity + node spacing in degraded/fallback to reduce clutter.

## Visual Targets (Qualitative)

- **Normal:** subtle but continuous motion, clear selection highlights, readable labels, and smooth hover transitions.
- **Degraded:** less motion, fewer labels, still readable node hierarchy, and responsive hover/click focus.
- **Fallback:** static but legible graph with minimal overlays; interaction should feel immediate.

## Reference Baseline

See `docs/visualization/visual-baseline.md` for initial FPS/memory measurements and screenshots.

## Post-Polish Headless Measurements (Jan 9, 2026)

Measured via Playwright headless Chromium (2s `requestAnimationFrame` sample).

| Scenario | Mode | Avg FPS | JS Heap Used | JS Heap Total |
| --- | --- | --- | --- | --- |
| 50 nodes | normal | ~60.2 fps | ~67.5 MB | ~74.1 MB |
| 200 nodes | degraded | ~60.3 fps | ~81.3 MB | ~104.5 MB |
| 500 nodes | fallback | ~60.2 fps | ~93.7 MB | ~125.4 MB |

Notes:
- Headless FPS tends to be optimistic; treat as a floor check.
- Postprocessing was enabled in normal mode and disabled in fallback mode for the above.
