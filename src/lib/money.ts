import type { Money } from '@/types';

const vn = new Intl.NumberFormat('vi-VN');

/** `1250000` → `1.250.000 đ`. Full precision — use this in tables and tooltips. */
export function formatMoney(value: Money, withUnit = true): string {
  const sign = value < 0 ? '-' : '';
  const body = vn.format(Math.abs(Math.round(value)));
  return `${sign}${body}${withUnit ? ' đ' : ''}`;
}

/**
 * Compact form for stat tiles and chart axes: `1,25 tr` · `250 ng` · `1,4 tỷ`.
 * Never use it where a number must be reconciled — tables keep full precision.
 */
export function formatCompact(value: Money, withUnit = true): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  const unit = withUnit ? ' đ' : '';

  const scale = (n: number, suffix: string) => {
    const scaled = abs / n;
    // one decimal below 10, none above — `9,4 tr` reads better than `9 tr`
    const text = scaled < 10 ? scaled.toFixed(1).replace('.', ',').replace(',0', '') : Math.round(scaled).toString();
    return `${sign}${text} ${suffix}`;
  };

  if (abs >= 1_000_000_000) return scale(1_000_000_000, 'tỷ');
  if (abs >= 1_000_000) return scale(1_000_000, 'tr');
  if (abs >= 10_000) return `${sign}${Math.round(abs / 1000)} ng`;
  return `${sign}${vn.format(Math.round(abs))}${unit}`;
}

/** Signed money for deltas: `+1.200.000 đ`. */
export function formatSigned(value: Money): string {
  return `${value > 0 ? '+' : ''}${formatMoney(value)}`;
}

/**
 * Parses what a person actually types: `1.250.000`, `1250000đ`, `250k`, `1,5tr`.
 * Returns an integer number of đồng, or `null` when nothing usable was typed.
 */
export function parseMoney(input: string): Money | null {
  const raw = input.trim().toLowerCase().replace(/\s|đ|vnd/g, '');
  if (!raw) return null;

  const m = raw.match(/^([\d.,]+)(k|ng|tr|m|ty|tỷ|b)?$/);
  if (!m) return null;

  const [, digits, suffix] = m;
  // vi-VN groups with `.` and decimals with `,`
  const normalized = digits.replace(/\./g, '').replace(',', '.');
  const n = Number(normalized);
  if (!Number.isFinite(n)) return null;

  const factor =
    suffix === 'k' || suffix === 'ng'
      ? 1_000
      : suffix === 'tr' || suffix === 'm'
        ? 1_000_000
        : suffix === 'ty' || suffix === 'tỷ' || suffix === 'b'
          ? 1_000_000_000
          : 1;

  return Math.round(n * factor);
}

/**
 * A ratio rendered as a percent. Zero denominators render `—`, never NaN or 0%.
 * Rounding happens once, here, at the display boundary.
 */
export function formatPercent(numerator: number, denominator: number, digits = 0): string {
  if (!denominator) return '—';
  return `${((numerator / denominator) * 100).toFixed(digits).replace('.', ',')}%`;
}

/** Percent change, or null when there is no baseline to compare against. */
export function percentChange(current: number, previous: number): number | null {
  if (!previous) return null;
  return ((current - previous) / Math.abs(previous)) * 100;
}
