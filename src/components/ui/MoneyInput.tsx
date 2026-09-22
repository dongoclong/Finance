import { useState, type ChangeEvent } from 'react';
import { cn } from '@/lib/cn';
import { formatMoney, parseMoney } from '@/lib/money';

interface MoneyInputProps {
  id?: string;
  value: number | null;
  onChange: (value: number | null) => void;
  describedBy?: string;
  invalid?: boolean;
  autoFocus?: boolean;
  placeholder?: string;
}

/**
 * Accepts what people actually type — `250k`, `1,5tr`, `1.250.000` — and echoes the
 * parsed amount back underneath so there is never any doubt about what was entered.
 */
export function MoneyInput({
  id,
  value,
  onChange,
  describedBy,
  invalid,
  autoFocus,
  placeholder = 'VD: 250k, 1,5tr, 1.250.000',
}: MoneyInputProps) {
  const [text, setText] = useState(value ? String(value) : '');

  const handle = (e: ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value;
    setText(next);
    onChange(parseMoney(next));
  };

  return (
    <div>
      <div className="relative">
        <input
          id={id}
          inputMode="decimal"
          autoFocus={autoFocus}
          value={text}
          onChange={handle}
          placeholder={placeholder}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          className={cn(
            'num h-10 w-full rounded-[10px] border bg-[var(--bg-surface)] pl-3 pr-9 text-sm',
            'text-[var(--ink-primary)] placeholder:text-[var(--ink-muted)]',
            'transition-colors duration-[120ms] hover:border-[var(--line-strong)]',
            invalid ? 'border-[var(--bad)]' : 'border-[var(--line)]'
          )}
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[13px] text-[var(--ink-muted)]">
          đ
        </span>
      </div>
      {value !== null && value > 0 && (
        <p className="num mt-1 text-[13px] text-[var(--ink-muted)]">= {formatMoney(value)}</p>
      )}
    </div>
  );
}
