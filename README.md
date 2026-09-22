# Cuộc sống của Long

Ứng dụng web quản lý tài chính cá nhân. Chạy **hoàn toàn trên máy bạn** — không backend, không tài khoản, không gửi dữ liệu đi đâu cả. Toàn bộ số liệu nằm trong `localStorage` của trình duyệt và xuất/nhập được bằng JSON.

<!-- Ảnh chụp màn hình: chạy `npm run dev`, bấm "Xem thử với dữ liệu mẫu" rồi chụp lại. -->

## Có gì

| Màn hình | Nội dung |
|---|---|
| **Tổng quan** | 4 thẻ số (số dư, thu, chi, tỷ lệ tiết kiệm) kèm % so tháng trước và sparkline 6 tháng · biểu đồ dòng tiền · nhận định tự động · chi theo danh mục · chi theo ngày · ngân sách · giao dịch gần đây |
| **Giao dịch** | Thêm/sửa/xoá, tìm kiếm, lọc theo loại và danh mục, nhóm theo ngày |
| **Ngân sách** | Hạn mức theo danh mục cho từng tháng, cảnh báo **theo tốc độ chi**, sao chép từ tháng trước |
| **Mục tiêu** | Tiến độ tiết kiệm, tính ra số tiền cần để dành mỗi tháng để kịp hạn |
| **Khoản nợ** | Theo dõi khoản đi vay lẫn cho vay, và **lập kế hoạch trả nợ**: mô phỏng từng tháng, so sánh hai chiến lược trả, đưa ra ngày hết nợ và tổng tiền lãi |
| **Cài đặt** | Tài khoản/ví, khoản định kỳ phát hiện tự động, giao diện sáng/tối, xuất–nhập–xoá dữ liệu |

Vài thứ không hiển nhiên:

- **Ngân sách cảnh báo theo tốc độ, không chỉ theo thanh tiến độ.** Chi 60% hạn mức vào ngày 5 là vấn đề, dù thanh bar trông vẫn yên ả. Vạch mờ trên thanh là mức **dự kiến cuối tháng**.
- **Nhận định đều giải thích được.** Mỗi dòng nêu một con số và mốc so sánh để bạn tự kiểm chứng bằng tay — không có hộp đen. So sánh giữa hai tháng luôn dùng **cùng số ngày đã trôi qua**, nếu không thì ngày 3 hằng tháng lúc nào cũng trông như một chiến thắng.
- **Khoản định kỳ nhận diện bằng *hình dạng*, không bằng từ khoá.** Ba lần trở lên, cùng ghi chú và danh mục, số tiền lệch dưới 5%, khoảng cách 25–35 ngày (±4). Nhờ vậy nó tìm ra tiền thuê nhà, Netflix, Internet mà không cần danh sách tên dịch vụ.
- **Kế hoạch trả nợ mô phỏng thật, không phải chia trung bình.** Mỗi tháng: cộng lãi lên dư nợ, trả tối thiểu cho mọi khoản, rồi dồn toàn bộ phần dư vào **một** khoản. So sánh hai thứ tự ưu tiên — trả lãi cao trước (rẻ nhất về tổng tiền) và trả món nhỏ trước (hết từng món nhanh hơn, dễ giữ động lực) — và nói thẳng chênh lệch là bao nhiêu tiền. Nếu số bạn trả không vượt nổi tiền lãi, nó nói luôn là "với mức này thì không bao giờ hết nợ" thay vì vẽ một biểu đồ đẹp.
- **Dư nợ = gốc ban đầu − đã trả.** Lãi không bị cộng ngược vào số dư, nên con số trên màn hình luôn tự kiểm chứng được bằng tay; chi phí lãi xuất hiện đúng chỗ nó có tác dụng, tức là trong phần kế hoạch.
- **Nhập tiền kiểu người thật:** `250k`, `1,5tr`, `1.250.000` đều hiểu, và hiện lại số đã hiểu ngay bên dưới ô nhập.
- **Nhập dữ liệu báo rõ dòng nào bị loại** thay vì âm thầm bỏ qua.

## Chạy

```bash
npm install
npm run dev      # http://localhost:5173
```

| Lệnh | Việc |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Typecheck + build production vào `dist/` |
| `npm run preview` | Xem thử bản build |
| `npm run typecheck` | Chỉ kiểm tra type |
| `npm run format` | Prettier |

Yêu cầu Node 20+.

