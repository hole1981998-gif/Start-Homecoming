# P9 — bóng mây và chân trời (Codex tự review, 27/10/2026)

## Phạm vi

- Tăng tần suất bóng mây trang trí bằng cách giảm bước rải 58 m xuống 39 m và giữ 8 patch quanh camera. Hash art vẫn tách khỏi RNG gameplay; không đổi collider hay hazard.
- Chuyển bầu trời từ mây xanh đá tối tới lớp sáng ấm, ít bão hòa ở chân trời; fog lấy cùng màu vùng xa.
- Pass màu cảnh 3D làm bóng xanh đá sâu hơn và thêm dải sương sáng mờ ngay đường chân trời. HUD HTML, cảnh báo và QTE không đi qua pass này. Nguồn tham chiếu là `assets/art/storm-sky-study.png`; không ghép ảnh đó thành asset game.
- Base là `0598145` trên chuỗi P9 chưa merge vào `origin/main`; nhánh này cần được review theo thứ tự chuỗi.

## Bằng chứng hiện có

- Edge headless, 540 × 960, `?scenario=junction&seed=14&diagnostics`: [ảnh giao lộ](evidence/p9-horizon-cloud-grade/junction-seed14.png), khoảng 767 m, không có page error. Đường ở xa hòa vào dải sương; làn và xe gần camera còn rõ. Giữ W đi 735→767 m, A đổi hướng; Escape mở pause, tiếp tục rồi restart về checkpoint 705 m.
- Cùng browser, `?scenario=p8-water&seed=17&diagnostics`: [ảnh vùng nước](evidence/p9-horizon-cloud-grade/p8-water-seed17.png), khoảng 884 m. Giữ W đi 859→886 m, A đổi hướng; vùng nước và traffic vẫn phân biệt được dưới bóng, card lần đầu được đóng trước khi tiếp tục. Pause/tiếp tục rồi restart về checkpoint 841 m. Không có page error. Đây là Codex tự quan sát ảnh và chạy browser, chưa phải playtest của người trên thiết bị đích.
- Test cloud placement giữ deterministic theo seed, patch vẫn không có collider và khoảng cách ngắn hơn.

## Gate trên mã cuối

Windows, Node 24, pnpm 11.25. `pnpm lint` pass/exit 0; `pnpm typecheck` pass/exit 0; `pnpm test --maxWorkers=1` pass/exit 0 (63 file, 380 test); `pnpm build` pass/exit 0. Build còn cảnh báo bundle Three.js >500 kB.

## Tự review theo GAME_DESIGN.md

| Tiêu chí | Điểm /10 | Căn cứ và giới hạn |
|---|---:|---|
| Silhouette/đọc hình | 6 | Xe và vạch gần camera rõ trên ảnh giao lộ; vật thể xa chủ ý chìm trong sương. |
| Sáng tối/tương phản | 6 | Mảng bóng nhiều hơn, tiền cảnh vẫn có vạch trắng; chưa thử mọi hazard dưới bóng. |
| Màu/saturation/mood | 7 | Mây xanh đá đậm và khe sáng chân trời gần ảnh tham chiếu hơn; chỉ chấm trên cảnh đã xem. |
| Ngôn ngữ hình khối | 6 | Không thay hình khối low poly. |
| Ánh sáng/thời tiết/vật liệu | 6 | Fog, nền trời và màu hậu kỳ hòa hơn trên ảnh; mưa và vật liệu không đổi. |
| UI/typography | 6 | HUD và chỉ dẫn Q/E rõ ở ảnh 540 × 960. |
| Nhất quán phong cách | 6 | Grade dùng chung cho cảnh game; chưa duyệt đủ mọi biome. |
| Tiếp cận/hiệu năng | 6 | Chỉ thêm 3 draw calls bóng mây; chưa đo máy GPU yếu. |

Điểm là tự đánh giá trong phạm vi bằng chứng trên, không phải phê duyệt art direction cuối của chủ dự án.

## Review gameplay/UI sau kiểm tra

- **Game designer — dữ kiện:** chỉ đổi hình ảnh, không đổi spawn, timing, RNG, damage. **ĐỀ XUẤT:** cho người chơi thử hazard ở tốc độ cao đúng trong mảng bóng lớn để xác nhận cue vẫn công bằng, trước khi cân bằng lại bóng.
- **UI/UX designer — ưu tiên P2:** dải sương có thể làm NPC nhỏ ở xa khó nhận hơn; cần kiểm thời điểm cảnh báo trong nhiều biome và màn hình nhỏ hơn. Ảnh tĩnh không chứng minh input/timing.
