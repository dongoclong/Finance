import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps,
} from 'recharts';
import type { DayPoint } from '@/lib/aggregate';
import { formatCompact, formatMoney } from '@/lib/money';
import { formatDate } from '@/lib/period';
import { ChartTooltip } from './ChartTooltip';

const BAR = 'var(--series-1)';

interface DailySpendChartProps {
  data: DayPoint[];
  /** average spend per elapsed day — the reference the bars are read against */
  average: number;
  elapsedDays: number;
}

/**
 * One series, so no legend — the card title names it. The average line is what turns a
 * row of bars into an answer: which days blew past the norm.
 */
export function DailySpendChart({ data, average, elapsedDays }: DailySpendChartProps) {
  const renderTip = (props: TooltipProps<number, string>) => {
    const point = props.payload?.[0]?.payload as DayPoint | undefined;
    if (!props.active || !point) return null;
    const diff = point.expense - average;
    return (
      <ChartTooltip
        title={formatDate(point.date)}
        rows={[{ label: 'Đã chi', value: point.expense, color: BAR }]}
        footer={
          point.expense === 0
            ? 'Không chi tiêu'
            : `${diff > 0 ? 'Cao hơn' : 'Thấp hơn'} mức trung bình ${formatMoney(Math.abs(diff))}`
        }
      />
    );
  };

  return (
    <div className="h-[200px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} barCategoryGap="18%">
          <CartesianGrid vertical={false} stroke="var(--grid)" strokeWidth={1} />
          <XAxis
            dataKey="day"
            tickLine={false}
            axisLine={{ stroke: 'var(--axis)' }}
            tick={{ fill: 'var(--ink-muted)', fontSize: 12 }}
            interval={4}
            dy={6}
          />
          <YAxis
            width={54}
            tickLine={false}
            axisLine={false}
            tick={{ fill: 'var(--ink-muted)', fontSize: 12 }}
            tickFormatter={(v: number) => formatCompact(v, false)}
          />
          <Tooltip content={renderTip} cursor={{ fill: 'var(--bg-subtle)' }} />

          {average > 0 && (
            <ReferenceLine
              y={average}
              stroke="var(--line-strong)"
              strokeWidth={1}
              label={{
                value: `TB ${formatCompact(average, false)}/ngày`,
                position: 'insideTopRight',
                fill: 'var(--ink-muted)',
                fontSize: 12,
              }}
            />
          )}

          <Bar
            dataKey="expense"
            radius={[4, 4, 0, 0]}
            maxBarSize={24}
            animationDuration={400}
            animationEasing="ease-out"
          >
            {data.map((d) => (
              <Cell
                key={d.date}
                fill={BAR}
                // days that haven't happened yet recede instead of reading as zero-spend
                fillOpacity={d.day > elapsedDays ? 0.18 : d.expense > average * 1.8 ? 1 : 0.75}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
