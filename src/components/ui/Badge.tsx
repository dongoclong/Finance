import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Icon } from './Icon';

type Tone = 'neutral' | 'good' | 'warn' | 'bad' | 'accent';

const TONES: Record<Tone, string> = {
  neutral: 'bg-[var(--bg-subtle)] text-[var(--ink-secondary)]',
  good: 'bg-[var(--good-wash)] text-[var(--good-ink)]',
  warn: 'bg-[var(--warn-wash)] text-[var(--warn-ink)]',
  bad: 'bg-[var(--bad-wash)] text-[var(--bad-ink)]',
  accent: 'bg-[var(--accent-wash)] text-[var(--accent)]',
};

interface BadgeProps {
  children: ReactNode;
  tone?: Tone;
  /** status never travels on color alone — pair it with an icon */
  icon?: string;
  className?: string;
}

export function Badge({ children, tone = 'neutral', icon, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
        TONES[tone],
        className
      )}
    >
      {icon && <Icon name={icon} size={12} />}
      {children}
    </span>
  );
}
