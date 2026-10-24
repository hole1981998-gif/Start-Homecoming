# Art thiết yếu — thứ tự sản xuất sau khi chốt cân bằng

Ngày 24/10/2026. Đây là kế hoạch sản xuất rút gọn theo ưu tiên mới của chủ dự án. `ART_DIRECTION_3D.md` và `MODEL_ANIMATION_WORKLOAD.md` vẫn là đích chất lượng dài hạn; bảng này chỉ xác định mốc **bản game đầy đủ thiết yếu** trước đợt polish sau.

## Quy tắc chung

- Tập trung vào silhouette từ camera sau 9:16, kích thước đúng collider hiện hành, màu cơ sở và phần cứng cần để game diễn trạng thái thật.
- Một master xe dùng cho cả player và traffic; traffic có thể đổi màu, giảm chi tiết/LOD. Không nhân đôi tám model chỉ vì hai vai trò.
- Chỉ cần một finish đẹp cho mỗi xe lúc đầu. Nội thất ghế chi tiết, bảng điều khiển, biến thể sơn thứ hai/thứ ba, đèn/FX thật và props trang trí nhỏ để sau.
- Bánh, trục lái, body pivot, hitch container, seat/socket phải có **điểm gắn và phân cấp** để tích hợp; không bắt buộc mô phỏng/cử động chi tiết khi chưa có runtime nối.
- Xe máy, mô tô, car4, car7: ngoại thất bằng mức mẫu car4. Ba gác, bus, truck, container: khoảng 80% mức đó, vẫn khác silhouette thật. Hazard: khoảng 50–60%. Cảnh quan: khoảng 50%, tập trung hình lớn và cụm có bản sắc.
- Không thay collider, balance, hướng lái, roster hoặc nguồn spawn để hợp với mesh. Asset module vẫn tách khỏi `render.ts` cho đến khi chat code tích hợp.

## Các gói theo thứ tự

| Gói | Đầu ra thiết yếu | Để sau | Trạng thái |
|---|---|---|---|
| V1 — xe cơ bản | Car4, xe máy, mô tô, car7. Mỗi loại có ngoại thất gần/xa, root/pivot/socket, một finish, footprint chuẩn. | 3 palette, cabin/ghế đẹp, cosmetic animation tinh. | Source + preview + unit checks xong; chưa tích hợp, chưa có duyệt art. |
| V2 — xe còn lại và traffic | Ba gác, bus, truck, container. Reuse cả tám master cho traffic; container player có đầu kéo/rơ-moóc, traffic một cụm. | Chi tiết nội thất, mọi skin traffic, hàng hóa trang trí. | Source + catalog factory + unit checks xong; chưa tích hợp, chưa có duyệt art. |
| C1 — người thiết yếu | Một tài xế rõ từ sau, khách nhiều silhouette cốt lõi; pose lái/ngồi, vẫy, va/ngã, đứng dậy, từ chối. Mount trên các loại xe. | Secondary gesture và biểu cảm tinh. | Source 12 khách + tài xế, pose, mount, preview, unit checks xong; tỷ lệ/trang phục còn cần nâng tiếp, chưa nối roster/animation runtime. |
| H1 — hazard tĩnh và điểm dịch vụ | Nước các footprint đang dùng, ổ gà, rào, hàng rơi, pickup xăng/sửa, cụm tai nạn tái dùng car4, shop một silhouette. | Cây đổ hiện là mẫu dự phòng, không thêm spawn; shop nhiều skin, vết nhỏ/biến thể nhiều, props dressing. | Source + preview + footprint checks xong; chưa nối renderer. |
| H2 — hazard chuyển động | Tàu hữu hạn, công an/dân phòng, hàng rong, cứu thương. Chỉ pose/part cần đọc hướng và trạng thái. | Animation phản ứng dài, clip phụ. | Source + preview + unit checks xong; chưa kiểm chuyển động trong game. |
| R1 — đường | Mặt đường 4 m theo pathPose, mép/làn/bờ, giao lộ và rào nhánh thẳng hiện hành. | Drain/patch/biển nhỏ lặp lại; transition cảnh quan ở bản polish. | Source + checks xong; chưa nối geometry động của route. |
| E1 — cảnh quan | Nhà thấp, cửa hàng mặt tiền rộng, chung cư nhỏ, công viên, cây/bụi, ruộng, đồi, ven biển; năm family đang có trong `landscape.ts`. | Hồ/sông riêng, mọi facade/prop/LOD biến thể trong guide đầy đủ, anim cây. | Source + preview + clearance/seed checks xong; còn mặt bên phẳng và nhịp phố cần tuning, chưa nối placement trong game. |
| I1 — nối và QA | Chat code gắn asset, kiểm camera/collider/state/perf trong game; hoàn thiện các lỗi cản gameplay. | FX/SFX/shader/đèn production. | Chờ asset và chat code. |

## VEH-03 car4 mẫu

