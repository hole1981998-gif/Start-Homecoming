# Tinh chỉnh C3: early game, consumable, điểm tốc độ và QTE

> **Cập nhật theo xác nhận mới nhất của chủ dự án:** hàng rong phải nhanh hơn bản gốc, bật ra nhanh rồi giảm về tốc độ đều; bỏ hoàn toàn đề xuất 2,9 m/s trước đó. Giá vật phẩm giảm mạnh hơn do người chơi thường bỏ lỡ khách. Không cân bù hoặc tăng giá lại để ép trung vị ~5 phút. Chủ dự án đã yêu cầu chuyển bản này sang chat code triển khai; các phần early game, điểm và QTE bên dưới vẫn thuộc gói công việc.

## Phạm vi và quyết định đề nghị

Nguồn kiểm tra: checkout sạch nhánh `codex/p8-balance-pass`, HEAD `3ac54aa` — `Balance P8 encounters with C3 survival profile`. Đã đọc review C3 và các đoạn config/route/scoring/UI cần thiết; không đọc lại prototype cũ. Đây là bản yêu cầu để chat code triển khai sau bàn giao, chưa sửa repo game trong chat này.

Chủ dự án xác nhận độ khó tổng thể đã ổn, cần bớt unforgiving trước 90 giây. Giữ C3 làm baseline, không tiếp tục buff HP/tank toàn ván. Những thay đổi toàn ván được yêu cầu riêng là tốc độ hàng rong, giá vật phẩm, cách tính điểm và QTE; chúng có thể ảnh hưởng gián tiếp thời lượng dù director sau 90 giây giữ nguyên.

Đề nghị:

1. Trước 45 s, giảm 25% số cơ hội nhận lớp thứ ba trong các nhóm đủ điều kiện; từ 45 đến 90 s trả dần về C3. Giữ ít nhất hai lớp, số nhóm và nhịp gốc. Sau 90 s dùng nguyên quy tắc director C3.
2. Hàng rong bật ra ở 6,0 m/s trong 0,15 s, giảm mượt về 3,8 m/s trong 0,45 s tiếp theo, rồi giữ 3,8 m/s đến khi qua đường. Nhanh hơn tốc độ cũ 3,4 m/s ở cả pha chạy đều; không đổi kích thước/damage hoặc cố tình rút cue.
3. Nitro 50, Star 80, chuối 25, Grab 120. Không tăng số lượt, duration hoặc multiplier. Ưu tiên người bỏ lỡ khách vẫn có cơ hội mua và dùng đồ; không cân bù để giữ thời lượng 5 phút.
4. Điểm là kết quả chính; thưởng theo tốc độ tương đối của xe, hệ số 0→1→tối đa 1,5. Chọn scale 0,65 điểm/m và cap thưởng khách 8% để kiểm soát tổng điểm.
5. QTE mở từ 2,4→2,0 giây theo tốc độ tham chiếu: 33,6→28 m ở 14 m/s; dời cả mốc đóng cùng lượng để giữ nguyên độ dài cửa sổ từng xe. Cần dời điểm bắt đầu cung cua để thực hiện đúng, không chỉ đổi một hằng số.
6. Q sát nhánh trái, E sát nhánh phải, bám vị trí nhánh trong camera. Không làm cả bộ UI/art mới ở lượt này.

## Dữ kiện baseline và đính chính nguồn

