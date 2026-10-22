# P8 — báo cáo thử cân bằng 21/10/2026

> **Vòng đối chiếu mật độ 22/10/2026 đang thử:** phần báo cáo 21/10 bên dưới là lịch sử của bản P8 đầu, không còn mô tả đầy đủ director hiện tại. Kết quả mới và đối chiếu từng mục nằm ở cuối tài liệu. Các mục chưa kiểm bằng người chơi vẫn TẠM.

**Trạng thái: TẠM, chưa nghiệm thu.** Chủ dự án cho áp dụng đề xuất từ báo cáo cân bằng mới. Mục tiêu hiện hành là giao dịch ô tô 4 chỗ khoảng 20–24 giây khi chủ động đón khách và ván trung vị khoảng 4 phút. Đây là đích thử, không phải cam kết đã đạt. Bản chính `/` dùng lực; `ver.noforce.html` không được sửa riêng. File config dùng chung có thể làm số cân bằng ở bản đối chiếu thay đổi.

## Thay đổi

- Tiền đầu 280, nền 0,02 tiền/m, khách thường 0,20 tiền/khách/m. Khách đầu ở 60 m; shop đầu ở 280 m; ô tô 4 chỗ giá 300. Người không đón khách chưa đủ tiền mua xe ở shop đầu trên đường sạch.
- Hazard thường từ gap 80 m giảm dần đến 70 m trong 3 km. Special đầu 650 m, gap nhóm 360 m. Rào, hàng rong và cứu thương là ba kết quả riêng trong chu kỳ seed 12 slot; police/train/accident có khoảng cách lặp riêng. Khi shop/giao lộ/Grab hoặc vùng gió/đồ rơi cản, thử dời special 40–160 m mà giữ khoảng tối thiểu 220 m; không chèn ép vào hành lang thiếu phản ứng.
- Từ khoảng 1,2 km có một số cặp water/pothole/traffic; từ 2,4 km cặp thường xuyên hơn. Kiểm tra còn một lane trống cho xe hiện tại. Đây là bước nhỏ để thử đọc nhiều lớp, chưa phải toàn bộ 12 pattern của báo cáo.
- Cửa sổ Q/E mở theo tốc độ tham chiếu chung; xe lớn đóng sớm hơn. Mốc được chụp một lần khi tiếp cận, phanh/đổi xe không mở lại. Cung rẽ bắt đầu trước tâm 8 m nên cửa sổ đóng chậm nhất trước tâm 9 m.
- Sau vòng đo đầu vẫn quá dễ, thử giảm lượng xăng/HP nhặt và tài nguyên mô tô, ô tô 4/7 chỗ theo candidate; giảm tiếp tế shop xuống 4 L/20 HP với giá 120/140. Giữ nguyên damage/force và xăng traffic. Không lấy mật độ của stress mode làm game chính.

## Kết quả đã chạy trên máy phát triển

Revision thử: nhánh `codex/p8-balance-pass`, xuất phát từ `b0c226f`, seed ghi rõ ở từng bài; môi trường Windows, Vite/Vitest. Các số dưới đây là simulation bằng input bot, không phải đánh giá người chơi.

