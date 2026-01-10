# Hover Card System Design

## Overview
Hover cards render as DOM overlays anchored to hovered nodes. They are screen-space clamped and follow the node smoothly as the camera moves. Hover cards are lightweight, non-interactive (pointer-events none), and defer to the click card for persistent details.

## Anchoring Rules

- **Anchor point:** `worldToScreen(node.position)` each frame.
- **Offset:** default `[18, 18]` (configurable via `hoverCard.offset`).
- **Clamp:** keep within 8px of viewport edges.
- **Arrow/pin:** optional later; base implementation uses offset only.

## Hysteresis / Flicker Control

- **Enter delay:** ~120–160ms (derived from `hoverCardFadeDuration`).
- **Exit delay:** 80–120ms to prevent flicker when pointer briefly leaves.
- **Hover lock:** if pointer moves within 6–10px of last hit or the node remains under cursor, keep card visible.
- **Pointer safety:** hover card uses `pointer-events: none` so it cannot steal hover.

## Z-Ordering

1. **Click card** (highest, `z-index: 5`)
2. **Hover card** (`z-index: 4`)
3. **Scene overlays** (filter shimmer, etc.)
4. **Canvas**

## Interaction Flow

```
Pointer move → InteractionManager hit test
           → onNodeHover(node)
           → setHoveredNodeId
           → show hover card (fade + slide)
           → per-frame position updates

Pointer leave → onNodeHover(null)
             → hide hover card (fade out)
```

## Integration Points

- **InteractionManager** emits hover events for nodes.
- **NeuronWeb** stores `hoveredNodeId`, controls card visibility.
- **Renderer loop** updates hover card position using `worldToScreen`.

## Proposed Component Structure

```
HoverCardOverlay
  ├─ CardContainer (positioned, clamped)
  ├─ Header (title + subtitle)
  ├─ Summary
  ├─ Tags
  └─ Metrics / Footer
```

## Pointer + Jitter Rules

- Update card position every frame but apply a small lerp (0.12–0.2) to reduce jitter.
- Avoid reflow: only update `transform` (translate) on each frame.
- If node is off-screen, hide hover card immediately.
