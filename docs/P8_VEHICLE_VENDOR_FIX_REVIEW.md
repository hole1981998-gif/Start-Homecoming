# P8: xe hỏng trong kho và hàng rong đứng yên

Ngày 22/10/2026. Bản kiểm tra: working tree sau `5b0e296`, seed 17, bản chính `/` dùng force. Đây là sửa lỗi gameplay, không đổi giá, damage hay mật độ P8. `ver.noforce` giữ luật kho xe cũ theo yêu cầu backup.

## Nguyên nhân và thay đổi

- Khi xe về 0 HP và tự chuyển sang xe dự phòng, instance xe hỏng được đánh `disabled` nhưng vẫn nằm trong kho hai xe. Cửa hàng kiểm tra loại xe đang sở hữu theo toàn bộ kho, nên từ chối bán lại. Bản chính giờ bỏ instance 0 HP sau khi chuyển thành công; xe hết xăng vẫn giữ trong kho theo luật cũ. Nếu không có xe dự phòng, ván kết thúc như trước.
- Hàng rong được hẹn giờ chạy từ lúc sinh event ở rất xa theo tốc độ trung vị. Xe chạy nhanh có thể đến trước giờ hẹn, nhìn thấy hàng rong đứng yên. Giờ event đợi đến khi khoảng cách thực tế tới người chơi còn khoảng hai giây chạy theo tốc độ hiện tại, rồi bắt đầu chạy ngang. Tàu vẫn dùng khoảng báo trước riêng; số sát thương và kích cỡ hàng rong không đổi.
- Fixture kiểm tra trực tiếp: `/?scenario=vehicle-repurchase&seed=17` và `/?scenario=p8-vendor&seed=17`. Chỉ là checkpoint DEV.

## Bằng chứng kiểm tra

- Test tự động: case 0 HP → tự chuyển xe → tới shop → mua lại cùng loại; case hàng rong chờ ở xa rồi đi ngang với 8 và 24 m/s; test tai nạn và hẹn giờ hàng rong trên bản arcade backup giữ luật cũ. Windows/Node/pnpm: `pnpm lint` exit 0; `pnpm typecheck` exit 0; `pnpm test` exit 0 (256/256); `pnpm build` exit 0; `pnpm simulate` exit 0 (123/123). `git diff --check` exit 0.
- Simulation P8, 30 seed (1–30) × 3 profile điều khiển hữu hạn, cap 720 s: trung vị ván đã kết thúc cautious 449 s (25/30 ván kết), average 517 s (22/30), fast 249 s (29/30). Đây là bot có quy tắc phản ứng, không phải thời lượng chơi của người. Sau khi hàng rong hoạt động đúng, các số khác báo cáo P8 trước đó không còn đại diện nguyên vẹn; cần đo lại khi khóa balance.
- Manual, ChatGPT in-app browser, bản chính seed 17: fixture `vehicle-repurchase` bắt đầu xe máy 20 HP, chạm traffic ở 8 m, chuyển sang ô tô 4 chỗ 105 HP/10 L. Tại 55 m nhấn R, shop hiển thị Xe máy `Chọn mua` và Ô tô 4 chỗ `Đã sở hữu`. Xác nhận mua Xe máy: tiền 601,1 → 351,1, HUD trở về 1/2, 5,5 L, 70 HP. Chơi lại về 0 m, 600 tiền, xe máy 20 HP. Fixture `p8-vendor`: ở 42 m xuất hiện cảnh báo hàng rong còn 33 m; khi tiếp tục chạy thẳng chạm hàng rong ở khoảng 72 m và có trạng thái ngã xe. Chuyển động ngang đo bằng simulation; lần manual này chưa ghi video tọa độ hình ảnh liên tục.

## Tự review

- Game design: lỗi kho gây khóa lựa chọn mua xe sau khi người chơi đã trả giá bằng một xe hỏng; bỏ instance chết phục hồi vòng economy mà không tặng tài nguyên. Kích hoạt hàng rong theo vị trí hiện tại giúp nó trở thành nguy hiểm thật khi chạy nhanh. **ĐỀ XUẤT:** chơi thêm nhiều seed và thử phanh S để đánh giá khoảng báo trước 2 giây, rồi mới cân tốc độ/độ rộng; hiện chưa đổi số cân bằng.
- UI/UX: trong fixture mua lại, nút Xe máy chuyển từ `Đã sở hữu` sang `Chọn mua`, số tiền và HP đổi rõ sau giao dịch. Cảnh báo hàng rong xuất hiện trước va chạm; cần người chơi đánh giá khả năng nhận ra hướng băng đường ở tốc độ cao. Prototype vẫn dùng cue tối giản theo roadmap P8.

## Git và giới hạn

Repository hiện chỉ có `origin/HEAD` trỏ branch feature cũ, không có remote `main`; `git remote show origin`/`ls-remote` còn báo thiếu credentials trong môi trường này. Theo AGENTS.md, phần sửa để ở patch review được, chưa commit/push/PR/merge cho tới khi xác định base main hợp lệ. Bản Vite localhost đọc working tree nên hai fixture trên có thể chơi thử ngay trên máy này.
