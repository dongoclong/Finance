import type { MonthKey } from '@/types';
import { currentMonthKey, monthLabel, shiftMonth } from '@/lib/period';
import { IconButton } from './Button';

interface MonthPickerProps {
  value: MonthKey;
  onChange: (month: MonthKey) => void;
}

export function MonthPicker({ value, onChange }: MonthPickerProps) {
  const now = currentMonthKey();
  const atLatest = value >= now;

  return (
    <div className="flex items-center gap-1 rounded-[10px] border border-[var(--line)] bg-[var(--bg-surface)] p-0.5">
      <IconButton
        icon="chevron-left"
        label="Tháng trước"
        onClick={() => onChange(shiftMonth(value, -1))}
        className="h-8 w-8 border-transparent"
      />
      <span className="min-w-[116px] select-none text-center text-[13px] font-medium text-[var(--ink-primary)]">
        {monthLabel(value)}
      </span>
      <IconButton
        icon="chevron-right"
        label="Tháng sau"
        disabled={atLatest}
        onClick={() => onChange(shiftMonth(value, 1))}
        className="h-8 w-8 border-transparent"
      />
    </div>
  );
}
