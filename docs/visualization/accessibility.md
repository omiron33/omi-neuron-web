# Visualization Accessibility Notes

## Reduced Motion

NeuronWeb honors `prefers-reduced-motion` by disabling the following (hard governor, not a hint):

- Ambient node drift
- Edge flow animation
- Selection pulse and ripple
- Camera tween animations (focus snap instead)
- Hover card slide-in (fade only)

Phase 4C notes:
- Filter transitions become fade-only (no zoom/blur transforms).
- Label LOD transitions are disabled (labels still show/hide deterministically; no scale animation).

This behavior is automatic and does not require additional configuration. Manual overrides can still be applied via theme/rendering settings, but reduced-motion always takes precedence.

### How to validate reduced motion (manual checklist)

1) Enable reduced motion at the OS level.
2) Start the demo app (`examples/basic-usage`) and visit:
   - `/?count=120&perf=normal&preset=subtle`
   - `/?count=120&perf=normal&preset=cinematic&edges=curved&arrows=1&flow=dash`
   - `/?count=120&perf=normal&preset=subtle&beat=beat-1`
3) Confirm:
   - nodes do not “float” continuously (no ambient drift)
   - edges do not pulse/scroll (no flow animation)
   - selection does not pulse/ripple continuously
   - camera focuses snap (no tween)

### Global animation disable (profile off)

Use `rendering.animations.profile: 'off'` to disable animation behaviors even when reduced motion is not enabled:

```tsx
<NeuronWeb
  graphData={{ nodes, edges }}
  rendering={{ animations: { profile: 'off' } }}
/>
```

## Focus Visibility

- Selected nodes scale up and brighten for visual focus.
- Connected edges emphasize active context (higher opacity + active color).
- Hover cards use high contrast backgrounds with white text.

## Contrast

Default hover and click cards use deep backgrounds with white text and subtle borders. For custom themes, ensure contrast meets WCAG AA where possible.

## Keyboard Navigation (Phase 4C)

NeuronWeb is focusable and supports a small keyboard interaction set intended for basic accessibility and demos:

- `Tab`: focus the NeuronWeb region.
- `Arrow keys` (uncontrolled selection only): cycle selection across visible nodes.
- `Enter` / `Space`: focus the camera on the selected node (when click-zoom is enabled).
- `Escape`: stop story playback; clears selection in uncontrolled mode (or calls `onBackgroundClick` in controlled mode).

If you need richer keyboard UX (search, filtering, ARIA tree navigation), use external UI controls and drive NeuronWeb via:
- `selectedNode` (controlled selection)
- `focusNodeSlug` (programmatic focus)
- `visibleNodeSlugs` (visibility filtering)

## Notes

- For deterministic demo URLs, see `docs/visualization/polish-demos.md` and `docs/visualization/visual-baseline.md`.
