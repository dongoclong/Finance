---
name: frontend-craft
description: Elite front-end standards for this repo — design tokens, component architecture, state boundaries, accessibility, motion and performance budgets. Load BEFORE writing or restyling any React/TSX component, any CSS, any layout, any page, or any UI copy. Triggers on "make a screen", "build a component", "style it", "make it look good", "dashboard", "form", "modal", "table", "responsive", "dark mode", "animation".
---

# Front-end craft

UI is judged in 400ms. The goal is not "looks nice" — it is **legible hierarchy,
honest state, and zero jank**. Everything below is a rule, not a preference.

## The order of work (never skip, never reorder)

1. **Data shape first.** Write the TS type of what the screen shows before a single `<div>`.
   If the type is ugly, the screen will be ugly.
2. **Hierarchy second.** Decide the ONE thing the eye lands on. Everything else is
   demoted. A screen with three "heroes" has none.
3. **Layout third.** Grid + spacing scale only. No magic pixel values.
4. **States fourth.** Every async surface ships all four: `loading · empty · error · ready`.
   An empty state with no call-to-action is a bug.
5. **Color last.** Roles, not hexes. See `references/design-tokens.md`.
6. **Look at it.** Run the app, open the page, resize to 375px. Reading the code is not verification.

## Non-negotiables

- **Tokens only.** Never a raw hex, never `text-[#1a1a1a]`, never `mt-[13px]` in a component.
  Colors come from semantic CSS variables; spacing from the 4px scale. New color → add a token.
- **One source of truth per piece of state.** Derived values are computed with `useMemo`,
  never mirrored into a second `useState`. Mirrored state is the #1 bug source in dashboards.
- **Server/store state ≠ UI state.** Domain data lives in the store; "is this dropdown open"
  lives in the component. Never put ephemeral UI flags in the global store.
- **No `any`. No `as` to silence the compiler.** If a cast is truly needed, it gets a comment
  explaining the invariant that makes it safe.
- **Money is never a float.** See the `finance-domain` skill. Integers of the minor unit.
- **Every interactive element is reachable by keyboard and has an accessible name.**
  `<div onClick>` is a defect. Use `<button>`.
- **Lists have stable keys from the data's identity.** Never the array index for reorderable rows.
- **No layout shift.** Skeletons occupy the exact final height. Images and charts have
  reserved boxes.
- **Numbers that sit in a column get `tabular-nums`.** Big standalone numbers do not.

## Visual system in one paragraph

Neutral, low-chroma surfaces; one accent used sparingly; a hairline border instead of a
shadow wherever possible; radius consistent per element class (cards 16px, controls 10px,
pills full); shadows only to indicate genuine elevation (menus, dialogs, drag). Density is
**comfortable, not cramped**: 16–24px card padding, 8px between related items, 24–32px
between sections. Type scale is 12/13/14/16/20/28/40 — five sizes max on a screen, weight
and color carry the rest of the hierarchy.

## Component contract

Every component in `src/components/` obeys:

```tsx
type Props = {
  /* required data first, optional config after, callbacks last */
};
```

- Presentational components take data + callbacks. They do **not** reach into the store.
  Containers (`src/features/*`) read the store and pass down. This keeps components
  testable and re-skinnable.
- One component per file, named export matching the filename.
- No component over ~150 lines. If it grows, the sub-parts wanted to be components.
- `className` is accepted and merged last (via `cn()`), so callers can adjust spacing
  without prop explosion.

## Performance budget

- First paint under 1.5s on a cold local dev load; bundle under 400KB gzipped.
- Charts are memoized and receive **pre-aggregated** data. Never aggregate inside render.
- Lists over 100 rows are virtualized or paginated.
- No `useEffect` for anything derivable during render. Effects are for subscriptions,
  timers, and syncing to the outside world only.

## References

| File | Read it when |
|---|---|
| `references/design-tokens.md` | Choosing any color, spacing, radius, shadow or type size |
| `references/react-architecture.md` | Creating files, deciding where state lives, naming things |
| `references/interaction-and-motion.md` | Adding hover, focus, transitions, toasts, dialogs |
| `references/a11y-checklist.md` | Before calling any screen done |

**For any chart, meter, KPI tile or dashboard layout, load the `dataviz` skill too** —
its palette and mark specs override generic instincts.
