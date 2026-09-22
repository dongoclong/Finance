import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';

const POINTS = [
  {
    icon: 'layout-dashboard',
    title: 'Dashboard trả lời câu hỏi, không chỉ vẽ biểu đồ',
    detail: 'Số dư, tốc độ chi tiêu, dự kiến cuối tháng — mỗi con số đều kèm mốc so sánh.',
  },
  {
    icon: 'target',
    title: 'Ngân sách cảnh báo theo tốc độ',
    detail: 'Chi 60% hạn mức vào ngày 5 là vấn đề, dù thanh tiến độ trông vẫn yên ả.',
  },
  {
    icon: 'repeat',
    title: 'Tự phát hiện khoản định kỳ',
    detail: 'Nhận ra thuê nhà, Netflix, Internet qua nhịp lặp và tính ra tổng chi phí mỗi năm.',
  },
  {
    icon: 'wallet',
    title: 'Dữ liệu nằm trên máy bạn',
    detail: 'Không tài khoản, không máy chủ. Xuất ra JSON bất cứ lúc nào.',
  },
];

export function Welcome() {
  const loadSeed = useStore((s) => s.loadSeed);
  const setOnboarded = useStore((s) => s.setOnboarded);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[var(--bg-plane)] px-4 py-12">
      <div className="w-full max-w-[560px]">
        <div className="mb-7 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--accent)] text-[var(--accent-on)]">
            <Icon name="wallet" size={22} />
          </span>
          <div>
            <h1 className="text-2xl font-semibold text-[var(--ink-primary)]">Cuộc sống của Long</h1>
            <p className="text-sm text-[var(--ink-secondary)]">
              Quản lý tài chính cá nhân, chạy hoàn toàn trên máy bạn
            </p>
          </div>
        </div>

        <ul className="flex flex-col gap-4 rounded-2xl border border-[var(--line)] bg-[var(--bg-surface)] p-5">
          {POINTS.map((p) => (
            <li key={p.title} className="flex gap-3">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-[var(--accent-wash)] text-[var(--accent)]">
                <Icon name={p.icon} size={16} />
              </span>
              <div>
                <p className="text-sm font-medium text-[var(--ink-primary)]">{p.title}</p>
                <p className="mt-0.5 text-[13px] leading-relaxed text-[var(--ink-secondary)]">
                  {p.detail}
                </p>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <Button variant="primary" icon="sparkles" className="flex-1" onClick={loadSeed}>
            Xem thử với dữ liệu mẫu
          </Button>
          <Button icon="plus" className="flex-1" onClick={() => setOnboarded(true)}>
            Bắt đầu từ con số 0
          </Button>
        </div>

        <p className="mt-3 text-center text-[13px] text-[var(--ink-muted)]">
          Dữ liệu mẫu có thể xoá bất cứ lúc nào trong phần Cài đặt.
        </p>
      </div>
    </div>
  );
}
