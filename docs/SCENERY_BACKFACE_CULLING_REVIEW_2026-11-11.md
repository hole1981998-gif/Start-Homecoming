# Tự review: mặt khuất nhà ven đường (11/11/2026)

## Thay đổi

Các khối hộp kín của cảnh quan tạo bằng mã, kể cả cửa sổ instanced của dãy nhà phía sau, dùng `FrontSide` để GPU bỏ qua mặt quay lưng khỏi camera. Mái dốc tạo bằng mặt phẳng mỏng và các hình tán cây giữ vật liệu hai mặt. Mặt sau, cửa và cửa sổ của nhà vẫn tồn tại vì camera có thể thấy chúng khi xe đi qua hoặc rẽ. GLB nhập sẵn không đổi. Đây là tối ưu phần tô màu mặt khuất; không giảm số tam giác của mesh hay số draw call và chưa có số FPS đo được.

## Bằng chứng và giới hạn

- Base: `main` / `origin/main` `3e3dc6e`; nhánh `codex/scenery-backface-culling` tạo trong worktree riêng. Không đổi simulation, camera, vị trí prop, vật liệu GLB hoặc luật va chạm.
- Unit `tests/art-scenery.test.ts`: hai phía đường đều giữ mặt trước, mặt sau và mái; mỗi khối kín dùng `FrontSide`; ray từ hai hướng vẫn thấy tường ngoài. Các bài kiểm tra góc rẽ sẵn có tiếp tục chạy.
- Lint `pnpm lint`: pass, exit 0. Typecheck `pnpm typecheck`: pass, exit 0. Build `pnpm build`: pass, exit 0 (cảnh báo chunk Three.js >500 kB đã có).
- Full tests `pnpm test --maxWorkers=2 --testTimeout=15000 --reporter=dot`: pass, 87 tệp / 493 ca, exit 0, 177,68 s.
- Manual: CHƯA KIỂM TRA THỦ CÔNG trong trình duyệt của phiên agent này vì Computer Use trả về helper đang bận. Cần kiểm tra seed 14: đi thẳng, Q/E rẽ trái và phải, quan sát nhà ở cả hai bên, mặt sau sau khi đi qua, bóng và frame rate trên cùng thiết bị.

## Tự review game design và UI/UX

- Dữ kiện: hình học và vị trí không đổi; test xác nhận các mặt ngoài vẫn hiện từ hai phía. Tác động tới nhịp độ, độ khó, RNG, QTE và economy: không có theo mã.
- Nhận định: đây là tối ưu bảo thủ cho cảnh thành phố, không nên xóa hẳn mặt sau chỉ theo hướng camera hiện tại vì camera xoay ở giao lộ. Cần so sánh ảnh thực của các lượt rẽ trước khi xem là không có lỗi hình ảnh. Không đề xuất đổi cân bằng.
- UI/UX: không đổi HUD, popup, input hay cảnh báo. Rủi ro ưu tiên P2 là mái hoặc mặt phẳng custom bị mất nếu áp `FrontSide` quá rộng; mã giữ riêng các vật liệu đó và test xác nhận.
