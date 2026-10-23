# P6.1 — bản chơi tích hợp

18/10/2026. Chủ dự án đã duyệt bộ tình huống và yêu cầu tích hợp. Branch codex/p61-integrated-game, base local fdabb3d, runtime p61-integrated-1. Source digest và dữ liệu simulation nằm trong evidence/p61/integrated/summary.json; commit chứa báo cáo này là revision bàn giao. Đây là tự review Codex, không có chuyên gia độc lập.

## Chơi thử

Bản từ đầu: http://127.0.0.1:5173/?seed=17 . Production: pnpm build rồi pnpm preview (lượt kiểm tra dùng port5174). Bản thường bắt đầu 200 tiền/xe máy/kho trống như cũ. W/S điều tốc, A/D lái, Q/E rẽ, F/G khách, Tab đổi xe, R shop, 1/2 vật phẩm, Space nhảy khi nitro đang bật. Đã để tab ở màn bắt đầu.

Bộ19fixture DEV /p61.html vẫn giữ để so sánh/tái hiện lỗi, có link về ván thường. QA shortcut DEV integrated-checkpoint seed1 hoặc7 bắt đầu1450m với car4/xe máy dự phòng,1000tiền,chuối/nitro và tài nguyên mẫu; world/director vẫn sinh tuyến bình thường. Shortcut chỉ để test nhanh, không là nguồn miễn phí của ván thật, không dùng làm bằng chứng economy.

## Thay đổi và quyết định tạm

- Bản thường bật quỹ đạo ngang, hitbox thật và traffic tự tương tác. Sự kiện vẫn dùng stream seed riêng; giữ slot đầu1700m, gap1250m và corridor110m tránh shop/giao lộ/Grab; không tăng density hay giá/thu nhập/fuel.
- Tàu24m ngang/8,4m/s, qua cả mặt đường trong4s; chiều sâu2,8m, clearance1,8m. Hai hướng seeded; collider đi với thân/đuôi. Start ước lượng theo cruise lúc spawn, lead2,4s. Phanh chờ thay đổi thời điểm người chơi tới, không dừng tàu. Pause/shop dừng cả hai. Star/xe dự phòng không cứu khi chạm thân tàu.
- Officer footprint0,65m, nhóm một hoặc hai có groupID. TẠM: một người2/3, hai người1/3; ba profile thường4,5m/s, nhanh6,3m/s, lệch nhịp5,6/3,8m/s và lệch dọc3m. Chuối vô hiệu cả nhóm tới cleanup, không lan nhóm khác. Số nhóm/variant là mặc định seeded để thử, chưa khóa difficulty curve.
- Slot jam cũ chọn seeded rào/hàng rong/cứu thương (TẠM mỗi loại1/3), thay biến thể trong slot, không thêm slot. Rào rộng6,2m để còn lane né; hàng rong rộng1,8m/dài2,1m/ngang3,4m/s, hai hướng, start lead2s. Cứu thương dùng catalog car7, ngược chiều16m/s, ngang3m/s trong±3,2m. Kẹt xe/chết máy/accident cũ vẫn có luật tương ứng; không tự gắn secret cho xác traffic.
- Traffic va nhau/hazard gây HP hai phía, dừng hoặc hỏng và sinh khách theo luật đã duyệt. Dấu nguồn người chơi truyền trong chuỗi; khách từ xe bị người chơi làm hỏng không đón lại. Fuel chỉ tính tới lúc va/dừng, xe dừng do va không tiếp tục hao nước/xăng. Sweep fuel xét cả dịch ngang.
- Simulation chia đoạn tại thay đổi NPC và tiếp xúc player–traffic, tái tính từ cùng state; bảo vệ trường hợp player va trước/sau NPC chết, kể cả bắt đầu tick đã chồng collider. Hai crash test cũ cập nhật theo vận tốc còn lại sau phần trượt trong tick va chạm, vẫn kiểm tra quãng dừng vật lý, không nới tolerance.
- Rẽ giữ dữ liệu nhánh cũ và chuyển động của actor đã retire trong lúc còn nhìn thấy; chúng không còn collider/nhặt ở nhánh mới. Shop/hành khách/vật phẩm/tài nguyên hoạt động cùng cơ chế mới. Sửa mô tả chuối trong shop đang hiện nhầm nội dung Grab; không làm UI/art polish.

## Gate trên source cuối

Windows, Node24.19.0, pnpm11.25.0, Vite7.1.12.

