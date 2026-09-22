import type { Insight, InsightTone } from '@/lib/insights';
import { Icon } from '@/components/ui/Icon';

const TONE_ACCENT: Record<InsightTone, string> = {
  good: 'var(--good-ink)',
  warn: 'var(--warn-ink)',
  bad: 'var(--bad-ink)',
  info: 'var(--ink-secondary)',
};

const TONE_WASH: Record<InsightTone, string> = {
  good: 'var(--good-wash)',
  warn: 'var(--warn-wash)',
  bad: 'var(--bad-wash)',
  info: 'var(--bg-subtle)',
};

/**
 * Each item names a number and what it is compared against, so the user can check it
 * by hand. Tone never travels alone — every row carries an icon and a worded title.
 */
export function InsightList({ insights }: { insights: Insight[] }) {
  return (
    <ul className="flex flex-col gap-2.5">
      {insights.map((insight) => (
        <li key={insight.id} className="flex gap-3">
          <span
            className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
            style={{ background: TONE_WASH[insight.tone], color: TONE_ACCENT[insight.tone] }}
          >
            <Icon name={insight.icon} size={14} />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-[var(--ink-primary)]">{insight.title}</p>
            <p className="mt-0.5 text-[13px] leading-relaxed text-[var(--ink-secondary)]">
              {insight.detail}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
