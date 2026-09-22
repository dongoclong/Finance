import type { Money, MonthKey, Transaction } from '@/types';
import { categoryLabel } from './categories';
import {
  daysInMonthOf,
  elapsedDaysIn,
  lastNMonths,
  monthLabel,
  shiftMonth,
} from './period';
import { inMonth, inMonthUpToDay, monthTotals, spendByCategory, sum } from './aggregate';
import { formatCompact, formatMoney, formatPercent } from './money';

export type InsightTone = 'good' | 'warn' | 'bad' | 'info';

export interface Insight {
  id: string;
  tone: InsightTone;
  icon: string;
  title: string;
  detail: string;
}

/** Below this, a month has too little data for any comparison to mean anything. */
const MIN_ROWS = 3;
/** A category spike must clear this in absolute đồng, not just in ratio. */
const SPIKE_FLOOR: Money = 300_000;

/**
 * Rule-based, fully explainable. Every insight names a number and what it is compared
 * against, so the user can verify it by hand. Nothing here is a black box.
 */
export function buildInsights(transactions: Transaction[], month: MonthKey): Insight[] {
  const out: Insight[] = [];
  const rows = inMonth(transactions, month);
  if (rows.length < MIN_ROWS) {
    return [
      {
        id: 'empty',
        tone: 'info',
        icon: 'sparkles',
        title: 'Chưa đủ dữ liệu để phân tích',
        detail: `Thêm ít nhất ${MIN_ROWS} giao dịch trong ${monthLabel(month).toLowerCase()} để bắt đầu có nhận định.`,
      },
    ];
  }

  const elapsed = Math.max(1, elapsedDaysIn(month));
  const totalDays = daysInMonthOf(month);
  const totals = monthTotals(transactions, month);
  const prevKey = shiftMonth(month, -1);

  // 1 — spend vs last month over the SAME number of elapsed days
  const thisSoFar = sum(
    inMonthUpToDay(transactions, month, elapsed)
      .filter((t) => t.type === 'expense')
      .map((t) => t.amount)
  );
  const prevSoFar = sum(
    inMonthUpToDay(transactions, prevKey, elapsed)
      .filter((t) => t.type === 'expense')
      .map((t) => t.amount)
  );

  if (prevSoFar > 0) {
    const delta = (thisSoFar - prevSoFar) / prevSoFar;
    const pct = Math.abs(delta * 100).toFixed(0);
    if (Math.abs(delta) <= 0.05) {
      out.push({
        id: 'vs-prev',
        tone: 'info',
        icon: 'equal',
        title: 'Chi tiêu ổn định',
        detail: `${elapsed} ngày đầu tháng bạn chi ${formatCompact(thisSoFar)} — gần như bằng cùng kỳ tháng trước (${formatCompact(prevSoFar)}).`,
      });
    } else {
      out.push({
        id: 'vs-prev',
        tone: delta > 0 ? 'warn' : 'good',
        icon: delta > 0 ? 'trending-up' : 'trending-down',
        title: delta > 0 ? `Chi nhiều hơn ${pct}% so với tháng trước` : `Chi ít hơn ${pct}% so với tháng trước`,
        detail: `${elapsed} ngày đầu tháng: ${formatMoney(thisSoFar)} so với ${formatMoney(prevSoFar)} cùng kỳ.`,
      });
    }
  }

  // 2 — the category carrying the month
  const slices = spendByCategory(transactions, month);
  const top = slices[0];
  if (top && top.share >= 0.2) {
    out.push({
      id: 'top-category',
      tone: top.share >= 0.5 ? 'warn' : 'info',
      icon: 'pie-chart',
      title: `${top.label} chiếm ${formatPercent(top.share, 1)} chi tiêu`,
      detail: `${formatMoney(top.value)} qua ${top.count} giao dịch. ${
        top.share >= 0.5 ? 'Một danh mục chiếm quá nửa — đây là chỗ cắt giảm hiệu quả nhất.' : 'Đây là danh mục lớn nhất tháng này.'
      }`,
    });
  }

  // 3 — where the month lands if nothing changes
  const projected = Math.round((totals.expense / elapsed) * totalDays);
  if (elapsed >= 5 && elapsed < totalDays && totals.income > 0) {
    const gap = totals.income - projected;
    out.push({
      id: 'projection',
      tone: gap < 0 ? 'bad' : gap < totals.income * 0.1 ? 'warn' : 'good',
      icon: gap < 0 ? 'alert-triangle' : 'target',
      title:
        gap < 0
          ? `Dự kiến thâm hụt ${formatCompact(Math.abs(gap))} cuối tháng`
          : `Dự kiến dư ${formatCompact(gap)} cuối tháng`,
      detail: `Theo tốc độ hiện tại (${formatCompact(Math.round(totals.expense / elapsed))}/ngày), cả tháng sẽ chi khoảng ${formatMoney(projected)} trên thu nhập ${formatMoney(totals.income)}.`,
    });
  }

  // 4 — a category spiking against its own 3-month average
  const history = lastNMonths(prevKey, 3);
  for (const slice of slices.slice(0, 6)) {
    if (slice.id === 'other') continue;
    const past = history.map((k) =>
      sum(
        inMonth(transactions, k)
          .filter((t) => t.type === 'expense' && t.categoryId === slice.id)
          .map((t) => t.amount)
      )
    );
    const months = past.filter((v) => v > 0);
    if (months.length < 2) continue;
    const avg = sum(months) / months.length;
    const diff = slice.value - avg;
    if (slice.value >= avg * 1.5 && diff >= SPIKE_FLOOR) {
      out.push({
        id: `spike-${slice.id}`,
        tone: 'warn',
        icon: 'flame',
        title: `${slice.label} tăng vọt`,
        detail: `${formatMoney(slice.value)} tháng này, gấp ${(slice.value / avg).toFixed(1).replace('.', ',')} lần mức trung bình ${formatMoney(Math.round(avg))} của 3 tháng trước.`,
      });
      break; // one spike is a finding; five is noise
    }
  }

  // 5 — savings rate
  if (totals.income > 0 && elapsed >= 10) {
    const rate = totals.savingsRate ?? 0;
    out.push({
      id: 'savings-rate',
      tone: rate < 0 ? 'bad' : rate < 0.1 ? 'warn' : rate >= 0.2 ? 'good' : 'info',
      icon: 'piggy-bank',
      title: `Tỷ lệ tiết kiệm ${formatPercent(rate, 1)}`,
      detail:
        rate < 0
          ? `Bạn đang chi vượt thu ${formatMoney(Math.abs(totals.net))} trong tháng này.`
          : rate < 0.1
            ? `Dưới ngưỡng 10% — giữ lại được ${formatMoney(totals.net)} trên ${formatMoney(totals.income)} thu nhập.`
            : `Giữ lại ${formatMoney(totals.net)} trên ${formatMoney(totals.income)} thu nhập.`,
    });
  }

  // 6 — subscriptions found by shape, not by a keyword list
  const recurring = detectRecurring(transactions);
  if (recurring.length > 0) {
    const yearly = sum(recurring.map((r) => r.amount * 12));
    out.push({
      id: 'recurring',
      tone: 'info',
      icon: 'repeat',
      title: `${recurring.length} khoản lặp lại hằng tháng`,
      detail: `${recurring.map((r) => r.label).join(', ')} — tổng khoảng ${formatMoney(sum(recurring.map((r) => r.amount)))}/tháng, tức ${formatMoney(yearly)} mỗi năm.`,
    });
  }

  return out;
}