| Command | Exit | Kết quả |
| --- | --- | --- |
| pnpm lint | 0 | Pass |
| pnpm typecheck | 0 | Pass |
| pnpm test --maxWorkers=1 --minWorkers=1 | 0 | 167tests/25files,35,06s |
| pnpm simulate --maxWorkers=1 --minWorkers=1 | 0 | 80tests/7files |
| pnpm build | 0 | JS592,59kB/gzip159,60kB; cảnh báo chunk>500kB còn |

Lần pnpm test mặc định chạy parallel đã fail timeout15s ở simulation P5 dài (không fail invariant); sau tối ưu đường xử lý không có contact, chạy tuần tự toàn bộ suite để tránh tranh CPU. Không đổi timeout, số seed, rule hoặc bỏ test. Hai assertion crash fail trong iteration được sửa theo remaining speed/elapsed thực của timeline mới và chạy lại pass. Không che các lần fail này bằng build pass.

Tests tích hợp mới: builder30seed×20event kiểm tra deterministic và đủ loại/profile; tuyến normal bật cờ đúng; player va trước/sau NPC chết và trường hợp chồng collider/đang bay; NPC chỉ hao fuel tới contact rồi đứng yên; branch retirement/seed; shop pause/restart; normal route30/60/144FPS. Bài FPS normal chỉ30s, còn các fixture chuyển động có bài FPS riêng; chưa coi mọi phối hợp đều đã exhaustively kiểm tra. Các test P6 cũ vẫn bảo vệ tám loại xe/luật event; chưa stress traffic cực đông cho toàn catalog.

## Simulation tuyến tích hợp

Pilot scripted chạy240s/seed, dùng shop/thanh toán thật, mua car4, bơm/sửa/mua chuối bằng tiền kiếm trong ván, F đón khách, Q chọn nhánh khi thẳng bị chắn. Không cấp tài nguyên trong test này. Các giá trị đều finite/không âm. Số moving là actorID đã thấy (hai NPC trong nhóm tính hai), không phải số lần bị phạt.

| Seed | Mét | Shop khác nhau | Mua car4 | Actor chuyển động thấy | Rẽ | Khách cuối | Kết quả |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 4466 | 6 | 1 | 2 | 1 | 5 | chạy tới cap240s |
| 7 | 4976 | 7 | 1 | 3 | 2 | 5 | chạy tới cap240s |
| 17 | 5258 | 7 | 1 | 1 | 1 | 3 | chạy tới cap240s |
| 42 | 4685 | 6 | 1 | 2 | 2 | 4 | chạy tới cap240s |
| 101 | 5211 | 7 | 1 | 1 | 2 | 5 | chạy tới cap240s |
| 126 | 5054 | 7 | 1 | 1 | 1 | 3 | chạy tới cap240s |

Pilot đọc quỹ đạo tương lai từ dữ liệu và bấm theo tick nên không đại diện phản xạ người chơi;6/6 sống không chứng minh cân bằng. Matrix570fixture và1440event cũ vẫn chạy, tách khỏi tuyến tự nhiên. Baseline mua xe đầu vẫn có median cruise85,72s/W60,18s; đó là mốc tham chiếu, không kết luận economy toàn ván đã đạt.

## Manual IAB

Thực sự bấm input; ảnh trong evidence/p61/integrated. Lượt đầu0m seed17: W/A/D, Q tại gần782m, chạy tới hết xăng/trôi và terminal1100m,21,8HP/717,7tiền,1:01. Bỏ lỡ tiếp tế/shop trong thao tác nên không mua xe ở lượt này; không gọi đây là full-route survival thành công.

Checkpoint seed1: W6,5s tới1599m; W1,5s+S3s tới1665m, thấy tàu ngang/cue; S3s rồi W4,5s qua1716m với120HP, tiếp tới1824m. A/D+F đón khách1865m, HUD2/4; tiếp tới2010m. 01-crossing.png,02-route.png,03-road.png. Mẫu1080frames/window600:60,002FPS,P95frame16,8ms,CPUrender1,115ms; mẫu ngắn trên máy này, chưa stress dense traffic.

Checkpoint seed7: W8s,1chuối,W3,5s qua công an. Lặp trên revision cuối (nhóm hai NPC) tới1728m,120HP/1139,3tiền,ô1trống,hai NPC giữ lại vô hại;08-final-group.png thay04-officers.png của iteration trước. Không khẳng định đã cố tình chạm riêng từng NPC chỉ từ ảnh; test group collision bảo vệ phần đó. Console error0 ở ca cuối.

