import type { BudgetProgress } from '@/lib/aggregate';
import { formatCompact, formatMoney, formatPercent } from '@/lib/money';
import { getCategory } from '@/lib/categories';
import { Icon } from '@/components/ui/Icon';
import { Badge } from '@/components/ui/Badge';
import { IconButton } from '@/components/ui/Button';
import { Meter } from '@/components/charts/Meter';

interface BudgetRowProps {
  progress: BudgetProgress;
  onEdit?: (progress: BudgetProgress) => void;
  onDelete?: (progress: BudgetProgress) => void;
}

/** Severity lives in the meter fill AND in a worded badge — never in color alone. */
const STATE_COLOR = {
  ok: 'var(--good)',
  near: 'var(--warn)',
  over: 'var(--bad)',
} as const;

export function BudgetRow({ progress, onEdit, onDelete }: BudgetRowProps) {
  const { budget, label, spent, limit, ratio, remaining, projected, state, paceWarning } = progress;
  const category = getCategory(budget.categoryId);
  const color = STATE_COLOR[state];

  return (
    <li className="group">
      <div className="flex items-center justify-between gap-3">
        <span className="flex min-w-0 items-center gap-2">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[var(--bg-subtle)] text-[var(--ink-secondary)]">
            <Icon name={category.icon} size={13} />
          </span>
          <span className="truncate text-sm font-medium text-[var(--ink-primary)]">{label}</span>
          {state === 'over' && (
            <Badge tone="bad" icon="alert-triangle">
              {remaining === 0
                ? 'Hết hạn mức'
                : `Vượt ${formatCompact(Math.abs(remaining), false)}`}
            </Badge>
          )}
          {state === 'near' && (
            <Badge tone="warn" icon="flame">
              Sắp hết
            </Badge>
          )}
          {state === 'ok' && paceWarning && (
            <Badge tone="warn" icon="trending-up">
              Tốc độ quá nhanh
            </Badge>
          )}
        </span>

        <span className="flex shrink-0 items-center gap-1">
          <span className="num text-[13px] text-[var(--ink-secondary)]">
            <span className="font-semibold text-[var(--ink-primary)]">{formatCompact(spent)}</span>
            {' / '}
            {formatCompact(limit)}
          </span>
          {(onEdit || onDelete) && (
            <span className="row-actions flex gap-0.5">
              {onEdit && (
                <IconButton icon="pencil" label={`Sửa hạn mức ${label}`} onClick={() => onEdit(progress)} />
              )}
              {onDelete && (
                <IconButton
                  icon="trash-2"
                  label={`Xoá hạn mức ${label}`}
                  onClick={() => onDelete(progress)}
                />
              )}
            </span>
          )}
        </span>
      </div>

      <Meter
        className="mt-2"
        ratio={ratio}
        color={color}
        projectedRatio={limit > 0 ? projected / limit : 0}
        label={`${label}: đã dùng ${formatPercent(ratio, 1)} hạn mức`}
      />

      <p className="mt-1.5 text-[13px] text-[var(--ink-muted)]">
        {remaining === 0
          ? 'Đã dùng hết hạn mức.'
          : remaining < 0
            ? `Đã vượt ${formatMoney(Math.abs(remaining))}.`
            : `Còn ${formatMoney(remaining)}.`}{' '}
        Theo tốc độ hiện tại, cả tháng sẽ chi khoảng{' '}
        <span className="num">{formatMoney(projected)}</span>.
      </p>
    </li>
  );
}
