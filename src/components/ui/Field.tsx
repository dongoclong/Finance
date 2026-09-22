import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';
import { Icon } from './Icon';

const CONTROL =
  'h-10 w-full rounded-[10px] border border-[var(--line)] bg-[var(--bg-surface)] px-3 text-sm ' +
  'text-[var(--ink-primary)] placeholder:text-[var(--ink-muted)] transition-colors duration-[120ms] ' +
  'hover:border-[var(--line-strong)]';

interface FieldProps {
  label: string;
  error?: string;
  hint?: string;
  className?: string;
  children: (props: { id: string; describedBy?: string; invalid: boolean }) => ReactNode;
}

/** A real <label>, a wired-up error, and an id that never collides. */
export function Field({ label, error, hint, className, children }: FieldProps) {
  const id = useId();
  const msgId = `${id}-msg`;
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-[13px] font-medium text-[var(--ink-secondary)]">
        {label}
      </label>
      {children({ id, describedBy: error || hint ? msgId : undefined, invalid: Boolean(error) })}
      {(error || hint) && (
        <p
          id={msgId}
          role={error ? 'alert' : undefined}
          className={cn(
            'flex items-center gap-1 text-[13px]',
            error ? 'text-[var(--bad-ink)]' : 'text-[var(--ink-muted)]'
          )}
        >
          {error && <Icon name="alert-triangle" size={13} />}
          {error ?? hint}
        </p>
      )}
    </div>
  );
}

export function TextInput({
  className,
  invalid,
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  return (
    <input
      {...rest}
      aria-invalid={invalid || undefined}
      className={cn(CONTROL, invalid && 'border-[var(--bad)]', className)}
    />
  );
}

export function Select({
  className,
  children,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select {...rest} className={cn(CONTROL, 'appearance-none pr-9', className)}>
        {children}
      </select>
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ink-muted)]">
        <Icon name="chevron-down" size={16} />
      </span>
    </div>
  );
}
