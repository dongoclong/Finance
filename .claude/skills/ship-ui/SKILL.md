---
name: ship-ui
description: The done-checklist for any UI change in this repo — typecheck, build, run, look at it at two widths and in both themes. Use when a feature or screen is "finished", before reporting completion, or when the user asks to verify/QA the app.
---

# Ship a UI change

"It compiles" is not done. Run all four gates, in order. Report a gate that fails —
never report completion with a red gate.

## 1. Types

```bash
npx tsc --noEmit -p tsconfig.app.json
```

Zero errors. No `@ts-expect-error` added to pass this gate.

## 2. Build

```bash
npm run build
```

Watch the bundle line. Over 400KB gzipped → find the import that did it
(usually a whole icon or date library pulled in by a default import).

## 3. Run and actually look

```bash
npm run dev
```

Then use the `browser-automation` skill to load the page: it reports console errors,
failed requests, and takes a screenshot. **Look at the screenshot.** A screen that
typechecks and builds can still be overlapping, clipped or blank.

Zero console errors and zero failed requests are part of the gate, including React
key warnings and controlled/uncontrolled input warnings.

## 4. The two-width, two-theme pass

| Check | Pass condition |
|---|---|
| 1440px, light | hierarchy reads; one hero number; no orphaned whitespace |
| 375px, light | no horizontal scroll; nothing clipped; 16px side gutter |
| 1440px, dark | surfaces are selected dark values, not washed-out light ones |
| 375px, dark | charts legible on the dark surface; no white flash on load |

Then walk `frontend-craft/references/a11y-checklist.md` — all ten.

## Reporting

Say what you verified and how. "Typechecks, builds at 312KB, loads with no console
errors, screenshot checked at 1440 and 375 in both themes" — or name the gate you
could not clear and why.
