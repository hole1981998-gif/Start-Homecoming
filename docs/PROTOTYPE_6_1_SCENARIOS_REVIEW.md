# P6.1 — bộ thử tình huống, chưa tích hợp

Ngày 18/10/2026. Branch codex/p6-1-scenario-prototypes, base db7b79a, config p61-scenarios-1. Revision kiểm tra: source digest trong evidence/p61/simulation-summary.json; commit chứa báo cáo này. Đây là tự review của Codex từ simulation và thao tác browser thật, không có reviewer độc lập.

## Bản chơi và phạm vi

Mở http://127.0.0.1:5173/p61.html với pnpm dev. Hub có 15 tình huống: tàu hai hướng/container, một/hai công an, hai dân phòng, hai nhóm độc lập, traffic va đôi/chuỗi/rào/tàu/ổ gà, rào chắn, hàng rong và cứu thương. W/S điều tốc, A/D lái, 1/2 vật phẩm, Space nhảy trong nitro, F đón khách, Esc pause. Chơi lại reset fixture/seed. Xe và vật phẩm mẫu không phải tài nguyên ván thường.

Theo yêu cầu chủ dự án, chỉ bàn giao tình huống riêng để duyệt trước. Chưa bật quỹ đạo mới hoặc traffic tự tương tác trong director ván thường; chưa đánh giá tuyến chơi đầy đủ. Hub/scenario là DEV-only, production build không xuất p61.html. UI/art/SFX hoàn chỉnh giữ cho phase riêng.

## Hành vi mới

- Tàu hữu hạn chạy ngang liên tục; collider theo thân và đuôi, mở lane dần. Chạm thật vẫn terminal khi star/xe dự phòng; nitro chỉ cho vượt khi Space tạo độ cao hợp lệ.
- Officer có footprint NPC, chạy qua lại phản xạ ở mép; chạm thật mới bắt. Một chuối giữ cả nhóm hai người đứng yên/vô hại; nhóm khác vẫn bắt được. Mặc định tạm: vô hiệu tới cleanup, chưa có timer hồi phục.
- Traffic dùng catalog HP/damage/footprint hiện có; sweep chống xuyên, xử lý hai phía, lưu contact chống damage lặp và tái tính đường đi sau va chạm. Ổ gà giảm HP theo thời gian. Rào gây 20 HP một lần và dừng NPC; tàu gây hỏng NPC. Traffic hỏng không tự tạo event secret/instant-destroy cho người chơi. Nguồn người chơi gây hỏng được truyền trong chuỗi để khách tiếp tục từ chối đón.
- Rào hai lane có đường né; chạm người chơi gây ngã theo luật cũ. Hàng rong chạy ngang; cứu thương ngược chiều nhanh/đổi lane, placeholder trắng đỏ để nhận biết.
- Quỹ đạo theo activeSeconds, pause dừng chuyển động; chia tick tại điểm phản xạ. Render đọc pose simulation, không tự tính collision. Các số mới trong BALANCE_CONFIG đều TẠM; không sửa giá, thu nhập, bình xăng hoặc mật độ ván thường.

## Gate tự động trên source cuối

Môi trường Windows, Node 24.19.0, pnpm 11.25.0, Vite 7.1.12. Không nới rule/timeout, không bỏ test.

| Command | Exit | Kết quả |
| --- | --- | --- |
| pnpm lint | 0 | Pass |
| pnpm typecheck | 0 | Pass |
| pnpm test | 0 | 159 tests, 24 files; 14,33 s |
| pnpm simulate | 0 | 72 tests, 6 files; 13,44 s |
| pnpm build | 0 | JS 587,81 kB, gzip 157,95 kB; còn cảnh báo chunk >500 kB |

Tests mới bảo vệ: lane thông theo đuôi cả hai hướng; tàu chạy hết đường trong một tick không bị bỏ sót; S chờ/nitro+Space/star terminal; pause/restart; một chuối vô hiệu hai NPC, chạm từng người vô hại và nhóm khác còn bắt; cùng nhóm chỉ phạt một lần; không chạm NPC không bắt; sweep phản xạ/nhanh; traffic hai phía, thứ tự mảng, chống lặp/xuyên; ổ gà gây hỏng tại 99,5 m; rào/tàu tác động NPC; chuỗi hỏng/ID khách/nguồn gây hỏng; barrier/vendor/ambulance; kết quả tương đương 30/60/144 FPS.

