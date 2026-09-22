import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Icon } from './Icon';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: string;
  children?: ReactNode;
}

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-[var(--accent)] text-[var(--accent-on)] hover:bg-[var(--accent-hover)] border-transparent',
  secondary:
    'bg-[var(--bg-surface)] text-[var(--ink-primary)] border-[var(--line)] hover:bg-[var(--bg-subtle)]',
  ghost:
    'bg-transparent text-[var(--ink-secondary)] border-transparent hover:bg-[var(--bg-subtle)] hover:text-[var(--ink-primary)]',
  danger: 'bg-[var(--bad)] text-white border-transparent hover:opacity-90',
};

const SIZES: Record<Size, string> = {
  // 40px min hit target even at `sm` — padding grows, the visual does not
  sm: 'h-9 px-3 text-[13px] gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
};

export function Button({
  variant = 'secondary',
  size = 'md',
  icon,
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type="button"
      {...rest}
      className={cn(
        'inline-flex items-center justify-center rounded-[10px] border font-medium',
        'transition-colors duration-[120ms] ease-out',
        'disabled:opacity-45 disabled:pointer-events-none',
        VARIANTS[variant],
        SIZES[size],
        className
      )}
    >
      {icon && <Icon name={icon} size={size === 'sm' ? 15 : 16} />}
      {children}
    </button>
  );
}

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: string;
  label: string;
  variant?: Variant;
}

/** Icon-only affordance. `label` is required — it becomes the accessible name. */
export function IconButton({ icon, label, variant = 'ghost', className, ...rest }: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      {...rest}
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center rounded-[10px] border',
        'transition-colors duration-[120ms] ease-out disabled:opacity-45',
        VARIANTS[variant],
        className
      )}
    >
      <Icon name={icon} size={16} />
    </button>
  );
}
