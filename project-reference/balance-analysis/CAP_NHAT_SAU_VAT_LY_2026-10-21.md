# Cập nhật kế hoạch cân bằng sau bản vật lý — 21/10/2026

**ĐỀ XUẤT, chưa áp dụng vào GitHub.** Tài liệu này thay các mục tiêu thời gian và baseline vật lý trong báo cáo ngày20/10. Không coi các đề xuất cũ là số đã có trong game.

## 1. Phạm vi kiểm tra và design mới

Chỉ kiểm tra thay đổi từ snapshot đã đọc trước đó `2e95705` đến branch mới nhất `codex/car7-front-pivot`, commit **b0c226f583f0cbe80a040e4bb13b2bd14d9ca828**, ahead4commit. Không đọc lại các review prototype cũ không liên quan.

Những thay đổi ảnh hưởng cân bằng:
- **Force đã là bản chính** tại / và index.html. Noforce là backup, không phải baseline triển khai mới.
- Buýt và tải bám trục sau; tải quét nhẹ hơn buýt. Container có hai vùng va chạm; đầu chạm trước nhận đủ damage, rơ-moóc trước nhận50%, một HP event/entity; nước/ổ gà chỉ xét đầu kéo.
- Car7 có điểm điều hướng trước tâm12% chiều dài, gain0,22, maxYaw0,085rad, response0,7rad/s. Chỉ xe người chơi, không đổi traffic/grip/HP/economy.
- Cảnh quan năm vùng đã có placeholder seeded, không đổi RNG gameplay/collision/economy.
- Damage arcade vẫn dùng AABB trong một số trường hợp còn khác collider xoay. Phải kiểm va quệt/cua thật trước khi kết luận xe cần thêm HP hoặc giảm grip.