- `tests/shop.test.ts`, đường sạch seed 17, bot điều khiển A/D rồi F và mua bằng shop: ô tô 4 chỗ ở 20,23 giây khi chạy trung vị; 12,68 giây khi giữ W. Ca này kiểm tra giao dịch thật, không chỉ đủ tiền lý thuyết. `tests/shop-playtest.test.ts`: 30/30 seed ở cruise và 30/30 seed với W mua được khi bot ưu tiên khách đầu và ghé shop; median tương ứng khoảng 20,2 và 12,7 giây. Bot này lái có chủ đích, không đại diện người mới.
- `tests/balance-coverage.test.ts`: 100 seed, đường sinh đến 3 km, 700 cơ hội special danh nghĩa và 685 nhóm được sinh; rào xuất hiện trong 55/100 đường, hàng rong 58/100, cứu thương 55/100. Có 98 cặp hazard sinh ra; test kiểm lane trống. Đây là *spawn coverage*, chưa phải tỷ lệ người chơi gặp hoặc né thành công.
- `tests/balance-simulation.test.ts`: 30 seed × 3 bot có chu kỳ phản ứng 0,25/0,7/1 giây, giới hạn 720 giây, dùng shop/khách/điều khiển thật. Sau giảm tài nguyên, thêm cặp hazard và tránh chồng special với hazard thường: nhóm thận trọng kết thúc 14/30, nhóm trung bình 13/30, nhóm chạy nhanh 25/30; median nhóm nhanh 416 giây. Hai nhóm đầu có quá nửa lượt sống tới trần nên **chưa đo được median**, chắc chắn chưa chứng minh mục tiêu 4 phút. Các bot vẫn có thông tin vị trí hazard chính xác và thao tác F mỗi tick, nên lợi thế so với người thật. Bản bot biết trước quỹ đạo trong test tích hợp sáu seed sống hết 720 giây; đó là trần kỹ năng tham chiếu, không là bằng chứng game công bằng/dễ với con người.
- `tests/route.test.ts`: biên mở/đóng QTE, thứ tự xe nhỏ đến container và không mở lại sau phanh được test ở mức simulation. Chưa đo tỷ lệ bỏ lỡ của người thật/collider xoay mọi loại xe bằng trình duyệt.
- Trình duyệt in-app, seed 17: mở ván, thấy HUD 280 tiền và cue khách đầu; giữ A làm xe đổi hành lang, phím F thử ở gần khách nhưng ca thủ công này bỏ lỡ do thời gian thao tác; restart trả xe/tài nguyên/tiền về đầu. Fixture `?scenario=shop&seed=17`: R mở shop, giá car4 300, mua xác nhận trừ đúng 300, còn 3.700, xe đổi sang car4 10 L/105 HP và giữ 1 khách. Fixture `?scenario=events-train&seed=17`: giữ W đâm tàu kết ván ở 68 m; nút Chơi lại đưa về 0 m/200 tiền trong fixture. Ảnh [cửa hàng sau mua](p8-shop-check.png). Chưa kiểm thủ công toàn bộ QTE/nhịp cảnh báo nhiều xe và ván dài.

## Tự review game design và UX

**Dữ kiện:** mua ô tô theo cruise khớp mốc thử, W nhanh hơn nhiều; special có độ phủ ở tầng sinh đường; nhóm phản ứng trung bình vẫn quá khó kết thúc trong 12 phút. Giảm HP/xăng không giải quyết hoàn toàn vì bot có thể chọn lane và tiếp tế. Cặp hazard hiện vẫn để một lane trống, nên chủ yếu tăng tải quan sát và căn lái; chưa tạo đủ đánh đổi tài nguyên thực. Không nên tăng damage hoặc cho spawn kín 3 lane để ép median.

**ĐỀ XUẤT vòng sau, chưa áp dụng:** quan sát người chơi 2–3 ván trước; sau đó thử thêm các pattern có lựa chọn trả xăng/HP/thời gian/khách, đo nguồn nhận/hồi tài nguyên và lý do chết theo mỗi km. Đo 300–1000 seed × nhiều profile khi điều khiển bot đã hạn chế khả năng nhìn trước, cộng playtest người thật. Riêng fuel traffic phải so bật/tắt cùng seed/input rồi hỏi chủ dự án trước quyết định; hiện vẫn bật.

**UX tự review:** cue khách đầu hiển thị rất sớm và thẻ khám phá có thể dừng an toàn; đổi mốc shop đầu cần đảm bảo người mới thấy F/R kịp. HUD cửa hàng cho thấy giá và tài nguyên mới chính xác. QTE đóng sớm ở xe nặng cần thử cảm giác bằng tay ở hai hướng, nhất là container quay đầu/rơ-moóc, car7 quét đuôi và khi tốc độ W/nitro; test biên số không chứng minh cue đọc được. Không thêm polish UI/art ở lượt này.

## Giới hạn bàn giao

Mục tiêu median 4 phút **chưa đạt/chưa đo chắc**; không khóa cân bằng. Độ phủ đặc biệt đo ở tầng sinh đường, không phải encounter có thể đọc. Chưa làm đủ 12 pattern, chưa thử mẫu 300–1000 seed và chưa có đánh giá người thật. Không tự merge. Main remote vẫn không tồn tại; nhánh được tạo từ prototype mới nhất thay vì remote main.

