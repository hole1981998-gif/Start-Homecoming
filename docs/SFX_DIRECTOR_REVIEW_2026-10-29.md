# Sound director pass — SFX gameplay, 29/10/2026

## Nguồn đánh giá

Một subagent được giao vai sound director đã đọc hướng âm thanh, mã phát và các WAV hiện hành. Phiên công cụ không truyền âm thanh để agent nghe trực tiếp; các nhận xét về chất lượng là **suy luận từ cấu trúc**, không phải kết luận nghe bằng tai. Phản hồi của chủ dự án rằng nhiều tiếng nghe dở là bằng chứng nghe thực tế và là lý do sửa. Không gọi subagent là chuyên gia độc lập.

## Ưu tiên và thay đổi

| Mức | Nhận xét | Đã xử lý trong lượt này |
| --- | --- | --- |
| P1 | Va chạm dựa vào loại xe nên va chậm với xe nặng vẫn phát tiếng nặng | Chọn va nhẹ/vừa theo tốc độ tác động; chỉ chọn va nặng khi đủ nhanh và có xe nặng. Dùng `crash.impactSpeed` khi có, không đổi damage/gameplay. |
| P1 | Tiếng va có thể chồng với tiếng dừng và ngã xe | Không phát tiếng dừng khi đang crash; hạ lớp ngã xe để tiếng va là trọng tâm. |
| P2 | Nước lặp một texture với mức cố định | Loop vẫn theo thời gian tiếp xúc, nhưng gain và playback rate đổi mượt theo tốc độ xe. |
| P2 | Cues va procedural cùng chất liệu; ổ gà có nhịp gõ gần cố định; NPC chưa có voice | Còn chờ bản âm thay thế và nghe thử. Không tự tuyên bố các file này đã đạt. |

ElevenLabs SFX v2 được gọi để tạo một mẫu va xe thay thế nhưng dịch vụ báo free generations đang bận. Mẫu **không chạy, không trừ credit**, và không có file ElevenLabs được ghép. Chủ dự án tạo `.env` trên máy; kiểm tra `GET /v1/user` trả `400 invalid_api_key` vì giá trị là ID của key thay vì key thực bắt đầu bằng `sk_`. Đã báo chủ dự án thay bằng key thực. `.env` được thêm vào `.gitignore`; key không được lưu trong repo.

## Kiểm tra thực tế và tự review

- Revision trước sửa: `d879179`; seed 17. In-app browser, fixture `p62-water-baseline`: xe chạy từ 0 tới 155 m, xăng 7,2 xuống 4,0 L; nước hiện cue hình, pause hoạt động, không thấy console error. Fixture `force-car-ram`: va xe làm HP 184 xuống 164, crash cue và quá trình quay lại xe hiện; restart về 0 m và 184 HP, không thấy console error. Browser không cung cấp âm thanh cho agent nghe nên **chưa kiểm tra cảm giác mix bằng tai**.
- Game designer, tự review: chỉ điều chỉnh âm thanh trình bày, không đổi balance, RNG, damage hoặc điều khiển. Va nhẹ ở tốc độ thấp giảm cảm giác va quá mạnh. Cần người chơi nghe ở các tốc độ và xe khác nhau trước khi chốt ngưỡng 9/21 m/s.
- UI/UX designer, tự review: cue hình của nước và crash còn thấy được; việc mute/volume độc lập và voice NPC còn thiếu. Không suy từ screenshot rằng cảnh báo âm thanh đã đủ rõ.
- Gate tự động trên mã hiện tại: `pnpm lint` pass; `pnpm typecheck` pass; `pnpm build` pass; `pnpm test --maxWorkers=2 --reporter=dot` pass (40 file, 270 test). In-app browser không có lỗi console trong hai fixture nêu trên. CI chưa kiểm tra trên commit mới.

## Việc cần nghe khi có API

Tạo ít nhất một biến thể va kim loại/nhựa/kính và tiếng ổ gà lốp–gầm bằng ElevenLabs, so A/B với bản đang dùng ở cùng mức âm; kiểm tra đuôi âm, độ lặp trong traffic dày, cùng với động cơ và mưa nền. Chỉ thay WAV đang phát sau khi nghe được mẫu và xác minh quyền dùng trong game.
