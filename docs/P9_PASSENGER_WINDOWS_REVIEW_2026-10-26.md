# P9 — Khách ở cửa sổ xe 3D, lượt kiểm 26/10/2026

## Phạm vi và bằng chứng

- Nền: `67dafca` của `art/essential-asset-pack`, kế thừa baseline cân bằng P8 trên `main` tại `f289612`.
- Sửa visual placeholder của khách trên xe người chơi dạng kín. Không sửa `Run`, số khách, capacity, collider, camera, RNG, input, tiền hoặc tài nguyên.
- Trước sửa, fixture `?scenario=visual-vehicles-bus&seed=17` hiện HUD 25/25 nhưng không thấy khách: mesh khách nằm dưới `closedFrame`, khung này bị ẩn khi bật xe art. [Ảnh trước](evidence/p9-passenger-windows/01-before-bus.png).
- Sau sửa, dãy đầu/thân trên khách hiện hai bên cửa sổ buýt, sát thân hơn sau lượt chỉnh kích thước; mái và làn phía trước còn đọc được. [Ảnh sau](evidence/p9-passenger-windows/02-after-bus.png). Đây là placeholder, chưa phải model NPC cuối.

## Kiểm tra thực tế trong Edge headless

Viewport 540 × 960, WebGL SwiftShader, seed 17, Vite DEV. Đây là thao tác browser thật bằng Playwright, không phải người chơi đánh giá cảm giác lái.

| Kịch bản | Quan sát |
|---|---|
| `handling-car4` | Bấm bắt đầu, xe đi từ 8 lên 25 m, tốc độ/HUD đổi; giữ/thả D, mở pause, bấm restart; không có page error. |
| `visual-vehicles-car4`, `car7`, `bus`, `truck` | HUD lần lượt 4/4, 7/7, 25/25, 3/3; ảnh ở camera 9:16 thấy đầu khách tại mép cửa sổ, không thấy tài xế giả đứng ngoài. Không có page error. |
| `visual-vehicles-car4` + G | HUD từ 4/4 xuống 3/4 sau input; renderer nhận roster mới. Pause mở đúng; sau bấm restart và chờ frame cập nhật, HUD trở về 4/4 và 0 m của fixture. |
| `visual-vehicles-container` | HUD 2/2; đặt lại khách ở cửa sổ cabin trước. Từ camera sau, rơ-moóc che cabin nên ảnh tĩnh không chứng minh khách nhìn thấy. |
| `p8-water`, `stress`, `force-tail-container` | Các trang khởi chạy và render không có page error. Thẻ khám phá có lúc tạm dừng, nên ảnh của chúng không chứng minh va chạm hoặc nhịp chơi. |
| `p7-secret` không dùng nitro/nhảy | Ô tô 4/4 đụng tàu ở 12 m, màn kết ván ghi “Va chạm tàu hoả”; bấm nút bắt đầu/chơi lại trong modal, xe fixture bắt đầu lại ở 1 m, 4/4. Không có page error. |

**Chưa kiểm tra thủ công đầy đủ:** đổi xe Tab giữa hai xe có khách; va chạm rồi khách văng/quay lại; cảnh báo/QTE khi buýt đông khách; FPS/P95 trên GPU/thiết bị mục tiêu. Fixture `passenger-crash-car` bị thẻ khám phá chặn trong lượt quan sát ngắn nên không được tính là đã kiểm tai nạn khách. CUA/Product Design audit không chạy được do launcher `CreateProcessSecurityEnvironment failed (0x80070020)`; dùng ảnh Edge đã xem trực tiếp và checklist UX thủ công.

## Tự review

**Game designer — dữ kiện:** không có luật gameplay hoặc số cân bằng nào đổi. **Nhận định:** khách hiện rõ giúp kiểm roster khi chở đông nhưng dãy đầu buýt ở góc sau khó đếm từng người. ĐỀ XUẤT kiểm tiếp cùng seed 17 ở tốc độ cruise và khi G/Tab/crash; nếu silhouette che hazard thì giảm độ nhô của placeholder trước khi thay đổi cue hay difficulty. Chưa có lý do chỉnh cân bằng.

**UI/UX designer — ưu tiên P2:** HUD 25/25 vẫn là cách xác nhận số chính xác; hình đầu khách chỉ là cue phụ và trong ảnh sau không che resource arcs hay hành lang lái. Kiểm trên camera cua, QTE và viewport nhỏ trước khi chốt kích thước. Ảnh không chứng minh timing, điều khiển, tiếp cận hoặc độ rõ khi xe/hazard chuyển động nhanh.

**Art direction:** đây là sửa placeholder để khớp roster, không gọi asset NPC đã duyệt hoặc art gate P9 hoàn tất. Các tiêu chí tám phần trong `GAME_DESIGN.md` vẫn cần đánh giá cảnh gameplay đại diện và số đo hiệu năng; không nâng điểm tự đánh giá cũ từ hai ảnh buýt.

## Gate tự động

Windows, Node 24.14.0, pnpm 11.25.0; dependency cài bằng `pnpm install --frozen-lockfile` (exit 0).

| Gate | Lệnh | Kết quả trên mã cuối |
|---|---|---|
| Lint | `pnpm lint` | exit 0 |
| Typecheck | `pnpm typecheck` | exit 0 |
| Tests | `pnpm test` | exit 0, 58 file / 350 test pass |
| Production build | `pnpm build` | exit 0; Vite còn cảnh báo chunk Three.js >500 kB, không phải lỗi build |

Một lượt `pnpm test` chạy đồng thời lint/typecheck/build có 1/350 test `discovery.test.ts` timeout ở ngưỡng 5 giây (exit 1). Test này chạy riêng pass ở 3,1 giây (exit 0), rồi toàn suite chạy lại không kèm gate khác và pass 350/350. Không tăng timeout, bỏ test hay đổi rule để che kết quả fail đầu.
