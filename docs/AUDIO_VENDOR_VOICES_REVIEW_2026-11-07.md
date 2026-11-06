# Review: thoại khi tông xe hàng rong

## Thay đổi

Chủ dự án giao ba bản thu Can Cau. Khi xe người chơi va chạm xe hàng rong, game chọn một câu theo seed, tránh lặp ngay; tiếng va chạm xe hàng rong hiện có vẫn phát. Rào và xe cứu thương không dùng các câu này. Không đổi spawn, va chạm, sát thương, tiền hoặc khả năng điều khiển.

File nguồn và thứ tự mapping ghi tại `project-reference/sfx/owner-vendor-voices-2026-11-07/README.md`; trang `LISTEN.html` cho nghe riêng từng file. Không gọi ElevenLabs API vì dùng trực tiếp bản thu do chủ dự án cung cấp.

## Kiểm tra

Branch `codex/vendor-collision-voices`, xếp sau commit `65f1b0b`; `origin/main` `9791eab` là tổ tiên. Revision trước commit: `65f1b0b` + diff hiện tại.

| Gate | Kết quả |
| --- | --- |
| `pnpm lint` | Pass, exit 0 |
| `pnpm typecheck` | Pass, exit 0 |
| `pnpm exec vitest run --configLoader native --maxWorkers=2 --reporter=dot` | Pass, 79 file / 433 test, exit 0 |
| `pnpm build` | Pass, exit 0; Vite vẫn nhắc chunk Three.js >500 kB |
| `git diff --check` | Pass |

Test âm thanh giả lập 12 lần đụng hàng rong: cả ba file được chọn, không lặp câu liên tiếp, không phát thêm khi update cùng sự kiện, không phát ở rào/cứu thương. Bản build chứa đủ ba MP3.

Manual: ChatGPT in-app browser, `?scenario=p8-vendor&seed=17` trên port 5183. Bắt đầu, giữ W, tới khoảng 80 m thì xe va hàng rong, tài xế rời xe, HUD hiện trạng thái ngã/đang quay lại và toast hậu quả. Chọn Chơi lại: tốc độ, điểm, quãng đường, tiền và tài nguyên về đầu ván. Trang nghe thử tải đủ ba file, điều khiển audio phát được bản đầu. Browser automation không thu lại âm để xác nhận nội dung hoặc mức hòa âm bằng tai.

## Tự review

**Game designer:** Chỉ bổ sung phản hồi cho sự kiện có sẵn; độ khó, RNG gameplay và tính công bằng giữ nguyên. Tiếng thoại có thể làm va chạm hàng rong dễ nhớ hơn. Đề xuất nghe thử vài seed/cỡ xe để kiểm tra có bị nhạc/mưa hoặc tiếng kim loại che, rồi chỉnh mix nếu cần; không thay đổi cơ chế.

**UI/UX designer:** Trạng thái tài xế ngã và toast vẫn hiện, nên hậu quả đọc được khi tắt âm. Không có overlay mới. Cần nghe trực tiếp để xem thoại có chồng tiếng va chạm khiến thông tin trở nên rối hay không.
