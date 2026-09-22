import { useMemo, useState } from 'react';
import type { View } from '@/features/AppShell';
import { useStore } from '@/store/useStore';
import {
  budgetProgress,
  dailySpend,
  monthTotals,
  monthlyTrend,
  spendByCategory,
  totalBalance,
} from '@/lib/aggregate';
import { buildInsights } from '@/lib/insights';
import { elapsedDaysIn, monthLabel, shiftMonth } from '@/lib/period';
import { formatMoney, formatPercent, percentChange } from '@/lib/money';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatTile } from '@/components/charts/StatTile';
import { CashflowChart } from '@/components/charts/CashflowChart';
import { CategoryBars } from '@/components/charts/CategoryBars';
import { DailySpendChart } from '@/components/charts/DailySpendChart';
import { InsightList } from '@/features/insights/InsightList';
import { BudgetRow } from '@/features/budgets/BudgetRow';
import { TransactionRow } from '@/features/transactions/TransactionRow';
import { TransactionDialog } from '@/features/transactions/TransactionDialog';

interface DashboardPageProps {
  onOpenCategory: (categoryId: string) => void;
  onGoTo: (view: View) => void;
}

export function DashboardPage({ onOpenCategory, onGoTo }: DashboardPageProps) {
  const transactions = useStore((s) => s.transactions);
  const accounts = useStore((s) => s.accounts);
  const budgets = useStore((s) => s.budgets);
  const month = useStore((s) => s.month);
  const [adding, setAdding] = useState(false);

  // Everything the screen shows is derived here, once, and handed to the charts
  // pre-aggregated — no component aggregates inside its own render.
  const view = useMemo(() => {
    const prevMonth = shiftMonth(month, -1);
    const totals = monthTotals(transactions, month);
    const prev = monthTotals(transactions, prevMonth);
    const trend = monthlyTrend(transactions, month, 6);
    const elapsed = Math.max(1, elapsedDaysIn(month));

    return {
      balance: totalBalance(accounts, transactions),
      totals,
      prev,
      trend,
      elapsed,
      avgPerDay: Math.round(totals.expense / elapsed),
      slices: spendByCategory(transactions, month),
      daily: dailySpend(transactions, month),
      insights: buildInsights(transactions, month),
      budgets: budgetProgress(budgets, transactions, month),
      recent: [...transactions]
        .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt)
        .slice(0, 6),
    };
  }, [transactions, accounts, budgets, month]);

  const { totals, prev, trend } = view;
  const overBudget = view.budgets.filter((b) => b.state === 'over').length;

  return (
    <div className="flex flex-col gap-4">
      {/* ---- the figures ---- */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Tổng số dư"
          value={view.balance}
          icon="wallet"
          accent="var(--accent)"
          hero
          trend={trend.map((t) => t.net)}
          delta={null}
        />
        <StatTile
          label={`Thu nhập ${monthLabel(month).toLowerCase()}`}
          value={totals.income}
          icon="arrow-down-right"
          accent="var(--series-1)"
          delta={percentChange(totals.income, prev.income)}
          upIsGood
          trend={trend.map((t) => t.income)}
        />
        <StatTile
          label="Chi tiêu tháng này"
          value={totals.expense}
          icon="arrow-up-right"
          accent="var(--series-2)"
          delta={percentChange(totals.expense, prev.expense)}
          upIsGood={false}
          trend={trend.map((t) => t.expense)}
        />
        <StatTile
          label="Tỷ lệ tiết kiệm"
          value={totals.net}
          display={totals.savingsRate === null ? '—' : formatPercent(totals.savingsRate, 1)}
          icon="piggy-bank"
          accent="var(--series-3)"
          delta={
            totals.savingsRate !== null && prev.savingsRate !== null
              ? (totals.savingsRate - prev.savingsRate) * 100
              : null
          }
          upIsGood
        />
      </div>

      {/* ---- flow + insights ---- */}
      <div className="grid gap-4 lg:grid-cols-12">
        <Card className="lg:col-span-7">
          <CardHeader
            title="Dòng tiền 6 tháng"
            hint="Thu và chi theo từng tháng, cùng một đơn vị đồng"
          />
          <CardBody className="pt-4">
            <CashflowChart data={trend} />
          </CardBody>
        </Card>

        <Card className="lg:col-span-5">
          <CardHeader
            title="Nhận định tự động"
            hint="Mỗi nhận định đều kèm con số để bạn tự kiểm chứng"
          />
          <CardBody className="pt-4">
            <InsightList insights={view.insights} />
          </CardBody>
        </Card>
      </div>

      {/* ---- where the money went ---- */}
      <div className="grid gap-4 lg:grid-cols-12">
        <Card className="lg:col-span-5">
          <CardHeader
            title="Chi theo danh mục"
            hint={`Tổng ${formatMoney(totals.expense)}`}
            action={
              <Button size="sm" variant="ghost" onClick={() => onGoTo('transactions')}>
                Xem tất cả
              </Button>
            }
          />
          <CardBody className="pt-4">
            {view.slices.length === 0 ? (
              <EmptyState
                icon="pie-chart"
                title="Chưa có khoản chi nào"
                description="Thêm một giao dịch chi tiêu để thấy tiền của bạn đang đi về đâu."
                action={
                  <Button variant="primary" icon="plus" onClick={() => setAdding(true)}>
                    Thêm giao dịch
                  </Button>
                }
              />
            ) : (
              <CategoryBars slices={view.slices} onSelect={onOpenCategory} />
            )}
          </CardBody>
        </Card>

        <Card className="lg:col-span-7">
          <CardHeader
            title="Chi tiêu theo ngày"
            hint={`Trung bình ${formatMoney(view.avgPerDay)}/ngày qua ${view.elapsed} ngày`}
          />
          <CardBody className="pt-4">
            <DailySpendChart
              data={view.daily}
              average={view.avgPerDay}
              elapsedDays={view.elapsed}
            />
          </CardBody>
        </Card>
      </div>

      {/* ---- budgets + recent ---- */}
      <div className="grid gap-4 lg:grid-cols-12">
        <Card className="lg:col-span-7">
          <CardHeader
            title="Ngân sách tháng này"
            hint={
              view.budgets.length === 0
                ? 'Chưa đặt hạn mức nào'
                : overBudget > 0
                  ? `${overBudget} danh mục đã vượt hạn mức`
                  : 'Chưa danh mục nào vượt hạn mức'
            }
            action={
              <Button size="sm" variant="ghost" onClick={() => onGoTo('budgets')}>
                Quản lý
              </Button>
            }
          />
          <CardBody className="pt-4">
            {view.budgets.length === 0 ? (
              <EmptyState
                icon="target"
                title="Đặt hạn mức để biết khi nào nên dừng"
                description="Ngân sách biến một con số trừu tượng thành một ranh giới rõ ràng cho từng danh mục."
                action={
                  <Button variant="primary" icon="plus" onClick={() => onGoTo('budgets')}>
                    Đặt ngân sách
                  </Button>
                }
              />
            ) : (
              <ul className="flex flex-col gap-4">
                {view.budgets.slice(0, 5).map((b) => (
                  <BudgetRow key={b.budget.id} progress={b} />
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card className="lg:col-span-5">
          <CardHeader
            title="Giao dịch gần đây"
            action={
              <Button size="sm" variant="ghost" onClick={() => onGoTo('transactions')}>
                Xem tất cả
              </Button>
            }
          />
          <CardBody className="pt-2">
            {view.recent.length === 0 ? (
              <EmptyState
                icon="list"
                title="Chưa có giao dịch"
                description="Mọi thứ bắt đầu từ giao dịch đầu tiên."
                action={
                  <Button variant="primary" icon="plus" onClick={() => setAdding(true)}>
                    Thêm giao dịch
                  </Button>
                }
              />
            ) : (
              <ul className="flex flex-col">
                {view.recent.map((tx) => (
                  <TransactionRow key={tx.id} tx={tx} accounts={accounts} />
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>

      <TransactionDialog open={adding} onClose={() => setAdding(false)} />
    </div>
  );
}
