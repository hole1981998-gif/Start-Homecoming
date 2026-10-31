# MODEL & ANIMATION WORKLOAD — ĐƯỜNG VỀ NHÀ
Phiên bản1.0 · 21/10/2026 · Đọc cùng [ART_DIRECTION_3D.md](ART_DIRECTION_3D.md)

## 0. Cách sử dụng

Đây là **backlog sản xuất model/animation để giao cho Codex làm ở bước tiếp theo**, không phải danh sách asset đã hoàn thành. Tất cả dòng dưới đây ban đầu là TODO. Không được tick xong chỉ vì đã có placeholder primitive trong prototype.

[D] = nội dung hỗ trợ design có sẵn; [U] = yêu cầu art mới của chủ dự án; [R] = mở rộng nghệ thuật được đề xuất; [F] = interface dành phase sau. Một dòng[D] không có nghĩa clip production của nó đã tồn tại trong repo.

Bắt buộc hoàn thành mọi nhóm[D]/[U], kể cả loại chưa thấy xuất hiện trong một ván prototype. [R] được xếp ưu tiên và không tự tạo mechanic. Nếu một model đề xuất chưa có state runtime để kích hoạt, tạo spec/asset theo phạm vi được duyệt và ghi “chưa tích hợp”, không viết AI/gameplay mới để làm nó chạy.

**Trong lượt này chỉ làm hai file guide.** Không sản xuất asset, không làm UI/FX, không chỉnh balance, không merge game. Khi bên triển khai được cho bắt đầu tạo model, dùng thứ tự và gate ở cuối file.

## 1. Cấu trúc một đầu việc có thể nghiệm thu

Mỗi ID cần có:
- Source D/U/R và đoạn gameplay nó phục vụ.
- Mesh/master và biến thể, vật liệu cơ sở, damaged/wreck nếu phù hợp.
- Rig/pivot/socket và clip/pose cần thiết.
- Role player/traffic/background, khoảng camera cần đọc.
- Clip/state matrix; các state không áp dụng phải có lý do.
- Bbox/collision proxy tham chiếu, không sửa collider để fit art.
- LOD, metadata số mesh/material/triangle/bone thực tế.
- Preview neutral, góc gameplay, animation và trạng thái hư.
- QA về silhouette, thẩm mỹ, lực, clipping, pause/reset/retire.
- Trạng thái: TODO → thiết kế → model/rig → animation → QA art → QA tích hợp → duyệt. Không gộp QA art với build pass.

Danh mục dưới đây là family/module, không phải số file mesh. Có thể dùng chung geometry hoặc rig nhưng từng role/state/biến thể phải được kiểm. Không đếm đổi màu là một thiết kế silhouette mới.

## 2. Phương tiện — đủ tám loại, cả player và traffic

**Phải có8 master family và prefab cho cả2 role.** Player là hero, traffic tái dùng master có LOD/biến thể thích hợp; không cần nhân đôi asset vô ích. Container player/traffic khác cấu trúc theo design.

| ID | Nguồn | Loại và hướng tạo hình | Bộ phận cần tách / diễn xuất đặc thù |
|---|---|---|---|
|VEH-01|D/U|Xe máy đi làm: thân gọn, yếm/ốp có tiết diện, giỏ/đồ nhỏ được cân nhắc; đuôi và áo mưa rider có dấu ấn|2 bánh, tay lái/phuộc trước, thân, đèn, mounts rider/passenger; lean trái/phải, phanh chúi nhẹ, hồi thăng bằng|
|VEH-02|D/U|Mô tô: khác thật ở bình/động cơ/tư thế, có sức nặng thể thao nhưng đời thường|Bánh/phuộc/ghi đông/bình và mount cúi rider; không đổi scale xe máy để giả mô tô|
|VEH-03|D/U|Car4: hero gọn, mui/vòm bánh/cản/đuôi đẹp; ưu tiên góc sau|4 bánh/steer, thân treo riêng, kính/cửa cần nhìn; seat driver trong cabin,3passenger/window mounts và cấu hình quá tải hợp lệ|
|VEH-04|D/U|Car7: tỷ lệ dài/chắc hơn car4, nhận ra ở mui và cửa sau|4 bánh/steer, cabin,6passenger mounts và overload layout; visual root cho pivot trước tâm/quét đuôi nhẹ|
|VEH-05|D/U|Ba gác: đầu kéo hẹp, thùng/gờ/ba bánh có cấu tạo; có tính cách sinh hoạt|3 bánh, ghi đông, đầu, thùng; mounts người ở thùng không xuyên thành; rung thân/thùng tiết chế|
|VEH-06|D/U|Buýt: nhịp cửa sổ, mui dài, đuôi rõ; không thành một hộp kéo dài|Bánh/trục, thân bám trục sau, cửa/cabin;24 khách ở window/seat layout theo design, người giữ tỷ lệ bình thường|
|VEH-07|D/U|Xe tải: cabin và thùng tách khối, kiểu hàng và dây chằng hợp lý|Bánh/trục, cabin, thùng/cửa hậu; rear-pivot visual;2 khách chuẩn và overload; mount thả hàng thực|
|VEH-08|D/U|Container: đầu kéo có cá tính, khối hàng với gân có nhịp, khớp nối rõ|Player: tractor/hitch/trailer/rear axle; đủ2 vùng tiếp xúc tham chiếu. Traffic: một cụm theo design.1 khách chuẩn; rear cargo socket; không skin chung rigid nguyên khối cho player|

### Work package bắt buộc cho từng family

| ID phụ | Phần việc | Đầu ra |
|---|---|---|
|VEH-*-A|Silhouette/shape sheet|Front/side/rear/top/gameplay angle, so kích thước8 loại|
|VEH-*-B|Mesh hero/player|Hình lớn-vừa-nhỏ, bevel/normal, cabin và mount cần thấy|
|VEH-*-C|Traffic role|Cùng ngôn ngữ, footprint đúng, không có khách thò cửa sổ; có tài xế/cabin nếu nhìn thấy|
|VEH-*-D|Sơn/đời xe|Ít nhất3 palette sơn có chủ ý; clean/used không chỉ tăng noise. Traffic có tổ hợp màu tránh tất cả giống nhau|
|VEH-*-E|Damage set|Intact, damaged có nguyên nhân, destroyed/wreck; disabled do fuel là state riêng|
|VEH-*-F|Cơ cấu chuyển động|Wheels/steering/body/pivots, nhún/nghiêng/impact recovery; container có cấu trúc khớp riêng|
|VEH-*-G|Socket/metadata|Đèn, brake/indicator, engine/exhaust/spray/contact, cabin/exit/cargo|
|VEH-*-H|LOD/QA|Cả2 role và mọi state, từ camera sau9:16, không chỉ turntable|

