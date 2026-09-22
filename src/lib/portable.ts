import type { AppData, Transaction } from '@/types';
import { DATA_VERSION } from './seed';

export interface ImportReport {
  data: AppData | null;
  accepted: number;
  rejected: string[];
}

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const str = (v: unknown, fallback = ''): string => (typeof v === 'string' ? v : fallback);
const int = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? Math.round(v) : 0);

/**
 * Validates every row and REPORTS what it rejected. Import must never silently drop
 * a user's data — a quiet partial import is worse than a loud failure.
 */
export function parseImport(text: string): ImportReport {
  const rejected: string[] = [];
  let raw: unknown;

  try {
    raw = JSON.parse(text);
  } catch {
    return { data: null, accepted: 0, rejected: ['Tệp không phải JSON hợp lệ.'] };
  }
  if (!isObj(raw)) return { data: null, accepted: 0, rejected: ['Nội dung tệp không đúng định dạng.'] };

  const accounts = Array.isArray(raw.accounts)
    ? raw.accounts.filter(isObj).map((a, i) => ({
        id: str(a.id, `acc_import_${i}`),
        name: str(a.name, 'Tài khoản'),
        kind: (['cash', 'bank', 'ewallet', 'credit'] as const).includes(a.kind as never)
          ? (a.kind as AppData['accounts'][number]['kind'])
          : ('cash' as const),
        openingBalance: int(a.openingBalance),
      }))
    : [];

  if (accounts.length === 0) {
    return { data: null, accepted: 0, rejected: ['Tệp không có tài khoản nào.'] };
  }
  const accountIds = new Set(accounts.map((a) => a.id));

  const transactions: Transaction[] = [];
  const rawTx = Array.isArray(raw.transactions) ? raw.transactions : [];
  rawTx.forEach((t, i) => {
    if (!isObj(t)) return void rejected.push(`Dòng ${i + 1}: không phải một giao dịch.`);
    const type = t.type;
    if (type !== 'income' && type !== 'expense' && type !== 'transfer') {
      return void rejected.push(`Dòng ${i + 1}: loại giao dịch không hợp lệ.`);
    }
    const date = str(t.date);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return void rejected.push(`Dòng ${i + 1}: ngày "${date}" sai định dạng yyyy-MM-dd.`);
    }
    const amount = int(t.amount);
    if (amount <= 0) return void rejected.push(`Dòng ${i + 1}: số tiền phải là số dương.`);
    const accountId = str(t.accountId);
    if (!accountIds.has(accountId)) {
      return void rejected.push(`Dòng ${i + 1}: tài khoản "${accountId}" không tồn tại.`);
    }
    transactions.push({
      id: str(t.id, `tx_import_${i}`),
      date,
      type,
      amount,
      categoryId: str(t.categoryId),
      accountId,
      toAccountId: typeof t.toAccountId === 'string' ? t.toAccountId : undefined,
      note: str(t.note),
      createdAt: typeof t.createdAt === 'number' ? t.createdAt : Date.now(),
    });
  });

  const budgets = Array.isArray(raw.budgets)
    ? raw.budgets.filter(isObj).flatMap((b, i) => {
        const month = str(b.month);
        if (!/^\d{4}-\d{2}$/.test(month)) {
          rejected.push(`Ngân sách ${i + 1}: tháng sai định dạng yyyy-MM.`);
          return [];
        }
        return [{ id: str(b.id, `bud_import_${i}`), categoryId: str(b.categoryId), month, limit: int(b.limit) }];
      })
    : [];

  const goals = Array.isArray(raw.goals)
    ? raw.goals.filter(isObj).map((g, i) => ({
        id: str(g.id, `goal_import_${i}`),
        name: str(g.name, 'Mục tiêu'),
        target: int(g.target),
        saved: int(g.saved),
        deadline: typeof g.deadline === 'string' ? g.deadline : undefined,
        note: typeof g.note === 'string' ? g.note : undefined,
      }))
    : [];

  return {
    data: { version: DATA_VERSION, accounts, transactions, budgets, goals },
    accepted: transactions.length,
    rejected,
  };
}

/** The user's escape hatch. It must always produce a file `parseImport` accepts. */
export function downloadBackup(data: AppData): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `cuoc-song-cua-long-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function toCSV(data: AppData): string {
  const head = ['date', 'type', 'amount', 'category', 'account', 'note'].join(',');
  const esc = (s: string) => `"${s.replace(/"/g, '""')}"`;
  const accountName = new Map(data.accounts.map((a) => [a.id, a.name]));
  const rows = data.transactions.map((t) =>
    [t.date, t.type, t.amount, esc(t.categoryId), esc(accountName.get(t.accountId) ?? ''), esc(t.note)].join(',')
  );
  return [head, ...rows].join('\n');
}
