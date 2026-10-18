# Đường Về Nhà — Technical Specification

## Ràng buộc

Three.js + TypeScript (strict) + Vite; trình duyệt desktop, canvas dọc 9:16 căn giữa, letterbox khi cần. WASD lái liên tục; lane chỉ là đơn vị thiết kế. Tạo model low-poly bằng geometry/material trong code. Không mặc định thêm backend, tài khoản, vật lý nặng hay dịch vụ trả phí. Quy tắc thiết kế ở GAME_DESIGN.md; toàn bộ số cân bằng ở BALANCE_CONFIG.md là tạm.

## Kiến trúc đề xuất

| Module | Trách nhiệm |
|---|---|
| `core/` | Clock, fixed update, state machine, event queue, seeded RNG |
| `simulation/` | Xe, tài nguyên, tải người, di chuyển, collision và thứ tự xử lý |
| `world/` | Road chunk, giao lộ, spawn có kiểm tra khả thi, floating origin |
| `systems/` | Passenger, inventory, shop, police, difficulty, score, secret ending |
| `render/` | Three.js scene, mesh factory, camera, hiệu ứng và pooling |
| `ui/` | HUD, cảnh báo, QTE, cửa hàng, Tab, kết quả; tách khỏi simulation |
| `data/` | Vehicle definitions, balance config, schema validation |
| `persistence/` | Settings, local leaderboard, badge; schema version và migration |
| `tests/` | Unit/integration thuần dữ liệu và kịch bản gameplay tự động phù hợp |

Tên thư mục là đề xuất, không phải yêu cầu đã tồn tại. Không buộc React nếu UI DOM đơn giản đã đủ.

## Mô hình dữ liệu và bất biến

`RunState`: phase, runId, seed, distance, score, money, activeVehicleId, tối đa 2 vehicle instances, rider IDs, inventory, secretState, event sequence. `VehicleDefinition` giữ thông số loại; `VehicleInstance` giữ ID riêng, fuel, durability, upgrades, trạng thái confiscated/disabled. Không dùng definition làm trạng thái mutable dùng chung.

**P4B bản thử:** `Run` lưu `vehicleInstances` và `activeVehicleId`, các trường fuel/durability hiện tại là bản làm việc của xe đang lái và được ghi về instance sau tick/trước khi đổi xe. Tính speed, collider, tiêu hao, giới hạn pickup và HUD từ definition hiện hành. Tab không mở modal; đổi xe không đổi khách/tiền/điểm và không cấp tài nguyên miễn phí. Khi HP=0 hoặc fuel coast hết, đánh dấu xe đang lái disabled rồi chuyển xe dự phòng còn hợp lệ; không ghi kết quả ván nếu chuyển thành công. Bảo vệ ngắn sau tự chuyển, hazard đang chồng lên xe được bảo vệ tới lúc rời collider. Purchase command thuần dữ liệu đã validate slot/tiền/chọn xe bỏ, nhưng chưa nối gameplay/UI trước P5.

**P4.1 bản thử:** traffic instance lưu loại, HP, hướng/tốc độ gốc, tập ID hazard còn chạm, trạng thái wreck và thời gian hiện xác. Fixed step di chuyển traffic đúng một lần, dùng sweep để lấy thời gian chạm ổ gà/nước; ổ gà đánh một lần khi vào và trừ HP theo thời gian, nước chỉ hãm tốc vì traffic chưa có fuel. Va người chơi trừ HP cho cả hai, nhưng xe lớn đi tiếp nếu cú húc phá hỏng mục tiêu. Traffic HP=0 không gây hit tiếp, giữ xác ngắn để đọc hậu quả rồi thu hồi. P4.2 sẽ gắn spawn khách đúng một lần vào chuyển trạng thái HP>0 sang 0; không dùng số lần render làm trigger.

**Danh mục traffic P4.1 đã có bản thử:** dùng chung `VehicleKind` với danh mục xe người chơi; `Record<VehicleKind, TrafficDefinition>` buộc mỗi loại có HP, sát thương, footprint lấy từ definition xe, tốc độ và trọng số spawn. Luật húc của xe người chơi cũng là `Record<VehicleKind, …>`, không rơi về một loại mặc định im lặng khi thêm xe. Mỗi traffic entity giữ HP mutable riêng; cùng loại có thông số gốc chung nhưng trạng thái không chia sẻ. Placeholder mesh được pooling theo loại để xe hai bánh, ba gác, ô tô, buýt, tải và container có silhouette khác nhau. Test catalog đầy đủ, seed tái hiện, va chạm từng loại và húc phá; vẫn cần playtest cảm giác né/húc ở nhiều màn chơi thực và cân số TẠM.

- `occupants = 1 + riders.length`; `overload = max(0, occupants - capacity)`; tài xế không nằm trong danh sách riders.

