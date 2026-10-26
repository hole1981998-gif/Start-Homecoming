# P9 — bản tích hợp art và animation (tự review, 26/10/2026)

Nhánh này bắt đầu từ `codex/p9-city-depth` (`2110bdd`) rồi đưa hai commit animation đã push riêng (`d154cfe`, `c556c09`) vào bằng cherry-pick, không sửa file Blender người dùng. Mục đích là có một bản chơi chứa đồng thời các vòng palette/lighting/fog/shop/gió và tài xế Blender khi tai nạn, cùng hướng đi của khách ven đường. Không đổi balance, collider, nhịp sự kiện hoặc roster.

## Gate trên revision tích hợp

- `pnpm lint`: pass, exit 0.
- `pnpm typecheck`: pass, exit 0.
- `pnpm test --maxWorkers=2`: 61 file, 370/370 test pass, exit 0.
- `pnpm build`: pass, exit 0; warning chunk Three.js trên 500 kB vẫn có.
- Targeted `art-runtime-people`, `art-wind-streaks`, `art-storm-lighting`: 14/14 pass.
- `git diff origin/codex/p9-city-depth...HEAD --check`: pass trước commit review này.

## Kiểm tra thủ công

IAB/Windows, `passenger-crash-car&seed=17&diagnostics`: bắt đầu 4/4 người, va ở khoảng 14 m làm HP 184→164, thấy tài xế/khách ngoài xe và cue quay lại, sau đó tài xế cùng một phần khách trở lên xe (2/4 ở 35 m). Tạm dừng ở 120 m, chơi lại về 0 m, 4/4 người, xăng 13 L và HP 184. Camera sau, HUD và cảnh báo vẫn hoạt động. Ảnh tĩnh không chứng minh được chất lượng mọi frame chuyển tư thế hoặc toàn bộ pose người.

Các nhánh nguồn đã kiểm riêng `handling-car4 seed14`, `junction seed14`, `shop seed14`, `p62-wind-right/left seed17`, `p8-encounter-c3-refinement-1 seed17`; chi tiết trong review tương ứng. Trên revision tích hợp chưa chơi lại hết các fixture đó; targeted tests và build không thay thế manual cho mọi kịch bản. Chưa đo FPS/P95 hay xem trên thiết bị đích.

## Tự review game design và UI/UX

**Dữ kiện:** animation lấy thời gian simulation; crash/restart không tạo entity thừa trong test và fixture đã xem. VFX gió giữ HUD cảnh báo trước vùng, mặt đường không bị phủ màu. **Nhận định game design:** mối nguy vẫn đọc được, nhưng cần playtest người thật để đánh giá phản ứng ở vùng gió không có mép màu và cảm giác trở lại xe. Không áp dụng cân bằng mới.

**UI/UX:** HUD, cue tai nạn và nút pause/restart còn đọc ở viewport IAB; một số khách nhỏ trong khung 9:16. Ưu tiên kiểm trên điện thoại thật và trong tình huống nhiều hazard cùng lúc. Tự đánh giá art direction vẫn **6–7/10**, chưa đạt mục tiêu mỗi tiêu chí >7; dãy GLB phải sáng đều, mép terrain ở junction và chất lượng pose NPC vẫn là việc còn lại. Không có review con người/CI trên revision tích hợp; chưa merge.