Đèn nháy khi suýt va: chuẩn bị cụm kính/chóa, lens group và state lamp_on/off hoặc mask; event near-miss là cosmetic nếu runtime hỗ trợ. Chưa làm dynamic light/bloom, chưa thêm điểm near-miss. Tín hiệu phanh/xi-nhan không được nháy ngẫu nhiên gây hiểu sai hướng xe.

Vết cháy/hư: mesh/mask cháy quanh nơi phát hỏng phù hợp; bánh/cản/cửa có biến thể chịu lực, hood có thể lệch ở wreck. Không tự làm mỗi xe hết xăng cháy, không nổ xe tạo damage mới. Socketfire/smoke là việc chuẩn bị[F], particle để sau.

### Loại xe phụ trợ

| ID | Nguồn | Model / việc cần làm |
|---|---|---|
|VEH-09|D/U|Cứu thương: thân car7/van phù hợp collider hiện hành; màu/mảng và cụm beacon đọc rõ, state chạy/đổi làn/phanh/va/hỏng. Không tự thêm còi/ưu tiên giao thông mới|
|VEH-10|D|Tàu: đầu tàu, đoạn thân/toa nối, bogie/bánh, đầu/đuôi rõ; tổng chiều dài hữu hạn khớp hitbox. Hoạt động cả2 hướng, không kéo dài vô hạn để lấp khung|
|VEH-11|D|Xe chết máy sinh sẵn: dùng catalog, pose dừng/hood/đồ cảnh báo đúng nguồn; còn HP không đồng nghĩa destroyed|
|VEH-12|D|Cụm accident:2 xe/vật thể trong hiện trạng design, pose va có nguyên nhân; tách rõ collider accident chí tử với xác traffic thường|
|VEH-13|D|Xe lớn nằm ngang làm blocker: dùng bus/truck/container master, orientation/footprint đúng pattern, không vô tình che3 lane bằng mesh|
|VEH-14|R|Xe hậu cảnh/đậu trong sân: chỉ skin/pose từ catalog, decorative placement rõ; không thêm loại xe gameplay thứ9|

## 3. Nhân vật và hệ đa dạng

### Model family

| ID | Nguồn | Nhóm | Yêu cầu |
|---|---|---|---|
|CHR-01|D/U|Tài xế player|Hero outfit đọc được từ sau, áo mưa/mũ/túi có cấu tạo; đủ rig cho8mount xe; lái, đón/cho xuống, gồng cua, ngã, đứng dậy, quay lại|
|CHR-02|U/R|Ngoại hình player bổ sung|Đề xuất3 silhouette/trang phục ở cùng chất lượng, không gắn unlock hoặc chỉ số mới; lựa chọn sử dụng do scope tích hợp quyết định|
|CHR-03|D/U|Khách thường|Bộ modular nhưng khác silhouette/tuổi/vóc dáng; có mũ/tóc/túi/áo mưa. Không chỉ một mesh đổi màu|
|CHR-04|D/U|Khách đặc biệt Grab|Giữ đa dạng như khách thường, chi tiết nhận dạng nhỏ phù hợp loại; không biến mọi khách thành cùng một nhân vật mặc xanh|
|CHR-05|D/U|Khách từ xe hỏng/tai nạn|Dùng đúng ID/người nguồn, có distressed/recovery/refuse/board; không sinh model mới ngẫu nhiên sau khi đứng dậy|
|CHR-06|D/U|Công an|Silhouette đồng phục/mũ/áo mưa đặc trưng theo hướng stylized; chỉ, ra hiệu dừng, đi ngang, quay nhìn, tức giận, vô hiệu bởi chuối|
|CHR-07|D/U|Dân phòng|Khác công an ở thân/đồ/pose/nhịp, vẫn đọc vai; cùng contract bắt/chuối nhưng không copy mọi gesture|
|CHR-08|D/U|Hàng rong|Người và giỏ/xe đẩy/quang gánh chọn cho hợp silhouette/collider; đẩy/đi, nhìn, giật mình và phản ứng va. Bộ hàng hóa không che hướng di chuyển|
|CHR-09|R|Người bán hàng/thợ tại shop|Idle làm việc, nhìn xe, chỉ chỗ đỗ, thao tác sửa/bơm mang tính trang trí; không thêm giao dịch/timer|
|CHR-10|R|Người trong cảnh nền|Trú mưa, kéo cửa, giữ bạt, nhìn đường, đi dưới hiên. Không là nguồn khách ngẫu nhiên hoặc hazard mới|
|CHR-11|R|Tài xế traffic thấy qua cabin|Pose ngồi/quay đầu/giật mình đơn giản; không nhân rig chi tiết vô hạn, xa có thể LOD|

### Bộ khách tối thiểu theo yêu cầu đa dạng [U]

Thiết kế ít nhất12 archetype có silhouette riêng, không phải12 material:
1. Trẻ em tuổi đi học, dáng nhỏ, balô.
2. Trẻ em với áo mưa dài/mũ khác.
3. Thiếu niên dáng mảnh, hoodie/áo khoác.
4. Thiếu niên có túi chéo/tóc/mũ khác.
5. Người trẻ đi làm dáng gọn.
6. Người trẻ vóc dáng đầy hơn, outfit khác.
7. Người trẻ lao động với áo khoác/túi đồ.
8. Người trẻ phong cách năng động, silhouette khác.
9. Người trung niên dáng chắc, đồ sinh hoạt.
10. Người trung niên cao/gầy hoặc thấp/đầy, trang phục khác.
11. Người cao tuổi dáng hơi khom, cử động bình tĩnh.
12. Người cao tuổi với mũ/túi/áo khác và dáng riêng.

