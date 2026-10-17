# P3A — vòng thử xăng xe máy và trôi sau va chạm

Ngày 17/10/2026. Branch `feature/motorcycle-fuel-crash-slide`, config `p3a-fuel-crash-slide-3`. Đây là tự đánh giá của Codex từ test, simulation seed cố định và thao tác trình duyệt; chưa thay cho cảm nhận của người chơi.

## Thay đổi và kiểm tra

- Xe máy có bình 5,5 L thay 8 L, hao 0,0045 thay 0,0038 L/m (+18,4%). Bình nhặt tối đa +5,5 L; khoảng cách tiếp tế 450 m và tiền/m giữ nguyên. Ngân sách sinh vũng nước phủ ba làn được tính lại cho bình nhỏ, vẫn yêu cầu đủ xăng đi qua cộng 0,5 L dự phòng. Mức xăng/tiêu hao của các xe tương lai phải định nghĩa và mô phỏng riêng.
- Va xe vẫn nhận 20 HP một lần/entity. Sau đó xe giảm tốc 8 m/s², trôi 12,25 m tại cruise 14 m/s hoặc 25 m tại max 20 m/s, đồng thời trượt lệch tối đa 1,8 m để không bị xe giao thông che. Tài xế văng tiến và sang bên xa hơn, rồi tự quay lại. Đường trôi tính vào quãng đường thực nhưng không thưởng điểm/tiền, không hao xăng, không dính damage/debuff. Hồi tăng tốc chỉ bắt đầu sau khi xe đã dừng và tài xế quay lại.
- 30 seed × 3 chiến lược bot × tối đa 600 giây: chạy trung vị đủ 800 tiền 30/30 lượt, trung vị 85,7 giây; giữ W 30/30, trung vị 61,2 giây; giữ S 28/30, trung vị 149,8 giây. Có lúc dưới 2 L ở 30/30 lượt trung vị và W, 28/30 lượt S. Số lượt kết ván trong 10 phút là 8/30, 14/30, 4/30. So với vòng trước 0,0038 L/m và bình 8 L: dưới 2 L ở 5/30 lượt trung vị và 14/30 lượt W; kết ván 1/30 và 2/30. Bot dùng chính sách né/nhặt cố định, nên số liệu này không đo được cảm giác lo thiếu xăng.
- Thử 5 L/0,0065 và 5,5 L/0,0055 trước khi chọn số cuối. Hai mức đó cho tỷ lệ kết ván 10 phút quá cao, trong đó có lượt chết trước khi đủ tiền mua xe; không áp dụng. Mốc 5,5 L/0,0045 là số tạm để chủ dự án chơi thử.
- Test logic kiểm tra quãng trôi chính xác ở cruise/max, bảo vệ tài nguyên, không thưởng điểm/tiền khi trôi, trượt vào phía trong ở rìa đường, hồi tốc và luật hành khách seeded. Simulation bảo vệ mốc economy 60–90 giây ở trung vị của cả hai chiến lược chính và yêu cầu đa số seed có giai đoạn xăng thấp.

## Tự review gameplay và UI/UX

**Gameplay:** bình nhỏ làm quyết định ghé nhặt xăng rõ rệt, tốc độ nhanh có rủi ro hết xăng cao hơn nhưng vẫn đạt mốc mua ô tô sớm. Tỷ lệ chết 10 phút cao hơn hẳn và có thể quá gắt với người thật; cần chủ dự án nhận xét sau vài lượt, đặc biệt đoạn 2–5 phút. Chưa đổi mật độ/difficulty curve để giữ nguyên biến so sánh. Khi xe mới xuất hiện, không sao chép số xe máy; mô phỏng khả năng tới bình xăng, tỷ lệ mua xe và tần suất chết theo từng xe/tải khách.

**UI/UX:** trong trình duyệt dev, đầu ván hiện 5,5 L. Kịch bản va chạm ở seed 17 thấy xe tiếp tục chạy và hạ tốc, distance tăng trong khi điểm/tiền đứng yên, HP chỉ giảm một lần. Ở ảnh khi xe còn khoảng 32 km/h, tài xế đã nằm phía trước lệch sang bên; ban đầu ô tô che xe máy, nên đã thêm trượt ngang 1,8 m và kiểm lại thấy cả xe máy lẫn tài xế đọc được. Cung xăng/HP vẫn đi theo xe và cue miễn nhiễm nằm cạnh xe. Fixture cạn xăng đã trôi thêm 25 m rồi hiện màn kết ván; nút Chơi lại tạo ván mới. Tab production ở 5173 mở được với bình 5,5 L. Giới hạn: ảnh không chứng minh cảm giác lực va chạm, độ dễ đọc trên mọi kích thước màn hình hay khả năng phản ứng của người chơi. Chưa có âm thanh, sprite hành khách hoặc vật lý ragdoll.

## Gate và bản chơi thử

`pnpm lint`, `pnpm typecheck`, `pnpm test` (35/35) và `pnpm build` đều exit 0 trên code cuối, Windows/Node 24. Vite chỉ cảnh báo bundle lớn hơn 500 kB. Bản production đang phục vụ tại 127.0.0.1:5173, fixture dev `?scenario=crash` tại 5174 chỉ dành cho QA. Chưa có remote nên không push/PR/CI; không merge.
