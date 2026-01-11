# Animation Profiles (Phase 4C.8)

This document defines the animation profile system for Phase 4C.

Goals:
- Provide predictable behavior via a small set of named profiles.
- Make performance + accessibility behavior explicit (mode gates + reduced motion).
- Keep defaults aligned with the storyboard (`docs/visualization/animation-storyboard.md`) and budgets (`docs/visualization/performance-budgets.md`).

---

## Profile Names (v1)

Recommended v1 set:
- `off` — disable animations (except essential state changes).
- `minimal` — low motion, fast transitions, still responsive.
- `subtle` — tasteful motion, conservative continuous effects.
- `cinematic` — richer motion in normal mode; strict auto-gating as density increases.

Profiles are exposed via:
- `rendering.animations.profile` (see `src/visualization/types.ts`)

Optional explicit overrides (advanced):
- `rendering.animations.focusDurationMs`
- `rendering.animations.transitionDurationMs`
- `rendering.animations.easing`

---

## Feature Matrix (by profile)

Legend:
- ✅ enabled
- 🟡 enabled with gating (mode/reduced motion)
- ❌ disabled

| Feature | off | minimal | subtle | cinematic |
| --- | --- | --- | --- | --- |
| Hover scale | ❌ | ✅ (short) | ✅ | ✅ |
| Selection pulse | ❌ | ✅ (reduced) | ✅ | ✅ |
| Selection ripple ring | ❌ | ✅ | ✅ | ✅ |
| Camera tween (focus) | ❌ (snap) | ✅ (short) | ✅ | ✅ |
| Ambient node drift | ❌ | ❌ | 🟡 (normal only) | 🟡 (normal only) |
| Edge flow (pulse/dash) | ❌ | ❌ | 🟡 (normal only) | 🟡 (normal only) |
| Filter/visibility transition | ✅ (fade only) | ✅ | ✅ | ✅ |
| Graph update transitions (enter/exit) | ❌ | ❌ | 🟡 (normal only) | 🟡 (normal only) |
| Layout change interpolation | ❌ | ❌ | 🟡 (normal only) | 🟡 (normal only) |

Notes:
- Even when “enabled”, each feature must respect performance mode gates.
- “off” still allows **state updates**; it does not freeze interactivity.

---

## Performance Mode Gates (defaults)

In addition to profile selection, the visualization enforces mode gating:
- `normal`: full experience (subject to profile)
- `degraded`: reduce continuous effects, keep responsiveness
- `fallback`: safest behavior; minimal overlays

Recommended profile behavior by mode:
- `normal`: use configured profile directly
- `degraded`: clamp `cinematic → subtle`, `subtle → subtle`, `minimal → minimal`, `off → off`
- `fallback`: clamp all profiles to `minimal` or `off` (project choice), with overlays disabled as needed

These defaults should remain aligned with the budgets table in `docs/visualization/performance-budgets.md`.

---

## Reduced Motion Policy (`prefers-reduced-motion`)

Reduced motion is a hard governor, not a suggestion.

When `prefers-reduced-motion: reduce`:
1) Disable all **continuous** animations:
   - ambient drift
   - edge flow / dash scrolling
   - pulsing “alive” motion
2) Remove “slide” transitions:
   - hover cards become fade-only
3) Camera motion policy (choose one):
   - **Option A (recommended):** clamp focus tween duration to ≤ 400ms
   - **Option B:** snap focus without tweening

Profile clamping recommendation:
- treat any profile as `minimal` (or `off` if user explicitly chose off)

---

## Timing Defaults (recommended)

These numbers are targets; the theme defaults may still act as the baseline until Phase 4C wiring is complete.

| Setting | minimal | subtle | cinematic |
| --- | --- | --- | --- |
| Focus duration (normal) | 350–450ms | 650–850ms | 800–1100ms |
| Focus duration (degraded) | 250–400ms | 500–750ms | 650–850ms |
| Transition duration (filter) | 250–450ms | 500–750ms | 650–900ms |
| Hover scale ramp | 80–120ms | 100–140ms | 120–160ms |
| Selection pulse duration | 320–450ms | 450–650ms | 520–800ms |
| Easing | easeOut / easeInOut | easeInOut | easeInOut |

---

## Implementation Notes (internal)

When implementing profiles:
- Avoid per-frame branching explosion; resolve “enabled flags” once per update.
- Make profile selection deterministic and easy to test (pure mapping from inputs → flags/values).
- Ensure all time-bounded animations are cancelable to avoid runaway RAF work.
