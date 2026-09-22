import { useMemo, useState } from 'react';
import type { Goal } from '@/types';
import { useStore } from '@/store/useStore';
import { goalProgress, sum } from '@/lib/aggregate';
import { formatMoney, formatPercent } from '@/lib/money';
import { daysUntil, formatDate } from '@/lib/period';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button, IconButton } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Field, TextInput } from '@/components/ui/Field';
import { MoneyInput } from '@/components/ui/MoneyInput';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { Meter } from '@/components/charts/Meter';
import { useToast } from '@/components/ui/Toast';

interface GoalDraft {
  name: string;
  target: number | null;
  saved: number | null;
  deadline: string;
}

const blank = (): GoalDraft => ({ name: '', target: null, saved: 0, deadline: '' });

export function GoalsPage() {
  const goals = useStore((s) => s.goals);
  const addGoal = useStore((s) => s.addGoal);
  const updateGoal = useStore((s) => s.updateGoal);
  const contribute = useStore((s) => s.contributeToGoal);
  const removeGoal = useStore((s) => s.removeGoal);
  const toast = useToast();

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);
  const [draft, setDraft] = useState<GoalDraft>(blank);
  const [contributeTo, setContributeTo] = useState<Goal | null>(null);
  const [contribution, setContribution] = useState<number | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Goal | null>(null);

  const rows = useMemo(() => goals.map(goalProgress), [goals]);
  const totalSaved = sum(goals.map((g) => g.saved));
  const totalTarget = sum(goals.map((g) => g.target));

  const openNew = () => {
    setEditing(null);
    setDraft(blank());
    setEditorOpen(true);
  };

  const openEdit = (goal: Goal) => {
    setEditing(goal);
    setDraft({ name: goal.name, target: goal.target, saved: goal.saved, deadline: goal.deadline ?? '' });
    setEditorOpen(true);
  };

  const canSave = draft.name.trim().length > 0 && (draft.target ?? 0) > 0;

  const save = () => {
    if (!canSave) return;
    const payload = {
      name: draft.name.trim(),
      target: draft.target ?? 0,
      saved: draft.saved ?? 0,
      deadline: draft.deadline || undefined,
    };
    if (editing) {
      updateGoal(editing.id, payload);
      toast('Đã cập nhật mục tiêu', 'good');
    } else {
      addGoal(payload);
      toast('Đã tạo mục tiêu mới', 'good');
    }
    setEditorOpen(false);
  };

  const saveContribution = () => {
    if (!contributeTo || !contribution || contribution <= 0) return;
    contribute(contributeTo.id, contribution);
    toast(`Đã thêm ${formatMoney(contribution)} vào ${contributeTo.name}`, 'good');
    setContributeTo(null);
    setContribution(null);
  };

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader
          title="Tiến độ chung"
          hint={
            totalTarget > 0
              ? `${formatMoney(totalSaved)} trên tổng mục tiêu ${formatMoney(totalTarget)}`
              : 'Chưa có mục tiêu nào'
          }
          action={
            <Button size="sm" variant="primary" icon="plus" onClick={openNew}>
              Mục tiêu mới
            </Button>
          }
        />
        {totalTarget > 0 && (
          <CardBody className="pt-4">
            <Meter
              ratio={totalSaved / totalTarget}
              color="var(--series-3)"
              label={`Tổng tiến độ: ${formatPercent(totalSaved, totalTarget)}`}
            />
            <p className="mt-2 text-[13px] text-[var(--ink-secondary)]">
              Hoàn thành{' '}
              <span className="num font-medium text-[var(--ink-primary)]">
                {formatPercent(totalSaved, totalTarget)}
              </span>
              , còn thiếu <span className="num">{formatMoney(totalTarget - totalSaved)}</span>.
            </p>
          </CardBody>
        )}
      </Card>

      {rows.length === 0 ? (
        <Card>
          <EmptyState
            icon="piggy-bank"
            title="Chưa có mục tiêu nào"
            description="Một mục tiêu có con số và mốc thời gian sẽ biến việc tiết kiệm thành kế hoạch, thay vì hy vọng."
            action={
              <Button variant="primary" icon="plus" onClick={openNew}>
                Tạo mục tiêu đầu tiên
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {rows.map(({ goal, ratio, remaining, monthsLeft, requiredPerMonth, overdue }) => (
            <Card key={goal.id} className="group p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-[15px] font-semibold text-[var(--ink-primary)]">
                    {goal.name}
                  </h3>
                  <p className="num mt-0.5 text-[13px] text-[var(--ink-secondary)]">
                    {formatMoney(goal.saved)} / {formatMoney(goal.target)}
                  </p>
                </div>
                <span className="row-actions flex shrink-0 gap-0.5">
                  <IconButton icon="pencil" label={`Sửa ${goal.name}`} onClick={() => openEdit(goal)} />
                  <IconButton
                    icon="trash-2"
                    label={`Xoá ${goal.name}`}
                    onClick={() => setPendingDelete(goal)}
                  />
                </span>
              </div>

              <Meter
                className="mt-3"
                ratio={ratio}
                color={ratio >= 1 ? 'var(--good)' : overdue ? 'var(--bad)' : 'var(--series-3)'}
                label={`${goal.name}: ${formatPercent(goal.saved, goal.target)}`}
              />

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge tone={ratio >= 1 ? 'good' : 'neutral'} icon={ratio >= 1 ? 'check' : 'target'}>
                  {formatPercent(goal.saved, goal.target)}
                </Badge>
                {goal.deadline && (
                  <Badge tone={overdue ? 'bad' : 'neutral'} icon="calendar">
                    {overdue
                      ? `Quá hạn ${formatDate(goal.deadline)}`
                      : `Còn ${Math.max(daysUntil(goal.deadline), 0)} ngày`}
                  </Badge>
                )}
              </div>

              <p className="mt-3 text-[13px] text-[var(--ink-secondary)]">
                {ratio >= 1 ? (
                  'Đã đạt mục tiêu — chúc mừng bạn.'
                ) : requiredPerMonth && monthsLeft ? (
                  <>
                    Cần để dành{' '}
                    <span className="num font-medium text-[var(--ink-primary)]">
                      {formatMoney(requiredPerMonth)}
                    </span>{' '}
                    mỗi tháng trong {monthsLeft} tháng tới.
                  </>
                ) : (
                  <>
                    Còn thiếu <span className="num">{formatMoney(remaining)}</span>.
                  </>
                )}
              </p>

              <Button
                size="sm"
                icon="plus"
                className="mt-4 w-full"
                onClick={() => {
                  setContributeTo(goal);
                  setContribution(null);
                }}
              >
                Nạp thêm
              </Button>
            </Card>
          ))}
        </div>
      )}

      <Dialog
        open={editorOpen}
        title={editing ? 'Sửa mục tiêu' : 'Mục tiêu mới'}
        onClose={() => setEditorOpen(false)}
        footer={
          <>
            <Button onClick={() => setEditorOpen(false)}>Huỷ</Button>
            <Button variant="primary" onClick={save} disabled={!canSave}>
              {editing ? 'Lưu thay đổi' : 'Tạo mục tiêu'}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Field label="Tên mục tiêu">
            {({ id }) => (
              <TextInput
                id={id}
                autoFocus
                value={draft.name}
                placeholder="VD: Quỹ dự phòng, Du lịch Nhật Bản"
                onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
              />
            )}
          </Field>
          <Field label="Số tiền mục tiêu">
            {({ id }) => (
              <MoneyInput
                id={id}
                value={draft.target}
                onChange={(target) => setDraft((d) => ({ ...d, target }))}
              />
            )}
          </Field>
          <Field label="Đã để dành được">
            {({ id }) => (
              <MoneyInput
                id={id}
                value={draft.saved}
                onChange={(saved) => setDraft((d) => ({ ...d, saved }))}
              />
            )}
          </Field>
          <Field label="Hạn hoàn thành" hint="Không bắt buộc — có hạn thì app tính được mức cần để dành mỗi tháng.">
            {({ id, describedBy }) => (
              <TextInput
                id={id}
                type="date"
                aria-describedby={describedBy}
                value={draft.deadline}
                onChange={(e) => setDraft((d) => ({ ...d, deadline: e.target.value }))}
              />
            )}
          </Field>
        </div>
      </Dialog>

      <Dialog
        open={contributeTo !== null}
        title={`Nạp thêm vào ${contributeTo?.name ?? ''}`}
        onClose={() => setContributeTo(null)}
        footer={
          <>
            <Button onClick={() => setContributeTo(null)}>Huỷ</Button>
            <Button
              variant="primary"
              onClick={saveContribution}
              disabled={!contribution || contribution <= 0}
            >
              Nạp tiền
            </Button>
          </>
        }
      >
        <Field label="Số tiền nạp">
          {({ id }) => (
            <MoneyInput id={id} autoFocus value={contribution} onChange={setContribution} />
          )}
        </Field>
      </Dialog>

      <Dialog
        open={pendingDelete !== null}
        title="Xoá mục tiêu?"
        onClose={() => setPendingDelete(null)}
        footer={
          <>
            <Button onClick={() => setPendingDelete(null)}>Giữ lại</Button>
            <Button
              variant="danger"
              icon="trash-2"
              onClick={() => {
                if (pendingDelete) removeGoal(pendingDelete.id);
                setPendingDelete(null);
                toast('Đã xoá mục tiêu', 'good');
              }}
            >
              Xoá mục tiêu
            </Button>
          </>
        }
      >
        <p className="text-sm text-[var(--ink-secondary)]">
          <span className="font-medium text-[var(--ink-primary)]">{pendingDelete?.name}</span> sẽ bị
          xoá khỏi danh sách. Thao tác này không hoàn tác được.
        </p>
      </Dialog>
    </div>
  );
}
