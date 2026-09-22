import type { ReactNode } from 'react';
import { formatMoney } from '@/lib/money';

export interface TooltipRow {
  label: string;
  value: number;
  color: string;
}

interface ChartTooltipProps {
  title: string;
  rows: TooltipRow[];
  footer?: ReactNode;
}

/**
 * Identity comes from the swatch beside the label — the text itself always wears a
 * text token, never the series color.
 */
export function ChartTooltip({ title, rows, footer }: ChartTooltipProps) {
  return (
    <div className="min-w-[180px] rounded-[10px] border border-[var(--line)] bg-[var(--bg-raised)] px-3 py-2.5 shadow-[var(--shadow-2)]">
      <p className="mb-1.5 text-[13px] font-medium text-[var(--ink-primary)]">{title}</p>
      <ul className="flex flex-col gap-1">
        {rows.map((r) => (
          <li key={r.label} className="flex items-center justify-between gap-4 text-[13px]">
            <span className="flex items-center gap-1.5 text-[var(--ink-secondary)]">
              <span
                aria-hidden="true"
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ background: r.color }}
              />
              {r.label}
            </span>
            <span className="num font-medium text-[var(--ink-primary)]">{formatMoney(r.value)}</span>
          </li>
        ))}
      </ul>
      {footer && <p className="mt-1.5 text-xs text-[var(--ink-muted)]">{footer}</p>}
    </div>
  );
}

export interface LegendItem {
  label: string;
  color: string;
}

/** Always present for two or more series; a single-series chart names itself in the title. */
export function ChartLegend({ items }: { items: LegendItem[] }) {
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1">
      {items.map((i) => (
        <li key={i.label} className="flex items-center gap-1.5 text-[13px] text-[var(--ink-secondary)]">
          <span
            aria-hidden="true"
            className="h-0.5 w-3.5 rounded-full"
            style={{ background: i.color }}
          />
          {i.label}
        </li>
      ))}
    </ul>
  );
}
