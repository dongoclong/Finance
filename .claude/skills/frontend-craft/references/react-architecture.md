# React architecture

## Folder contract

```
src/
  components/ui/     primitives: Button, Card, Badge, Field, Dialog, Tabs…  (no domain imports)
  components/charts/ chart wrappers: pure props in, SVG out               (no store imports)
  features/<name>/   one screen or one domain slice; may read the store
  lib/               pure functions: money, dates, aggregation, csv        (no React imports)
  store/             zustand slices + persistence
  styles/            tokens.css, globals
  types.ts           the domain types every layer agrees on
```

Import direction is one-way: `features → components → lib`. A file in `lib/` that
imports React is in the wrong folder. A file in `components/ui/` that imports the
store is in the wrong folder.

## Where state lives

| Kind | Home |
|---|---|
| Domain data (transactions, budgets, accounts) | zustand store, persisted |
| Cross-screen UI (theme, active month) | zustand store, persisted |
| Screen-local UI (open dialog, form draft, hovered row) | `useState` in the component |
| Anything computable from the above | `useMemo`, **never** state |

If you find yourself writing `useEffect(() => setX(derive(y)), [y])`, delete it and
compute `x` during render. That effect is a bug with a delay built in.

## Selectors

Read the store with a narrow selector so a component re-renders only for its own data:

```ts
const tx = useStore((s) => s.transactions);          // good
const { transactions, budgets, goals } = useStore();  // bad: re-renders on everything
```

Aggregation happens in `lib/` as pure functions, called from a `useMemo` in the
container. Charts receive finished arrays.

## Naming

- Components `PascalCase`, files match. Hooks `useThing`. Pure helpers `verbNoun`.
- Booleans read as assertions: `isOverBudget`, `hasRecurring`, `canDelete`.
- Handlers: `onSave` (prop) ↔ `handleSave` (implementation).
- Domain terms stay in one language across the codebase. UI copy is Vietnamese;
  identifiers, types and comments are English. Never mix inside an identifier.

## Forms

Controlled inputs, a single `draft` object in state, validation as a pure function
returning `Record<field, string>`. Submit is disabled only while *invalid after a
touch*, never on first render — a disabled button with no explanation is hostile.
Errors render beside the field, wired with `aria-describedby`.

## Error & empty states

Every list renders an empty state with (a) what this screen is for, (b) one primary
action. Every async or parse boundary catches and renders a recoverable message —
never a blank screen, never a raw stack trace.