Phân bố nữ/nam và biểu đạt giới đa dạng trong cả nhóm tuổi, nhiều sắc da/tóc/chiều cao; không dùng phụ kiện để gán khuôn tính cách. Trẻ em và người cao tuổi cần pose seated/stand-up riêng phù hợp tỷ lệ, không scale nguyên animation người trưởng thành rồi bỏ mặc chân xuyên sàn. Không đổi tốc độ NPC/gameplay theo tuổi nếu design chưa có.

Module cần sản xuất: đầu/tóc/mũ, torso/áo mưa, tay/găng, quần/váy phù hợp pose, chân/giày, balô/túi/đồ xách. Tạo rule tương thích để tóc xuyên mũ, túi xuyên thân hoặc áo mưa xuyên bánh không xuất hiện trong tổ hợp hợp lệ.

## 4. Danh mục animation/pose bắt buộc

Tất cả clip cần start/end/loop, phạm vi retarget, priority, event hook và camera kiểm. Thời lượng dưới đây **không gán số mới**; dùng nhịp runtime hiện hành. “Clip” có thể là procedural pose có tham số nếu pipeline tạo bằng code, không bắt buộc file skeletal animation.

### 4.1 Người chơi và khách

| ID | Nguồn | Clip/state | Nội dung và điều kiện |
|---|---|---|---|
|AN-H01|D/U|idle_wait_A/B/C|Đứng chờ, đổi trọng tâm, nhìn đường; chuyển nhẹ, không lướt chân|
|AN-H02|D/U|walk / walk_turn|Đi chậm theo path đang có, quay đầu/thân theo hướng, chân khớp tốc độ|
|AN-H03|U|hail_vehicle_A/B/C|Vẫy tay gọi xe, nhón nhìn, một tay giữ áo/túi; không vẫy xuyên người bên cạnh|
|AN-H04|D/U|board_two_wheeler|Lên xe máy/mô tô, chân/handhold đúng; logic boarding không chờ clip lâu hơn|
|AN-H05|D/U|board_closed_vehicle|Vào cabin/window representation theo state; không xuyên cửa kính rõ ràng|
|AN-H06|D/U|board_tricycle|Lên thùng/ghế ba gác, mount riêng|
|AN-H07|D/U|seated_driver_*|Pose tay lái/cabin/tư thế8 xe; tay/foot target theo mount|
|AN-H08|D/U|seated_passenger_*|Ngồi sau xe máy, thùng ba gác, ghế/cửa sổ xe kín; có đúng tải/quá tải|
|AN-H09|D/U|lean_left / lean_right|Gồng cua/giữ tay, phối với forceYaw; không cộng thêm lean root|
|AN-H10|D/U|wind_brace|Áo/mũ/túi phản ứng nhẹ và thân gồng, không đổi trajectory|
|AN-H11|U|near_miss_startle|Giật mình/quay nhìn ngắn; ưu tiên thấp hơn hit/crash, không che đường bằng tay quá lớn|
|AN-H12|D/U|impact_air|Văng theo hướng lực/velocity, pose bất ngờ và phản xạ tay; runtime quyết định đường bay|
|AN-H13|D/U|ground_impact / tumble|Đáp/giảm đà, biến thể trái/phải/trước/sau theo pose; không mọi cú va đều lộn nhiều vòng|
|AN-H14|D/U|grounded / sit_recover|Nằm/ngồi một nhịp theo state hiện có, không đứng tức thì|
|AN-H15|D/U|stand_up_A/B|Chống tay, chuyển trọng tâm lên chân, đứng vững; retarget theo tuổi/vóc dáng|
|AN-H16|D/U|return_run / climb_back|Người quay lại chạy/leo tới đúng xe/mount, không teleport|
|AN-H17|D/U|refuse_board_A/B|Lắc đầu/xua tay/ôm túi quay đi, hiển thị pickupable=false nhưng không tự đặt cờ|
|AN-H18|U|gesture_angry_A/B/C|Giơ tay phàn nàn, chỉ về xe, phủi quần bực; thân/đầu có ý, không cần text/voice|
|AN-H19|D/U|drop_eject_G|Khách bị G cho xuống văng ngang theo nhịp hài đã có rồi đáp; không biến thành bước ra cửa chậm làm đổi luật|
|AN-H20|D/U|drop_land / stand / wait|Nối G sang NPC có thể chờ/đón lại đúng cooldown, không lẫn khách từ chối sau crash|
|AN-H21|U/R|relief / thank_you|Gật/cảm ơn/nhẹ nhõm sau lên xe hoặc qua đoạn khó nếu có hook; không cấp tiền/điểm|
|AN-H22|D/U|jump_takeoff / airborne / land|Player/khách gồng theo cú nhảy, không tự thay độ cao/thời gian bay|
|AN-H23|D/U|vehicle_switch_pose|Chuyển pose/mount khi Tab/auto-replacement, giữ ID/khách và state, không thêm cutscene|
|AN-H24|D/U|terminal_hold|Ngừng/giữ pose theo train/end/secret, không tiếp tục chạy/đón; không tạo UI ending|

Mặt/đầu: ít nhất neutral, tập trung, giật mình, bực/không hài lòng, nhẹ nhõm qua mắt/mày/đầu hoặc pose đơn giản có thể đọc. Không bắt buộc facial rig nhiều blendshape nếu gameplay không thấy.

### 4.2 Công an, dân phòng, hàng rong và người nền

