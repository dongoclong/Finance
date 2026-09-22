# Design tokens

Tokens live in `src/styles/tokens.css` as CSS custom properties on `:root`, redefined
for dark mode. Components reference **roles**, never hues.

## Rule: every color used in UI is one of these roles

| Role | Meaning | Never used for |
|---|---|---|
| `--bg-plane` | the page behind the cards | card interiors |
| `--bg-surface` | card / panel interior | the page |
| `--bg-raised` | menus, dialogs, tooltips | static cards |
| `--bg-subtle` | inset wells, table header, hover wash | borders |
| `--ink-primary` | headings, values | body paragraphs |
| `--ink-secondary` | body, labels | axis ticks |
| `--ink-muted` | axis ticks, captions, placeholders | anything load-bearing |
| `--line` | hairline borders, gridlines | text |
| `--accent` | the single brand action color | data series |
| `--good` `--warn` `--bad` | status only | a 4th series color |
| `--series-1..8` | chart identity only | UI chrome |

Status and series colors are **disjoint sets**. A status color never impersonates a
series; a series color never means "good/bad".

## Dark mode is selected, not flipped

Dark values are chosen against the dark surface — not `filter: invert`, not the same
hex at lower opacity. Both scopes are declared so a manual toggle beats the OS:

```css
:root { --bg-surface: #fcfcfb; /* ... */ }
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) { --bg-surface: #1a1a19; /* ... */ }
}
:root[data-theme="dark"] { --bg-surface: #1a1a19; /* ... */ }
```

`body` always sets an explicit background. A page with a transparent body flashes white.

## Spacing — 4px scale, no exceptions

`4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 56 · 72`. Tailwind's `1 2 3 4 5 6 8 10 14 18`.
Anything else is a mistake, including `13px` "to make it line up" — fix the real cause.

Rhythm: 8px inside a group · 16px between groups · 24–32px between sections.

## Radius

| Element | Radius |
|---|---|
| Card / panel | `16px` (`rounded-2xl`) |
| Input, button, select | `10px` (`rounded-[10px]`) |
| Pill, badge, avatar | full |
| Chart bar data-end | `4px`, square at the baseline |

Nested radius: inner radius = outer − padding. Never equal, never larger.

## Elevation

Prefer a **hairline border** (`1px solid var(--line)`) over a shadow. Shadows mean
"this floats above the page and can be dismissed": menus, dialogs, drag previews,
sticky headers on scroll. Two shadow levels exist; there is no third.

## Type scale

| px | Use |
|---|---|
| 40 / 28 | hero figure (exactly one per view), page title |
| 20 | section / card title |
| 16 | body, input text |
| 14 | secondary body, table cells, labels |
| 13 | captions, axis ticks |
| 12 | badges, overline (uppercase, `tracking-wide`) |

Weights: 400 body · 500 labels · 600 values and titles. **Never 700+** — it reads
shouty against a low-chroma system. Line height 1.5 for prose, 1.2 for numbers.

## The chart palette

Comes from the `dataviz` skill's validated palette and is mirrored into
`--series-1..8`. Assign slots **in fixed order**, bound to the entity (category id),
so filtering never repaints the survivors. Past 8 categories → fold to "Khác/Other".
