# P9 landscape lighting — tự đánh giá prototype

Ngày 26/10/2026. Branch `codex/p9-landscape-lighting`, base `53e6bc5` từ nhánh P9 người/animation. Đây là **tự đánh giá của Codex** từ bản chạy Edge ở 1440 × 900, ảnh chụp và thao tác ghi dưới đây; không phải review của art director hay người chơi độc lập. Không thay đổi cơ chế, cân bằng hoặc RNG gameplay. Vùng màu, bóng và mật độ bóng là lựa chọn hình ảnh tạm cho prototype.

## Bằng chứng theo bước

1. Bắt đầu ván thử `handling-motorcycle`, seed 17, sau 1,6 giây: [cây hai bên](seed-17.png). Tán cây đổ bóng rõ lên bãi cỏ và một phần đường; vạch làn vẫn đọc được. Mép cỏ không còn dải xanh lam.
2. Cùng kịch bản, seed 4: [ruộng và đồi](seed-4.png). Đất ruộng xanh rêu cùng nhóm màu với bờ trồng; nước ruộng và rãnh tưới nổi trên nền; mặt đồi nhận bóng. Chân đồi/ruộng không tràn vào đường.
3. Seed 5: [biển và đồi](seed-5.png). Nước có màu và gợn riêng, phần dải nền cạnh nước gần màu biển; mép đường vẫn rõ.
4. Seed 0: [đồi hai bên](seed-0.png). Bóng đồi đậm hơn trên đất và cạnh đường, hình khối còn tách khỏi nền.
5. Seed 14: [phố hai bên](seed-14.png). Mảng tối lớn qua đường không làm mất vạch làn, xe và HUD. Đây cũng là góc kiểm tra bóng mây mềm đi qua mặt đường.

Các ảnh được lưu trực tiếp từ bản Vite đang chạy bằng Edge/Playwright trong lượt này. Thao tác lái và timing được kiểm riêng; ảnh tĩnh không chứng minh chúng.

## Kiểm tra chơi thủ công

| Kịch bản | Quan sát thực tế |
|---|---|
| Edge, `handling-motorcycle`, seed 17 | Nút bắt đầu hoạt động; quãng đường tăng 7 → 22 m sau A rồi W. HUD tốc độ, quãng đường, xăng và HP hiển thị. Escape tạm dừng: 22 → 22 m sau 450 ms; Escape tiếp tục: 29 m; Chơi lại: 0 m. Camera và vạch đường vẫn thấy khi điều khiển. |
| Edge, `events-accident`, seed 14 | Card “Tai nạn” xuất hiện và đóng được; chạy tới 207 m, không có lỗi JavaScript. Đây không phải bằng chứng đã va chạm hay kết ván. |
| Edge, `stress`, seed 1, checkpoint 192 m | Đóng 5 card lần đầu; tàu gây kết ván ở 229 m với tiêu đề “Va chạm tàu hoả”; bấm Chơi lại trở về 193 m. Không có lỗi JavaScript. |
| Edge, `stress`, seed 1, bắt đầu 0 m | 9 card lần đầu được đóng; quan sát tới 352 m, không có lỗi JavaScript. Mẫu đo `diagnostics`: 49,14 FPS trung bình, p95 frame 33,4 ms, CPU render trung bình 19,19 ms, 1.537 draw calls tại một khung stress. Checkpoint 192 m: 48,28 FPS, p95 33,4 ms, CPU render 19,65 ms, 1.776 draw calls. Đây là Edge headless trong môi trường thử nghiệm, không đại diện máy người chơi. |

## Tự chấm theo GAME_DESIGN.md

