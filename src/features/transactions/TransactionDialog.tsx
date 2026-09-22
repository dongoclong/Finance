import { useEffect, useMemo, useState } from 'react';
import type { Transaction, TxType } from '@/types';
import { useStore } from '@/store/useStore';
import { expenseCategories, incomeCategories } from '@/lib/categories';
import { toISODate } from '@/lib/period';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Field, Select, TextInput } from '@/components/ui/Field';
import { MoneyInput } from '@/components/ui/MoneyInput';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { useToast } from '@/components/ui/Toast';

interface TransactionDialogProps {
  open: boolean;
  onClose: () => void;
  /** present when editing an existing row */
  editing?: Transaction | null;
  onRequestDelete?: (tx: Transaction) => void;
}

interface Draft {
  type: TxType;
  amount: number | null;
  categoryId: string;
  accountId: string;
  toAccountId: string;
  date: string;
  note: string;
}

type Errors = Partial<Record<keyof Draft, string>>;

const blankDraft = (accountId: string): Draft => ({
  type: 'expense',
  amount: null,
  categoryId: 'food',
  accountId,
  toAccountId: '',
  date: toISODate(new Date()),
  note: '',
});

/** Pure — the same draft always produces the same errors. */
function validate(draft: Draft): Errors {
  const errors: Errors = {};
  if (!draft.amount || draft.amount <= 0) errors.amount = 'Nhập số tiền lớn hơn 0.';
  if (draft.type !== 'transfer' && !draft.categoryId) errors.categoryId = 'Chọn một danh mục.';
  if (!draft.accountId) errors.accountId = 'Chọn tài khoản.';
  if (draft.type === 'transfer') {
    if (!draft.toAccountId) errors.toAccountId = 'Chọn tài khoản nhận.';
    else if (draft.toAccountId === draft.accountId)
      errors.toAccountId = 'Tài khoản nhận phải khác tài khoản nguồn.';
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.date)) errors.date = 'Ngày không hợp lệ.';
  return errors;
}

