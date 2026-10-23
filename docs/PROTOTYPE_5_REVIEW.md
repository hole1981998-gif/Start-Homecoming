# P5 — Kinh tế ven đường

Parent `be24107`, branch `feature/p5-roadside-economy`, config `p5-roadside-economy-1`. Code/tests/report trong cùng commit bàn giao. Windows, PowerShell, pnpm theo lockfile. Codex tự review từ simulation và thao tác IAB thật, không có chuyên gia độc lập.

## Thay đổi và giới hạn

C mở shop trong vùng tiếp cận thật, pause gameplay; cảnh báo/marker và nhà khối hộp ngoài đường. Bơm/sửa, mua xe, bốn loại nâng cấp ba cấp theo xe hiện tại, kho ba vật phẩm chọn trong shop/dùng R. Tab vẫn đổi xe. Kho hai xe; mua xe thứ ba phải chỉ rõ chiếc sẽ bỏ rồi xác nhận. Huỷ/thiếu tiền/hết stock/đạt cap/command cũ không trừ tiền. Tăng max bình/HP không thêm tài nguyên miễn phí; nâng cấp thay đổi simulation/HUD thật. Stock giữ nguyên khi mở lại. Run mới xoá tiền/xe/đồ/nâng cấp của ván trước.

Giá/effect theo bảng TẠM đã có, không đổi income 0,50/m hay giá car4 800. Hai shop đầu 600/1200 m là mặc định TẠM; sau đó seeded gap 600–900 m, tránh giao lộ. C ±30 m dọc/1,8 m ngang; shop không bị thu hồi trước khi hết vùng C. Chừa vùng không spawn tâm hazard mới 45 m mỗi bên shop; traffic cũ vẫn có thể chạy vào. Shop luôn có motorcycle/car4 và hai loại khác theo seed; mỗi loại một chiếc. Carried fuel/repair stock 2–4/loại. Chọn món R trong shop vì Tab đã dành đổi xe. Không thêm menu khi đang lái.

Controlled stock đã có trong shop. Nitro/Space và loot sự kiện chưa có trong lát cắt này, tiếp tục ở P6; không bán món chưa dùng được. Free pickups đường vẫn giữ baseline, yêu cầu giảm lượng hồi chờ vòng cân riêng. Chưa có art/SFX production, cảnh quan vẫn theo roadmap. Không tuyên bố P5 là economy cuối.

## Các vòng đánh giá thực tế

1. Giao dịch/unit đầu: 6/7 test pass, test ranh giới junction 60 m dùng phép tính float bị lệch dưới 60. Đổi sang remainder nguyên phù hợp quy tắc `<60` của route; không đổi generator để hợp thức hoá test. Sửa typing của helper test union để strict pass.
2. Pilot mua thật ban đầu: 16/30 cruise, 15/30 W. Phát hiện shop dùng rear cull 12 m trong khi vùng C dài hơn; mở rộng vùng C thử 30 m, giữ entity đủ toàn bộ cửa sổ. Sửa pilot tiếp cận để không bỏ qua shop vừa lùi sau camera. Kết quả giai đoạn này 25/30 mỗi chiến thuật.
3. Tách ảnh hưởng RNG: bỏ hazard trong shop corridor phải tiêu đủ số draw thông thường trước khi reject, không làm đổi cả chuỗi nguy hiểm phía sau. Thêm test stream RNG bằng nhau khi có/không có shop. Vòng kiểm tra cuối còn tăng lookahead theo max speed đã nâng cấp + tốc độ ngược chiều, và bảo vệ các collider đè lên footprint xe mới tới khi thoát; có hai test hành vi riêng. Kết quả cuối bên dưới; không tự tăng thu nhập hoặc giảm giá.

## Gate trên code cuối

| Gate | Command | Kết quả |
|---|---|---|
| Lint | `pnpm lint` | exit 0 |
| Typecheck | `pnpm typecheck` | exit 0 |
| Tests | `pnpm test` | exit 0, 95/95, 17 files |
| Simulation | `pnpm simulate` | exit 0, 13/13 |
| Build | `pnpm build` | exit 0; chunk 556,62 kB, còn cảnh báo >500 kB |

Test P5 bảo vệ vị trí/phase, pause freeze, thiếu tiền/full resources, stale transaction, mua xe thứ ba/bỏ xe rõ, giữ khách và tài nguyên xe dự phòng, stock đã bán/hết không reset, upgrades theo instance/cap/ảnh hưởng L/m thật, không refill khi tăng max, kho ba slot và R full/no-op, C/R/restart qua input/UI thật (WebGL mock trong DOM test), seed/gap/junction/RNG và cửa sổ C sau khi đi qua.

## Simulation mua thật và economy

Clear-road test không nhặt đồ/không hazard: car4 mua thật tại 1200 m sau 85,7167 s cruise hoặc 60,1833 s W; tiền sau mua ~0,02/~0,03, xăng trước mua ~0,10 L. Không suy điều này là gameplay đã cân.

`tests/shop-playtest.test.ts`: seed 17, 42, 20261017 và 100–126, mỗi chiến thuật 30 seed. Pilot né đường, chủ động tới shop 1200 m, không chi tiền shop trước đó/không đón khách; giới hạn 140 s hoặc 1250 m.

| Chiến thuật | Mua car4 thật | Median trong lượt mua | Seed lỡ cửa hàng |
|---|---:|---:|---|
| Cruise | 29/30 | 85,72 s | 115 |
| Giữ W | 28/30 | 60,18 s | 102, 126 |

