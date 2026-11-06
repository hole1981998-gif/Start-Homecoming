# Kế hoạch cân bằng P8 — Đường Về Nhà
> **Đã có cập nhật ngày21/10/2026:** xem [kế hoạch sau vật lý](CAP_NHAT_SAU_VAT_LY_2026-10-21.md). Mục tiêu mới là mua ô tô20–24giây, median ván4phút; main đã dùngforce. Các mục tiêu1phút/6–7phút và baseline noforce dưới đây là lịch sử đề xuất, không áp dụng cho vòng cân mới.

Ngày 20/10/2026, UTC+7. Trạng thái: **ĐỀ XUẤT để duyệt, chưa áp dụng vào repo**.

## 1. Kết luận và phạm vi

Nên chuyển game từ “chạy solo vẫn giàu, pickup xóa phần lớn tổn thất” sang “chở khách để kiếm tiền, chủ động né ngập và quyết định ghé shop”. Tăng khó bằng mật độ và phối hợp tình huống trước, giảm hồi tài nguyên sau; không đồng thời tăng mạnh damage, giảm grip và rút cảnh báo.

Bộ số khởi đầu được đề xuất trong báo cáo:
- Thu nhập nền 0,50 → **0,02 tiền/m**, khách thường 0,01 → **0,20 tiền/khách/m**.
- Xe 4 chỗ 800 → **300**, khách đầu 260 → **180 m**, shop đầu 600 → **720 m**: một khách thường đủ tạo cơ hội mua xe khoảng một phút.
- Giảm xăng nhặt trên đường khoảng 43–58% tùy xe; HP nhặt giảm khoảng 44–60%; không giảm tiếp cả HP xe máy.
- Tăng ngập có lối khô, cho traffic chạy trong nước, phối hợp hazard hiện hữu có kiểm tra hành lang theo thời gian.
- Tăng khó theo quãng đường đến trần ở khoảng **5 km**, thay tốc độ tăng quá chậm hiện tại khoảng 10 km.
- Mục tiêu ván đại diện: median **360–420 giây gameplay hoạt động** cho người kỹ năng trung bình. Đây là mục tiêu đo, chưa là kết quả đã đạt.

**Phạm vi đã thực hiện:** truy xuất tài liệu trên GitHub, đối chiếu cấu hình và một số hàm nguồn cần thiết, tính ngân sách tài nguyên/kinh tế, chạy mô hình độ nhạy economy riêng. Không sửa source, branch, commit, PR, issue hoặc cài dependency của repo. Các file báo cáo trong thư mục này là đầu ra cục bộ, không thuộc checkout repo.

**Ranh giới quan trọng:** toàn bộ mong muốn không thể đạt chỉ bằng sửa các hằng số hiện có. Lịch sinh hiện tại chưa biểu diễn được hai dải nước ngoài chừa giữa, nhiều lớp hazard được định lượng độc lập hay peak traffic 2/3 stress. Báo cáo tách “số có thể đổi ngay” và “cấu hình bố cục cần được generator hỗ trợ”. Việc hỗ trợ những bố cục người dùng vừa yêu cầu không thêm mechanic, nhưng vẫn cần sửa tối thiểu bộ sinh nếu sau này được duyệt triển khai. Nếu hiểu “chỉ đổi chỉ số” tuyệt đối là không đổi generator, phải chấp nhận chưa đáp ứng các bố cục đó; không được giả vờ hoàn thành.

## 2. Revision và độ tin cậy của nguồn

### Branch thích hợp

GitHub hiện không có main/master trong danh sách sáu branch. Default branch là `feature/p4-1-traffic-durability` ở `46f1369`, đã cũ.

Branch phát triển mới nhất được đọc là **`codex/bus-rear-drive-container-trailer`**, commit đầy đủ **`2e95705e8c2eb95ee7ab899858c09bff6629ddf0`**. GitHub ghi thời điểm commit 20/10/2026 15:04:21 UTC, tức 22:04:21 UTC+7. So sánh xác nhận branch này ahead 28/behind 0 so với default P4.1 và ahead 25/behind 0 so với `feature/traffic-fuel`.

Chuỗi mới nhất: P7 `abc09b5` → tail sweep `9c69dcd` → rear-driven bus/container trailer `2e95705`. Dùng snapshot mới nhất để đọc tài liệu và thông số; baseline gameplay là **trang thường / hoặc ver.noforce**, không tự chuyển game chính sang force.

