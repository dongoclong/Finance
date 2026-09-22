import type { Account, Budget, Goal, ISODate, Money, MonthKey, Transaction } from '@/types';
import { daysInMonthOf, daysOfMonth, elapsedDaysIn, isInMonth, lastNMonths, shortMonthLabel } from './period';
import { categoryColorVar, categoryLabel, expenseCategories } from './categories';

/**
 * Transfers move money between the user's own accounts. They are NOT income and NOT
 * expense — counting them is the classic double-count bug, so every total below
 * filters on `type` explicitly rather than on the sign of the amount.
 */
const isSpend = (t: Transaction) => t.type === 'expense';
const isEarn = (t: Transaction) => t.type === 'income';

export const sum = (xs: number[]): Money => xs.reduce((a, b) => a + b, 0);

export function inMonth(transactions: Transaction[], month: MonthKey): Transaction[] {
  return transactions.filter((t) => isInMonth(t.date, month));
}

/** Only the first `days` calendar days of the month — for honest MTD comparisons. */
export function inMonthUpToDay(
  transactions: Transaction[],
  month: MonthKey,
  days: number
): Transaction[] {
  return inMonth(transactions, month).filter((t) => Number(t.date.slice(8, 10)) <= days);
}

export interface MonthTotals {
  income: Money;
  expense: Money;
  net: Money;
  savingsRate: number | null;
}

export function monthTotals(transactions: Transaction[], month: MonthKey): MonthTotals {
  const rows = inMonth(transactions, month);
  const income = sum(rows.filter(isEarn).map((t) => t.amount));
  const expense = sum(rows.filter(isSpend).map((t) => t.amount));
  return {
    income,
    expense,
    net: income - expense,
    savingsRate: income > 0 ? (income - expense) / income : null,
  };
}

/** Balance of every account, opening balance plus every movement that touches it. */
export function accountBalances(
  accounts: Account[],
  transactions: Transaction[]
): Map<string, Money> {
  const balances = new Map(accounts.map((a) => [a.id, a.openingBalance]));
  for (const t of transactions) {
    const from = balances.get(t.accountId);
    if (from !== undefined) {
      balances.set(t.accountId, from + (t.type === 'income' ? t.amount : -t.amount));
    }
    if (t.type === 'transfer' && t.toAccountId) {
      const to = balances.get(t.toAccountId);
      if (to !== undefined) balances.set(t.toAccountId, to + t.amount);
    }
  }
  return balances;
}

export function totalBalance(accounts: Account[], transactions: Transaction[]): Money {
  return sum([...accountBalances(accounts, transactions).values()]);
}

export interface CategorySlice {
  id: string;
  label: string;
  color: string;
  value: Money;
  share: number;
  count: number;
}

/** Spend per category, biggest first. Past `limit` entries fold into "Khác". */
export function spendByCategory(
  transactions: Transaction[],
  month: MonthKey,
  limit = 8
): CategorySlice[] {
  const rows = inMonth(transactions, month).filter(isSpend);
  const total = sum(rows.map((t) => t.amount));
  if (total === 0) return [];

  const buckets = new Map<string, { value: Money; count: number }>();
  for (const t of rows) {
    const b = buckets.get(t.categoryId) ?? { value: 0, count: 0 };
    buckets.set(t.categoryId, { value: b.value + t.amount, count: b.count + 1 });
  }

  const all = [...buckets.entries()]
    .map(([id, b]) => ({
      id,
      label: categoryLabel(id),
      color: categoryColorVar(id),
      value: b.value,
      share: b.value / total,
      count: b.count,
    }))
    .sort((a, b) => b.value - a.value);

  if (all.length <= limit) return all;

  const head = all.slice(0, limit - 1);
  const tail = all.slice(limit - 1);
  head.push({
    id: 'other',
    label: 'Khác',
    color: 'var(--series-other)',
    value: sum(tail.map((c) => c.value)),
    share: sum(tail.map((c) => c.share)),
    count: sum(tail.map((c) => c.count)),
  });
  return head;
}

export interface TrendPoint {
  key: MonthKey;
  label: string;
  income: Money;
  expense: Money;
  net: Money;
}