| Tiêu chí | Điểm / 10 | Lý do và giới hạn |
|---|---:|---|
| Đọc hình / silhouette | 7 | Xe, mép đường và thân cây/đồi tách được; bóng ở phố seed 14 tối nhưng vạch làn còn rõ. Chưa thử đầy đủ mọi hazard dưới bóng. |
| Giá trị sáng tối và tương phản | 7 | Cây và đồi có bóng đủ thấy; nền không còn tối đen sau khi bổ sung pháp tuyến. Mảng tối lớn có thể cần giảm trên màn hình thấp sáng. |
| Màu, saturation, mood | 7 | Ruộng xanh rêu, cỏ xanh, biển xanh xám và đồi nâu phù hợp trời mưa hơn dải xanh dương cũ. Chưa có đánh giá từ chủ dự án. |
| Ngôn ngữ hình khối low-poly | 7 | Giữ khối đơn giản hiện có; bóng mềm và bóng vật thể giúp đọc chiều sâu. |
| Ánh sáng, thời tiết, vật liệu | 7 | Nền nhận bóng, cây/đồi đổ bóng và bóng mây qua đường; mưa vẫn thấy. Bóng mây là lớp phẳng nên không bám mặt dốc cao. |
| UI, typography, phân cấp | 7 | Tốc độ, tiền, xăng, HP và vạch đường đọc được trên 1440 × 900. Các nhãn phím ở chân màn hình vẫn nhỏ. |
| Nhất quán phong cách | 7 | Màu dải theo seed trùng nhóm với đất của từng vùng; phố chi tiết hơn vùng ruộng/đồi do art prototype sẵn có. |
| Tiếp cận và hiệu năng | 6 | HUD không chỉ dùng màu; phép đo stress Edge headless khoảng 48–49 FPS. Chưa đo máy yếu, chế độ giảm chuyển động hay nhiều kích thước màn hình. |

Mọi điểm đều đạt ngưỡng tối thiểu 6/10 **theo tự đánh giá này**. Chưa có phê duyệt art direction hay tích hợp art hoàn chỉnh. Product Design in-app Browser không khởi động được trong lượt này (`trusted Node process exited unexpectedly`); kiểm UX bằng các ảnh Edge hiện tại và thao tác thật, không gọi đó là audit của plugin.

## Nhận xét sau playtest

- **Game designer, tự review:** dữ kiện là đường/hazard không đổi trong code, lượt stress seed 1 vẫn kết ván vì tàu ở 229 m. Ý kiến: bóng tăng cảm giác thời tiết và nhịp đường, nhưng các mảng tối dày có thể khiến chướng ngại sẫm khó nhìn. **ĐỀ XUẤT:** thử thêm các seed có ổ gà, nước, traffic nằm dưới bóng, rồi chỉ tinh chỉnh độ đậm nếu thời gian nhận biết giảm; không đổi mật độ spawn hay damage từ ảnh tĩnh.
- **UI/UX designer, tự review:** ưu tiên cao là vạch đường và cảnh báo không bị bóng che. Ảnh seed 14 cho thấy vạch làn còn thấy; lượt điều khiển xác nhận A/W, pause/restart phản hồi. Còn thiếu bài kiểm các QTE/card đang hiện đồng thời với bóng mây và màn hình nhỏ. Đề xuất kiểm cùng seed ở 1280 × 720 và QTE rẽ trong vòng review kế tiếp.

## Kiểm tra tự động

- `pnpm lint`: pass, exit 0.
- `pnpm typecheck`: pass, exit 0.
- `pnpm test --maxWorkers=1`: pass, 60 file / 362 test, exit 0. Sau chỉnh vị trí mặt nước cuối, chạy lại `pnpm exec vitest run --configLoader native tests/art-scenery.test.ts tests/cloud-shadows.test.ts`: pass, 20 test, exit 0.
- `pnpm build`: pass, exit 0, chạy lại sau chỉnh cuối. Có cảnh báo kích thước chunk Three.js đã tồn tại; không làm gate fail.

Không thay đổi số liệu cân bằng hay tài liệu ĐÃ CHỐT. Reviewer con người và CI trên commit cuối đang chờ PR.
