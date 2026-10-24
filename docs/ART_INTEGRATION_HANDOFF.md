# Bàn giao tích hợp art thiết yếu — 24/10/2026

Asset hiện là module Three.js riêng trong `src/art/`, chưa được gắn vào `src/render.ts`. Gói này không sửa simulation, collider, RNG, cân bằng, UI hoặc âm thanh. Dùng `art-preview/car4.html`, `vehicle-gallery.html`, `people.html`, `world-gallery.html`, `scene.html` trong Vite để kiểm hình; `scene.html` là bố cục đại diện, không phải gameplay.

## Nguồn kích thước và thời gian

`src/vehicles.ts`, `src/config.ts`, `src/world.ts`, `src/moving-events.ts`, `src/route.ts` và trạng thái `Run` hiện hành là nguồn thật. Mesh không được sửa chúng. Mọi root art lấy +Y up, +Z forward, 1 đơn vị = 1 m; đường prototype đi về **−Z** ở đoạn thẳng. `attachVehicleArtToPrototype(parent, art)` xoay phần nhìn 180° để khớp đường. Đặt ở con của logic root; giữ logic root do simulation điều khiển. Test adapter xác nhận headlamp hướng về −Z.

| Runtime | Art | Dữ liệu phải giữ |
|---|---|---|
| Player / traffic, tám loại | `createVehicleArt(kind, role, lod, trafficColor)` | `VehicleDefinition.width/length`, HP/speed/fuel, traffic direction; chỉ đổi màu traffic cùng master. Traffic xe máy/mô tô/ba gác đã kèm một tài xế, không kèm khách; player tiếp tục lấy tài xế/khách từ roster runtime. |
| Driver / passenger | `createPersonArt(archetype, lod)` + `mountPersonOnSeat()` | `riderIds`, capacity, seat/exit socket; driver kín cabin và khách lộ cửa sổ chỉ khi trạng thái hiện hành cho phép. Không co giãn người theo thân xe. |
| `water`, `pothole` | `createSurfaceHazardArt(kind, e.width, e.length, lod)` | Tạo theo từng entity; không lấy mesh size mẫu rồi scale bừa. Các phần mép chỉ là hình, collider cũ giữ nguyên. |
| `cargo`, `fuel`, `repair` | `createPropHazardArt()` | Kiểu cargo `crate`/`barrel`, trạng thái consumed từ simulation. |
| `jam` barrier | `createPropHazardArt('barrier')` | Collider 6,2×1,4 m hiện hành; phần nhìn có thể hẹp hơn, không đổi cửa né. |
| `jam` vendor | `createVendorArt()` | 1,8×2,1 m, `crossMotion`, `motionWaiting`, phase tăng tốc `.15` s + ease `.45` s do runtime quyết định. |
| `traffic` ambulance | `createAmbulanceArt()` | Vẫn là car7 2,08×4,8 m, HP car7, speed 16 m/s và lane motion hiện hành; beacon là socket/mesh, chưa là ánh sáng/còi. |
| `train` | `createTrainArt(sign(crossMotion.velocity))` | 24×2,8 m, finite body, cả hai hướng, `motionWaiting`/`trainClosed()` do simulation quyết định. Nose chỉ đúng hướng khi truyền dấu vận tốc. |
| `police`, `militia` | `createOfficerArt(kind)` | 1–2 NPC từ event, `groupId`, `crossMotion`, `stunned`; setState('stunned') chỉ diễn hình, không quyết định bắt/phạt. |
| Accident / broken traffic | `createAccidentArt()` tái dùng hai car4; broken thường dùng `createVehicleArt()` và trạng thái hỏng | Accident vẫn terminal 6,2×5 m; không gán tính chí tử đó cho xác traffic thường. |
| Shop | `createShopArt()` | Dùng entity shop và vị trí tương tác hiện hành; chỉ hình ven đường, không tạo timer/giao dịch mới. |
| Road / junction | `createRoadTileArt()` / `createJunctionArt()` | Centerline `pathPose()`, 4 m sample, làn 3×3,2 m, junction 90 m cross/190 m old road. Tắt vạch trong vùng ±13 m giao lộ như renderer hiện hành. |
| Cảnh quan | `createSceneryCluster(kind, side, lod, variantSeed)` | Năm family `roadsideRegions(seed, distance)` theo vùng 96 m; truyền seed ổn định cho biến thể phố, không dùng `Math.random()` lúc render. Chỉ trang trí, không spawn/collider. Giữ cả hai mép và continuity khi cua. |