| ID | Nguồn | Clip/state | Yêu cầu |
|---|---|---|---|
|AN-S01|D/U|officer_patrol|Đi/chạy ngang hai hướng, chuyển hướng qua thân/chân, không teleport ở biên|
|AN-S02|U|officer_point_approach|Chỉ tay về xe đang đến, đầu nhìn đúng mục tiêu; nhóm2 người khác phase|
|AN-S03|D/U|officer_stop_gesture|Giơ tay ra hiệu dừng/bắt ở state hợp lệ; gesture không quyết định collider|
|AN-S04|U|officer_passed_angry|Quay nhìn xe vượt qua, giơ tay bực; không tự chuyển thành truy đuổi|
|AN-S05|D/U|banana_react / stunned_hold|Trúng chuối, phản ứng mặt/thân và đứng vô hại; áp cả nhóm đúng luật, không tiếp tục bắt qua animation|
|AN-S06|D/U|militia_variants|Cùng chức năng nhưng cử chỉ/nhịp/pose khác officer, không chỉ đổi màu|
|AN-S07|D/U|vendor_move / steer|Người/bánh xe đẩy/túi hàng theo chuyển động thật, hướng đọc rõ|
|AN-S08|D/U|vendor_hit / recover|Phản ứng va/ngã nếu runtime có state; không tự thêm HP/khách hay biến thành traffic phá hủy|
|AN-S09|R|shop_idle / service_pose|Thợ/bán hàng đang làm việc, chỉ vị trí; pause shop không làm clock gameplay chạy|
|AN-S10|R|shelter_rain / hold_canopy|Cụm người trú mưa và giữ bạt, secondary motion nhỏ, decorative rõ|
|AN-S11|R|traffic_driver_react|Quay nhìn/giật mình trong cabin, có LOD; không phát clip nhiều lần trong cùng near-miss|

### 4.3 Xe, hàng rơi và cảnh

| ID | Nguồn | State / motion | Yêu cầu |
|---|---|---|---|
|AN-V01|D/U|wheel_drive / steer|Quay theo quãng đường thật, tốc độ0thì dừng; phuộc/bánh trước đúng|
|AN-V02|D/U|accelerate / brake / return|Thân nhún có giới hạn, không thay root/speed; mô tô và xe tải có chất khác|
|AN-V03|D/U|lean / countersteer / recover|Theo loại xe và dữ liệu simulation, không quay thân đồng nhất8 xe|
|AN-V04|D/U|impact / force_slide|Pose deform/rung hậu va theo hướng, mesh theo force và crash hiện có; không fake root motion|
|AN-V05|D/U|coast_to_stop|Bánh chậm dần, máy/cabin có state tắt; khác destroyed|
|AN-V06|D/U|damaged_to_wreck|Đổi damaged mesh/mask/tư thế đúngHP/state; tránh bật full wreck trước hit|
|AN-V07|U/F|burn_ready|Wreck cháy, hood/cửa/bề mặt có điểm phát; **không làm lửa/khói ở bước này**|
|AN-V08|U/F|lamp_flash / brake / indicator|Mesh lens/mask/socket có trạng thái; timing/đèn thật thuộc integration/FX sau|
|AN-V09|D/U|bus_truck_sweep|Pivot phía sau, đầu quét đúng, body/mount người không tách rời nhau|
|AN-V10|D/U|container_articulation|Tractor/hitch/trailer/rear-wheel follow; không xuyên nhau ở góc giới hạn|
|AN-V11|D/U|cargo_release|Cửa/chốt/dây hàng có pose chuẩn bị, vật từ đúng đuôi; chỉ khi source runtime thả|
|AN-V12|D/U|train_cross|Thân/toa/đuôi đi liên tục, bánh và hướng đúng, không biến mất khi còn chắn đường|
|AN-V13|D/U|crate_roll / barrel_roll / settle|Visual theo orientation/velocity hàng rơi; không quay ngẫu nhiên bất chấp quỹ đạo|
|AN-E01|U/R|tree_bend / bush_sway|Tán/nhánh theo cùng ngôn ngữ gió, gốc có trọng lượng; secondary không thêm collider|
|AN-E02|U/R|canopy_rope_cloth|Bạt/dây/áo treo có giới hạn gió; không mô phỏng cloth nặng bắt buộc|
|AN-E03|R|small_decor_react|Biển nhẹ/tấm tôn rung; không rơi vào đường thành hazard mới|
|AN-E04|D/U|retire_reset|Reset sạch pose, clip phase, damaged variant khi tái dùng object; không để NPC vừa spawn đã đang ngã|

### Luật kết hợp state

Ưu tiên: terminal → hit/crash/force pose → grounded/stand-up → boarding/return → seated/locomotion → gesture → idle. Gesture không được che state từ chối/bị vô hiệu hoặc lấy quyền điều khiển root.

Cần test tối thiểu các cặp: wind+lean; force hit+passenger ejection; jump+landing hit; star+normal impact; banana+officer gesture; switch+full roster; crash+same hazard đang chồng; damaged+coasting; terminal+clip đang chạy. “Star+impact” không tự diễn ngã nếu simulation đã miễn, nhưng vẫn có pose gồng nhẹ không làm hiểu sai.

## 5. Chướng ngại và mặt đường — đủ mọi nhóm

