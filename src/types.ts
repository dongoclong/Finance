/** Integer count of đồng. Never a float — see .claude/skills/finance-domain. */
export type Money = number;

/** `yyyy-MM-dd`, local calendar date. */
export type ISODate = string;

/** `yyyy-MM`. */
export type MonthKey = string;

export type TxType = 'income' | 'expense' | 'transfer';

export type CategoryKind = 'expense' | 'income';

export interface Category {
  id: string;
  label: string;
  kind: CategoryKind;
  /** lucide icon name, resolved at the component boundary */
  icon: string;
  /** fixed chart series slot 1–8, or null to render in the neutral "other" color */
  slot: number | null;
}

export type AccountKind = 'cash' | 'bank' | 'ewallet' | 'credit';

export interface Account {
  id: string;
  name: string;
  kind: AccountKind;
  openingBalance: Money;
}

export interface Transaction {
  id: string;
  date: ISODate;
  type: TxType;
  /** positive magnitude; direction lives in `type` */
  amount: Money;
  /** required for income/expense; empty string for transfers */
  categoryId: string;
  accountId: string;
  /** destination account, transfers only */
  toAccountId?: string;
  note: string;
  createdAt: number;
}

export interface Budget {
  id: string;
  categoryId: string;
  month: MonthKey;
  limit: Money;
}

export interface Goal {
  id: string;
  name: string;
  target: Money;
  saved: Money;
  deadline?: ISODate;
  note?: string;
}

export type Theme = 'light' | 'dark' | 'system';

export interface AppData {
  version: number;
  accounts: Account[];
  transactions: Transaction[];
  budgets: Budget[];
  goals: Goal[];
}