export function monthlyTrend(
  transactions: Transaction[],
  month: MonthKey,
  months = 6
): TrendPoint[] {
  return lastNMonths(month, months).map((key) => {
    const t = monthTotals(transactions, key);
    return { key, label: shortMonthLabel(key), income: t.income, expense: t.expense, net: t.net };
  });
}

export interface DayPoint {
  date: ISODate;
  day: number;
  expense: Money;
  cumulative: Money;
}

/** Daily spend plus its running total — the cumulative line is what shows pace. */
export function dailySpend(transactions: Transaction[], month: MonthKey): DayPoint[] {
  const rows = inMonth(transactions, month).filter(isSpend);
  const perDay = new Map<string, Money>();
  for (const t of rows) perDay.set(t.date, (perDay.get(t.date) ?? 0) + t.amount);

  let running = 0;
  const elapsed = elapsedDaysIn(month);
  return daysOfMonth(month).map((date) => {
    const day = Number(date.slice(8, 10));
    const expense = perDay.get(date) ?? 0;
    running += expense;
    return { date, day, expense, cumulative: day <= elapsed ? running : Number.NaN };
  });
}

export type BudgetState = 'ok' | 'near' | 'over';

export interface BudgetProgress {
  budget: Budget;
  label: string;
  color: string;
  spent: Money;
  limit: Money;
  ratio: number;
  remaining: Money;
  /** spend/day × days in month — what the month ends at if nothing changes */
  projected: Money;
  state: BudgetState;
  /** true when pace says it will blow through even though the bar still looks calm */
  paceWarning: boolean;
}

export function budgetProgress(
  budgets: Budget[],
  transactions: Transaction[],
  month: MonthKey
): BudgetProgress[] {
  const rows = inMonth(transactions, month).filter(isSpend);
  const elapsed = Math.max(1, elapsedDaysIn(month));
  const total = daysInMonthOf(month);

  return budgets
    .filter((b) => b.month === month)
    .map((budget) => {
      const spent = sum(rows.filter((t) => t.categoryId === budget.categoryId).map((t) => t.amount));
      const ratio = budget.limit > 0 ? spent / budget.limit : 0;
      const projected = Math.round((spent / elapsed) * total);
      const state: BudgetState = ratio >= 1 ? 'over' : ratio >= 0.75 ? 'near' : 'ok';
      return {
        budget,
        label: categoryLabel(budget.categoryId),
        color: categoryColorVar(budget.categoryId),
        spent,
        limit: budget.limit,
        ratio,
        remaining: budget.limit - spent,
        projected,
        state,
        paceWarning: state !== 'over' && projected > budget.limit,
      };
    })
    .sort((a, b) => b.ratio - a.ratio);
}

export interface GoalProgress {
  goal: Goal;
  ratio: number;
  remaining: Money;
  monthsLeft: number | null;
  requiredPerMonth: Money | null;
  overdue: boolean;
}

export function goalProgress(goal: Goal): GoalProgress {
  const ratio = goal.target > 0 ? Math.min(goal.saved / goal.target, 1) : 0;
  const remaining = Math.max(goal.target - goal.saved, 0);

  if (!goal.deadline) {
    return { goal, ratio, remaining, monthsLeft: null, requiredPerMonth: null, overdue: false };
  }

  const now = new Date();
  const end = new Date(goal.deadline);
  const monthsLeft =
    (end.getFullYear() - now.getFullYear()) * 12 + (end.getMonth() - now.getMonth());

  return {
    goal,
    ratio,
    remaining,
    monthsLeft,
    requiredPerMonth: monthsLeft > 0 ? Math.ceil(remaining / monthsLeft) : null,
    overdue: monthsLeft < 0 && remaining > 0,
  };
}

/** Which expense categories have no budget set for the month. */
export function unbudgetedCategories(budgets: Budget[], month: MonthKey): string[] {
  const taken = new Set(budgets.filter((b) => b.month === month).map((b) => b.categoryId));
  return expenseCategories.filter((c) => !taken.has(c.id)).map((c) => c.id);
}