| ID | Nguồn | Family / biến thể | Model/animation/contract |
|---|---|---|---|
|HAZ-01|D/U|Nước nhỏ, dài1 lane,2 lane,3 lane, hai mép chừa giữa|Bề mặt/viền và bank module, silhouette nước đúng footprint; không dựng gờ cao như vật cứng. Tách mép/bùn/đá trang trí khỏi collider. Surface shader/splash để sau|
|HAZ-02|D/U|Ổ gà nhỏ, ổ voi, rãnh/đoạn dài|Miệng/vành nhựa vỡ/lòng tối có chiều sâu, các size đúng collider; không là ellipse đen phẳng hoặc hố sâu nhìn như vực terminal|
|HAZ-03|D|Traffic8 loại|Liên kếtVEH-01..08 role traffic, cả cùng/ngược chiều và hỏng|
|HAZ-04|D/U|Rào sửa đường|Tấm/ray/chân đỡ/đối trọng, màu phản quang cơ sở; góc trước/sau đọc được, width hợp lối né|
|HAZ-05|D/U|Cây đổ|Thân/nhánh gãy và tán bẹp theo lực; biến thểkhô/ướt, không cành visual vươn vào lane an toàn mơ hồ|
|HAZ-06|D|Xe lớn chết máy nằm ngang|Prefab dùng master, pose/đồ cảnh báo, không thêm model lớn vượt footprint|
|HAZ-07|D|Kẹt xe2–3 lane theo pattern có giải pháp|Cụm xe và khoảng trống đọc được;3 lane chỉ khi gameplay có lối/rẽ hợp lệ. Không điền props kín khoảng né|
|HAZ-08|D|Accident sinh sẵn|Cụm va có nguyên nhân, damaged panels, props báo nguy đúng vai. Không dùng cùng silhouette/cue cho mọi xác traffic|
|HAZ-09|D|Xe hỏng do môi trường/va traffic|Wreck variant theo loại, vị trí khách thoát; không tự đổi thành accident terminal|
|HAZ-10|D/U|Tàu ngang + hạ tầng đường ray|Ray/tà vẹt/mép giao cắt/biển nếu phù hợp, train hữu hạn; gate/cột là visual khi runtime hỗ trợ, không tự thêm luật đóng đường|
|HAZ-11|D/U|Công an1/2 người|CHR-06, footprint người; có pose thường/nhanh/lệch phase, chuối toàn nhóm|
|HAZ-12|D/U|Dân phòng1/2 người|CHR-07, phân biệt vai và group|
|HAZ-13|D/U|Hàng rong băng đường|CHR-08 + cart/basket; vừa đủ footprint, hàng hóa không quá dày|
|HAZ-14|D/U|Cứu thương đổi làn|VEH-09, beacon lens/socket, hướng xe rõ|
|HAZ-15|D/U|Gió|Không tạo “khối tường gió” đặc. Chuẩn bị cây/bạt/áo mưa và vùng placement; wind graphic/particle là[F], không model một hộp màu thay art|
|HAZ-16|D/U|Kiện nhẹ rơi|Thùng gỗ/carton/chằng, pivot trọng tâm, hướng rơi/roll,1–2 biến thể silhouette không đổi hitbox|
|HAZ-17|D/U|Thùng nặng rơi|Barrel có vành/mép/đầu, khác kiện rõ; socket nguồn và roll/impact/settle|
|HAZ-18|D|Rào đường thẳng tại giao lộ|Nhìn rõ đường bị chặn, mặt sau/chéo đủ; không che cue hướngQ/E|
|HAZ-19|R|Chóp nón, bao cát, cọc, biển tạm, dây cảnh giới|Dressing theo rào/shop/bão; chỉ có collider nếu design gán. Không biến tất cả thành hazard mới|

**Kích thước nước/hố:** lấy bảng hiện hành khi tạo asset. Dùng module có thể thay đổi width/length mà không kéo texture/normal hoặc scale props đá lên khổng lồ. Nước hai mép là hai phần chung bố cục, không một plane che lane giữa. Không tự bật lại lực ngang của nước đang tắt trong design.

## 6. Pickup, vật phẩm và công trình dịch vụ

| ID | Nguồn | Family | Đầu việc |
|---|---|---|---|
|ITM-01|D/U|Pickup xăng trên đường|Can/bình có tay cầm/nắp/mảng nhận diện, đọc xa; mesh lúc có/chưa lấy, proxy tầm nhặt chỉ để đối chiếu|
|ITM-02|D/U|Pickup sửa/HP|Hộp dụng cụ/bộ sửa đọc khác xăng, bản đóng/mở nếu nhìn cần; không dùng biểu tượng UI làm mesh duy nhất|
|ITM-03|D|Nitro|Asset nhận diện vật phẩm phù hợp palette, mount/nắp/điểm động cơ; không tự thêm nitro pickup ngoài các nguồn có sẵn|
|ITM-04|D|Invincible star|Hình nhận diện nếu cần trưng bày/preview; material region/socket cho hiệu lực sau. Aura/trail/shield làFX, không làm ở model phase|
|ITM-05|D/U|Chuối|Mesh cầm/ném/tiếp xúc, socket tay release, hình đơn giản sạch; không sinh nhiều projectile gây phạt mới|
|ITM-06|D/U|Grab/điện thoại|Điện thoại/prop nhận diện nếu nhân vật dùng, pose gọi/cất, không làm màn app/UI. Không biến thành loot vật lý khi design không có|
|ITM-07|D/F|Tiền rơi ở ổ gà|Chỉ spec prop/mảnh nhỏ nếu phase feedback cần; không thêm coin collectible hay đổi amount tiền|
|SRV-01|D/U|Shop ven đường|Facade, hiên, dấu nhận diện dịch vụ, vị trí tiếp cận rõ; ít nhất3skin chung footprint để tránh mọi shop y hệt|
|SRV-02|D/U|Khu tiếp xăng|Trụ/ống/đồ nghề đúng phong cách, mount nozzle; không dựng UI mua xăng|
|SRV-03|D/U|Khu sửa/nâng cấp|Bàn, kích/đồ nghề/giá lốp/phụ tùng, chỗ chiếc xe xem preview; không thêm garage mechanic|
|SRV-04|R|Module thay đổi upgrade về hình ảnh|Engine/tank/armour/economy detail nhỏ nếu scope duyệt;3 cấp có thể dùng part swap tiết chế, không biến thành xe chiến đấu|
|SRV-05|R|Nhà/hiên “về nhà”|Landmark cảm xúc hoặc prop ending nếu được chọn; không tự thêm đích vật lý cần đến hay thay chuỗi secret|
|SRV-06|D/F|Vật thể trên màn kết/preview|Tái dùng hero mesh nếu cần; badge/leaderboard/icon/caption/UI nằm ngoài workload này|

Các item chỉ cần mesh khi có chỗ sử dụng/trưng bày rõ trong pipeline. Không vì đã làm model mà thêm nguồn spawn hoặc nhét thêm đồ lên xe. Model nguồn tài nguyên phải phân biệt với can/thùng trang trí ven đường.

## 7. Road kit và continuity