Khách bị chọn ngẫu nhiên không quay lại sau tai nạn thành entity NPC đường phố ngay tại thời điểm va chạm, được giữ cùng ID/vị trí qua lúc tài xế quay lại và mang `pickupable = false` vĩnh viễn. Entity chuyển động văng khỏi xe rồi đứng/đi quanh điểm đáp; không tạo lại ở cạnh xe khi kết thúc crash. `pickUpPassenger` loại các entity này khỏi truy vấn F bất kể cooldown/vị trí hoặc tài xế đã lên xe. Khách được chọn quay lại chỉ tăng lại số `riders` khi tài xế trở về; hoạt ảnh của họ kết thúc trên xe. Khách chờ thường và khách G cho xuống giữ hành vi đón lại hiện tại.
- Mỗi xe có upgrade riêng; xe bị bỏ không chuyển upgrade sang xe còn lại.
- Tiền, nhiên liệu, độ bền hữu hạn, không âm; fuel/durability không quá max sau nâng cấp.
- Đổi xe giữ khách, tiền, item. Xe dự phòng không tiêu hao xăng khi không chạy (đề xuất).
- Giới hạn 2 xe phải đúng cả khi hủy giao dịch, tải save hoặc xử lý nhiều event cùng tick.
- End run chỉ chạy một lần, ghi bảng điểm một lần theo runId; phase kết thúc chặn mọi thu nhập/giao dịch tiếp theo.

## Clock, điều khiển và di chuyển

Đề xuất simulation fixed step 60 Hz, render nội suy bằng requestAnimationFrame; clamp thời gian bù và số substep khi tab giật. Đổi tab/mất focus thì tạm dừng, xóa trạng thái phím bị giữ. Không tích lũy quãng đường khi pause. W/S dùng trạng thái **giữ phím**, A/D thay đổi vị trí ngang với gia tốc; clamp thân xe trong biên đường. Không giả lập lùi. Chặn hành vi cuộn Space/Tab khi canvas đang có focus; UI vẫn dùng được bằng bàn phím.

**Thiết kế mới đã chốt 17/10/2026:** VehicleDefinition có `cruiseSpeed` riêng cho từng loại xe. Giữ W/S để duy trì nhanh/chậm hơn cruise; khi cả hai được thả, simulation đưa tốc độ về `effectiveCruiseSpeed` từ cả hai phía. Không giữ tốc độ đỉnh sau một lần nhấn W. Giá trị mốc và return rates còn TẠM; validation phải kiểm tra hữu hạn, rate > 0 và `minSpeed <= cruiseSpeed <= maxSpeed`.

Đề xuất luật fixed-step: S ưu tiên nếu W+S cùng giữ; S hướng tới effectiveMinSpeed bằng braking, W hướng tới effectiveMaxSpeed bằng acceleration. Không W/S: dùng returnAcceleration khi thấp hơn cruise, returnDeceleration khi cao hơn; mỗi tick dùng bước giới hạn tới target, không overshoot. Chỉ input dọc quyết định auto-cruise, nên giữ A/D không ngăn hồi tốc. Khởi tạo ván ở cruise. Pause ngừng cả clock hồi tốc; resume không reset vận tốc, không phục hồi trạng thái phím cũ.

Tốc độ trung vị giảm theo số khách hiện tại, kể cả dưới tải; VehicleDefinition bổ sung `cruiseLossPerRider` và `riderCruiseFloorSpeed` (công thức đề xuất trong BALANCE_CONFIG.md). Chưa gán hệ số khi chưa thử từng xe. Schema kiểm tra loss > 0, finite và baseMinSpeed <= floor < baseCruiseSpeed. Tài xế đã nằm trong baseCruiseSpeed, không tính thêm vào n. Cruise giảm tới sàn theo xe, rồi clamp theo min/max hiệu dụng; không nhân lặp hệ số quá tải vào cruise. Mọi phép tính thuần dữ liệu, recompute sau đón/cho khách xuống/đổi xe; không tích lũy trừ speed mỗi tick để tránh drift. Event đón khách idempotent phải tránh giảm hai lần cho cùng một khách.

Đón/cho khách xuống chỉ đổi target; tốc độ thực chuyển tiếp theo controller hiện tại, không teleport. Giữ W/S vẫn ưu tiên tăng/hãm tới giới hạn hiệu dụng. Đổi xe clamp tốc độ đang chạy vào khoảng xe mới rồi dùng target theo xe mới với khách giữ nguyên; không gán ngay cruise nếu điều đó tạo cú tăng tốc miễn phí. Coasting khi hết xăng không nhận gia tốc từ auto-cruise; QTE/nitro dùng controller ưu tiên riêng, không cộng thêm controller cruise trong cùng tick. Cần integration test riêng cho chuyển tiếp các controller, tránh tự tăng tốc trái luật tài nguyên. Không thay đổi duration/boost nitro chỉ để hợp thức hóa auto-cruise.