export function TransactionDialog({
  open,
  onClose,
  editing,
  onRequestDelete,
}: TransactionDialogProps) {
  const accounts = useStore((s) => s.accounts);
  const addTransaction = useStore((s) => s.addTransaction);
  const updateTransaction = useStore((s) => s.updateTransaction);
  const toast = useToast();

  const [draft, setDraft] = useState<Draft>(() => blankDraft(accounts[0]?.id ?? ''));
  const [touched, setTouched] = useState(false);

  // Reset the form whenever the dialog opens — a stale draft from last time is a bug.
  useEffect(() => {
    if (!open) return;
    setTouched(false);
    setDraft(
      editing
        ? {
            type: editing.type,
            amount: editing.amount,
            categoryId: editing.categoryId,
            accountId: editing.accountId,
            toAccountId: editing.toAccountId ?? '',
            date: editing.date,
            note: editing.note,
          }
        : blankDraft(accounts[0]?.id ?? '')
    );
  }, [open, editing, accounts]);

  const errors = useMemo(() => validate(draft), [draft]);
  const categories = draft.type === 'income' ? incomeCategories : expenseCategories;

  const patch = (next: Partial<Draft>) => setDraft((d) => ({ ...d, ...next }));

  const changeType = (type: TxType) =>
    patch({
      type,
      categoryId:
        type === 'transfer' ? '' : type === 'income' ? 'salary' : 'food',
    });

  const submit = () => {
    setTouched(true);
    if (Object.keys(errors).length > 0) return;

    const payload = {
      type: draft.type,
      amount: draft.amount ?? 0,
      categoryId: draft.type === 'transfer' ? '' : draft.categoryId,
      accountId: draft.accountId,
      toAccountId: draft.type === 'transfer' ? draft.toAccountId : undefined,
      date: draft.date,
      note: draft.note.trim(),
    };

    if (editing) {
      updateTransaction(editing.id, payload);
      toast('Đã cập nhật giao dịch', 'good');
    } else {
      addTransaction(payload);
      toast('Đã thêm giao dịch', 'good');
    }
    onClose();
  };

  const show = (key: keyof Draft) => (touched ? errors[key] : undefined);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={editing ? 'Sửa giao dịch' : 'Thêm giao dịch'}
      footer={
        <>
          {editing && onRequestDelete && (
            <Button
              variant="ghost"
              icon="trash-2"
              className="mr-auto text-[var(--bad-ink)]"
              onClick={() => onRequestDelete(editing)}
            >
              Xoá
            </Button>
          )}
          <Button onClick={onClose}>Huỷ</Button>
          <Button variant="primary" onClick={submit}>
            {editing ? 'Lưu thay đổi' : 'Thêm giao dịch'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <SegmentedControl
          label="Loại giao dịch"
          value={draft.type}
          onChange={changeType}
          segments={[
            { value: 'expense', label: 'Chi', icon: 'arrow-up-right' },
            { value: 'income', label: 'Thu', icon: 'arrow-down-right' },
            { value: 'transfer', label: 'Chuyển', icon: 'arrow-right-left' },
          ]}
          className="w-full"
        />

        <Field label="Số tiền" error={show('amount')}>
          {({ id, describedBy, invalid }) => (
            <MoneyInput
              id={id}
              value={draft.amount}
              onChange={(amount) => patch({ amount })}
              describedBy={describedBy}
              invalid={invalid}
              autoFocus
            />
          )}
        </Field>

        {draft.type !== 'transfer' && (
          <Field label="Danh mục" error={show('categoryId')}>
            {({ id, describedBy, invalid }) => (
              <Select
                id={id}
                aria-describedby={describedBy}
                aria-invalid={invalid || undefined}
                value={draft.categoryId}
                onChange={(e) => patch({ categoryId: e.target.value })}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={draft.type === 'transfer' ? 'Từ tài khoản' : 'Tài khoản'} error={show('accountId')}>
            {({ id, describedBy }) => (
              <Select
                id={id}
                aria-describedby={describedBy}
                value={draft.accountId}
                onChange={(e) => patch({ accountId: e.target.value })}
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>

          {draft.type === 'transfer' ? (
            <Field label="Đến tài khoản" error={show('toAccountId')}>
              {({ id, describedBy, invalid }) => (
                <Select
                  id={id}
                  aria-describedby={describedBy}
                  aria-invalid={invalid || undefined}
                  value={draft.toAccountId}
                  onChange={(e) => patch({ toAccountId: e.target.value })}
                >
                  <option value="">— Chọn —</option>
                  {accounts
                    .filter((a) => a.id !== draft.accountId)
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                </Select>
              )}
            </Field>
          ) : (
            <Field label="Ngày" error={show('date')}>
              {({ id, describedBy, invalid }) => (
                <TextInput
                  id={id}
                  type="date"
                  value={draft.date}
                  invalid={invalid}
                  aria-describedby={describedBy}
                  max={toISODate(new Date())}
                  onChange={(e) => patch({ date: e.target.value })}
                />
              )}
            </Field>
          )}
        </div>

        {draft.type === 'transfer' && (
          <Field label="Ngày" error={show('date')}>
            {({ id, describedBy, invalid }) => (
              <TextInput
                id={id}
                type="date"
                value={draft.date}
                invalid={invalid}
                aria-describedby={describedBy}
                max={toISODate(new Date())}
                onChange={(e) => patch({ date: e.target.value })}
              />
            )}
          </Field>
        )}

        <Field
          label="Ghi chú"
          hint="Ghi chú giống nhau mỗi tháng sẽ được nhận diện là khoản lặp lại."
        >
          {({ id, describedBy }) => (
            <TextInput
              id={id}
              aria-describedby={describedBy}
              value={draft.note}
              placeholder="VD: Cơm trưa, Netflix, Tiền thuê nhà"
              onChange={(e) => patch({ note: e.target.value })}
            />
          )}
        </Field>
      </div>
    </Dialog>
  );
}
