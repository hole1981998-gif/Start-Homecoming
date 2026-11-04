# P9 city palette — tự đánh giá vòng 2, 26/10/2026

## Mục tiêu và bằng chứng

Mục tiêu của chủ dự án: khu nhà code-native bớt kem/peach và sáng đều, có khối sáng/tối lớn như sketch mưa bão; cửa hàng vẫn ấm, gameplay và cảnh báo vẫn nổi. Tham chiếu: `direction copy.PNG`, `0802320913324faaa57802684526068f.jpg`, `86de0628603d6e6313a771e8bee913b4.jpg`, art guide ở nhánh `origin/docs/machine-transfer-2026-10-26`, và review P9 lighting trước đó. Đây là **tự đánh giá của Codex**, không phải review độc lập hay phê duyệt art cuối.

Ở cảnh `handling-car4&seed=14`, parent xem IAB sau lượt đổi palette đầu và quan sát đường/cue vẫn rõ nhưng nhà gần còn kem, sáng đều. Sau khi thêm mảng ambient tầng trên, parent xem lại và thấy dãy trái có khối bóng tốt hơn, dãy phải gần camera vẫn sáng. Kiểm tra phép quay cho thấy rigid cluster còn xoay π trong `RoadRenderer`, nên dấu hông camera-facing được sửa thành `-side`; bend giữ `side`. Parent reload IAB sau bản chỉnh dấu cuối: **nhà bên phải vẫn sáng kem, gần như không đổi**. Các lot `midrise`, `skyline`, `corner_shop`, `market` ở `city A` có thể được thay bằng GLB nên palette code-native không áp dụng cho chúng. CUA ở phiên agent này không khả dụng; quan sát IAB do parent thực hiện và chuyển lại. `junction&seed=14` và seed city khác vẫn **chưa kiểm tra thủ công**. Không có ảnh sau chỉnh cuối được lưu để so trực tiếp; các điểm dưới đây là ước lượng bảo thủ từ mã, test hình học/màu và phản hồi IAB nêu trên.

## Thay đổi

- Giảm độ sáng và độ peach của plaster/công trình code-native, hạ sidewalk/curb để phố không tranh chấp với lane. Ba nhóm warm/cool/ochre vẫn khác nhau, shop sign/cửa sáng vẫn là điểm ấm.
- Thêm mặt ambient lạnh ở hông các nhà sát đường. Với rigid cluster, `-side` quyết định hông quay về hướng camera sau phép quay π của renderer; với bend strip dùng `side`. Không tạo bóng rời/đường vệt mới.
- Thêm mảng ambient lớn trên tầng trên nhà 2 tầng và midrise; lớp nền/phần thấp và mái giữ độ chênh sáng. Geometry mới là decorative-only, dùng batch static hiện có ở LOD xa.

## Rubric art direction — tự đánh giá hiện tại

| Tiêu chí trong GAME_DESIGN.md | Điểm /10 | Bằng chứng và giới hạn |
|---|---:|---|
| Silhouette/đọc hình | 7 | Bố cục/shape giữ nguyên, cửa shop sáng nổi; chưa kiểm dưới mưa dày ở bản chỉnh cuối. |
| Sáng tối/tương phản | 6 | Parent thấy dãy trái tốt hơn, nhưng dãy phải vẫn sáng sau chỉnh dấu; nhiều khả năng phần GLB ngoài phạm vi lượt này. |
| Màu/saturation/mood | 6 | Palette code-native hạ peach, giữ cool/ấm; mức hòa hợp với GLB và fog chưa được nhìn lại. |
| Ngôn ngữ hình khối | 6 | Không thêm chủng loại silhouette; chỉ nhấn các plane đang có. |
| Ánh sáng/thời tiết/vật liệu | 6 | Ambient được biểu đạt bằng local material; nước ướt, phản xạ và bóng đổ của đèn chưa đổi. |
| UI/typography | 7 | Parent thấy cue/road đọc được sau palette đầu; chưa kiểm UI trên chỉnh cuối. |
| Nhất quán phong cách | 6 | Dãy gần `city A` thay bốn lot code-native bằng GLB; nhà sáng bên phải có thể thuộc GLB, nên palette này không đủ đồng bộ toàn phố. |
| Tiếp cận/hiệu năng | 6 | Test bounds/LOD/batch pass, nhưng chưa đo FPS/P95 hoặc readability khi chơi trên thiết bị đích. |

**Gate >7/10 chưa đạt.** Không trung bình hóa các mục 6/10. Chủ dự án quyết định phê duyệt art cuối sau khi xem cảnh thật.

## Kiểm tra

`pnpm exec vitest run --configLoader native tests/art-scenery.test.ts`: 18/18 pass; test mới kiểm mặt ambient trên đúng hông ở cả hai phía đường, chênh value với plaster và biển shop vẫn sáng. `pnpm lint`: pass; `pnpm typecheck`: pass; `pnpm test --maxWorkers=2`: 60 file, 364/364 test pass; `pnpm build`: pass, warning chunk Three.js >500 kB. Manual browser chỉ có `handling-car4&seed=14` do parent xem và chuyển quan sát; chưa kiểm input/fail/restart hoặc seed/junction khác. CI trên commit cuối và review con người: đang chờ. Chưa merge.