Va xe thường nay có trạng thái crash: tại đúng thời điểm swept contact, trừ HP một lần theo entity, rồi xe trôi giảm tốc theo 8 m/s² đến 0. Distance thực tăng trong lúc trôi nhưng score/money không tăng; không hao xăng hay chịu damage/debuff trong toàn bộ pha trôi/ngã/quay lại. World traffic vẫn cập nhật. Render tính quỹ đạo tài xế từ tốc độ và vị trí va chạm, văng tiến và lệch bên rồi trở về xe; không dùng quỹ đạo render để thay đổi simulation. Chỉ hoàn tất phục hồi khi tài xế quay lại và xe đã dừng. Sau boarding, controller riêng tăng từ 0 tới cruise, W tăng nhanh hơn; tránh clamp tức thì lên min speed. Nếu HP về 0 tại va chạm thì kết ván/thay xe có ưu tiên, không bắt đầu crash recovery. Người đi nhờ được chia quay lại/rời đi bằng RNG crash riêng có seed; P4 gắn roster/visual thật vào luật này.

Test bổ sung bắt buộc khi triển khai: hồi từ trên/dưới mốc, hội tụ không dao động, giữ/thả W/S, W+S, A/D cùng lúc, tải người/upgrade/đổi xe, pause/focus/restart, hết xăng và kết thúc nitro; so sánh nhiều FPS. HUD/Help phải phản ánh cơ chế mới. Báo cáo P1 cũ và test cũ “thả W giữ tốc độ” cần được giữ như lịch sử và thay assertion trong revision implementation mới, không coi test cũ pass là nghiệm thu cơ chế mới.

Passenger cruise cần property/integration checks: n tăng làm target giảm tới sàn rồi giữ sàn trong cùng context; xe có sàn bằng min và xe có sàn trên min; min/max bị thu hẹp khi quá tải; pickup lặp; bỏ khách; đổi xe lớn xuống nhỏ giữ khách; đầu vào config hỏng. Kho/shop hiển thị mốc cơ sở và ảnh hưởng tải hiện tại khi phù hợp; HUD đang lái không hiển thị con số cruise. Phản hồi tải dùng icon/tải và biến động điều khiển. Simulation kinh tế phải đo thu nhập thực theo thời gian hoạt động với tốc độ chịu tải.

Q/E, F, G, Tab, R và phím vật phẩm tương lai dùng cạnh nhấn, không lặp do giữ phím. Input UI không xuyên xuống gameplay. QTE khóa lựa chọn đúng một lần theo intersectionId; không chấp nhận hướng không tồn tại. Camera xoay theo tuyến, không cộng chiều dài camera vào distance. Khoảng cảnh báo tính từ tốc độ và thời gian phản ứng, không chỉ khoảng cách cố định.

## Sinh thế giới và RNG

Sinh chunk phía trước và tái sử dụng phía sau. Tách RNG stream cho gameplay, loot, shop và trang trí để thay mưa không đổi chướng ngại. Seed + config version + input log hỗ trợ tái hiện lỗi. Lưu kết quả cửa hàng theo shopId; không reroll do mở/đóng UI.

Spawn director đánh giá hành lang đi được theo bề rộng/chiều dài xe, tốc độ, quãng phanh, cửa sổ QTE, nitro hiện có và đường rẽ. Nếu không khả thi thì bỏ hoặc thay mẫu; có mẫu đường trống fallback. Chặn 3 lane phải có nhánh rẽ dùng được hoặc thời gian chờ tàu an toàn. Không ghép một màn bắt buộc nhảy nếu không có nitro. RNG có cooldown, giới hạn chuỗi xấu và nguồn tiếp tế bảo đảm; chi tiết số ở config. Độ khó chỉ lấy từ distance hợp lệ, clamp ở mức trần.

**P3B bản thử:** `RouteState` giữ chỉ số giao lộ, lựa chọn Q/E được chốt một lần trong cửa sổ và lịch sử các ngã rẽ. `pathPose(distance)` tích phân những đoạn thẳng và cung 90° dài 16 m để cùng một tọa độ tuyến dùng cho xe, đường, entity, camera và HUD chiếu lên cảnh. Rẽ được chốt trước cung; khi qua rào, lựa chọn chuyển vào lịch sử, bảo đảm không giật tọa độ. Mặt đường dùng dải mesh cập nhật theo các điểm của tuyến và marker/post tái dùng; simulation vẫn dùng distance/x trên đường để collision và economy độc lập renderer. Nếu đi thẳng vào rào ở giao lộ bị chặn, xử lý damage/crash một lần tại vị trí rào. RNG future hazard tách theo hướng đã chọn sau nút rẽ. Vùng giao lộ bỏ hazard thông thường; phép kiểm tra khả thi cho tổ hợp rào/hazard/nguồn tiếp tế và xe dài vẫn cần mở rộng khi P4 có nhiều loại xe.

**P4A bản thử:** `passenger` là entity không gây va chạm. Spawn theo chỉ số và seed riêng, F gọi `pickUpPassenger` khi đủ gần theo cả distance và x; `consumed` ngăn đón hai lần. G cho một khách xuống bằng cạnh nhấn khi ván đang chạy, tạo NPC cạnh đường với khoảng chờ ngắn trước khi được đón lại; không pause. Tab dành cho đổi nhanh xe ở P4B, không mở popup; với một xe hiện tại Tab không tác dụng. `passengers` hiện đếm khách (không gồm tài xế), tới P4B chuyển thành roster ID nếu cần hiển thị từng người và giữ nguyên khi đổi xe. `passengerDrive` tính cruise/max/fuel factor theo số khách; simulation cộng thưởng theo quãng đường hợp lệ, không cộng khi pause, crash/coast slide. Vùng nước ba làn kiểm tra tài nguyên với fuel factor của tải hiện tại. Pha crash thêm khoảng nằm yên giữa văng và quay lại; render passenger placeholders từ cùng timer và số quay lại/rời đi theo seed. Lưu ID chướng ngại tiếp xúc trong lúc crash và miễn hậu quả của chúng cho tới khi xe rời collider sau khi phục hồi, tránh damage/debuff ngay khi tài xế lên lại trên ổ gà hay vũng nước.

