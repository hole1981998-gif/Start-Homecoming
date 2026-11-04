# P9 — nối mặt đường ở ngã tư (tự review, 27/10/2026)

## Thay đổi và phạm vi

- Thêm mặt asphalt và hai mép đường chạy theo cung rẽ 16 m của `pathPose`, cho cả đi thẳng, Q trái và E phải. Mảnh bắt đầu/chấm dứt dưới các tile đường còn hiển thị, phủ khoảng tile cố ý ẩn ở giao lộ.
- Giao lộ ngang và đoạn đường thẳng cũ dùng màu asphalt gần mặt đường hiện hành; đường cũ vẫn hiện sau khi rẽ để bảo toàn bối cảnh.
- Chỉ đổi hình render. Cửa sổ QTE, hướng rẽ, collider, hazard, camera và balance giữ nguyên. Nhánh này dựa trên `codex/p9-cloud-shadow-values` để bản chơi có đủ chỉnh bóng mây mới; `origin/main` chưa chứa art P9.

## Kiểm tra

- Unit: `pnpm exec vitest run --configLoader native tests/art-junction-turn.test.ts tests/art-road-kit.test.ts tests/route.test.ts` pass 13/13. Test so tâm và bề rộng dải mặt đường với `pathPose` ở biên tile vào/ra cho thẳng, trái, phải; không suy từ hình model mà gameplay QTE đúng.
- Manual, ChatGPT in-app browser, `?scenario=junction&seed=14&diagnostics`: khởi đầu 705 m, xem cảnh 770 m trước cua; bấm Q hợp lệ, quan sát khoảng 795 m thấy mép đường cong và asphalt che khoảng hở; restart, bấm E hợp lệ, xem khoảng 794 m nhánh đối xứng; trường hợp không bấm đi thẳng cũng đã chạy qua ngã tư. HUD và camera tiếp tục đọc được. Sau rẽ phải, pause tại khoảng 896 m và không có console error. Ảnh giữa cua cho thấy mặt đường đơn giản, còn chỗ tinh chỉnh màu/mép so với cảnh xung quanh; đây chưa phải nghiệm thu art cuối.
- `pnpm lint`: pass, exit 0. `pnpm typecheck`: pass, exit 0.
- Lượt `pnpm test` đầu có 1 ca `special-events` hết hạn 5 giây khi nhiều worker chạy đồng thời; không có assertion sai. Chạy lại nguyên toàn bộ suite bằng `pnpm test --maxWorkers=2`: pass 62 file, 375/375 test, exit 0; không sửa test hoặc timeout.
- `pnpm build`: pass, exit 0. Vite có cảnh báo chunk Three.js lớn hơn 500 kB, không chặn build.
- `git diff --check`: pass, exit 0.
- Sau khi đối chiếu vật liệu đoạn cua với mặt đường hiện hành, đã đồng bộ material asphalt. Manual Q/E ở trên xác nhận hình nối trước chỉnh material cuối; chưa lặp lại tình huống giữa cua sau đúng lần chỉnh màu đó.

## Tự review

Game designer: không đổi luật, Q/E vẫn dùng đúng cửa sổ cũ; không có cơ sở chỉnh balance. UI/UX: cue Q/E nổi trên ngã tư và không bị mesh mới che ở ca seed14; chưa kiểm màn hình nhỏ hơn hoặc tất cả hướng tuyến. Art direction là review nội bộ Codex, không phải duyệt của chủ dự án. Đường đã có hình cung nối nhưng cần thêm QA nhiều seed, xe dài và hiệu năng thiết bị đích trước khi chấm visual >7/10.
