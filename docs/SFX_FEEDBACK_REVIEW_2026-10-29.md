# SFX gameplay — vòng nghe thử sau feedback 29/10/2026

## Phạm vi

Base `2ccc02f` trên `feature/procedural-sfx-auditions`; seed 17 cho kiểm tra trình duyệt. Đây là thay đổi âm thanh trình bày, không đổi simulation, độ khó, tài nguyên hoặc UI. WAV được tạo bằng `generate_feedback.py` (Python standard library), không dùng API hay âm thanh bên ngoài. Chưa ghép âm thanh UI và voiceline.

- Vũng nước: một tiếng bắn lúc vào, cộng lớp nước lăn 2,4 giây loop trong lúc entity nước còn `touching`; hạ âm khi rời vũng, pause hoặc kết ván.
- Bỏ tiếng `skid.wav` do vận tốc ngang khi bấm A/D. Bỏ các cue âm thanh báo trước va chạm; cảnh báo hình vẫn giữ.
- Va xe: ba tiếng va nhẹ/vừa/nặng theo loại xe tham gia, gồm xe người chơi húc traffic và hai xe traffic đâm nhau gần người chơi.
- Ổ gà: tiếng nhún/lọc cọc nhẹ hoặc nặng khi xe người chơi chạm, và khi xe traffic gần đó mới chạm ổ gà.

## Bằng chứng và giới hạn

- Simulation test mới: fixture nước dài `p62-water-baseline`, seed 17, flag tiếp xúc tồn tại trên hơn 10 tick; audio test kiểm tra loop bắt đầu khi chạm, về gain 0 khi rời, không tải `skid.wav`/`police_warning.wav`, chọn đúng tiếng va xe và ổ gà theo loại xe.
- Tự kiểm tra thủ công trong ChatGPT in-app browser trên Windows, Vite DEV `127.0.0.1:5175`: bản chính `?seed=17` bắt đầu và HUD chạy; phím A được gửi vào canvas. Fixture `?scenario=p62-water-baseline&seed=17` chạy qua nước, quãng đường 33→72 m và xăng giảm 7,0→5,8 L. Fixture `?scenario=force-car-ram&seed=17` hiển thị va ô tô, HP 184→164, trạng thái ngã/đợi tài xế; pause hiện "Đã tạm dừng", restart về 0 m, 184 HP. Không thấy lỗi console trong fixture nước.
- Công cụ không thu âm đầu ra trình duyệt, nên **chưa đánh giá bằng tai** độ lớn, độ tự nhiên, điểm nối loop hoặc mix khi nhiều sự kiện xảy ra. Kiểm tra WAV bằng script: file mono 44,1 kHz; điểm nối mẫu cuối/đầu của loop nước bằng nhau (delta 0). Đây là kiểm tra kỹ thuật, không thay việc nghe.

## Tự review

- **Game design:** bỏ cảnh báo âm theo feedback người chơi; cảnh báo hình còn nguyên nên luật né không bị thay. Tiếng va xe chia ba cấp giúp nhận trọng lượng. Giả định cần xác nhận ở lần nghe: va xe traffic ngoài tầm nhìn có thể quá dày trong đoạn kẹt; thử seed 17 và vài seed dày traffic, giảm gain/cooldown nếu che tín hiệu lái. Không đề xuất đổi balance.
- **UI/UX:** screenshot và AX tree cho thấy HUD xăng/HP, cảnh báo và trạng thái ngã/pause/restart vẫn đọc được ở các fixture trên. Chưa xác minh bằng tai âm có át QTE/cảnh báo hình không; chưa kiểm tra mobile/touch. Ưu tiên P1 cho lượt nghe thử: loop nước vào/ra có mượt, A/D còn tiếng lạ không, cue va xe có phân biệt được ba cỡ không.
