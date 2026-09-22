import type { Account, Transaction } from '@/types';
import { categoryColorVar, getCategory } from '@/lib/categories';
import { formatMoney } from '@/lib/money';
import { Icon } from '@/components/ui/Icon';
import { IconButton } from '@/components/ui/Button';

interface TransactionRowProps {
  tx: Transaction;
  accounts: Account[];
  onEdit?: (tx: Transaction) => void;
  onDelete?: (tx: Transaction) => void;
}

export function TransactionRow({ tx, accounts, onEdit, onDelete }: TransactionRowProps) {
  const isTransfer = tx.type === 'transfer';
  const category = getCategory(tx.categoryId);
  const from = accounts.find((a) => a.id === tx.accountId)?.name ?? '—';
  const to = accounts.find((a) => a.id === tx.toAccountId)?.name;

  const icon = isTransfer ? 'arrow-right-left' : category.icon;
  const color = isTransfer ? 'var(--series-other)' : categoryColorVar(tx.categoryId);
  const title = tx.note || (isTransfer ? 'Chuyển khoản' : category.label);

  const content = (
    <>
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]"
        style={{ background: 'var(--bg-subtle)', color }}
      >
        <Icon name={icon} size={16} />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-[var(--ink-primary)]">{title}</span>
        <span className="block truncate text-[13px] text-[var(--ink-muted)]">
          {isTransfer ? `${from} → ${to ?? '—'}` : `${category.label} · ${from}`}
        </span>
      </span>

      <span
        className="num shrink-0 text-sm font-semibold"
        style={{
          color:
            tx.type === 'income'
              ? 'var(--good-ink)'
              : isTransfer
                ? 'var(--ink-secondary)'
                : 'var(--ink-primary)',
        }}
      >
        {tx.type === 'income' ? '+' : isTransfer ? '' : '−'}
        {formatMoney(tx.amount)}
      </span>
    </>
  );

  return (
    <li className="group flex items-center gap-1 rounded-xl px-2 transition-colors duration-[120ms] hover:bg-[var(--bg-subtle)]">
      {onEdit ? (
        // The whole row opens the editor — on touch there is no hover-revealed button
        // to aim at, so the row itself has to be the affordance.
        <button
          type="button"
          onClick={() => onEdit(tx)}
          aria-label={`Sửa: ${title}, ${formatMoney(tx.amount)}`}
          className="flex min-w-0 flex-1 items-center gap-3 py-2.5 text-left"
        >
          {content}
        </button>
      ) : (
        <span className="flex min-w-0 flex-1 items-center gap-3 py-2.5">{content}</span>
      )}

      {onDelete && (
        <span className="row-actions hidden shrink-0 sm:flex">
          <IconButton icon="trash-2" label={`Xoá: ${title}`} onClick={() => onDelete(tx)} />
        </span>
      )}
    </li>
  );
}
