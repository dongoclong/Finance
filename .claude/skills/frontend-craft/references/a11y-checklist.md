# Accessibility checklist — run before calling a screen done

Ten checks. Each is pass/fail, not a judgement call.

1. **Tab through the whole screen.** Every control reachable, focus always visible,
   order matches the visual order, no trap outside of dialogs.
2. **Every control has an accessible name.** Icon-only buttons carry `aria-label`.
   Inputs have a real `<label htmlFor>` — a placeholder is not a label.
3. **Semantic elements.** `<button>` for actions, `<a href>` for navigation,
   `<table>` for tabular data, one `<h1>`, headings never skip a level.
4. **Contrast.** Body text ≥ 4.5:1, large text and UI borders ≥ 3:1, in **both** themes.
5. **Color is never the only channel.** Status carries an icon + label; chart series
   carry a legend and/or direct labels. Red/green alone fails ~8% of male readers.
6. **Charts have a text path.** A table view, or `aria-label` summarizing the takeaway.
7. **Live regions.** Toasts and async results announce via `role="status"`.
   Errors use `role="alert"`.
8. **Dialogs.** `role="dialog" aria-modal="true"`, labelled by its title, Escape
   closes, focus returns to the trigger.
9. **Reduced motion honoured** (see interaction-and-motion.md).
10. **Zoom to 200% and shrink to 375px.** No horizontal scroll, no clipped text,
    no overlapping elements.
