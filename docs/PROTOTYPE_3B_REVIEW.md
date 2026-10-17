# P3B — giao lộ và tuyến rẽ (bản thử 17/10/2026)

## Phạm vi đã chạy

Build `p3b-junctions-1` bổ sung giao lộ theo seed mỗi 800 m, Q/E chốt trái/phải trong cửa sổ 1,8→1,2 giây, đường thẳng đôi khi bị rào. Không chọn ở đường mở thì đi thẳng; bỏ lỡ đường bị chặn gây 20 HP và chuỗi va/ngã/trôi hiện có một lần. Cảnh báo hiện trước khoảng 4–5 giây, riêng thời gian QTE hiện theo giây. Mặt đường là dải mesh theo đường cong, camera và entity theo cùng pose; mảnh đường, marker, cọc ven đường và entity được tái dùng. Hazard thường không sinh sát giao lộ. Gap hazard giảm dần từ 90 tới 75 m trong khoảng 10 km. Xăng, độ bền, pickup, giá và thu nhập không đổi trong lượt này.

## Kiểm chứng và giới hạn bằng chứng

- `pnpm lint`, `pnpm typecheck`, `pnpm test` (40/40), `pnpm build`: đều exit 0 trên Windows/PowerShell với pnpm 11.25.0. Build cảnh báo bundle JS 517,70 kB vượt mốc khuyến nghị 500 kB, chưa là lỗi chức năng. Test mới kiểm tra chốt Q/E một lần, lựa chọn quá sớm bị bỏ qua, đi thẳng đường mở, đụng rào khi đường thẳng bị chặn, rẽ tránh rào, tuyến cong liền mạch khi chuyển lựa chọn thành lịch sử, nhịp giảm gap và mẫu nhiều seed. Mẫu QTE 30 seed: bỏ lỡ rào 30/30 gây crash; chọn trái/phải kịp 30/30 tránh crash.
- Simulation economy hiện có: 30 seed × ba cách lái. Cruise đạt mốc 800 tiền 30/30, median 85,72 giây; W 30/30, median 61,18 giây; S 28/30, median 149,78 giây. Đây là bot có nhìn trước hazard, không phải kết quả người chơi; mục tiêu mua ô tô vẫn chưa có cửa hàng để kiểm tra giao dịch thật.
- Manual qua Codex in-app browser, Chromium, bản dev `?scenario=blocked-window`: khởi động, thấy cảnh báo/rào/QTE, nhấn Q trước rào và đi qua vẫn 70 HP; bỏ qua Q/E thì trừ đúng 20 HP, tài xế văng và xe trôi. Đã quan sát ảnh cảnh giao lộ và sửa nhãn sát biểu tượng, mặt đường rẽ dạng ô chồng và vật liệu đen trong quá trình kiểm tra. Sau sửa, ảnh màn chơi cho thấy đường cong liền, rào rõ và HUD không che xe. Chưa đo FPS trên nhiều thiết bị hay chơi tay đủ nhiều tuyến liên tiếp.

## Tự review gameplay

**Dữ kiện:** lựa chọn rẽ tạo hậu quả có thể dự đoán, rào xuất hiện trên đường thật, Q/E chỉ hợp lệ gần giao lộ. Khoảng hazard giảm nhẹ khi chạy xa, song simulation bot chưa đo được mức tập trung hay cảm giác khó thực. Vùng giao lộ an toàn tránh ép người chơi vừa né xe vừa đọc QTE trong vòng này.

**Đề xuất cho vòng cân tiếp:** cho nhánh trái/phải khác nhau về rủi ro, nguồn tiếp tế hoặc cơ hội khách/shop có giới hạn, để quyết định rẽ không chỉ là phản xạ tránh rào; cần mô phỏng phân bố tài nguyên và đường sống được trước khi đưa phần thưởng vào. Nếu chơi tay vẫn thấy dễ, thử tăng xác suất rào theo quãng đường hoặc phối hợp một hazard *trước* vùng cảnh báo, mỗi lần chỉ đổi một biến và giữ cửa sổ phản ứng tối thiểu. Không tự áp dụng các thay đổi này từ kết quả bot.

## Tự review UX và việc sau

Graphic Q/E đang ở vùng trời phía trước, không chiếm phần đường sát xe; rào có màu khác mặt đường. Nên đo thêm thời điểm người chơi nhận ra cửa sổ Q/E khi chơi liên tục, nhất là màn hẹp và sau khi vừa va xe. Bản này chỉ có xe máy: penalty theo chiều dài xe và khả năng ôm cua của buýt/container sẽ thử khi P4 có nhiều xe. Bản sau cũng cần thêm pha tài xế nằm/đứng dậy trước khi chạy lại như feedback mới. Pickup xăng/sửa và traffic HP/hành khách để dành các mốc đã ghi trong ROADMAP; chưa đổi trong P3B.