## Vòng đối chiếu đầy đủ báo cáo nguồn — 22/10/2026

Nguồn đối chiếu: `CAP_NHAT_SAU_VAT_LY_2026-10-21.md`, các mục 1–8. **Số ở nguồn là ĐỀ XUẤT; số dưới đây là bản thử TẠM**, chưa duyệt cân bằng cuối. Bản chính force dùng director mật độ mới; `ver.noforce.html` dùng lịch đường backup. Không đổi lực, grip, sát thương, âm thanh hay art.

| Mục trong báo cáo | Đối chiếu implementation | Trạng thái đo |
|---|---|---|
| Force làm baseline; noforce backup | Director chính riêng; backup giữ lịch hazard P8 đầu. | Test cùng 100 seed kiểm backup vẫn 98 cặp/685 special. |
| Mua car4 20–24 s | Vốn 280, khách 60 m, shop 280 m, giá 300, thu nhập 0,02/0,20 tiền/m. | Bot chủ động mua median 20,2 s ở cruise; W có thể sớm hơn, đúng ngoại lệ báo cáo. |
| Hazard thường 130 m, gap 80→70 m trong 3 km | Giữ lịch này; tăng trọng số nước 2:1:1 so ổ gà/traffic và ưu tiên vũng nước 5,7 m × 24 m, có cả vũng 9,6 m × 30 m khi còn budget. | Test sinh 100 đường 3 km đếm riêng nước dài/rộng; số chỉ là *spawn*, không phải tất cả người chơi nhìn thấy. |
| Special 600–700 m, gap nhóm 300–420 m, cooldown riêng | Tám kết quả seeded đã có từ vòng đầu. Nếu shop/giao lộ/hazard chặn, giữ outcome và tìm vị trí sau đủ lead/cooldown; không chèn sát player. | Đếm planned/spawned/encountered riêng trong test. Chưa có log phân loại nguyên nhân defer vào gameplay telemetry. |
| Gió và cargo không còn gắn modulo cố định | Cơ hội theo seed từng slot, giữ pending khi corridor chặn; cùng loại cooldown tối thiểu 260 m. | Có test độ phủ qua sinh đường và bot encounter; nguồn cargo sinh không được gọi là vật rơi đã gặp. |
| 12 pattern lựa chọn | Pattern 1–6, 10 từ normal director; 7–9, 11–12 gắn special. Pattern có mirror/phase/chiều dài trên seed; trường hợp phụ bị reject nếu vi phạm corridor. | 12 ID đều xuất hiện trong 100 đường test, **không chứng minh mỗi pattern có hai lựa chọn tốt ngang nhau**. Cần quan sát quyết định người thật. |
| Tầng đơn/cặp/ba sau làm quen | Đơn trước 350 m; cặp từ 350 m; ba lớp từ 850 m. Hai nhóm nặng liền nhau cần nhịp thở tối thiểu 45 m hoặc 3 s ở max speed. | Test đo tỷ lệ cuối sau reject, không chỉ trọng số yêu cầu. Chưa chứng minh từng cao trào dài đúng 8–10 s với mọi xe. |
| Công bằng/ngõ thoát | Giữ lane trống với tổ hợp chướng ngại cứng; nước/ổ gà chắn hết đường chỉ khi ngân sách nhiên liệu/HP hiện tại đủ trả; shop, Grab, giao lộ và tàu có vùng bảo vệ. | Kiểm ở generator bằng footprint theo loại xe hiện tại. Collider xoay car7/container, lực giao thông và lựa chọn người thật còn cần chơi thử; lane trống trong một frame không đủ để kết luận công bằng. |
| Q/E xe lớn đóng sớm, không mở lại | Đã áp dụng và test biên ở vòng P8 đầu; vòng mật độ này không đổi. | Test số có, cảm giác đọc cue tay người còn thiếu. |
| Median 4 phút; 8/11 nhóm; biến thể hiếm 45–65%; 300–1000 seed × 3 profile/4 xe | Simulation bot đo terminal/censored, encounter và tần suất theo seed. | **Chưa khóa** cho tới khi có đủ kết quả và playtest người. Không tăng damage để ép đạt mốc. |
| Xăng traffic bật/tắt | Giữ bật. | Chưa có so A/B độc lập; phải hỏi chủ dự án trước quyết định tắt. |

