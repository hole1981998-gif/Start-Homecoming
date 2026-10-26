# P9 city depth — tự đánh giá vòng 4, 26/10/2026

## Mục tiêu và nguồn

Mục tiêu của chủ dự án: dãy GLB bên phải bớt kem sáng, vùng cuối đường cyan hòa bầu trời và mood gần sketch `direction copy.PNG` cùng hai reference P9. Đối chiếu art guide ở `origin/docs/machine-transfer-2026-10-26`, các review P9 lighting/palette/storm-grade và material thật trong `roadside-midrise.glb`, `roadside-shop.glb`, `corner-market.glb`. Đây là **tự đánh giá của Codex**, không phải review độc lập hoặc phê duyệt art cuối.

## Kiểm nguyên nhân và thay đổi

GLB lưu base color dạng tuyến tính. Sau grade vòng trước, khi đổi sang sRGB, `midrise ivory columns` vẫn khoảng `#c1b49d`, `sunlit cream plaster` khoảng `#c5b797` và `pale_metal` khoảng `#b3b3b3`. Chúng chiếm các mặt lớn ở dãy gần, nên đổi palette nhà code-native không ảnh hưởng. Lượt này chỉ đặt local target mát/tối hơn cho ba vật liệu ấy trên bản clone runtime. Material nguồn, mái, biển, kính và interior ấm không đổi. `gradeStormCityBuilding` vẫn chạy một lần và không làm bẩn GLB cache.

Fog và sky dùng cùng `#6b9094` ở khoảng gradient thấp rộng hơn; fog bắt đầu 48 m và kết thúc 125 m thay vì 43–108 m. Ý định là làm dải cyan cuối đường mịn hơn, đồng thời giữ silhouette nhà xa. Không thêm post-processing pass, không đổi exposure/key light hoặc road shadow đã được chủ dự án nhận xét tốt. Junction có một vạch xám/nâu gần horizon, có thể là mép địa hình; nhánh lighting này không sửa terrain.

## Kiểm cảnh thật và giới hạn

Parent kiểm IAB `handling-car4&seed=14&diagnostics`: sau chỉnh vật liệu lần đầu, dãy phải bớt gắt nhẹ nhưng tầng trên vẫn kem; shop/biển ấm còn sống. Sau fog patch, chân trời hòa trời rõ hơn, road xa vẫn đọc và cyan dịu. Sau local target mát/tối cuối, cột/đốm sáng giảm nhưng toàn mặt tiền phải vẫn ấm sáng so với trái trong camera 9:16. Parent cũng xem `junction&seed=14&diagnostics` khoảng 708 m: nhà phải sáng kem và có vạch ngang xám/nâu cuối đường. Vì vậy **không gọi vấn đề GLB phải đã sửa xong**. Lượt sau cần kiểm pass shading/ánh sáng riêng cho mặt đường phố, có thể phân vùng nhận key light theo mặt hoặc làm asset light-mask, rồi đối chiếu bóng road trước/sau; hạ toàn bộ material thêm sẽ làm mất điểm ấm.

CUA ở phiên agent này không cung cấp browser. Mọi quan sát IAB trên là parent trực tiếp xem và chuyển lại; không có ảnh sau chỉnh được lưu. Chưa kiểm thao tác input/fail/restart trong phiên này, chưa đo FPS/P95 và chưa thử nhiều seed ngoài hai fixture.

## Rubric art direction — tự đánh giá hiện tại

| Tiêu chí GAME_DESIGN.md | Điểm /10 | Bằng chứng và giới hạn |
|---|---:|---|
| Silhouette/đọc hình | 7 | Xe/lane và nhà xa còn đọc trong hai fixture; chưa kiểm traffic dày. |
| Sáng tối/tương phản | 6 | Bóng road tốt hơn trước; dãy GLB phải vẫn sáng đều ở upper facade. |
| Màu/saturation/mood | 7 | Horizon cyan hòa sky hơn và còn tươi dịu; mặt tiền phải còn ấm gắt so sketch. |
| Ngôn ngữ hình khối | 6 | Lượt này không thay mesh/silhouette; material chỉ giúp phân cấp một phần. |
| Ánh sáng/thời tiết/vật liệu | 6 | Grade và fog cải thiện, nhưng thiếu mặt khuất mát trên GLB và wet reflection. |
| UI/typography | 7 | Lane/cue còn đọc trong cảnh parent xem; chưa kiểm full QTE/HUD trên thiết bị khác. |
| Nhất quán phong cách | 6 | Nhà GLB phải và code-native trái vẫn chênh sáng/mood. |
| Tiếp cận/hiệu năng | 6 | Không thêm caster/pass; chưa đo FPS, P95 hoặc reduced-motion cuối. |

**Mục tiêu từng tiêu chí >7/10 chưa đạt.** Điểm chỉ là ước lượng từ hiện vật và quan sát được chuyển lại; không trung bình hóa để che các mục 6.

## Gate

`pnpm exec vitest run --configLoader native tests/art-storm-lighting.test.ts`: 6/6 pass; test dùng tên và base color tuyến tính thật của các GLB để bảo vệ hierarchy giữa facade với shop accent, và kiểm nguồn không bị sửa. `pnpm lint`: pass; `pnpm typecheck`: pass; `pnpm test --maxWorkers=2`: 61 file, 368/368 test pass; `pnpm build`: pass, warning chunk Three.js >500 kB; `git diff --check`: pass. CI/review con người trên commit cuối: đang chờ. Chưa merge.
