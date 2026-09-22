import {
  addMonths,
  differenceInCalendarDays,
  endOfMonth,
  format,
  getDaysInMonth,
  isSameDay,
  isToday,
  isYesterday,
  parseISO,
  startOfMonth,
  subMonths,
} from 'date-fns';
import type { ISODate, MonthKey } from '@/types';

export const toISODate = (d: Date): ISODate => format(d, 'yyyy-MM-dd');
export const toMonthKey = (d: Date): MonthKey => format(d, 'yyyy-MM');
export const monthStart = (key: MonthKey): Date => parseISO(`${key}-01`);
export const shiftMonth = (key: MonthKey, by: number): MonthKey =>
  toMonthKey(addMonths(monthStart(key), by));

export const currentMonthKey = (): MonthKey => toMonthKey(new Date());

/** `2026-09` → `Tháng 9, 2026`. */
export function monthLabel(key: MonthKey): string {
  const d = monthStart(key);
  return `Tháng ${d.getMonth() + 1}, ${d.getFullYear()}`;
}

export const shortMonthLabel = (key: MonthKey): string => `T${monthStart(key).getMonth() + 1}`;

export function isInMonth(date: ISODate, key: MonthKey): boolean {
  return date.startsWith(key);
}

export function formatDate(date: ISODate): string {
  return format(parseISO(date), 'dd/MM/yyyy');
}

/** Human date for lists: `Hôm nay` · `Hôm qua` · `T4, 17/09`. */
export function formatDateHuman(date: ISODate): string {
  const d = parseISO(date);
  if (isToday(d)) return 'Hôm nay';
  if (isYesterday(d)) return 'Hôm qua';
  const weekday = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][d.getDay()];
  return `${weekday}, ${format(d, 'dd/MM')}`;
}

export function daysInMonthOf(key: MonthKey): number {
  return getDaysInMonth(monthStart(key));
}

/**
 * How many days of `key` have actually elapsed. For a past month that is the whole
 * month; for the current month it is today's date. This is what makes a
 * month-to-date comparison honest — never compare 5 days against 30.
 */
export function elapsedDaysIn(key: MonthKey): number {
  const now = new Date();
  if (toMonthKey(now) === key) return now.getDate();
  return monthStart(key) > now ? 0 : daysInMonthOf(key);
}

export function lastNMonths(key: MonthKey, n: number): MonthKey[] {
  const base = monthStart(key);
  return Array.from({ length: n }, (_, i) => toMonthKey(subMonths(base, n - 1 - i)));
}

/** Every day of the month as `yyyy-MM-dd`. */
export function daysOfMonth(key: MonthKey): ISODate[] {
  const start = startOfMonth(monthStart(key));
  const end = endOfMonth(start);
  const out: ISODate[] = [];
  for (let d = start; d <= end; d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)) {
    out.push(toISODate(d));
  }
  return out;
}

export function daysUntil(date: ISODate): number {
  return differenceInCalendarDays(parseISO(date), new Date());
}

export const sameDay = (a: ISODate, b: ISODate) => isSameDay(parseISO(a), parseISO(b));
