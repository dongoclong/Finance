import type { CategorySlice } from '@/lib/aggregate';
import { formatCompact, formatMoney, formatPercent } from '@/lib/money';
import { Icon } from '@/components/ui/Icon';
import { getCategory } from '@/lib/categories';

interface CategoryBarsProps {
  slices: CategorySlice[];
  onSelect?: (categoryId: string) => void;
}

/**
 * Bars, not a donut: a donut can only answer "part of a whole at a glance", and these
 * values are close enough that reading them off arcs is guesswork. Each category is
 * named on its own row, so identity never rides on color alone.
 */
export function CategoryBars({ slices, onSelect }: CategoryBarsProps) {
  const max = Math.max(...slices.map((s) => s.value), 1);

  return (
    <ul className="flex flex-col gap-3">
      {slices.map((slice) => {
        const row = (
          <>
            <div className="flex items-center justify-between gap-3">
              <span className="flex min-w-0 items-center gap-2">
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md"
                  style={{ background: 'var(--bg-subtle)', color: slice.color }}
                >
                  <Icon name={getCategory(slice.id).icon} size={13} />
                </span>
                <span className="truncate text-sm text-[var(--ink-primary)]">{slice.label}</span>
                <span className="num shrink-0 text-[13px] text-[var(--ink-muted)]">
                  {formatPercent(slice.share, 1)}
                </span>
              </span>
              <span
                className="num shrink-0 text-sm font-medium text-[var(--ink-primary)]"
                title={formatMoney(slice.value)}
              >
                {formatCompact(slice.value)}
              </span>
            </div>
            {/* 8px track, 4px rounded data-end, grows from a single baseline */}
            <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-[var(--bg-subtle)]">
              <div
                className="h-full rounded-r-[4px] transition-[width] duration-[400ms] ease-out"
                style={{ width: `${Math.max((slice.value / max) * 100, 2)}%`, background: slice.color }}
              />
            </div>
          </>
        );

        return (
          <li key={slice.id}>
            {onSelect ? (
              <button
                type="button"
                onClick={() => onSelect(slice.id)}
                className="w-full rounded-lg px-1 py-1 text-left transition-colors duration-[120ms] hover:bg-[var(--bg-subtle)]"
                title={`Xem giao dịch ${slice.label} — ${formatMoney(slice.value)} qua ${slice.count} giao dịch`}
              >
                {row}
              </button>
            ) : (
              <div className="px-1 py-1">{row}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
