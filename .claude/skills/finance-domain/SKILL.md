---
name: finance-domain
description: Domain rules for the Fina personal-finance app — money representation, VND formatting, the category taxonomy, budget/goal math, recurring detection and the insight engine. Load BEFORE touching anything that stores, sums, formats or displays an amount, a budget, a goal, a period or a category.
---

# Finance domain

## Money

**Money is an integer count of the minor unit (đồng). Never a float.**
`0.1 + 0.2 !== 0.3`, and a 1-đồng drift across a year of rows is a support ticket.

```ts
type Money = number; // integer, in đồng (VND has no decimal subunit in practice)
```

- Parse user input with `parseMoney()`; it strips `.`, `,`, spaces and `đ`.
- Sum with plain `+` over integers. Divide only at the *display* boundary, and round
  with `Math.round`, never `toFixed` on an accumulator.
- Percentages are computed from integers and rounded once, at the end.
- A ratio with a zero denominator renders `—`, never `NaN`, never `Infinity`, never `0%`.

## Sign convention

One rule, everywhere: **amounts are stored as positive magnitudes; `type` carries the
direction.**

```ts
type TxType = 'income' | 'expense' | 'transfer';
```

Never store a negative expense. Never infer direction from the sign. A transfer moves
between two accounts and **must not** count toward income or expense totals — the single
most common bug in finance apps is double-counting transfers in the "spent this month"
figure. Every aggregation over expense/income filters `type !== 'transfer'` explicitly.

## Periods

A "month" is the user's selected month in **local time**, `[startOfMonth, endOfMonth]`
inclusive. Never `Date.now() - 30*86400000` — that silently shifts across DST and
month lengths. All period math goes through `lib/period.ts`.

Comparisons are always **same-length periods**: this month-to-date vs last month over
the *same number of days*, otherwise the 3rd of the month always looks like a triumph.

## Categories

A fixed taxonomy with stable ids — ids are persisted, labels are display-only and may
be re-worded freely. Each category owns a **chart series slot assigned by id**, so
filtering a category out never repaints the others. Past 8 on a chart, the tail folds
into `other`.

Expense: `food · transport · housing · utilities · shopping · health · education ·
entertainment · other`
Income: `salary · bonus · investment · freelance · gift · other_income`

## Budgets

A budget is `{ categoryId, month, limit }`. Derived state:

| Condition | State | Color role |
|---|---|---|
| `spent / limit < 0.75` | on track | `--good` |
| `0.75 ≤ ratio < 1` |近 limit | `--warn` |
| `ratio ≥ 1` | over | `--bad` |

Also surface **pace**: `projected = spent / dayOfMonth * daysInMonth`. A user at 60%
on day 5 is in trouble even though the bar looks calm. Pace is the insight; the bar
alone is not.

## Goals

`{ name, target, saved, deadline? }`. Show `remaining`, `% complete`, and — when a
deadline exists — `requiredPerMonth`. A goal past its deadline is not an error state;
it is shown as overdue with the amount still needed.

## Insights (rule-based, no ML, must be explainable)

Every insight states a **number and its comparison**, and must be derivable by the user
by hand. Never show an insight that cannot be justified. Minimum data guards:
skip any insight whose window has fewer than 3 transactions.

1. **Spend vs last month, same days elapsed.** ±5% is "ổn định", not a finding.
2. **Top category this month** + its share of total spend.
3. **Projected month-end spend** vs income → surplus or deficit.
4. **Category spike**: a category ≥ 1.5× its own 3-month average and ≥ 300k đ absolute.
   The absolute floor is required — a 200k→400k coffee month is noise.
5. **Savings rate** `(income − expense) / income`. Below 10% is flagged.
6. **Recurring/subscription detection**: ≥ 3 transactions, same category, amounts within
   5%, intervals within ±4 days of each other → likely a subscription; total the annual cost.

## Formatting

- Money in Vietnamese locale, grouped by `.`: `1.250.000 đ`.
- Compact for tiles and axes: `1,2 tr` · `250 ng` · `1,4 tỷ`. Full precision in tables
  and tooltips — a compact number in a table makes reconciliation impossible.
- Deltas are signed and always name the comparison period: `+12% so với tháng trước`.
- Dates: `dd/MM/yyyy`; weekday and relative wording ("Hôm nay", "Hôm qua") in lists.

## Persistence & trust

Data is the user's own and lives locally. Therefore:
- Every write is atomic through the store; no partial rows.
- Import validates every row and reports what it rejected — never silently drops.
- Export produces a complete, re-importable JSON. This is the user's escape hatch and
  it must always work; treat a broken export as a P0.
