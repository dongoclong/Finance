import { useMemo, useState } from 'react';
import type { BudgetProgress } from '@/lib/aggregate';
import { budgetProgress, monthTotals, sum, unbudgetedCategories } from '@/lib/aggregate';
import { useStore } from '@/store/useStore';
import { categoryLabel, expenseCategories } from '@/lib/categories';
import { formatMoney, formatPercent } from '@/lib/money';
import { monthLabel } from '@/lib/period';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Field, Select } from '@/components/ui/Field';
import { MoneyInput } from '@/components/ui/MoneyInput';
import { EmptyState } from '@/components/ui/EmptyState';
import { Meter } from '@/components/charts/Meter';
import { useToast } from '@/components/ui/Toast';
import { BudgetRow } from './BudgetRow';

export function BudgetsPage() {
  const budgets = useStore((s) => s.budgets);
  const transactions = useStore((s) => s.transactions);
  const month = useStore((s) => s.month);
  const setBudget = useStore((s) => s.setBudget);
  const removeBudget = useStore((s) => s.removeBudget);
  const copyPrevious = useStore((s) => s.copyBudgetsFromPreviousMonth);
  const toast = useToast();

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<BudgetProgress | null>(null);
  const [categoryId, setCategoryId] = useState('food');
  const [limit, setLimit] = useState<number | null>(null);
  const [pendingDelete, setPendingDelete] = useState<BudgetProgress | null>(null);

  const rows = useMemo(
    () => budgetProgress(budgets, transactions, month),
    [budgets, transactions, month]
  );
  const totals = useMemo(() => monthTotals(transactions, month), [transactions, month]);
  const free = useMemo(() => unbudgetedCategories(budgets, month), [budgets, month]);

  const totalLimit = sum(rows.map((r) => r.limit));
  const totalSpent = sum(rows.map((r) => r.spent));
  const uncovered = totals.expense - totalSpent;

  const openNew = () => {
    setEditing(null);
    setCategoryId(free[0] ?? expenseCategories[0].id);
    setLimit(null);
    setEditorOpen(true);
  };

  const openEdit = (progress: BudgetProgress) => {
    setEditing(progress);
    setCategoryId(progress.budget.categoryId);
    setLimit(progress.limit);
    setEditorOpen(true);
  };

  const save = () => {
    if (!limit || limit <= 0) return;
    setBudget(categoryId, month, limit);
    setEditorOpen(false);
    toast(editing ? 'Đã cập nhật hạn mức' : 'Đã đặt hạn mức mới', 'good');
  };

  const confirmDelete = () => {
    if (!pendingDelete) return;
    removeBudget(pendingDelete.budget.id);
    setPendingDelete(null);
    toast('Đã xoá hạn mức', 'good');
  };

  const handleCopy = () => {
    const n = copyPrevious(month);
    toast(
      n > 0 ? `Đã sao chép ${n} hạn mức từ tháng trước` : 'Tháng trước không có hạn mức nào để sao chép',
      n > 0 ? 'good' : 'info'
    );
  };

  const options = editing
    ? expenseCategories
    : expenseCategories.filter((c) => free.includes(c.id));

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader
          title={`Tổng hạn mức ${monthLabel(month).toLowerCase()}`}
          hint={
            totalLimit > 0
              ? `Đã dùng ${formatPercent(totalSpent, totalLimit)} của ${formatMoney(totalLimit)}`
              : 'Chưa đặt hạn mức nào cho tháng này'
          }
          action={
            <div className="flex gap-2">
              <Button size="sm" icon="reset" onClick={handleCopy}>
                Sao chép tháng trước
              </Button>
              <Button size="sm" variant="primary" icon="plus" onClick={openNew}>
                Đặt hạn mức
              </Button>
            </div>
          }
        />
        <CardBody className="pt-4">
          {totalLimit > 0 && (
            <>
              <Meter
                ratio={totalSpent / totalLimit}
                color={
                  totalSpent >= totalLimit
                    ? 'var(--bad)'
                    : totalSpent >= totalLimit * 0.75
                      ? 'var(--warn)'
                      : 'var(--good)'
                }
                label={`Tổng ngân sách: đã dùng ${formatPercent(totalSpent, totalLimit)}`}
              />
              <p className="mt-2 text-[13px] text-[var(--ink-secondary)]">
                <span className="num font-medium text-[var(--ink-primary)]">
                  {formatMoney(totalSpent)}
                </span>{' '}
                trong hạn mức, còn{' '}
                <span className="num">{formatMoney(Math.max(totalLimit - totalSpent, 0))}</span>.
                {uncovered > 0 && (
                  <>
                    {' '}
                    Ngoài ra <span className="num">{formatMoney(uncovered)}</span> đã chi ở các danh
                    mục chưa có hạn mức.
                  </>
                )}
              </p>
            </>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Theo danh mục" hint="Vạch mờ trên thanh là mức dự kiến cuối tháng" />
        <CardBody className="pt-4">
          {rows.length === 0 ? (
            <EmptyState
              icon="target"
              title="Chưa có hạn mức nào"
              description="Đặt hạn mức cho vài danh mục lớn nhất trước — ăn uống, mua sắm, giải trí — rồi mở rộng dần."
              action={
                <Button variant="primary" icon="plus" onClick={openNew}>
                  Đặt hạn mức đầu tiên
                </Button>
              }
            />
          ) : (
            <ul className="flex flex-col gap-5">
              {rows.map((r) => (
                <BudgetRow
                  key={r.budget.id}
                  progress={r}
                  onEdit={openEdit}
                  onDelete={setPendingDelete}
                />
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      <Dialog
        open={editorOpen}
        title={editing ? `Hạn mức ${editing.label}` : 'Đặt hạn mức mới'}
        onClose={() => setEditorOpen(false)}
        footer={
          <>
            <Button onClick={() => setEditorOpen(false)}>Huỷ</Button>
            <Button variant="primary" onClick={save} disabled={!limit || limit <= 0}>
              Lưu hạn mức
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Field label="Danh mục">
            {({ id }) => (
              <Select
                id={id}
                value={categoryId}
                disabled={Boolean(editing)}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                {options.length === 0 && <option value="">Mọi danh mục đã có hạn mức</option>}
                {options.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </Select>
            )}
          </Field>

          <Field
            label={`Hạn mức cho ${monthLabel(month).toLowerCase()}`}
            hint="Áp dụng cho tháng đang chọn. Tháng sau có thể sao chép lại."
          >
            {({ id, describedBy }) => (
              <MoneyInput id={id} value={limit} onChange={setLimit} describedBy={describedBy} />
            )}
          </Field>
        </div>
      </Dialog>

      <Dialog
        open={pendingDelete !== null}
        title="Xoá hạn mức?"
        onClose={() => setPendingDelete(null)}
        footer={
          <>
            <Button onClick={() => setPendingDelete(null)}>Giữ lại</Button>
            <Button variant="danger" icon="trash-2" onClick={confirmDelete}>
              Xoá hạn mức
            </Button>
          </>
        }
      >
        <p className="text-sm text-[var(--ink-secondary)]">
          Hạn mức cho{' '}
          <span className="font-medium text-[var(--ink-primary)]">
            {pendingDelete && categoryLabel(pendingDelete.budget.categoryId)}
          </span>{' '}
          sẽ bị xoá. Giao dịch trong danh mục này vẫn được giữ nguyên.
        </p>
      </Dialog>
    </div>
  );
}