Các lượt lỡ cuối cùng đủ tiền sau khi đã vượt cửa sổ/không tiếp cận kịp; không biến “đủ tiền” thành “đã mua”. Đây là heuristic pilot, không chứng minh người chơi mọi seed sẽ đạt 60–90 s. Mục tiêu có cơ hội mua ở lượt đại diện được thể hiện trong mẫu, chưa khoá balance.

Sampling survival cũ chạy 600 s, không mua shop: cruise 30/30 đủ tiền, median 85,72 s, 9 lượt chết; W 30/30, 60,18 s, 13 chết; S 30/30, 149,78 s, 2 chết. So với traffic-fuel trước P5: 13/14/3 chết. Vùng shop an toàn làm ván dễ hơn trong mẫu; không lấy shop mới làm bằng chứng difficulty đã đạt. Không so trực tiếp heuristic hai test để khẳng định chiến thuật tối ưu.

## Manual IAB, seed 17

- Fixture `?scenario=shop`: 4000 tiền, xe máy 1 L/30 HP và một khách; đây là dữ liệu QA, không phải tiền đầu game thường. Start/C mở shop, HUD distance không tăng khi mua.
- Bơm xăng: 4000→3940, xăng 1→5,5 L; Bơm bị disable khi đầy. Nâng tank: 3940→3760, tank max 5,5→6,325 L nhưng lượng giữ 5,5 L.
- Chọn car4, xác nhận: 3760→2960, xe car4 16 L/120 HP, HUD 2/4 giữ khách. Chọn buýt khi kho đã hai xe: xác nhận chưa chọn xe bỏ giữ 2960 và báo chọn xe; chọn xe máy dự phòng rồi xác nhận mới còn 560, HUD 2/25.
- Fixture shop lượt mới: mua bộ sửa 85, stock 3→2 và kho 1/3. R từ canvas khi đang chạy: HP 30→70, kho trống, cue +40 HP. DOM integration test bổ sung dùng R trong shop không có hiệu lực, Esc rời shop rồi R được, restart xoá inventory.
- Fixture `shop-insufficient`: 20 tiền, Bơm/Sửa đều disable, ví giữ 20. Screenshot hiện tại đã được quan sát trực tiếp để xem nút, giá, lối ra và phân cấp; không dùng ảnh thay bằng chứng input. Không làm audit/polish UI toàn bộ theo nhịp đã thống nhất.
- Chưa manual vòng normal 600–1200 m hoặc mọi seed/xe/giao lộ; normal-route economy được mô phỏng như trên. Chưa benchmark FPS thực, chưa kiểm tra trình duyệt khác. Fixture và screenshot không chứng minh đã đạt 60 FPS.

## Tự review gameplay — đề xuất chưa áp dụng

Dữ kiện: có mua thật trên phần lớn seed, xe máy chỉ còn ~0,10 L ở ca không tiếp tế; tiếp tế sớm tiêu tiền sẽ đẩy mốc mua xe về sau. Nhận xét: quyết định tích tiền/mua xăng có sức ép đúng hướng anxiety, nhưng vẫn cần người chơi xác nhận có căng vừa đủ hay buộc nhặt đồ quá nhiều.

ĐỀ XUẤT lượt kế tiếp: so sánh ba chính sách tiết kiệm mua car4 / bơm một lần ở shop600 / mua bộ sửa mang theo, đo thời điểm mua thực, xăng thấp và tỷ lệ kết ván; giữ income/giá trong phép so sánh. Đánh giá lại corridor45m sau khi P6 thêm nguy hiểm, ưu tiên cue trước tăng mật độ. Chưa áp dụng giảm hồi free pickup hoặc thay giá/damage; chờ nhận xét chủ dự án trước các thay đổi lớn.

## Tự review UX

Luồng C→danh mục→xác nhận→rời shop có hậu quả và giá hiển thị trước thao tác; chọn xe bỏ được focus và giữ panel khi chưa chọn, không tự bỏ xe. P1: xác nhận bỏ xe là bước cần thử kỹ bằng tay thêm, hiện có test/manual. P2: chọn món R chỉ ở shop giúp giữ Tab nhưng cần hỏi người chơi có muốn chọn nhanh ngoài đường hay không; chưa tự thêm phím/menu. Nút không đủ tiền hiện disabled và giá vẫn đọc được; style prototype đơn giản, chưa chấm art. Giữ thông tin cruise ở shop/Help, không thêm cruise HUD.

## Git và PR

Remote URL đã xác nhận `https://github.com/hole1981998-gif/Start-Homecoming.git`; ls-remote mới vẫn chỉ HEAD P4.1, không main/master. Đây là patch branch riêng từ P4.2/traffic-fuel đã duyệt, không tạo main hoặc giả vờ fast-forward main. PR theo main chưa tạo, CI/review con người revision cuối chưa có; chưa merge. Thông điệp commit dự kiến: Add roadside shops, vehicle purchases, upgrades and carried supplies.


Cập nhật tiếp nối: [P5 — tiếp tế tại chỗ và roadmap vật phẩm/chướng ngại](P5_SERVICES_ITEMS_ROADMAP_REVIEW.md). Báo cáo này giữ kết quả lịch sử; gói xăng/sửa mang theo và input cũ đã được thay thế.