| ID | Nguồn | Module / yêu cầu |
|---|---|---|
|ROAD-01|D/U|Đường thẳng3 lane, mặt trên/mép/vỉa; các đoạn đường hiện có, không thay chiều rộng|
|ROAD-02|D/U|Giao lộ/ngã rẽ: mặt đường, góc trong/ngoài, vỉa/curb đầu-kết, các nhánh đang có|
|ROAD-03|D/U|Biên đường và module chuyển vùng: gutter/mương nhỏ/bờ đất/bờ cỏ, seam không lộ sau cua|
|ROAD-04|D/U|Vạch, cọc, biển đường và mốc có thiết kế; giúp cảm giác tốc độ mà không giả cue bắt buộc|
|ROAD-05|D/U|Drain cover/rãnh thoát nước, bậc thềm, lối vào nhà/hiên; không tạo hố collider mới|
|ROAD-06|D/U|Lan can, rào thấp, tường rào, cột đường; corner/endcap/đổ nghiêng có chọn lọc|
|ROAD-07|D|Nhánh cũ sau cua giữ nguyên world pose, mặt sau props và đường nối không hở; prefab không gắn theo camera|
|ROAD-08|R|Cầu nhìn xa/bờ kè như landmark background; không tự thêm đường cầu có gameplay mới|
|ROAD-09|R|Đoạn mặt đường/bùn/patch cũ theo module để bớt lặp; phân biệt decorative road wear với ổ gà gâyHP|
|ROAD-10|U/F|Bề mặt dành wetness về sau: material/mask chia vùng, không làm shader/reflection ngay|

Không bake một sân/island diorama vào đường chơi. Reference có khung đảo đẹp chỉ gợi cách bố cục, không yêu cầu đường game bị cắt thành đảo nổi.

## 8. Bộ cảnh quan đầy đủ

Mỗi ENV family cần module thẳng, góc/cua, transition, vài cấp độ mật độ và khoảng trống; LOD và biến thể palette/độ ướt. Cụm gắn tọa độ thế giới/tuyến và seed; không reroll theo frame/camera. Tất cả vùng mới ở đây chỉ thay visual, không tự có debuff riêng.

| ID | Nguồn | Vùng | Asset/module tối thiểu và hướng nghệ thuật |
|---|---|---|---|
|ENV-01|D/U|Nhà cửa thưa/ven đô|Nhà1–2 tầng, nhà hẹp mặt tiền, hiên/mái tôn, hàng rào/cổng, sân, bể/chậu, tường chân ngập. Ít nhất4 silhouette nhà và3 cụm đặt khác nhau|
|ENV-02|D/U|Thành phố|Shop-house/nhà tầng, mặt tiền lùi/nhô, mái/ban công/cửa, góc phố, trạm chờ/quầy nhỏ; ít nhất5facade cấu trúc, không chỉ5 texture|
|ENV-03|U|Công viên|Lối dạo chỉ trang trí, ghế, bồn cây, cổng/rào thấp, đèn fixture, sân/bãi cỏ; có khoảng trống và cụm trú mưa|
|ENV-04|D/U|Hàng cây|Ít nhất4kiểu thân/tán: rộng, cao, phân nhánh, mảnh;3dáng mỗi kiểu, bản gió/bão chọn lọc. Có rễ/đế hợp cảnh|
|ENV-05|U|Bụi/hàng bụi|Ít nhất3 family bụi/cây thấp, cụm nở/khuyết, hàng rào xanh/góc/endcap; không che lối/hazard thấp|
|ENV-06|D/U|Đồi/vách núi/đá|Mảng đá lớn/medium/small có nhịp và bedding, chân cỏ/đất, mặt trước/sau/corner; ít nhất3 silhouette vách không cùng một mesh scale|
|ENV-07|D/U|Ruộng/cánh đồng|Ô ruộng/bờ, lúa thấp/cao, mương trang trí, chòi xa, cụm cây; biến thể đất/nước/cây tạo nhịp rộng thoáng|
|ENV-08|U|Bãi cỏ/đất trống|Cỏ thành mảng, bờ đất/đá, vũng nông trang trí ngoài đường, cây lẻ; không rải đều hoa/cỏ như noise|
|ENV-09|U|Hồ|Mép hồ cong/module bờ, bậc/kè, cây/thủy sinh, mặt nước và landmark xa; không thêm bơi/chìm/đường nước gameplay|
|ENV-10|U|Sông/kênh|Bờ nối dài, kè/mép đất, lan can, cầu/bến nhỏ nhìn xa, thuyền đậu decorative nếu duyệt; transition qua cua không lộ seam|
|ENV-11|D/U|Ven biển|Bờ cát/đá, hàng cây gió, rào/bãi cỏ thấp, mặt biển xa và đường chân trời; không tự thêm sóng tác động xe|
|ENV-12|R|Cụm quán nhỏ/điểm trú|Hiên và ghế/đồ được che mưa, mái bạt/dây chằng,2–3 nhân vật nền nếu budget; điểm ấm giúp wow|
|ENV-13|R|Cụm bến/chòi/nhà mốc|Landmark theo vùng: bến sông, chòi ruộng, cổng công viên, tháp nước/nhà mái đặc trưng; không quá nhiều cùng một khung|
|ENV-14|U|Chuyển tiếp vùng|Nhà→cây, cây→đồng, đồi→ven biển, phố→công viên, bờ hồ/sông; mix module có lý, không kẻ ranh ngang sạch ngay tâm cua|

### Prop library chung

| ID | Nguồn | Bộ props |
|---|---|---|
|PROP-01|D/U|Cột/fixture đèn đường, biển/khung biển, dây treo/tuyến cáp đặt tránh occlusion; chỉ mesh, lighting sau|
|PROP-02|U|Mái tôn/hiên/bạt, rope/cloth rig, shutter cửa kéo, cửa gỗ/kính, rèm/khung|
|PROP-03|U|Chậu, bồn, ghế/bàn, thùng rác/giỏ/khay, đồ nghề sinh hoạt; set family theo vùng|
|PROP-04|U|Bao cát, chèn mái, vệt ngập dạng mesh/mask, cành gãy/cụm lá, bùn mép; không phủ đồng loạt|
|PROP-05|U|Rào gỗ/kim loại/tường thấp/cổng và corner/endcap; hình hư có lực|
|PROP-06|U|Bậc, curb, đá kè, máng/rãnh, nền gạch/đất và chân cỏ; không thêm collision nếu chỉ dressing|
|PROP-07|R|Ô/gậy che mưa/túi hàng/giá lốp/bình đựng trong cảnh, tương thích pose và vật liệu chung|
|PROP-08|R|Dấu đời sống tích cực: chậu cây được che, ghế kéo vào hiên, dây chằng cẩn thận, cửa có màu ấm; bố trí tiết chế|

