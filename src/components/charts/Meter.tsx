import { cn } from '@/lib/cn';

interface MeterProps {
  ratio: number;
  /** the fill color carries severity; the track is a lighter step of the same ramp */
  color: string;
  /** a second, hollow marker showing where the month is projected to land */
  projectedRatio?: number;
  className?: string;
  label: string;
}

export function Meter({ ratio, color, projectedRatio, className, label }: MeterProps) {
  const pct = Math.min(Math.max(ratio, 0), 1) * 100;
  const projected =
    projectedRatio !== undefined ? Math.min(Math.max(projectedRatio, 0), 1.08) * 100 : null;

  return (
    <div
      role="meter"
      aria-label={label}
      aria-valuenow={Math.round(ratio * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn('relative h-2.5 w-full overflow-hidden rounded-full', className)}
      style={{ background: `color-mix(in oklab, ${color} 16%, var(--bg-subtle))` }}
    >
      <div
        className="h-full rounded-full transition-[width] duration-[400ms] ease-out"
        style={{ width: `${pct}%`, background: color }}
      />
      {projected !== null && projected > pct + 2 && (
        <span
          aria-hidden="true"
          title="Dự kiến cuối tháng"
          className="absolute top-0 h-full w-0.5 rounded-full"
          style={{ left: `calc(${Math.min(projected, 99)}% )`, background: 'var(--ink-primary)', opacity: 0.35 }}
        />
      )}
    </div>
  );
}
