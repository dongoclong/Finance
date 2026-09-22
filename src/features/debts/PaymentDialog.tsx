import { useEffect, useState } from 'react';
import type { DebtState } from '@/lib/debt';
import { useStore } from '@/store/useStore';
import { formatMoney } from '@/lib/money';
import { toISODate } from '@/lib/period';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Field, Select, TextInput } from '@/components/ui/Field';
import { MoneyInput } from '@/components/ui/MoneyInput';
import { Icon } from '@/components/ui/Icon';
import { useToast } from '@/components/ui/Toast';

interface PaymentDialogProps {
  state: DebtState | null;
  onClose: () => void;
}

export function PaymentDialog({ state, onClose }: PaymentDialogProps) {
  const accounts = useStore((s) => s.accounts);
  const recordDebtPayment = useStore((s) => s.recordDebtPayment);
  const toast = useToast();

  const [amount, setAmount] = useState<number | null>(null);
  const [date, setDate] = useState(toISODate(new Date()));
  const [note, setNote] = useState('');
  const [toLedger, setToLedger] = useState(true);
  const [accountId, setAccountId] = useState('');

  useEffect(() => {
    if (!state) return;
    setAmount(state.debt.minPayment > 0 ? Math.min(state.debt.minPayment, state.outstanding) : null);
    setDate(toISODate(new Date()));
    setNote('');
    setToLedger(true);
    setAccountId(accounts[0]?.id ?? '');
  }, [state, accounts]);

  if (!state) return null;
  const lent = state.debt.kind === 'lent';
  const over = amount !== null && amount > state.outstanding;
  const valid = amount !== null && amount > 0 && !over;

  const save = () => {
    if (!valid) return;
    recordDebtPayment({
      debtId: state.debt.id,
      date,
      amount,
      note,
      accountId: toLedger ? accountId : undefined,
    });
    toast(
      `Đã ghi ${formatMoney(amount)} ${lent ? 'thu về' : 'đã trả'}${toLedger ? ' và vào sổ thu chi' : ''}`,
      'good'
    );
    onClose();
  };

  return (
    <Dialog
      open
      title={lent ? `Ghi khoản thu — ${state.debt.name}` : `Ghi khoản trả — ${state.debt.name}`}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Huỷ</Button>
          <Button variant="primary" onClick={save} disabled={!valid}>
            Ghi nhận
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <p className="rounded-[10px] bg-[var(--bg-subtle)] px-3.5 py-3 text-[13px] text-[var(--ink-secondary)]">
          Còn {lent ? 'phải thu' : 'phải trả'}{' '}
          <span className="num font-semibold text-[var(--ink-primary)]">
            {formatMoney(state.outstanding)}
          </span>
          {state.monthlyInterest > 0 && (
            <>
              . Lãi tháng này khoảng{' '}
              <span className="num">{formatMoney(state.monthlyInterest)}</span> — trả dưới mức đó
              thì nợ còn phình ra.
            </>
          )}
        </p>

        <Field
          label="Số tiền"
          error={over ? `Vượt quá số còn lại (${formatMoney(state.outstanding)}).` : undefined}
        >
          {({ id, describedBy, invalid }) => (
            <MoneyInput
              id={id}
              autoFocus
              value={amount}
              onChange={setAmount}
              describedBy={describedBy}
              invalid={invalid}
            />
          )}
        </Field>

        <Field label="Ngày">
          {({ id }) => (
            <TextInput
              id={id}
              type="date"
              value={date}
              max={toISODate(new Date())}
              onChange={(e) => setDate(e.target.value)}
            />
          )}
        </Field>

        <Field label="Ghi chú">
          {({ id }) => (
            <TextInput
              id={id}
              value={note}
              placeholder={lent ? 'VD: Minh trả đợt 2' : 'VD: Trả góp hằng tháng'}
              onChange={(e) => setNote(e.target.value)}
            />
          )}
        </Field>

        <div className="rounded-[10px] border border-[var(--line)] p-3.5">
          <label className="flex cursor-pointer items-start gap-2.5">
            <input
              type="checkbox"
              checked={toLedger}
              onChange={(e) => setToLedger(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--accent)]"
            />
            <span>
              <span className="block text-sm font-medium text-[var(--ink-primary)]">
                Ghi luôn vào sổ thu chi
              </span>
              <span className="mt-0.5 block text-[13px] text-[var(--ink-secondary)]">
                Tạo một giao dịch {lent ? 'thu' : 'chi'} tương ứng, để dòng tiền trong Tổng quan
                khớp với thực tế. Bỏ chọn nếu bạn đã tự nhập giao dịch này rồi.
              </span>
            </span>
          </label>

          {toLedger && (
            <div className="mt-3 pl-[26px]">
              <Field label={lent ? 'Nhận vào tài khoản' : 'Trả từ tài khoản'}>
                {({ id }) => (
                  <Select id={id} value={accountId} onChange={(e) => setAccountId(e.target.value)}>
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
            </div>
          )}
        </div>

        <p className="flex items-start gap-1.5 text-[13px] text-[var(--ink-muted)]">
          <Icon name="info" size={13} className="mt-0.5 shrink-0" />
          Dư nợ = gốc ban đầu − đã trả. Tiền lãi không bị cộng ngược vào số dư; nó được tính
          trong phần kế hoạch trả bên dưới.
        </p>
      </div>
    </Dialog>
  );
}
