# NeuronWeb Visual Baseline Audit

## Test Setup
- Scenario source: `examples/basic-usage` with synthetic graph data (seeded, fuzzy layout).
- Viewport: 1440 × 900 (Playwright headless Chromium).
- Performance sampling: 2s `requestAnimationFrame` sample; memory from `performance.memory` (JS heap only; excludes GPU).
- Performance mode thresholds: normal ≤ 180 nodes, degraded 181–360 nodes, fallback > 360 nodes.

## Snapshots

| Scenario | Performance Mode | Screenshot |
| --- | --- | --- |
| 50 nodes | normal | `docs/visualization/assets/baseline-50.png` |
| 200 nodes | degraded | `docs/visualization/assets/baseline-200.png` |
| 500 nodes | fallback | `docs/visualization/assets/baseline-500.png` |

## Visual Baseline Findings

1. **Edge density overwhelms the scene** at 200+ nodes. The wireframe becomes a uniform veil with no implied hierarchy or direction, obscuring node locations.
2. **Labels disappear entirely in degraded/fallback modes**, which removes nearly all semantic context for larger graphs and makes exploration guesswork.
3. **Node size/importance cues are too subtle**. Tier scaling is minimal and the glow texture is uniform, so primary/insight nodes do not stand out.
4. **Focus states lack a strong visual anchor**. Hover/click feedback is subtle; there is no ring, ripple, or edge-emphasis moment that clearly marks selection.
5. **Ambient motion feels static**. Starfield and nodes have minimal perceptible motion; edge flow is subtle, so the overall graph feels “paused.”
6. **Color encoding is underutilized**. Without explicit domain colors, the scene defaults to a single hue, reducing scanability.
7. **Hover card readability is limited**. The card is readable but text density is low and alignment to the node feels loose when the camera moves.

## Baseline Performance Notes

| Scenario | Mode | Avg FPS (2s) | JS Heap Used | JS Heap Total |
| --- | --- | --- | --- | --- |
| 50 nodes | normal | ~60.4 fps | ~70.7 MB | ~123.5 MB |
| 200 nodes | degraded | ~60.2 fps | ~106.3 MB | ~146.8 MB |
| 500 nodes | fallback | ~60.3 fps | ~127.3 MB | ~168.0 MB |

## Recording Note

Short recordings were not captured in the headless environment. For motion references, record 10–15s clips locally while running `pnpm exec next dev -H 127.0.0.1 -p 3100` and visiting `/?count=50`, `/?count=200`, and `/?count=500`.
