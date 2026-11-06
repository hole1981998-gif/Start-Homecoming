# ElevenLabs SFX integration review — 30/10/2026

## Nguồn và phạm vi

Base: `835f456` trên nhánh `feature/procedural-sfx-auditions`. Chủ dự án yêu cầu làm lại tiếng xe đi trong nước, ổ gà và va chạm với chướng ngại bằng ElevenLabs. Gọi trực tiếp API `POST /v1/sound-generation`, model `eleven_text_to_sound_v2`, MP3 44,1 kHz/128 kbps. Key được đọc từ `.env` đã Git ignore; không ghi key vào script, tài liệu hay bundle trình duyệt. Key thiếu quyền `user_read` nên `GET /v1/user` trả 401, nhưng endpoint tạo SFX trả 200 và lưu đủ file. Không dùng lượt tạo miễn phí đang bận của canvas.

## SFX mới

14 file được tạo: loop nước, splash đầu vũng, ổ gà nhẹ/nặng, ba mức va xe, rào, thùng gỗ, thùng phuy, xe hàng rong, cứu thương, tàu và người đi đường. `generate.py` lưu prompt/duration/loop và có thể tạo lại các file thiếu. `LISTEN.html` cho nghe từng cue; loop nước được phát lặp. Có một biến thể nước thử riêng trong `alternatives/`, không đưa vào build game.

`AudioDirector` chuyển các cue gameplay tương ứng sang MP3 mới. Va `jam` chọn xe hàng rong, cứu thương hoặc rào theo entity thực. Tàu dùng tiếng va tàu khi chạm; cue visual và simulation giữ nguyên. Tiếng rolling cargo, engine, mưa gió và UI không đổi. Các WAV cũ còn trong thư mục audition để đối chiếu nhưng không được import vào build cho các cue đã thay.

## Kiểm tra

- API: 14 request tạo file thành công; mỗi file có dung lượng lớn hơn 1 KB và MP3 header hợp lệ. In-app browser mở `LISTEN.html`: 14/14 audio element tải được, không có media error; duration 1–5 giây theo từng prompt. Đây là kiểm tra kỹ thuật, **không phải nghe đánh giá chất âm**.
- Lint: `pnpm lint` pass.
- Typecheck: `pnpm typecheck` pass.
- Tests: `pnpm test --maxWorkers=2 --reporter=dot` pass, 40 file/270 test. Test audio xác nhận đường dẫn MP3 nước, ổ gà, va xe, rào và cứu thương; các cue steering/warning cũ vẫn không phát.
- Build: `pnpm build` pass; 14 MP3 xuất hiện trong production assets, WAV được thay không còn trong build.
- Manual, in-app browser, seed 17: fixture `p62-water-baseline` đi qua vũng nước, xăng 7,2→4,0 L, cue hình nước xuất hiện, pause hoạt động; `force-car-ram` HP 184→164, crash/recovery xuất hiện, restart về 0 m/184 HP; `traffic-passengers-pothole` hiện cảnh báo ổ gà và sau tiếp xúc tiền 280→271,4, HP 210→171 do va thêm xe. Không thấy browser console error trong các fixture đã xem. Browser tool không cho nghe đầu ra Web Audio, nên cảm giác/âm lượng thực tế **chưa được kiểm tra bằng tai**.

## Tự review sau playtest

- Game designer: không đổi damage, spawn, RNG hay balance. Cue mới bám đúng sự kiện. Fixture ổ gà có cả ô tô nên không thể dùng nó để đánh giá riêng cảm giác tiếng ổ gà; cần chủ dự án nghe cue tách và trong ván.
- UI/UX designer: cảnh báo nước, ổ gà và crash còn biểu diễn hình ảnh; không phụ thuộc âm thanh để nhận biết. Trang nghe thử giúp chỉ ra file cụ thể cần sửa. Chưa kiểm tra bằng tai việc nhiều cue chồng nhau có át cảnh báo/QTE không; volume/mute người chơi và voice NPC vẫn là phạm vi chưa hoàn tất.
- Hạn chế: Chất âm ElevenLabs chưa được chủ dự án nghe/chấp nhận. Đây là bản ghép thử để nhận feedback, không khẳng định đã chốt sound direction.
