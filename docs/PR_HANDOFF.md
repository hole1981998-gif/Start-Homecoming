# PR draft — Prototype 1: playable driving foundation

Thay đổi và lý do: Tạo nền game Three.js/TS/Vite để chủ dự án thử input/camera trên đường ba làn, trước khi thêm kinh tế và hazards. Simulation fixed step thuần dữ liệu, config có validation, HUD, pause/help/restart và test. Camera theo hết biên ngang sau khi playtest phát hiện xe bị cắt.

Phạm vi / quyết định đề xuất đã áp dụng: Placeholder primitive, không art/SFX final; số lái tạm ở config p1.1. Thả W giữ tốc độ, S hãm tới min, không lùi. Chưa có tài nguyên/score/economy/win/loss. Không đổi các con số economy nguồn.

Branch và commit code: `feature/prototype-1-driving`, `5b3ec91`. Commit kế tiếp chỉ thêm report/log/evidence bàn giao. Local main có empty baseline, chưa có remote main; không thể fetch hoặc tạo PR/CI từ xa.

Lint: `pnpm lint`, exit 0, pass.

Typecheck: `pnpm typecheck`, exit 0, pass.

Tests: `pnpm test`, exit 0, 8/8 pass; 3 seed × 20 phút simulation, determinism seed 42, nhiều FPS, input/UI/blur/restart.

Build: `pnpm build`, exit 0, pass, production JS `index-CsQXXHv8.js`.

Môi trường: Windows 10.0.22621, Node 24.19.0, pnpm 11.25.0. Chi tiết và log trong PROTOTYPE_1_REVIEW.md và checks/.

Manual: in-app browser, start/WASD/camera hai phía/S, pause/Help/resume/restart và viewport 640×600 đã thử. Tab/Alt+Tab trong browser desktop thông thường CHƯA KIỂM TRA THỦ CÔNG; tool IAB mở tab không tạo visibilitychange như browser thông thường. Blur handler và xóa phím giữ có test DOM. Failure N/A trong P1.

CI trên commit cuối: chưa chạy, vì chưa có remote. Có workflow check thật để chạy khi đưa lên repo.

Giới hạn/rủi ro: Chưa chứng minh độ vui, economy hay mọi seed; chưa test nhiều GPU/browser. FPS đo trên một môi trường ~60, p95 16,9 ms. Phép tính tĩnh economy tạm cho thấy cần 30 km kiếm phần tiền thiếu mua ô tô nếu chưa có khách/chi tiêu; đã hỏi ý kiến mục tiêu thời gian, chưa tự chỉnh balance.

PR URL: CHƯA TẠO, chưa push. Patch và source ZIP được chuẩn bị trong outputs để review khi thiếu remote.

Review con người: đang chờ chủ dự án chơi thử và phản hồi.

Merge: CHƯA MERGE. Không auto-merge; cần gates/manual còn thiếu và phê duyệt revision hiện tại.