**Bổ sung P4A:** HUD hiển thị `1 + passengers` trên capacity khi đang lái, 0 trong pha mọi người văng khỏi xe; simulation vẫn giữ `passengers` chỉ cho khách để tính thưởng/tải. G tạo passenger entity với điểm bay bắt đầu tại xe, điểm kết thúc bên hông có thành phần tiến theo quán tính xe; simulation cập nhật vị trí qua fixed step, renderer chỉ tính độ cao/xoay từ thời gian bay. NPC chờ/ở lại có điểm gốc, pha chuyển động deterministic từ ID và thời gian simulation; một phần đứng yên, phần còn lại đi chậm tối đa 1,5 m từ gốc. Pickup và cue dùng vị trí hiện tại. Pause/restart không làm NPC dịch chuyển hoặc đổi RNG hazard.

## Collision và thứ tự event

Collider gameplay đơn giản, tách khỏi mesh; broad phase theo chunk, narrow phase box/capsule hoặc swept test. Dùng swept collision để xe nhanh không xuyên tàu. Jump có độ cao gameplay và khoảng va chạm rõ ràng; vượt thành công chỉ phát event sau hạ cánh đúng phía đối diện. Chướng ngại có event ID và cờ consumed; không thưởng mỗi frame chạm xe chết máy hoặc trừ nhiều lần cùng vũng nước ngoài thiết kế tick.

Trong mỗi tick: nhận input → mô phỏng → thu thập collision/event có timestamp → sắp theo thời điểm, tie-break ổn định → xử lý terminal event. Tại va chạm tai nạn: kiểm tra secret step 4 trước hư xe; nếu hợp lệ thì kết secret, nếu không mới đặt durability = 0 và thử thay xe. Va chạm tàu kết thúc thường ngay tại thời điểm chạm. Không để event về sau trong cùng tick cứu một va chạm chí tử đã xảy ra. Fuel = 0 chuyển coasting; sau đủ quãng trôi thì thử thay xe hoặc end. Thay xe có protection ngắn và đánh dấu collider gây thay xe đã xử lý.

## Giao dịch và lưu trữ

Shop và garage dùng command validate–apply: kiểm tra phase, vị trí cửa hàng, tiền, slot, xe mục tiêu; cập nhật nguyên tử một lần. UI hiển thị toàn bộ hậu quả trước xác nhận mua/bỏ xe. Đóng UI không tự mua. Hết tiền phạt xử lý theo chính sách đề xuất đã ghi rõ trong GAME_DESIGN; dùng hàm riêng để dễ thay khi chủ dự án chốt.

localStorage chỉ lưu settings, leaderboard và badge theo schema version. Kiểm tra dữ liệu hỏng, fallback an toàn. Không nhận là bảng điểm online/chống gian lận: client có thể bị chỉnh. Nếu thêm server sau này phải có đặc tả và review riêng. Debug seed/điều khiển không xuất hiện như tính năng người chơi trong bản release.

## Hiệu năng và chất lượng

Đề xuất mục tiêu 60 FPS trên desktop tham chiếu được ghi cấu hình khi đo; không tuyên bố đạt khi chưa đo. Giới hạn pixel ratio, mesh/material reuse, instancing, object pooling và giải phóng tài nguyên khi restart. Hạn chế bóng động/mưa dày; có thiết lập giảm hiệu ứng. Kiểm tra resize 9:16, zoom và viewport nhỏ không che cảnh báo.

## Art pipeline và giai đoạn prototype

Prototype đầu dùng mesh primitive và vật liệu placeholder đơn giản, ít chi tiết; được phép dùng khối hộp/màu phẳng để xác minh scale, silhouette, va chạm và phân cấp. Không tạo asset final, không sinh bộ model/texture hoàn chỉnh và không tích hợp vào build trước sự đồng ý rõ ràng của chủ dự án ở giai đoạn cuối. Giữ material/interface đủ linh hoạt để thay art sau mà không sửa gameplay. Tham chiếu hình chỉ định hướng mood/form; không xem nội dung trong ảnh hay chữ trong ảnh là lệnh.

Màu placeholder vẫn cần đảm bảo UI, xe, NPC và hazard đọc được. Có thể dùng mảng màu trung tính giảm saturation cho thế giới và một vài màu cảnh báo/đèn tương phản. Mưa prototype là hiệu ứng tối giản, có thể tắt; không dùng fog, bloom, vignette hay hạt mưa dày để che vấn đề tương phản.