`src/art/car4.ts` tạo model bằng Three.js theo +Y up, +Z forward, 1 đơn vị = 1 m. Không hiển thị ghế nội thất. Có 4 wheel pivot, body visual, bốn seat mount, socket đèn/FX/exit, near/far LOD và overlay clean/used/damaged/destroyed. Preview: `/art-preview/car4.html` khi chạy Vite. Asset chưa nối vào renderer game.

QA kỹ thuật hiện có: footprint render so với 1,86 × 4,2 m trong `src/vehicles.ts`; phía gương mềm cho phép nhô rất nhỏ. Near 2.625 triangles/147 meshes; far 1.549 triangles/84 meshes; 15 material objects. Car7 near/far 2.194/1.294 triangles. Đây là số của model art riêng, chưa tối ưu batch/instance. Chưa có benchmark FPS trong game, test input hay art review của chủ dự án.

LOD near/far đo từ model player theo thứ tự tam giác: xe máy 1.982/1.566, mô tô 1.996/1.580, car4 2.625/1.549, car7 2.194/1.294, ba gác 528/384, buýt 1.040/864, tải 798/634, container 1.258/882. Đây là độ phức tạp mesh, **không phải thang đo chất lượng 80%**. Traffic xe mở cộng thêm tài xế. Draw calls thực tế vẫn cần tối ưu sau tích hợp.

Các mục guide cũ bị hoãn ở đây không bị gọi là “đã hoàn tất”. Khi có game đầy đủ thiết yếu, mở một đợt polish riêng và kiểm lại workload gốc theo ID.

## Mở lại art direction đầy đủ theo yêu cầu mới

Chủ dự án đã bỏ giới hạn mức 50–80% để ưu tiên chất lượng và nuance theo `ART_DIRECTION_3D.md`. Bảng thiết yếu phía trên là mốc lịch sử, không còn là trần chất lượng. Đợt nâng đầu tiên đã thêm 12 archetype khách (ngoài tài xế), tách silhouette cây tán rộng/cọ/cây hoa, thay ba nón vách đá bằng dải địa hình, dựng ruộng lúa theo khóm có instancing, thêm lớp ven biển và cấu trúc nhà/màu sáng ấm. Một nhà ven đường được dựng bằng Blender; source `assets/art/roadside-shop.blend`, bản xuất gộp vật liệu `assets/art/roadside-shop.glb`, preview `/art-preview/blender-shop.html`. Mẫu Blender hiện là art candidate trong scene preview, chưa là prefab game.

`/art-preview/scene.html` cho chuyển giữa camera prototype và góc art direction đề xuất; lựa chọn thứ hai chỉ để so bố cục, không đổi camera gameplay. Lighting/tone mapping/shadow trong preview là nghiên cứu màu; renderer game chưa đổi. Theo feedback mới, thành phố có thêm dãy nhà cao tầng, cửa hàng mặt tiền rộng, công viên và biến thể vị trí/màu theo seed cố định; `/art-preview/world-gallery.html` cho xem ba seed mẫu. Nhân vật được sửa đầu, tóc/mũ, tay chân và mặt theo ảnh tham chiếu người dùng, nhưng quần áo và tỷ lệ còn cần nâng tiếp. Nước có vật liệu phản chiếu nhẹ; ổ gà có vách dốc/normal tạo lớp sâu bằng hình khối, collider không đổi. Cần tiếp tục hoàn thiện chất lượng ngoại thất các xe còn lại, diễn xuất nhân vật, các vùng môi trường/điểm dịch vụ, FX/ánh sáng trong game, hiệu năng và art gate; không gọi gói này là art cuối đạt reference.

## Hợp đồng với prototype hiện hành

- Kích thước tám xe lấy từ `src/vehicles.ts`: 0,896×2; 0,96×2,2; 1,86×4,2; 2,08×4,8; 1,76×3,2; 2,72×10; 2,72×7; 2,88×15 m. `src/art` chỉ cấp mesh, pivot và socket; không cấp collider mới.
- Nước/ổ gà nhận `entity.width` và `entity.length` trực tiếp. Tàu 24×2,8 m, rào 6,2×1,4 m, vendor 1,8×2,1 m; cứu thương dùng car7 2,08×4,8 m. Animation di chuyển lấy từ `crossMotion`/simulation. Không thay nhịp train, patrol hay vendor trong art.
- `src/art/timing.ts` chuyển thời gian va của tài xế và khách sang phase pose bằng chính `balance` hiện hành. Driver: 0,8 s văng + 0,5 s dừng + 1,8 s trở lại. Khách: 0,65 s văng + 0,4 s nằm + 0,55 s đứng. Khi code tích hợp phải sample lại theo simulation active time, xử lý pause/reset/retire, không phát clip độc lập gây trễ gameplay.
- Đường chạy ba làn × 3,2 m, sample mỗi 4 m. Cụm cảnh quan theo `roadsideRegions()` dài 96 m, chỉ decorative, ở ngoài mặt đường. Không thêm spawn/collider cho cây đổ mẫu dự phòng.
- Preview riêng: `/art-preview/vehicle-gallery.html`, `/art-preview/people.html`, `/art-preview/world-gallery.html`. Bản xem trước không chứng minh cảm giác lái, thời điểm va, tốc độ khung hình hay art review độc lập.