[Review implementation C3](https://github.com/hole1981998-gif/Start-Homecoming/blob/3ac54aa/docs/P8_C3_IMPLEMENTATION_REVIEW_2026-10-23.md) ghi proxy `adaptive`, seed 1–100: P25/P50/P75 **223/301/362 s**, 45 xăng/45 HP/8 công an/2 censored; 100/100 mua car4, P50 12,8 s với input tăng tốc. Các gate repo được báo pass trên revision đó. Đây là số từ báo cáo chat code, không phải lượt simulation mới của chat Balance.

Review cũng phát hiện lỗi script sinh thí nghiệm trước của tôi: tank car4/car7 trong bản sao đã bị hoán đổi 16,9/13 L. Bảng chủ đích và code đã áp là **13/16,9 L**. Vì thế dùng 301 s của implementation, không dùng 309 s thí nghiệm cũ để khẳng định bản C3 đúng bảng. Đã đánh dấu đính chính trong báo cáo cũ, không chỉnh lại JSON lịch sử. Không dùng script sinh cũ để dựng candidate mới.

P95 gap hình học C3 là 3,48 s, chưa chứng minh khoảng quyết định thực dưới 2 s. Người chơi nay thấy độ khó hợp lý nên không tự tăng mật độ để ép đạt một số thô. Giữ đo decision gap và cảnh báo như việc tồn đọng có ghi nhận.

## 1. Nới nhẹ early game, giữ nhịp sau đó

Không đổi HP, damage, nhiên liệu, pickup, bình, shop interval, tốc độ hay phí phạt C3 để làm nhẹ toàn ván. Không tạo khoảng trống dài 4–5 giây và không quay lại random single.

| Thời gian chơi chủ động | Tỷ lệ giữ lớp thứ ba của một nhóm vốn có ba lớp |
|---|---:|
| 0–45 s | 75% so với C3 |
| 45–90 s | Tăng tuyến tính 75→100% |
| ≥90 s | 100%, nguyên C3 |

Đây là hệ số tương đối, không phải đặt cả game có 75% nhóm ba lớp. Ví dụ nếu baseline có 40% nhóm ba lớp thì giai đoạn đầu còn khoảng 30% trước các reject; tỷ lệ thực phải đo sau generator.

Khi bớt một lớp, giữ cặp chủ đạo tạo lựa chọn nước/traffic hoặc timing. Không xóa lớp làm mất đường thoát, không xóa nước rồi thay bằng một chướng ngại cứng nguy hiểm hơn. Với template không có cách rút một lớp hợp lệ, dùng cặp đã được kiểm cùng nhóm thay thế. Không tự bỏ train/police khỏi 90 giây đầu; không nerf hậu quả terminal của tàu.

Dùng thời gian chơi chủ động, không tính menu/shop/pause, không reset khi đổi xe hoặc crash. Khoảng làm quen trước shop đầu vẫn giữ như C3, không dời khách/shop.

**Ổn định seed và cue:** plan C3 gốc vẫn dùng cùng chuỗi RNG/ID/recent-pattern; lớp early chỉ là điều chỉnh có seed độc lập. Không làm việc bớt lớp tiêu thêm RNG khiến toàn bộ lịch sau đổi. Nhóm đã hiện/cảnh báo không được tăng thêm lớp khi đồng hồ qua 90 s. Khi sinh trước lookahead, dùng ETA dự kiến để gắn mức early cho nhóm và giữ mức đó; một nhóm đang tiếp cận vắt qua mốc 90 s là chuyển tiếp có ghi nhận. Các nhóm mới sau 90 s phải dùng đủ C3. Tài nguyên người chơi còn lại tốt hơn sẽ ảnh hưởng các kiểm khả thi về sau; không hứa cảnh sau 90 s giống từng pixel/seed bất kể trạng thái, chỉ giữ cùng quy tắc/số baseline.

Đích kiểm: giảm 10–20% tỷ lệ chết trước 90 s tương đối, và bớt các lượt ngã liên tục sớm; không đặt mục tiêu làm thời lượng median tăng thêm lớn. Ghi thời lượng để tham khảo. Theo yêu cầu mới, không dùng việc vật phẩm rẻ khiến ván dài hơn làm lý do tăng giá lại hoặc làm khó đoạn sau để ép mốc 5 phút.

## 2. Hàng rong và giá vật phẩm

| Mục | Hiện tại | Đề nghị | Giữ nguyên |
|---|---:|---:|---|
| Hàng rong chạy ngang | 3,4 m/s đều | 6,0 m/s bật ra → 3,8 m/s đều | Kích thước, damage, hướng hai bên, cue/activation hiện có |
| Nitro | 120 | 50 | 4 s, boost 1,3, jump hiện hành |
| Star | 180 | 80 | 5 s; không bảo vệ khỏi mọi terminal/event |
| Chuối | 80 | 25 | Dùng một lần vô hiệu nhóm bắt theo luật hiện hành |
| Grab | 240 | 120 | Ba lượt gọi, thu nhập ×10, giá không đồng nghĩa một lượt |
| Xăng/sửa tại shop | 120/140 | Giữ | 4 L / 20 HP |
| Xe và upgrade | Hiện hành | Giữ | Không cộng discount consumable vào các mục này |

### Hàng rong: bật nhanh rồi chạy đều

Đề xuất trước đã hiểu sai hướng nhanh/chậm của người dùng. Bản này thay hẳn chuyển động đều bằng profile vận tốc ngang sau; các con số là điểm khởi đầu để kiểm cảm giác, chưa phải số đã chạy gameplay:

```text
t = thời gian từ lúc hàng rong được kích hoạt thực sự
0 <= t < 0.15 s: tốc độ ngang = 6.0 m/s
0.15 <= t < 0.60 s:
    u = (t - 0.15) / 0.45
    tốc độ ngang = 3.8 + (6.0 - 3.8) * (1 - u)^2
t >= 0.60 s: tốc độ ngang = 3.8 m/s đến hết lượt qua đường
```

Dấu hướng mirror theo phía xuất phát. Không đổi hướng đuổi theo người chơi, không bật nhanh lại giữa đường, không pingpong nếu luật hàng rong hiện tại chỉ qua một lượt. Pha chạy đều 3,8 m/s vẫn cao hơn 3,4 m/s cũ khoảng 11,8%; “giảm xuống” là giảm từ pha bật ra, không giảm xuống chậm hơn bản cũ.

Với quãng ngang minh họa 12 m, profile trên mất khoảng 2,98 s so với 3,53 s ở tốc độ đều cũ. Đây là tính hình học lý tưởng, không phải thời gian collider thực chặn từng lane.

Hiệu ứng bất ngờ đến từ chuyển động bật ra. Giữ cue báo trước/activation hiện có, xuất phát ngoài mép đường như luật hiện tại; không teleport NPC vào thân xe hoặc tự rút thời gian phản ứng để tạo bất ngờ. Không thêm VFX/SFX mới vào lượt này.

Các pha bắt đầu theo thời gian gameplay từ activation, không từ lúc object được tạo ở lookahead; pause không làm đồng hồ pha chạy tiếp. Cùng một hàm vị trí theo thời gian phải phục vụ render, collision, swept contact, tính cửa tránh và bot dự đoán. Đây là vận tốc **ngang**, không gán nhầm vào speed tiến dọc đường của entity. Không chỉ tween hình ảnh trong khi collider hoặc `hasTimedEscape` vẫn dùng đường tuyến tính cũ. Kiểm hai hướng, tại 0,15/0,60 s, dt thấp/cao, pause/restart và xe dài; không đi xuyên hoặc nhảy tọa độ tại chỗ nối pha. Không tự áp profile này cho công an/dân phòng/cứu thương.

### Vật phẩm: ưu tiên khả năng tiếp cận

Mức giá mới thay cả baseline lẫn bảng giá đề nghị trước (80/120/50/200). Với ví 100 tiền, người chơi có thể mua Nitro + chuối (75), một Star (80), hoặc hai Nitro (100); không cần đón được nhiều khách liên tục mới dùng được đồ. Đây là ví dụ sức mua, không phải kết quả economy simulation.

Chỉ chỉnh giá bốn consumable trong bảng; giữ effect/duration/charge/stock, hai ô inventory, xăng/sửa, xe, upgrade, tiền đầu, thu nhập và passenger spawn. Không tặng thêm tiền hoặc tự nhặt khách thay người chơi để bù việc bỏ lỡ khách.

Chủ dự án cho bỏ yêu cầu cân bù thời lượng ~5 phút ở lượt giảm giá này. Có thể ghi nhận số mua/dùng và thời lượng khi test chức năng, nhưng **không lấy median dài hơn, Grab tăng income hay vật phẩm dùng thường xuyên hơn làm lý do tự nâng giá lại, giảm hiệu ứng hoặc siết hazard/HP/xăng**. Nếu xuất hiện lỗi mua/dùng lặp, trừ tiền sai hay exploit ngoài mechanic đã có thì sửa đúng lỗi; chuyện vật phẩm dễ mua hơn là chủ đích.

## 3. Điểm tốc độ làm kết quả chính

### Chọn mốc tốc độ rõ ràng

“Trung vị” ở đây là **cruise theo định nghĩa xe**, không phải median học từ lịch sử người chơi. Phanh/đi chậm lâu không được làm mốc tự tụt để kiếm bonus.

- `v_min`: minSpeed gốc của loại xe.
- `v_ref`: cruise hợp lệ theo số khách **trong sức chứa**; dùng `passengerDrive(min(số_khách, capacity−1), catalog_vehicle).cruiseSpeed`. Không lấy speed bị giảm do nước/gió/crash/coasting/nitro làm chuẩn. Không để quá tải thêm làm chuẩn giảm tiếp để kiếm thưởng dễ.
- `v_top`: maxSpeed gốc của loại xe, trước engine upgrade/nitro. Các tốc độ cao hơn vẫn cap hệ số thưởng; upgrade giúp giữ tốc độ nhưng không mở trần hệ số vô hạn.
- `v`: tốc độ tiến thực trong đoạn simulation có quyền ghi điểm. Dùng đơn vị m/s nhất quán.

Dùng cruise theo tải hợp lệ để chở khách không bị phạt điểm chỉ vì xe tự giảm cruise. Khách vẫn giúp economy; không cho xe buýt 24 khách nhân điểm gấp đôi như công thức cũ.

### Công thức candidate `speed-v1`

```text
Nếu v <= v_min: M = 0
Nếu v_min < v <= v_ref:
    u = clamp((v - v_min) / (v_ref - v_min), 0, 1)
    M = u^1.2
Nếu v > v_ref:
    h = clamp((v - v_ref) / (v_top - v_ref), 0, 1)
    M = 1 + 0.5*h

P = 1 + 0.02 * min(số_khách, 4)       # tối đa 1.08
điểm_tăng = quãng_đường_tiến_hợp_lệ * 0.65 * M * P
```

Đây **thay thế** `scorePerMeter=1` và `riderScoreBonus=0,04` cũ, không nhân thêm công thức cũ một lần nữa. Đảm bảo các mẫu số dương; catalog/tải hợp lệ hiện cho `v_min < v_ref < v_top`. Nếu config tương lai vi phạm, validator phải báo hoặc dùng nhánh giới hạn an toàn, không sinh NaN.

Tích phân theo segment/fixed step với tốc độ thực, giữ số thực trong state và chỉ làm tròn khi hiển thị. Không làm tròn từng frame. Nếu qua mốc min/ref/top trong một bước, xử lý nhất quán theo bước simulation, kiểm dt invariance. Không thưởng điểm do đứng yên, mở shop, pause, đổi xe, nhặt khách tại chỗ, teleport/checkpoint, slide hoặc đoạn crash không có quyền ghi điểm. Không lấy vận tốc văng ngang/độ dài quỹ đạo rung để tạo điểm. Giữ chính sách không có điểm trong crash hiện tại.

### Ví dụ car4 trống khách

Min/cruise/max = 8/16/24 m/s. Bảng này là phép tính công thức, không phải một ván đã chạy.

| Tốc độ | M | Điểm mỗi km | Điểm mỗi phút nếu duy trì đều |
|---|---:|---:|---:|
| 8 m/s | 0 | 0 | 0 |
| 10 m/s | 0,189 | 123 | 74 |
| 12 m/s | 0,435 | 283 | 204 |
| 16 m/s — cruise | 1,00 | 650 | 624 |
| 20 m/s | 1,25 | 813 | 975 |
| 24 m/s — max gốc | 1,50 | 975 | 1.404 |
| 31,2 m/s — ví dụ boost | 1,50 | 975 | 1.825 |

Tốc độ tối đa được 50% điểm/m nhiều hơn cruise, đồng thời đi xa hơn trong cùng thời gian. Vì vậy khuyến khích chạy nhanh thật, không chỉ sống lâu ở tốc độ tối thiểu.

Đổi điểm không trực tiếp thay HP/spawn nhưng có thể khiến người chơi giữ W nhiều hơn, làm thời lượng trung vị giảm. Đo lại cả score/phút và thời lượng sau khi người chơi biết luật mới; không lấy median bot 301 s trước thay đổi để cam kết phiên bản có scoring mới vẫn đúng 5 phút. Không cân lại toàn bộ late game chỉ để bù hành vi này trước khi có dữ liệu.

**Giới hạn lạm phát:** toàn bộ công thức luôn ≤`0,65×1,5×1,08 = 1,053 điểm/m`. Ngay trường hợp thưởng tối đa cũng chỉ hơn 5,3% so mốc cũ 1 điểm/m chưa khách; khác biệt chính là phần chậm nhận ít hơn. Không có combo nhân tiếp, streak vô hạn hay thưởng tiền dựa vào điểm. Tỷ lệ tăng so cách chạy chậm sẽ lớn theo chủ đích; so lạm phát phải xét trần điểm/m và phân bố, không kỳ vọng giữ nguyên mọi điểm cũ.

Phải kiểm cả tám xe, có/không khách, quá tải, engine upgrades, nitro, switch và coast. Xe nhanh vẫn có lợi điểm/phút vì thực sự đi xa hơn; chuẩn hóa tốc độ không đồng nghĩa mọi loại xe phải bằng nhau về điểm/phút. Xe giải trí không được tự tăng hệ số đặc biệt để cạnh tranh.

### Kết quả và bảng xếp hạng

- Điểm tổng là số lớn/chính ở kết quả và mục tiêu phá kỷ lục; quãng đường, thời gian, tiền là chỉ số phụ. HUD đổi thứ bậc score/distance vừa đủ, không làm một đợt redesign toàn bộ.
- Leaderboard hiện đã sort theo score trước, rồi distance, rồi thời gian ít hơn: giữ nguyên thứ tự tie-break, đổi trọng tâm hiển thị. Không nói hiện tại leaderboard đang sort theo distance.
- Version điểm mới `speed-v1`, bảng thành tích riêng với dữ liệu cũ. Giữ lịch sử cũ, gắn nhãn cách tính cũ; không xóa save và không quy đổi điểm cũ khi không có lịch sử vận tốc. Badge/ending và tiền không reset.
- Có thể hiện nhỏ `×1,25 tốc độ` khi cần phản hồi, không toast mỗi frame; giá trị M không chứa hệ số 0,65 để người chơi hiểu “cruise ×1”. Không cần thêm FX/art trong lượt này.

## 4. QTE mở gần hơn, giữ nguyên cửa sổ từng xe

### Vì sao không chỉ đổi 33,6 thành 28

Hiện `junctionWindow` mở `2,4*v_ref` m trước tâm, đóng `max(9, closeLead[xe]*v_ref)` m trước tâm. Thời lượng thực khác nhau theo xe. `pathPose` bắt đầu cung rẽ trước tâm **8 m**. Xe máy ở 14 m/s đóng tại 9 m để chốt lựa chọn trước cung rẽ.

Nếu mở tại 28 m nhưng vẫn đóng 9 m thì thời lượng xe máy bị rút khoảng 0,4 s, trái yêu cầu giữ cửa sổ. Nếu dời cả mở và đóng mà không sửa cung cua thì xe máy còn được chọn khi đã qua điểm bắt đầu rẽ. Vì thế cần thay đồng bộ logic QTE và mốc bắt đầu cung, không chỉ CSS hoặc con số hiển thị.

### Phương án đề nghị

Chụp cùng `referenceSpeed=max(speed,8)` một lần như hiện tại:

```text
oldOpen  = 2.4 * referenceSpeed
oldClose = max(9, closeLead[vehicle] * referenceSpeed)
shift    = 0.4 * referenceSpeed
newOpen  = oldOpen - shift   # 2.0 * referenceSpeed
newClose = oldClose - shift
```

Cả hai đều là khoảng cách còn lại tới cùng mốc giao lộ. Độ dài cửa sổ theo mét và thời lượng danh nghĩa ở referenceSpeed giữ **chính xác**: `newOpen-newClose = oldOpen-oldClose`. Xe càng lớn vẫn ngắn hơn theo closeLead đang có. Không hardcode 28 m ở mọi tốc độ: 28 m chỉ ứng với 14 m/s; 16 m/s là 32 m thay vì 38,4 m; 24 m/s là 48 m thay vì 57,6 m.

| Xe, cùng referenceSpeed 14 m/s | Mở cũ → mới | Đóng cũ → mới | Thời lượng danh nghĩa giữ nguyên |
|---|---:|---:|---:|
| Xe máy | 33,6→28 m | 9→3,4 m | 1,757 s |
| Mô tô | 33,6→28 m | 9→3,4 m | 1,757 s |
| Ba gác | 33,6→28 m | 10,5→4,9 m | 1,650 s |
| Car4 | 33,6→28 m | 11,2→5,6 m | 1,600 s |
| Car7 | 33,6→28 m | 13,3→7,7 m | 1,450 s |
| Tải | 33,6→28 m | 15,4→9,8 m | 1,300 s |
| Buýt | 33,6→28 m | 16,1→10,5 m | 1,250 s |
| Container | 33,6→28 m | 18,2→12,6 m | 1,100 s |

**Điều chỉnh hình học cần đi kèm:** chuyển điểm bắt đầu cung rẽ từ 8 m trước mốc sang **2 m trước mốc**, giữ độ dài cung 16 m và góc rẽ. Min `newClose` của tám xe với ref≥8 m/s là 3 m, nên còn ít nhất 1 m để chốt input trước khi cung bắt đầu. Đây là đề nghị dời timing/hình học cục bộ để giữ đúng thời lượng, không đổi bán kính/handling. Khoảng đệm 1 m là kiểm hình học tối thiểu, chưa chứng minh đủ cho collider dài/force trong gameplay.

Nguồn `render.ts` còn gắn crossroad/straight stub ở `cross.distance−8`; phải cập nhật cùng một config mốc cung, kiểm road mesh/landscape/collider/fork/trailer/tail sweep đều đồng nhất. Route chuyển index hiện ở tâm+4, compaction dùng mốc kết thúc cung cũ: phải kiểm và dùng mốc mới nơi cần để tránh đường nhảy/compaction sớm. Không thay toàn bộ số 8 trong repo bằng 2. Không dời shop hoặc reset hazard stream để che mismatch.

Giữ mốc giao lộ nhìn thấy và ý nghĩa khoảng cách rõ ràng: không chỉ đẩy toàn bộ nhánh đường xa thêm 6 m rồi gọi cửa QTE đã mở gần hơn. Cần bố trí lại phần cung/đoạn nối trong giao lộ cho phù hợp, kiểm vị trí nhánh và xe thật sự đi trên mặt đường. Đây là phần hình học cần review bằng gameplay, không phải đã được chứng minh chỉ qua công thức timing.

Giữ freeze cửa sổ: phanh, nitro hoặc đổi xe sau khi chụp không kéo mở lại hay đổi độ dài. “Giữ thời lượng” ở đây là giữ span và thời lượng danh nghĩa của luật cũ; luật cũ đóng theo vị trí, vì vậy phanh thực tế vẫn kéo dài giây trên đồng hồ như trước. Không âm thầm chuyển sang timer độc lập để làm một luật khác.

Nếu không hoàn thành kiểm hình học/collider cho phương án dời cung, để lại timing cũ và báo chính xác phần chưa làm; **không rút cửa sổ hoặc chỉ vẽ UI mở muộn rồi gọi đã giữ nguyên**. Chủ dự án có thể duyệt phương án hẹp hơn sau khi xem bằng chứng, không mặc định đánh đổi yêu cầu này.

### Layout Q/E theo nhánh

- Tách Q và E thành hai cue riêng. Q nằm ngay bên nhánh rẽ trái, E bên nhánh phải, theo hệ tọa độ local của giao lộ rồi chiếu ra camera. Không coi trái màn hình cố định là trái nhánh nếu camera đang xoay.
- Đặt ngoài phần mặt đường cần quan sát, gần lối vào nhánh, không nằm giữa tuyến né. Không gắn vào xe, không gom lại thành cụm chính giữa. Giữ kích thước chữ ổn định trên màn hình, nội dung Q/↰ và ↱/E đọc được, nền tối vừa đủ.
- Có trạng thái báo trước, đang nhận input, đã chọn, đã đóng. Giữ cue chuẩn bị nhìn thấy sớm, chỉ bắt đầu đếm/nhận input tại `newOpen`; yêu cầu mở gần hơn không có nghĩa xóa mọi báo hiệu sắp tới giao lộ.
- Phần countdown phải tính tới **mốc đóng cửa nhận input**, không tới tâm ngã rẽ như `approach/speed` hiện tại. Thanh tiến trình lấy span cửa sổ đã freeze. Khi xe dừng, không chia cho 0; giữ tiến trình vị trí và hiện trạng thái phù hợp thay vì số vô hạn.
- Chọn Q thì cue trái xác nhận rõ, cue E hạ nhấn; áp dụng ngược lại cho E. Trạng thái “đường thẳng chặn” có thể ở giữa phía trên gọn, không kéo hai phím trở lại giữa đường.
- Chiếu/clamp cue trong viewport với lề an toàn, không đổi bên trái/phải; kiểm 9:16 và màn hình thấp, camera nghiêng, vừa rẽ liên tiếp, xe lớn và cụm hazard. DOM đọc trạng thái một lần khi đổi, không spam screen reader theo mỗi frame.
- Đây là sửa layout/chức năng QTE được yêu cầu ngay, không triển khai art/UI style guide hoàn chỉnh hoặc gửi việc sang tab UI placeholder tự động.

## 5. Kiểm chứng và bàn giao

Đã chạy **9.874 kiểm số** trong `score-qte-check-2026-10-23.mjs`: multiplier hữu hạn/không giảm theo tốc độ với chuẩn cố định; cap điểm/m; span QTE cũ/mới của tám xe với ref 8–60 m/s; min mốc đóng ≥3 m. Exit 0, kết quả JSON cạnh script. Đây chỉ là kiểm công thức, **không phải game simulation hay manual UI** và chưa bao phủ toàn bộ chuyển tải/upgrade.

Khi code thực tế:

1. A/B C3 với early candidate cùng seed/input, tối thiểu 100 seed vòng đầu rồi mở rộng khi cần. Báo chết trước 45/90 s, tổng median/censored, tỷ lệ 2/3 lớp, ngã liên tiếp, pattern after90 và lý do reject. Kiểm profile cruise/W/adaptive và bốn xe trọng tâm; không tối ưu bot để đẹp số.
2. Kiểm giá trưng bày và số tiền trừ khớp bảng 50/80/25/120; mua đúng lúc ví bằng giá, thiếu một tiền, đủ/đầy ô đồ, dùng/rebuy/restart. Có thể tách quan sát early và discount để hiểu tác động, nhưng không cân bù hoặc gate nghiệm thu bằng median ~5 phút cho thay đổi giá này. Không tự hoàn nguyên giá vì người chơi mua nhiều hơn.
3. Test điểm theo tốc độ min/ref/max/boost, quãng đường bằng nhau ở tốc độ khác nhau, dt, pause/crash/switch, passenger/overload và cap; test leaderboard version/legacy không mất save. Chạy lại log các quỹ đạo cũ để so score/m và score/phút mà không cần đổi input.
4. Test QTE đầu/cuối từng xe hai hướng, ref thấp/cao, phanh/nitro/switch sau freeze, vị trí đường/camera liên tục, trailer và fork/retirement. Kiểm input không được nhận sau khi cung đã bắt đầu và không đổi bố cục road khi chọn muộn.
5. Manual tối thiểu ở 8/14/24 m/s, đủ tám xe cho QTE; hàng rong hai bên/nhiều tốc độ; mua và dùng consumable; kết quả score chính; restart và dữ liệu cũ. Lint/typecheck/test/build trên revision cuối. Chưa chạy các gate này trong chat Balance vì chưa sửa repo.

Không tự merge. Dùng đúng C3 `3ac54aa` hoặc HEAD mới đã đối chiếu làm baseline, không nhân lại các hệ số HP/xăng C3 đã áp. Không tạo lại candidate từ script lịch sử có lỗi tank đã nêu.
