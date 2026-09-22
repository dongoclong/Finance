import { useEffect, useRef, type ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { IconButton } from './Button';

interface DialogProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

/** Escape closes, focus is trapped inside, and it returns to the trigger on close. */
export function Dialog({ open, title, onClose, children, footer, className }: DialogProps) {
  const panel = useRef<HTMLDivElement>(null);
  const restoreTo = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    restoreTo.current = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusables = () =>
      panel.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ) ?? ([] as unknown as NodeListOf<HTMLElement>);

    focusables()[0]?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;
      const items = [...focusables()];
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      restoreTo.current?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        aria-label="Đóng hộp thoại"
        onClick={onClose}
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
        style={{ animation: 'fina-fade 150ms ease-out' }}
      />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'relative z-10 flex max-h-[92dvh] w-full flex-col overflow-hidden',
          'rounded-t-2xl border border-[var(--line)] bg-[var(--bg-raised)] shadow-[var(--shadow-2)]',
          'sm:max-w-[480px] sm:rounded-2xl',
          className
        )}
        style={{ animation: 'fina-rise 220ms cubic-bezier(.2,.8,.2,1)' }}
      >
        <header className="flex items-center justify-between gap-4 border-b border-[var(--line)] px-5 py-4">
          <h2 className="text-base font-semibold text-[var(--ink-primary)]">{title}</h2>
          <IconButton icon="x" label="Đóng" onClick={onClose} />
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">{children}</div>
        {footer && (
          <footer className="flex justify-end gap-2 border-t border-[var(--line)] px-5 py-4">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
}