Biến thể decorative và gameplay của cùng thùng/cây/rào phải khác placement/tín hiệu. Không đặt thùng chỉ để đẹp ngay giữa lane và mong người chơi hiểu nó không có va chạm.

## 9. Ma trận coverage theo sự kiện gameplay

Dùng bảng này làm checklist để không chỉ làm model đứng yên:

| Sự kiện | Asset/state phải có | Điều không được làm sai |
|---|---|---|
|Bắt đầu/chạy/cruise/W/S|Xe nguyên vẹn, driver/passenger seated, bánh/steer/body|Không quay bánh khi0tốc độ, không tự đổi tốc|
|Lái nhanh/đảo hướng|Lean, car7 rear sweep, bus/truck front sweep, trailer follow|Không cộng yaw/lean hai lần hoặc kéo người rời mount|
|Gió|Brace người, phần phụ/tán/bạt phản ứng|Không gắn lực mới cho mọi prop|
|Qua nước|Mesh đúng footprint, wheel/engine sockets|Không tạo splash/shader phase này; không bật water-current mechanic|
|Qua ổ gà|Rim/depth đọc được, impact pose/bounce|Đồ họa không tạo nhiều damage event|
|Va traffic/force|Damaged mesh, hit/skid, ejection nếu simulation có|Không tự ragdoll hoặc cộngdamage ngoài arcade|
|Ngã/quay lại|Air→ground→stand→run/climb; ID/roster liên tục|Không teleport khách lại bên xe|
|Khách không quay lại|Refuse/angry/idle roadside|Không hiện pose mời F hoặc tự mở pickup lại|
|F/G|Boarding/mount, eject/land/cooldown wait|Không cho một khách vừa ở trên xe vừa đứng đường|
|Tab/auto-replace|Đổi mesh/pose/mount, saved damage state xe cũ|Không reset tài nguyên hoặc mất khách hình ảnh|
|Hết xăng/coasting|Powered→coast→stopped, driver pose|Không mặc nhiên cháy/hỏng HP|
|Traffic hỏng|Wreck đúng loại, exit sockets/NPC một lần|Không tự gán accident chí tử|
|Cargo rơi|Source vẫn chạy, chốt/cửa/rope, vật từ rear socket|Không bay từ hông hoặc rơi sau source đãhỏng|
|Police/militia|Patrol/point/stop/passed-angry;1/2NPC|Chỉ bắt theo simulation, không theo animation bàn tay|
|Chuối|Throw/impact/stunned whole group|Không tiếp tục animation bắt khi vô hiệu, không phát lại item|
|Tàu|Train hữu hạn cả2 hướng, pose cất/hạ khi nitro|Không ẩn train body trước khi collider rời|
|Nitro/star|Pose boost/jump; socket/mask tương lai|Star không cứu tàu hoặc xóa phạt|
|Shop|Facade/approach readable, service props|Không làm UI và không thêm thời gian sửa bắt buộc|
|Junction/QTE|Road/corner kit, body/guest mounts theo cua|Không model arrowUI hoặc đổi cửa sổ QTE|
|Secret/end|Terminal pose, dùng hero/khách hiện hành|Không sửa chuỗi, thêm đích nhà hoặc làmbadge UI|
|Restart/pause/retire|Pose/variant/clip reset và freeze|Không entity cũ hiện lại với clip rơi hoặc effecthook còn bật|

## 10. Scope phase sau — chỉ bàn giao nhu cầu [F]

| Phase sau | Model team phải chuẩn bị | Chưa làm ở bước này |
|---|---|---|
|Lighting|Fixture/lens/material slots, mặt bắt sáng đẹp|Đèn production, shadow tuning, neon/bloom|
|Shader/material response|UV/vertex color/masks wet/paint/glass/rubber/charred|Water shader, wetness runtime, toon/PBR shader mới|
|VFX|Socket fire/smoke/exhaust/spray/spark/cargo/banana|Particle, splash, mưa, wind trail, lửa, khói, mànflash|
|UI|Hero/props có preview angle và ID ổn định|HUD/icon/caption/card/QTE graphic/menus/leaderboard|
|SFX|Event/locator có tên để nối|Âm thanh/nhạc/voice/còi|
|Camera|Bbox, vùng có thể occlude, recommended gameplay views|Shake/zoom/cutscene hoặc đổi kiểu camera chưa duyệt|

Nháy đèn là yêu cầu diễn xuất của xe; bước này tạo trạng thái lens/mask/socket. “Bốc cháy” là yêu cầu visual cuối; bước này tạo wreck/charred mesh và hook. Không báo hai việc đã hoàn thành chỉ vì đặt được locator.

## 11. Thứ tự sản xuất sau khi được cho bắt đầu

| Batch | Nội dung | Gate hoàn tất |
|---|---|---|
|A — Mẫu chuẩn art|Hero car4 + xe máy,1NPC/rig,1 cụm hiên,1cây,1nước/ổ gà|Preview đủ góc9:16, shape/color/nuance đạt rubric; chủ dự án duyệt hướng trước nhân catalog|
|B — Catalog xe|Đủ8 master,16 role prefab, cứu thương, train; pivots/LOD/damage|Bbox/scale đúng, player đẹp từ sau, traffic nhận diện cả2 hướng; không bỏ ba gác/tải/bus|
|C — Người/diễn xuất|Player,12 archetype khách, officer/militia/vendor; các clipD/U|Retarget/mount8 xe, bus đủ khách, crash/refusal/gesture hợp state|
|D — Hazard/item/shop/road|HAZ/ITM/SRV/ROAD bắt buộc|Đủ loại đang có trong docs, không chỉ những loại hiện spawn thường xuyên|
|E — Cảnh quan|ENV-01..11/14 và propU; cụmR theo ưu tiên|Vùng có bản sắc, đủ transition/corner/endcap, không noise/diorama cắt đường|
|F — Nối trạng thái và QA|Event coverage, collider proxy, animation mixing/reset/LOD|Chạy checklist mục9 và các kiểm tra thực, chưa gọi UI/FX xong|
|G — Mở rộng wow|CácR ưu tiên cao đã nêu trong art direction|Không tăng mechanic/scope ngoài lựa chọn; benchmark sau tích hợp|

