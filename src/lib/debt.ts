import type { Debt, DebtPayment, Money, MonthKey, PayoffStrategy } from '@/types';
import { currentMonthKey, shiftMonth, shortMonthLabel } from './period';
import { sum } from './aggregate';

/**
 * Balance model, stated plainly because a debt app that is vague about this is
 * useless: `principal` is the amount outstanding on `startDate`, and every payment
 * reduces it directly. Interest is NOT accrued backwards onto the balance — it is
 * projected forward inside the payoff plan. So the number on screen is always
 * "gốc ban đầu − đã trả", which the user can verify by hand, and the cost of
 * interest shows up where it is actionable: in the plan.
 */
export interface DebtState {
  debt: Debt;
  paid: Money;
  outstanding: Money;
  ratio: number;
  monthlyRate: number;
  /** interest this debt adds each month at the current balance */
  monthlyInterest: Money;
  cleared: boolean;
  paymentCount: number;
  lastPaymentDate: string | null;
}

export const monthlyRateOf = (annualRate: number): number => annualRate / 100 / 12;

export function debtStates(debts: Debt[], payments: DebtPayment[]): DebtState[] {
  const byDebt = new Map<string, DebtPayment[]>();
  for (const p of payments) byDebt.set(p.debtId, [...(byDebt.get(p.debtId) ?? []), p]);

  return debts.map((debt) => {
    const rows = byDebt.get(debt.id) ?? [];
    const paid = sum(rows.map((r) => r.amount));
    const outstanding = Math.max(debt.principal - paid, 0);
    const monthlyRate = monthlyRateOf(debt.annualRate);
    const dates = rows.map((r) => r.date).sort();
    return {
      debt,
      paid,
      outstanding,
      ratio: debt.principal > 0 ? Math.min(paid / debt.principal, 1) : 0,
      monthlyRate,
      monthlyInterest: Math.round(outstanding * monthlyRate),
      cleared: outstanding === 0,
      paymentCount: rows.length,
      lastPaymentDate: dates.length ? dates[dates.length - 1] : null,
    };
  });
}

// ---------------------------------------------------------------------------
// Payoff plan
// ---------------------------------------------------------------------------

export interface PlanMonth {
  index: number;
  key: MonthKey;
  label: string;
  remaining: Money;
  interest: Money;
  paid: Money;
}

export interface PayoffMilestone {
  debtId: string;
  name: string;
  monthIndex: number;
  key: MonthKey;
}

export interface PlanResult {
  strategy: PayoffStrategy;
  months: PlanMonth[];
  /** null when the budget never clears the debt (interest outruns payments) */
  monthsToFree: number | null;
  freeByMonth: MonthKey | null;
  totalInterest: Money;
  totalPaid: Money;
  milestones: PayoffMilestone[];
  /** budget is below the sum of required minimum payments */
  belowMinimums: boolean;
  /** budget does not even cover the interest, so the balance grows */
  neverClears: boolean;
  minimumRequired: Money;
  monthlyInterestNow: Money;
}

const MAX_MONTHS = 600; // 50 years — past this the plan is not a plan

/**
 * Month-by-month simulation. Each month: accrue interest, pay every minimum, then
 * throw everything left at ONE target debt chosen by the strategy. The target is
 * re-chosen every month, which is what makes snowball behave like snowball once a
 * debt clears.
 *
 * - `avalanche` targets the highest interest rate  → always the cheapest in total.
 * - `snowball`  targets the smallest balance       → clears individual debts sooner.
 */
