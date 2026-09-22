import { cn } from '@/lib/cn';
import { formatCompact, formatMoney } from '@/lib/money';
import { Icon } from '@/components/ui/Icon';
import { Sparkline } from './Sparkline';

interface StatTileProps {
  label: string;
  value: number;
  /**
   * Signed percent vs the named period.
   * `null` = there is a comparison to make but no baseline yet (shows a note).
   * omitted = this figure has no period comparison at all (shows nothing).
   */
  delta?: number | null;
  deltaPeriod?: string;
  /** whether an increase is a good thing — spending up is not */
  upIsGood?: boolean;
  icon?: string;
  accent?: string;
  trend?: number[];
  hero?: boolean;
  /** overrides the compact money rendering — for ratios and counts */
  display?: string;
}

export function StatTile({
  label,
  value,
  delta,
  deltaPeriod = 'tháng trước',
  upIsGood = true,
  icon,
  accent = 'var(--series-1)',
  trend,
  hero = false,
  display,
}: StatTileProps) {
  const hasDelta = delta !== null && delta !== undefined && Number.isFinite(delta);
  const flat = hasDelta && Math.abs(delta) < 1;
  const good = hasDelta && (delta > 0 ? upIsGood : !upIsGood);

  return (
    <div className="flex h-full flex-col justify-between rounded-2xl border border-[var(--line)] bg-[var(--bg-surface)] p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] font-medium text-[var(--ink-secondary)]">{label}</p>
        {icon && (
          <span
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
            style={{ background: 'var(--bg-subtle)', color: accent }}
          >
            <Icon name={icon} size={15} />
          </span>
        )}
      </div>

      <p
        className={cn(
          'mt-3 font-semibold leading-[1.15] text-[var(--ink-primary)]',
          hero ? 'text-[40px]' : 'text-[28px]'
        )}
        title={display ?? formatMoney(value)}
      >
        {display ?? formatCompact(value)}
      </p>

      {(hasDelta || delta === null || (trend && trend.length > 1)) && (
      <div className="mt-2 flex items-end justify-between gap-3">
        {hasDelta ? (
          <span
            className={cn(
              'inline-flex items-center gap-1 text-[13px] font-medium',
              flat
                ? 'text-[var(--ink-muted)]'
                : good
                  ? 'text-[var(--good-ink)]'
                  : 'text-[var(--bad-ink)]'
            )}
          >
            <Icon name={flat ? 'equal' : delta > 0 ? 'trending-up' : 'trending-down'} size={13} />
            <span className="num">
              {delta > 0 ? '+' : ''}
              {delta.toFixed(0)}%
            </span>
            <span className="font-normal text-[var(--ink-muted)]">so với {deltaPeriod}</span>
          </span>
        ) : delta === null ? (
          <span className="text-[13px] text-[var(--ink-muted)]">Chưa có kỳ trước để so sánh</span>
        ) : (
          <span />
        )}

        {trend && trend.length > 1 && (
          <Sparkline values={trend} accent={accent} className="shrink-0" />
        )}
      </div>
      )}
    </div>
  );
}
