import { useMemo, useRef, useState } from 'react';
import type { Account, AccountKind, Theme } from '@/types';
import { useStore } from '@/store/useStore';
import { accountBalances, sum } from '@/lib/aggregate';
import { ACCOUNT_KIND_ICON, ACCOUNT_KIND_LABEL, categoryLabel } from '@/lib/categories';
import { detectRecurring } from '@/lib/insights';
import { formatMoney } from '@/lib/money';
import { formatDate } from '@/lib/period';
import { downloadBackup, parseImport } from '@/lib/portable';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button, IconButton } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Field, Select, TextInput } from '@/components/ui/Field';
import { MoneyInput } from '@/components/ui/MoneyInput';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import { useToast } from '@/components/ui/Toast';

const KINDS: AccountKind[] = ['cash', 'bank', 'ewallet', 'credit'];

export function SettingsPage() {
  const accounts = useStore((s) => s.accounts);
  const transactions = useStore((s) => s.transactions);
  const theme = useStore((s) => s.theme);
  const setTheme = useStore((s) => s.setTheme);
  const addAccount = useStore((s) => s.addAccount);
  const updateAccount = useStore((s) => s.updateAccount);
  const removeAccount = useStore((s) => s.removeAccount);
  const replaceAll = useStore((s) => s.replaceAll);
  const resetAll = useStore((s) => s.resetAll);
  const loadSeed = useStore((s) => s.loadSeed);
  const snapshot = useStore((s) => s.snapshot);
  const toast = useToast();

  const fileInput = useRef<HTMLInputElement>(null);
  const [accountOpen, setAccountOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [name, setName] = useState('');
  const [kind, setKind] = useState<AccountKind>('bank');
  const [opening, setOpening] = useState<number | null>(0);
  const [pendingDelete, setPendingDelete] = useState<Account | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [importReport, setImportReport] = useState<string[] | null>(null);

  const balances = useMemo(
    () => accountBalances(accounts, transactions),
    [accounts, transactions]
  );
  const recurring = useMemo(() => detectRecurring(transactions), [transactions]);
  const total = sum([...balances.values()]);

  const openNewAccount = () => {
    setEditingAccount(null);
    setName('');
    setKind('bank');
    setOpening(0);
    setAccountOpen(true);
  };

  const openEditAccount = (account: Account) => {
    setEditingAccount(account);
    setName(account.name);
    setKind(account.kind);
    setOpening(account.openingBalance);
    setAccountOpen(true);
  };

  const saveAccount = () => {
    if (!name.trim()) return;
    const payload = { name: name.trim(), kind, openingBalance: opening ?? 0 };
    if (editingAccount) {
      updateAccount(editingAccount.id, payload);
      toast('Đã cập nhật tài khoản', 'good');
    } else {
      addAccount(payload);
      toast('Đã thêm tài khoản', 'good');
    }
    setAccountOpen(false);
  };

  const handleExport = () => {
    downloadBackup(snapshot());
    toast('Đã tải tệp sao lưu', 'good');
  };

  const handleImportFile = async (file: File) => {
    const report = parseImport(await file.text());
    if (!report.data) {
      setImportReport(report.rejected);
      toast('Không nhập được dữ liệu', 'bad');
      return;
    }
    replaceAll(report.data);
    setImportReport(report.rejected.length > 0 ? report.rejected : null);
    toast(
      report.rejected.length > 0
        ? `Đã nhập ${report.accepted} giao dịch, bỏ qua ${report.rejected.length} dòng lỗi`
        : `Đã nhập ${report.accepted} giao dịch`,
      report.rejected.length > 0 ? 'info' : 'good'
    );
  };

  return (
    <div className="flex flex-col gap-4">
      {/* ---- accounts ---- */}
      <Card>
        <CardHeader
          title="Tài khoản & ví"
          hint={`Tổng số dư ${formatMoney(total)}`}
          action={
            <Button size="sm" variant="primary" icon="plus" onClick={openNewAccount}>
              Thêm tài khoản
            </Button>
          }
        />
        <CardBody className="pt-4">
          <ul className="flex flex-col gap-1">
            {accounts.map((account) => (
              <li
                key={account.id}
                className="group flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors duration-[120ms] hover:bg-[var(--bg-subtle)]"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[var(--bg-subtle)] text-[var(--ink-secondary)]">
                  <Icon name={ACCOUNT_KIND_ICON[account.kind] ?? 'wallet'} size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[var(--ink-primary)]">
                    {account.name}
                  </p>
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="truncate text-[13px] text-[var(--ink-muted)]">
                      {ACCOUNT_KIND_LABEL[account.kind]}
                    </p>
                    <span className="num shrink-0 text-sm font-semibold text-[var(--ink-primary)] sm:hidden">
                      {formatMoney(balances.get(account.id) ?? 0)}
                    </span>
                  </div>
                </div>
                <span className="num hidden shrink-0 text-sm font-semibold text-[var(--ink-primary)] sm:block">
                  {formatMoney(balances.get(account.id) ?? 0)}
                </span>
                <span className="row-actions flex shrink-0 gap-0.5">
                  <IconButton
                    icon="pencil"
                    label={`Sửa ${account.name}`}
                    onClick={() => openEditAccount(account)}
                  />
                  <IconButton
                    icon="trash-2"
                    label={`Xoá ${account.name}`}
                    disabled={accounts.length === 1}
                    onClick={() => setPendingDelete(account)}
                  />
                </span>
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>

      {/* ---- recurring ---- */}
      <Card>
        <CardHeader
          title="Khoản lặp lại hằng tháng"
          hint="Nhận diện tự động từ ghi chú, số tiền và nhịp lặp — không dựa vào danh sách từ khoá"
        />
        <CardBody className="pt-4">
          {recurring.length === 0 ? (
            <EmptyState
              icon="repeat"
              title="Chưa phát hiện khoản lặp lại nào"
              description="Cần ít nhất 3 lần chi cùng ghi chú, số tiền chênh dưới 5% và cách nhau khoảng một tháng."
            />
          ) : (
            <>
              <ul className="flex flex-col gap-1">
                {recurring.map((item) => (
                  <li
                    key={item.key}
                    className="flex items-center gap-3 rounded-xl px-2 py-2.5 hover:bg-[var(--bg-subtle)]"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[var(--bg-subtle)] text-[var(--ink-secondary)]">
                      <Icon name="repeat" size={16} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[var(--ink-primary)]">
                        {item.label}
                      </p>
                      <p className="truncate text-[13px] text-[var(--ink-muted)]">
                        {categoryLabel(item.categoryId)} · {item.occurrences} lần · gần nhất{' '}
                        {formatDate(item.lastDate)}
                      </p>
                    </div>
                    <span className="num shrink-0 text-sm font-semibold text-[var(--ink-primary)]">
                      {formatMoney(item.amount)}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 border-t border-[var(--line)] pt-3 text-[13px] text-[var(--ink-secondary)]">
                Tổng cố định{' '}
                <span className="num font-medium text-[var(--ink-primary)]">
                  {formatMoney(sum(recurring.map((r) => r.amount)))}
                </span>{' '}
                mỗi tháng, tương đương{' '}
                <span className="num">{formatMoney(sum(recurring.map((r) => r.amount)) * 12)}</span>{' '}
                một năm.
              </p>
            </>
          )}
        </CardBody>
      </Card>

      {/* ---- appearance ---- */}
      <Card>
        <CardHeader title="Giao diện" hint="Chế độ tối được chọn riêng cho nền tối, không phải đảo màu" />
        <CardBody className="pt-4">
          <SegmentedControl
            label="Chế độ giao diện"
            value={theme}
            onChange={(t: Theme) => setTheme(t)}
            segments={[
              { value: 'light', label: 'Sáng', icon: 'sun' },
              { value: 'dark', label: 'Tối', icon: 'moon' },
              { value: 'system', label: 'Theo hệ thống', icon: 'sparkles' },
            ]}
          />
        </CardBody>
      </Card>

      {/* ---- data ---- */}
      <Card>
        <CardHeader
          title="Dữ liệu của bạn"
          hint="Toàn bộ dữ liệu nằm trên máy này. Không có máy chủ, không tài khoản."
        />
        <CardBody className="flex flex-col gap-4 pt-4">
          <div className="flex flex-wrap gap-2">
            <Button icon="download" onClick={handleExport}>
              Xuất tệp sao lưu
            </Button>
            <Button icon="upload" onClick={() => fileInput.current?.click()}>
              Nhập từ tệp
            </Button>
            <Button icon="sparkles" onClick={() => { loadSeed(); toast('Đã nạp dữ liệu mẫu', 'good'); }}>
              Nạp dữ liệu mẫu
            </Button>
            <Button variant="danger" icon="trash-2" onClick={() => setResetOpen(true)}>
              Xoá toàn bộ
            </Button>
          </div>

          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            aria-label="Chọn tệp sao lưu để nhập"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleImportFile(file);
              e.target.value = '';
            }}
          />

          {importReport && importReport.length > 0 && (
            <div
              role="alert"
              className="rounded-[10px] border border-[var(--warn)] bg-[var(--warn-wash)] px-3.5 py-3"
            >
              <p className="flex items-center gap-1.5 text-[13px] font-medium text-[var(--warn-ink)]">
                <Icon name="alert-triangle" size={14} />
                {importReport.length} dòng bị bỏ qua
              </p>
              <ul className="mt-1.5 flex flex-col gap-0.5 text-[13px] text-[var(--ink-secondary)]">
                {importReport.slice(0, 6).map((r) => (
                  <li key={r}>• {r}</li>
                ))}
                {importReport.length > 6 && <li>• … và {importReport.length - 6} dòng khác</li>}
              </ul>
            </div>
          )}

          <p className="flex items-center gap-1.5 text-[13px] text-[var(--ink-muted)]">
            <Icon name="info" size={13} />
            Tệp sao lưu là JSON đầy đủ và luôn nhập lại được — đây là lối thoát dữ liệu của bạn.
          </p>
        </CardBody>
      </Card>

      {/* ---- dialogs ---- */}
      <Dialog
        open={accountOpen}
        title={editingAccount ? 'Sửa tài khoản' : 'Thêm tài khoản'}
        onClose={() => setAccountOpen(false)}
        footer={
          <>
            <Button onClick={() => setAccountOpen(false)}>Huỷ</Button>
            <Button variant="primary" onClick={saveAccount} disabled={!name.trim()}>
              Lưu
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Field label="Tên tài khoản">
            {({ id }) => (
              <TextInput
                id={id}
                autoFocus
                value={name}
                placeholder="VD: Techcombank, Ví MoMo"
                onChange={(e) => setName(e.target.value)}
              />
            )}
          </Field>
          <Field label="Loại">
            {({ id }) => (
              <Select id={id} value={kind} onChange={(e) => setKind(e.target.value as AccountKind)}>
                {KINDS.map((k) => (
                  <option key={k} value={k}>
                    {ACCOUNT_KIND_LABEL[k]}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Số dư ban đầu" hint="Số dư tại thời điểm bạn bắt đầu ghi chép.">
            {({ id, describedBy }) => (
              <MoneyInput id={id} value={opening} onChange={setOpening} describedBy={describedBy} />
            )}
          </Field>
        </div>
      </Dialog>

      <Dialog
        open={pendingDelete !== null}
        title="Xoá tài khoản?"
        onClose={() => setPendingDelete(null)}
        footer={
          <>
            <Button onClick={() => setPendingDelete(null)}>Giữ lại</Button>
            <Button
              variant="danger"
              icon="trash-2"
              onClick={() => {
                if (pendingDelete) removeAccount(pendingDelete.id);
                setPendingDelete(null);
                toast('Đã xoá tài khoản và các giao dịch liên quan', 'good');
              }}
            >
              Xoá tài khoản
            </Button>
          </>
        }
      >
        <p className="text-sm text-[var(--ink-secondary)]">
          Mọi giao dịch thuộc{' '}
          <span className="font-medium text-[var(--ink-primary)]">{pendingDelete?.name}</span> cũng
          sẽ bị xoá theo, vì một giao dịch không có tài khoản là dữ liệu mồ côi. Hãy xuất tệp sao lưu
          trước nếu bạn chưa chắc.
        </p>
        <div className="mt-3">
          <Badge tone="warn" icon="alert-triangle">
            {transactions.filter(
              (t) => t.accountId === pendingDelete?.id || t.toAccountId === pendingDelete?.id
            ).length}{' '}
            giao dịch sẽ bị xoá
          </Badge>
        </div>
      </Dialog>

      <Dialog
        open={resetOpen}
        title="Xoá toàn bộ dữ liệu?"
        onClose={() => setResetOpen(false)}
        footer={
          <>
            <Button onClick={() => setResetOpen(false)}>Huỷ</Button>
            <Button
              variant="danger"
              icon="trash-2"
              onClick={() => {
                resetAll();
                setResetOpen(false);
                toast('Đã xoá toàn bộ dữ liệu', 'good');
              }}
            >
              Xoá toàn bộ
            </Button>
          </>
        }
      >
        <p className="text-sm text-[var(--ink-secondary)]">
          Toàn bộ {transactions.length} giao dịch, ngân sách và mục tiêu sẽ bị xoá vĩnh viễn khỏi
          máy này. Thao tác này không hoàn tác được.
        </p>
        <Button icon="download" className="mt-4 w-full" onClick={handleExport}>
          Xuất tệp sao lưu trước đã
        </Button>
      </Dialog>
    </div>
  );
}
