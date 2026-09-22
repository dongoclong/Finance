import {
  Area,
  CartesianGrid,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps,
} from 'recharts';
import type { TrendPoint } from '@/lib/aggregate';
import { formatCompact, formatMoney } from '@/lib/money';
import { monthLabel } from '@/lib/period';
import { ChartLegend, ChartTooltip } from './ChartTooltip';

const INCOME = 'var(--series-1)';
const EXPENSE = 'var(--series-2)';

/**
 * Two series, one axis — both are đồng, so a second scale would be inventing a
 * relationship. Income and expense are IDENTITY here, not status, so they wear
 * categorical slots rather than the good/bad colors.
 */
export function CashflowChart({ data }: { data: TrendPoint[] }) {
  const renderTip = (props: TooltipProps<number, string>) => {
    const point = props.payload?.[0]?.payload as TrendPoint | undefined;
    if (!props.active || !point) return null;
    return (
      <ChartTooltip
        title={monthLabel(point.key)}
        rows={[
          { label: 'Thu nhập', value: point.income, color: INCOME },
          { label: 'Chi tiêu', value: point.expense, color: EXPENSE },
        ]}
        footer={`Còn lại ${formatMoney(point.net)}`}
      />
    );
  };

  return (
    <div>
      <ChartLegend
        items={[
          { label: 'Thu nhập', color: INCOME },
          { label: 'Chi tiêu', color: EXPENSE },
        ]}
      />
      <div className="mt-3 h-[240px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="fina-income" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={INCOME} stopOpacity={0.16} />
                <stop offset="100%" stopColor={INCOME} stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="fina-expense" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={EXPENSE} stopOpacity={0.16} />
                <stop offset="100%" stopColor={EXPENSE} stopOpacity={0.02} />
              </linearGradient>
            </defs>

            <CartesianGrid vertical={false} stroke="var(--grid)" strokeWidth={1} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={{ stroke: 'var(--axis)' }}
              tick={{ fill: 'var(--ink-muted)', fontSize: 12 }}
              dy={6}
            />
            <YAxis
              width={54}
              tickLine={false}
              axisLine={false}
              tick={{ fill: 'var(--ink-muted)', fontSize: 12 }}
              tickFormatter={(v: number) => formatCompact(v, false)}
            />
            <Tooltip
              content={renderTip}
              cursor={{ stroke: 'var(--line-strong)', strokeWidth: 1 }}
            />

            <Area
              type="monotone"
              dataKey="income"
              name="Thu nhập"
              stroke={INCOME}
              strokeWidth={2}
              fill="url(#fina-income)"
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--bg-surface)' }}
              animationDuration={400}
              animationEasing="ease-out"
            />
            <Area
              type="monotone"
              dataKey="expense"
              name="Chi tiêu"
              stroke={EXPENSE}
              strokeWidth={2}
              fill="url(#fina-expense)"
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--bg-surface)' }}
              animationDuration={400}
              animationEasing="ease-out"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
