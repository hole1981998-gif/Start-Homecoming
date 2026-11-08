# Review: động cơ và xi nhan rõ hơn

## Phạm vi

Feedback của chủ dự án: động cơ xe người chơi và xi nhan vẫn nhỏ, cần thêm kiểu xi nhan. Tăng gain động cơ khi chạy từ 0,72 lên 1,25, khi trôi từ 0,42 lên 0,70; xi nhan từ 0,58 lên 1,12. Giữ volume slider SFX hiện có. Tạo hai tiếng xi nhan đơn bằng ElevenLabs Sound Effects v2, giữ bản cũ thành ba kiểu. Mỗi lần bật mới chọn theo seed, tránh lặp ngay; giữ A/D hoặc rẽ QTE thì một kiểu loop liên tục, nhả hoặc hết điều kiện thì dừng. Không đổi mô phỏng, xử lý input, cân bằng hay cue hình ảnh.

Prompt, thông số và nguồn file nằm trong `project-reference/sfx/elevenlabs-indicator-2026-11-07/`. API key đọc từ file môi trường không theo Git, không nằm trong bản build.

## Kiểm tra thực tế

Base: `origin/main` `9791eab` vẫn là tổ tiên của branch; đợt này xếp sau commit âm thanh `8201775`. Revision trước commit: `8201775` + diff hiện tại. Branch: `codex/engine-indicator-clarity`.

| Gate | Kết quả |
| --- | --- |
| `pnpm lint` | Pass, exit 0 |
| `pnpm typecheck` | Pass, exit 0 |
| `pnpm exec vitest run --configLoader native --maxWorkers=2 --reporter=dot` | Pass, 79 file / 433 test, exit 0 |
| `pnpm build` | Pass, exit 0; cảnh báo chunk Three.js >500 kB có từ trước |
| `git diff --check` | Pass |

Manual: ChatGPT in-app browser, `?scenario=passenger&seed=17` trên port 5183. Bắt đầu ván, giữ A khoảng một giây: xe đổi vị trí trên làn, HUD tiếp tục cập nhật. Test âm thanh giả lập kiểm tra xi nhan bắt đầu loop khi A, không tạo loop thứ hai khi tiếp tục giữ, dừng khi nhả, và lần bật sau dùng kiểu khác. `?scenario=crash&seed=17`: thấy va chạm, HP từ 123 xuống 103, tài xế quay lại xe, nhấn Chơi lại và tài nguyên/HUD trở về đầu ván. Trang `LISTEN.html` mở được hai file mới qua điều khiển phát của browser. Browser automation không thu lại âm thanh, nên độ to và hòa âm cần nghe trên thiết bị đích.

## Tự review

**Game designer:** Đây là sửa mix, không làm đổi độ khó, RNG gameplay, tiền hoặc hậu quả va chạm. Xi nhan rõ hơn có thể hỗ trợ nhịp điều khiển. Rủi ro là xi nhan và động cơ có thể che tiếng hazard ở cảnh đông; cần chủ dự án nghe thử cùng mưa, sấm, xe và cue cảnh báo. Đề xuất nếu bị che: duck riêng engine/indicator khi hazard gần, không tăng áp lực gameplay.

**UI/UX designer:** A/D và nút rẽ Q/E vẫn có cue hình; âm thanh không phải tín hiệu duy nhất. HUD trên cảnh lái và restart đã kiểm tra, không thấy overlay mới. Chưa xác nhận bằng tai sự cân bằng giữa ba bản xi nhan, đặc biệt bản cũ có âm gốc nhẹ hơn; việc chọn lại mỗi lần bật sẽ giúp phát hiện sự lệch này trong playtest tiếp theo.
