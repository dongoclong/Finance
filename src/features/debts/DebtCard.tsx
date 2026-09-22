import type { DebtState } from '@/lib/debt';
import { monthsToWords } from '@/lib/debt';
import { formatCompact, formatMoney, formatPercent } from '@/lib/money';
import { daysUntil, formatDate } from '@/lib/period';
import { Icon } from '@/components/ui/Icon';
import { Badge } from '@/components/ui/Badge';
import { Button, IconButton } from '@/components/ui/Button';
import { Meter } from '@/components/charts/Meter';

interface DebtCardProps {
  state: DebtState;
  /** month this debt is cleared in the current plan, if the plan clears it */
  payoffIn?: number | null;
  onPay: (state: DebtState) => void;
  onEdit: (state: DebtState) => void;
  onDelete: (state: DebtState) => void;
}

export function DebtCard({ state, payoffIn, onPay, onEdit, onDelete }: DebtCardProps) {
  const { debt, paid, outstanding, ratio, monthlyInterest, cleared } = state;
  const lent = debt.kind === 'lent';
  const overdue = debt.dueDate ? daysUntil(debt.dueDate) < 0 && !cleared : false;

  const color = cleared
    ? 'var(--good)'
    : overdue
      ? 'var(--bad)'
      : lent
        ? 'var(--series-3)'
        : 'var(--series-7)';

  return (
    <li className="group rounded-2xl border border-[var(--line)] bg-[var(--bg-surface)] p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-[15px] font-semibold text-[var(--ink-primary)]">
            {debt.name}
          </h3>
          <p className="mt-0.5 truncate text-[13px] text-[var(--ink-muted)]">
            {lent ? 'Cho vay' : 'Chủ nợ'}: {debt.counterparty || '—'}
            {debt.annualRate > 0 && ` · ${String(debt.annualRate).replace('.', ',')}%/năm`}
          </p>
        </div>
        <span className="row-actions flex shrink-0 gap-0.5">
          <IconButton icon="pencil" label={`Sửa ${debt.name}`} onClick={() => onEdit(state)} />
          <IconButton icon="trash-2" label={`Xoá ${debt.name}`} onClick={() => onDelete(state)} />
        </span>
      </div>

      <p className="mt-3 text-[28px] font-semibold leading-[1.15] text-[var(--ink-primary)]">
        {formatCompact(outstanding)}
      </p>
      <p className="num text-[13px] text-[var(--ink-secondary)]">
        {lent ? 'còn phải thu' : 'còn phải trả'} · đã {lent ? 'thu' : 'trả'} {formatMoney(paid)} /{' '}
        {formatMoney(debt.principal)}
      </p>

      <Meter
        className="mt-3"
        ratio={ratio}
        color={color}
        label={`${debt.name}: đã ${lent ? 'thu' : 'trả'} ${formatPercent(paid, debt.principal)}`}
      />

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {cleared ? (
          <Badge tone="good" icon="check">
            Đã tất toán
          </Badge>
        ) : (
          <Badge tone="neutral" icon="target">
            {formatPercent(paid, debt.principal)}
          </Badge>
        )}
        {debt.dueDate && !cleared && (
          <Badge tone={overdue ? 'bad' : 'neutral'} icon="calendar">
            {overdue
              ? `Quá hạn ${formatDate(debt.dueDate)}`
              : `Hạn ${formatDate(debt.dueDate)}`}
          </Badge>
        )}
        {!cleared && monthlyInterest > 0 && (
          <Badge tone="warn" icon="flame">
            Lãi {formatCompact(monthlyInterest, false)}/tháng
          </Badge>
        )}
        {!cleared && payoffIn != null && (
          <Badge tone="accent" icon="sparkles">
            Hết sau {monthsToWords(payoffIn)}
          </Badge>
        )}
      </div>

      {!cleared && !lent && debt.minPayment > 0 && (
        <p className="mt-3 text-[13px] text-[var(--ink-secondary)]">
          Tối thiểu <span className="num">{formatMoney(debt.minPayment)}</span>/tháng.
          {monthlyInterest > 0 && (
            <>
              {' '}
              Trong đó <span className="num">{formatMoney(monthlyInterest)}</span> là tiền lãi —
              phần thực sự làm giảm nợ chỉ{' '}
              <span className="num">{formatMoney(Math.max(debt.minPayment - monthlyInterest, 0))}</span>.
            </>
          )}
        </p>
      )}

      {debt.note && (
        <p className="mt-2 flex items-start gap-1.5 text-[13px] text-[var(--ink-muted)]">
          <Icon name="info" size={13} className="mt-0.5 shrink-0" />
          {debt.note}
        </p>
      )}

      <Button
        size="sm"
        icon="plus"
        className="mt-4 w-full"
        disabled={cleared}
        onClick={() => onPay(state)}
      >
        {cleared ? 'Đã xong' : lent ? 'Ghi khoản thu' : 'Ghi khoản trả'}
      </Button>
    </li>
  );
}
