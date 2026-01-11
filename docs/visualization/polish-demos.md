# Visualization Polish Demos

Use the `examples/basic-usage` app to exercise the polish features. Start the demo app:

```bash
cd examples/basic-usage
pnpm install
pnpm dev -- -H 127.0.0.1 -p 3100
```

## Demo Scenarios

### Idle (ambient motion)
- `/?count=120&perf=normal&effects=1&density=balanced&cards=hover`

### Hover (card + edge emphasis)
- `/?count=120&perf=normal&cards=hover`
- Move cursor across nodes and confirm hover card hysteresis.

### Click/Focus (ripple + camera tween)
- `/?count=120&perf=normal&cards=click`
- Click nodes to trigger ripple and focus edges.

### Density modes
- Relaxed: `/?count=180&perf=normal&density=relaxed`
- Balanced: `/?count=180&perf=normal&density=balanced`
- Compact: `/?count=180&perf=normal&density=compact`

### Degraded mode
- `/?count=240&perf=degraded&density=compact&cards=hover`

### Fallback mode
- `/?count=500&perf=fallback&effects=0&cards=none`

## Rendering + Animation Depth (Phase 4C)

### Preset demos

- Minimal: `/?count=120&perf=normal&preset=minimal`
- Subtle (recommended default): `/?count=120&perf=normal&preset=subtle`
- Cinematic (normal-mode only richness): `/?count=120&perf=normal&preset=cinematic`

### Edge style demos

- Curves + arrows + dash flow (gated to normal): `/?count=120&perf=normal&preset=cinematic&edges=curved&arrows=1&flow=dash`
- Straight + pulse flow: `/?count=120&perf=normal&preset=subtle&edges=straight&flow=pulse`

### Resolver demo (deterministic)

- `/?count=120&perf=normal&preset=subtle&resolver=1`

### Story playback demo

- `/?count=120&perf=normal&preset=subtle&beat=beat-1`

## Notes

- `perf` overrides auto mode to force a performance tier.
- `effects=0` disables postprocessing and ambient motion.
- `cards` can be `hover`, `click`, `both`, or `none`.
- `preset` can be `minimal`, `subtle`, or `cinematic`.
- `resolver=1` enables a deterministic `rendering.resolvers` demo.
- `beat=beat-1` starts story playback for the synthetic graph.
