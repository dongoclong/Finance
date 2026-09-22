import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Icon } from './Icon';

type ToastTone = 'info' | 'good' | 'bad';
interface ToastItem {
  id: number;
  tone: ToastTone;
  message: string;
}

const ToastContext = createContext<(message: string, tone?: ToastTone) => void>(() => {});

/** Every mutation shows a result — silent success reads as a broken button. */
export function useToast() {
  return useContext(ToastContext);
}

const TONE_STYLE: Record<ToastTone, string> = {
  info: 'border-[var(--line)] text-[var(--ink-primary)]',
  good: 'border-[var(--good)] text-[var(--good-ink)]',
  bad: 'border-[var(--bad)] text-[var(--bad-ink)]',
};

const TONE_ICON: Record<ToastTone, string> = { info: 'info', good: 'check', bad: 'alert-triangle' };

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const push = useCallback((message: string, tone: ToastTone = 'info') => {
    const id = Date.now() + Math.random();
    setItems((prev) => [...prev, { id, tone, message }]);
    window.setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), 3200);
  }, []);

  const value = useMemo(() => push, [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-4 bottom-4 z-[60] flex flex-col items-center gap-2 sm:inset-x-auto sm:right-6"
      >
        {items.map((t) => (
          <div
            key={t.id}
            className={cn(
              'pointer-events-auto flex items-center gap-2 rounded-[10px] border bg-[var(--bg-raised)]',
              'px-3.5 py-2.5 text-sm shadow-[var(--shadow-2)]',
              TONE_STYLE[t.tone]
            )}
            style={{ animation: 'fina-rise 150ms cubic-bezier(.2,.8,.2,1)' }}
          >
            <Icon name={TONE_ICON[t.tone]} size={15} />
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
