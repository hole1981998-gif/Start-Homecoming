# P9 — gộp cảnh tĩnh ở đoạn cua

Ngày 26/10/2026. Tiếp tục từ `origin/codex/p9-landscape-lighting` (`24b9df7`), đã chứa tám commit P9 trước đó. Đây là tự kiểm của Codex, chưa phải duyệt art direction của chủ dự án.

## Thay đổi và phạm vi

`optimizeNearScenery` nay gộp mesh tĩnh cùng vật liệu trên toàn đoạn cua 96 m, thay vì gộp riêng từng mảnh 4 m. Tọa độ của từng mảnh được bake vào mesh mới; cụm không chuyển động độc lập. Cảnh thẳng vẫn gộp theo từng prop như trước. Không đổi đường chạy, collider, spawn, RNG gameplay, input hay ánh sáng.

## Kiểm tra

- Bài kiểm `tests/art-scenery.test.ts` giữ bounding box trước/sau gộp trong sai số 0,001 m, kiểm khoảng trống nhánh rẽ Q/E và xác nhận số mesh đoạn cua giảm hơn một nửa. Các mảnh nền dùng chung vật liệu từ nhiều drawables còn một.
- In-app browser, `/?scenario=junction&seed=14&diagnostics`: bấm Bắt đầu lái, thấy cue Q/E; nhấn Q tại khoảng 788 m, HUD hiện “ĐÃ CHỌN TRÁI”; qua khoảng 856 m, đường phía trước và lề hai bên không bị cảnh cắt vào. Ở khoảng 1.562 m, DOM diagnostics ghi 60,0 FPS, P95 16,8 ms, CPU render trung bình 5,52 ms, 428 draw calls. **Mẫu này không ở ngay đoạn cua**, nên không dùng nó làm số đo cải thiện trước/sau.
- Windows local: `pnpm lint` exit 0; `pnpm typecheck` exit 0; `pnpm test --maxWorkers=2` exit 0, 60 file / 362 test; `pnpm build` exit 0. Sau khi siết assertion mesh, riêng `tests/art-scenery.test.ts` chạy lại 17/17 pass. Build vẫn cảnh báo chunk Three.js trên 500 kB.

## Tự review sau lượt chơi

- **Game design:** dữ kiện là Q chọn trái đúng trong fixture và khoảng trống đường không đổi theo test hình học. Nhận định: gộp cảnh không đổi nhịp hay công bằng của giao lộ. Chưa có bằng chứng thời gian phản ứng của người chơi ở nhiều seed; không đề xuất đổi QTE.
- **UI/UX:** cue rẽ và vạch làn nhìn được trong lượt seed 14. Cần kiểm tiếp E, màn hình nhỏ hơn và hazard trùng mảng bóng trong bài QA nhiều seed; ảnh tĩnh không chứng minh cảm giác điều khiển.
- **Art/hiệu năng:** việc giảm mesh có thể hạ draw calls tại đoạn cua, nhưng chưa có phép đo cùng vị trí trước/sau trên cùng thiết bị. Bóng của mesh đã gộp cần xem lại tại nhiều góc cua. Chưa nâng điểm art direction hoặc khẳng định đạt hiệu năng thiết bị đích.

CI trên revision cuối và review con người: chưa kiểm. Merge: chưa thực hiện.