Giải thích cho phản hồi “rất ít vũng nước”: ở bản P8 đầu, lịch 80→70 m chỉ thay **khoảng cách các slot**, còn loại slot chia gần đều ba loại; vũng nước dài hai làn ít vì size đều nhau và nhiều corridor cắt. Vòng này tăng trọng số **loại nước** lẫn **size dài**, bớt khoảng loại do special nhưng giữ khoảng cảnh báo đủ đọc. Vì vậy cần đọc số nước *encountered* cùng số *spawned*: nếu người chơi chết/ngã/rẽ trước đoạn có nước thì cảm nhận vẫn thưa dù đường seed có nhiều nước.

**Đề xuất game design để lấy ý kiến sau khi chơi:** nếu tần suất mới đã dày nhưng vẫn dễ, đo tỷ lệ người chơi chọn làn khô/nước, lượng xăng mất và nguyên nhân chết trước khi tiếp tục tăng số hazard. Một làn luôn sạch có thể biến tổ hợp thành thao tác né đơn giản; sửa pattern/cue theo dữ liệu thay vì tăng sát thương. **UX tự review:** vũng 24–30 m và patch hai làn cần được đọc trọn chiều dài từ khoảng cảnh báo; kiểm lúc camera nghiêng, giao lộ và xe lớn. Fixture `?scenario=p8-water&seed=17` đặt xe trước vũng dài để thử A/D, W/S và quan sát xăng ngay, không cấp kết quả cân bằng cho ván thường.

### Số đo mới và điểm còn lệch

`tests/balance-coverage.test.ts`, 100 seed, mỗi đường sinh đến 3 km: 700 special planned/700 spawned; 1.741 hazard gốc, 1.775 patch nước tính cả các lớp bổ sung, trong đó 319 patch nước rộng ≥5,7 m và dài ≥20 m. Trung bình khoảng 17,75 patch nước/đường 3 km và 3,19 patch nước rộng/dài. Sau 850 m, các nhóm normal sinh ra có tỷ lệ đơn/cặp/ba 285/678/231 = 23,9%/56,8%/19,3%, gần mục tiêu 25/55/20 ở tầng **spawn**. Cả 12 ID pattern xuất hiện ít nhất một lần; rào/hàng rong/cứu thương được sinh trên 57/60/56 trong 100 đường. Điều này chứng minh mật độ seed, **không chứng minh game nhìn dày trên mọi thời điểm**, vì xe có thể rẽ/chết trước hoặc cảnh báo/nhìn xa chưa đủ.

Thử 300 seed × 3 profile bot phản ứng hữu hạn, cap 720 s, force main. Cả ba profile mua car4 ở 300/300 seed; median giao dịch 20,2 s khi chạy trung vị, 12,7 s khi giữ W. Số dưới là **lần chướng ngại đi vào vùng cảnh báo đọc được theo logic**, không phải người thật đã nhìn thấy bằng mắt.

| Profile bot | Kết ván / 300 | Median thời lượng kể cả censored | Nước gặp trung bình | Nước rộng/dài gặp | Lượt đủ dài đạt ≥8 nhóm |
|---|---:|---:|---:|---:|---:|
| Thận trọng, phản ứng 0,25 s | 244 | 483 s | 29,2 | 5,0 | 274/274 |
| Trung bình, phản ứng 0,7 s | 230 | 525 s | 30,6 | 5,3 | 275/275 |
| Nhanh, phản ứng 1 s và giữ W | 283 | 325 s | 35,7 | 6,1 | 249/249 |