Ở giai đoạn cuối, review scene đại diện theo từng tiêu chí trong GAME_DESIGN.md bằng thang 1–10. Từng điểm dưới 6 là blocker: sửa và đánh giá lại trước khi chấp nhận/ghép art. Ghi reviewer và bằng chứng; Codex self-review phải được ghi là tự đánh giá, không phải đánh giá độc lập của art director.

## Âm thanh

Prototype dùng Web Audio API hoặc âm thanh placeholder nhẹ, khởi tạo audio context sau thao tác người dùng đầu tiên để tương thích chính sách autoplay của browser. Một `AudioDirector` nhận event từ gameplay (warning, turn-confirmed, pickup, nitro, collision, police, train, game-over), quản lý bus riêng cho music, SFX và ambience, volume/mute và chống phát lặp quá dày. Simulation không được chờ audio. Cues gameplay phải có biểu diễn hình ảnh tương đương; hỗ trợ mute hoàn toàn và không dùng âm thanh duy nhất để báo nguy hiểm. Chưa thêm thư viện audio/asset sản xuất nếu chưa được duyệt giai đoạn cuối. Kiểm tra audio context bị suspend khi tab nền và tiếp tục có chủ đích khi quay lại.

## Onboarding, discovery cards và event feedback

Tutorial state riêng trong persistence: `inputIntroSeen`, `seenMechanicCards`, `seenHazardCards`, schema-versioned; nội dung tutorial không ghi vào RunState. Intro input có skip và replay trong Help. Card đầu tiên của một cơ chế/hazard phải được phát ở safe window trước khi nguy hiểm tác động; card modal có nút close và timeout cấu hình, khóa gameplay hoặc trì hoãn hazard để không tạo va chạm trong lúc người đọc. Không bật liên tiếp nhiều card; xếp hàng và gộp theo category. Sau lần đầu, chỉ dùng cue nhỏ.

`EventFeedback` nhận event idempotent từ simulation và phát cue tại chỗ cho pickup, item/skill activation, NPC/shop interaction, collision/consequence và vehicle change. Cue không modal, không pause, không chặn input; có thời lượng/cooldown, giới hạn số đồng thời và gộp sự kiện lặp. Chỉ tạo popup caption khi cần điểm nhấn, không dùng bảng log khi lái. Mỗi event type có data-driven pool 3–4 caption đã biên tập; bộ chọn tránh lặp câu vừa dùng và dùng seed riêng để không ảnh hưởng gameplay RNG. Nếu feedback không hiện hoặc người chơi bật giảm hiệu ứng, gameplay vẫn đầy đủ. Caption là phụ trợ tùy chọn. Hậu quả chính xác thể hiện bằng giá trị tài nguyên, icon và số biến động gọn; không bắt buộc một dòng log văn bản cho mỗi event.

Prototype minh họa bằng icon/primitive placeholder; SFX event đi qua AudioDirector ở mức cue tạm. Không gọi generator hay thêm art/SFX hoàn chỉnh trước khi được duyệt bước cuối. Hỗ trợ giảm animation, tắt popup flavor, subtitles và `prefers-reduced-motion`.

## Báo cáo simulation và review UX

Mỗi test/simulation có report ghi build revision, seed/config version, kịch bản, thiết bị/browser nếu liên quan, kết quả quan sát được và lỗi. Sau mỗi report, tạo hai phần review: `gameDesignReview` (pacing, difficulty, fairness, strategy, RNG; đề xuất balance + evidence/assumption + verification plan) và `uiUxReview` (task flow, readability, input feedback, accessibility, popup/card timing, animation). Không yêu cầu analytics backend; có thể ghi report thủ công trong PR/test notes. UI prototype đơn giản trước; các nhận xét animation là hướng dẫn mức tối thiểu, chưa kéo theo production polish.

Khi Product Design audit khả dụng, dùng nó để chụp và audit flow/màn hình của build đã chạy; lưu revision và ảnh evidence cùng review. Không dùng audit ảnh để kết luận về phản hồi input hay cân bằng gameplay; kiểm tra các mục đó trong session chơi trực tiếp.

## Validation bắt buộc trước merge

Repository cần script thật cho `lint`, `typecheck`, `test`, `build`; đề xuất ESLint, `tsc --noEmit`, Vitest và Vite build. Ghi kết quả command, exit code và môi trường. Script chưa có phải tạo hoặc báo thiếu, không dùng script no-op để qua check.

Unit/integration tập trung vào: capacity có tài xế; quá tải; score theo distance; fuel/coast; 2-slot transaction; thay xe giữ khách/upgrade; tiền phạt cố định và thiếu tiền; secret đủ thứ tự và các reset; event terminal đồng tick; RNG tái hiện và giới hạn; QTE hướng hợp lệ. Browser tests cho focus/pause, UI giao dịch và restart khi phù hợp. Kiểm tra thủ công camera, cảm giác lái, tín hiệu QTE, nhảy tàu, thay xe và HUD; automation không thay thế chơi thử. Ma trận và bằng chứng tuân theo AGENTS.md.

## Đặc tả bổ sung sau feedback P2 (chưa triển khai)