Đây là thứ tự phụ thuộc, không là ước lượng số ngày. Ưu tiên bốn xe chính **không loại** các xe giải trí hoặc state khó khỏiDefinition of Done. Chưa đủ thì ghi TODO, không loại khỏi list.

## 12. Bộ bàn giao cho mỗi batch

- File source/module chỉnh sửa được, prefab/model đầu ra dùng được theo pipeline đã thống nhất.
- ManifestID/nguồn/role/state/clip/socket/LOD/dependency/status; tên file có nghĩa.
- Shape/scale sheet, mặt trước/sau/bên/trên và góc gameplay9:16.
- Preview animation đủ transition và bị ngắt, không chỉ loop đẹp riêng lẻ.
- So collider proxy và render ở các góc cua/lean, nhất là car7/container.
- Số mesh/material/triangle/bone thực, ví dụ sốrig/người trên bus; không bịa budget pass.
- QA art tự review theo rubric trong ART_DIRECTION_3D, ghi evidence và chỗ chưađạt.
- QA kỹ thuật theo repo khi tích hợp; chưa tích hợp thì nói rõ chưa test gameplay, không dùng render thay cho input.
- Danh sách thiếu/giới hạn và yêu cầu dành phase sau.
- Không tự merge, không sửa sources/đồng bộ, không overwrite thay đổi đang có.

### Checklist “đủ và premium”

- [ ] 8 xe đủ cả player và traffic, có ba gác/tải/bus/container.
- [ ] Player nhìn hấp dẫn ở góc sau, không chỉ góc quảng cáo.
- [ ] Đủ passenger/driver mounts, không kéo to người, bus đầy24 khách đúng.
- [ ] Model/animation phủ mọi state ở mục9, có từ chối/giận/vẫy/chỉ/đứng dậy.
- [ ] Đủ hazard/item/shop, nguồn cargo và train hữu hạn, không bỏ loại hiếm.
- [ ] Đủ nhà thưa/đô thị/công viên/cây/bụi/đồi/ruộng/cỏ/hồ/sông/biển.
- [ ] Màu tươi có kiểm soát, hint buồn/bão bằng cấu trúc và kể chuyện, không phủxám.
- [ ] Hình khối, bevel, vật liệu cơ sở, cử chỉ có nhìn nghệ thuật; không model primitive tạm được gọi là final.
- [ ] Có transition/junction/mặt sau/LOD/pivot/socket/manifest.
- [ ] Phân biệt công việc asset thực sự hoàn tất với hook cho lighting/shader/VFX/UI.
- [ ] Không tự thêm mechanic, tăngdamage, spawn vật mới, đổi balance hoặc freeze game vì clip.
- [ ] Mẫu chuẩn và batch có evidence, người duyệt thực; không giả review độc lập.

## 13. Traceability — không thiếu yêu cầu design

| Nguồn design/yêu cầu | Phần workload bao phủ |
|---|---|
|GAME_DESIGN: catalog8 xe/player–traffic, tốiđa2 xe, passengers/overload|Mục2,3,4.1,9; preview/Tab/roster là trạng thái cần hỗ trợ, không một vehicle model thứ9|
|GAME_DESIGN: crash/slide/ejection/ground/stand/return/refuse/G|AN-H12..20,AN-V04; mục9|
|GAME_DESIGN: shop/upgrades/pickup/item/secret|Mục6 và9; gói xăng/sửa mang theo đã bỏ nên không đưa lại; UIsecret đểphase sau|
|DESIGN_ITEMS_HAZARDS: blocker/cây/xe ngang, hàng rong/cứu thương, gió/cargo|Mục5, AN-S/AN-V/AN-E|
|DESIGN_MOVING_EVENTS_TRAFFIC: train hữu hạn, officer1/2, chuối nhóm, tai nạn phát sinh|VEH-10..13, HAZ-08..14, AN-S01..06, mục9|
|Design force: car7 quét đuôi, bus/truck pivot, container khớp/half-damage trailer|VEH-04/06/07/08 và contract trong art direction; mesh không tự đổi damage|
|ROADMAP: thành phố/biển/hàng cây/đồi/ruộng, continuity cảnh quan|ENV-02/04/06/07/11/14, ROAD-07|
|Yêu cầu mới: trẻ/già/nữ/nam/vóc dáng đa dạng|Mục3 và12 archetype|
|Yêu cầu mới: gesture player/NPC, công an chỉ/giận, traffic nháyđèn, xe cháy|Mục4, vehicle state, mục10FXboundary|
|Yêu cầu mới: nhà thưa/công viên/bụi/cỏ/hồ/sông/cảnhđa dạng|ENV-01/03/05/08/09/10 vàproplibrary|
|Yêu cầu mới: camera/composition nếu hữuích, premium/artistic nuance|ART_DIRECTION_3D mục1–8 vàrubric12|
|Ngoài phạm vi hiện tại: UI/shader/đèn/VFX/SFX|Mục10 ghiinterface, không cótask sảnxuất cácphase này|

Nếu HEAD của game có bổ sung asset/state sau khi guide được viết, cập nhật thêm một dòng source→asset/clip trước sản xuất; không suy “guide đủ” nghĩa có thể bỏ qua thay đổi mới.

## 14. Lời bàn giao để bên triển khai đọc

Đọc ART_DIRECTION_3D.md trước rồi file này. Ưu tiên guide mới khi màu/mood/chất lượng art mâu thuẫn ghi chú cũ. Chưa tự sản xuất UI/FX hoặc tiếp tục tuning. Khi được chủ dự án cho bắt đầu model, đề xuất batchA cụ thể, làm mẫu chuẩn và xin nhận xét trên hiện vật; sau đó sản xuất đủ cácfamily/stateD/U. CácR có giátrị phải được phân vai và scope rõ. Không bỏ state ít xuất hiện, không tạo clip để đổi gameplay, không dùng lighting để che model qua loa.

