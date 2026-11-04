# P9 — hướng đi của khách ven đường (tự review, 26/10/2026)

## Thay đổi

Khách đang đi vòng quanh điểm chờ nay quay mặt theo tiếp tuyến quỹ đạo hiện có. Góc được lấy từ `passengerMotion` và active time của simulation, nên tạm dừng/chơi lại không chạy tiếp clip. Khách đứng yên, vẫy tay, văng/ngã vẫn giữ hướng cũ. Không đổi đường đi, tốc độ, pickup, collider hoặc RNG.

## Kiểm tra

- `pnpm lint`: pass (exit 0).
- `pnpm typecheck`: pass (exit 0).
- `pnpm test --maxWorkers=2`: 60 file, 364/364 test pass (exit 0). Test mới so hướng mặt với tiếp tuyến tính từ hai vị trí simulation sát nhau và kiểm mẫu đứng yên.
- `pnpm build`: pass (exit 0); warning chunk Three.js trên 500 kB đã có.
- IAB trên Windows, `p8-encounter-c3-refinement-1&seed=17`: bắt đầu, đóng thẻ khách đầu tiên, nhìn thấy khách ở lề khi còn 13 m, tạm dừng tại 92 m và chơi lại về 0 m/xăng ban đầu. Ảnh tĩnh ở camera 9:16 chưa chứng minh rõ chất lượng nhịp quay/đặt chân; cần xem chuyển động trực tiếp trên thiết bị đích. Chưa kiểm một lượt thất bại ở fixture này vì thay đổi chỉ là visual hướng đi.

## Game design và UI/UX — tự đánh giá

Dữ kiện: simulation không đổi; vị trí và điều kiện đón khách giữ nguyên, thẻ hướng dẫn không chồng lên gameplay khi đã đóng. Nhận định: quay mặt theo hướng đi giúp hành vi bớt trượt ngang, nhưng ở khoảng cách xa nhân vật rất nhỏ. ĐỀ XUẤT: kiểm trực tiếp ở nhiều seed và khoảng gần, chỉ tinh nhịp chân/tốc độ pose nếu thấy chân trượt; không đổi vận tốc gameplay vì lý do art.

Giới hạn: đây là tự review của Codex từ test và IAB, chưa có art director độc lập, duyệt của chủ dự án hay đo hiệu năng thiết bị đích.
