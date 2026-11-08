# Review: thoại va chạm dân phòng và công an

## Phạm vi

Chủ dự án giao sáu bản thu: ba bản Lâm cho dân phòng, ba bản Hào cho công an. Game phát một câu thuộc đúng nhóm khi **xe người chơi va chạm** NPC đó. Các câu chọn theo seed, tránh lặp ngay; âm va chạm đang có tiếp tục phát. Khi dùng chuối để né, không phát thoại hoặc âm va chạm người. Không thay luật phạt, tịch thu xe, spawn hay cân bằng.

Nguồn và mapping từng file được ghi tại `project-reference/sfx/owner-officer-voices-2026-11-07/README.md`; `LISTEN.html` cho nghe từng file. Không gọi ElevenLabs API vì dùng trực tiếp các bản thu chủ dự án cung cấp.

## Kết quả kiểm tra

Branch `codex/officer-collision-voices`, xếp sau commit âm thanh `5481321`; `origin/main` `9791eab` là tổ tiên. Revision trước commit: `5481321` + diff hiện tại.

| Gate | Kết quả |
| --- | --- |
| `pnpm lint` | Pass, exit 0 |
| `pnpm typecheck` | Pass, exit 0 |
| `pnpm exec vitest run --configLoader native --maxWorkers=2 --reporter=dot` | Pass, 79 file / 433 test, exit 0 |
| `pnpm build` | Pass, exit 0; Vite vẫn báo chunk Three.js >500 kB |
| `git diff --check` | Pass |

Test âm thanh giả lập kích hoạt 12 va chạm của mỗi loại: dùng đủ ba bản đúng nhóm, không lặp liền, và không phát thêm khi dùng chuối. Trường hợp công an kết ván cũng vẫn phát thoại do sự kiện âm thanh được xử lý trước trạng thái kết ván.

Manual trong ChatGPT in-app browser, seed 17, port 5183:

- `?scenario=events-militia&seed=17`: bắt đầu, qua card lần đầu, giữ W; tới vị trí dân phòng, tiền giảm từ 200 còn khoảng 0,8. HUD vẫn cập nhật và xe tiếp tục chạy.
- `?scenario=events-police&seed=17`: giữ W tới công an; tiền giảm, xe máy bị tịch thu và chuyển sang ô tô dự phòng. Nhấn Chơi lại: xe máy, tiền 200, xăng/HP và điểm trở về đầu ván.
- Trang nghe thử mở đủ sáu file. Browser bật được một bản Lâm và một bản Hào bằng điều khiển audio. Không có thiết bị thu âm từ browser automation để xác nhận độ to và nội dung lời bằng tai; cần chủ dự án nghe trên máy đích.

## Tự review

**Game designer:** Chỉ thêm âm cho hậu quả đã tồn tại; tiền phạt và cách né không đổi. Việc tách chuối khỏi va chạm giữ tín hiệu đúng nguyên nhân. Rủi ro: thoại công an có thể chồng tiếng chuyển xe/tịch thu và bị che; thử nghe cảnh `events-police` với mưa/nhạc ở mức mặc định.

**UI/UX designer:** Hai loại NPC vẫn có cue cảnh và biến động tiền/xe; âm thanh không là tín hiệu duy nhất. Cảnh công an khi chuyển xe và restart đã kiểm tra, không có overlay mới. Chưa đánh giá định lượng mức thoại so với va chạm và mưa trên loa/tai nghe thật.