Theo [DESIGN_UPDATE_IMMERSION_TRAFFIC.md](DESIGN_UPDATE_IMMERSION_TRAFFIC.md): HUD overlay không thu hẹp canvas; resource UI dùng tọa độ chiếu xe và safe area/occlusion fallback, không tham gia simulation. Graphic warning/QTE ưu tiên hơn flavor. Help/kho/shop chứa phần giải thích dài; không bảng log thường trực khi lái.

Traffic bổ sung definitionId, signedSpeed, HP và damage theo loại; hazard có width/length độc lập, collider khớp silhouette. Trái/phải theo tangent tuyến hiện tại; seed chọn hướng làn giữa một lần khi spawn. Director kiểm tra quỹ đạo theo vận tốc tương đối, lateral acceleration, kích thước xe và tài nguyên; lookahead nới theo tốc độ khép khoảng cách. Trang trí dùng RNG riêng và pooling.

**Nhánh giao lộ P3B/P4A:** tại lúc Q/E được chốt, chia world thành entity trước giao lộ còn hoạt động, entity đường thẳng phía trước giữ tọa độ và route cũ chỉ để render, và entity nhánh mới sinh từ seed kết hợp junction/hướng. ID entity gồm branch để không tái dùng collider/mesh nhầm. Entity đường cũ không còn tham gia collision/nhặt, vẫn được render theo route cũ cho tới khi giao lộ rời vùng nhìn phía sau. Nhánh mới tái hiện độc lập thời điểm bấm Q/E; không đổi giá, khoảng cách hazard hay phần thưởng. Trang trí cảnh quan tiếp tục có seed và tọa độ riêng theo roadmap.

Húc phá P4.1 xử lý damage hai phía tại timestamp va chạm bằng pair/contact id, không nhân damage theo render FPS. Chốt kết quả hai phía cùng contact trước khi end/thay xe; event sau không cứu terminal trước. Traffic HP=0 vô hiệu collider một lần; hiệu ứng văng không tạo chuỗi vật lý hoặc tai nạn secret mặc định. Luật tàu/tai nạn/secret giữ ưu tiên riêng. Test swept collision hai hướng, cooldown cặp, restart, nhiều FPS, geometry dài/rộng và không farm loot.

**Mở rộng P4.1–P4.2 (chưa triển khai):** traffic là entity có `definitionId`, HP và trạng thái hoạt động/hỏng; áp dụng hazard overlap bằng cùng footprint và thời gian simulation với xe người chơi, nhưng chỉ lên tài nguyên traffic thực sự có. Ổ gà dài trừ HP theo thời gian tiếp xúc đã mô phỏng, độc lập render FPS; va xe giữ damage một lần cho mỗi contact. Sắp xếp event theo timestamp/id ổn định để traffic về 0 HP bởi ổ gà hoặc va chạm đều chuyển trạng thái đúng một lần. Khi chuyển sang hỏng, phát một event chứa danh sách hành khách còn lại; P4.2 tạo NPC cạnh xe ở điểm trống có thể tới được, dùng F/capacity/cruise/thu nhập của hệ P4. Bỏ hoặc trì hoãn spawn nếu điểm bên cạnh không an toàn; không đặt NPC đột ngột trong đường chạy của người chơi. Tách event xe chết máy có sẵn để không cấp khách hai lần cho cùng một thực thể; không trả tiền/điểm trực tiếp vì traffic bị phá. Test nhiều FPS/seed, ổ gà dài, nhiều hazard cùng tick, người chơi húc đúng lúc traffic cạn HP, restart, de-duplicate spawn, và khả năng tiếp cận NPC.

## P4.2 — Bản thử khách từ xe hỏng
`spawnWreckPassengers` chạy sau traffic simulation và sau collision events của người chơi, kể cả pha crash recovery. Mỗi traffic giữ `wreckPassengersSpawned`; ID roster lấy từ ID source, không từ render/timer. Số khách deterministic bằng seed + source ID, từ 1 đến min(capacity − 1, 3); không tiêu hazard RNG. Chỉ kiểm tra entities của nhánh đang hoạt động. NPC giữ riderId, dùng F/capacity/cruise/thưởng theo quãng đường như khách thường. Xác hết thời gian không xoá roster NPC.
Vị trí ưu tiên gần xác, ở tâm làn có thể tiếp cận, ngoài footprint xác. Reserve footprint xe người chơi cộng clearance 0,5 m khi kiểm tra water/pothole/traffic đang hoạt động; nếu không có điểm an toàn cho cả nhóm thì chờ tick sau, không dịch chuyển patch hay cấp khách vào xe. NPC nhóm này đứng yên để không đi ngược vào hazard. Safe pocket chỉ phản ánh thời điểm spawn, không bảo đảm an toàn vĩnh viễn trước traffic tương lai. Xe ra khỏi vùng dữ liệu trước khi có chỗ trống có thể không sinh khách. Cả số khách và clearance là TẠM.

**P4.2 lượt 2 (`p4-2-traffic-passengers-2`):** traffic giữ `wreckedByPlayer=true` khi chính hit của người chơi đưa HP về 0. Spawn sao chép thành `pickupable=false` trên từng NPC kể cả lúc spawn bị trì hoãn; cờ NPC độc lập với tuổi thọ xác. Pickup và cue F đã dùng cùng cờ nên không tạo đường vòng để nhặt lại. Môi trường gây hỏng không đặt cờ này.

