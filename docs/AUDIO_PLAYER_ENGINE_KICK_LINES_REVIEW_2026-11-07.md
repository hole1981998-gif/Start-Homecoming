# Review âm thanh: động cơ, thời tiết và thoại đá khách

## Phạm vi

- Tăng gain riêng của động cơ xe người chơi khi chạy và khi trôi.
- Tăng sấm rền xa và nhạc nền chung; giữ mức mưa và điều khiển âm lượng của từng nhóm.
- Ghép bốn bản thu do chủ dự án giao vào sự kiện G cho khách xuống xe. Mỗi lần chọn một câu theo seed, tránh lặp liền, và phát đồng thời với tiếng hét hành khách. Tăng riêng bản `kick_line_01` vì chủ dự án báo âm gốc thấp.

Đây là chỉnh âm lượng và gắn âm thanh đã được chủ dự án yêu cầu; không đổi mô phỏng, giá trị cân bằng, hoặc điều kiện thắng thua.

## Kiểm tra

Revision trước commit: `55d3d37` + diff hiện tại. Branch: `codex/player-engine-kick-lines`, từ `origin/main` `9791eab` và tích hợp branch âm thanh trước đó `codex/train-horn-indicator-variation`.

| Kiểm tra | Kết quả |
| --- | --- |
| `pnpm lint` | Pass, exit 0 |
| `pnpm typecheck` | Pass, exit 0 |
| `pnpm exec vitest run --configLoader native --maxWorkers=2 --reporter=dot` | Pass, 79 file / 432 test, exit 0 |
| `pnpm build` | Pass, exit 0; Vite nhắc chunk Three.js >500 kB, đã có từ trước |
| `git diff --check` | Pass |

Lượt đầu chạy đồng thời lint, typecheck, test, build khiến hai test giao diện quá 5 giây và toàn bộ test fail (430/432 pass); chạy lại riêng toàn bộ suite với hai workers đã pass 432/432. Không sửa timeout hoặc bỏ test.

## Chơi thử và tự review

**Browser:** ChatGPT in-app browser, `http://127.0.0.1:5183/?scenario=passenger&seed=17`, ngày 07/11/2026. Bắt đầu ván, quan sát HUD tốc độ, xăng, HP; thử W và thấy tốc độ tăng. Reload, nhấn F ngay sau khi bắt đầu: số người tăng từ 1/2 lên 2/2, xuất hiện xác nhận đón khách. Nhấn G: số người về 1/2, xuất hiện xác nhận cho khách xuống. Cảnh lái và HUD tiếp tục chạy. Test âm thanh giả lập xác nhận mỗi lần G có một tiếng hét và một trong bốn câu mới được phát, hai kênh không cắt nhau. Không có thiết bị thu âm/đo loudness từ browser trong phiên này, nên mức to và chất lượng hòa âm cần chủ dự án nghe trên thiết bị đích.

**Tự review góc game designer:** G không đổi hậu quả hoặc phần thưởng nên không làm lệch độ khó, RNG gameplay hoặc chiến thuật. Động cơ rõ hơn hỗ trợ cảm giác tốc độ; sấm xa cao hơn có thể tăng kịch tính nhưng không được lấn cảnh báo quan trọng. Đề xuất sau khi nghe bản thật: nếu cảnh đông xe che tiếng cảnh báo, giảm gain nền hoặc duck riêng khi cảnh báo, kiểm tra trên seed 17 và một route đông xe.

**Tự review góc UI/UX:** F/G có biến động rider count và toast tương ứng; sự kiện vẫn hiểu được khi tắt tiếng. Thanh chỉnh riêng Hiệu ứng, Mưa và gió, Nhạc nền vẫn hiện ở màn bắt đầu. Chưa kiểm tra trực tiếp cảm giác nghe tại các mức slider thấp và khi thoại chồng sấm; nên thử lại bằng tai trước khi khóa mix cuối.

**Giới hạn:** Chưa khẳng định bản thu đã cân loudness hoàn toàn bằng tai hay bằng LUFS. Bản `kick_line_01` được tăng gain riêng theo feedback của chủ dự án. Chưa kiểm tra thủ công thất bại/restart trong vòng này vì thay đổi chỉ ở âm lượng và sự kiện G; test tự động bao phủ hồi quy game.
