# Tự review sound direction — SFX gameplay, 29/10/2026

## Nguồn và giới hạn

Review trên branch `feature/procedural-sfx-auditions`, base `6dbd22d`, seed 17. Codex tự đánh giá từ mã, số đo WAV và fixture game trong Edge headless. Công cụ không đưa âm thanh từ game vào phiên nghe của Codex; **chưa có đánh giá bằng tai** và không có sound director độc lập. Chủ dự án phản hồi nhiều SFX nghe chán, thiếu lực; đó là nhận xét nghe trực tiếp của người chơi và là lý do mở vòng sửa này.

## Quan sát có bằng chứng

| Ưu tiên | Dữ kiện trước sửa | Tác động dự kiến | Sửa trong vòng này |
| --- | --- | --- | --- |
| P1 | Va nhẹ/vừa/nặng dài 1,05/1,43/1,92 s nhưng cửa sổ RMS trên 0,015 FS chỉ tới khoảng 0,4/0,6/0,8 s | Đầu va rõ, thân xe và mảnh lắng xuống nghe hụt | Thêm thân trầm, ma sát và va thứ cấp trải gần hết cue; kiểm tra RMS ở 0,65/0,95/1,45 s |
| P1 | Ba stem động cơ có tương quan liền kề khoảng 0,97 | Đổi ga dễ giống tăng pitch của cùng một mẫu | Tăng khác biệt giữa tải máy, hút khí và mặt đường; giữ chu kỳ 2 s và cùng pha |
| P1 | Runtime cắt cứng động cơ lúc trôi và đổi xe; kết ván có thể bỏ qua tiếng va cuối | Mất cảm giác xe còn lăn; cú kết thúc thiếu phản hồi | Duy trì động cơ nhỏ hơn khi trôi, fade khi đổi xe/ngã, xử lý cue va trước nhánh kết ván |
| P2 | Stinger tăng/phanh phụ thuộc bước thay đổi tốc độ và cooldown, dễ lặp không theo nhịp máy | Âm động cơ rời rạc | Bỏ stinger định kỳ; stem và playback rate thể hiện thay đổi tốc độ |

Các WAV va chạm mới có RMS 0,038/0,044/0,042 FS tại mốc 0,65/0,95/1,45 s; ổ gà nhẹ/nặng đạt 0,028/0,020 FS tại 0,55/0,85 s. Điểm nối tệ nhất của 24 loop động cơ là 263/32768 biên độ mẫu. Đây là số đo tín hiệu, **không chứng minh âm nghe đã hay**.

## Kiểm tra game và tự review

- Edge headless, Vite DEV, fixture `force-car-ram`, seed 17: HP 184→164, nguồn Web Audio cho cue va vừa 1,43 s được khởi phát, động cơ dừng rồi khởi động lại khi xe phục hồi. Sau sửa tải trễ, chạy lại fixture này: HP 164, trạng thái xe đang trôi, 6 nguồn loop khởi phát, không có `pageerror`. Fixture `p62-water-baseline`, seed 17: nhiên liệu còn 4,3 L sau đoạn chạy; splash 0,76 s và loop nước 2,4 s đều được khởi phát. Fixture `handling-motorcycle`, seed 17: gửi W/A/S, trạng thái chuyển sang hồi tốc độ; pause hiện “Đã tạm dừng” và modal “Nghỉ một nhịp”, restart về “Sẵn sàng”. Không có `pageerror` trong các lượt thử. Đây là kiểm tra sự kiện và đường phát âm, không phải nghe chủ quan.
- **Game design, tự review:** thân âm dài hơn có thể cho cú va trọng lượng hơn mà không thay damage hoặc RNG. Cần nghe nhiều va liên tiếp để tránh đuôi âm chồng nhau gây mệt; nếu dày, giảm đồng thời/duck theo tình huống thay vì làm va trở lại quá ngắn.
- **UI/UX, tự review:** cue hình và HUD của fixture vẫn hoạt động. Chưa kiểm tra bằng tai việc âm mới có át cảnh báo/QTE không. Bộ UI `ui-modern` chưa được nối; mute/volume cho người chơi còn thiếu, ưu tiên ở lượt mix tiếp theo.
- **Việc cần nghe với chủ dự án:** so sánh va nhẹ/vừa/nặng trong game, ga thấp→nhanh→trôi, nước khi vào/ra, và đoạn nhiều traffic. Chỉ chốt SFX sau phản hồi nghe thực tế.

Đã thử tạo một mẫu va nặng bằng ElevenLabs; dịch vụ báo free generations đang bận, mẫu không chạy và không trừ credit. Không có âm ElevenLabs trong commit này.

## Gate đã chạy

`pnpm lint` pass; `pnpm typecheck` pass; `pnpm build` pass; `pnpm test --maxWorkers=1` pass (40 file, 270 test) trên mã cuối. `validate_v2.py` và `validate_feedback.py` pass. Lượt lint đầu fail do tham số `input` không còn dùng sau khi bỏ stinger; đã bỏ tham số và chạy lại pass. Chưa có kết luận nghe thực tế, kiểm tra mobile hay CI trên revision cuối.