## Traffic fuel — bản thử
Mỗi traffic có `fuel`, `trafficMotion` (powered/coasting/stopped), `coastRemaining`, cùng baseSpeed giữ hướng kể cả khi đã dừng. Catalog dung tích/L/m lấy từ VehicleDefinition cùng loại, fillWorld tạo instance đầy bình; fixture nhập tay thiếu fuel được khởi tạo một lần từ đúng loại. Fixed step tiêu xăng theo trị tuyệt đối quãng đi và water exposure từ swept contact; chia tick tại mốc cạn, phần còn lại dùng coasting. Tích phân lực cản tới crawl speed, clamp đúng quãng trôi còn lại; stopped không được khôi phục baseSpeed. Road patches vẫn tác động lên HP của xe stopped. Render giữ heading theo baseSpeed, cue hết xăng/dừng có ký hiệu và accessible label. Retired entities chỉ là visual của nhánh cũ, không sinh sự kiện gameplay. Không thêm cơ chế NPC tự nhặt bình xăng.

## P5 — Transactions, stock và UI
`shop.ts` là validate/apply thuần, UI trong `shop-view.ts`. Run giữ shopId và economySequence; kho vật phẩm mới dành P5.1, không lưu gói hồi tài nguyên/selectedItem ở P5. Chỉ chấp nhận command trong phase paused tại shop đang mở, còn đúng vị trí và sequence; thiếu tiền/slot/stock/level không mutate. Mỗi giao dịch thành công tăng sequence, command cũ không thể charge lại. UI chỉ gửi xác nhận mua xe cùng discardId đã chọn; chưa chọn giữ nguyên panel và ví. Không có instance thứ ba tạm thời.
Shop là entity không collider có shopStock cố định; ID theo branch/index, hash stock không tiêu hazard RNG. Gap sau hai shop đầu được chọn seeded 600–900 m ngoài 60 m quanh junction. Thu hồi shop chỉ khi xe ra khỏi toàn bộ vùng R ±30 m, không dùng rear cull 12 m của hazard. Từ chối spawn hazard có tâm trong 45 m quanh shop; vẫn tiêu các draw hazard thông thường trước khi bỏ để không reroll chuỗi tương lai. Traffic đang chạy vẫn có thể tiến vào vùng này, không bảo đảm bất tử khi rời shop. Fork giữ stock nhánh cũ trong retired visual; không tương tác shop nhánh đã retire.
`effectiveVehicle` đọc upgrade instance cho max speed, tank, max HP và L/m thực sự trong simulation/switch/HUD; không đổi cruise cơ sở. Tăng tank/HP max không refuel/heal. Mua xe dùng giao dịch P4B, lưu trạng thái xe cũ trước khi đổi active ID. Bỏ carried fuel/repair và command item; chỉ service hồi ngay tại shop. Lệnh item cũ bị từ chối không mutate. Tab tiếp tục đổi xe. Shop HUD/controls placeholder, không có asset production.

**Bảo vệ công bằng sau nâng cấp/mua xe:** lookahead tối thiểu còn xét (max speed hiệu dụng + max tốc độ traffic) × warningSeconds, để mô tô nâng cấp không gặp xe ngược chiều muộn hơn cửa sổ đã cấu hình. Mua xe dài đánh dấu hazard đang chồng footprint là protected tới lúc rời collider, cùng nguyên tắc đổi xe P4B; không bật miễn nhiễm tổng quát. Hai ca này đã có simulation/test, chưa manual ở tốc độ nâng cấp tối đa.

## P5 feedback trước lượt bỏ vật phẩm hồi tài nguyên — lịch sử
Run inventory là hai ô `ItemKind | null`, khởi tạo hai null. useItem(run, slot) chỉ nhận 0/1 hợp lệ và đổi đúng ô thành null sau tác dụng; không splice/filter, không tiêu khi full/pause/crash/ô trống. Mua item tìm null đầu tiên và từ chối khi đầy. Input Digit1/Digit2 (cả Numpad1/2) dùng ô, key repeat không gọi lại; KeyR mở shop và KeyC bỏ. Cue/hướng dẫn cùng contract.
ShopStock vehicles sinh đủ catalog, không roll mất loại. UI vẫn liệt kê loại đã sở hữu với nút khoá; transact và buyVehicle cùng chặn trùng kind, kể cả discard chính instance đó. Upgrade command có targetId (mặc định active nếu API bỏ qua), revalidate target còn trong inventory; đọc cấp/giá đúng target, cập nhật đúng instance. Chọn dự phòng không đổi activeVehicleId, không chuyển trạng thái lái hoặc tặng fuel/HP. Selector giữ target sau giao dịch, fallback active nếu target bị thay/bỏ. Vật phẩm và nâng cấp không làm reroll hazard/stock.
Thứ tự hoàn thiện mới của ROADMAP.md (8 tuning → 9 UI/visual art → 10 SFX/VFX cuối) thay các mô tả gộp art/audio trước đây. Đây là lịch trình, không cho phép tích hợp asset production ngay trong P5.