export function simulatePayoff(
  states: DebtState[],
  monthlyBudget: Money,
  strategy: PayoffStrategy
): PlanResult {
  const active = states.filter((s) => s.debt.kind === 'borrowed' && s.outstanding > 0);
  const startKey = currentMonthKey();

  const minimumRequired = sum(active.map((s) => Math.min(s.debt.minPayment, s.outstanding)));
  const monthlyInterestNow = sum(active.map((s) => s.monthlyInterest));

  const base: Omit<PlanResult, 'months' | 'monthsToFree' | 'freeByMonth' | 'totalInterest' | 'totalPaid' | 'milestones' | 'neverClears'> = {
    strategy,
    belowMinimums: monthlyBudget < minimumRequired,
    minimumRequired,
    monthlyInterestNow,
  };

  if (active.length === 0) {
    return {
      ...base,
      months: [],
      monthsToFree: 0,
      freeByMonth: startKey,
      totalInterest: 0,
      totalPaid: 0,
      milestones: [],
      neverClears: false,
    };
  }

  const balances = new Map(active.map((s) => [s.debt.id, s.outstanding]));
  const rates = new Map(active.map((s) => [s.debt.id, s.monthlyRate]));
  const mins = new Map(active.map((s) => [s.debt.id, s.debt.minPayment]));
  const names = new Map(active.map((s) => [s.debt.id, s.debt.name]));

  const months: PlanMonth[] = [];
  const milestones: PayoffMilestone[] = [];
  let totalInterest = 0;
  let totalPaid = 0;

  const openIds = () => [...balances.entries()].filter(([, b]) => b > 0).map(([id]) => id);

  const target = (ids: string[]): string =>
    [...ids].sort((a, b) =>
      strategy === 'avalanche'
        ? (rates.get(b) ?? 0) - (rates.get(a) ?? 0) || (balances.get(a) ?? 0) - (balances.get(b) ?? 0)
        : (balances.get(a) ?? 0) - (balances.get(b) ?? 0) || (rates.get(b) ?? 0) - (rates.get(a) ?? 0)
    )[0];

  for (let m = 1; m <= MAX_MONTHS; m++) {
    // Snapshot of what was open at the START of the month. The surplus loop below
    // re-reads the open set as it goes, so the payoff scan must not share that
    // variable — otherwise a debt that cleared this month is already filtered out.
    const openAtStart = openIds();
    if (openAtStart.length === 0) break;
    let open = openAtStart;

    // 1. interest accrues on whatever is still owed
    let interest = 0;
    for (const id of open) {
      const add = Math.round((balances.get(id) ?? 0) * (rates.get(id) ?? 0));
      balances.set(id, (balances.get(id) ?? 0) + add);
      interest += add;
    }

    // 2. every debt takes its minimum first
    let budget = monthlyBudget;
    let paid = 0;
    for (const id of open) {
      const owed = balances.get(id) ?? 0;
      const pay = Math.min(mins.get(id) ?? 0, owed, budget);
      if (pay <= 0) continue;
      balances.set(id, owed - pay);
      budget -= pay;
      paid += pay;
    }

    // 3. everything left goes at one target until the budget runs out
    while (budget > 0) {
      open = openIds();
      if (open.length === 0) break;
      const id = target(open);
      const owed = balances.get(id) ?? 0;
      const pay = Math.min(budget, owed);
      if (pay <= 0) break;
      balances.set(id, owed - pay);
      budget -= pay;
      paid += pay;
    }

    const key = shiftMonth(startKey, m - 1);
    for (const id of openAtStart) {
      if ((balances.get(id) ?? 0) === 0 && !milestones.some((x) => x.debtId === id)) {
        milestones.push({ debtId: id, name: names.get(id) ?? '', monthIndex: m, key });
      }
    }

    totalInterest += interest;
    totalPaid += paid;
    months.push({
      index: m,
      key,
      label: shortMonthLabel(key),
      remaining: sum([...balances.values()]),
      interest,
      paid,
    });

    // The balance is not moving — more months will not help, only a bigger budget.
    if (paid <= interest && m > 1) break;
  }

  const clearedAll = sum([...balances.values()]) === 0;
  const last = months[months.length - 1];

  return {
    ...base,
    months,
    monthsToFree: clearedAll ? months.length : null,
    freeByMonth: clearedAll && last ? last.key : null,
    totalInterest,
    totalPaid,
    milestones,
    neverClears: !clearedAll,
  };
}

export interface StrategyComparison {
  avalanche: PlanResult;
  snowball: PlanResult;
  /** what avalanche saves in interest versus snowball; 0 when they tie */
  interestSaved: Money;
  monthsSaved: number;
}

export function comparePayoff(states: DebtState[], monthlyBudget: Money): StrategyComparison {
  const avalanche = simulatePayoff(states, monthlyBudget, 'avalanche');
  const snowball = simulatePayoff(states, monthlyBudget, 'snowball');
  return {
    avalanche,
    snowball,
    interestSaved: Math.max(snowball.totalInterest - avalanche.totalInterest, 0),
    monthsSaved:
      avalanche.monthsToFree !== null && snowball.monthsToFree !== null
        ? Math.max(snowball.monthsToFree - avalanche.monthsToFree, 0)
        : 0,
  };
}

/** Weighted by balance — a 20% rate on 1tr does not deserve equal billing with 8% on 500tr. */
export function weightedAverageRate(states: DebtState[]): number | null {
  const active = states.filter((s) => s.debt.kind === 'borrowed' && s.outstanding > 0);
  const total = sum(active.map((s) => s.outstanding));
  if (total === 0) return null;
  return active.reduce((acc, s) => acc + s.debt.annualRate * (s.outstanding / total), 0);
}

/**
 * A starting budget that is deliberately ABOVE the minimums. Paying exactly the
 * minimum on every debt is the trap the whole screen exists to expose: there is no
 * surplus to direct, so the strategy choice becomes meaningless and the payoff date
 * stretches for years. Suggesting minimums + 20% gives the plan something to work
 * with, and the user can always type the real number over it.
 */
export function suggestedBudget(states: DebtState[]): Money {
  const active = states.filter((s) => s.debt.kind === 'borrowed' && s.outstanding > 0);
  if (active.length === 0) return 0;
  const minimums = sum(active.map((s) => Math.min(s.debt.minPayment, s.outstanding)));
  const interest = sum(active.map((s) => s.monthlyInterest));
  const withSurplus = Math.ceil((minimums * 1.2) / 500_000) * 500_000;
  const aboveInterest = Math.ceil((interest * 1.5) / 500_000) * 500_000;
  return Math.max(withSurplus, aboveInterest, 1_000_000);
}

export const monthsToWords = (months: number): string => {
  if (months <= 0) return 'ngay bây giờ';
  const y = Math.floor(months / 12);
  const m = months % 12;
  if (y === 0) return `${m} tháng`;
  if (m === 0) return `${y} năm`;
  return `${y} năm ${m} tháng`;
};
