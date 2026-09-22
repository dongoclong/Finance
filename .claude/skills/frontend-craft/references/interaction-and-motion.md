# Interaction & motion

## Focus

Visible focus ring on every interactive element: `2px` accent ring + `2px` offset in
the surface color. Never `outline: none` without a replacement. Focus order follows
the DOM; dialogs trap focus and restore it to the trigger on close.

## Hover & hit targets

- Minimum hit target 40×40px, even when the visual is smaller (pad, don't grow).
- Hover is a wash (`--bg-subtle`), not a color change on text.
- Rows that are clickable get `cursor-pointer` **and** a keyboard path.
- Chart marks: the hover target is larger than the mark. Lines/areas get a crosshair
  + tooltip; bars/dots/cells get a per-mark tooltip. This is default, not a nicety.

## Motion budget

| Thing | Duration | Easing |
|---|---|---|
| Hover / focus tint | 120ms | `ease-out` |
| Dropdown, tooltip, popover | 150ms | `cubic-bezier(.2,.8,.2,1)` |
| Dialog, sheet | 220ms | same |
| Chart data transition | 400ms | `ease-out` |

Animate `transform` and `opacity` only. Animating `height`, `top` or `box-shadow`
causes jank. Nothing over 400ms. Nothing bounces. Nothing loops.

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: .01ms !important; transition-duration: .01ms !important; }
}
```

This block is mandatory in globals.

## Feedback

- Destructive actions confirm, and the confirm button names the act ("Xoá giao dịch"),
  never "OK".
- Anything that mutates data shows a result: a toast, an updated number, a row that
  appears. Silent success reads as a broken button.
- Optimistic updates roll back visibly on failure.
