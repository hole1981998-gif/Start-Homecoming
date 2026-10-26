# P9 — Ánh sáng mưa bão trong gameplay, lượt kiểm 26/10/2026

## Phạm vi và bằng chứng

- Branch `codex/p9-storm-mood` nối tiếp `codex/p9-character-runtime` (`106a3e1`), chỉ chỉnh `src/art/storm-lighting.ts`. Không đổi gameplay, cân bằng, spawn, collider, asset nguồn hay HUD.
- Hạ exposure, đèn trời và vùng nắng; chuyển gradient trời và sương từ cyan tươi sang xanh đá ít bão hòa. Đèn accent riêng của gameplay giữ nguyên để xe và vật cần tương tác còn đọc được.
- Ba cặp ảnh cùng fixture/seed/viewport 540 × 960: [rừng seed 17 trước](evidence/p9-storm-mood/01-before-handling-car4-17.png) / [sau](evidence/p9-storm-mood/02-after-handling-car4-17.png), [phố seed 14 trước](evidence/p9-storm-mood/01-before-handling-car4-14.png) / [sau](evidence/p9-storm-mood/02-after-handling-car4-14.png), [nước seed 17 trước](evidence/p9-storm-mood/01-before-p8-water-17.png) / [sau](evidence/p9-storm-mood/02-after-p8-water-17.png). Thời điểm chụp xấp xỉ, không phải pixel diff từng frame.
- Trên vùng ảnh bầu trời `(80,20)–(430,170)`, giá trị sáng HSV trung bình lần lượt giảm 0,554→0,445; 0,549→0,442; 0,548→0,436. Bão hòa giảm 0,448→0,391; 0,422→0,378; 0,447→0,398. Đây là số đo trên ảnh chụp, không phải phép đo độ sáng màn hình hay khả năng nhìn của người chơi.

## Gameplay/browser đã chạy

Edge headless Windows, ANGLE D3D11 / NVIDIA RTX 2070, DEV Vite, 540 × 960. Đây là thao tác thật bằng browser automation, **không** thay playtest cảm giác lái của người. Các ca `p8-water`, `p61-train-left`, `handling-car4`, seed ghi bên dưới; không có page error.

| Kịch bản | Quan sát thực tế |
|---|---|
| `p8-water`, seed 17 | Đóng card rồi giữ W: khoảng 850→990 m; vùng nước lớn, ổ gà, xe phía trước, HUD và shop vẫn phân biệt được. Ảnh [tại 990 m](evidence/p9-storm-mood/qa-p8-water.png). Escape pause, tiếp tục, A, restart đưa về checkpoint khoảng 841 m. Cuối lượt HP 154, nhiên liệu 12,9 L. |
| `handling-car4`, seed 14 | Đóng card rồi giữ W: 24→166 m, phố và road edge còn đọc được trong ánh sáng mới. [Ảnh gameplay](evidence/p9-storm-mood/qa-handling-car4-city.png). Pause/tiếp tục, A, restart về 0 m; HP 184. |
| `p61-train-left`, seed 17 | Đóng card, giữ W: 17→343 m, không gặp va chạm tàu trong lượt này; sau restart về 0 m. Thử thêm không giữ W tới 240 m vẫn chưa gây va chạm. Vì vậy **chưa xác minh lại** màn kết ván tàu trên revision ánh sáng này. [Ảnh cuối ca](evidence/p9-storm-mood/qa-p61-train-left.png). |

`p8-water` tại 720 frame/cửa sổ 600 frame: 59,6 FPS trung bình, P95 16,9 ms, CPU render trung bình 9,92 ms, 785 draw calls, 23.733 tam giác. `handling-car4` seed 14 tại 360 frame: 58,3 FPS, P95 17,0 ms, CPU 10,43 ms, 531 draw calls, 13.382 tam giác. `p61-train-left` 960 frame/cửa sổ 600: 55,1 FPS, P95 33,3 ms, CPU 11,22 ms, 553 draw calls, 23.866 tam giác. Đây là số liệu máy hiện tại; chưa đo trên thiết bị mục tiêu, và spike ở ca tàu cần kiểm tiếp.

## Tự review sau lượt kiểm

**Game designer — dữ kiện:** không thay logic hay RNG. Fixture nước đi qua vùng hazard với các vật thể đọc được trong ảnh và browser không lỗi. Fixture tàu chưa tái hiện va chạm; không rút kết luận về timing/công bằng của tàu. **ĐỀ XUẤT:** lượt playtest người thật đo khoảng cách nhận ra nước/ổ gà dưới bóng nhà ở tốc độ trung vị và nhanh, trước khi cân bằng spawn hoặc damage.

**UI/UX designer — ưu tiên P2:** vùng nước và HUD không bị ánh sáng mới làm chìm trong ba cảnh đã xem; pause/restart phản hồi đúng. Cảnh báo/QTE ở vận tốc cao, camera cua, màn nhỏ ngoài 540 × 960 và lựa chọn giảm animation chưa được người chơi thực kiểm. Chưa có audit Product Design bằng screenshot vì công cụ browser/UI chuyên dụng không khởi tạo được; đây là checklist thủ công từ ảnh và thao tác Edge.

**Art direction — Codex tự chấm sơ bộ trên ảnh và browser nêu trên, không phải review độc lập:**

| Tiêu chí | Điểm /10 | Lý do và giới hạn |
|---|---:|---|
| Silhouette/đọc hình | 6 | Xe, hành khách, nước và ổ gà tách hình ở các cảnh đã chụp; chưa kiểm tất cả biome. |
| Sáng tối/tương phản | 6 | Trời tối hơn, đường và vật thể còn đọc được; bóng nhà tại tốc độ cao chưa thử với người. |
| Màu/saturation/mood | 6 | Vùng trời giảm sáng và bão hòa có số đo ảnh; chưa đối chiếu màn thiết bị đích. |
| Ngôn ngữ hình khối | 6 | Low poly nhất quán ở scene đang dùng; model nguồn vẫn có mức chi tiết khác nhau. |
| Ánh sáng/thời tiết/vật liệu | 6 | Trời, sương và nguồn sáng đồng bộ hơn với mưa bão, mặt đường vẫn tách với nước; phản xạ ướt còn mờ. |
| UI/typography | 6 | Chữ HUD và icon chính còn đọc được trong ảnh 540 × 960; cần thử thiết bị thật. |
| Nhất quán phong cách | 6 | Nhân vật, xe và cảnh quan cùng hướng low poly trong ba fixture; chưa đủ năm biome. |
| Tiếp cận/hiệu năng | 6 | Browser Edge có FPS/P95 ở các cảnh nêu trên, không page error; chỉ đại diện máy RTX 2070, chưa đảm bảo thiết bị đích. |

Không có tiêu chí dưới 6 trong **tự đánh giá giới hạn trên các cảnh đã kiểm**. Điều này chưa thay thế duyệt của chủ dự án cho art integration cuối, review trên thiết bị đích hoặc playtest người thật. Các điểm 6 chỉ là ngưỡng tối thiểu, không phải kết luận chất lượng hoàn chỉnh.

## Gate và bàn giao

Windows, Node 24.14.0, pnpm 11.25.0. Chạy tuần tự trên mã cuối: `pnpm lint` exit 0; `pnpm typecheck` exit 0; `pnpm test` exit 0 (59 files, 354 tests); `pnpm build` exit 0. Vite cảnh báo chunk Three.js >500 kB. CI trên commit cuối: chờ. Review con người: chờ. Merge: không thực hiện.
