# P9 storm grade — tự đánh giá vòng 3, 26/10/2026

## Hướng tham chiếu

Chủ dự án muốn bóng mây gần sắc độ bóng trang trí, chân trời cyan hòa nền trời, shop gameplay nhỏ và nổi hơn, tổng thể gần sketch `direction copy.PNG`. Đối chiếu art guide ở `origin/docs/machine-transfer-2026-10-26`, hai ảnh tham chiếu `0802320913324faaa57802684526068f.jpg` và `86de0628603d6e6313a771e8bee913b4.jpg`, cùng các review P9 trước. Đây là **tự đánh giá của Codex**, không phải art director độc lập hay phê duyệt của chủ dự án.

## Thay đổi và lý do

- GLB nhà có tên cream/ochre/warm plaster được hạ local value và pha teal vừa phải sau grade cũ. Mẫu `roadside-shop.glb` có plaster rất sáng; warm shop interior và dấu hiệu nhỏ không dùng grade này. Spotlight mặt tiền bên phải giảm cường độ và bớt vàng. Không sửa GLB nguồn hoặc Blender người dùng.
- Bóng mây xanh đậm hơn và opacity tăng, vẫn feathered và không ghi depth. Chúng là proxy trên ground/road, chưa tạo bóng thật lên vật thể đứng cao.
- Gradient nền trời giữ khoảng trên có sắc bão nhưng vùng thấp nằm gần đúng màu fog hơn. ACES exposure giảm nhẹ để tối phần midtone; gameplay accent layer giữ nguyên.
- Shop gameplay thu footprint mesh; mái tôn dốc, mặt tiền recessed, lintel và valance ấm thay silhouette hộp phẳng. Biển ấm có emissive nhẹ. Điểm tương tác, collider, reach và simulation giữ nguyên.

## Kiểm tra hình ảnh

Parent xem IAB `handling-car4&seed=14` sau patch đầu: bóng ngang đường tối rõ hơn nhưng xe/lane còn đọc; chân trời đỡ gắt, song dải cyan vẫn hơi tách nền trời; GLB phải vẫn sáng kem. Sau chỉnh cuối, parent thấy bóng mây gần sắc độ bóng cây hơn, xe/lane còn đọc, chân trời cyan hòa hơn; **GLB phải vẫn kem sáng và fog còn là dải sáng cục bộ**. Parent xem `shop&seed=14`: bản đầu còn hộp xám dù nhỏ hơn. Renderer thực tế dùng LOD `far` và xoay shop ±90° theo lề, nên phần mặt trước +Z không hiện từ camera sau xe. Sau khi thêm cửa kính tối và biển cứu hộ ấm ở cả mặt ±X, parent reload thấy shop phân biệt rõ hơn, footprint vẫn gọn. Fixture shop đặt entity x=0 nên xuất hiện giữa lane; đây là test setup, không có thay đổi placement. CUA ở phiên agent này không cung cấp browser; các quan sát IAB trên là của parent chuyển lại. Một seed city khác và `junction&seed=14` chưa được xem trực tiếp ở bản cuối. Ảnh `docs/evidence/p9-storm-mood/02-after-handling-car4-14.png` là baseline cũ, không phải ảnh kiểm patch này.

Gió hiện dùng dải mesh phẳng 9,6 × 65 m màu khác trên road (`src/render.ts`). Nó có thể bị đọc thành vùng nước hoặc đổi biome. **Đề xuất cho branch VFX gió riêng:** thay lớp màu liên tục bằng vệt gió/mưa xiên và bụi nước có hướng chuyển động, kèm cue cảnh báo hiện có; giữ nguyên vị trí, lực và timing hazard. Lượt này không sửa wind.

## Rubric art direction — tự đánh giá hiện tại

| Tiêu chí GAME_DESIGN.md | Điểm /10 | Lý do và giới hạn |
|---|---:|---|
| Silhouette/đọc hình | 7 | Xe/lane và shop sau sửa mặt hông đều đọc được ở IAB; chưa xem traffic đông/seed khác. |
| Sáng tối/tương phản | 6 | Bóng mây gần bóng cây hơn, nhưng GLB phải vẫn sáng rõ và fog có dải sáng cục bộ. |
| Màu/saturation/mood | 6 | Cyan cuối đường hòa hơn, song chưa tới chuyển sắc mềm như sketch. |
| Ngôn ngữ hình khối | 6 | Shop có mái dốc và mặt hông nhận diện; các nhà/road proxy vẫn chưa đạt nuance tham chiếu. |
| Ánh sáng/thời tiết/vật liệu | 6 | Cloud và spotlight tốt hơn ở IAB, nhưng chưa có wet reflection hoặc post pass riêng. |
| UI/typography | 7 | HUD/lane và shop cue còn đọc trong hai fixture; chưa kiểm toàn bộ popup/QTE. |
| Nhất quán phong cách | 6 | GLB kem còn sáng hơn code-native trên bên phải, dù đã grade thêm. |
| Tiếp cận/hiệu năng | 6 | Không thêm caster/pass, nhưng chưa đo FPS/P95, chế độ giảm motion hoặc readability trên thiết bị đích. |

**Mục tiêu mọi tiêu chí >7/10 chưa đạt.** Không lấy trung bình để che các mục 6. Chủ dự án cần xem bản cuối trước khi quyết định chấp nhận.

## Gate kỹ thuật và việc còn lại

Targeted test `cloud-shadows`, `art-special-hazards`, `art-storm-lighting`: 10/10 pass trên code cuối. `pnpm lint`: pass; `pnpm typecheck`: pass; `pnpm test --maxWorkers=2`: 60 file, 365/365 pass; `pnpm build`: pass, warning chunk Three.js >500 kB. `git diff --check`: pass. Manual IAB đã nêu là hai fixture do parent xem; manual gameplay đầy đủ (input, fail, restart, nhiều seed): **CHƯA KIỂM TRA THỦ CÔNG** ở phiên agent này. CI/review con người trên commit cuối: đang chờ. Chưa merge.
