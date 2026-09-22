import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Money,
  Account,
  AppData,
  Budget,
  Debt,
  DebtPayment,
  Goal,
  MonthKey,
  PayoffStrategy,
  Theme,
  Transaction,
} from '@/types';
import { currentMonthKey } from '@/lib/period';
import { DATA_VERSION, buildSeedData, emptyData } from '@/lib/seed';

const uid = (prefix: string) =>
  `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

interface State extends AppData {
  /** cross-screen UI state — deliberately persisted */
  theme: Theme;
  month: MonthKey;
  onboarded: boolean;
  /** how much the user can put toward debt each month — drives the payoff plan */
  debtBudget: Money | null;
  debtStrategy: PayoffStrategy;
}

interface Actions {
  addTransaction: (t: Omit<Transaction, 'id' | 'createdAt'>) => void;
  updateTransaction: (id: string, patch: Partial<Transaction>) => void;
  removeTransaction: (id: string) => void;

  setBudget: (categoryId: string, month: MonthKey, limit: number) => void;
  removeBudget: (id: string) => void;
  copyBudgetsFromPreviousMonth: (month: MonthKey) => number;

  addGoal: (g: Omit<Goal, 'id'>) => void;
  updateGoal: (id: string, patch: Partial<Goal>) => void;
  contributeToGoal: (id: string, amount: number) => void;
  removeGoal: (id: string) => void;

  addAccount: (a: Omit<Account, 'id'>) => void;
  updateAccount: (id: string, patch: Partial<Account>) => void;
  removeAccount: (id: string) => void;

  addDebt: (d: Omit<Debt, 'id'>) => void;
  updateDebt: (id: string, patch: Partial<Debt>) => void;
  removeDebt: (id: string) => void;
  recordDebtPayment: (input: {
    debtId: string;
    date: string;
    amount: number;
    note: string;
    /** when set, the payment is also written into the transaction ledger */
    accountId?: string;
  }) => void;
  removeDebtPayment: (id: string) => void;
  setDebtBudget: (amount: Money | null) => void;
  setDebtStrategy: (s: PayoffStrategy) => void;

  setTheme: (t: Theme) => void;
  setOnboarded: (value: boolean) => void;
  setMonth: (m: MonthKey) => void;
  loadSeed: () => void;
  replaceAll: (data: AppData) => void;
  resetAll: () => void;
  snapshot: () => AppData;
}

const initial: State = {
  ...emptyData(),
  theme: 'system',
  month: currentMonthKey(),
  onboarded: false,
  debtBudget: null,
  debtStrategy: 'avalanche',
};

export const useStore = create<State & Actions>()(
  persist(
    (set, get) => ({
      ...initial,

      addTransaction: (t) =>
        set((s) => ({
          transactions: [{ ...t, id: uid('tx'), createdAt: Date.now() }, ...s.transactions],
          onboarded: true,
        })),

      updateTransaction: (id, patch) =>
        set((s) => ({
          transactions: s.transactions.map((t) => (t.id === id ? { ...t, ...patch } : t)),
        })),

      removeTransaction: (id) =>
        set((s) => ({ transactions: s.transactions.filter((t) => t.id !== id) })),

      setBudget: (categoryId, month, limit) =>
        set((s) => {
          const existing = s.budgets.find((b) => b.categoryId === categoryId && b.month === month);
          if (existing) {
            return { budgets: s.budgets.map((b) => (b.id === existing.id ? { ...b, limit } : b)) };
          }
          const next: Budget = { id: uid('bud'), categoryId, month, limit };
          return { budgets: [...s.budgets, next] };
        }),

      removeBudget: (id) => set((s) => ({ budgets: s.budgets.filter((b) => b.id !== id) })),

      copyBudgetsFromPreviousMonth: (month) => {
        const [y, m] = month.split('-').map(Number);
        const prevDate = new Date(y, m - 2, 1);
        const prev = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
        const s = get();
        const taken = new Set(s.budgets.filter((b) => b.month === month).map((b) => b.categoryId));
        const copies = s.budgets
          .filter((b) => b.month === prev && !taken.has(b.categoryId))
          .map((b) => ({ ...b, id: uid('bud'), month }));
        if (copies.length) set({ budgets: [...s.budgets, ...copies] });
        return copies.length;
      },

      addGoal: (g) => set((s) => ({ goals: [...s.goals, { ...g, id: uid('goal') }] })),
      updateGoal: (id, patch) =>
        set((s) => ({ goals: s.goals.map((g) => (g.id === id ? { ...g, ...patch } : g)) })),
      contributeToGoal: (id, amount) =>
        set((s) => ({
          goals: s.goals.map((g) => (g.id === id ? { ...g, saved: Math.max(0, g.saved + amount) } : g)),
        })),
      removeGoal: (id) => set((s) => ({ goals: s.goals.filter((g) => g.id !== id) })),

      addAccount: (a) => set((s) => ({ accounts: [...s.accounts, { ...a, id: uid('acc') }] })),
      updateAccount: (id, patch) =>
        set((s) => ({ accounts: s.accounts.map((a) => (a.id === id ? { ...a, ...patch } : a)) })),
      removeAccount: (id) =>
        set((s) => ({
          accounts: s.accounts.filter((a) => a.id !== id),
          // a transaction without its account is orphaned data, not history worth keeping
          transactions: s.transactions.filter((t) => t.accountId !== id && t.toAccountId !== id),
          }),
        ),

      addDebt: (d) => set((s) => ({ debts: [...s.debts, { ...d, id: uid('debt') }] })),

      updateDebt: (id, patch) =>
        set((s) => ({ debts: s.debts.map((d) => (d.id === id ? { ...d, ...patch } : d)) })),

      removeDebt: (id) =>
        set((s) => {
          // Payment history without its debt is orphaned data; the ledger entries it
          // created are real spending though, so those are deliberately left alone.
          const dropped = s.debtPayments.filter((p) => p.debtId === id);
          return {
            debts: s.debts.filter((d) => d.id !== id),
            debtPayments: s.debtPayments.filter((p) => p.debtId !== id),
            transactions: s.transactions.map((t) =>
              dropped.some((p) => p.txId === t.id) ? { ...t, note: t.note || 'Trả nợ' } : t
            ),
          };
        }),

      recordDebtPayment: ({ debtId, date, amount, note, accountId }) =>
        set((s) => {
          const debt = s.debts.find((d) => d.id === debtId);
          if (!debt) return {};

          const paymentId = uid('dp');
          let transactions = s.transactions;
          let txId: string | undefined;

          // Paying a debt moves real money, so unless the user opts out it is written
          // into the ledger too — otherwise cash flow silently disagrees with reality.
          if (accountId) {
            txId = uid('tx');
            transactions = [
              {
                id: txId,
                date,
                type: debt.kind === 'borrowed' ? 'expense' : 'income',
                amount,
                categoryId: debt.kind === 'borrowed' ? 'debt' : 'debt_collect',
                accountId,
                note: note.trim() || debt.name,
                createdAt: Date.now(),
              },
              ...s.transactions,
            ];
          }

          const payment: DebtPayment = {
            id: paymentId,
            debtId,
            date,
            amount,
            note: note.trim(),
            txId,
            createdAt: Date.now(),
          };
          return { debtPayments: [payment, ...s.debtPayments], transactions };
        }),

      removeDebtPayment: (id) =>
        set((s) => {
          const payment = s.debtPayments.find((p) => p.id === id);
          return {
            debtPayments: s.debtPayments.filter((p) => p.id !== id),
            transactions: payment?.txId
              ? s.transactions.filter((t) => t.id !== payment.txId)
              : s.transactions,
          };
        }),

      setDebtBudget: (debtBudget) => set({ debtBudget }),
      setDebtStrategy: (debtStrategy) => set({ debtStrategy }),

      setTheme: (theme) => set({ theme }),
      setOnboarded: (onboarded) => set({ onboarded }),
      setMonth: (month) => set({ month }),

      loadSeed: () => set({ ...buildSeedData(), onboarded: true, month: currentMonthKey() }),
      replaceAll: (data) => set({ ...data, onboarded: true }),
      resetAll: () => set({ ...emptyData(), onboarded: false, month: currentMonthKey() }),

      snapshot: () => {
        const { accounts, transactions, budgets, goals, debts, debtPayments } = get();
        return { version: DATA_VERSION, accounts, transactions, budgets, goals, debts, debtPayments };
      },
    }),
    {
      // Storage key is intentionally NOT renamed with the app: changing it would
      // orphan every transaction already saved in a browser.
      name: 'fina-store',
      version: DATA_VERSION,
      partialize: (s) => ({
        accounts: s.accounts,
        transactions: s.transactions,
        budgets: s.budgets,
        goals: s.goals,
        debts: s.debts,
        debtPayments: s.debtPayments,
        theme: s.theme,
        month: s.month,
        onboarded: s.onboarded,
        debtBudget: s.debtBudget,
        debtStrategy: s.debtStrategy,
        version: s.version,
      }),
    }
  )
);