Nguồn: [revision](https://github.com/hole1981998-gif/Start-Homecoming/commit/2e95705e8c2eb95ee7ab899858c09bff6629ddf0), [so default với revision](https://github.com/hole1981998-gif/Start-Homecoming/compare/46f13695658c8ee637088fd096e4225bb2d434ed...2e95705e8c2eb95ee7ab899858c09bff6629ddf0).

### Cách đọc tài liệu

Đã truy xuất toàn bộ 56 file Markdown ở snapshot, gồm GAME_DESIGN, các DESIGN bổ sung, BALANCE_CONFIG, TECH_SPEC, ROADMAP và các review P1–P7/các lượt sửa phụ. Danh mục đường dẫn, blob và liên kết cố định ở [SOURCE_INDEX.md](SOURCE_INDEX.md). Những đoạn bổ sung muộn thay mô tả lịch sử mâu thuẫn ở đầu tài liệu.

Các phát hiện xuyên suốt review:
- P2/P3A: hazard thưa, lặp; nhiều bot sống 600 giây. Thay bot/footprint làm các tỷ lệ giữa prototype không so trực tiếp được.
- P3A fuel-slide: đã từng thử 5 L/0,0065 và 5,5 L/0,0055 rồi bỏ vì gây quá nhiều lượt chết sớm. Không lặp lại mức này cho xe máy khi còn tăng ngập.
- P4A/P4B: khách thường làm tiền/phút giảm vì cruise giảm nhưng bonus chỉ 0,01/m.
- P5: shop corridor khiến một số mẫu dễ hơn; “đủ tiền” khác “mua xe thật”. Bot mua thật cruise 29/30, W 28/30 trong mẫu lịch sử.
- P5.2: Grab ×10 chỉ nhân phần tiền khách, không nhân nền; buýt đông khách có nguy cơ thành lựa chọn economy áp đảo.
- P6/P6.1: nhiều bộ baseline tắt special events, không được dùng chúng làm tỷ lệ sống của game tích hợp.
- P6.1 tích hợp/P6.3: sáu pilot chạy 240 giây đều còn sống; pilot biết dữ liệu tương lai, không đại diện kỹ năng trung bình.
- P7 handling: trượt ngang đã làm số ván kết thúc trong mẫu baseline tăng, ví dụ cruise 9→11, W 13→16. Không nên tiếp tục giảm grip cùng vòng tăng mật độ.
- Force và tail sweep vẫn là thử riêng; collider damage và thân quét chưa thống nhất hoàn toàn. Không lấy damage sân thử Cannon để cân ván thường.

Nguồn chính: [review P3A fuel](https://github.com/hole1981998-gif/Start-Homecoming/blob/2e95705e8c2eb95ee7ab899858c09bff6629ddf0/docs/P3A_FUEL_SLIDE_REVIEW.md), [P5](https://github.com/hole1981998-gif/Start-Homecoming/blob/2e95705e8c2eb95ee7ab899858c09bff6629ddf0/docs/PROTOTYPE_5_REVIEW.md), [P5.2](https://github.com/hole1981998-gif/Start-Homecoming/blob/2e95705e8c2eb95ee7ab899858c09bff6629ddf0/docs/PROTOTYPE_5_2_REVIEW.md), [P6.3 tích hợp](https://github.com/hole1981998-gif/Start-Homecoming/blob/2e95705e8c2eb95ee7ab899858c09bff6629ddf0/docs/P63_INTEGRATED_HAZARDS_REVIEW.md), [handling](https://github.com/hole1981998-gif/Start-Homecoming/blob/2e95705e8c2eb95ee7ab899858c09bff6629ddf0/docs/HANDLING_PHYSICS_REVIEW.md).

## 3. Mốc “siêu khó” và cách hiểu 2/3

Đã tìm đúng bộ mốc lịch sử:
- `docs/BALANCE_REFERENCE_P61_STRESS.md`.
- `docs/P61_STRESS_TRAIN_REVIEW.md`.
- `docs/evidence/p61/stress/summary.json`.
- `archives/p61-stress-581c4df/manifest.json` và đường dẫn source.zip.

Snapshot lịch sử: **581c4df**, normal `p61-integrated-2`, stress `p61-stress-1`. Manifest công bố ZIP 2.862.919 byte, SHA256 `0f6014282dd1582bc10e5445c2bb1cc5b0fee8f4a93fe088c09e53373808a31c`. Lượt này đọc manifest, **không tải/giải nén ZIP hoặc tự xác minh lại hash ZIP**.

| Thông số stress lịch sử | Giá trị nguồn | Quy đổi |
|---|---:|---:|
| Traffic bổ sung | 2 xe mỗi 24 m | 83,33 xe/km |
| Patch bổ sung | mỗi 48 m | 20,83 patch/km |
| Special bổ sung | mỗi 72 m | 13,89 nhóm/km |
| Preload | 480 m | Tham số mô phỏng, không là độ khó |
| Tài nguyên mẫu | container + bus, 10.000 tiền, item | Không đại diện ván tự nhiên |
| Công bằng | Có thể khóa 3 lane/bất khả thi | Không được đưa vào game cân bằng |

Đây là stream **cộng thêm** vào normal world. Không nhầm 83,33 xe/km là toàn bộ traffic thực sự gặp.

JSON lịch sử: W-only, không né/item, cap 30 giây; 5/6 seed chết vì tàu ở 232 m, khoảng 14,58–18,47 giây; seed 42 vẫn chạy ở 329 m lúc 29,98 giây. Các kết quả này **không dùng để suy tỷ lệ thua của người chơi**.

### Diễn giải đề xuất

“2/3” nên là **áp lực đỉnh so với stress**, không phải mọi thông số ×0,667, không phải 2/3 tỷ lệ thua, cũng không phải thời lượng ván tăng từ 18 lên 27 giây.

Nếu lấy mật độ làm đối chiếu đơn giản:
- Traffic stress bổ sung 83,33 → **55,56 xe/km**, tương đương 2 xe mỗi 36 m.
- Patch 20,83 → **13,89 patch/km**, khoảng 72 m/patch.
- Special 13,89 → **9,26/km**, khoảng 108 m/nhóm.

**Không khuyến nghị chép cả ba tỷ lệ này vào ván thật.** Special 108 m/nhóm xung đột corridor, luật nghỉ và khả năng né; stress có màn bất khả thi. Trong kế hoạch, 55,56 traffic/km chỉ là trần thử cho cao trào ngắn ở cuối curve. Special tiếp tục thấp hơn nhiều. Phải đếm density thực sau khi reject, không gọi density yêu cầu là density đã đạt.

Để xác nhận “khoảng 2/3” theo độ khó thực, đo cùng xe/tải/input policy ở các cửa sổ cố định và chuẩn hóa:
1. Giữ mốc stress gốc nguyên trạng để tái hiện.
2. Tạo benchmark stress dùng cùng xe và tài nguyên như ứng viên, loại các bố cục đã được xác định bất khả thi; ghi rõ đây là **đối chứng dẫn xuất**, không thay archive.
3. Đo survival S(T), số phản ứng bắt buộc/phút, thời gian TTC thấp, va chạm công bằng và số lần không có lối.
4. Khi S(T) đủ khác 0 và 1, dùng H = −ln(S(T))/T để so sức ép kết ván; đặt H_peak/H_stress-benchmark trong khoảng **0,60–0,73**. Nếu mọi lượt đều chết/sống, đổi horizon hoặc tăng mẫu, không báo tỷ lệ vô nghĩa.
5. Đối chiếu thêm người chơi chấm mức căng và vui; không thay cảm nhận bằng một chỉ số.

Chưa có số đo mới để tuyên bố đã đạt tỷ lệ này. Nếu yêu cầu bắt buộc 2/3 **mọi mật độ của stress gốc**, đó là mục tiêu khác và có khả năng không tương thích với fairness/6–7 phút; cần báo xung đột thay vì giảm chuẩn công bằng.

Nguồn: [mốc stress](https://github.com/hole1981998-gif/Start-Homecoming/blob/2e95705e8c2eb95ee7ab899858c09bff6629ddf0/docs/BALANCE_REFERENCE_P61_STRESS.md), [review stress](https://github.com/hole1981998-gif/Start-Homecoming/blob/2e95705e8c2eb95ee7ab899858c09bff6629ddf0/docs/P61_STRESS_TRAIN_REVIEW.md), [JSON](https://github.com/hole1981998-gif/Start-Homecoming/blob/2e95705e8c2eb95ee7ab899858c09bff6629ddf0/docs/evidence/p61/stress/summary.json).

## 4. Before/after — curve và spawn

Không thêm menu chọn độ khó. “Thấp nhất/cao nhất” là đầu và cuối curve theo quãng đường.

### 4.1 Số có thể thử bằng chỉnh cấu hình/hằng số hiện có

| Hạng mục | Hiện hành từ runtime | Đề xuất vòng đầu |
|---|---:|---:|
| Hazard đầu | 130 m | 130 m, giữ đoạn làm quen |
| Gap thường đầu → cuối | 90 → 75 m | **80 → 70 m** |
| Khoảng đạt trần gap | khoảng 10 km | **5 km** |
| Warning thường | 3,5 s, sàn 60 m, xét relative speed | **Giữ 3,5 s/sàn**, không rút để tăng khó |
| QTE | 1,8 → 1,2 s ở 10 km, sàn 0,9 | **Giữ biên 1,8 → 1,2**, đạt trần ở 5 km |
| Giao lộ | đầu 800, mỗi 800 m | Giữ |
| Clear corridor giao lộ | 60 m mỗi phía | Giữ |
| Special đầu | 1.700 m | **Giữ 1.700 m**, sau shop1.500 m; không đặt1.450 m vì sẽ bị corridor shop loại |
| Gap special | 1.250 m | **1.200 m** trong vòng chỉ sửa số |
| Corridor special | 110 m | **90 m** thử riêng sau khi có kiểm tra timeline |
| Nhóm hai officer | khoảng 1/3 | Giữ vòng đầu |
| Gió | 1 slot/9 vị trí, dài 65 m, push 1,5 m/s | Giữ push; density thử sau |
| Cargo | 1 slot/9 vị trí, rơi sau 2,3 s | Giữ lead 2,3 s; density thử sau |

80→70 chỉ tăng density slot đầu khoảng 12,5%, cuối khoảng 7,1%; **chưa đủ** bảo đảm “khó hơn đáng kể”. Cần cộng tác động pickup/economy và xác minh tỷ lệ thua. Không gọi bước nhỏ này là toàn bộ phương án cuối.

Runtime có validation gapMin/maxSpeed ≥ warningSeconds và eventGap ≥1200. Với max cơ sở xe máy 20 và warning 3,5, gapMin=70 vừa chạm giới hạn. Không điền 36 m hoặc special108 m rồi xóa validation để cho pass.

### 4.2 Mục tiêu bố cục sau khi hỗ trợ bằng dữ liệu

Những giá trị sau là **mục tiêu mới**, chưa có key tương ứng đầy đủ trong runtime. Mật độ tính theo km đường thực đã đi, sau reject; traffic cargo đã tính trong tổng traffic.

| Dải quãng đường | Traffic/km | Nước/km | Ổ gà/km | Gió/km | Special/km |
|---|---:|---:|---:|---:|---:|
| 0–1 km | 7 | 6 | 3 | 0,8 | Không trước mốc đầu đã nêu |
| 1–2,5 km | 12 | 8 | 3,5 | 1,2 | 0,8 |
| 2,5–4 km | 18 | 10 | 4 | 1,6 | 1,0 |
| 4–5 km | 24 | 12 | 4 | 2,0 | 1,2 |
| ≥5 km, nhịp thường | 28 | 12–14 | 4 | 2,0 | 1,2 |
| ≥5 km, cao trào 10–12 s | **tối đa 55,56** | tổng patch tối đa khoảng 13,89/km trong cửa sổ dài hơn | Không tăng damage | Giữ lực | Không tăng lên 9,26/km |

Trần cao trào tính bằng cửa sổ không gian đủ lớn, ví dụ 360 m/20 traffic yêu cầu, thay vì suy tỷ lệ chính xác từ 100 m có vài xe. Bố trí peak trong tối đa 20% quãng đường cuối; sau hai nhóm nguy hiểm nặng cần ≥3 giây hành lang lái dễ đọc. Không tạo cơ chế “enrage”, không bắt đúng thời gian chết, chỉ cấu hình cường độ và nghỉ của các pattern hiện hữu. Cao trào đầu tiên cần thử offline trước; nếu không giữ được lối khả thi, giảm density chứ không bỏ kiểm tra.

Hiện tại kinds xoay theo chu kỳ và gió/cargo thay slot. Ước tính chưa trừ corridor ở đầu: nước 3/9, ổ gà 2/9, traffic 3/9, gió 1/9; traffic thường khoảng 3,7/km với gap90, không phải 11,1/km. Sau fork, phase thay đổi nên tỷ lệ nước/ổ gà có thể đổi. Phải log kết quả thực, không dùng bảng lý thuyết này như đo đường người chơi gặp.

Trọng số loại traffic có thể thử ở vòng density, giữ nguyên HP/damage/tốc độ:

| Loại | Weight trước | Weight đề xuất |
|---|---:|---:|
|Xe máy|3|4|
|Mô tô|2|2|
|Car4|4|6|
|Car7|2|3|
|Ba gác|2|2|
|Buýt|1|1|
|Tải|1|1|
|Container|1|1|

Tổng16→20; xe dài buýt/tải/container giảm tỷ trọng18,75%→15% trong lần chọn traffic thường để còn chỗ tăng tổng mật độ. Cargo slot ép tải/container nên tỷ trọng thực tế sẽ cao hơn bảng; đếm riêng sau sinh. Không bỏ loại xe nào hoặc biến xác traffic thành accident chí tử.

### 4.3 Vùng ngập và overlap

| Mục | Hiện hành | Đề xuất |
|---|---|---|
| Nước nhỏ/1 lane | 2,4×4; 3,2×7; 3,2×14 m | Giữ nhỏ; thêm trọng số cho **3,2×24 m** |
| Nước 2 lane liền | 5,7×9; 5,7×24 m | Ưu tiên **5,7×24 và 5,7×36 m** |
| Ngập hai làn mép, giữa khô | Chưa có pattern cặp | Hai patch khoảng **3,2×24–36 m**, tâm x=±3,2; làn giữa rộng 3,2 m |
| Ngập kín | 9,6×30 m nếu kiểm tra đủ tài nguyên | Không tăng tần suất; tạm không dùng làm chi phí bắt buộc khi chưa sửa kiểm tra ngân sách toàn tuyến |
| Tỷ lệ hình nước ở đầu | Chọn đều từ mảng 6 size trước fallback | 1 lane ngắn 25%, 1 lane dài 30%, 2 lane liền 35%, hai mép 10% |
| Tỷ lệ hình nước cuối | Chưa có weights | 1 lane ngắn 15%, 1 lane dài 25%, 2 lane liền 40%, hai mép 20% |
| Traffic trong nước | Tương tác đã có, có thể chồng động | Chủ động cho khoảng 20% traffic đầu → 35% cuối đi qua nước khi có hành lang khác |
| Traffic/officer/rào chồng debuff | Có tương tác nhưng sinh còn tách corridor/slot | Tỷ lệ nhóm được ghép 10% đầu → 30% cuối, kiểm tra quỹ đạo trước |
| Gió chồng nước/ổ gà/vật cố định | Trước đây hoãn | Yêu cầu hiện tại cho phép đề xuất ghép; thử **mỗi lần một debuff**, không ghép ba loại đầu vòng |

Phần trăm pattern nước cộng 100%, chưa tính fallback và không tự nhân đôi density: một pattern “hai mép” là **một nhóm bố cục nhưng hai entity nước**. Phải log cả hai mẫu số để không tăng hao tài nguyên/hiệu năng ngoài dự kiến.

Bề rộng khô 3,2 m không tự bảo đảm né được: ô tô 7 chỗ rộng 2,08 m còn 0,56 m mỗi bên nếu ở đúng giữa; container rộng2,88 còn0,16 m mỗi bên nên cần margin và kiểm tra chuyển làn dài hơn. Không lấy tiêu chuẩn xe máy chứng minh an toàn cho mọi xe.

**Định nghĩa tuyến khả thi:** từ trạng thái hiện tại tồn tại chuỗi input A/D/W/S hợp lệ đến cửa sổ kế tiếp hoặc nguồn tiếp tế, với acceleration/grip, chiều dài, gió, traffic động và ngân sách xăng/HP. Không bắt buộc item chưa có; chỉ tàu có lựa chọn phanh chờ theo luật hiện hữu. Không gọi “một lane trống lúc spawn” là bằng chứng.

NPC trong yêu cầu này cần phân biệt: officer là chướng ngại, khách chờ là cơ hội kinh tế. Cho officer/traffic/rào chồng debuff khi né được; không chủ động biến khách duy nhất trước shop đầu thành NPC không thể tiếp cận. Pocket Grab vẫn là pocket nhỏ, không clear cả đoạn đường.

## 5. Before/after — xe, tài nguyên và pickup

Các số “hiện hành” dưới đây lấy từ config/VehicleDefinition, **không dùng bảng khởi tạo 8 L/0,003 của xe máy trong docs cũ**.

### 5.1 Bốn xe trọng tâm

| Xe | Tank L trước→sau | HP trước→sau | L/m trước→sau | Xăng nhặt trước→sau | HP nhặt trước→sau | Giá trước→sau |
|---|---:|---:|---:|---:|---:|---:|
| Xe máy | 5,5 → **5,5** | 70 → **70** | 0,0045 → **0,0045** | 5,5 → **3,0** | 40 → **16** | 250 → **250** |
| Mô tô | 10 → **7,5** | 85 → **80** | 0,0040 → **0,0048** | 6 → **3,4** | 40 → **18** | 600 → **450** |
| Ô tô 4 chỗ | 16 → **10** | 120 → **105** | 0,0050 → **0,0055** | 8 → **3,6** | 45 → **24** | 800 → **300** |
| Ô tô 7 chỗ | 20 → **13** | 145 → **125** | 0,0060 → **0,0065** | 10 → **4,2** | 50 → **28** | 1200 → **1100** |

Giữ capacity 2/2/4/7 tính cả tài xế; giữ min/cruise/max 8/14/20, 9/18,5/28, 8/16/24, 8/15/22. Giữ cruise loss/sàn 2/8, 2,4/9, 1,6/9, 0,9/9; giữ grip 0,85/1,10/1,00/0,90, kích thước và ram. Không giảm HP xe máy vì cú va container đã có thể lấy 50/70 HP.

Mô tô có lý do chọn ở tốc độ/độ bám, không chỉ rẻ hơn ô tô; car4 là bước tiếp cận sớm, car7 là khoản đầu tư sức chứa. Xe máy vẫn tiết kiệm và dễ luồn. Giá car4 giảm rất mạnh là chủ ý để đồng thời bỏ tiền nền và giữ mốc một phút; phải test rủi ro dùng mua xe thay sửa.

### 5.2 Nhịp tiếp tế và shop

| Key/nhóm | Hiện hành | Đề xuất |
|---|---:|---:|
| Xăng miễn phí | mỗi 450 m | **mỗi 480 m**, chưa vượt validator500 |
| Sửa đầu | 650 m | Giữ **650 m** |
| Khoảng hộp sửa | 900 m | **1000 m** |
| Shop đầu/second | 600/1200 m | **720/1500 m** |
| Shop sau hai lần đầu | seeded 600–900 m | **seeded 720–1080 m**, mean danh nghĩa900 thay750 |
| Tiếp cận shop | ±30 m, ngang1,8 m | Giữ |
| Cảnh báo shop | ≥4 s hoặc60 m | Giữ; có thể nới cue trước nếu bỏ lỡ |
| Clearance shop | 45 m | Giữ trước; không thu nhỏ cùng vòng |
| Bơm tại chỗ | 60 tiền / tối đa8 L | **40 tiền / tối đa4 L** |
| Sửa tại chỗ | 70 tiền / tối đa40 HP | **50 tiền / tối đa30 HP** |

Shop 720 m cách giao lộ800 m80 m, không đặt shop780 m trong corridor60 m. Mốc1500 cách1600 m100 m. Random shop hiện đã tồn tại sau hai shop đầu, không được mô tả nó là mechanic mới. Giữ hai shop đầu có chủ đích để kiểm soát onboarding/economy; chỉ random phần sau. Nếu cần random ngay shop đầu, dải680–730 m là ứng viên B riêng; phải kiểm tra lại giá car4/tiền đủ mua, chưa thuộc bộ số A.

Giảm tổng lượng hồi/phút tại shop dù giá giao dịch giảm: xăng từ0,133→0,100 L/tiền, sửa từ0,571→0,600 HP/tiền (sửa hơi rẻ hơn theo đơn vị). Sửa50/30 là để có lựa chọn cứu xe khi ví thấp, độ khó chủ yếu đến từ nguồn miễn phí ít hơn và khoảng tới shop. **Nếu tiền ròng vẫn dư sau playtest**, thử sửa55/30 riêng; không tăng giá mọi nguồn cùng lúc.

Shop service hiện không giới hạn số lần như item stock. Người có tiền có thể mua nhiều lần ở một shop để đầy tài nguyên; báo cáo không giả định “mỗi shop chỉ được sửa một lần”. Không thêm giới hạn service hoặc món mang theo để vá economy.

### 5.3 Ngân sách xăng theo km

Bỏ qua nước/quá tải/upgrade, quãng đường một bình:
| Xe | Trước | Đề xuất |
|---|---:|---:|
| Xe máy |1222 m|1222 m|
| Mô tô |2500 m|1563 m|
| Car4 |3200 m|1818 m|
| Car7 |3333 m|2000 m|

Với gap480 m, nếu nhặt hết, nguồn xăng danh nghĩa lần lượt6,25 /7,08 /7,50 /8,75 L/km. Hao nền4,5 /4,8 /5,5 /6,5 L/km. Lượng thực nhận thấp hơn vì bỏ lỡ và clamp tank.

Ví dụ xe máy nhặt85%: 6,25×0,85−4,5 = **0,8125 L/km** còn cho nước. Ở0,8 L/s, chỉ khoảng **1 giây tiếp xúc nước/km** đã gần triệt phần dư. Nhặt65% thì ngay hao nền đã âm0,4375 L/km. Đây là cơ chế căng cần kiểm tra, không phải cam kết sống được với mọi cách chơi.

Nước dài36 m với xe máy dài2 m ở12 m/s tốn thêm khoảng (36+2)/12×0,8 = **2,53 L** nếu chạy xuyên dọc. Hai dải dài là thử thách né, không được ép xe máy xuyên nhiều dải như vậy giữa hai nguồn. Chi phí chịu nước theo thời gian khiến chạy chậm trong nước có thể tốn hơn theo km; không suy S luôn là chiến thuật tiết kiệm.

Runtime kiểm tra nước kín đường hiện cộng dự phòng0,5 L. Sau giảm hồi, dự phòng này chưa đủ bảo đảm tới nguồn kế tiếp. Trước tăng nước kín phải kiểm ngân sách đến **nguồn thực sự tiếp cận được** cộng đoạn nước và reserve. Nếu chưa có kiểm này, ưu tiên mẫu còn đường khô. Hai patch nước đè nhau có thể cộng waterCount/hao kép; pattern hai mép phải không chồng collider trên hành lang giữa.

Đối chiếu nguồn còn cho thấy tài liệu nói chung nước hãm tốc, nhưng đoạn xử lý người chơi được kiểm tra chỉ thu fuel bổ sung; `trafficWaterSpeedFactor=0,6` áp dụng traffic. Báo cáo **không tự thêm hệ số giảm tốc nước cho player**. Công thức ngân sách dùng tốc độ người chơi thực tế đo được.

### 5.4 Ngân sách HP

Car4 pickup24 HP/1000 m, nhặt70% chỉ hồi **16,8 HP/km**. Một cú va ô tô20 HP/km đã vượt nguồn hồi miễn phí này; ổ gà, thùng và xe lớn làm tăng nhu cầu shop hoặc xe dự phòng. Đây là cơ sở hợp lý hơn việc giảm HP xe xuống quá thấp.

Tại105 HP, car4 chịu được vài sai sót xe nhỏ nhưng không thể liên tục đổi HP lấy đường. Không tăng mọi damage theo difficulty; giữ danh mục sát thương hiện hữu và đo số va công bằng/phút trước.

Nguồn runtime: [config](https://github.com/hole1981998-gif/Start-Homecoming/blob/2e95705e8c2eb95ee7ab899858c09bff6629ddf0/src/config.ts), [vehicles](https://github.com/hole1981998-gif/Start-Homecoming/blob/2e95705e8c2eb95ee7ab899858c09bff6629ddf0/src/vehicles.ts), [world](https://github.com/hole1981998-gif/Start-Homecoming/blob/2e95705e8c2eb95ee7ab899858c09bff6629ddf0/src/world.ts), [survival](https://github.com/hole1981998-gif/Start-Homecoming/blob/2e95705e8c2eb95ee7ab899858c09bff6629ddf0/src/survival.ts).

## 6. Before/after — tiền khách, item, nâng cấp, buff/debuff

### 6.1 Economy và khách

| Mục | Hiện tại | Đề xuất |
|---|---:|---:|
| Tiền đầu |200|Giữ200|
| Tiền nền/m |0,50|**0,02**, giảm96%|
| Tiền khách thường/m |0,01|**0,20**|
| Khách đầu / interval |260 /400 m|**180 /360 m**|
| Xác suất khách quay lại mỗi crash |0,50|**0,65**, thử riêng|
| Score/m / thưởng điểm khách |1 /4%|Giữ|
| Phạt quá tải max/fuel |8% /15% mỗi người|Giữ|
| Grab multiplier |×10 phần khách|**×1,5**, tức0,30/m/khách|
| Grab giá/lượt/stock |240/3/1 mỗi shop|Giữ|

Tăng tỷ lệ quay lại lên0,65 để nhẹ RNG sau khi thu nhập phụ thuộc khách; vẫn có rủi ro mất cả nhóm. Với ba khách, mất hết một crash giảm từ12,5% xuống khoảng4,29% nếu các quyết định độc lập theo mô hình từng ID. Đây là phép tính xác suất từ giả định độc lập, không phải tần suất đã đo. Không loại bỏ luật khách từ chối F hoặc khách từ xe bị player phá.

**Không khách:** xe máy cruise14 kiếm0,02×840 = **16,8 tiền/phút** thay420; gần0 tương đối, vẫn dương. **Có một khách:** cruise12, 0,22/m → **158,4/phút**. **Car4 ba khách:** cruise11,2, 0,62/m → **416,64/phút**. **Car7 sáu khách:** cruise9,6, 1,22/m → **702,72/phút**. Các số là steady-state gross, chưa trừ hao xe/phạt/đón khách.

So với hiện tại:
| Xe/tải, cruise ổn định | Gross trước/phút | Gross sau/phút |
|---|---:|---:|
| Xe máy solo |420,00|16,80|
| Xe máy1 khách |367,20|158,40|
| Car4 solo |480,00|19,20|
| Car4 ba khách |356,16|416,64|
| Car7 sáu khách |322,56|702,72|

Mục đích không phải giảm đồng loạt tiền mọi chiến thuật: solo giảm mạnh, chở đủ khách có giá trị thực. Đây cũng là rủi ro: car7 đủ tải có thể khá giàu; phải đo tiền **ròng** và nguồn khách thực tế, không chỉ nhìn tiền nền đã giảm. Không thêm cap tiền/thu nhập phi tuyến/giá tăng theo km để bù.

Xe giải trí giữ cơ chế và số nền ban đầu trong vòng A; không ưu tiên tối ưu sức cạnh tranh. Tuy nhiên hệ số khách là toàn cục nên buýt đông khách tăng income rất mạnh:24 khách thường, cruise sàn7 → **2024,4 tiền/phút** so khoảng313,6 hiện tại. Đây là trường hợp bắt buộc kiểm thử, không bỏ qua vì “chỉ giải trí”. Thử riêng giá buýt2400→3600 nếu người chơi thực tế có thể tích khách đủ sớm và buýt thống trị; chưa đưa vào bộ số A. Nếu vẫn thống trị, cần cân giá/cruise/tốc độ đón theo chỉ số hiện hữu, không tự thêm passenger cap khác hoặc khóa xe. Các xe giải trí không phải lý do bỏ regression geometry/terminal.

### 6.2 Mốc ô tô khoảng một phút

Ca xác định, không hazard:
- Đến khách180 m ở14 m/s:12,86 s.
- Chở một khách thêm540 m ở12 m/s đến shop720:45 s.
- Tổng **57,86 s**.
- Ví trước mua:200 +720×0,02 +540×0,20 = **322,4**.
- Mua car4 giá300 còn **22,4**; xe mới đầy theo luật hiện hữu, xe máy cũ giữ tài nguyên.

Cơ hội xe một phút có điều kiện đón ít nhất một khách sớm và tới shop. Không khách chỉ có214,4 ở shop đầu nên không mua được; đó là tradeoff có chủ đích. Giữ W20 m/s có thể mua ở36 s; giữ chậm có thể85 s hoặc hơn. Không thêm gate thời gian hay cố định mọi chiến thuật về60 s.

Nếu yêu cầu solo cũng phải mua car4 một phút, ba mục tiêu “nền gần0 + giá xe không quá rẻ + không cần khách” xung đột. Không bịa nguồn thưởng mới: cần nới một mục tiêu bằng giá hoặc tiền đầu, rồi đánh giá lại toàn ván.

### 6.3 Dòng tiền minh họa theo phút

Mô hình đường sạch: đón khách180 m; không quá tải xe máy, bỏ cơ hội540 m; mua car4 tại720; đón thêm ở900/1260; sau đó giữ ba khách và cruise11,2. Không có water/HP/fuel failure, không rẽ, chưa mua item/nâng cấp. Giá trị làm tròn, chỉ là **sổ gross giả định**.

| Phút | Distance | Khách | Tiền kiếm lũy kế | Ví sau mua car4, trước mọi chi khác |
|---|---:|---:|---:|---:|
|1|751 m|1|129,1|29,1|
|2|1501 m|3|462,5|362,5|
|3|2173 m|3|879,2|779,2|
|4|2845 m|3|1295,8|1195,8|
|5|3517 m|3|1712,4|1612,4|
|6|4189 m|3|2129,1|2029,1|
|7|4861 m|3|2545,7|2445,7|

Ví dụ nếu sau mua xe chi4 lần service gộp90, một Grab240 và hai nâng cấp300+350 thì ví phút7 còn khoảng1195,7, trước phạt và các chi khác. **Không chứng minh ví luôn căng**: đường sạch giữ khách có thể tích vốn, còn crash làm mất khách và pause kiếm tiền. Nếu nhiều người chơi giữ được ba khách với ít chi phí, ưu tiên thử rider0,18 hoặc giá upgrade cao hơn từng biến một; car4 đầu cần kiểm lại mốc. Không ép hao tiền giả để đạt một ví mục tiêu.

Theo km, 1 khách thường đem200 tiền/km cộng20 nền; ba khách620/km; sáu khách1220/km. Phạt police300 tương đương khoảng484 m gross với car4 ba khách, nhưng còn mất chiếc xe; không xem phạt chỉ là khoản300.

### 6.4 Item và nâng cấp

| Mục | Trước | Sau đề xuất |
|---|---:|---:|
| Nitro giá / boost / hệ số |120 /4 s /1,3|Giữ120,4 s,1,3 ở vòng A |
| Jump thời gian/cao |1,6 s /2,4 m|Giữ, bảo vệ hình học vượt tàu |
| Star giá/thời lượng |180 /5 s|**180 /3,5 s**, thử sau vòng tài nguyên |
| Chuối giá/stock |80 /1 mỗi shop|Giữ; một món vô hiệu cả nhóm |
| Grab giá/lượt/cooldown |240 /3 /2 s|Giữ, multiplier thay như trên |
| Loot broken có item |25%|Giữ25%, RNG nhẹ |
| Engine cấp1/2/3 |200/400/700|**300/550/900** |
| Tank/armour cấp1/2/3 |180/350/600|**300/550/900** |
| Economy upgrade cấp1/2/3 |220/420/750|**350/600/1000** |
| Hiệu ứng upgrade |max+8%; tank/HP+15%; hao nền−8% mỗi cấp|Giữ, không refill miễn phí |

Grab hiện thêm0,10 thay0,01: chênh0,09/m/khách. Đề xuất thêm0,30 thay0,20: chênh0,10. Đủ ba Grab so cùng ba khách thường chênh0,30/m, gói240 hòa phần chênh sau **800 m** kể từ khi đã đủ ba, trước crash/bỏ lỡ. Đây không phải hòa vốn thực so solo; phải trừ giá, thời gian gọi/đón, người mất và nguồn shop.

Star không vô hiệu police/tàu/accident, không cấp xăng nền. Không giảm jump để làm secret bất khả thi hoặc để buộc mua item mới. Inventory vẫn hai ô, service không vào kho.

### 6.5 Debuff và damage giữ nguyên ở vòng A

| Tham số | Nguồn hiện tại | Đề xuất |
|---|---:|---|
| Water thêm fuel |0,8 L/s|Giữ|
| Pothole impact/duy trì/tiền |6 HP /12 HP/s /tối đa10|Giữ|
| Traffic damage theo8 loại |12/16/20/26/18/38/42/50|Giữ|
| Wind push /cap |1,5 /2,2 m/s|Giữ|
| Cargo crate/barrel |8/14 HP, barrel ngã|Giữ|
| Train |8,4 m/s, thân ngang24 m, qua đường4 s|Giữ, không coi tăng speed tàu luôn tăng khó|
| Fines police/militia |300 /100|Giữ cố định|
| Coasting |25 m|Giữ|
| Crash bảo vệ/tự thay |Luật hiện hành|Giữ; không farm bảo vệ qua Tab|

## 7. Mô hình đa seed đã thực sự chạy

Đã chạy mô hình economy cục bộ, **không chạy game engine**. Có [script tái lập](economy-sensitivity.mjs), [CSV](economy-sensitivity.csv). Node v24.19.0; script exit0. Đây không phải pnpm simulate của repo và không có manual gameplay mới.

Thiết kế mô hình: seed1–3000 ×3 profile ×2 cấu hình = **18.000 lượt**, horizon180 s, dt0,05 s. Xe máy giữ tối đa một khách. Current dùng base0,5, rider0,01, giá800, khách260/400, shop600/1200 rồi600–900. Proposal dùng0,02/0,20, giá300, khách180/360, shop720/1500 rồi720–1080. Mỗi lần tới NPC/shop dùng Bernoulli từ PRNG LCG riêng.

Giả định profile:
| Profile | Tốc độ trước/sau khách | Xác suất đón mỗi cơ hội | Xác suất ghé mỗi shop |
|---|---:|---:|---:|
|Thận trọng|10/8 m/s|70%|90%|
|Trung bình giả định|14/12 m/s|85%|90%|
|Nhanh|20/20 m/s|92%|95%|

**Các xác suất không được đo từ người thật.** Mô hình không có HP/xăng, va chạm, phí trước mua, boarding geometry, QTE, fork hoặc kiểm tra shop gần giao lộ cho các shop sau. Same seed không bảo đảm cùng biến cố sau khi lịch cơ hội giữa hai variant khác nhau; đây không phải matched input replay của engine.

| Profile | Config | Mua ≤90 s | Mua ≤180 s | P10/median/P90 thời gian trong các lượt mua | Chưa mua ở180 s |
|---|---|---:|---:|---:|---:|
|Thận trọng|Current|0/3000|2725/3000|133,50 /143,55 /143,55 s|275|
|Thận trọng|Proposal|2005/3000|2659/3000|85,55 /85,55 /174,00 s|341|
|Trung bình giả định|Current|55/3000|2969/3000|92,15 /96,90 /96,90 s|31|
|Trung bình giả định|Proposal|2352/3000|2945/3000|57,85 /57,85 /118,60 s|55|
|Nhanh|Current|2850/3000|3000/3000|60 /60 /60 s|0|
|Nhanh|Proposal|2979/3000|3000/3000|36 /36 /75 s|0|

Median tính có điều kiện mua được trước180 s; đã nêu mẫu censored riêng, không gộp thành đã mua hoặc đã chết. Các mốc lặp vì shop/NPC cố định và tốc độ profile hằng.

Ý nghĩa:
- Mẫu trung bình proposal có78,4% cơ hội mua ≤90 s trong mô hình lạc quan này; dùng làm ứng viên thử, không bảo đảm tỷ lệ người chơi.
- Current trung bình chậm hơn median85,72 của review P5 vì mô hình này **có đón khách**, còn pilot P5 không đón trước xe. Không gọi đây là tái lập P5 hoặc regression fail.
- Có đuôi chậm118–174 s nếu lỡ NPC/shop. Cần đo engine thật xem có nên nới sớm NPC/giá, không thêm trợ cấp ngầm.
- Không có dữ liệu mô phỏng mới chứng minh survival6–7 phút hay peak2/3 stress. Các thông số collision/resource/spawn cần kiểm tra tích hợp sau khi được duyệt.

### Tự review game design của lượt phân tích

Mô hình ủng hộ tính khả thi **kinh tế** của mốc xe một phút khi một khách sớm là mục tiêu. Nó cũng chỉ ra một rủi ro mới: người bỏ lỡ khách mất rất nhiều thu nhập, và xe7 chỗ/buýt đủ khách có thể giàu. Vì vậy không áp đồng thời toàn bộ damage/spawn/resource cực đại; giữ lost-passenger RNG vừa phải và kiểm cả đường tiếp cận khách.

### Tự review UI/UX của lượt phân tích

Không có build chạy/screenshot mới nên chưa audit UI hoặc đánh giá khả năng đọc ở density đề xuất. Rủi ro cần xác minh: cue supply bị cue hazard che, hai bờ nước có thể bị hiểu thành phủ kín, nhiều traffic che lối giữa, F/Grab cạnh lề trong gió, shop sau QTE. Kiểm bằng input thật và ảnh mới sau triển khai; không dùng ảnh prototype cũ nghiệm thu bản cân bằng mới.

## 8. Fairness, RNG và thử xăng traffic bật/tắt

### Các ràng buộc áp dụng cho mọi seed

- RNG seed/config riêng, bounded variation; shop sau hai điểm đầu720–1080 m, không thay vị trí khi mở lại.
- Không tăng RNG fuel thấp của traffic ở vòng A. Hiện traffic sinh đầy bình; thêm random gần cạn sẽ là thay đổi pacing riêng, không phải “tắt/bật fuel”.
- Mỗi chuỗi nước/ổ gà/officer/traffic phải có tuyến input khả thi; kiểm cả quãng phanh, drift, force gió và hiện trạng hai xe.
- Không tính xe dự phòng như tài nguyên bắt buộc để vượt màn spawn. Nó là cứu sai sót, không là vé phải trả cho RNG.
- Gần cạn phải có nguồn có thể tới bằng input hợp lệ; không chỉ tồn tại một pickup trên bản đồ nhưng bị rào/traffic chặn.
- Giữ luật hậu quả/idempotence: không nhân khách/loot khi xác được cập nhật, không farm F/G, không cộng damage mỗi frame, không để star cứu tàu.
- Ước lượng forced cost phải cộng các patch chồng và chi phí tới tiếp tế tiếp theo; nếu vượt ngân sách thì bỏ/fallback mẫu, không tự hồi máu hoặc cho tiền.
- Không ép terminal ở phút6–7 bằng timer/HP drain mới.

### Quyết định đã nhận từ chủ dự án

Trong lượt này người dùng chọn **“Đề xuất so sánh bật/tắt rồi quyết định”**. Vì vậy không chốt tắt. Bảng đề xuất chính giả định giữ fuel traffic như hiện hành.

Ma trận so sánh:
1. Fuel ON hiện hành; traffic khởi tạo đầy đúng loại.
2. Fuel OFF chỉ bỏ tiêu nhiên liệu và chuyển coasting do cạn; giữ water slowdown, HP, speed, damage, spawn seed và player fuel.
3. Chạy cùng input replay cho mỗi cặp; sau khi quỹ đạo phân kỳ vẫn giữ input để so nhân quả. Bổ sung pilot phản ứng theo trạng thái để đo cách người chơi thích nghi.
4. Đếm traffic cạn/km, stopped seconds/km, jam/chuỗi collision, khách môi trường sinh/đón, lối bị chặn, death cause, CPU/frame.
5. Tách ảnh hưởng gián tiếp: đề xuất giảm tank/tăng L/m của xe người chơi hiện cũng đổi fuel traffic vì dùng chung definition. Thử “vehicle stats cũ/mới × fuel ON/OFF” để không gán nhầm nguyên nhân.
6. Không đặt target “OFF phải dễ hơn”: trong nước traffic còn chạy có thể tăng nguy cơ đối đầu; ON có thể tạo nút thắt. Kết quả tùy quỹ đạo.
7. Nghiêng về giữ ON nếu cơ chế có hiện diện, đọc được và không gây spike unfair; nghiêng OFF nếu tốn chi phí nhưng gần như không xuất hiện hoặc làm lỗi đường đi khó kiểm soát. Chủ dự án chọn sau khi có số liệu.

Không cần viết thêm menu chọn fuel cho người chơi; đây là cấu hình thử nghiệm.

## 9. Cách đo ván 6–7 phút và rollout A/B

### Định nghĩa phép đo

“Người chơi trung bình” là người đã hiểu input và chơi thử2–3 ván làm quen, không phải bot biết tương lai. Đo main cohort trên bốn xe trọng tâm và policy tự chọn hợp lý; không gộp container/buýt khiến median lệch.

Tính thời gian gameplay hoạt động đến kết ván, gồm lái, ngã/hồi phục, chờ tàu và coasting; loại pause, Help/card pause và shop. Ghi riêng wall-clock. Secret là kết ván thành công, báo riêng với thua; không trộn vào tỷ lệ death để suy khó.

Mục tiêu chính: **median360–420 s**, không phải mọi lượt đều chết trong khoảng đó. Mục tiêu phụ khởi đầu để duyệt:
- P25 khoảng240–330 s, P75 khoảng480–600 s; không bóp phân bố vào một timer.
- Tử vong trước60 s sau làm quen ≤10% ở nhóm trung bình; nếu cao, xử lý unfair/onboarding trước.
- Tỷ lệ mua car4 thật ≤90 s mục tiêu70–85% ở người có chủ ý đón khách/mua xe; báo toàn cohort riêng, không lọc bỏ người chết.
- Thời gian fuel<25% khoảng20–35% ván; HP<35% khoảng15–30%; không đòi cả hai cùng nguy cấp liên tục.
- Đánh giá vui≥7/10 và cảm giác công bằng≥7/10 trong mẫu thử; subjective, báo cỡ mẫu.

Để khẳng định **độ khó đầu cao hơn đáng kể**, so cùng cohort/seed ở cửa sổ0–2 km hoặc0–120 s, với baseline snapshot:
- Ưu tiên báo chênh xác suất thua tuyệt đối và khoảng tin cậy.
- Chỉ dùng tỷ lệ H_new/H_current mục tiêu≥1,35 nếu baseline có đủ sự kiện; baseline gần0 thì tỷ lệ vô nghĩa.
- Đo thêm số quyết định lái thực, không tính chỉ số spawn làm bằng chứng khó.
- Nếu đầu vẫn dễ dù pickup ít hơn, tăng density một bước; không bắt đầu bằng cắt warning.

Ở tốc độ hiệu dụng11–16 m/s, 6–7 phút tương đương khoảng4,0–6,7 km trước khi trừ thời gian ngã/chờ. Bởi vậy ramp10 km cũ có thể chưa tới trần ở ván đại diện; chọn5 km hợp mục tiêu hơn, nhưng phải log distance lúc chết thật.

### Ma trận bot tích hợp sau triển khai được duyệt

- Seeds1–1000; mỗi seed cùng paired replay giữa config.
- Profile: thận trọng, trung bình phản ứng hữu hạn, nhanh/rủi ro, solo đối chiếu, khách đúng tải và quá tải.
- Hai policy mua: mua car4 trước; ở lại xe máy/mô tô. Thêm car7 và buýt nhiều khách để tìm chiến thuật vượt trội.
- Bot chỉ dùng dữ liệu trong vùng nhìn/cue, phản ứng có delay; gợi ý0,25/0,45/0,65 s để kiểm độ nhạy, không tự nhận đó là phản xạ đo được.
- Giữ 0/đúng tải/quá tải; không grant tiền/item/xe miễn phí trong economy cohort. Fixture có sẵn xe dùng regression hình học, không tính là ván mua xe.
- Chạy ít nhất12 phút hoặc terminal; các lượt còn sống là right-censored, không gọi thời lượng bằng cap. Dùng Kaplan–Meier khi có censor; báo death/fuel/HP/police/train/secret riêng.
- Nếu median chưa đạt vì >50% còn sống ở cap thì nới cap; nếu <360 s, tìm cause/segment chứ không bơm tài nguyên đồng loạt.
- Kiểm 30/60/144 render FPS, pause/restart/fork/idempotence và cả8 footprint; lực Cannon là cohort riêng.
- Lưu config/revision/seed/input policy/input replay/events, lượng hồi thực sau clamp, money ledger, resource trace, shop pass/attempt/purchase, density sau reject và reason reject.

### Rollout theo từng nhóm biến

| Vòng | So sánh | Câu hỏi chính |
|---|---|---|
|0|Baseline snapshot trên engine hiện tại|Tái lập số nguồn và có log thực, không giả định báo cáo cũ là kết quả mới|
|1|Economy cũ vs nền/khách/giá/shop mới; tài nguyên giữ cũ|Mua xe thật khoảng một phút? Có chiến thuật khách quá giàu?|
|2|Pickup cũ vs giảm hồi, sau đó interval450 vs480|Nguồn thiếu vì kỹ năng hay RNG bất khả thi?|
|3|Tank/L/m/HP bốn xe từng nhóm|Xe4/7 còn khác nhau, mua xe thay sửa có quá lời?|
|4|Gap80→70/ramp5 km; sau đó các layer ngập/traffic|Khó đầu tăng rõ, giữ warning và đường đi|
|5|Overlap10→30%, peak ngắn|Peak tiến gần mốc2/3 mà vẫn có cửa né?|
|6|Fuel traffic ON/OFF, stats cũ/mới|Chủ dự án có dữ liệu để quyết định|
|7|Star3,5 s, Grab×1,5, upgrades, return0,65|Bịt chiến thuật item/khách quá mạnh, giữ vui/RNG nhẹ|

Các bộ số là cùng một candidate cuối, nhưng **không nhập tất cả vào một phép A/B đầu tiên**. Nếu mỗi vòng đã cho thấy ván quá ngắn thì dừng tăng cường độ, không cố ép mọi số trong bảng.

Người thật: tối thiểu12–20 người, mỗi người2–3 ván làm quen rồi4 ván tính điểm, đảo thứ tự A/B theo cặp seed để giảm hiệu ứng học. Đây là mức mẫu khám phá, không đủ chứng minh toàn dân số. Báo bootstrap CI theo người chơi hoặc phương pháp phù hợp, không coi nhiều lượt cùng người là mẫu độc lập hoàn toàn.

Rollback nếu xuất hiện màn bắt buộc item chưa có, nguồn xăng không thể tiếp cận theo solver kiểm tra, terminal không báo trước, hoặc tỷ lệ chết sớm tăng vì bố cục vô lối. Duyệt lại từng nhóm chỉ số sau rollback, không giảm chất lượng kiểm tra.

## 10. Bàn giao cho Codex triển khai sau khi được xác nhận

1. Xác minh lại branch/head từ GitHub khi bắt đầu; không dùng default P4.1 làm base chỉ vì tên default. Giữ snapshot stress và mọi review lịch sử.
2. Đọc AGENTS và latest design; giữ gameplay thường/noforce làm đối chứng. Không tự bật force/tail sweep.
3. Chỉ áp nhóm số đã được duyệt từ báo cáo, gắn config version mới và đơn vị. Các key chưa có phải được chỉ rõ, không rải magic number.
4. Bắt đầu bằng economy+shop720/1500/720–1080, rồi tài nguyên; kiểm mua xe thật, khách/loss và chi tiền.
5. Trước pattern mới, hỗ trợ dữ liệu cặp patch và layer hazard trong generator tối thiểu; dùng cơ chế collision đang có. Không thêm item, unlock, quest, bonus thời gian, income cap hoặc mechanic cứu RNG mới.
6. Khi thay bố cục, bổ sung kiểm hành lang theo thời gian, budget forced water và supply reachability. Không xóa validation chỉ vì ứng viên gap không pass.
7. Chạy gate bắt buộc theo repo và manual gameplay liên quan trên revision cuối; ghi kết quả thật. Các phép mô phỏng economy của báo cáo không thay tests game.
8. Báo cáo GD/UX riêng sau mỗi vòng, nêu data/assumption/proposal; xin chủ dự án đánh giá trước khóa số lớn.
9. Không sửa DESIGN để hợp thức hóa logic mới ngoài yêu cầu. Cập nhật BALANCE_CONFIG để phân biệt số lịch sử và candidate đã thử.
10. **Không merge hoặc sửa repo trong lượt phân tích này.** Triển khai, push/PR hoặc merge chỉ theo ủy quyền tiếp theo và quy trình repo; báo cáo hiện không phải phê duyệt tự merge.

### Những điều chưa thể kết luận

- Chưa đo survival6–7 phút của candidate trong game thật.
- Chưa chứng minh peak đạt2/3 độ khó stress; mới có mốc cấu hình, định nghĩa đo và envelope thử.
- Chưa kiểm fairness toàn bộ phối hợp nước/traffic/officer/gió ở density đề xuất.
- Chưa quyết định fuel traffic ON/OFF; người dùng chọn so sánh trước.
- Chưa chốt economy xe giải trí đông khách.
- Chưa chạy lint/typecheck/test/build của repo hoặc manual browser mới vì không sửa/chạy game; không lấy pass lịch sử làm pass hiện tại.

Báo cáo đủ làm đầu vào một vòng P8 có thể review, nhưng các con số vẫn là ứng viên cần kiểm chứng, không là balance đã nghiệm thu.

