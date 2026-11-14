# Tự đánh giá thử áo vest tài xế — 13/11/2026

- Base: `0814578` (`main`); nhánh `codex/driver-black-suit`.
- Cấu hình: trình duyệt trong ứng dụng, `http://127.0.0.1:5185/?seed=17`, xe máy mặc định, 1/2 chỗ.
- Kịch bản đã xem: bắt đầu ván, tiếp tục chạy và giữ A để xe nghiêng; soát trang phục và tóc từ góc camera sau và hơi lệch bên. Bản `visual-vehicles-motorcycle` được mở để xem khi có khách; bản `recovery-motorcycle` được mở để xem va chạm và xe tăng tốc lại sau khi tài xế trở về.
- Quan sát: thân áo và tay tài xế hiện màu vest đen. Sau feedback trực tiếp, tóc được làm từ bản sao một phần lưới đầu, nới ra quanh gáy và hai bên mai. Ở bản cuối, tóc gáy được thu hẹp dần và mũ nới thêm ở hai bên/phía sau. Tóc đen hiện dưới mép mũ ở góc chơi thẳng và khi xe nghiêng, không thấy tóc phủ mặt ngoài mũ. HUD và camera hoạt động trong đoạn đã xem.
- Giới hạn: góc camera sau không cho đánh giá rõ sơ mi, cà vạt và ve áo phía trước. Pha tài xế ở ngoài xe diễn ra nhanh nên chưa có ảnh thủ công rõ của trang phục lúc ngã; test model kiểm tra cùng mesh áo/mũ được dùng cho trạng thái này. Chưa đo hiệu năng khi nhiều xe hay kiểm tra toàn bộ chuỗi kết ván và khởi động lại bằng tay trong lượt này.

## Góc game designer

Dữ kiện: thay đổi chỉ nằm ở mesh/material của tài xế; không đổi mô phỏng hoặc va chạm. Tự đánh giá: trang phục đen vẫn đọc được nhờ mũ vàng và viền xe sáng, nhưng khi trời tối hơn cần xem lại silhouette ở vận tốc cao. Đề xuất kiểm tra tiếp bằng một cảnh trời tối và một góc nhìn tài xế ngã xe; chưa đổi gameplay/cân bằng.

## Góc UI/UX designer

Dữ kiện: trong đoạn thử, mũ, áo và xe không che HUD tài nguyên; thao tác bắt đầu ván hoạt động. Tự đánh giá: ở cỡ nhân vật trong game, ve áo/cà vạt khó nhận ra từ camera sau; ưu tiên màu áo và nape silhouette. Đề xuất chủ dự án xem thêm khi tài xế ở ngoài xe trước khi duyệt thẩm mỹ cuối.
