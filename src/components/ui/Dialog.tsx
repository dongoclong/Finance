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

const FOCUSABLE =
  'button, [href], input:not([type="hidden"]), select, textarea, [tabindex]:not([tabindex="-1"])';

/** Escape closes, focus is trapped inside, and it returns to the trigger on close. */
export function Dialog({ open, title, onClose, children, footer, className }: DialogProps) {
  const panel = useRef<HTMLDivElement>(null);
  const restoreTo = useRef<HTMLElement | null>(null);

  /**
   * Callers pass an inline arrow for `onClose`, so its identity changes on every
   * parent render. Holding it in a ref keeps it OUT of the effect's dependencies —
   * with it in there, every keystroke in a form field re-ran the whole setup and
   * yanked focus out of the field the user was typing in.
   */
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;
    restoreTo.current = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusables = () => [...(panel.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])];

    // Opening focus goes to the first control the user is meant to fill in — never
    // the close button, which only happens to be first in the DOM. If something in
    // the panel already has focus (an `autoFocus` field), leave it alone.
    if (!panel.current?.contains(document.activeElement)) {
      const body = panel.current?.querySelector<HTMLElement>('[data-dialog-body]');
      const footerEl = panel.current?.querySelector<HTMLElement>('[data-dialog-footer]');
      const first =
        body?.querySelector<HTMLElement>(FOCUSABLE) ??
        // No fields at all (a confirmation dialog): the cancel button is the safe
        // default, never the destructive one.
        footerEl?.querySelector<HTMLElement>(FOCUSABLE) ??
        focusables()[0];
      first?.focus();
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab') return;
      const items = focusables();
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
    // `onClose` is deliberately absent — see onCloseRef above.
  }, [open]);

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
        <div data-dialog-body className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          {children}
        </div>
        {footer && (
          <footer
            data-dialog-footer
            className="flex justify-end gap-2 border-t border-[var(--line)] px-5 py-4"
          >
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
}
