# Cân lại thời gian mua ô tô đầu tiên — 17/10/2026

## Thay đổi và phạm vi

Yêu cầu mới của chủ dự án: 1–1,5 phút thay 3–5 phút gameplay hoạt động. Đã áp dụng trong bản thử config `p2.0-economy-2`: thu nhập 0,50 tiền/m thay 0,15; giữ tiền đầu 200, ô tô 4 chỗ 800. Giữ nguyên tốc độ, xăng/HP, thiệt hại, tiếp tế, geometry, HUD và nhịp spawn để tách tác động economy. Chưa triển khai UI P2.1 hoặc shop.

Lý thuyết cần kiếm 600 tiền qua 1.200 m nếu không mất tiền. Cruise 14 m/s ~85,7 giây, max 20 m/s ~60 giây sau khi đạt max. Thời gian thực gồm tăng/hãm; không tính pause, discovery card hoặc Help. Người chơi giữ S liên tục có thể chậm hơn mục tiêu. Chủ dự án đã yêu cầu cân lại trực tiếp; con số này là lựa chọn triển khai để thử, chưa phải phê duyệt economy cuối.

## Simulation đã chạy

`pnpm test`, Windows, Node 24.19.0, pnpm 11.25.0. 30 seed: 17, 42, 20261017, 100–126; mỗi seed có cruise/W/S, tối đa 600 giây hoặc kết ván. Bot quan sát 80 m phía trước theo cùng luật P2 trước đó, có điều khiển ngang để né và nhặt tiếp tế; không phải người chơi. Bài sampling tăng từ 3 lên 30 seed; timeout riêng 15 s cho khối lượng lớn hơn, không đổi assertion để bỏ qua lỗi.

| Chiến thuật | Đủ 800 trước kết ván | Min / median / max thời gian đủ tiền | Sống hết 600 s |
|---|---:|---|---:|
| Cruise | 30/30 | 85,72 / 85,72 / 85,72 s | 21/30 |
| Giữ W | 30/30 | 60,18 / 60,18 / 60,18 s | 30/30 |
| Giữ S | 30/30 | 149,78 / 149,78 / 149,78 s | 30/30 |

Các lượt chết được giữ trong dữ liệu; 9 lượt cruise chết vì HP sau khi đã đủ tiền. Tất cả lượt cruise/W trong mẫu đạt khoảng 60–90 s; thời gian giống nhau giữa seed do bot chưa mất tiền trước mốc này, không có nghĩa mọi lượt người chơi giống nhau. Không có vi phạm bất biến tài nguyên được test, entities tối đa dưới 20. Kết quả JSON đầy đủ: [observations.json](checks-economy-2/observations.json).

## Gates và chơi thử trình duyệt

- `pnpm lint`: exit 0.
- `pnpm typecheck`: exit 0, TypeScript strict.
- `pnpm test`: exit 0, 26/26 bài / 6 file; gồm pause/ready/end không tăng tiền, restart, hậu quả nước/va chạm, lưu kết quả và so sánh 30/60/144 FPS. Cập nhật kỳ vọng thu nhập 10 s/1 s theo số mới; không giảm kiểm tra khác.
- `pnpm build`: exit 0, JS 496,59 kB / gzip 128,52 kB, `index-CcpCXhKb.js`. Logs ở [checks-economy-2](checks-economy-2/test.txt).
- Manual thật trên in-app browser, production http://127.0.0.1:5173/, seed 17: reload bản mới, bắt đầu, giữ A 650 ms và W 6 s, Esc pause. HUD 125 m / tiền 262,9 / xăng 7,6 / HP 70. Distance hiển thị làm tròn xuống, money làm tròn 1 số; giá trị khớp 0,50/m, không phải số hiển thị 125 nhân chính xác.
- Đọc lại sau khi chạy việc độc lập: HUD không thay đổi trong pause. Chơi lại từ đầu đưa về 0 m / 200 tiền / 8 L / 70 HP. Tab để sẵn màn bắt đầu cho chủ dự án.
- [Ảnh tiền mới và pause](evidence-economy-2/01-income-paused.png). Không có manual liên tục tới phút thứ 1–1,5 trong lượt này; thời gian đủ tiền nêu trên đến từ simulation. UI không đổi, không thực hiện audit bố cục mới hoặc đo lại FPS.

## Tự review game design

Từ dữ liệu simulation và manual trên: mẫu cruise/W đạt mục tiêu mới bằng cùng luật kiếm tiền theo quãng đường; không cần bắt người chơi giữ W liên tục. Giữ S liên tục chậm hơn là tradeoff tốc độ. Chưa có shop nên đây là **đủ tiền**, chưa là **mua xe thật**; P5 cần có cơ hội ghé shop trước hoặc gần mốc 60–90 s, tính cả chi phí xăng/sửa trước đó và tiền giữ lại sau mua. Không được để đủ tiền mà không có cửa hàng quá lâu rồi gọi là đạt mục tiêu.

Tăng rate 3,33 lần cũng tăng khả năng mua xe sau/nâng cấp: bot W có khoảng 6.198 tiền sau 10 phút chưa chi tiêu; không thể gọi economy cả ván đã cân bằng. Chọn rate thay vì giảm riêng giá ô tô để giữ thứ tự giá xe hiện tại; khi có shop phải đo khoảng cách các lần nâng cấp, lợi ích chở khách, chi phí sửa và các xe lớn. Không tự thêm income cap hoặc giá tăng ngầm. Kiểm tra thêm người chơi và mẫu density mới P2.1; chỉ số bot chưa chứng minh mức vui hoặc tỷ lệ người chơi thực đạt mốc.

## Tự review UI/UX

Dựa trên HUD đang chạy: tiền cập nhật theo quãng đường, pause giữ nguyên và restart rõ ràng. Tốc độ tích tiền nhanh hơn nhưng chưa có affordance mua xe; ở P5 dùng graphic cue khả dụng tại shop và thông số mua trong UI an toàn, tránh thêm bảng text khi lái. Các yêu cầu HUD overlay/HP gần xe đã được ghi riêng, chưa triển khai trong lượt cân economy này. Không coi ảnh HUD cũ là nghiệm thu design P2.1.

## Bàn giao

Base local dfa3bd6, branch `balance/first-car-60-90-seconds`. Không có remote nên chưa fetch/push/PR/CI; chưa merge. Patch và source archive được bàn giao local. Báo cáo P1/P1.2/P2.0 và logs cũ giữ nguyên làm lịch sử; GDD/balance/roadmap/README cập nhật mục tiêu mới. Nguồn docs đồng bộ ngoài workspace không sửa. Chờ chơi thử để khóa số và sẽ cân tiếp khi có shop/khách/chi phí.