export interface RecurringItem {
  key: string;
  label: string;
  categoryId: string;
  amount: Money;
  occurrences: number;
  lastDate: string;
}

/**
 * A subscription has a shape: same note + category, near-identical amount, and a
 * near-constant gap between charges. Three occurrences is the minimum that can
 * distinguish a rhythm from a coincidence.
 */
export function detectRecurring(transactions: Transaction[]): RecurringItem[] {
  const groups = new Map<string, Transaction[]>();
  for (const t of transactions) {
    if (t.type !== 'expense') continue;
    const key = `${t.categoryId}|${t.note.trim().toLowerCase()}`;
    if (!t.note.trim()) continue;
    groups.set(key, [...(groups.get(key) ?? []), t]);
  }

  const found: RecurringItem[] = [];
  for (const [key, items] of groups) {
    if (items.length < 3) continue;
    const sorted = [...items].sort((a, b) => a.date.localeCompare(b.date));

    const amounts = sorted.map((t) => t.amount);
    const avgAmount = sum(amounts) / amounts.length;
    const amountStable = amounts.every((a) => Math.abs(a - avgAmount) <= avgAmount * 0.05);
    if (!amountStable) continue;

    const gaps: number[] = [];
    for (let i = 1; i < sorted.length; i++) {
      const prev = new Date(sorted[i - 1].date).getTime();
      const curr = new Date(sorted[i].date).getTime();
      gaps.push(Math.round((curr - prev) / 86_400_000));
    }
    const avgGap = sum(gaps) / gaps.length;
    const rhythmStable = avgGap >= 25 && avgGap <= 35 && gaps.every((g) => Math.abs(g - avgGap) <= 4);
    if (!rhythmStable) continue;

    const last = sorted[sorted.length - 1];
    found.push({
      key,
      label: last.note.trim(),
      categoryId: last.categoryId,
      amount: Math.round(avgAmount),
      occurrences: sorted.length,
      lastDate: last.date,
    });
  }

  return found.sort((a, b) => b.amount - a.amount);
}

export const recurringCategoryLabel = (id: string) => categoryLabel(id);
