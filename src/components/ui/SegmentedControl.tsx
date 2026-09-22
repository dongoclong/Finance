import { cn } from '@/lib/cn';
import { Icon } from './Icon';

export interface Segment<T extends string> {
  value: T;
  label: string;
  icon?: string;
}

interface SegmentedControlProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  segments: Segment<T>[];
  label: string;
  className?: string;
}

export function SegmentedControl<T extends string>({
  value,
  onChange,
  segments,
  label,
  className,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn(
        'inline-flex gap-0.5 rounded-[10px] border border-[var(--line)] bg-[var(--bg-subtle)] p-0.5',
        className
      )}
    >
      {segments.map((s) => {
        const active = s.value === value;
        return (
          <button
            key={s.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(s.value)}
            className={cn(
              'inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-[13px] font-medium',
              'transition-colors duration-[120ms] ease-out',
              active
                ? 'bg-[var(--bg-surface)] text-[var(--ink-primary)] shadow-[var(--shadow-1)]'
                : 'text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]'
            )}
          >
            {s.icon && <Icon name={s.icon} size={14} />}
            {s.label}
          </button>
        );
      })}
    </div>
  );
}
