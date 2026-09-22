import { useState, type ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { useStore } from '@/store/useStore';
import { Icon } from '@/components/ui/Icon';
import { Button, IconButton } from '@/components/ui/Button';
import { MonthPicker } from '@/components/ui/MonthPicker';
import { TransactionDialog } from '@/features/transactions/TransactionDialog';

export type View = 'dashboard' | 'transactions' | 'budgets' | 'goals' | 'settings';

const NAV: { view: View; label: string; icon: string }[] = [
  { view: 'dashboard', label: 'Tổng quan', icon: 'layout-dashboard' },
  { view: 'transactions', label: 'Giao dịch', icon: 'list' },
  { view: 'budgets', label: 'Ngân sách', icon: 'target' },
  { view: 'goals', label: 'Mục tiêu', icon: 'piggy-bank' },
  { view: 'settings', label: 'Cài đặt', icon: 'settings' },
];

const THEME_NEXT = { light: 'dark', dark: 'system', system: 'light' } as const;
const THEME_ICON = { light: 'sun', dark: 'moon', system: 'sparkles' } as const;
const THEME_LABEL = { light: 'Giao diện sáng', dark: 'Giao diện tối', system: 'Theo hệ thống' } as const;

interface AppShellProps {
  view: View;
  onViewChange: (view: View) => void;
  children: ReactNode;
}

export function AppShell({ view, onViewChange, children }: AppShellProps) {
  const month = useStore((s) => s.month);
  const setMonth = useStore((s) => s.setMonth);
  const theme = useStore((s) => s.theme);
  const setTheme = useStore((s) => s.setTheme);
  const [adding, setAdding] = useState(false);

  const active = NAV.find((n) => n.view === view);

  return (
    <div className="min-h-dvh bg-[var(--bg-plane)]">
      {/* ---- desktop rail ---- */}
      <nav
        aria-label="Điều hướng chính"
        className="fixed inset-y-0 left-0 z-30 hidden w-[232px] flex-col border-r border-[var(--line)] bg-[var(--bg-surface)] px-3 py-5 lg:flex"
      >
        <div className="mb-6 flex items-center gap-2.5 px-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[var(--accent)] text-[var(--accent-on)]">
            <Icon name="wallet" size={17} />
          </span>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-[var(--ink-primary)]">Cuộc sống của Long</p>
            <p className="text-xs text-[var(--ink-muted)]">Quản lý tài chính</p>
          </div>
        </div>

        <ul className="flex flex-col gap-0.5">
          {NAV.map((item) => (
            <li key={item.view}>
              <button
                type="button"
                aria-current={view === item.view ? 'page' : undefined}
                onClick={() => onViewChange(item.view)}
                className={cn(
                  'flex h-10 w-full items-center gap-2.5 rounded-[10px] px-3 text-sm font-medium',
                  'transition-colors duration-[120ms] ease-out',
                  view === item.view
                    ? 'bg-[var(--accent-wash)] text-[var(--accent)]'
                    : 'text-[var(--ink-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--ink-primary)]'
                )}
              >
                <Icon name={item.icon} size={17} />
                {item.label}
              </button>
            </li>
          ))}
        </ul>

        <div className="mt-auto px-1">
          <Button
            variant="primary"
            icon="plus"
            className="w-full"
            onClick={() => setAdding(true)}
          >
            Thêm giao dịch
          </Button>
        </div>
      </nav>

      {/* ---- content ---- */}
      <div className="lg:pl-[232px]">
        <header className="sticky top-0 z-20 border-b border-[var(--line)] bg-[color-mix(in_oklab,var(--bg-plane)_88%,transparent)] backdrop-blur-md">
          <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <div className="flex min-w-0 items-center gap-2">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-[var(--accent)] text-[var(--accent-on)] lg:hidden">
                <Icon name="wallet" size={16} />
              </span>
              <h1 className="truncate text-lg font-semibold text-[var(--ink-primary)]">
                {active?.label ?? 'Cuộc sống của Long'}
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden sm:block">
                <MonthPicker value={month} onChange={setMonth} />
              </div>
              <IconButton
                icon={THEME_ICON[theme]}
                label={`${THEME_LABEL[theme]} — bấm để đổi`}
                onClick={() => setTheme(THEME_NEXT[theme])}
                variant="secondary"
              />
              <IconButton
                icon="plus"
                label="Thêm giao dịch"
                variant="primary"
                onClick={() => setAdding(true)}
                className="lg:hidden"
              />
            </div>
          </div>
          <div className="px-4 pb-3 sm:hidden">
            <MonthPicker value={month} onChange={setMonth} />
          </div>
        </header>

        <main className="mx-auto max-w-[1180px] px-4 pb-28 pt-5 sm:px-6 lg:pb-12">{children}</main>
      </div>

      {/* ---- mobile bar ---- */}
      <nav
        aria-label="Điều hướng chính"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--line)] bg-[var(--bg-surface)] pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        <ul className="mx-auto flex max-w-[560px]">
          {NAV.map((item) => (
            <li key={item.view} className="flex-1">
              <button
                type="button"
                aria-current={view === item.view ? 'page' : undefined}
                onClick={() => onViewChange(item.view)}
                className={cn(
                  'flex h-14 w-full flex-col items-center justify-center gap-0.5 text-[11px] font-medium',
                  'transition-colors duration-[120ms]',
                  view === item.view ? 'text-[var(--accent)]' : 'text-[var(--ink-muted)]'
                )}
              >
                <Icon name={item.icon} size={19} />
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <TransactionDialog open={adding} onClose={() => setAdding(false)} />
    </div>
  );
}
