# Đường Về Nhà — Prototype 1

**Thiết kế mới ngày 17/10/2026:** mỗi loại xe có tốc độ trung vị, thả W/S tự hồi về mốc; mục tiêu có cơ hội mua ô tô đầu tiên sau 3–5 phút gameplay. Chi tiết trong [GAME_DESIGN.md](docs/GAME_DESIGN.md) và [BALANCE_CONFIG.md](docs/BALANCE_CONFIG.md). Bản P1 đang chạy **chưa triển khai** auto-cruise; hướng dẫn chơi bên dưới mô tả đúng build cũ, không phải thiết kế mới.

**Bổ sung đã chốt:** thêm khách giảm cruise kể cả chưa quá tải; mức giảm/sàn tùy xe và giới hạn tình huống, không nhất thiết luôn chạm min. Tài xế không tính là khách thêm. Chưa triển khai hệ thống hành khách hoặc luật này trong P1.

Three.js + TypeScript strict + Vite. Desktop, bàn phím, khung 9:16. Placeholder geometry; không có art/SFX hoàn chỉnh.

## Chơi

`pnpm install --frozen-lockfile`, sau đó `pnpm dev`. Mở URL được in trong terminal, bấm **Bắt đầu lái**.

- W: tăng tốc; thả W giữ tốc độ hiện tại.
- S: hãm về tốc độ tối thiểu; không lùi, không dừng hẳn.
- A/D: lái ngang liên tục, không khóa lane.
- Esc: tạm dừng/tiếp tục. Mất focus sẽ pause, phải chủ động tiếp tục.
- Nút Hướng dẫn: xem lại input. Nút Chơi lại: reset quãng đường, tốc độ và vị trí.

Lượt này chưa có thắng/thua, chướng ngại, kinh tế, hành khách, xăng/HP hay điểm. Đường trống chỉ để đánh giá input và camera; không phải nhịp gameplay endless cuối cùng.

## Check

Node 24.19.0, pnpm 11.25.0. Chạy `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`.
`pnpm simulate` chạy lại các kịch bản mô phỏng. `pnpm preview --port 5173` phục vụ production build sau `pnpm build`.

Config cân bằng duy nhất: `src/config.ts`, đơn vị m/s và m. Các số là TẠM. Simulation thuần dữ liệu trong `src/simulation.ts`; render/UI không cộng distance. Thời gian stall bị giới hạn; không fast-forward gameplay khi quay lại tab. `?diagnostics=1` bật số đo 600 frame gần nhất trong thuộc tính DOM `data-performance` của canvas (không lưu/gửi analytics).

## Phát triển tiếp

Giữ P1 làm nền cho P2; không viết lại prototype rời. Mỗi feature có branch, check, manual review và review con người theo AGENTS.md. Chỉ mở rộng sau khi ghi nhận feedback P1 và xử lý lỗi chặn. Xăng, thu nhập và điểm P2 phải dựa trên **distance hợp lệ** này, không theo render/FPS/camera hoặc thời gian pause.

Mỗi lần simulation/playtest cần báo cáo kèm tự review game design và UI/UX. Thay đổi cân bằng lớn phải xin ý kiến chủ dự án. Không diễn giải simulation đường trống thành chứng minh economy cân bằng. Không tạo/tích hợp art hoặc SFX hoàn chỉnh trước gate riêng.

Các tài liệu thiết kế trong `docs/` xuất phát từ bộ tài liệu chủ dự án ngày 17/10/2026 và được cập nhật theo quyết định mới trong chat. Chúng mô tả đích thiết kế, không phải báo cáo đã triển khai. Báo cáo P1 giữ nguyên làm lịch sử cho build cũ. Nguồn đồng bộ bên ngoài không bị sửa.