`passengerArchetypes` trong `src/art/people.ts` nay liệt kê 12 silhouette khách để runtime chọn ổn định theo ID/seed hiện hành; đừng sinh một nhân vật mới khi khách va rồi đứng dậy. Các mẫu mới dùng chung socket/pose cơ bản, nhưng boarding, retarget riêng cho trẻ/già và diễn xuất dài trong brief vẫn cần hoàn thiện ở bước tích hợp.

`assets/art/roadside-shop.glb` là mẫu nhà Blender đã gộp thành 11 cụm vật liệu, có source `.blend` chỉnh được. `scene.html` tải mẫu này thay một nhà code-native để so hình; đây là lựa chọn art, không mặc định dùng cho mọi vùng và không tạo collider. Nếu dùng trong game, load/cache GLB một lần, clone hoặc instance phần tĩnh, kiểm footprint ven đường và đo draw calls ở cảnh đông.

Mọi master xe đều có `setCondition('clean' | 'used' | 'damaged' | 'destroyed')` để diễn hình trạng thái HP/đối tượng xác xe từ runtime. Chỉ gọi `destroyed` khi logic xác định hỏng; hết xăng hoặc tạm dừng xe không đồng nghĩa hỏng nặng. Điều kiện hình ảnh không thay HP, va chạm hay kết ván. Bản xem trước xe có bộ chọn tình trạng để rà từng loại và LOD.

## Nhịp pose/animation

`driverCrashPose(elapsed)` và `passengerCrashPose(elapsed)` trong `src/art/timing.ts` trả pose + phase chuẩn hóa, đọc thẳng từ `balance` hiện hành. Truyền cả hai vào `person.setPose(pose, phase)`; đoạn văng/đứng dậy có nội suy pose đơn giản, chưa là clip diễn xuất cuối. Driver: văng 0,8 s → dừng 0,5 s → trở về 1,8 s. Khách: văng 0,65 s → nằm 0,4 s → đứng 0,55 s. Không phát clock nội bộ; lấy `elapsed` từ `s.crash`/`e.passengerMotion` khi thích hợp. Pause/reset/retire/end run ngắt pose theo state; star miễn va thì không diễn ngã. Bánh/quay đầu/lean/đuôi quét/container hitch lấy transform hiện hành, không nhân thêm root motion. Tàu/công an/vendor chỉ nhận `crossMotion`, không thêm thời lượng riêng.

## QA còn phải làm trong chat tích hợp

- Trong browser game thật: lái, camera, HUD, hai chiều traffic, đủ tám xe, bus nhiều khách, container góc cua, nước lớn/ổ gà dài, tàu hai chiều, vendor và cứu thương; kiểm thất bại/restart.
- So mesh với collider/footprint tại góc cua và lúc xe nghiêng, khi traffic ngược chiều, lúc khách văng; kiểm không che cảnh báo/QTE và không làm giảm khoảng nhìn trước xe.
- Đo frame P95/draw calls/triangles/animation CPU ở cảnh đông trên thiết bị mục tiêu. Preview cảnh tĩnh sau đợt thêm phố ghi khoảng 650–680 draw calls / 20–21 nghìn tam giác, thay đổi theo góc chụp/GLB đang tải; đây chưa là benchmark game. Pooling và gộp chi tiết tĩnh/LOD traffic theo số đo thật, không khẳng định 60 FPS.
- Art direction gate: chấm cảnh thật tám tiêu chí trong `GAME_DESIGN.md`, sửa mọi tiêu chí dưới 6/10 trước khi gọi là đạt. Preview độc lập chỉ đủ để tự đánh giá sơ bộ.
