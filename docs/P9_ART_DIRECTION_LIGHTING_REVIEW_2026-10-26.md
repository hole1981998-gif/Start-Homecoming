# P9 — art direction review: trời, sương và mặt tiền phố

Ngày 26/10/2026. **Codex tự đánh giá**, không phải art director độc lập hay phê duyệt của chủ dự án. Đích chủ dự án yêu cầu là **trên 7/10 ở từng tiêu chí**; art guide mới cũng đặt chuẩn mẫu premium tối thiểu 8/10 từng mục. Lượt này chưa đạt đích đó.

## Nguồn và thay đổi

- Đối chiếu `art-guide/ART_DIRECTION_3D.md` và `art-guide/MODEL_ANIMATION_WORKLOAD.md` trên nhánh `docs/machine-transfer-2026-10-26`, sketch `direction copy.PNG`, hai ảnh `0802320913324faaa57802684526068f.jpg` và `86de0628603d6e6313a771e8bee913b4.jpg` chủ dự án gửi, cùng `docs/ART_QA_SELF_REVIEW.md` và các P9 review.
- Trong `storm-lighting.ts`, màu nắng bớt vàng, fill/hemisphere lạnh hơn, sky gradient tiệm cận màu fog ở cuối đường. Material GLB có tên chỉ mặt lớn như plaster/column/paving được hạ sáng và bão hòa mạnh hơn; shop accent, mái, lá và kính giữ biến đổi nhẹ hơn. Không sửa GLB nguồn hoặc palette xe, hazard, logic gameplay.
- Mục tiêu thị giác: dãy nhà làm nền trung tính hơn, giữ vài điểm ấm/tươi, vùng bóng có sắc xanh và đường xa nhập với sương cyan thay vì một dải cắt gắt.

## Quan sát trực tiếp

Trong in-app browser, Vite local, khung trang 1280 × 720, đã bắt đầu và xem bằng camera chơi:

| Kịch bản | Quan sát sau chỉnh |
|---|---|
| `handling-car4`, seed 14 | Xe cam nổi khỏi road, HUD và vạch làn còn đọc được. Dãy nhà Blender dịu hơn và cửa/shop ấm còn điểm nhấn; chân trời bớt tách màu so với ảnh baseline `docs/evidence/p9-storm-mood/02-after-handling-car4-14.png`. Mặt tiền code-native phía gần vẫn hơi sáng peach; độ sâu bóng chưa sát sketch. |
| `handling-motorcycle`, seed 17 | Cây xanh vẫn có sức sống, bóng qua road không che làn. Phần xa cyan sáng hơn, nhưng cảnh cây còn thưa và ít chất bão nếu so reference. |
| `p8-water`, seed 17 | Nước dài hai làn, ổ gà, traffic và xe người chơi vẫn phân biệt được trong cùng frame. Có dải cyan gần xe khi cue gió ngang ở 0 m; chưa đánh giá được nguy cơ nhầm nó với nước khi chơi tốc độ cao. |

Các ảnh sau chỉnh đã được xem trực tiếp trong phiên browser này nhưng chưa xuất thành file so sánh cố định. Ảnh tĩnh không chứng minh phản ứng của người chơi, QTE, cảm giác lái hay hiệu năng thiết bị đích. Không có phép đo cùng frame trước/sau cho FPS hoặc giá trị màu; không tuyên bố cải thiện định lượng.

## Rubric art direction — tự đánh giá hiện tại

| Tiêu chí trong GAME_DESIGN.md | Điểm /10 | Lý do chính |
|---|---:|---|
| Silhouette/đọc hình | 7 | Xe, road, nước và ổ gà tách được ở ba cảnh; chưa xem traffic/NPC dày dưới bóng. |
| Sáng tối/tương phản | 6 | Có mảng bóng lớn, nhưng nhà gần còn sáng khá đều và bóng road vẫn hơi xanh đen đặc. |
| Màu/saturation/mood | 7 | Trời–fog và sắc lạnh của fill gần sketch hơn, điểm cam/ấm còn sống; dãy nhà code-native vẫn cạnh tranh với hành lang chơi. |
| Ngôn ngữ hình khối | 6 | Các GLB phố có lớp, nhiều nhà code-native và cảnh cây vẫn ít nuance; lượt ánh sáng này không sửa mesh. |
| Ánh sáng/thời tiết/vật liệu | 6 | Chuyển ấm/lạnh rõ hơn, nhưng mặt đường ướt ít phản xạ và mưa/bóng chưa có nhịp như reference. |
| UI/typography | 7 | HUD và cue còn đọc trong ba cảnh; nhãn phím chân màn hình nhỏ, chưa kiểm thiết bị thấp sáng. |
| Nhất quán phong cách | 6 | GLB được grade có chọn lọc; code-native city, biome cây và nước chưa cùng mức art. |
| Tiếp cận/hiệu năng | 6 | Thay đổi chỉ thuộc màu/đèn sẵn có; chưa đo FPS/P95 trên thiết bị đích hoặc chế độ giảm chuyển động sau chỉnh. |

**Gate >7/10 chưa qua.** Điểm này là ước lượng của Codex dựa trên ba fixture nhìn được, không phải quyết định của chủ dự án. Không lấy trung bình che các mục 6/10.

## Ưu tiên tiếp theo

1. Cân cùng một palette trung tính tối cho nhà code-native và các GLB, giữ biển/cửa hàng ấm; kiểm đủ nhiều seed và đoạn rẽ. Đây là nguyên nhân rõ nhất khiến phố gần vẫn khác sketch.
2. Kiểm nước, ổ gà, xe và NPC trên đường trong cả mảng nắng/mảng bóng ở vận tốc cao; chỉ sau đó chỉnh light/fog nếu cue bị chìm. Không sửa spawn, collider hay damage để chữa visual.
3. Khi phase shader/VFX đến lượt, tạo dải phản xạ ướt, mưa/splash và gradation bóng có kiểm soát; giữ đường nhìn và HUD. Đo FPS/P95 ở stress và thiết bị đích trước khi tăng số caster hay pass hậu kỳ.

## Kiểm tra kỹ thuật

`pnpm exec vitest run --configLoader native tests/art-storm-lighting.test.ts`: 4/4 pass. Test mới xác nhận mặt tiền GLB dịu hơn accent shop mà nguồn material giữ nguyên; test cũ xác nhận grade idempotent và layer gameplay không rọi cảnh ven đường. `pnpm lint`: pass; `pnpm typecheck`: pass; `pnpm test --maxWorkers=2`: 60 file, 363/363 test pass; `pnpm build`: pass, còn warning chunk Three.js >500 kB. CI trên commit cuối chưa chạy; review con người đang chờ. Chưa merge.
