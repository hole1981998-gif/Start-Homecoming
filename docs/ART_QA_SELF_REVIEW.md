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
