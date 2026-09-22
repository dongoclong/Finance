import type { Account, AppData, Budget, Goal, Transaction } from '@/types';
import { currentMonthKey, daysInMonthOf, elapsedDaysIn, monthStart, shiftMonth, toISODate } from './period';

export const DATA_VERSION = 1;

/** Deterministic PRNG — demo data must look the same every time it is generated. */
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const id = (prefix: string, n: number) => `${prefix}_${n.toString(36)}`;

const ACCOUNTS: Account[] = [
  { id: 'acc_bank', name: 'Techcombank', kind: 'bank', openingBalance: 24_000_000 },
  { id: 'acc_cash', name: 'Tiền mặt', kind: 'cash', openingBalance: 2_500_000 },
  { id: 'acc_momo', name: 'MoMo', kind: 'ewallet', openingBalance: 1_200_000 },
];

interface SpendShape {
  categoryId: string;
  notes: string[];
  min: number;
  max: number;
  perMonth: number;
  account?: string;
}

const SHAPES: SpendShape[] = [
  { categoryId: 'food', notes: ['Cơm trưa', 'Cà phê', 'Đi chợ', 'Ăn tối', 'Trà sữa'], min: 30_000, max: 350_000, perMonth: 26, account: 'acc_momo' },
  { categoryId: 'transport', notes: ['Xăng xe', 'Grab', 'Gửi xe'], min: 20_000, max: 250_000, perMonth: 9 },
  { categoryId: 'shopping', notes: ['Shopee', 'Quần áo', 'Đồ gia dụng'], min: 150_000, max: 1_800_000, perMonth: 4 },
  { categoryId: 'entertainment', notes: ['Xem phim', 'Đi chơi cuối tuần'], min: 100_000, max: 900_000, perMonth: 3 },
  { categoryId: 'health', notes: ['Thuốc', 'Khám sức khoẻ', 'Phòng gym'], min: 150_000, max: 1_200_000, perMonth: 2 },
  { categoryId: 'education', notes: ['Sách', 'Khoá học online'], min: 200_000, max: 1_500_000, perMonth: 1 },
];

/** Fixed monthly charges — these are what the recurring detector should find. */
const SUBSCRIPTIONS = [
  { categoryId: 'housing', note: 'Tiền thuê nhà', amount: 7_000_000, day: 5, account: 'acc_bank' },
  { categoryId: 'utilities', note: 'Điện nước', amount: 850_000, day: 10, account: 'acc_bank' },
  { categoryId: 'utilities', note: 'Internet FPT', amount: 220_000, day: 12, account: 'acc_bank' },
  { categoryId: 'entertainment', note: 'Spotify', amount: 59_000, day: 8, account: 'acc_momo' },
  { categoryId: 'entertainment', note: 'Netflix', amount: 180_000, day: 15, account: 'acc_bank' },
];

/**
 * Six months of plausible history ending today. Used for the "Dùng dữ liệu mẫu"
 * path so a new user sees a working dashboard instead of an empty one.
 */
