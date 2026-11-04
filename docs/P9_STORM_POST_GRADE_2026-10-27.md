# P9 — chỉnh màu hậu kỳ cảnh game (tự review, 27/10/2026)

## Thay đổi

Thêm pass split-tone cho riêng cảnh 3D sau khi render: bóng chuyển về xanh teal, vùng sáng giữ trung tính để không ngả vàng; màu tăng nhẹ nhưng không nâng bóng thành cyan sáng. OutputPass áp ACES/sRGB một lần ở cuối. HUD và cảnh báo HTML giữ màu gốc. Cùng pass dùng trong bản chơi và `art-preview/scene.html`; bóng mây tĩnh ở preview dùng màu/độ đậm chung với bóng đường. Không đổi material, nguồn sáng, vật lý hay balance.

Đợt grade đầu làm mặt đường gần đen nên đã giảm phép nhân tương phản và thêm ambient xanh rất nhẹ ở vùng bóng trước khi giữ bản hiện tại.

## Kiểm tra thủ công

- ChatGPT in-app browser `?scenario=junction&seed=14&diagnostics`, khoảng 707 m: đường trong bóng còn sắc teal, vạch và xe máy vẫn đọc được, nhà bên phải không quá vàng; HUD vẫn rõ.
- `?scenario=passenger-crash&seed=17&diagnostics`, khoảng 2 m: trên nền đường không bị mây che, xe cản, ổ nước và bốn người trên xe vẫn tách hình được.
- `art-preview/scene.html`, vùng phố: đường tối dần về phía gần camera, phần chân trời giữ sương cyan. Thống kê draw calls được cộng qua cả chuỗi pass thay vì chỉ báo 1 call của output pass.
- Không có console error/warning trên tab junction khi kiểm tra. Chưa so trực tiếp trên thiết bị GPU yếu hoặc đo P95 nhiều phút.

## Gate tự động

- `pnpm lint`: pass, exit 0. `pnpm typecheck`: pass, exit 0.
- `pnpm test --maxWorkers=2`: pass 63 file, 379/379 test, exit 0.
- `pnpm build`: pass, exit 0; Vite cảnh báo bundle Three.js >500 kB.

## Tự review art direction

Sáng/tối và mood gần sketch hơn ở các bóng teal và trời cyan, nhưng bản chấm từ vài góc nhìn chưa đủ cơ sở tuyên bố toàn visual >7/10. Cần chủ dự án xem trực tiếp các vùng phố/biển/rừng và hiệu chỉnh cường độ grade theo feedback.
