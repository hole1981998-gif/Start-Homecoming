# Tự đánh giá làm mượt model theo góc 35° — 12/11/2026

- Base: `origin/main` tại `844d651`, branch `codex/model-smooth-35`. Bản thử tại `http://127.0.0.1:5174/?scenario=visual-vehicles-car4&seed=17` và `?scenario=visual-vehicles-bus&seed=17`.
- Thay đổi: Three.js tính normal theo góc 35° một lần khi tạo xe, người hoặc nạp GLB tài xế/nhà/thuyền; tắt flat shading trên những material tương ứng. Góc gấp lớn hơn 35° vẫn có cạnh cứng. `ver.noforce` bỏ qua bước này để giữ hình backup.
- Kiểm tra tự động trên bản cuối: `pnpm lint`, `pnpm typecheck`, `pnpm build` exit 0; Vitest 88 files/502 tests exit 0. Test riêng xác nhận mặt nghiêng 20° mượt, góc 70° giữ cạnh, xe người chơi/traffic được xử lý và backup không đổi. Build còn cảnh báo bundle Three.js >500 kB.
- Thử tay bằng in-app browser: mở bản ô tô 4 chỗ rồi xe buýt với seed 17; bấm bắt đầu, HUD và camera chạy, model xe và cảnh hiện, không có lỗi console. Quan sát cạnh thân lớn vẫn rõ, các đoạn cong mềm hơn. Chưa có so ảnh cùng frame trước/sau và chưa đo frame time riêng cho việc spawn nhiều xe.
- Game designer (tự nhận định): đây là thay đổi ánh sáng bề mặt, không đổi collider/physics hay độ khó. Silhouette low-poly còn đọc được ở xe lớn, nhưng cần chủ dự án xem trực tiếp liệu mức mềm có hợp art direction hay không.
- UI/UX (tự nhận định): mặt cong bớt gãy giúp nhận xe gần hơn; cạnh chính vẫn giữ tương phản. Rủi ro cần kiểm chứng tiếp là ánh sáng trên xe nhỏ và hiệu năng khi traffic dày. Chưa gọi đây là đánh giá art direction cuối hay review độc lập.