Matrix 30 seed × 15 fixture × 10 giây = 450 lượt: mọi tick finite/tài nguyên không âm, 450 còn running theo input được script. Đây không phải win rate hay cân bằng: hình học/phase của mỗi fixture cố định, seed chủ yếu đổi kết quả khách; ca tàu phanh lâu nên chưa qua ray trong matrix. Tests riêng và manual bên dưới mới kiểm tra qua tàu. Baseline economy lịch sử trong suite vẫn chạy nhưng tắt special events; không dùng làm chứng minh economy P6.1.

## Manual gameplay — IAB, seed 17

Đã thực hiện input keyboard, không chỉ xem ảnh. Ảnh lưu trong evidence/p61; không phát hiện console error ở các ca đã kiểm tra. Số quan sát HUD được làm tròn.

| Ca / thao tác | Quan sát thật | Evidence |
| --- | --- | --- |
| Tàu trái: S 2,2 s, pause; S 2,9 s; W 5,5 s | Đầu/thân/đuôi chuyển ngang; lane phải thông trước; qua 87 m, 70 HP | 01-train-enter.png, 02-train-tail.png |
| Tàu phải / container: S 8 s rồi W 6,5 s | Qua 103 m / 96 m, 70 / 300 HP | Kiểm tra thao tác, không lưu ảnh riêng |
| Star + tàu: 2, W 4,3 s | Kết ván ở 67 m khi star còn 1,6 s, không dùng xe dự phòng | Kiểm tra thao tác |
| Restart rồi W 2,8 s, 1, Space, W 1,8 s | Qua 96 m, 70 HP; boost còn 2,2 s | Kiểm tra thao tác |
| Hai công an: W 1,9 s, 1; D 0,85 s, W 2,2 s | Hai NPC giữ lại với cue vàng/vô hại; qua 100 m, 250,3 tiền, không phạt. Manual không khẳng định chạm riêng cả hai; test bảo vệ việc đó | 03-group-stunned.png, 04-two-officers.png |
| Dân phòng: W 2,8 s, A 0,8 s, W 0,6 s | 82 m, 141,2 tiền: một khoản phạt 100 | Kiểm tra thao tác |
| Hai nhóm: W 1,9 s, chuối, W 5,8 s | Nhóm sau vẫn bắt, đổi sang car4 ở 136 m; không có miễn nhiễm toàn cục | Kiểm tra thao tác |
| Một công an: W 4,3 s, không đâm NPC | Qua 85 m, 242,9 tiền/70 HP, không bị phạt chỉ vì qua mốc | Kiểm tra thao tác |
| Traffic đôi: W 3,6 s; tiếp W 0,35 s và F | Ô tô xám hỏng, bus dừng/HP giảm, khách xuất hiện; trước F 1/2, sau F 2/2 ở 84 m | 05-traffic-crash.png |
| Chuỗi: W 3 s | Thấy xác/khách và bus còn HP; 66 m, 1/2, không tự đón | 06-chain-crash.png |
| Traffic ổ gà: W 1,4 s rồi W 1,8 s | Thanh HP NPC giảm, player 69 m/70 HP; số HP chính xác xác minh bằng simulation | 07-hole-hp.png |
| Traffic rào: W 3,4 s | Xe NPC dừng ở rào, thanh HP còn khoảng 1/3; player 70 m/70 HP | 09-traffic-barrier.png |
| Traffic tàu: W 2,2 s | NPC xám hỏng dưới tàu; player chưa chạm vẫn chạy, 49 m/70 HP | 10-traffic-train.png |
| Rào: W 7,5 s | Ngã rồi hồi phục, 95 m/70 HP, không terminal | Kiểm tra thao tác |
| Hàng rong: W 2 s, A 0,5 s, W 1,4 s | Va gây ngã, 73 m/70 HP; không instant lose | Kiểm tra thao tác |
| Cứu thương: W 3,3 s | Thấy xe trắng/đỏ đổi lane, player 71 m/70 HP | 11-ambulance-marked.png |

