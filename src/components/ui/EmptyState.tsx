import type { ReactNode } from 'react';
import { Icon } from './Icon';

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  /** every empty state gets one way forward — an empty screen with no action is a bug */
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-[var(--bg-subtle)] text-[var(--ink-muted)]">
        <Icon name={icon} size={20} />
      </span>
      <p className="text-sm font-semibold text-[var(--ink-primary)]">{title}</p>
      <p className="mt-1 max-w-[42ch] text-[13px] text-[var(--ink-secondary)]">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
