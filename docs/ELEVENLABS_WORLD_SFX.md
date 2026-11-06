# ElevenLabs world SFX — 06/11/2026

## Phạm vi và nguồn

Theo yêu cầu trực tiếp ngày 06/11/2026, bản này tích hợp âm thanh cho xe chướng ngại, NPC, tàu, va chạm, mặt đường, vật phẩm và môi trường. Đây là thay đổi trình bày; không đổi luật simulation, RNG, damage, economy hay độ khó. Cue hình trên đường/HUD vẫn là nguồn cảnh báo khi tắt âm.

- 52 clip MP3 đã được tạo bằng `eleven_text_to_sound_v2` trong bộ audition `project-reference/sfx/elevenlabs-2026-10-29` của nhánh `feature/procedural-sfx-auditions` (`4e71ce4`). Mã prompt và thông số nguồn ở `generate.py` của bộ đó. Bản tích hợp chép clip vào `public/audio/`, không chỉnh bộ nguồn.
- `npc_footsteps_wet.mp3`: ElevenLabs flow `DqQhsM3p4C9iPL0gfjTp`, prompt “Short footsteps of one adult walking briskly on wet asphalt, soft shoe taps and faint splashes, close-mic, no voices or music.”
- `train_roll_past.mp3`: ElevenLabs flow `Z2cmrzYqxk5JpPX2crbN`, prompt “Heavy train rolling past outdoors on steel rails, rhythmic wheel clatter and low motor rumble, no horn, voices or music.”
- Hai clip mới dài 2 giây mỗi clip; đã tải file tạo xong trực tiếp vào `public/audio/`. Toàn bộ 54 clip chiếm khoảng 1,98 MB. Không có API key trong repo.

## Ánh xạ và nhịp phát

| Nguồn thực trong game | Âm thanh |
| --- | --- |
| Va chạm xe nhỏ/vừa/nặng, cứu thương, rào, xe hàng rong | `collision_light/medium/heavy`, `ambulance_hit`, `barrier_hit`, `vendor_cart_hit` |
| Xe chướng ngại đang tới, xe người chơi | Loop động cơ xe máy/ô tô/xe nặng, âm lượng theo khoảng cách; pitch xe người chơi thay theo tốc độ |
| Tàu đang băng ngang, tàu bị đâm | `train_roll_past` loop khi tới gần; `train_hit` và kết ván riêng |
| NPC đi/chạy gần xe, đón/trả khách, tài xế ngã | `npc_footsteps_wet` loop theo khoảng cách; cue một lần cho tương tác |
| Nước, ổ gà, đồ rơi, gió, cứu thương đi qua | Cue chạm theo size/chất liệu; loop nước/đồ lăn khi tiếp xúc/ở gần; cue gió/cứu thương theo tiếp cận |
| Xăng, sửa, nitro, star, nhảy, chuối, đổi xe, hết xăng, kết ván | Cue riêng cho mỗi hành động hoặc kết quả |

Simulation giữ tối đa 24 audio event có ID tăng dần để nhiều tiếp xúc trong cùng một tick không mất cue và renderer không phát lặp theo số frame. Âm ở xa nhỏ hơn; tối đa 8 one-shot đồng thời và cooldown ngắn tránh chồng dồn. Pause dừng loop; đuôi impact cuối ván vẫn được nghe. Restart xóa voice và ID của ván cũ. Browser chỉ mở âm sau thao tác bắt đầu/tiếp tục; lỗi phát âm không chặn gameplay.

Menu bắt đầu, pause và Help có âm lượng riêng cho SFX và môi trường; kéo về 0 để tắt. Mục nhạc hiển thị bị khóa vì bản này không thêm nhạc. Các lựa chọn có thể lưu trên máy nếu storage khả dụng.

## Kiểm tra và giới hạn

Test audio kiểm tra phân biệt vật liệu/loại xe, nhiều tiếp xúc cùng tick, ID không phát lặp, âm đồ rơi mới, mute và đuôi va tàu sau pause. Kết quả tự động và chơi thử trình duyệt được ghi trong phần bàn giao PR. Đây là **tự đánh giá** của Codex; người duy trì cần nghe duyệt chất âm và mức mix trên loa/tai nghe thực trước merge.

**ĐỀ XUẤT sau khi nghe duyệt:** Nếu động cơ traffic che cue nguy hiểm ở tốc độ cao, giảm gain loop traffic trước khi tăng âm cảnh báo. Kiểm tra cùng seed và xe, đặc biệt tàu/cứu thương; không đổi thời điểm sinh hazard để bù cho mix.