Nguồn mới: [tích hợp force](https://github.com/hole1981998-gif/Start-Homecoming/blob/b0c226f583f0cbe80a040e4bb13b2bd14d9ca828/docs/MAIN_FORCE_INTEGRATION_REVIEW.md), [car7](https://github.com/hole1981998-gif/Start-Homecoming/blob/b0c226f583f0cbe80a040e4bb13b2bd14d9ca828/docs/CAR7_FRONT_PIVOT_REVIEW.md), [sửa xe lớn/container](https://github.com/hole1981998-gif/Start-Homecoming/blob/b0c226f583f0cbe80a040e4bb13b2bd14d9ca828/docs/PHYSICS_TAIL_SWEEP_REVIEW.md), [cảnh quan](https://github.com/hole1981998-gif/Start-Homecoming/blob/b0c226f583f0cbe80a040e4bb13b2bd14d9ca828/docs/SEEDED_LANDSCAPE_REVIEW.md), [design diff](https://github.com/hole1981998-gif/Start-Homecoming/compare/2e95705e8c2eb95ee7ab899858c09bff6629ddf0...b0c226f583f0cbe80a040e4bb13b2bd14d9ca828).

**Giữ các hệ số vật lý mới trong vòng cân đầu.** Tăng mật độ, rút warning và giảm grip cùng lúc sẽ không biết nguyên nhân game khó hơn hoặc bất công hơn.

## 2. Mục tiêu mới thay thế mục tiêu cũ

| Mục | Mục tiêu cũ trong báo cáo | Mục tiêu mới |
|---|---|---|
|Mua ô tô4 chỗ thật|Khoảng1phút|**20–24giây gameplay hoạt động**, profile trung bình có chủ ý mua|
|Median thời lượng ván|6–7phút|**4phút**, khoảng nghiệm thu thử225–255giây|
|Độ đa dạng|Tăng mật độ/chồng hazard|Tăng **độ phủ các loại đang có**, phân bổ đều hơn và tăng pattern có đánh đổi|
|Baseline|Main khi đó còn noforce|**Main force mới nhất**|

20–24giây là thời điểm giao dịch mua thành công, không chỉ đủ tiền; loại pause/Help/card/shop. Không thêm gate thời gian để giữ người chơi nhanh ở mốc20giây. Người giữW có thể mua sớm hơn, người bỏ lỡ khách/shop có thể muộn hơn.

Median4phút tính cả ngã/hồi phục/coasting/chờ tàu, loại thời gian UI pause. Secret là kết ván thành công, báo riêng với chết. Không dùng timer ép chết ở phút4.

Giữ các yêu cầu trước về công bằng, xe trọng tâm và không thêm mechanic. Mốc đỉnh khoảng2/3stress tiếp tục là đối chiếu cần đo, không tự đẩy đỉnh khó lên chỉ vì thời lượng ván ngắn hơn.

## 3. Vì sao hiện có nhiều chướng ngại ít xuất hiện

Đối chiếu tối thiểu config và generator hiện tại:
- Special đầu1700m, gap1250m. Trên đường thẳng0–3500m chỉ có hai vị trí danh nghĩa:1700/2950m.
- Sáu loại gốc police/militia/jam/accident/train/broken cùng chia lịch này.
- **Jam lại chia ba**: rào/hàng rong/cứu thương. Mỗi biến thể khoảng1/18lần chọn special nếu coi gần đều; trung bình danh nghĩa khoảng22,5km mới có một lần cùng biến thể.
- Shop, junction, Grab và điều kiện quá gần player có thể loại event. Counter đã tăng trước khi reject nên cơ hội bị mất; không tự dời event đó tới vị trí hợp lệ kế tiếp.
- Hazard thường bị loại quanh nhiều corridor. Gió/cargo gắn modulo9 vào lịch chung nên có thể thường xuyên rơi đúng vùng bị loại.
- Sinh cargo source không đồng nghĩa người chơi gặp vật rơi: nguồn phải còn chạy và chưa bị hỏng/thu hồi.

### Kiểm tra lịch danh nghĩa đã chạy

1000seed,0–3500m, không rẽ; chỉ chạy công thức chọn special hiện hành, **chưa trừ reject** và không chạy game engine:

| Loại | Số seed có ít nhất một lần/1000 |
|---|---:|
|Rào|107|
|Hàng rong|114|
|Cứu thương|111|
|Công an|293|
|Dân phòng|301|
|Tàu|304|
|Tai nạn|289|
|Xe chết máy|315|

Đây là **cơ hội được lên lịch**, chưa là được sinh hay người chơi thấy. Ví dụ89%seed không hề lên lịch cứu thương trong3500m, ngay cả trước các bước reject. Vì vậy cảm giác “gần như không xuất hiện” có cơ sở từ lịch sinh, không cần tăng damage để sửa.

Nguồn: [config](https://github.com/hole1981998-gif/Start-Homecoming/blob/b0c226f583f0cbe80a040e4bb13b2bd14d9ca828/src/config.ts), [world](https://github.com/hole1981998-gif/Start-Homecoming/blob/b0c226f583f0cbe80a040e4bb13b2bd14d9ca828/src/world.ts), [special plan](https://github.com/hole1981998-gif/Start-Homecoming/blob/b0c226f583f0cbe80a040e4bb13b2bd14d9ca828/src/special-events.ts), [biến thể jam](https://github.com/hole1981998-gif/Start-Homecoming/blob/b0c226f583f0cbe80a040e4bb13b2bd14d9ca828/src/moving-events.ts).

## 4. Bộ số economy để thử mốc20–24giây

Không tăng tiền nền trở lại để mua xe nhanh; cách đó sẽ làm economy cả ván dư tiền. Điều chỉnh vốn đầu, khách sớm và vị trí shop đầu.

| Tham số | Runtime hiện tại | Candidate mới |
|---|---:|---:|
|Tiền đầu|200|**280**|
|Base money/m|0,50|**0,02**|
|Tiền khách thường/khách/m|0,01|**0,20**|
|Giá car4|800|**300**|
|Khách đầu|260m|**60m**|
|Khách sau đó|Mỗi400m|**Mỗi360m**|
|Shop đầu|600m|**280m**|
|Shop thứ hai|1200m|**1050m**|
|Gap shop sau|600–900m|**720–1080m**, né junction|
|Warning/R reach|≥4s; ±30m|Giữ|

Đây là **candidate**, không phải những số đã được repo áp dụng từ báo cáo trước. Shop280→1050gap770 nằm trong720–1080;1050m không nằm trong corridor giao lộ800/1600m.

Phép tính đường sạch với xe máy:
- Tới khách60m ở14m/s:4,286s.
- Chở một khách tới tâm shop280m ở12m/s:18,333s.
- Tổng **22,619s**.
- Ví tại tâm shop:280+280×0,02+220×0,20 = **329,6**; mua car4 còn29,6.
- Vào vùngR ở250m khoảng**20,119s**; ra vùngR ở310m khoảng25,119s. Nếu tiếp cận đúng phía và bấmR trong phần đầu cửa sổ thì phù hợp20–24s.
- Nếu không đón khách, ví chỉ285,6 ở tâm shop, chưa đủ300. Vì thế vẫn có đánh đổi và cần đo tỷ lệ lỡ khách. Không gọi đây là mốc bảo đảm mọi người.

Rủi ro: khách60m có thể thấy rất sớm do lookahead; cần cue đón đủ sớm trước cửa sổF, card lần đầu pause an toàn. Không tăng tầmF để che lỗi khó tiếp cận. Nếu người mới hay lỡ khách, thử dời khách90m và shop280m riêng; không tự tặng khách hoặc tiền thưởng mới.

Không giảm car4 xuống giá200hoặc tăng initialMoney≥300: như vậy có thể đủ tiền ngay đầu và cơ hội mua phụ thuộc shop hoàn toàn, mất ý nghĩa quyết định đầu ván.

Giữ candidate tài nguyên đã đề xuất trước làm điểm thử, **không áp hết cùng lúc**:
- Xe máy giữ5,5L/70HP/0,0045L/m, pickup3L/16HP.
- Mô tô7,5L/80HP/0,0048, pickup3,4L/18HP.
- Car4 10L/105HP/0,0055, pickup3,6L/24HP.
- Car7 13L/125HP/0,0065, pickup4,2L/28HP.
- Fuel gap480m, repair gap1000m; damage/warning/force giữ nguyên vòng đầu.

Có car4 ở22giây thay gần1phút khiến người chơi được cấp tài nguyên xe mới sớm hơn. Do đó phải đo lại survival; **không suy median4phút bằng lấy kết quả cũ nhân4/6,5**. Chủ yếu rút nhịp tăng khó và tăng các quyết định nguy hiểm trong2–4phút, rồi mới tinh chỉnh hao/hồi.

## 5. Phân bổ chướng ngại cho ván khoảng4phút

### Lịch thử mới

| Mục | Hiện tại | Candidate |
|---|---|---|
|Hazard thường đầu|130m|Giữ130m|
|Gap thường|90→75m tới khoảng10km|**80→70m tới3km**|
|Special đầu|1700m|**600–700m**, sau cửa mua xe đầu|
|Gap giữa nhóm special|1250m|**300–420m**, tùy feasibility|
|Trần curve|Khoảng10km|**3km**, thử nhạy2,5/3,5km|
|Gió/cargo|Mỗi9slot cố định|Cơ hội theo loại, có cooldown và giữ cơ hội bị defer|
|Warnings|3,5s/relative speed|Giữ sàn; phải đủ cho hình xe xoay mới|

Gap300–420là giữa **nhóm special nói chung**, không giữa hai đoàn tàu hay hai nhóm police. Giữ sàn cooldown theo loại đã có trong mục tiêu cũ: police≥1200m, train≥800m, accident≥600m; đo thêm nhịp thực sau reject. Nếu cùng lúc không đủ cửa sổ, dời hoặc bỏ cơ hội chứ không chèn sát player.

Không chỉ đổi eventGap1250→360 trong code: validator hiện bắt≥1200, và các corridor hiện chưa phù hợp. Cần cấu hình riêng khoảng nhóm và cooldown từng loại; thay kiểm tra cũ bằng kiểm tra an toàn thực, không xóa validation để số mới chạy.

### Mục tiêu độ phủ, không ép đủ mọi loại mỗi ván

Trên các lượt đạt ít nhất3km hoặc240s, mục tiêu thử:
- ≥8/11nhóm sau trong≥80%lượt: nước, ổ gà, traffic, gió, đồ rơi, police, militia, tàu, accident, xe chết máy, nhóm rào/hàng rong/cứu thương.
- Trong một ván đủ dài, gặp6–8nhóm special hợp lệ là ứng viên, không cộng chúng vào cùng một cao trào.
- Rào/hàng rong/cứu thương: **mỗi loại được gặp ở45–65%**lượt đủ dài trong vòng đầu, thay khoảng11% cơ hội lên lịch hiện tại.
- Qua3ván đủ dài, xác suất từng loại đã được gặp mục tiêu≥85%. Đây là mục tiêu nghiệm thu, chưa có số đo.

Không ép một người chết sớm phải gặp tàu/tai nạn trước khi họ thua; báo toàn cohort và cohort đủ dài riêng để không giấu sự hiếm.

### Phân bổ khả thi hơn

Tách **tám kết quả cuối** của special: police, militia, train, accident, broken, barrier, vendor, ambulance. Không để ba loại cuối cùng tiếp tục tranh một ôjam rồi mới roll1/3.

Dùng danh sách phân bổ seeded với trọng số/cooldown để tránh loại đang thiếu bị bỏ đói; không lặp cùng loại trong ba nhóm gần nhất nếu còn loại khác hợp lệ. Đây là thay cách chọn spawn hiện hữu, không thêm loại chướng ngại hay unlock.

Khi event bị chặn do shop/junction/Grab, giữ ưu tiên của loại chưa xuất hiện và tìm vị trí hợp lệ phía trước, ví dụ thử lệch40–160m. Không giữ nguyên actor rồi teleport tới người chơi, không reroll RNG mỗi frame và không clear hazard đã có. Nếu không có chỗ, ghi lý do và chờ cơ hội sau; không hy sinh fairness để đủ quota.

Đếm ba tầng riêng: **planned → spawned → encountered**, cùng lý do reject/source cargo hỏng. Encountered cần actor nằm trong vùng có thể đọc/tương tác theo thời gian; không tính entity ở ngoài camera hoặc vừa tạo đã bị thu hồi.

## 6. Pattern có đánh đổi thực

Đề xuất12pattern cấu hình từ cơ chế đang có; mỗi nhóm có mirror trái/phải, chiều dài và phase để tạo biến thể. Không cần loại hazard mới.

| Pattern | Lựa chọnA | Lựa chọnB / đánh đổi |
|---|---|---|
|1. Một làn ngập dài, làn khô có traffic cùng chiều|Đi nước, hao xăng|Luồn/vượt traffic, cần căn lái và chấp nhận rủi ro va|
|2. Hai làn mép ngập, giữa khô có khe traffic|Tiết kiệm xăng ở giữa|Chuyển ra mép sớm để tránh xe, chịu một phần nước|
|3. Nước và ổ gà trên hai hành lang|Trả xăng|Trả HP/tiền nếu chọn ổ gà; luôn còn lựa chọn né cả hai với thao tác khó hơn nếu khả thi|
|4. Đường khô dài hơn về thời gian do traffic, đường nước thoáng|Đi chậm/điều tốc để vượt khe|Đi thoáng hơn nhưng mất fuel; không thêm đường vòng mới|
|5. Pickup phía ngoài vùng nguy hiểm|Bỏ tiếp tế, giữ đường lái an toàn|Đổi làn có tính trước để lấy nguồn; không sinh pickup bắt buộc trong bẫy|
|6. Gió đẩy về phía nước|Chống lái, giữ xăng|Đổi hành lang, có thể chấp nhận tiếp xúc nước ngắn|
|7. Rào hai làn và vùng nước ở lối còn lại|Luồn đúng cửa khô theo thời điểm nếu có|Chấp nhận mất ít xăng; phải đủ budget, không chặn cứng cả3làn|
|8. Hàng rong cắt qua khu nước|Chỉnh tốc/chọn thời điểm tránh người|Lệch ra ngoài để thoát nhanh, chịu nước thay vì ngã|
|9. Cứu thương và khe traffic|Nhường bằng đổi lane sớm|Giảm tốc căn khoảng; không húc bắt buộc vì không còn lối|
|10. Tải thả đồ trên hành lang dễ chạy|Giữ lane đọc vật rơi rồi né|Đổi sớm sang hành lang có nước/traffic nhẹ|
|11. Officer và khách/tiếp tế ở hai phía|Ưu tiên giữ xe/tránh bắt|Bỏ cơ hội thu nhập/tiếp tế; nếu có chuối thì trả một món để giữ cơ hội|
|12. Tàu có bãi chờ an toàn|Phanh dừng chờ, tốn thời gian sống và nhịp tiến|Nitro+Space nếu đã có và hình học đủ, trả item/rủi ro đáp|

Không gọi một phía “an toàn và luôn lời hơn” là lựa chọn cân bằng. Log kết quả để phát hiện pattern chỉ có một đường hợp lý. Tỷ lệ chọn lệch80/20 không tự là lỗi nếu tài nguyên khác nhau; so trong cùng trạng thái fuel/HP/tải/item trước.

Tàu, accident có hậu quả terminal riêng: **không dùng chúng như khoản HP bắt buộc phải trả**. Rào/hàng rong hiện có thể gây ngã nhưng không nhất thiết trừ HP; không tự gán damage mới chỉ để tạo tradeoff. S chỉ dừng hẳn trong ngữ cảnh tàu hiện có; với các nhóm khác là điều chỉnh tốc độ, không giả định có thể đỗ chờ vô hạn.

Ngập hai mép, overlap có chủ đích và phân bổ nhiều lớp cần generator hỗ trợ dữ liệu; không thể chỉ sửa một hệ sốdensity. Giữ footprint xoay/đầu–rơ-moóc trong kiểm tra, đặc biệt car7 mới; không lấy lane trống ở một frame làm bằng chứng.

### Nhịp các pattern

- 0–25s: hướng khách/shop, tối đa một thử thách dễ đọc; không police/train cắt ngang mua xe.
- 25–70s: pattern1lớp + một vài cặp, giới thiệu sự đa dạng sớm.
- 70–150s: cặp hazard/debuff và cơ hội tiếp tế, tăng quyết định đổi lane/tốc độ.
- 150–240s: pattern phối hợp2–3thành phần trong ngân sách; cao trào8–10s, sau đó≥3s nhịp thở.
- Chỉ số difficulty vẫn phụ thuộc distance; các dải giây này là mục tiêu quan sát để hiệu chỉnh, không phải kịch bản spawn cưỡng bức theo đồng hồ.

Trọng số chọn pattern ban đầu:25%đơn,55%cặp,20%phối hợp3thành phần sau đoạn làm quen. “Ba thành phần” không có nghĩa ba nguy hiểm nặng; có thể là nước+traffic+pickup. Cùng một pattern không lặp trong ba lần chọn gần nhất; không dựng chuỗi vừa đổi trái lại ép phải trong cửa sổ phản ứng chưa kịp hoàn thành.

## 7. Cách thử để đạt4phút

1. **Baseline mới là main force**, cùng snapshot/input/seed; backupnoforce chỉ phục vụ chẩn đoán vật lý. Không dùng số simulation cũ làm kết quả mới.
2. VòngA chỉ economy/khách/shop: đo giao dịch mua20–24s. Báo P10/median/P90, tỷ lệ mua≤24/≤30s, lượt chết/lỡ khách/lỡ shop; mục tiêu ban đầu≥70% profile trung bình có chủ ý mua ở≤30s.
3. VòngB giữ lực và damage, sửa phân bổ/độ phủ event. Đo tần suất thực theo loại/km và/phút, planned/spawned/encountered, không chỉ số lượt thua.
4. VòngC thêm pattern có đánh đổi, rồi giảm hồi/tank từng nhóm nếu ván còn dài. Không tăng cảdensity, damage, force và hao xăng cùng lúc.
5. 300–1000seed ×3profile phản ứng hữu hạn, đủ4xe trọng tâm. Chạy đến terminal hoặc≥720s; các lượt còn sống phải báo censored. Nếu chưa hơn50%kết ván thì chưa có median chắc chắn.
6. Mục tiêu median240s, dải225–255s cho phép thử đầu; theo dõi Q25≈150–195s, Q75≈300–360s như mục tiêu phụ, không ép mọi lượt vào đó.
7. Người thật sau2–3ván làm quen; tối thiểu12–20người, đảo thứ tự candidate/baseline. Báo median theo người/nhóm xe, vui và công bằng; không chỉ tăng tử vong.
8. Fail fairness nếu có màn không có input khả thi, nguồn bắt buộc không tới được, rào khóa lối, hoặc va quệt do lệch collider không đọc được. Sửa bố cục/collider trước khi đổi HP.
9. Xăng traffic vẫn theo lựa chọn trước của người dùng: **so bật/tắt rồi quyết định**; không tự tắt. Tách thí nghiệm này khỏi tăng density để biết nguồn gây kẹt/tai nạn.

Cao trào khoảng2/3stress chỉ kiểm sau khi loop4phút và fairness ổn. Đạt4phút không tự chứng minh đúng mức2/3; không biến snapshotstress bất khả thi thành mẫu spawn game chính.

## 8. Bổ sung QTE rẽ trái/phải theo kích thước và độ nặng xe

**Yêu cầu đã chốt trong hội thoại:** xe càng lớn/nặng có cửa sổ nhận Q/E ngắn hơn xe nhỏ. Các xe bắt đầu QTE ở khoảng cùng giai đoạn tiếp cận ngã rẽ; sự khác biệt chủ yếu đến từ việc xe lớn phải chốt hướng sớm hơn. Các ví dụ xe máy30→3m và container25→15m chỉ minh họa, chưa phải thông số đã cân bằng. Trái và phải dùng cùng quy tắc, không tăng phạt vì chọn một bên.

### Đối chiếu implementation hiện có

Ở snapshot `b0c226f`, `junction()` có windowSeconds1,8→1,2 theo quãng đường; `canChoose()` nhận Q/E khi còn cách ngã rẽ không quá max(speed,8)×windowSeconds và chưa tới tâm ngã rẽ. Hàm này chưa nhận loại xe, chưa có ngưỡng đóng sớm riêng cho xe lớn. Không coi bảng penalty chiều dài trong tài liệu cũ là runtime đã có.

Nguồn: [route.ts](https://github.com/hole1981998-gif/Start-Homecoming/blob/b0c226f583f0cbe80a040e4bb13b2bd14d9ca828/src/route.ts). Cung rẽ hiện bắt đầu trước tâm giao lộ8m; vì vậy cho chốt hướng ở3m có thể đã quá muộn với hình học hiện hành. Không chép mốc ví dụ này thẳng vào code.

### Quy tắc đề xuất

- Tách **cảnh báo trước**, **mở nhận Q/E**, **đóng nhận Q/E** và **xe bắt đầu ôm cua**. Cảnh báo vẫn xuất hiện sớm, không chờ QTE mới cho biết có ngã rẽ.
- Với cùng tốc độ và cùng giao lộ, ưu tiên một mốc mở chung. Xe nhỏ được quyết định muộn hơn; xe lớn/nặng cần chốt khi còn xa hơn. Không làm xe lớn khó bằng cách mở QTE trễ hẳn hoặc báo ngã rẽ muộn.
- Dùng nhóm thông số riêng theo loại xe, dựa trên chiều dài/khối lượng quy ước/đặc tính quét thân đã có; không tự nhân thêm penalty theo khách, tank hay HP. Giữ thứ tự độ khó theo nhóm xe, không dùng tốc độ riêng từng xe để suy ra xe nào “nặng”.
- Mốc theo mét cần điều chỉnh theo tốc độ tiếp cận:30m chỉ còn khoảng1,07s ở28m/s nhưng3,75s ở8m/s. Cùng mốc30m cố định không bảo đảm cùng thời gian phản ứng.
- Sau khi QTE mở, giữ các mốc hình học đã chốt cho giao lộ đó; không co giãn/reroll chúng mỗi frame theo tốc độ làm thanh tiến trình bật lại. Phanh có thể thay thời gian thực đi hết cửa sổ, nhưng không mở lại cửa sổ đã đóng. UI dùng cùng trạng thái simulation; nếu hiện giây còn lại thì đó là ước lượng theo tốc độ, không có một timer ẩn khác với lúc input hết hiệu lực.
- Q/E chốt một lần. Bấm sớm trước cửa sổ hoặc sau khi đóng không được nhận; khi đã chọn hợp lệ, cửa sổ hết không hủy lựa chọn. Bỏ lỡ vẫn đi thẳng nếu thông hoặc chịu hậu quả vật cản hiện hữu nếu buộc rẽ; không thêm phạt mới.

### Bảng số khởi đầu để thử, chưa chốt

Mở chung tương đương khoảng2,4s trước tâm ngã rẽ ở tốc độ tiếp cận tham chiếu. Đóng sớm theo nhóm xe, luôn trước khi bắt đầu cung rẽ và có margin. Bảng dưới chỉ so **cùng tốc độ14m/s**, không dùng cruise riêng từng xe:

| Xe | Mở khi còn | Đóng khi còn | Thời gian nhận Q/E xấp xỉ ở14m/s |
|---|---:|---:|---:|
|Xe máy / mô tô|33,6m|9,0m|1,76s|
|Ba gác|33,6m|10,5m|1,65s|
|Ô tô4 chỗ|33,6m|11,2m|1,60s|
|Ô tô7 chỗ|33,6m|13,3m|1,45s|
|Xe tải|33,6m|15,4m|1,30s|
|Xe buýt|33,6m|16,1m|1,25s|
|Container|33,6m|18,2m|1,10s|

Candidate tính mốc: openDistance=2,4×vRef; closeDistance=max(9m, closeLeadSeconds[xe]×vRef), với closeLead lần lượt0,60/0,60/0,75/0,80/0,95/1,10/1,15/1,30s theo thứ tự xe máy/mô tô/ba gác/car4/car7/tải/buýt/container. 9m là mốc thử từ cung rẽ8m cộng margin1m, không phải bảo đảm đủ cho collider xoay của mọi xe.

Phải kiểm lại trước khi sử dụng ở tốc độ khác: tăng tốc/boost sau khi mở có thể rút cửa sổ thực tế; ở tốc độ thấp, ngưỡng9m có thể lấn hết cửa sổ. Nếu cửa sổ khả dụng dưới sàn thử0,95s hoặc không đủ thời gian chuyển vào cung, **mở sớm hơn** để giữ margin đóng, không ép tất cả xe về0,95s và xóa khác biệt xe. Đo cả cruise/W/S, nitro, quá tải và thân quét. Các thời gian trong bảng là phép chia quãng đường ở tốc độ hằng, chưa phải kết quả engine hoặc playtest.

Vòng đầu chỉ thử sự khác biệt theo xe. Không cộng ngay đường cong rút thêm QTE1,8→1,2s cũ vào candidate này: như vậy sẽ phạt hai lần và có thể làm container không còn cửa sổ. Nếu sau đó cần QTE khó dần theo distance, phải hiệu chỉnh từ cùng bộ mốc mới, giữ thứ tự giữa xe và sàn phản ứng.

### Tiêu chí kiểm tra trước áp dụng

1. Cùng tốc độ: các xe mở gần cùng giai đoạn, xe lớn đóng sớm hơn và thời gian nhận input ngắn hơn rõ ràng.
2. Nhấn trước mở, đúng mở, sát đóng, đúng đóng, sau đóng; test cả Q/E và chốt một lần. Dùng một quy ước biên rõ ràng trong UI và simulation.
3. Phanh/tăng tốc/boost không làm cửa sổ đã đóng mở lại; pause không làm tiến QTE. Đổi xe bằng Tab không được cấp một cửa sổ mới hoặc kéo lại tiến trình; policy chi tiết cần giữ nhất quán với luật đổi xe hiện hữu.
4. Chốt hợp lệ cuối cửa sổ vẫn ôm cua đúng, không dịch chuyển tức thì hoặc xuyên hazard. Kiểm car7 quét đuôi và cả đầu kéo/rơ-moóc container, ở hai hướng và sát mép.
5. Đo tỷ lệ bỏ lỡ theo xe, tốc độ và nguyên nhân. Cửa sổ ngắn của xe lớn là đánh đổi chủ ý; va vì không nhìn được cue hoặc collider lệch là lỗi cần sửa, không phải tăng độ khó hợp lệ.
6. Chỉ cập nhật kế hoạch trong lượt này; chưa sửa QTE runtime hoặc design trong GitHub.

## 9. Trạng thái bàn giao

- Đã kiểm tra design diff mới, reviewforce/car7/cảnh quan và nguồn spawn tối thiểu.
- Đã chạy kiểm lịch danh nghĩa1000seed, kết quả ở mục3. Không có simulation engine hoặc manual gameplay mới.
- Phép tính22,619s là ca lý thuyết không hazard; chưa là kết quả chơi thực.
- Chưa xác nhận median4phút hay độ phủ45–65%loại hiếm; đó là mục tiêu để thử.
- **Không sửa repo, commit, push, PR hoặc merge.** Chỉ cập nhật tài liệu cục bộ.

