# Visualization Polish Demos

Use the `examples/basic-usage` app to exercise the polish features. Start the demo app:

```bash
cd examples/basic-usage
pnpm install
pnpm exec next dev -H 127.0.0.1 -p 3100
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

## Notes

- `perf` overrides auto mode to force a performance tier.
- `effects=0` disables postprocessing and ambient motion.
- `cards` can be `hover`, `click`, `both`, or `none`.
