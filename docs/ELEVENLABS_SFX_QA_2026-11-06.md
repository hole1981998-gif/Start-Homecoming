# Tự kiểm tra ElevenLabs SFX — 06/11/2026

Revision đang kiểm tra: `feature/elevenlabs-world-sfx` (trước commit). Config `p8-encounter-c3-refinement-1`; kịch bản `?scenario=stress&seed=17` là fixture cố ý dày, không dùng để kết luận cân bằng ván thường.

## Bằng chứng trình duyệt

Edge headless chạy bản Vite cục bộ 127.0.0.1:5173. Codex dùng input chuột/phím của trình duyệt: bấm Bắt đầu lái, đóng thẻ hướng dẫn đầu, giữ W, gửi A rồi thả, tiếp tục qua hazard và màn kết quả, cuộn tới nút Chơi lại và bấm. Đây là thao tác trong browser thật, không phải chỉ chụp một khung hình.

- [Mở ván](audio-review-2026-11-06/01-start.png): slider SFX/môi trường và trạng thái nhạc chưa có đều nhìn thấy. Thẻ đầu tiên [dừng an toàn](audio-review-2026-11-06/02-driving.png), không để xe chạy vào hazard khi overlay mở.
- [Đang chạy](audio-review-2026-11-06/03-outcome.png): cảnh đường, xe, cảnh báo và HUD vẫn đọc được. Trong đoạn input tiếp theo, giữ W làm tốc độ hiện trên HUD tăng từ 45,0 lên 55,8 km/h khi quãng đường tăng 409→418 m. Phím A đã được gửi, nhưng chưa đo được độ dịch ngang để kết luận cảm giác lái.
- [Kết quả](audio-review-2026-11-06/04-terminal.png): kết ván vì damage tại 431 m, 0:48, 238 điểm. Nút Chơi lại nằm dưới vùng cuộn; sau khi cuộn và bấm, quãng đường trở về 2 m, modal đóng và trạng thái là “Tự chạy trung vị”.
- Trình duyệt đã gọi các file `npc_footsteps_wet`, `train_roll_past`, động cơ gần, nước, ổ gà, va chạm, tài xế ngã và result cue. Không có exception JavaScript trong lượt ghi. Log gọi `play()` chứng minh nối sự kiện, **không chứng minh chất âm hay độ lớn nghe được**; Edge chạy ẩn, Codex chưa nghe qua loa/tai nghe.

Đã mở thêm Edge hiển thị tại cùng URL cho chủ dự án nghe thử. Đây không phải bằng chứng chủ dự án đã duyệt âm.

Audit screenshot của Product Design qua in-app Browser không chạy được vì launcher UI báo `0x80070020`. Codex dùng ảnh mới chụp trong Edge ở lượt này và checklist UX thủ công; không coi ảnh là phép đo cảm giác lái hoặc chất âm.

## Gate tự động trên revision cuối trước commit

- `pnpm lint`: pass, exit 0.
- `pnpm typecheck`: pass, exit 0.
- `pnpm build`: pass, exit 0; 54 MP3 có mặt trong `dist/audio`.
- `pnpm exec vitest run --configLoader native --maxWorkers=2 --no-file-parallelism`: pass, exit 0; 79 file / 425 test. Giới hạn 2 worker chỉ đổi lịch chạy, không đổi test hay timeout.

## Tự review — game design

**Quan sát:** SFX không đổi spawn, damage hay thao tác; cảnh báo bằng hình vẫn còn khi tắt âm. Fixture stress cho nhiều cue chồng nhau và kết ván nhanh; không dùng nó để đánh giá độ khó thường. **Ý kiến/ĐỀ XUẤT:** nếu khi nghe thử động cơ/nước che cảnh báo tàu, giảm gain của loop gần trước, rồi kiểm tra lại cùng seed/xe với tắt và bật SFX. Chưa áp dụng thay đổi cân bằng lớn.

## Tự review — UI/UX

- Ưu tiên P1: cần người nghe xác minh cue tàu, xe và NPC có phân biệt rõ trên loa điện thoại/tai nghe; không thể suy từ log `play()`.
- Ưu tiên P2: nút Chơi lại dưới nếp cuộn của màn kết quả 800 px; script phải cuộn mới bấm được. Vấn đề ngoài phạm vi âm thanh, nên ghi để kiểm tra UI sau.
- Slider đầu ván rõ, kéo về 0 tắt được từng nhóm; thẻ đầu xuất hiện trong safe pause. Chưa kiểm tra thao tác kéo slider trên thiết bị cảm ứng hoặc thời gian phản hồi nghe bằng tai.

## Theo feedback mới của chủ dự án

Nhánh feature đang làm chứa 54 MP3 ElevenLabs, **0 WAV procedural**. Bộ tự tạo cũ trong nhánh audition riêng không được đưa vào bản game/PR này. Chưa xóa lịch sử Git hoặc chỉnh checkout audition của người dùng.
