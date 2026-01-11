# NeuronWeb Visual Baseline Audit

## Test Setup
- Scenario source: `examples/basic-usage` with synthetic graph data (deterministic by `count`) and seeded layout.
- Viewport: 1440 × 900 (recommended for repeatable screenshots).
- Snapshot capture: manual (v1) using a local browser; record the URL and save the image under `docs/visualization/assets/`.
- Performance sampling: 2s `requestAnimationFrame` sample; memory from `performance.memory` (JS heap only; excludes GPU).
- Performance mode thresholds: normal ≤ 180 nodes, degraded 181–360 nodes, fallback > 360 nodes.

### How to capture baseline screenshots (manual procedure)

1) Start the demo app:

```bash
cd examples/basic-usage
pnpm install
pnpm dev -- -H 127.0.0.1 -p 3100
```

2) Open the scenario URL (examples below) and set the viewport to 1440 × 900.
3) Wait ~2 seconds for the scene to settle (first render, labels, postprocessing).
4) Capture a screenshot and save it to `docs/visualization/assets/` using the filename in the table.

## Snapshots

| Scenario | Performance Mode | Screenshot |
| --- | --- | --- |
| 50 nodes | normal | `docs/visualization/assets/baseline-50.png` |
| 200 nodes | degraded | `docs/visualization/assets/baseline-200.png` |
| 500 nodes | fallback | `docs/visualization/assets/baseline-500.png` |

## Phase 4C Preset Baselines (Rendering + Animation Depth)

Phase 4C adds `rendering.preset` (`minimal`/`subtle`/`cinematic`) plus deeper edge/label/animation options.
These baseline targets ensure changes remain visually stable and gating works as intended.

At minimum, capture **one normal-mode baseline per preset**:

| Preset | URL | Screenshot target |
| --- | --- | --- |
| minimal | `/?count=120&perf=normal&preset=minimal` | `docs/visualization/assets/rendering-minimal-normal.png` |
| subtle | `/?count=120&perf=normal&preset=subtle` | `docs/visualization/assets/rendering-subtle-normal.png` |
| cinematic | `/?count=120&perf=normal&preset=cinematic` | `docs/visualization/assets/rendering-cinematic-normal.png` |

Optional (recommended) gating baselines:

| Preset | Perf | URL | Screenshot target |
| --- | --- | --- | --- |
| cinematic | degraded | `/?count=240&perf=degraded&preset=cinematic` | `docs/visualization/assets/rendering-cinematic-degraded.png` |
| cinematic | fallback | `/?count=500&perf=fallback&preset=cinematic&effects=0` | `docs/visualization/assets/rendering-cinematic-fallback.png` |

Optional interaction baselines (manual checks; screenshots are secondary to behavior):

| Interaction | URL | Expected behavior |
| --- | --- | --- |
| Hover label LOD + card | `/?count=120&perf=normal&preset=subtle&cards=hover` | Hover highlights node + label; card fades in; edges emphasize |
| Click focus | `/?count=120&perf=normal&preset=subtle&cards=click` | Click selects, ripples, focuses camera (normal mode) |
| Story playback | `/?count=120&perf=normal&preset=subtle&beat=beat-1` | Auto-advances focus across nodes; edges highlight between steps |
| Resolver demo | `/?count=120&perf=normal&preset=subtle&resolver=1` | Insight nodes styled distinctly; strong/weak edges differ |

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

Short recordings were not captured in CI for v1. For motion references, record 10–15s clips locally while running the demo app and visiting:
- `/?count=120&perf=normal&preset=subtle`
- `/?count=120&perf=normal&preset=cinematic`
- `/?count=120&perf=normal&preset=subtle&beat=beat-1`