export function buildSeedData(): AppData {
  const rnd = mulberry32(20260922);
  const transactions: Transaction[] = [];
  const thisMonth = currentMonthKey();
  const months = Array.from({ length: 6 }, (_, i) => shiftMonth(thisMonth, -(5 - i)));
  let n = 0;

  const push = (t: Omit<Transaction, 'id' | 'createdAt'>) => {
    transactions.push({ ...t, id: id('tx', n), createdAt: Date.now() - (5000 - n) * 1000 });
    n += 1;
  };

  for (const month of months) {
    const isCurrent = month === thisMonth;
    const total = daysInMonthOf(month);
    const lastDay = isCurrent ? elapsedDaysIn(month) : total;
    const base = monthStart(month);
    const dateOf = (day: number) => toISODate(new Date(base.getFullYear(), base.getMonth(), day));

    // Payday early in the month, so a month-to-date view always has its income in it.
    if (lastDay >= 5) {
      push({
        date: dateOf(5),
        type: 'income',
        amount: 28_000_000 + Math.round(rnd() * 4) * 500_000,
        categoryId: 'salary',
        accountId: 'acc_bank',
        note: 'Lương tháng',
      });
    }
    if (rnd() > 0.55 && lastDay >= 3) {
      push({
        date: dateOf(Math.min(20, Math.max(1, lastDay - 2))),
        type: 'income',
        amount: 1_500_000 + Math.round(rnd() * 10) * 500_000,
        categoryId: 'freelance',
        accountId: 'acc_bank',
        note: 'Dự án ngoài',
      });
    }

    for (const sub of SUBSCRIPTIONS) {
      if (sub.day > lastDay) continue;
      push({
        date: dateOf(sub.day),
        type: 'expense',
        amount: sub.amount,
        categoryId: sub.categoryId,
        accountId: sub.account,
        note: sub.note,
      });
    }

    for (const shape of SHAPES) {
      // the current month is only partly elapsed, so scale its volume accordingly
      const count = Math.round(shape.perMonth * (lastDay / total) * (0.75 + rnd() * 0.5));
      for (let i = 0; i < count; i++) {
        const day = 1 + Math.floor(rnd() * lastDay);
        const amount = Math.round((shape.min + rnd() * (shape.max - shape.min)) / 1000) * 1000;
        push({
          date: dateOf(day),
          type: 'expense',
          amount,
          categoryId: shape.categoryId,
          accountId: rnd() > 0.88 ? 'acc_cash' : (shape.account ?? 'acc_bank'),
          note: shape.notes[Math.floor(rnd() * shape.notes.length)],
        });
      }
    }

    // Wallets have to be funded, or their balances drift negative over six months.
    if (lastDay >= 6) {
      push({
        date: dateOf(6),
        type: 'transfer',
        amount: 4_500_000,
        categoryId: '',
        accountId: 'acc_bank',
        toAccountId: 'acc_momo',
        note: 'Nạp ví',
      });
    }
    if (lastDay >= 7) {
      push({
        date: dateOf(7),
        type: 'transfer',
        amount: 2_500_000,
        categoryId: '',
        accountId: 'acc_bank',
        toAccountId: 'acc_cash',
        note: 'Rút tiền mặt',
      });
    }
  }

  transactions.sort((a, b) => b.date.localeCompare(a.date));

  const budgets: Budget[] = [
    { categoryId: 'food', limit: 6_000_000 },
    { categoryId: 'transport', limit: 1_500_000 },
    { categoryId: 'shopping', limit: 3_000_000 },
    { categoryId: 'entertainment', limit: 1_500_000 },
    { categoryId: 'housing', limit: 7_000_000 },
    { categoryId: 'utilities', limit: 1_200_000 },
  ].map((b, i) => ({ id: id('bud', i), month: thisMonth, ...b }));

  const goals: Goal[] = [
    {
      id: 'goal_0',
      name: 'Quỹ dự phòng 6 tháng',
      target: 120_000_000,
      saved: 47_500_000,
      note: 'Mục tiêu an toàn tài chính',
    },
    {
      id: 'goal_1',
      name: 'Macbook Pro',
      target: 52_000_000,
      saved: 31_000_000,
      deadline: toISODate(new Date(new Date().getFullYear(), new Date().getMonth() + 5, 1)),
    },
    {
      id: 'goal_2',
      name: 'Du lịch Nhật Bản',
      target: 45_000_000,
      saved: 9_800_000,
      deadline: toISODate(new Date(new Date().getFullYear() + 1, 2, 1)),
    },
  ];

  return { version: DATA_VERSION, accounts: ACCOUNTS, transactions, budgets, goals };
}

export const emptyData = (): AppData => ({
  version: DATA_VERSION,
  accounts: [{ id: 'acc_cash', name: 'Tiền mặt', kind: 'cash', openingBalance: 0 }],
  transactions: [],
  budgets: [],
  goals: [],
});