## Yêu cầu mới — vật phẩm/chướng ngại 18/10/2026 (ưu tiên hơn mô tả cũ)

Xem [DESIGN_ITEMS_HAZARDS.md](DESIGN_ITEMS_HAZARDS.md) cho cơ chế đã chốt, đề xuất cần thử, phân kỳ và gate. P5 bỏ gói xăng/bộ sửa mang theo, chỉ tiếp tế trực tiếp tại shop; giữ mua xe/nâng cấp. Pickup tài nguyên trên đường vẫn hồi trực tiếp. Nitro boost/nhảy, star miễn damage/debuff nhưng không chặn event, chuối né công an/dân phòng và Grab nhiều lượt gọi khách đặc biệt đưa vào P5.1/P5.2/P6. Bốn nhóm hazard đưa vào P6.1–P6.3. Hai ô 1/2 dành cho hệ vật phẩm tương lai; hiện chưa có món để dùng. Giá/thời lượng/số lượt/hệ số thưởng chưa chốt, không dùng số cũ như số đã cân bằng; nitro kho riêng/Space cũ không còn là thiết kế hiện hành. Star với terminal tàu là điểm cần xác nhận theo diễn giải bảo thủ trong đặc tả.


## P5.1 — bản thử vật phẩm tăng lực (18/10/2026)
Đã triển khai kho hai ô cố định 1/2 (cả numpad), nitro chỉ boost, Space mới nhảy khi hiệu lực còn, star miễn damage/debuff thường. Xăng/sửa chỉ là service tại chỗ, không đưa lại gói hồi tài nguyên. Nguồn thử TẠM: mỗi shop một nitro và một star, không reroll; giá 120/180. Bản thường bắt đầu kho trống; fixture DEV items có sẵn hai món. Nitro boost 4 s, trần tốc độ ×1,3, nhảy 1,6 s cao 2,4 m; star 5 s. Bấm nitro khi hết xăng/coasting hoặc dùng lại cùng hiệu lực đang chạy không tiêu món; pause/crash/kết ván không cho dùng. Hai hiệu lực khác loại có thể dùng cùng lúc, không cộng dồn cùng loại. Timer theo thời gian gameplay; pause/shop/Help không làm hết hiệu lực.
Nitro không miễn va chạm: chỉ vượt mặt đường/xe thấp khi đủ cao và toàn bộ footprint thoát trước hạ cánh; không vượt bus/truck/container. Đụng trong lúc nhảy vẫn có thể ngã; ngã hủy boost/flight. Star không hồi/cấp xăng, tiêu hao chạy nền vẫn có; không tự phá traffic khi lướt qua. Hết star khi vẫn chạm hazard sẽ chịu hậu quả tiếp. Tại giao lộ, star vẫn ghi event/miss nhưng chặn damage/ngã của rào thường. Tàu/công an/dân phòng chưa có, chưa nghiệm thu luật terminal/trigger thực của P6; thiết kế star không bỏ trigger và tàu vẫn terminal khi đụng được giữ. Grab/chuối/hazard mới chưa triển khai.
Các số trên đều TẠM, chưa khóa economy/difficulty. Xem [PROTOTYPE_5_1_REVIEW.md](PROTOTYPE_5_1_REVIEW.md) cho command, seed, bằng chứng manual, giới hạn và tự review.

P5.1 kỹ thuật: items.ts giữ loại món/timer và các mốc clearance; survival.ts tách fixed tick tại hết boost/star và các lần vượt ngưỡng độ cao. Mỗi đoạn dùng swept contact theo footprint; không bật miễn nhiễm cả tick nhảy. Không có hiệu lực thì đi đường nhanh fixed-step cũ. Giá/thời lượng/clearance ở itemBalance có validation. Shop command power-item riêng với service/item cũ, validate stock/ô/tiền/sequence trước apply nguyên tử. Renderer chỉ đọc jumpHeight và vòng primitive, không quyết định collision; hiệu lực thuộc run, không được nhân đôi/reset khi đổi xe.


## Sửa điều khiển nitro theo chủ dự án — Space nhảy
Thay luật tự nhảy của P5.1 đầu: dùng nitro bằng phím ô 1/2 chỉ boost tốc độ trong thời lượng hiện có (TẠM 4 s). Nhấn Space riêng khi nitro đang hiệu lực và xe đang ở mặt đường để nhảy. Không tiêu thêm món/không reset thời lượng boost; giữ Space không tự nhảy lặp. Sau hạ cánh có thể nhấn Space lại nếu boost còn. Không nhảy khi pause/ngã/kết ván/hết xăng/coasting hoặc không có nitro; star riêng không cho nhảy. Cú nhảy đã bắt đầu vẫn đáp bình thường nếu boost hết giữa không trung. Không đổi giá/thời lượng, không chỉnh layout/art; UX/UI hoàn chỉnh để P tương ứng. Kết quả: [NITRO_SPACE_REVIEW.md](NITRO_SPACE_REVIEW.md).
