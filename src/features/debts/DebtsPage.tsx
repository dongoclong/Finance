import { useMemo, useState } from 'react';
import type { Debt } from '@/types';
import type { DebtState } from '@/lib/debt';
import { useStore } from '@/store/useStore';
import {
  comparePayoff,
  debtStates,
  monthsToWords,
  suggestedBudget,
  weightedAverageRate,
} from '@/lib/debt';
import { sum } from '@/lib/aggregate';
import { formatMoney, formatPercent } from '@/lib/money';
import { monthLabel } from '@/lib/period';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Field } from '@/components/ui/Field';
import { MoneyInput } from '@/components/ui/MoneyInput';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { EmptyState } from '@/components/ui/EmptyState';
import { Icon } from '@/components/ui/Icon';
import { StatTile } from '@/components/charts/StatTile';
import { DebtProjectionChart } from '@/components/charts/DebtProjectionChart';
import { useToast } from '@/components/ui/Toast';
import { DebtCard } from './DebtCard';
import { DebtDialog } from './DebtDialog';
import { PaymentDialog } from './PaymentDialog';

export function DebtsPage() {
  const debts = useStore((s) => s.debts);
  const debtPayments = useStore((s) => s.debtPayments);
  const debtBudget = useStore((s) => s.debtBudget);
  const strategy = useStore((s) => s.debtStrategy);
  const setDebtBudget = useStore((s) => s.setDebtBudget);
  const setDebtStrategy = useStore((s) => s.setDebtStrategy);
  const removeDebt = useStore((s) => s.removeDebt);
  const toast = useToast();

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Debt | null>(null);
  const [paying, setPaying] = useState<DebtState | null>(null);
  const [pendingDelete, setPendingDelete] = useState<DebtState | null>(null);

  const view = useMemo(() => {
    const states = debtStates(debts, debtPayments);
    const borrowed = states.filter((s) => s.debt.kind === 'borrowed');
    const lent = states.filter((s) => s.debt.kind === 'lent');
    const owed = sum(borrowed.map((s) => s.outstanding));
    const budget = debtBudget ?? suggestedBudget(states);
    const comparison = comparePayoff(states, budget);
    return {
      states,
      borrowed,
      lent,
      owed,
      receivable: sum(lent.map((s) => s.outstanding)),
      minimums: sum(borrowed.filter((s) => !s.cleared).map((s) => s.debt.minPayment)),
      interestNow: sum(borrowed.map((s) => s.monthlyInterest)),
      avgRate: weightedAverageRate(states),
      budget,
      comparison,
      plan: strategy === 'avalanche' ? comparison.avalanche : comparison.snowball,
    };
  }, [debts, debtPayments, debtBudget, strategy]);

  const { plan, comparison } = view;
  const payoffMonthOf = (debtId: string) =>
    plan.milestones.find((m) => m.debtId === debtId)?.monthIndex ?? null;

  const openNew = () => {
    setEditing(null);
    setEditorOpen(true);
  };

  if (debts.length === 0) {
    return (
      <>
        <Card>
          <EmptyState
            icon="landmark"
            title="Chưa có khoản nợ nào"
            description="Thêm từng khoản đang vay — kèm lãi suất và mức trả tối thiểu — rồi app sẽ tính ra bao giờ bạn hết nợ và mất bao nhiêu tiền lãi."
            action={
              <Button variant="primary" icon="plus" onClick={openNew}>
                Thêm khoản nợ đầu tiên
              </Button>
            }
          />
        </Card>
        <DebtDialog open={editorOpen} editing={editing} onClose={() => setEditorOpen(false)} />
      </>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* ---- the figures ---- */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Tổng đang nợ"
          value={view.owed}
          icon="landmark"
          accent="var(--series-7)"
          hero
        />
        <StatTile
          label="Trả tối thiểu mỗi tháng"
          value={view.minimums}
          icon="calendar"
          accent="var(--series-1)"
        />
        <StatTile
          label="Lãi phát sinh mỗi tháng"
          value={view.interestNow}
          icon="flame"
          accent="var(--series-2)"
        />
        <StatTile
          label="Dự kiến hết nợ"
          value={0}
          display={plan.monthsToFree === null ? '—' : monthsToWords(plan.monthsToFree)}
          icon="target"
          accent="var(--series-3)"
        />
      </div>

      {view.avgRate !== null && (
        <p className="px-1 text-[13px] text-[var(--ink-secondary)]">
          Lãi suất trung bình có trọng số{' '}
          <span className="num font-medium text-[var(--ink-primary)]">
            {view.avgRate.toFixed(1).replace('.', ',')}%/năm
          </span>{' '}
          — tính theo dư nợ, nên một khoản nhỏ lãi cao không làm lệch con số này.
        </p>
      )}

      {/* ---- the plan ---- */}
      <Card>
        <CardHeader
          title="Kế hoạch trả nợ"
          hint="Nhập số tiền bạn dành được mỗi tháng, app mô phỏng từng tháng cho tới khi hết nợ"
        />
        <CardBody className="flex flex-col gap-5 pt-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Field
              label="Mỗi tháng trả được"
              hint={
                view.minimums > 0
                  ? `Tối thiểu phải có ${formatMoney(view.minimums)} để không vỡ cam kết.`
                  : undefined
              }
            >
              {({ id, describedBy }) => (
                <MoneyInput
                  id={id}
                  value={view.budget}
                  onChange={setDebtBudget}
                  describedBy={describedBy}
                />
              )}
            </Field>

            <div className="flex flex-col gap-1.5">
              <span className="text-[13px] font-medium text-[var(--ink-secondary)]">
                Thứ tự ưu tiên
              </span>
              <SegmentedControl
                label="Chiến lược trả nợ"
                value={strategy}
                onChange={setDebtStrategy}
                segments={[
                  { value: 'avalanche', label: 'Trả lãi cao trước', icon: 'flame' },
                  { value: 'snowball', label: 'Trả món nhỏ trước', icon: 'target' },
                ]}
                className="w-full"
              />
              <p className="text-[13px] text-[var(--ink-muted)]">
                {strategy === 'avalanche'
                  ? 'Dồn tiền dư vào khoản lãi suất cao nhất — luôn rẻ nhất về tổng tiền.'
                  : 'Dồn tiền dư vào khoản nhỏ nhất — hết từng món nhanh hơn, dễ giữ động lực.'}
              </p>
            </div>
          </div>

          {/* ---- verdict ---- */}
          {plan.belowMinimums ? (
            <div
              role="alert"
              className="rounded-[10px] border border-[var(--bad)] bg-[var(--bad-wash)] px-3.5 py-3"
            >
              <p className="flex items-center gap-1.5 text-sm font-medium text-[var(--bad-ink)]">
                <Icon name="alert-triangle" size={14} />
                Chưa đủ trả mức tối thiểu
              </p>
              <p className="mt-1 text-[13px] text-[var(--ink-secondary)]">
                Các khoản vay đang yêu cầu tối thiểu{' '}
                <span className="num">{formatMoney(plan.minimumRequired)}</span>/tháng, bạn mới
                nhập <span className="num">{formatMoney(view.budget)}</span>. Còn thiếu{' '}
                <span className="num font-medium text-[var(--ink-primary)]">
                  {formatMoney(plan.minimumRequired - view.budget)}
                </span>
                .
              </p>
            </div>
          ) : plan.neverClears ? (
            <div
              role="alert"
              className="rounded-[10px] border border-[var(--bad)] bg-[var(--bad-wash)] px-3.5 py-3"
            >
              <p className="flex items-center gap-1.5 text-sm font-medium text-[var(--bad-ink)]">
                <Icon name="alert-triangle" size={14} />
                Với mức này thì không bao giờ hết nợ
              </p>
              <p className="mt-1 text-[13px] text-[var(--ink-secondary)]">
                Lãi phát sinh khoảng{' '}
                <span className="num">{formatMoney(plan.monthlyInterestNow)}</span> mỗi tháng, gần
                bằng hoặc hơn số bạn trả. Nợ sẽ không giảm — cần nâng mức trả lên trên con số đó.
              </p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-[10px] bg-[var(--bg-subtle)] px-3.5 py-3">
                <p className="text-[13px] text-[var(--ink-secondary)]">Hết nợ sau</p>
                <p className="mt-0.5 text-lg font-semibold text-[var(--ink-primary)]">
                  {monthsToWords(plan.monthsToFree ?? 0)}
                </p>
                <p className="text-[13px] text-[var(--ink-muted)]">
                  {plan.freeByMonth ? monthLabel(plan.freeByMonth) : ''}
                </p>
              </div>
              <div className="rounded-[10px] bg-[var(--bg-subtle)] px-3.5 py-3">
                <p className="text-[13px] text-[var(--ink-secondary)]">Tổng tiền lãi phải trả</p>
                <p className="num mt-0.5 text-lg font-semibold text-[var(--ink-primary)]">
                  {formatMoney(plan.totalInterest)}
                </p>
                <p className="text-[13px] text-[var(--ink-muted)]">
                  {formatPercent(plan.totalInterest, view.owed)} trên số đang nợ
                </p>
              </div>
              <div className="rounded-[10px] bg-[var(--bg-subtle)] px-3.5 py-3">
                <p className="text-[13px] text-[var(--ink-secondary)]">Tổng phải chi ra</p>
                <p className="num mt-0.5 text-lg font-semibold text-[var(--ink-primary)]">
                  {formatMoney(plan.totalPaid)}
                </p>
                <p className="text-[13px] text-[var(--ink-muted)]">gốc + lãi</p>
              </div>
            </div>
          )}

          {/* ---- strategy comparison: the actual decision ---- */}
          {!plan.belowMinimums && !plan.neverClears && comparison.interestSaved > 0 && (
            <div className="rounded-[10px] border border-[var(--line)] px-3.5 py-3">
              <p className="flex items-center gap-1.5 text-sm font-medium text-[var(--ink-primary)]">
                <Icon name="sparkles" size={14} />
                Trả lãi cao trước tiết kiệm hơn {formatMoney(comparison.interestSaved)}
              </p>
              <p className="mt-1 text-[13px] text-[var(--ink-secondary)]">
                Cùng mức {formatMoney(view.budget)}/tháng: trả lãi cao trước mất{' '}
                <span className="num">{formatMoney(comparison.avalanche.totalInterest)}</span> tiền
                lãi, trả món nhỏ trước mất{' '}
                <span className="num">{formatMoney(comparison.snowball.totalInterest)}</span>
                {comparison.monthsSaved > 0 && <> và lâu hơn {comparison.monthsSaved} tháng</>}. Đổi
                lại, cách thứ hai cho bạn cảm giác hết từng món sớm hơn — nếu điều đó giúp bạn kiên
                trì thì nó đáng giá.
              </p>
            </div>
          )}

          {plan.months.length > 1 && (
            <DebtProjectionChart
              avalanche={comparison.avalanche}
              snowball={comparison.snowball}
            />
          )}

          {plan.milestones.length > 0 && (
            <div>
              <h3 className="text-[13px] font-semibold text-[var(--ink-secondary)]">
                Thứ tự tất toán
              </h3>
              <ol className="mt-2 flex flex-col gap-1.5">
                {plan.milestones.map((m, i) => (
                  <li key={m.debtId} className="flex items-center gap-2.5 text-[13px]">
                    <span className="num flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--bg-subtle)] text-[11px] font-semibold text-[var(--ink-secondary)]">
                      {i + 1}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[var(--ink-primary)]">
                      {m.name}
                    </span>
                    <span className="shrink-0 text-[var(--ink-muted)]">
                      {monthLabel(m.key)} · sau {monthsToWords(m.monthIndex)}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </CardBody>
      </Card>

      {/* ---- the debts ---- */}
      <div className="flex items-center justify-between gap-3 px-1">
        <h2 className="text-[15px] font-semibold text-[var(--ink-primary)]">
          Đang vay{' '}
          <span className="num font-normal text-[var(--ink-muted)]">
            ({view.borrowed.length})
          </span>
        </h2>
        <Button size="sm" variant="primary" icon="plus" onClick={openNew}>
          Thêm khoản nợ
        </Button>
      </div>

      {view.borrowed.length === 0 ? (
        <Card>
          <EmptyState
            icon="check"
            title="Bạn không nợ ai cả"
            description="Không có khoản vay nào đang theo dõi. Đây là một vị trí tài chính tốt."
          />
        </Card>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {view.borrowed.map((state) => (
            <DebtCard
              key={state.debt.id}
              state={state}
              payoffIn={payoffMonthOf(state.debt.id)}
              onPay={setPaying}
              onEdit={(s) => {
                setEditing(s.debt);
                setEditorOpen(true);
              }}
              onDelete={setPendingDelete}
            />
          ))}
        </ul>
      )}

      {view.lent.length > 0 && (
        <>
          <div className="flex items-baseline justify-between gap-3 px-1 pt-2">
            <h2 className="text-[15px] font-semibold text-[var(--ink-primary)]">
              Cho vay{' '}
              <span className="num font-normal text-[var(--ink-muted)]">({view.lent.length})</span>
            </h2>
            <span className="num text-[13px] text-[var(--ink-secondary)]">
              còn phải thu {formatMoney(view.receivable)}
            </span>
          </div>
          <ul className="grid gap-4 md:grid-cols-2">
            {view.lent.map((state) => (
              <DebtCard
                key={state.debt.id}
                state={state}
                onPay={setPaying}
                onEdit={(s) => {
                  setEditing(s.debt);
                  setEditorOpen(true);
                }}
                onDelete={setPendingDelete}
              />
            ))}
          </ul>
        </>
      )}

      <DebtDialog open={editorOpen} editing={editing} onClose={() => setEditorOpen(false)} />
      <PaymentDialog state={paying} onClose={() => setPaying(null)} />

      <Dialog
        open={pendingDelete !== null}
        title="Xoá khoản nợ?"
        onClose={() => setPendingDelete(null)}
        footer={
          <>
            <Button onClick={() => setPendingDelete(null)}>Giữ lại</Button>
            <Button
              variant="danger"
              icon="trash-2"
              onClick={() => {
                if (pendingDelete) removeDebt(pendingDelete.debt.id);
                setPendingDelete(null);
                toast('Đã xoá khoản nợ', 'good');
              }}
            >
              Xoá khoản nợ
            </Button>
          </>
        }
      >
        <p className="text-sm text-[var(--ink-secondary)]">
          <span className="font-medium text-[var(--ink-primary)]">{pendingDelete?.debt.name}</span>{' '}
          và {pendingDelete?.paymentCount ?? 0} lần trả đã ghi sẽ bị xoá. Các giao dịch thu chi đã
          tạo từ những lần trả đó <strong>vẫn được giữ lại</strong>, vì đó là tiền thật đã ra khỏi
          tài khoản.
        </p>
      </Dialog>
    </div>
  );
}
