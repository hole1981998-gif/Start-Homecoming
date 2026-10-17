# P4A — số người và chuyển động NPC (17/10/2026)

**Revision:** nhánh `feature-p4a-seamless-passenger-actions`, cấu hình `p4a-passengers-2`, seed 17. Đây là tự đánh giá của Codex từ simulation 60 Hz và thao tác trình duyệt, chưa có người chơi độc lập đánh giá.

**Thay đổi:** HUD đếm cả tài xế (`1/2` khi xe máy trống, `2/2` khi có một khách); trong lúc tất cả văng khỏi xe hiển thị `0/2`. G làm một khách bay ngang, xoay người trong 0,65 s và đáp xuống cạnh đường; NPC chưa đón lại được trong 2 s nên không hiện cue F sớm. Khách chờ và khách không quay lại sau va chạm: một phần đứng yên, phần còn lại đi chậm theo quỹ đạo trong bán kính 1,5 m. Vùng F và cue đọc vị trí NPC đã cập nhật từ simulation. ID lượt chơi ngẫu nhiên không ảnh hưởng motion RNG; motion dựa trên seed và ID sự kiện.

**Simulation tự động:** `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` đều exit 0; 50 test/9 file. Test mới kiểm tra khách G bắt đầu tại xe và di chuyển ngang, cùng seed nhưng `runId` khác cho cùng pha chuyển động, NPC đứng/đi trong giới hạn 1,5 m ở 600 bước 60 Hz, vị trí sau 10 s không phụ thuộc cách chia bước, khách rời xe sau crash có state chuyển động, cue F ẩn trong thời gian khóa. Sampling economy 30 seed không đổi so với `p4a-passengers-1`: median đủ 600 tiền thêm ở cruise khoảng 85,7 s, giữ W khoảng 61,2 s; chưa có shop để mua thật.

**Manual (ChatGPT in-app browser, localhost):** `?scenario=passenger` — đầu lượt 1/2; F rồi G liên tiếp cho kết quả 1/2, khách primitive bay ngang sang phải, ván vẫn chạy và cue F không hiện sớm. `?scenario=passenger-crash` — ba khách cho 4/2 trước va chạm, 0/2 khi xe ngã, khách văng ra ngoài; HP 50 sau cú va xe, không trừ thêm trong pha nằm trên nước/ổ gà. Screenshot kiểm tra vị trí/hình, test input dùng phím trực tiếp; ảnh tĩnh không chứng minh độ mượt ở mọi FPS. Restart/pause/failure được test hồi quy tự động; lượt manual này chưa thử death mới.

**Game design — dữ kiện và nhận định:** Ở max 0,45 m/s, NPC dịch dưới 0,54 m trong cửa sổ F dài tối thiểu ~1,2 s khi xe chạy 20 m/s; dịch chuyển này tăng yêu cầu căn ngang nhưng không tạo cú nhảy bất ngờ. **ĐỀ XUẤT, chưa áp dụng:** cho chủ dự án chơi 5–10 lượt tốc độ cao; nếu trượt F quá nhiều vì NPC đi, ưu tiên nới/hiển thị rõ vùng F hoặc cho cue sớm hơn trước khi tăng khoảng đón. Không tăng tốc đi của NPC chỉ để game khó hơn.

**UI/UX — tự đánh giá:** Số 1/2 cạnh điểm/tiền đọc được trong khung dọc; 0/2 lúc ngã đúng theo số người đang ngồi, nhưng cần phản hồi người chơi xem có bị hiểu là mất tất cả khách không. Pha đá ngang rõ silhouette trên nền đường; primitive còn cứng, để animation/art hoàn chỉnh ở gate cuối. Cue F cần bám vị trí đang đi của NPC, đã kiểm tra logic tự động; kiểm chứng độ dễ đọc trên thiết bị nhỏ vẫn còn thiếu.

**Giới hạn:** chỉ xe máy P4A; Tab đổi xe vẫn chờ P4B. Chưa có remote/CI/PR của repo này, không merge.
