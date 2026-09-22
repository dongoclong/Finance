import { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';
import { ToastProvider } from '@/components/ui/Toast';
import { AppShell, type View } from '@/features/AppShell';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { TransactionsPage } from '@/features/transactions/TransactionsPage';
import { BudgetsPage } from '@/features/budgets/BudgetsPage';
import { GoalsPage } from '@/features/goals/GoalsPage';
import { DebtsPage } from '@/features/debts/DebtsPage';
import { SettingsPage } from '@/features/settings/SettingsPage';
import { Welcome } from '@/features/Welcome';

/** Keeps <html data-theme> in sync; `system` removes the stamp and lets the OS decide. */
function useThemeEffect() {
  const theme = useStore((s) => s.theme);
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'system') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', theme);
  }, [theme]);
}

export function App() {
  const onboarded = useStore((s) => s.onboarded);
  const [view, setView] = useState<View>('dashboard');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  useThemeEffect();

  const openCategory = (categoryId: string) => {
    setCategoryFilter(categoryId);
    setView('transactions');
  };

  return (
    <ToastProvider>
      {!onboarded ? (
        <Welcome />
      ) : (
        <AppShell view={view} onViewChange={setView}>
          {view === 'dashboard' && <DashboardPage onOpenCategory={openCategory} onGoTo={setView} />}
          {view === 'transactions' && (
            <TransactionsPage
              initialCategory={categoryFilter}
              onConsumeInitialCategory={() => setCategoryFilter(null)}
            />
          )}
          {view === 'budgets' && <BudgetsPage />}
          {view === 'goals' && <GoalsPage />}
          {view === 'debts' && <DebtsPage />}
          {view === 'settings' && <SettingsPage />}
        </AppShell>
      )}
    </ToastProvider>
  );
}
