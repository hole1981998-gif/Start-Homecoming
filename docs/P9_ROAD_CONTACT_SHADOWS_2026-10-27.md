# P9 — Bóng tiếp xúc cho vật thể trên đường (27/10/2026)

## Phạm vi

- Thêm bóng mềm sát mặt đường dưới xe người chơi, xe kéo, xe giao thông và các chướng ngại có khối nổi (hàng rơi, xe hỏng, tai nạn, kẹt xe, cảnh sát, dân phòng, can xăng, điểm sửa).
- Bóng đi theo vị trí và hướng của vật thể, nhưng giữ ở mặt đường khi xe nhảy. Các vật thể phẳng như nước và ổ gà dùng chính vật liệu bề mặt nên không thêm bóng nổi.
- Dùng chung một mask, geometry và material; bóng chỉ là hình trang trí, không tham gia va chạm hoặc cân bằng.

## Kiểm tra

- Tự kiểm tra trực quan trong Chromium in-app: `traffic-kind-car4`, seed 14. Xe giao thông xuất hiện ở khoảng cách 21 m khi bắt đầu, không thấy lỗi hiển thị hoặc lỗi console. Bóng xe trên nền đường tối khá nhẹ; cần người duyệt art đánh giá độ đậm trên màn hình thực tế.
- Tự kiểm tra trực quan thêm `handling-car4`, seed 14, và `passenger-crash`, seed 17: xe người chơi và hành khách vẫn hiển thị; bóng sát đường, không thấy decal che HUD.
- `pnpm lint`, `pnpm typecheck`, `pnpm build`: pass. `pnpm test --maxWorkers=2`: 64 file, 385 test pass. Build có cảnh báo kích thước chunk Three.js đã có từ trước.

## Giới hạn

- Đây là bóng tiếp xúc để vật thể không bị lơ lửng. Bóng đổ dài theo hướng nắng vẫn phụ thuộc hệ chiếu sáng hiện có.
- Mỗi vật thể nổi đang hoạt động thêm một mặt phẳng trong lượt vẽ. Chưa có benchmark GPU trên thiết bị yếu.
