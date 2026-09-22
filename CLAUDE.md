# Cuộc sống của Long — quản lý tài chính cá nhân

Ứng dụng web chạy hoàn toàn ở máy người dùng (không backend, không tài khoản).
Dữ liệu nằm trong `localStorage`, xuất/nhập bằng JSON.

## Stack

React 18 · TypeScript · Vite 6 · Tailwind CSS v4 · Zustand (persist) · Recharts · date-fns · lucide-react

## Lệnh

| Lệnh | Việc |
|---|---|
| `npm run dev` | dev server (http://localhost:5173) |
| `npm run build` | typecheck + build production |
| `npm run typecheck` | chỉ kiểm tra type |
| `npm run format` | Prettier |

## Quy ước bắt buộc

Đọc skill trước khi code — chúng là nguồn sự thật, file này chỉ là bản tóm tắt:

- `.claude/skills/frontend-craft/` — token, kiến trúc component, a11y, motion, hiệu năng.
- `.claude/skills/finance-domain/` — tiền, kỳ hạn, danh mục, ngân sách, insight.
- `.claude/skills/ship-ui/` — checklist trước khi báo "xong".
- skill `dataviz` (có sẵn) — bắt buộc cho mọi biểu đồ / KPI tile.

Ba luật dễ vi phạm nhất:

1. **Tiền là số nguyên đồng.** Không float, không lưu số âm cho chi tiêu.
2. **`transfer` không bao giờ tính vào thu hoặc chi.**
3. **Không hex thô trong component.** Chỉ dùng token trong `src/styles/tokens.css`.

## Cấu trúc

```
src/
  components/ui/      primitive dùng lại (không import store, không import domain)
  components/charts/  wrapper biểu đồ (props vào, SVG ra)
  features/           từng màn hình: dashboard, transactions, budgets, goals, insights
  lib/                hàm thuần: money, period, aggregate, insights, seed, storage
  store/              zustand slice + persist
  styles/             tokens.css, globals.css
  types.ts            type domain dùng chung
```

Chiều import một chiều: `features → components → lib`. `lib/` không import React.
