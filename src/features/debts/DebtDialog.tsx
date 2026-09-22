import { useEffect, useMemo, useState } from 'react';
import type { Debt, DebtKind } from '@/types';
import { useStore } from '@/store/useStore';
import { toISODate } from '@/lib/period';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Field, TextInput } from '@/components/ui/Field';
import { MoneyInput } from '@/components/ui/MoneyInput';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { useToast } from '@/components/ui/Toast';

interface DebtDialogProps {
  open: boolean;
  editing: Debt | null;
  onClose: () => void;
}

interface Draft {
  name: string;
  kind: DebtKind;
  counterparty: string;
  principal: number | null;
  annualRate: string;
  minPayment: number | null;
  startDate: string;
  dueDate: string;
  note: string;
}

const blank = (): Draft => ({
  name: '',
  kind: 'borrowed',
  counterparty: '',
  principal: null,
  annualRate: '0',
  minPayment: null,
  startDate: toISODate(new Date()),
  dueDate: '',
  note: '',
});

type Errors = Partial<Record<keyof Draft, string>>;

function validate(draft: Draft): Errors {
  const errors: Errors = {};
  if (!draft.name.trim()) errors.name = 'Đặt tên cho khoản nợ này.';
  if (!draft.principal || draft.principal <= 0) errors.principal = 'Nhập số tiền lớn hơn 0.';
  const rate = Number(draft.annualRate.replace(',', '.'));
  if (!Number.isFinite(rate) || rate < 0 || rate > 200) {
    errors.annualRate = 'Lãi suất phải từ 0 đến 200 %/năm.';
  }
  if (draft.dueDate && draft.dueDate < draft.startDate) {
    errors.dueDate = 'Hạn trả không thể trước ngày bắt đầu.';
  }
  return errors;
}

export function DebtDialog({ open, editing, onClose }: DebtDialogProps) {
  const addDebt = useStore((s) => s.addDebt);
  const updateDebt = useStore((s) => s.updateDebt);
  const toast = useToast();

  const [draft, setDraft] = useState<Draft>(blank);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTouched(false);
    setDraft(
      editing
        ? {
            name: editing.name,
            kind: editing.kind,
            counterparty: editing.counterparty,
            principal: editing.principal,
            annualRate: String(editing.annualRate).replace('.', ','),
            minPayment: editing.minPayment,
            startDate: editing.startDate,
            dueDate: editing.dueDate ?? '',
            note: editing.note ?? '',
          }
        : blank()
    );
  }, [open, editing]);

  const errors = useMemo(() => validate(draft), [draft]);
  const patch = (next: Partial<Draft>) => setDraft((d) => ({ ...d, ...next }));
  const show = (key: keyof Draft) => (touched ? errors[key] : undefined);
  const lent = draft.kind === 'lent';

  const save = () => {
    setTouched(true);
    if (Object.keys(errors).length > 0) return;

    const payload = {
      name: draft.name.trim(),
      kind: draft.kind,
      counterparty: draft.counterparty.trim(),
      principal: draft.principal ?? 0,
      annualRate: Number(draft.annualRate.replace(',', '.')),
      minPayment: draft.minPayment ?? 0,
      startDate: draft.startDate,
      dueDate: draft.dueDate || undefined,
      note: draft.note.trim() || undefined,
    };

    if (editing) {
      updateDebt(editing.id, payload);
      toast('Đã cập nhật khoản nợ', 'good');
    } else {
      addDebt(payload);
      toast('Đã thêm khoản nợ', 'good');
    }
    onClose();
  };

  return (
    <Dialog
      open={open}
      title={editing ? 'Sửa khoản nợ' : 'Thêm khoản nợ'}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Huỷ</Button>
          <Button variant="primary" onClick={save}>
            {editing ? 'Lưu thay đổi' : 'Thêm khoản nợ'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <SegmentedControl
          label="Chiều của khoản nợ"
          value={draft.kind}
          onChange={(kind: DebtKind) => patch({ kind })}
          segments={[
            { value: 'borrowed', label: 'Tôi đi vay', icon: 'arrow-up-right' },
            { value: 'lent', label: 'Tôi cho vay', icon: 'arrow-down-right' },
          ]}
          className="w-full"
        />

        <Field label="Tên khoản nợ" error={show('name')}>
          {({ id, describedBy, invalid }) => (
            <TextInput
              id={id}
              autoFocus
              invalid={invalid}
              aria-describedby={describedBy}
              value={draft.name}
              placeholder={lent ? 'VD: Cho Minh mượn' : 'VD: Vay mua xe, Dư nợ thẻ tín dụng'}
              onChange={(e) => patch({ name: e.target.value })}
            />
          )}
        </Field>

        <Field label={lent ? 'Người vay' : 'Chủ nợ'}>
          {({ id }) => (
            <TextInput
              id={id}
              value={draft.counterparty}
              placeholder={lent ? 'VD: Minh' : 'VD: Techcombank, Bố mẹ'}
              onChange={(e) => patch({ counterparty: e.target.value })}
            />
          )}
        </Field>

        <Field
          label={lent ? 'Số tiền cho vay' : 'Dư nợ hiện tại'}
          error={show('principal')}
          hint="Số tiền còn lại tại ngày bắt đầu theo dõi, không phải tổng đã vay từ đầu."
        >
          {({ id, describedBy, invalid }) => (
            <MoneyInput
              id={id}
              value={draft.principal}
              onChange={(principal) => patch({ principal })}
              describedBy={describedBy}
              invalid={invalid}
            />
          )}
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Lãi suất (%/năm)"
            error={show('annualRate')}
            hint="Để 0 nếu vay không lãi."
          >
            {({ id, describedBy, invalid }) => (
              <TextInput
                id={id}
                inputMode="decimal"
                invalid={invalid}
                aria-describedby={describedBy}
                value={draft.annualRate}
                onChange={(e) => patch({ annualRate: e.target.value })}
              />
            )}
          </Field>

          <Field label={lent ? 'Thu tối thiểu/tháng' : 'Trả tối thiểu/tháng'}>
            {({ id }) => (
              <MoneyInput
                id={id}
                value={draft.minPayment}
                onChange={(minPayment) => patch({ minPayment })}
                placeholder="Không bắt buộc"
              />
            )}
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Bắt đầu theo dõi">
            {({ id }) => (
              <TextInput
                id={id}
                type="date"
                value={draft.startDate}
                onChange={(e) => patch({ startDate: e.target.value })}
              />
            )}
          </Field>
          <Field label="Hạn tất toán" error={show('dueDate')}>
            {({ id, describedBy, invalid }) => (
              <TextInput
                id={id}
                type="date"
                invalid={invalid}
                aria-describedby={describedBy}
                value={draft.dueDate}
                onChange={(e) => patch({ dueDate: e.target.value })}
              />
            )}
          </Field>
        </div>

        <Field label="Ghi chú">
          {({ id }) => (
            <TextInput
              id={id}
              value={draft.note}
              placeholder="Không bắt buộc"
              onChange={(e) => patch({ note: e.target.value })}
            />
          )}
        </Field>
      </div>
    </Dialog>
  );
}
