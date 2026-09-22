import type { Category } from '@/types';

/**
 * Fixed taxonomy. Ids are persisted and must never change; labels are display-only.
 * `slot` binds a category to a chart series slot BY ID, so filtering one out never
 * repaints the others. Slot 6 (green) is reserved for income; `other` renders in the
 * neutral fold-to-other color.
 */
export const CATEGORIES: Category[] = [
  { id: 'food', label: 'Ăn uống', kind: 'expense', icon: 'utensils', slot: 1 },
  { id: 'transport', label: 'Di chuyển', kind: 'expense', icon: 'bus', slot: 2 },
  { id: 'housing', label: 'Nhà ở', kind: 'expense', icon: 'home', slot: 3 },
  { id: 'utilities', label: 'Hoá đơn', kind: 'expense', icon: 'zap', slot: 4 },
  { id: 'shopping', label: 'Mua sắm', kind: 'expense', icon: 'shopping-bag', slot: 5 },
  { id: 'health', label: 'Sức khoẻ', kind: 'expense', icon: 'heart-pulse', slot: 8 },
  { id: 'debt', label: 'Trả nợ', kind: 'expense', icon: 'landmark', slot: 7 },
  { id: 'education', label: 'Học tập', kind: 'expense', icon: 'graduation-cap', slot: null },
  { id: 'entertainment', label: 'Giải trí', kind: 'expense', icon: 'clapperboard', slot: 6 },
  { id: 'other', label: 'Khác', kind: 'expense', icon: 'circle-dashed', slot: null },

  { id: 'salary', label: 'Lương', kind: 'income', icon: 'wallet', slot: 6 },
  { id: 'bonus', label: 'Thưởng', kind: 'income', icon: 'gift', slot: 3 },
  { id: 'investment', label: 'Đầu tư', kind: 'income', icon: 'trending-up', slot: 1 },
  { id: 'freelance', label: 'Làm thêm', kind: 'income', icon: 'laptop', slot: 4 },
  { id: 'debt_collect', label: 'Thu nợ', kind: 'income', icon: 'landmark', slot: 2 },
  { id: 'other_income', label: 'Thu khác', kind: 'income', icon: 'circle-dashed', slot: null },
];

const BY_ID = new Map(CATEGORIES.map((c) => [c.id, c]));

export const expenseCategories = CATEGORIES.filter((c) => c.kind === 'expense');
export const incomeCategories = CATEGORIES.filter((c) => c.kind === 'income');

export function getCategory(id: string): Category {
  return (
    BY_ID.get(id) ?? { id, label: 'Không rõ', kind: 'expense', icon: 'circle-dashed', slot: null }
  );
}

export const categoryLabel = (id: string): string => getCategory(id).label;

/** The CSS variable for a category's series color — identity, bound to the id. */
export function categoryColorVar(id: string): string {
  const slot = getCategory(id).slot;
  return slot ? `var(--series-${slot})` : 'var(--series-other)';
}

export const ACCOUNT_KIND_LABEL: Record<string, string> = {
  cash: 'Tiền mặt',
  bank: 'Ngân hàng',
  ewallet: 'Ví điện tử',
  credit: 'Thẻ tín dụng',
};

export const ACCOUNT_KIND_ICON: Record<string, string> = {
  cash: 'banknote',
  bank: 'landmark',
  ewallet: 'smartphone',
  credit: 'credit-card',
};
