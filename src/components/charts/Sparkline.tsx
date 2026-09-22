import { useId } from 'react';

interface SparklineProps {
  values: number[];
  accent?: string;
  width?: number;
  height?: number;
  className?: string;
}

/**
 * A 12-point trend in the de-emphasis hue with the current period marked. Pure SVG —
 * a charting library for 12 points is 60KB of overhead.
 */
export function Sparkline({
  values,
  accent = 'var(--series-1)',
  width = 72,
  height = 28,
  className,
}: SparklineProps) {
  const clipId = useId();
  if (values.length < 2) return null;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const step = width / (values.length - 1);

  const points = values.map((v, i) => {
    const x = i * step;
    const y = height - 3 - ((v - min) / span) * (height - 6);
    return [x, y] as const;
  });

  const d = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const last = points[points.length - 1];

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      aria-hidden="true"
      role="presentation"
    >
      <clipPath id={clipId}>
        <rect x="0" y="0" width={width} height={height} />
      </clipPath>
      <g clipPath={`url(#${clipId})`}>
        <path d={d} fill="none" stroke={accent} strokeWidth={2} strokeOpacity={0.35} strokeLinecap="round" strokeLinejoin="round" />
        {/* the surface ring keeps the end-dot legible where it crosses the line */}
        <circle cx={last[0]} cy={last[1]} r={4} fill={accent} stroke="var(--bg-surface)" strokeWidth={2} />
      </g>
    </svg>
  );
}