Lượt seed7 tiếp: đi lane trái tới1866m, R mở shop sinh tại1887m. Bơm2,1L lên16L, trừ60; mua chuối vào ô1, trừ80, còn1068,2tiền. Shop pause và resume hoạt động; mô tả chuối nhầm Grab được phát hiện ở đây và sửa source sau đó. Không lưu ảnh shop, có AX xác nhận giao dịch. Kiểm tra lại gameplay/bắt đầu cuối:07-final-game.png. Restart nút thật trả về0m/200tiền/5,5L/70HP, đã để màn bắt đầu.

Revision cuối checkpoint seed7 chơi lại W5,5s,Q,W1,8s tới1627m, đường tiếp tục và event nhánh mới đổi thành tàu thay công an;06-turn.png. Chỉ ghi phần quan sát được, không suy một ảnh chứng minh mọi frame camera. Tests branch/cleanup kiểm tra dữ liệu riêng.

Production preview port5174: mở build thành công, W2,5s+A0,45s tới60m/70HP, pause; nút Chơi lại đưa về0/200/5,5L,console0error.05-production.png. Đây là smoke test production, không gọi là chơi hết tuyến production. Không gặp URL-policy denial trong lượt này.

## Tự review gameplay và UX

Dữ kiện: các hệ thống đã chạy cùng nhau; shop phục hồi tài nguyên có trừ tiền, F thay số khách, rẽ đổi event nhánh, chuối vô hiệu đúng nhóm. Pilot6seed qua4,5–5,3km mà chỉ thấy1–3actor mới cho thấy special vẫn thưa ở lịch cũ, không chứng minh nhịp đã cuốn. Tàu có nhịp chờ hữu hạn; hàng rong/cứu thương phụ thuộc slot seeded nên một seed ngắn có thể chưa thấy.

ĐỀ XUẤT P8, chưa áp dụng: đo số giây giữa hai quyết định nguy hiểm và tỷ lệ phải dùng S/A/D/vật phẩm theo từng km; thử tăng tỷ trọng biến thể sau một mốc chỉ khi có phản hồi người chơi. Giữ cảnh báo/phanh công bằng trước khi tăng density. Theo dõi tai nạn NPC tạo khách có làm tiền dễ hơn và việc ghé shop liên tục có triệt anxiety xăng; so nhiều seed với chiến thuật bỏ shop/ghé shop rồi mới chỉnh giá/fuel. Không thay economy/curve ngầm trong lượt tích hợp.

UX chức năng tự review từ input, AX và ảnh mới: input cũ được giữ, shop pause an toàn, chuối có phản hồi và ô biến mất khi dùng. P2: câu cảnh báo tàu dài có thể sát/clipped mép trái khi đoàn còn ngoài đường (ảnh01), icon và hướng vẫn thấy; cần layout ngắn/clamp theo chiều rộng chữ ở phase UX. NPC nhỏ ở xa và chỉ một cue hazard được ưu tiên là hạn chế khi phối hợp nhiều actor. UI/art audit đầy đủ vẫn dời tới phase tương ứng theo yêu cầu chủ dự án; không tự nhận đã có Product Design audit/chuyên gia độc lập. Chưa polish art/VFX/SFX.

## Hạn chế và bàn giao

Không bảo đảm zero bug từ tests. Chưa có stress tuyến rất đông xe hoặc mọi tie ba phía ở mọi kiểu xe; cần thêm regression khi có tình huống tái hiện. Director dùng corridor/quãng cảnh báo và các pattern đã duyệt, không phải solver bảo đảm mọi biến động traffic tương lai đều có lane trống. Các số/tỷ trọng mới vẫn TẠM để chủ dự án thử bản tích hợp. Những giới hạn timeline/fuel đã nêu ở báo cáo bộ thử được xử lý cho các trường hợp có test ở đây; không gọi physics mô phỏng liên tục hoàn hảo.

Đã kiểm tra diff/whitespace và credential-pattern trước commit. Repo không có remote, không thể fetch/fast-forward remote main; base local ghi rõ, không giả vờ có PR. Commit local trên feature branch; chưa push/PR/CI, review con người cho bản tích hợp đang chờ, chưa merge. Sự đồng ý làm bản tích hợp không phải phê duyệt merge. Các phase tiếp theo giữ roadmap: P6.2/P6.3 trước P7, P8 tuning, P9 UI/art, P10 SFX/VFX.