Mẫu performance cứu thương 120 frames: 60,006 FPS, P95 frame 16,8 ms, mean CPU 1,266 ms. Chỉ là mẫu ngắn trên máy này, không chứng minh traffic đông chạy mượt. 08-ambulance.png là ảnh iteration trước marker, 11 thay thế. Hub 15 link xác minh và lưu 12-hub.png.

## Tự review game design

Dữ kiện: tàu thông dần tạo lựa chọn chờ/né/nhảy thay vì chờ timer tắt toàn đường; nhóm sau vẫn nguy hiểm sau khi dùng chuối; chuỗi traffic tạo xác và khách, không tự cấp thưởng. Fixture chứng minh cơ chế trong phạm vi trên, chưa đo nhịp tuyến dài hoặc difficulty curve.

ĐỀ XUẤT cho vòng sau, chưa áp dụng: đo thời gian nhìn thấy NPC tới thời điểm va cho từng xe; tốc độ ngang 4,5 m/s có thể đòi phản xạ gấp khi phối hợp traffic. Thử cùng seed ở 2–3 tốc độ ngang và ghi số lần né/chuối/phanh cùng phản hồi chủ dự án trước đổi số lớn. Khi tích hợp, thử đoàn tàu dài/ngắn với cửa sổ phanh thực thay vì tăng mật độ ngay. Theo dõi số xác mới trên đường và khoảng phản ứng trước xác để tránh tạo tai nạn bất ngờ không công bằng. Economy và anxiety xăng cần tuyến dài P8, chưa chốt từ các món/xe miễn phí của fixture.

## Tự review UX chức năng

Theo yêu cầu chủ dự án, review visual hoàn chỉnh dời tới P UI/art; lượt này chỉ kiểm tra thao tác/readability từ ảnh mới và gameplay. Không chạy Product Design visual audit đầy đủ. Hub/intro nêu input theo từng ca, link quay lại trong pause, cue nhóm trúng chuối giữ lại; F là hành động đón khách thực. P2: NPC nhỏ khi xa và thanh HP có thể chồng lên cảnh đông; cần kiểm tra số người chơi nhận đúng hướng/HP trước hazard trong bản tích hợp, không chỉ sửa bằng thêm chữ. Không kết luận ảnh chứng minh timing/fairness; timing dựa thao tác và tests riêng.

## Giới hạn và gate tích hợp còn thiếu

- Chưa tích hợp director, chọn quỹ đạo công bằng ở mật độ cao, chuỗi giao lộ/nhánh và tuyến dài đầy đủ. Không gọi toàn bộ P6.1 hoàn thành.
- Engine NPC xử lý timeline nội bộ trước timeline va chạm player hiện có. Trường hợp người chơi đâm NPC đúng tick NPC va hazard/chết chưa có một timeline toàn cục thống nhất; phải xử lý/test thứ tự này trước tích hợp.
- Fuel NPC được dự đoán theo fixed tick trước khi va/dừng; có thể lệch phần thời gian còn lại trong tick. Chưa dùng kết quả đó để chứng minh economy; cần kiểm tra trước tích hợp.
- Fixture nhiều nhất ba xe; chưa stress test giao thông đông/toàn catalog kết hợp. Safe exit khách có thể trì hoãn tới khi có pocket an toàn. Các fixture không thay thế kiểm tra rẽ/cleanup tuyến thật.
- Ngày kiểm tra không gặp từ chối localhost; không suy đoán chính sách URL từ lỗi kết nối server khác.

Repo hiện không có remote; không thể fetch remote main/fast-forward hoặc push/PR/CI. Giữ base local được ghi rõ, không giả vờ có PR. Commit local sau gate/diff review; chưa push, chưa tạo PR, CI chưa chạy, review con người đang chờ, chưa merge. Chỉ sau khi chủ dự án duyệt bộ thử mới triển khai bước tích hợp và kiểm tra lại các giới hạn trên.
