import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps,
} from 'recharts';
import type { PlanResult } from '@/lib/debt';
import { formatCompact } from '@/lib/money';
import { monthLabel, monthYearLabel } from '@/lib/period';
import { ChartLegend, ChartTooltip } from './ChartTooltip';

const AVALANCHE = 'var(--series-1)';
const SNOWBALL = 'var(--series-2)';

interface Row {
  label: string;
  key: string;
  avalanche: number | null;
  snowball: number | null;
}

interface DebtProjectionChartProps {
  avalanche: PlanResult;
  snowball: PlanResult;
}

/**
 * Both strategies on ONE axis — they are the same quantity (đồng still owed), so a
 * second scale would invent a difference that isn't there. The gap between the two
 * lines IS the point: it is the cost of choosing the wrong order.
 */
export function DebtProjectionChart({ avalanche, snowball }: DebtProjectionChartProps) {
  const span = Math.max(avalanche.months.length, snowball.months.length);
  if (span < 2) return null;

  // Past ~5 years the month-by-month detail is noise; sample it down instead.
  const step = span > 72 ? Math.ceil(span / 72) : 1;

  const rows: Row[] = [];
  for (let i = 0; i < span; i += step) {
    const a = avalanche.months[i];
    const s = snowball.months[i];
    const key = (a ?? s)?.key;
    rows.push({
      label: key ? monthYearLabel(key) : '',
      key: key ?? String(i),
      avalanche: a ? a.remaining : i < avalanche.months.length ? null : 0,
      snowball: s ? s.remaining : i < snowball.months.length ? null : 0,
    });
  }

  const renderTip = (props: TooltipProps<number, string>) => {
    const row = props.payload?.[0]?.payload as Row | undefined;
    if (!props.active || !row) return null;
    return (
      <ChartTooltip
        title={monthLabel(row.key)}
        rows={[
          { label: 'Trả lãi cao trước', value: row.avalanche ?? 0, color: AVALANCHE },
          { label: 'Trả món nhỏ trước', value: row.snowball ?? 0, color: SNOWBALL },
        ]}
        footer="Số tiền còn nợ tại thời điểm đó"
      />
    );
  };

  const mark = (plan: PlanResult, color: string) => {
    if (plan.monthsToFree === null) return null;
    const idx = Math.max(Math.round((plan.months.length - 1) / step), 0);
    const row = rows[Math.min(idx, rows.length - 1)];
    if (!row) return null;
    return (
      <ReferenceDot
        x={row.label}
        y={0}
        r={5}
        fill={color}
        stroke="var(--bg-surface)"
        strokeWidth={2}
        isFront
      />
    );
  };

  return (
    <div>
      <ChartLegend
        items={[
          { label: 'Trả lãi cao trước', color: AVALANCHE },
          { label: 'Trả món nhỏ trước', color: SNOWBALL },
        ]}
      />
      <div className="mt-3 h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--grid)" strokeWidth={1} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={{ stroke: 'var(--axis)' }}
              tick={{ fill: 'var(--ink-muted)', fontSize: 12 }}
              interval={Math.max(0, Math.ceil(rows.length / 7) - 1)}
              dy={6}
            />
            <YAxis
              width={54}
              tickLine={false}
              axisLine={false}
              tick={{ fill: 'var(--ink-muted)', fontSize: 12 }}
              tickFormatter={(v: number) => formatCompact(v, false)}
            />
            <Tooltip content={renderTip} cursor={{ stroke: 'var(--line-strong)', strokeWidth: 1 }} />

            <Line
              type="monotone"
              dataKey="snowball"
              stroke={SNOWBALL}
              strokeWidth={2}
              dot={false}
              connectNulls={false}
              animationDuration={400}
              animationEasing="ease-out"
            />
            <Line
              type="monotone"
              dataKey="avalanche"
              stroke={AVALANCHE}
              strokeWidth={2}
              dot={false}
              connectNulls={false}
              animationDuration={400}
              animationEasing="ease-out"
            />
            {mark(snowball, SNOWBALL)}
            {mark(avalanche, AVALANCHE)}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-[13px] text-[var(--ink-muted)]">
        Đường chạm đáy là lúc hết nợ. Khoảng cách giữa hai đường chính là cái giá của việc
        chọn sai thứ tự trả.
      </p>
    </div>
  );
}
