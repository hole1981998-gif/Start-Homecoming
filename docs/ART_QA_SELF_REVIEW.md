# Tự đánh giá sơ bộ art thiết yếu — 24/10/2026

**Nguồn xem thực tế:** Vite local `/art-preview/scene.html` ở góc 9:16 và các trang `/art-preview/vehicle-gallery.html`, `/art-preview/people.html`, `/art-preview/world-gallery.html` ở near/far và nhiều góc. Đây là **Codex tự đánh giá từ preview**, không phải review độc lập, game build đã gắn asset hay playtest. Cảnh mẫu có car4, traffic car7/xe máy, khách vẫy, nước, ổ gà, đường, cụm nhà/cây. Chưa có HUD, mưa/VFX, thời gian chuyển động thật hoặc benchmark hiệu năng.

| Tiêu chí trong `GAME_DESIGN.md` | Điểm sơ bộ | Quan sát / việc phải kiểm tiếp |
|---|---:|---|
| Đọc hình / silhouette | 7/10 | Car4 và car7 khác dáng, traffic/người/hazard nhận diện được trong cảnh tĩnh. Nước và ổ gà xa còn thấp; cần chơi ở tốc độ thật, nhất là khi có nhiều hazard. |
| Giá trị sáng tối / tương phản | 6/10 | Xe ấm tách khỏi mặt đường tối. Xe máy và khách ở xa nhỏ; cần kiểm với HUD/QTE và nền sáng/tối, tăng tương phản cục bộ nếu chìm. |
| Màu / saturation / mood | 6/10 | Xe màu ấm, đất/cây/mặt đường trầm vừa. Chưa có thời tiết thật nên chưa chứng minh cảm giác mưa bão; tránh phủ tối toàn màn. |
| Ngôn ngữ hình khối low-poly | 7/10 | Các xe có cấu tạo và silhouette riêng; nhà có mái dốc, hiên, ban công, cửa bên. Nhà còn lặp nhịp/chi tiết ở mức 50% theo ưu tiên mới; sau bản thiết yếu thêm biến thể facade. |
| Ánh sáng / thời tiết / vật liệu | **Chưa chấm** | Preview dùng đèn kiểm hình; không có lighting, rain shader, wet-road material production. Không gọi tiêu chí này là đạt. |
| UI / typography / phân cấp | **Chưa chấm** | Asset chưa tích hợp HUD/QTE. Phải xem trong game thật, không suy từ preview. |
| Nhất quán phong cách | 6/10 | Trong scene tĩnh, xe/nhà/cây/hazard cùng chất low-poly, nhưng VFX/UI chưa có và nước cần thêm sắc thái khi tích hợp. Kiểm lại cảnh đông và các loại xe lớn. |
| Tiếp cận / hiệu năng | **Chưa chấm** | Hình dùng cả shape lẫn màu. Preview cảnh tĩnh hiện báo **460 draw calls / 8.474 tam giác** ở một lần render, với ba xe (xe máy traffic có tài xế) và hai cụm cảnh quan; chưa đo frame P95, pixel ratio thực tế hay thử đủ traffic/bus đầy khách/container. Cần pooling/batching sau khi đo trong renderer game. |

**Trạng thái gate:** chưa đủ điều kiện gọi art direction đạt hoặc ghép production art cuối. Trước bước đó cần build đại diện có art thật, chấm đủ tám tiêu chí theo thang 10, sửa mọi tiêu chí dưới 6, kiểm browser và xin chủ dự án duyệt. Các điểm 6–7 cũng có việc cần nâng như bảng trên. Bản asset thiết yếu hiện là nguồn để chat code tích hợp và kiểm tra, không là tuyên bố polish cuối.

## Tự đánh giá lại sau feedback màu và nuance

Đã xem lại trong lượt này cả ba ảnh `REF_01`–`REF_03`, scene browser, gallery nhà/cây/ruộng/vách/biển/xe/người và mẫu Blender. Màu hiện tươi hơn nhờ tường kem/đất nung, tán xanh, mặt nước ngọc và ánh vàng ấm có đối trọng xanh mát. **Tự đánh giá** màu/mood từ preview tăng từ 6 lên 7/10; hình khối môi trường từ 7 lên 7/10 vì địa hình liên tục và cây có ba dáng, nhưng nhà còn lặp, nhiều mặt tường còn phẳng. Cảnh 9:16 vẫn cách reference rõ vì camera gameplay thấp, hai bên đường thưa và không có weather/material/FX production. Bản `scene.html` cho so camera prototype với góc cao nghiên cứu; không dùng ảnh góc nghiên cứu để suy game đã đẹp. Ánh sáng/thời tiết, UI và hiệu năng vẫn **chưa chấm** cho bản game thật. Bóng đổ trong preview làm draw calls tăng; phải đo trên build tích hợp trước khi quyết định cấu hình.

## Phản hồi mới và kiểm lại ngày 24/10

Ảnh nhân vật mới của chủ dự án được dùng làm tham chiếu **phong cách**, không sao chép mẫu cụ thể. Sau khi chỉnh tóc/mũ tách khỏi mặt, đầu tròn hơn, tay/chân bo tròn và thân bớt góc nhọn, gallery người dễ đọc mắt và dáng hơn. Tuy vậy các archetype còn dùng nhiều form áo chung; **tự đánh giá silhouette nhân vật 5/10**, chưa đạt gate. Thành phố có thêm midrise, mặt tiền cửa hàng rộng, công viên, seed vị trí/màu; screenshot `world-gallery.html` cho thấy nhịp cao-thấp đa dạng hơn nhưng mặt bên và khoảng trống vẫn đơn giản. **Tự đánh giá ngôn ngữ hình khối cảnh quan 5/10**, chưa đạt gate. Mặt nước/ổ gà có lòng dốc và normal; mặt nước dùng clearcoat nhẹ, nhưng chưa có shader gợn, mặt đường ướt production và kiểm đọc hazard khi xe chạy. Ánh sáng preview có bóng lớn hơn trước nhưng giá trị sáng/tối chưa được art direct theo từng biome; **tự đánh giá ánh sáng preview 5/10**. Các điểm này thay nhận xét 7/10 trước đó cho đến khi sửa, xem lại hiện vật thật và chấm lại. Không suy điểm preview là điểm của game tích hợp.

Lượt kế tiếp thêm giàn che/bồn hoa/đèn đường, một nhà midrise Blender có ban công và shop, cùng pose đi bộ tại chỗ để so nhân vật ở góc ba phần tư. Gallery người dùng nền studio trung tính và bóng để lộ rõ mép tóc, khớp tay/chân; các khớp vẫn còn cảm giác mô-đun và dáng chưa tự nhiên bằng ảnh mẫu. Cảnh prototype nhìn rõ tòa cao tầng nhưng mặt tiền các nhà thấp vẫn khá lặp. Vì vậy **giữ đánh giá nhân vật 5/10, cảnh quan 5/10, ánh sáng preview 5/10**; chưa gọi art direction đạt. Ảnh tĩnh và model xoay không thay được kiểm gameplay có HUD/mưa/chuyển động.
