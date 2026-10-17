# Thử HUD tài nguyên dạng cung — 17/10/2026

Branch `feature/arc-resource-hud`, dựa trên HUD P2 ở `8703299`. Theo ảnh chủ dự án gửi, xăng là cung trái và độ bền là cung phải quanh nửa sau xe. Icon và số L/HP nằm ở đáy; vùng nguy cấp đổi sang màu ấm hơn. Thanh progress thật vẫn có nhãn cho công cụ hỗ trợ, nhưng được ẩn về mặt thị giác. Chỉ sửa trình bày: không đổi simulation, economy, hazard hoặc thời gian popup.

Ảnh chủ dự án: [cung tài nguyên](references/resource-arcs.png), [popup và số tổn thất](references/impact-popup.png). Ảnh thứ hai đã được ghi làm yêu cầu bố cục tương lai trong [design](DESIGN_UPDATE_IMMERSION_TRAFFIC.md); lần này chưa đổi card giải thích lần đầu hoặc popup tổn thất.

## Kiểm tra

- Windows, Node/pnpm trong workspace. `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`: đều exit 0 trên code cuối; 28/28 test pass.
- UI test kiểm tra độ dài cung xăng khớp giá trị xăng thực khi chạy, cung HP vẫn đầy khi không va chạm, và cung xăng trở về đầy sau restart. Mô phỏng nhiều seed/chiến thuật vẫn chạy trong suite hiện tại; không thấy thay đổi cơ chế từ bản HUD.
- Preview production tại `127.0.0.1:5173/` trả HTTP 200; HTML chứa cung và hai asset CSS/JS trả 200. Build cảnh báo chunk JS >500 kB đã có từ bản trước; build vẫn pass.
- **CHƯA KIỂM TRA THỦ CÔNG TRONG TRÌNH DUYỆT** ở revision này: công cụ điều khiển trình duyệt từ chối trang localhost theo chính sách URL. Không suy diễn khả năng đọc ở biên, kích thước nhỏ hoặc khi va chạm chỉ từ build/test. Chủ dự án cần thử trực tiếp bản preview; ảnh thực tế sau khi chơi sẽ quyết định vị trí/cỡ cung.

## Tự review

Game design: cung không đổi xăng/HP nên không đổi nhịp và kinh tế theo logic đã test. Rủi ro khi UI che lane cạnh xe cần đánh giá bằng lái thực ở hai biên. Không đề xuất đổi thông số cân bằng từ thay đổi này.

UI/UX: cấu trúc gần ảnh tham chiếu, có hai hình dạng đối xứng và nhãn số nên không chỉ dựa vào màu. Vị trí dùng neo đuôi xe hiện có và kích thước cố định 200×170 px; với xe lớn và cửa sổ quá hẹp cần kiểm lại tỷ lệ. Popup dạng sticker ở vùng trên và số tổn thất gần xe cần được kiểm tra cùng warning/QTE khi triển khai sau; tránh chồng cue hoặc che hướng né.

Không có remote cấu hình, nên chưa push, tạo PR hoặc chạy CI. Chưa có review con người và chưa merge.
