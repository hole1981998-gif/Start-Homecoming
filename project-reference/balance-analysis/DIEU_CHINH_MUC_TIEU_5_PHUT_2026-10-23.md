# P8 — điều chỉnh mục tiêu trung vị 5 phút, 23/10/2026

> **Đính chính sau kiểm chứng implementation:** script thí nghiệm của chat Balance đã thay thế chuỗi số liên tiếp sai, làm hoán đổi tank car4/car7 trong bản sao sinh ra: car4 16,9 L, car7 13 L, khác bảng chủ đích 13/16,9 L. Vì vậy số 309 s ở thí nghiệm dưới đây không đại diện đúng bảng C3. Chat code đã áp đúng bảng và chạy lại: P50 **301 s/100 seed**, xem `docs/P8_C3_IMPLEMENTATION_REVIEW_2026-10-23.md` tại commit `3ac54aa`. Giữ nguyên snapshot/script/JSON cũ làm bằng chứng lịch sử; không dùng nguồn sinh có lỗi để chép đè code game. Lỗi này thuộc script thử nghiệm của tôi, không phải lỗi implementation của chat code.

## Kết luận và phạm vi

**Giảm nhẹ nước riêng lẻ chưa đủ theo các thử nghiệm đã chạy.** Cần nới cả khả năng sống qua va chạm lẫn ngân sách xăng. Không nên làm đường thưa trở lại hoặc xóa các pattern vừa thêm. Mục tiêu 5 phút thay thế mục tiêu 4 phút; đây là thời gian chơi chủ động của người kỹ năng trung bình, cần xác nhận bằng người chơi, không phải buộc mọi bot và mọi cách chạy cùng chết ở giây 300.

Chủ dự án xác nhận tăng/nhả W tùy tình huống. Vì thế bài chạy cruise chỉ là đối chứng; phương án đạt gần 5 phút ở cruise nhưng vẫn chết sớm khi đổi ga chưa được coi là đáp ứng yêu cầu.

Lượt này chỉ phân tích và simulation trong bản sao riêng. Không chỉnh checkout game, không commit/push/merge, không gửi chat code thêm yêu cầu khi chưa được chủ dự án chỉ định cho bản này.

**Đề nghị bàn giao C3 để chơi thử:** bot đổi ga seed 1–100 có P50 **309 s (5 phút 09 giây)**, so A **145 s (2 phút 25 giây)**. Chỉ giảm nước không đạt; C3 bớt chiều dài nước 10%, nới khoảng cách nhóm 10%, giảm phí nước và tăng ngân sách xăng/HP của bốn xe chính. Thông số chi tiết ở bảng C3 và kết quả cuối bên dưới. Đây là candidate số đã chạy simulation, chưa áp dụng vào repo và chưa chứng minh trung vị người thật 5 phút.

## Nguồn và trạng thái phiên bản

