import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className }: CardProps) {
  return (
    <section
      className={cn(
        'rounded-2xl border border-[var(--line)] bg-[var(--bg-surface)]',
        className
      )}
    >
      {children}
    </section>
  );
}

interface CardHeaderProps {
  title: string;
  hint?: string;
  action?: ReactNode;
  className?: string;
}

export function CardHeader({ title, hint, action, className }: CardHeaderProps) {
  return (
    <header className={cn('flex items-start justify-between gap-4 px-5 pt-5', className)}>
      <div className="min-w-0">
        <h2 className="text-[15px] font-semibold text-[var(--ink-primary)]">{title}</h2>
        {hint && <p className="mt-0.5 text-[13px] text-[var(--ink-muted)]">{hint}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}

export function CardBody({ children, className }: CardProps) {
  return <div className={cn('p-5', className)}>{children}</div>;
}