## Build & deploy

**CI (`.github/workflows/ci.yml`)** — chạy tự động mỗi lần push: typecheck, build, báo dung lượng bundle vào phần Summary của workflow, và lưu `dist/` làm artifact tải về được. Chạy được cả khi repo để private, không cần cấu hình gì thêm.

**GitHub Pages (`.github/workflows/deploy-pages.yml`)** — đang để **chạy tay** (`workflow_dispatch`). Lý do: Pages yêu cầu repo **public** (hoặc tài khoản trả phí), nên nếu bật tự động ngay thì nó sẽ đỏ ở mọi lần push. Muốn dùng:

1. Settings → General → đổi repo sang **Public** (hoặc dùng GitHub Pro).
2. Settings → Pages → **Source: GitHub Actions**.
3. Tab Actions → *Deploy to GitHub Pages* → **Run workflow**.
4. Chạy ổn rồi thì mở file workflow, bỏ comment khối `push:` để nó tự deploy mỗi lần push.

Site sẽ ở `https://dongoclong.github.io/Finance/`. Đường dẫn asset do biến `GITHUB_PAGES` trong `vite.config.ts` xử lý — deploy lên domain gốc (Vercel, Netlify, server riêng) thì không cần đặt biến này, `base` tự về `/`.

**Không muốn dùng Actions?** `npm run build` rồi đem nguyên thư mục `dist/` đặt lên bất kỳ static host nào. Không có bước server nào cả.

## Cấu trúc

```
src/
  components/ui/      Primitive dùng lại — không import store, không biết gì về domain
  components/charts/  Wrapper biểu đồ — props vào, SVG ra, không import store
  features/           Từng màn hình; đây là nơi duy nhất được đọc store
  lib/                Hàm thuần: money, period, aggregate, insights, seed, portable
  store/              Zustand slice + persist
  styles/             tokens.css (design token), globals.css
  types.ts            Type domain dùng chung
```

Chiều import một chiều: `features → components → lib`. File trong `lib/` mà import React là đặt sai chỗ; file trong `components/ui/` mà import store cũng vậy.

## Ba luật dễ vi phạm nhất

1. **Tiền là số nguyên đồng.** Không float — `0.1 + 0.2 !== 0.3`, và lệch 1đ cộng dồn cả năm là một cái bug khó chịu. Không lưu số âm cho khoản chi: độ lớn nằm ở `amount`, chiều nằm ở `type`.
2. **`transfer` không bao giờ tính vào thu hoặc chi.** Chuyển tiền giữa hai ví của chính mình mà bị đếm vào "đã chi tháng này" là lỗi kinh điển của app tài chính. Mọi phép cộng đều lọc `type` một cách tường minh.
3. **Không hex thô trong component.** Màu lấy từ token trong `src/styles/tokens.css`. Chế độ tối là một bộ màu **được chọn riêng** cho nền tối, không phải đảo màu bản sáng.

## Công cụ đi kèm (`.claude/`)

Repo có sẵn cấu hình cho [Claude Code](https://claude.com/claude-code) để giữ chất lượng khi sửa tiếp:

- **Skills** — `frontend-craft` (design token, kiến trúc component, a11y, motion, hiệu năng), `finance-domain` (luật về tiền, kỳ hạn, ngân sách, insight), `ship-ui` (checklist trước khi coi là xong).
- **Hooks** — chặn ghi vào `node_modules`/`.env`/lockfile; chạy Prettier + lint design-system sau mỗi lần sửa file (bắt hex thô, spacing lệch scale, `<div onClick>`, `any`, key trùng index…); chạy `tsc` trước khi kết thúc mỗi lượt làm việc.

Không dùng Claude Code thì thư mục này vô hại, cứ xoá đi là xong.

## Stack

React 18 · TypeScript · Vite 6 · Tailwind CSS v4 · Zustand (persist) · Recharts · date-fns · lucide-react

Bundle production: ~196 KB JS + ~6 KB CSS (gzip).

## Dữ liệu của bạn

Không có máy chủ nào cả. Dữ liệu sống trong `localStorage` của đúng trình duyệt đó, trên đúng máy đó.

Hệ quả cần biết: **xoá dữ liệu duyệt web là mất sạch.** Cài đặt → *Xuất tệp sao lưu* tạo một file JSON đầy đủ, nhập lại được — đây là lối thoát duy nhất, nên hãy xuất định kỳ.