- [Báo cáo Candidate A đã push](https://github.com/hole1981998-gif/Start-Homecoming/blob/ba05449c2030e60c2203b616400871438cf1601b/docs/P8_CANDIDATE_A_REVIEW_2026-10-23.md), branch `codex/p8-balance-pass`, HEAD `ba05449c2030e60c2203b616400871438cf1601b`.
- Báo cáo đã lên Git nhưng **code Candidate A vẫn chưa commit**. Simulation mới trong báo cáo này dùng snapshot working tree tại `C:/Users/Admin/Documents/Codex/2026-10-17/c-to-n-b-b-t/outputs/duong-ve-nha`, không giả định Git commit trên đã chứa code A.
- Chụp 39 file TypeScript trong `src/` và bot `tests/balance-simulation.test.ts`. SHA-256 từng file và thời điểm chụp nằm ở `experiment-2026-10-23/provenance.json`. Bản sao và các script tái chạy ở cùng thư mục. Không dùng `sources/` làm nơi chỉnh sửa.
- Nguồn Git ghi A có 71,54% nhóm nước, nước phủ ít nhất một lane trên 55,29% quãng đường kiểm; 300 bot có P50 tham khảo 185 s, kết ván gần ngang nhau vì HP và xăng. Quan sát người chơi hơn 2 phút là dữ kiện tự báo độc lập với bot.

## Phương pháp thử mới

Chạy trực tiếp simulation của game qua `stepRun`, `fillWorld`, shop và điều khiển thật ở bước 1/60 s, bằng Node v24.19.0 trên Windows. Bot lấy nguyên từ working tree, bỏ phần bọc Vitest và thêm xuất từng lượt JSON. Không dựng mô hình tiêu hao tuyến tính để thay cho gameplay. Các import được thêm đuôi `.ts` để Node đọc bản sao; logic game không đổi ngoài số candidate mô tả.

Đây là simulation tầng gameplay, không phải trình duyệt/render hay toàn bộ kết quả va chạm Cannon thời gian thực ở bản chơi. Không có manual gameplay mới trong chat này. Không chạy lint/build/toàn bộ test repo vì không triển khai thay đổi vào repo; các lượt simulation được chạy thực, không suy từ compile.

- Bot trung bình gốc: chu kỳ phản ứng 0,7 s, nhìn 65 m, chọn lane theo tọa độ chính xác và dự đoán cross-motion; biết mua xe/tiếp tế. Đây là lợi thế so người thật, không phải định nghĩa kỹ năng trung bình.
- Profile cruise giữ tốc độ tự hành; profile W chỉ đổi `accelerate=true`, giữ nguyên phản ứng và tầm nhìn để tách ảnh hưởng input tăng tốc.
- Profile **đổi ga theo tình huống** giữ cùng bot/seed/phản ứng/tầm nhìn: giữ W khi trong lane hiện tại chưa có nước/chướng ngại nhìn thấy có thời gian tiếp cận dưới 3,5 s; nhả W khi có, phanh khi gặp tàu như bot gốc. Đây là proxy minh bạch cho kiểu chơi được mô tả, không phải bản sao kỹ năng của chủ dự án. Không nhả W đồng nghĩa phanh ngay; xe còn quán tính theo game.
- Bot giới hạn 65 m có thể bỏ lỡ cue ở tốc độ cao mà người thật thấy xa hơn; chưa dùng số bot giữ W để kết luận người thật sẽ chết tương ứng. Không giảm tốc độ tối đa/đổi grip chỉ để sửa số của bot.
- Cap 720 s. Báo censored riêng; không tính median chỉ trong lượt đã chết. P50/Q25/Q75 dùng quy ước giống test nguồn: phần tử `floor((n−1)*p)` của mảng đã sắp xếp.

## Chỉ giảm nước: kết quả cùng seed 1–30

Các bài dưới dùng bot cruise, tất cả thay đổi còn lại giữ nguyên.

| Phương án | Thay đổi duy nhất | P50 | Q25–Q75 | Kết ván HP / xăng / công an / censored |
|---|---|---:|---:|---:|
| A hiện tại | Không đổi | 204 s | 167–241 s | 15 / 15 / 0 / 0 |
| Bớt xác suất chọn template nước | 58/68% → 48/58% trước/sau 1.700 m | 161 s | 138–185 s | 14 / 13 / 2 / 1 |
| Vũng ngắn hơn | Chiều dài nước trong template ×0,85 | 184 s | 146–228 s | 13 / 15 / 2 / 0 |
| Kết hợp hai điều trên | Cùng giảm xác suất và chiều dài | 182 s | 140–212 s | 16 / 13 / 1 / 0 |
| Nước ít hao xăng hơn | 0,8 → 0,68 L/s, hình học giữ nguyên | 205 s | 163–219 s | 18 / 11 / 1 / 0 |

Không diễn giải rằng “ít nước luôn khó hơn”. Generator kiểm khả thi/fallback/recent pattern và bot đổi lane theo chi phí nước; đổi một số làm thay đổi cả chuỗi quỹ đạo, tổ hợp được chấp nhận và lựa chọn tiếp tế. Nhánh không chọn nước được thay bằng template khô có gió/ổ gà/traffic, không trở thành đường trống. Đây không phải phép trừ nước khỏi cùng một cảnh bất biến.

Audit generator riêng 30 seed, car4 đầy tài nguyên, đường 350–3.000 m:

| Phương án | Nước phủ ít nhất một lane | Nhóm có nước | Nhóm có traffic |
|---|---:|---:|---:|
| A | 54,20% | 70,19% | 71,06% |
| Bớt xác suất template nước | 52,97% | 67,90% | 71,93% |
| Vũng ngắn 15% | 49,54% | 70,41% | 71,02% |
| Candidate C0 bên dưới | 51,36% | 70,44% | 71,18% |

Điểm đáng chú ý: bớt xác suất yêu cầu 10 điểm phần trăm chỉ làm tỷ lệ nhóm nước sinh thực giảm khoảng 2,3 điểm. Phải tune số sau fallback, không chỉ trọng số đầu vào. Rút chiều dài 10–15% giảm diện tích/độ dài ngập rõ hơn, vẫn giữ theme nhiều nước. Các con số phủ đường không phải phần thời gian người chơi thực sự ngâm nước.

## Thử nới tài nguyên và ảnh hưởng cách dùng W

Candidate C0 là phương án đối chứng giữ nguyên nhịp spawn, rút chiều dài template nước 10%, water drain 0,8→0,6 L/s; bốn xe trọng tâm tăng HP 35%, bình xăng 15%, giảm tiêu hao/m 15%, tăng pickup xăng 25%, pickup HP 30%. Không đổi giá, thu nhập, shop, sát thương, lực, grip, QTE, footprint hay tốc độ.

| Bài thử | A hiện tại | C0 | Ý nghĩa |
|---|---:|---:|---|
| Cruise, seed 1–100 | P50 194 s | P50 295 s | C0 gần 5 phút **ở cruise** |
| Cruise, seed 31–100 chưa dùng trong chọn vòng đầu | P50 188 s | P50 298 s | Hiệu ứng còn trên nhóm seed bổ sung |
| Cùng bot 0,7 s nhưng luôn W, seed 1–30 | P50 109 s | P50 155 s | Chưa đạt 5 phút, không thể gọi C0 giải quyết mọi kiểu chạy |
| Đổi ga theo tình huống, seed 1–30 | P50 152 s | P50 203 s | Kiểu chơi gần mô tả vẫn thiếu đáng kể |

Cruise 100 seed: A có 47 HP/50 xăng/3 công an, C0 có 58 HP/38 xăng/4 công an, không censored. Q25–Q75 đổi 159–238→211–339 s. Trong 100 cặp seed, C0 sống lâu hơn 85 cặp, ngắn hơn 15 cặp. Bootstrap paired 5.000 mẫu cho khoảng mô tả P50 C0 250–307 s, chênh P50 với A +62 đến +116 s. Đây chỉ là bất định do seed của bot, không phải khoảng tin cậy cho người thật.

C0 nới khoảng cách nhóm thêm 10% cho P50 cruise 293 s/100 seed, không tốt rõ hơn 295 s khi giữ nhịp. Vì vậy không lấy nới lịch làm giải pháp chính ở cruise. Với kiểu đổi ga cần đo riêng.

Khảo sát C0 cấp xe sẵn, 20 seed/xe, bot cruise: mô tô P50 282 s, car4 252 s, car7 264 s. Bài cấp xe không kiểm economy/mua xe; không so trực tiếp với lượt khởi đầu xe máy có dự phòng và mua car4. Bot khác của C0: thận trọng 0,25 s P50 265 s/30 seed, 1 censored; nhanh 1 s + W P50 143 s/30 seed. Đủ để thấy không thể gom mọi profile vào một median đẹp.

## Candidate cho cách chơi đổi ga

Mức C0 chưa đủ. Đã thử thêm C1/C2 dưới cùng proxy đổi ga; số cuối và lựa chọn đề nghị được cập nhật ở phần kết quả phía sau. C1/C2 không thêm mechanic; chúng điều chỉnh số để giữ đường đông và nhịp thao tác, nhưng cho phép sống qua nhiều sai sót hơn.

| Tham số | A hiện tại | C1 | C2 |
|---|---:|---:|---:|
| Chiều dài nước trong W-template | 24/27/40 m… | ×0,9 | ×0,9 |
| Water drain trên mỗi patch đang chạm | 0,8 L/s | 0,6 | 0,55 |
| HP tối đa 4 xe trọng tâm | ×1 | ×1,5 | ×1,65 |
| Dung tích xăng 4 xe trọng tâm | ×1 | ×1,2 | ×1,25 |
| Tiêu hao xăng/m 4 xe trọng tâm | ×1 | ×0,8 | ×0,8 |
| Pickup xăng 4 xe trọng tâm | ×1 | ×1,35 | ×1,4 |
| Pickup HP 4 xe trọng tâm | ×1 | ×1,4 | ×1,5 |
| Khoảng cách tâm nhóm sau shop đầu | 25,6→21,6→18,4 m | 28,16→23,76→20,24 m | Như C1 |

Đây không phải các mức nerf nhẹ 5%: tăng thời lượng từ hơn 2 phút lên 5 phút là thay đổi lớn về ngân sách chịu lỗi, dù vẫn giữ cùng cảm giác đường đông. Không hứa chỉ giảm một chút nước sẽ làm thời lượng tăng gấp đôi.

Lịch C1/C2 giữ nhóm đầu sau shop ở 350 m; các mốc nối phải là 1.842,48 và 3.386,88 m để không có khoảng nhảy tại index 55/120. Khoảng tâm nhóm ở 16 m/s là 1,76→1,485→1,265 s. **Đó chưa phải bằng chứng gate khoảng xử lý <2 s đạt trên mọi tốc độ**, nhất là khi nhiều group bị reject, vào shop/giao lộ. Giữ yêu cầu đo decision gap thực; không đổi warning 3,5 s thành khoảng phản ứng ngắn hơn.

Nước rút chiều dài 10% chỉ tác động helper water của W-template trong bài thử; nước special/fixture/size catalog ngoài helper không tự đổi. Giữ bề ngang, nước hai mép và traffic trên nước. Không thay patch bị bỏ bằng ổ gà hoặc xe nguy hiểm hơn để “giảm nước”.

## Ràng buộc khi chuyển sang implementation

Kết quả mở rộng profile đổi ga, seed 1–100: A P50 145 s (Q25–Q75 119–176), C1 P50 254 s (202–295), C2 P50 274 s (219–329). A kết ván 45 HP/44 xăng/11 công an; C1 53/41/6; C2 42/46/12; không censored. C2 đã ở mép dưới dải thử 270–330 s nhưng chưa gần tâm 300 s. Không dùng kết quả C0 cruise để bỏ qua khoảng thiếu này.

Candidate C3 là bước nhỏ tính từ **C2**, không phải nhỏ so với A: HP ×1,75 thay vì ×1,65; tank ×1,3 thay vì ×1,25; pickup xăng ×1,45 thay vì ×1,4; pickup HP ×1,6 thay vì ×1,5. Các số khác giữ C2. Đã tạo bài kiểm 100 seed đổi ga cho C3; kết quả cuối được ghi ở mục kết quả cuối báo cáo, không mặc định đạt chỉ vì tăng số.

Bảng C3 chính xác để tái lập (số sau dấu thập phân chưa làm tròn gameplay):

| Xe | HP A → C3 | Tank L A → C3 | L/m A → C3 | Pickup xăng L A → C3 | Pickup HP A → C3 |
|---|---:|---:|---:|---:|---:|
| Xe máy | 70 → 122,5 | 5,5 → 7,15 | 0,0045 → 0,0036 | 3 → 4,35 | 16 → 25,6 |
| Mô tô | 80 → 140 | 7,5 → 9,75 | 0,0048 → 0,00384 | 3,4 → 4,93 | 18 → 28,8 |
| Ô tô 4 chỗ | 105 → 183,75 | 10 → 13 | 0,0055 → 0,0044 | 3,6 → 5,22 | 24 → 38,4 |
| Ô tô 7 chỗ | 125 → 218,75 | 13 → 16,9 | 0,0065 → 0,0052 | 4,2 → 6,09 | 28 → 44,8 |

C3 giữ water drain 0,55 L/s, chiều dài nước template ×0,9, khoảng cách nhóm ×1,1 sau shop đầu như C2. Generator 30 seed, car4 đầy: nước phủ 48,80% quãng kiểm so với A 54,20% (giảm 5,4 điểm phần trăm, khoảng 10% tương đối); nhóm có nước 70,47%, có traffic 71,01%. Số nhóm 2.218 so 2.419 ở A. Vì vậy cảnh vẫn đông và nhiều nước, không phải giảm mật độ nguy hiểm còn một nửa.

**Đánh đổi cần người chơi duyệt:** C3 tăng HP 75% từ A, một mức đáng kể, và car7 có HP cao hơn buýt chưa tune. Bù lại nó giữ damage, hình học và nhịp né; người chơi sống qua nhiều lần ngã hơn. Nếu cảm giác trở thành xe quá lì hoặc ngã lặp gây bực, không tiếp tục tăng HP để đuổi theo median: ưu tiên C2, rồi tinh chỉnh trọng số template/phase/khe tránh trong một vòng khác, giữ ít nhất hai lớp và nhịp dưới 2 s. Không tuyên bố C3 là balance cuối chỉ vì bot gần 300 s.

1. Giữ dân phòng phạt cố định 500 (không âm ví), cảnh sát 300, giá/tiền đầu/khách/shop đầu hiện hành. Giao dịch car4 cruise vẫn P50 20,23 s trong các bài chạy; bot đổi ga mua sớm khoảng 12,88 s, nên chưa gọi mọi kiểu chạy đạt 20–24 s. Không thêm cửa khóa theo thời gian chỉ để ép mốc.
2. Giữ QTE/force/grip/collider và traffic collision. Không tăng/giảm damage cùng lúc khi đã tăng HP, tránh gấp đôi tác động. Không đổi xe ba gác/buýt/tải/container trong bảng vehicle này.
3. **Xăng player và traffic đang dùng chung định nghĩa xe.** Tăng tank/giảm fuelPerMeter ở bốn xe còn làm traffic tương ứng có thể chạy xa hơn; water drain dùng chung còn ảnh hưởng mọi traffic. Simulation ở đây có cả tác động đó. HP traffic dùng catalog riêng nên không tự tăng theo HP player. Không được ghi “traffic hoàn toàn không đổi”. Nếu tách fuel traffic giữ nguyên, đó là candidate khác phải chạy lại, không mượn kết quả này. Xăng traffic vẫn bật; chưa chọn ON/OFF.
4. Chi phí nước hiện cộng theo số patch chồng đang chạm, cả player lẫn traffic. Hai patch ở cùng chỗ có thể thành 1,6 L/s ở bản A; giảm chiều dài có thể giảm overlap, còn chỉ đếm patch không phản ánh phí. Chưa thay luật này sang tính hợp nhất vì chưa xác nhận ý đồ. Cần log thời gian chạm 1/2/3 patch và phí thực trước khi kết luận chỉ do nhiều nước nhìn thấy.
5. Không tự làm tròn hàng loạt số rồi tuyên bố dùng đúng candidate đã test; bảng triển khai có thể làm tròn cho dễ quản lý nhưng phải đo lại. Dữ liệu nguyên gốc và script sinh có số chính xác.
6. Không tự áp các số này vào backup noforce: config chung có thể ảnh hưởng backup dù director không đổi; nếu cần giữ nguyên backup phải tách cấu hình có chủ đích rồi kiểm lại. Không tự ghi rằng backup giữ nguyên khi chỉ nhìn file HTML.

## Nghiệm thu tiếp theo

- Mục tiêu người thật P50 khoảng 300 s, dải thử 270–330 s; hướng tới 285–315 s sau tinh chỉnh. Không dùng dải để che phân bố có nhiều lượt chết <90 s hoặc tail 20 phút.
- Chốt một candidate rồi mở rộng ít nhất 300 seed/profile cho cruise, W và đổi ga; bài người thật là tiêu chí cuối. Đủ xe máy/mô tô/car4/car7. Dùng cùng bộ bot trước/sau; không chỉnh nó chậm/giỏi hơn chỉ để đạt median.
- Playtest người dùng 5–10 ván ở nhiều seed trước để phản hồi, sau đó nhóm 12–20 người kỹ năng trung bình nếu cần khóa balance. Ghi seed, input W/S, xe, thời gian chủ động, quãng đường, lý do kết ván, xăng/HP nhận–mất, lần dùng shop và thời gian nước. 2 ván làm quen không trộn vào thống kê chính.
- Theo dõi P25/P50/P75, sống ở phút 3/5/8/12, censored, tỷ lệ kết ván từng nguyên nhân. Không ép tất cả chết bằng một nguyên nhân duy nhất; phạt tiền không nên làm mất xăng chắc chắn ở shop kế tiếp trên mọi seed.
- Giữ kiểm tuyến theo thời gian/ngân sách qua chuỗi nhóm, cảnh báo đủ sớm và khoảng xử lý dưới 2 s ngoài ngoại lệ hợp lệ. Dữ liệu Git vẫn ghi gate này chưa đạt; tăng tài nguyên không tự sửa nó.
- Nếu người thật sau candidate còn <270 s: xem nguyên nhân. HP chiếm đa số thì chỉ nới HP/repair một bước 5–10%; xăng chiếm đa số thì chỉ nới pickup/drain một bước 5–10%. Nếu >330 s thì đảo lại đúng nhánh gây dư. Không cùng lúc đụng thêm giá/tiền/shop/physics.
- Review thiết kế: giữ đánh đổi nước–lane khô, không biến nước thành vô hại; tăng khả năng trả giá cho quyết định thay vì xóa quyết định. Tăng HP cho phép nhiều cú ngã, nên cần đánh giá cảm giác bị ngã liên tục, không chỉ thời lượng.
- Review UX tự đánh giá từ logic/simulation, **CHƯA KIỂM TRA THỦ CÔNG**: cảnh báo chồng, lane đọc được, nhịp ngã/đứng dậy và cue nước nhiều lớp vẫn cần kiểm trong browser. Không dùng kết quả bot để chứng minh nhìn được 3,5 s hoặc đúng cảm giác điều khiển.

## Dữ liệu tái lập

Trong `experiment-2026-10-23/`: `snapshot/` giữ nguồn; `setup.mjs`, `add-variants.mjs`, `extra-checks.mjs` tạo bản sao/candidate; `summarize.mjs` tổng hợp; `coverage.mjs` đo spawn; `audit.mjs` kiểm hash và bootstrap. Mỗi thư mục candidate giữ JSON từng seed; `summary.json`, `coverage.json`, `audit.json` là kết quả tổng hợp. Chạy từ Windows/Node, ví dụ đặt `P8_PROFILE=average`, `P8_SAMPLE_COUNT=30`, `P8_SEED_START=1`, rồi chạy `node mixed_relief_pilot/run.ts` trong thư mục experiment. Các harness chạy qua Node, không dựa vào một process Vitest bị timeout.

Chưa có patch game/PR và chưa đạt nghiệm thu người thật. Báo cáo này phân biệt thử nghiệm đã chạy với số đề nghị, không thay thế bản build để chủ dự án chơi.

## Kết quả cuối và lựa chọn đề nghị

| Proxy đổi ga, cùng seed 1–100 | P25 | P50 | P75 | Sống tới ≥300 s | HP / xăng / công an / censored |
|---|---:|---:|---:|---:|---:|
| A hiện tại | 119 s | 145 s | 176 s | 0/100 | 45 / 44 / 11 / 0 |
| C1 | 202 s | 254 s | 295 s | 25/100 | 53 / 41 / 6 / 0 |
| C2 | 219 s | 274 s | 329 s | 41/100 | 42 / 46 / 12 / 0 |
| **C3 đề nghị thử** | **227 s** | **309 s** | **420 s** | **54/100** | **56 / 34 / 10 / 0** |

C3 đạt gần tâm mục tiêu trong proxy đã định nghĩa; phân bố còn rộng, P75 là 7 phút, nên không nói mọi người sẽ chơi 5 phút. Tần suất crash trên phút của proxy A/C3 khoảng 2,40/2,26; nghĩa là kéo dài ván chủ yếu nhờ chịu được/hồi được hậu quả, không phải đã giải quyết mọi cú va chạm. Thời gian ngâm nước trung bình cả ván tăng 8,15→20,33 s vì ván dài hơn; không dùng số tổng này để kết luận nước dày hơn. Patch gặp/phút tăng 16,90→18,14 trong các quỹ đạo khác nhau dù audit đường tĩnh cho mật độ nước giảm. Cần giữ cả hai phép đo, không chọn riêng số đẹp.

Nên cho chủ dự án thử **C3 và C2** trên cùng 5–10 seed, ghi thời lượng và cảm giác xe có quá lì/ngã quá nhiều hay không. Nếu C3 đúng 5 phút nhưng chơi kém vui, ưu tiên C2 rồi sửa độ gắt của một số template/phase có bằng chứng; không coi median là tiêu chí duy nhất. C3 chưa có khảo sát riêng đầy đủ từng xe/mọi profile, chưa kiểm thủ công và chưa có 300–1000 seed/profile; kết quả C0 theo từng xe không được gắn nhãn thành kiểm C3.

Sau khi đưa C3 vào code chính phải chạy gate repo và playtest, đặc biệt cơ chế mua xe, đổi sang xe dự phòng, refill/upgrades và traffic dùng chung fuel config. Lint/build cũ của Candidate A không phải gate của C3. Không tự merge.
