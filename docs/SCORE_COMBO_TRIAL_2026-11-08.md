# Bản thử nhịp nhặt điểm — 08/11/2026

- Nền `origin/main` e0eb3f4, cộng bản chơi thử b8db2b0; nhánh `codex/score-combo-rotating`. Config `score-combo-trial-4`. `ver.noforce` không đổi quy tắc điểm hoặc hình điểm.
- Phí ổ gà trở lại 10. Mỗi dải tám mốc dùng một lane count có trọng số 85/10/5 cho một/hai/ba làn. Hazard không bị loại khỏi đường điểm.
- Viên điểm quay 0,7 rad/s quanh trục đứng, không đổi vị trí/hitbox. Âm cue dự phòng là clip `ui_soft_select.mp3` đã được ElevenLabs Sound Effects v2 tạo ngày 06/11; mỗi mốc liên tiếp tăng độ cao, sau nấc tám giữ nguyên; bỏ lỡ mốc tiếp theo reset. Cùng mốc nhiều làn có thể nhận nhiều điểm, chỉ một âm. SFX mới được yêu cầu nhưng dịch vụ báo bận, không tạo hay thu phí; cần thay clip khi ElevenLabs sẵn sàng.

## Kiểm tra và tự review

- `pnpm lint`: pass; `pnpm typecheck`: pass; `pnpm build`: pass. Toàn bộ `pnpm exec vitest run --configLoader native --maxWorkers=4 --reporter=dot`: 81 file, 449 test pass.
- Test mô phỏng score khẳng định chuỗi một âm/mốc, reset sau mốc trượt, nấc cao nhất giữ nguyên; test âm xác nhận asset ElevenLabs và playback rate đầu/cuối. Test ổ gà dài khẳng định tiền trừ một lần ở mức 10.
- Trình duyệt in-app, seed 17, bản chính: bắt đầu, giữ W, đánh A vào dải điểm một làn; HUD 0→87 điểm ở khoảng 370 m, camera và tài nguyên cập nhật; screenshot cho thấy viên điểm nổi còn đọc được cạnh vũng nước và traffic. Đã để sẵn URL mới ở màn bắt đầu. Công cụ không cho nghe âm đầu ra; cảm giác “satisfying” và độ cao nấc phải được chủ dự án nghe thử. Screenshot đơn không chứng minh tốc độ quay; giá trị quay được kiểm tra từ code và build. Chưa tự chơi đến thất bại/restart hoặc so sánh nhiều seed trong trình duyệt lượt này; test simulation bao phủ reset ván và nhiều seed.
- **Game design — dữ kiện:** tỉ lệ lane nhiều giảm từ 30% xuống 15%; số điểm mỗi viên và khoảng cách mốc giữ nguyên. **Nhận định:** người chơi phải chủ động theo một đường điểm rõ hơn, nhưng có thể thấy ít cơ hội chọn giữa hai/ba làn. Đề xuất chỉ cân bằng tiếp sau khi chủ dự án chơi thử nhiều seed và cho biết mức tập trung/ham nhặt điểm.
- **UI/UX — dữ kiện:** viên điểm quay chậm, không thêm vòng nền hay tăng diện tích. **Nhận định:** chuyển động tăng khả năng nhận biết ở vùng tối nhưng cần kiểm tra trực tiếp khi có mưa, đông chướng ngại và tại tốc độ cao. Âm cũ dùng tạm có thể chưa đủ cảm giác thỏa mãn; cần nghe thử trong game.
