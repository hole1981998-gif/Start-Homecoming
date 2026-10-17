# P3A — review xăng, chướng ngại dài và ngã xe

Ngày 17/10/2026. Branch `feature/fuel-hazards-crash-recovery`, config `p3a-crash-hazards-2`. Đây là tự đánh giá từ simulation có seed cố định, test và thao tác trình duyệt của Codex; chưa thay cho cảm nhận chơi của chủ dự án.

## Kết quả thực tế

- Xăng nền tăng từ 0,003 lên 0,0038 L/m; nước tiếp tục hao thêm 0,8 L/s khi chạm. Mảng nước dài tới 30 m, ổ gà dài tới 24 m; có biến thể phủ 3 làn. Trước khi sinh đoạn buộc phải đi qua, simulation kiểm tra xăng/HP và để lại khoảng dự trữ; khi không đủ, chuyển thành đoạn 2 làn có lối tránh.
- Ổ gà trừ 6 HP và tối đa 10 tiền ở lần chạm đầu, rồi trừ 12 HP/s trong suốt thời gian tiếp xúc. Va với một xe giao thông trừ 20 HP một lần/xe; tài xế ngã, xe về 0 km/h, tự lên lại sau 2,6 s. Trong khoảng này không hao xăng, không nhận damage/debuff. Sau đó tốc độ tăng dần tới trung vị; giữ W tăng nhanh hơn.
- Luật hành khách quay lại/mất theo RNG seed đã có trong simulation và test. P3A chưa có hệ thống đón hoặc hiển thị hành khách; phần nhân vật/hành khách chơi được vẫn thuộc P4.
- 30 seed × 3 cách chạy × tối đa 600 s: tử vong lần lượt 1/30 (thả W/S), 2/30 (giữ W), 1/30 (giữ S). Số lượt từng xuống dưới 2 L là 5/30, 14/30, 20/30. Trung vị thời điểm đủ 800 tiền là khoảng 85,7 s, 61,2 s, 149,8 s. Các bot không né chủ động, và số liệu chỉ nói về luật đang mô phỏng.
- `pnpm lint`, `pnpm typecheck`, `pnpm test` (34/34), `pnpm build` đều pass sau thay đổi logic; production build có cảnh báo bundle >500 kB từ Vite, không chặn chạy.
- Trình duyệt in-app: mở ván production ở 127.0.0.1:5173, thấy cảnh báo nước, hao xăng/HP, camera/HUD vẫn hiển thị. Kịch bản dev `?scenario=crash` ở 5174: xác nhận xe 0 km/h, tài xế văng khỏi xe, cue gần xe, HP 70→50 một lần, rồi tăng tốc lại; nút Chơi lại reset về 0 m/200 tiền/8 L/70 HP. Kịch bản `?scenario=coast`: hết xăng, trôi đủ 25 m rồi hiện màn kết ván. Đây là các lần thao tác thực trong browser, không chỉ screenshot.

## Đánh giá thiết kế

**Game designer:** Hao xăng mới tạo nhiều lần chạm ngưỡng 2 L hơn, nhất là giữ W/S. Nhịp mua ô tô theo lái trung vị vẫn gần mục tiêu 1–1,5 phút. Đoạn ổ gà dài khiến việc giữ W để rút ngắn thời gian chịu hại có ý nghĩa; biến thể 3 làn tạo lựa chọn chấp nhận mất tài nguyên cho đến khi có nhánh đường. Tỷ lệ chết 1–2/30 trong các bot cơ bản chưa đủ để kết luận game khó; giữ yêu cầu difficulty curve cho vòng sau. Cần chủ dự án chơi để đánh giá cảm giác căng thẳng thực, vì bot không thể đo mức lo thiếu xăng hay niềm vui.

**UI/UX:** HUD tốc độ/quãng đường/điểm/tiền trên nền đường đọc được; vòng xăng/HP gần xe không che làn. Sau khi chạm ổ gà, HP từng hiện số thập phân dài; đã làm tròn số hiển thị. Trong hoạt cảnh ngã, cảnh báo xe phía trước gây nhiễu dù đang miễn nhiễm; đã ẩn cảnh báo chướng ngại trong khoảng này. Cue ngã có countdown nhưng không cập nhật live region liên tục cho trình đọc màn hình. Cần tiếp tục theo dõi độ rõ của mảng nước/ổ gà lớn trên điện thoại và tốc độ bắt tín hiệu hình khi đông xe; ảnh tĩnh không chứng minh được khả năng phản ứng hay cảm giác điều khiển.

## Giới hạn và bước đánh giá tiếp

- Chưa có nhánh đường để tránh đoạn phủ 3 làn, nên simulation chỉ cho sinh khi có ngân sách tài nguyên; lúc có nhánh cần thử lại quy tắc này.
- Chưa có sprite/AI hành khách, hoạt cảnh hành khách ngã và lên lại. Luật quay lại ngẫu nhiên đã chuẩn bị nhưng phải nối với P4.
- Chưa thay difficulty curve theo yêu cầu ghi chú; đánh giá thêm bằng playtest sau khi có mật độ cảnh quan/chướng ngại mới.
- Lỗi browser từ chối localhost ở lượt trước không tái hiện trong lượt này: công cụ đã mở được cả 5173 và 5174. Thông báo chính sách cũ không có log nguyên nhân sâu hơn, nên chưa thể khẳng định đó là cấu hình URL, phiên browser hay lỗi tạm thời của công cụ.