Các median này **không nằm trong dải mục tiêu 225–255 s**. Q25/median/Q75 theo thứ tự là 348/483/666 s với bot thận trọng, 374/525/710 s với bot trung bình và 215/325/441 s với bot nhanh. Bot chọn lane theo vị trí chính xác và có thể mua/tiếp tế tức thì, nên số sống sót không suy thành kết quả người thật. Dữ liệu đủ để bác bỏ nhận định “đã cân xong” và cho cơ sở thử tiếp; không tự tăng damage/force để ép median. Nhóm rào/hàng rong/cứu thương được *encountered* ở 204/240/202 trong 274 lượt thận trọng đủ dài; 210/245/206 trong 275 lượt trung bình; 209/224/206 trong 249 lượt nhanh. Mức khoảng 74–89% **cao hơn** dải thử 45–65%; bài sinh đường 3 km đạt dải nhưng bot thường chạy xa hơn 3 km. Cần tune theo thời lượng ván và cả tốc độ/xe, không chỉ theo số slot đường.

Giao dịch car4 trên 300 seed với profile trung bình: P10/median/P90 = 20,2/20,2/20,3 s; 289/300 lượt mua ≤24 s và 299/300 lượt ≤30 s. Đây là bot chủ ý lấy khách/shop, không phải tỷ lệ của người mới.

Kiểm tra thêm bốn xe trọng tâm, mỗi xe 20 seed × 3 profile, khởi đầu bằng xe đó đầy bình và một xe máy dự phòng để chỉ khảo sát hazard/điều khiển, **không đo economy mua xe**. Với profile trung bình, median thời lượng và số vũng nước rộng/dài gặp trung bình lần lượt: car4 505 s/5,5; car7 446 s/5,3; buýt 451 s/4,8; container 347 s/3,5. Cả bốn lượt test đều pass, không tràn stack hoặc tài nguyên NaN. Mẫu này nhỏ và cấp xe lớn từ đầu nên chưa đạt yêu cầu 300–1000 seed cho từng xe; nó chỉ chỉ ra sự khác biệt rõ giữa footprint/tốc độ và củng cố lý do không cân bằng theo xe máy duy nhất.

**Chưa hoàn tất nghiệm thu của báo cáo nguồn:** chưa có test 300–1000 seed trên đủ bốn xe trọng tâm; chưa có 12–20 người chơi/người; chưa đo nguyên nhân defer/reject từng loại và khả năng đọc cue thật; chưa so xăng traffic ON/OFF; chưa xác nhận mỗi pattern không lặp trong ba lựa chọn liên tiếp hoặc pha cao trào 8–10 s trên mọi xe. Các chỗ này không được gọi là đạt. Quyết định tắt xăng traffic vẫn thuộc chủ dự án.

**Manual:** máy chủ Vite chạy được trên 127.0.0.1:5173, nhưng Browser Use trả lỗi “URL policy gate did not grant access. The requested URL protocol is not allowed” khi bind tab HTTP localhost; chính công cụ tự ghi không thử đường vòng. Vì vậy lượt này **CHƯA KIỂM TRA THỦ CÔNG** input/camera/HUD/fixture nước/thất bại/restart. Kết quả manual của vòng 21/10 chỉ là lịch sử, không thay thế kiểm tra lượt này.

**Gate tự động trên Windows/Node/pnpm, revision làm việc 22/10:** `pnpm lint` exit 0; `pnpm typecheck` exit 0; `pnpm test` exit 0, 36 file/253 test; `pnpm simulate` exit 0, 11 file/121 test; `pnpm build` exit 0. Test coverage 100 đường và backup 100 đường exit 0. Test bốn xe focus 20 seed × 3 profile/xe exit 0 cho car4, car7, buýt, container. Lệnh mở rộng `P8_SAMPLE_COUNT=300` đã tính đủ 900 lượt và in thống kê trên, các assertions của Vitest đều pass nhưng **process exit 1** vì lỗi nội bộ Vitest `[vitest-worker]: Timeout calling "onTaskUpdate"` sau chạy dài. Chạy lại cùng 300 seed thành **sáu process 50 seed × 3 profile**, các dải 1–50, 51–100, 101–150, 151–200, 201–250, 251–300 đều **exit 0**, các test trong từng process pass; đây là gate simulation 300 seed sạch. Mẫu mặc định 30 seed × 3 profile trong `pnpm test` cũng pass.
