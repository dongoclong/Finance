import { useEffect, useMemo, useState } from 'react';
import type { Transaction } from '@/types';
import { useStore } from '@/store/useStore';
import { CATEGORIES, categoryLabel } from '@/lib/categories';
import { inMonth, sum } from '@/lib/aggregate';
import { formatDateHuman } from '@/lib/period';
import { formatMoney } from '@/lib/money';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select, TextInput } from '@/components/ui/Field';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { EmptyState } from '@/components/ui/EmptyState';
import { Dialog } from '@/components/ui/Dialog';
import { Icon } from '@/components/ui/Icon';
import { useToast } from '@/components/ui/Toast';
import { TransactionRow } from './TransactionRow';
import { TransactionDialog } from './TransactionDialog';

type TypeFilter = 'all' | 'expense' | 'income' | 'transfer';

interface TransactionsPageProps {
  initialCategory: string | null;
  onConsumeInitialCategory: () => void;
}

export function TransactionsPage({
  initialCategory,
  onConsumeInitialCategory,
}: TransactionsPageProps) {
  const transactions = useStore((s) => s.transactions);
  const accounts = useStore((s) => s.accounts);
  const month = useStore((s) => s.month);
  const removeTransaction = useStore((s) => s.removeTransaction);
  const toast = useToast();

  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [adding, setAdding] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Transaction | null>(null);

  // A category clicked on the dashboard pre-filters this screen exactly once.
  useEffect(() => {
    if (!initialCategory) return;
    setCategoryFilter(initialCategory);
    setTypeFilter('expense');
    onConsumeInitialCategory();
  }, [initialCategory, onConsumeInitialCategory]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return inMonth(transactions, month)
      .filter((t) => (typeFilter === 'all' ? true : t.type === typeFilter))
      .filter((t) => (categoryFilter === 'all' ? true : t.categoryId === categoryFilter))
      .filter((t) =>
        q ? t.note.toLowerCase().includes(q) || categoryLabel(t.categoryId).toLowerCase().includes(q) : true
      )
      .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
  }, [transactions, month, typeFilter, categoryFilter, query]);

  const grouped = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    for (const t of filtered) map.set(t.date, [...(map.get(t.date) ?? []), t]);
    return [...map.entries()];
  }, [filtered]);

  const totals = useMemo(
    () => ({
      expense: sum(filtered.filter((t) => t.type === 'expense').map((t) => t.amount)),
      income: sum(filtered.filter((t) => t.type === 'income').map((t) => t.amount)),
    }),
    [filtered]
  );

  const hasFilters = query !== '' || typeFilter !== 'all' || categoryFilter !== 'all';
  const clearFilters = () => {
    setQuery('');
    setTypeFilter('all');
    setCategoryFilter('all');
  };

  const confirmDelete = () => {
    if (!pendingDelete) return;
    removeTransaction(pendingDelete.id);
    setPendingDelete(null);
    toast('Đã xoá giao dịch', 'good');
  };

  return (
    <div className="flex flex-col gap-4">
      {/* filters live in one row above the content */}
      <Card className="p-4">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-muted)]">
                <Icon name="search" size={16} />
              </span>
              <TextInput
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm theo ghi chú hoặc danh mục…"
                aria-label="Tìm giao dịch"
                className="pl-9"
              />
            </div>
            <Select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              aria-label="Lọc theo danh mục"
              className="sm:w-[180px]"
            >
              <option value="all">Tất cả danh mục</option>
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <SegmentedControl
              label="Lọc theo loại"
              value={typeFilter}
              onChange={setTypeFilter}
              segments={[
                { value: 'all', label: 'Tất cả' },
                { value: 'expense', label: 'Chi' },
                { value: 'income', label: 'Thu' },
                { value: 'transfer', label: 'Chuyển' },
              ]}
            />
            {hasFilters && (
              <Button size="sm" variant="ghost" icon="x" onClick={clearFilters}>
                Xoá bộ lọc
              </Button>
            )}
          </div>
        </div>
      </Card>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 px-1 text-[13px] text-[var(--ink-secondary)]">
        <span>
          <strong className="num font-semibold text-[var(--ink-primary)]">{filtered.length}</strong>{' '}
          giao dịch
        </span>
        <span className="flex items-center gap-1.5">
          <Icon name="arrow-up-right" size={13} />
          Chi <span className="num font-medium text-[var(--ink-primary)]">{formatMoney(totals.expense)}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <Icon name="arrow-down-right" size={13} />
          Thu <span className="num font-medium text-[var(--ink-primary)]">{formatMoney(totals.income)}</span>
        </span>
      </div>

      <Card>
        {grouped.length === 0 ? (
          <EmptyState
            icon={hasFilters ? 'search' : 'list'}
            title={hasFilters ? 'Không có giao dịch nào khớp' : 'Chưa có giao dịch trong tháng này'}
            description={
              hasFilters
                ? 'Thử nới bộ lọc hoặc chọn tháng khác ở thanh trên.'
                : 'Thêm giao dịch đầu tiên để bắt đầu theo dõi dòng tiền của bạn.'
            }
            action={
              hasFilters ? (
                <Button onClick={clearFilters}>Xoá bộ lọc</Button>
              ) : (
                <Button variant="primary" icon="plus" onClick={() => setAdding(true)}>
                  Thêm giao dịch
                </Button>
              )
            }
          />
        ) : (
          <div className="p-3">
            {grouped.map(([date, rows]) => (
              <section key={date} className="mb-2 last:mb-0">
                <div className="flex items-baseline justify-between px-2 py-2">
                  <h2 className="text-[13px] font-semibold text-[var(--ink-secondary)]">
                    {formatDateHuman(date)}
                  </h2>
                  <span className="num text-[13px] text-[var(--ink-muted)]">
                    {formatMoney(sum(rows.filter((t) => t.type === 'expense').map((t) => t.amount)))}
                  </span>
                </div>
                <ul className="flex flex-col">
                  {rows.map((tx) => (
                    <TransactionRow
                      key={tx.id}
                      tx={tx}
                      accounts={accounts}
                      onEdit={setEditing}
                      onDelete={setPendingDelete}
                    />
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </Card>

      <TransactionDialog open={adding} onClose={() => setAdding(false)} />
      <TransactionDialog
        open={editing !== null}
        editing={editing}
        onClose={() => setEditing(null)}
        onRequestDelete={(tx) => {
          setEditing(null);
          setPendingDelete(tx);
        }}
      />

      <Dialog
        open={pendingDelete !== null}
        title="Xoá giao dịch?"
        onClose={() => setPendingDelete(null)}
        footer={
          <>
            <Button onClick={() => setPendingDelete(null)}>Giữ lại</Button>
            <Button variant="danger" icon="trash-2" onClick={confirmDelete}>
              Xoá giao dịch
            </Button>
          </>
        }
      >
        <p className="text-sm text-[var(--ink-secondary)]">
          {pendingDelete && (
            <>
              <span className="font-medium text-[var(--ink-primary)]">
                {pendingDelete.note || categoryLabel(pendingDelete.categoryId)}
              </span>{' '}
              — <span className="num">{formatMoney(pendingDelete.amount)}</span>. Thao tác này không
              hoàn tác được.
            </>
          )}
        </p>
      </Dialog>
    </div>
  );
}
