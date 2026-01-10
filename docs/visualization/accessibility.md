# Visualization Accessibility Notes

## Reduced Motion

NeuronWeb honors `prefers-reduced-motion` by disabling the following:

- Ambient node drift
- Edge flow animation
- Selection pulse and ripple
- Camera tween animations (focus snap instead)
- Hover card slide-in (fade only)

This behavior is automatic and does not require additional configuration. Manual overrides can still be applied via theme settings, but reduced-motion always takes precedence.

## Focus Visibility

- Selected nodes scale up and brighten for visual focus.
- Connected edges emphasize active context (higher opacity + active color).
- Hover cards use high contrast backgrounds with white text.

## Contrast

Default hover and click cards use deep backgrounds with white text and subtle borders. For custom themes, ensure contrast meets WCAG AA where possible.

## Notes

- Keyboard navigation is not yet wired to node focus; consumers can trigger focus via `focusNodeSlug` and `onNodeFocused`.
