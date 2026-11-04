# P9 — chân trời cyan hòa với đường (27/10/2026)

## Feedback và thay đổi

Chủ dự án chỉ ra dải trắng sáng tại khoảng 1,958 m trong ảnh gửi ngày 27/10: bầu trời bị tách khỏi đường. Ý định là gradient xanh xám của **nền trời** chuyển dần về cyan gần màu mặt đường tại vùng spawn chướng ngại, không phải thêm một vệt sáng phủ lên khung hình.

Đưa vùng giữa sky gradient và màu fog về cùng `#6b9094`, với các stop lân cận chuyển mềm từ xanh xám đậm sang cyan trầm. Bỏ hoàn toàn veil/glow theo tọa độ màn hình trong post-processing. Giữ split-tone bóng, đèn, vật liệu, HUD và gameplay như cũ. Base là `ad40ee2` trên chuỗi P9 chưa merge `main`.

**Sửa tiếp theo feedback:** ảnh crop của chủ dự án cho thấy bản `ed2c141` còn một ranh tối ngay phía trên đường. Từ ảnh và vị trí các stop, Codex suy luận màu khớp fog ở `.50` đến quá thấp so với chân trời được render. Đưa cyan khớp fog lên từ stop `.20` và giữ qua `.58`, đồng thời cho phần xanh xám phía trên chuyển mềm vào vùng đó. Không đưa dải glow trắng trở lại.

## Kiểm tra thực tế

- ChatGPT in-app browser, `?scenario=junction&seed=14&diagnostics`: bắt đầu ván ở khoảng 707 m. Trời xuống cyan trầm ở đường chân trời, mặt đường xa hòa vào fog; không còn vệt trắng ngang màn hình. Xe máy, vạch và chướng ngại xa còn đọc được. Đây là Codex tự quan sát, không phải duyệt art của chủ dự án.
- Cùng browser, `?scenario=stress&seed=14&start=1950&diagnostics`: khoảng 1947 m, gần mốc ảnh feedback. [Ảnh bản đầu còn ranh tối](evidence/p9-cyan-horizon/stress-seed14-1945.png); [ảnh sau sửa stop gradient](evidence/p9-cyan-horizon/stress-seed14-seam-correction.png). Cyan của trời đi xuống vùng fog đường xa mà không tạo vệt trắng; xe container, traffic và vạch đường còn phân biệt được. Fixture stress dùng xe và mật độ chướng ngại không cân bằng, chỉ dùng để xem màu tại quãng đường này.
- Ở fixture stress, xe va chạm mất 38 HP và tài xế rời xe; bấm Chơi lại đưa quãng đường về 1944 m, xăng 45 L và HP 300 như ban đầu. Sau đó W/A vẫn nhận input, nhưng va chạm kế tiếp xảy ra rất nhanh do mật độ fixture. Ván kết thúc do tàu tại 1957 m; modal kết quả hiện đúng.
- Chưa đo GPU yếu, chưa xem đủ mọi vùng cảnh quan. Không thay logic gameplay.

## Gate và tự review

Windows, pnpm 11.25: `pnpm lint` exit 0; `pnpm typecheck` exit 0; `pnpm test --maxWorkers=2` exit 0 (63 file, 384 test); `pnpm build` exit 0. Build còn cảnh báo chunk Three.js >500 kB.

Điểm tự chấm 7/10 của bản đầu **không còn hợp lệ** vì chủ dự án thấy ranh tối. Ở ảnh sau sửa, Codex thấy ranh này giảm và cyan gần đường hơn, nhưng chưa gán điểm mới trước khi chủ dự án xem trên màn hình đích. Chưa đủ bằng chứng để gọi art direction đạt. Game designer: không đổi spawn/timing/RNG. UI/UX: HUD và cue ở hai cảnh vẫn đọc được; cần chủ dự án chốt cảm giác sương và tương phản.
