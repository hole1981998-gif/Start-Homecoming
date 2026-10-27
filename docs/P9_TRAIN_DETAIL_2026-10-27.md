# P9 — thiết kế lại tàu băng đường (27/10/2026)

## Phạm vi

- Giữ nguyên ba cụm tàu hữu hạn, footprint 24 × 2,8 m, thời gian và quỹ đạo băng đường từ simulation.
- Đầu máy có cabin một cửa sổ, mảng hông động cơ màu slate, grille, biển số, kính trước hai ô, cản dưới, đèn và horn mái. Toa có mái vát, khung cửa sổ, cửa lên xuống, gờ màu, bogie và tâm bánh. LOD xa giữ các mảng thiết kế lớn, bỏ chi tiết nhỏ.
- Không thêm đèn động, khói hoặc VFX; các hiệu ứng đó thuộc gói VFX đang làm riêng.

## Kiểm chứng

- Gallery năm góc art-preview/world-gallery.html, asset Tàu, Near: đầu máy tách màu và cấu trúc khỏi hai toa; cửa, gờ và khung kính rõ ở góc ngang. Đây là tự đánh giá từ ảnh tĩnh.
- Chromium in-app, scenario p61-train-left, seed 17: tàu xuất hiện phía phải lúc khoảng 11 m di chuyển của người chơi; chạy tiếp qua 100 m không thấy lỗi render hay HUD. Không bắt được khung hình tàu ở điểm cắt gần, nên chưa xác nhận khả năng đọc mọi chi tiết khi tàu lao qua ở tốc độ thật.
- Test bounding box kiểm Near và Far theo cả hai hướng. pnpm lint, pnpm typecheck, pnpm build đều pass; pnpm test --maxWorkers=2 pass 64 file, 385 test. Build còn cảnh báo chunk Three.js trên 500 kB.

## Giới hạn

- Tàu đi ngang nhanh và xuất hiện xa; những chi tiết nhỏ chỉ nâng chất lượng khi gần. Cảnh báo gameplay vẫn dựa vào cue hiện có, không dựa vào grille hoặc biển số.
- Chưa đánh giá FPS P95 trên thiết bị đích hay va chạm terminal bằng thao tác thủ công trong lượt này; không thay logic va chạm.
