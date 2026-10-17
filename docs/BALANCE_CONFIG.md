# Đường Về Nhà — Balance Config

## Quy ước

**TẤT CẢ con số dưới đây là TẠM, chưa được playtest**, trừ các ràng buộc đã chốt: 3 lane, khung 9:16, tối đa 2 xe, chiều rộng xe < 1,5 lane, xe secret 4 chỗ có 1 tài xế + 3 khách, chuỗi secret 4 bước. Không coi bảng này là code config đã chạy. Dùng một nguồn config TypeScript có schema/range validation khi triển khai; không rải magic number trong systems. Đơn vị: m, s, m/s, L (xăng quy ước), HP, đồng game. Đây không phải mô phỏng chi phí hay luật giao thông thực tế.

## Cơ bản và công thức

| Key đề xuất | TẠM | Ý nghĩa |
|---|---:|---|
| laneWidth | 3.2 m | Đường rộng 9.6 m |
| coastDistance | 25 m | Chung mọi xe sau fuel = 0 |
| initialMoney | 200 | Tiền đầu ván |
| initialVehicle | xe máy | 1 xe, đầy xăng và độ bền |
| scorePerMeter | 1 | Điểm cơ bản |
| riderScoreBonus | 0.04 | Mỗi khách +4% điểm theo quãng đường |
| baseMoneyPerMeter | 0.50 | Thử theo mục tiêu mới 1–1,5 phút; thay 0.15, giữ tiền đầu 200 và ô tô 800 |
| riderMoneyPerMeter | 0.01 | Mỗi khách thêm thu nhập tuyến tính |
| overloadSpeedPenalty | 0.08 | Giảm tốc độ tối đa mỗi người quá tải |
| overloadFuelPenalty | 0.15 | Tăng tiêu hao mỗi người quá tải |
| minSpeedFactor | 0.40 | Sàn hệ số tốc độ do quá tải |
| maxFuelLoadFactor | 3.0 | Trần hệ số tiêu hao do quá tải |
| replacementProtection | 1.5 s | Chống va chạm lặp ngay khi thay xe |

Cho `n = riders`, `o = max(0, n + 1 - capacity)`, `ds = quãng đường tiến hợp lệ`:

```text
deltaScore = ds * scorePerMeter * (1 + n * riderScoreBonus)
deltaMoney = ds * (baseMoneyPerMeter + n * riderMoneyPerMeter)
speedFactor = max(minSpeedFactor, 1 - o * overloadSpeedPenalty)
effectiveMaxSpeed = upgradedMaxSpeed * speedFactor
effectiveMinSpeed = min(baseMinSpeed, effectiveMaxSpeed)
passengerCruiseSpeed = max(riderCruiseFloorSpeed, baseCruiseSpeed - n * cruiseLossPerRider)
effectiveCruiseSpeed = clamp(passengerCruiseSpeed, effectiveMinSpeed, effectiveMaxSpeed)
fuelUsed = ds * upgradedFuelPerMeter * min(maxFuelLoadFactor, 1 + o * overloadFuelPenalty)
```

Tích lũy tiền/điểm bằng giá trị chính xác nội bộ, chỉ làm tròn để hiển thị hoặc khi ghi kết quả; không làm tròn mỗi frame. Tốc độ tối thiểu thực tế không cao hơn effectiveMaxSpeed. TẠM: không tiêu hao theo thời gian khi pause, và chỉ tính fuel theo distance trong gameplay. Mọi clamp là lựa chọn cân bằng cần thử.

## Xe — toàn bộ thông số TẠM

Capacity tính cả tài xế. Width theo số lane; length tính m. Giá xe trong ván. Không có loại nào bị khóa theo tiến trình.

| Loại | Capacity | Min/Cruise/Max m/s | Tank L | HP | L/m | Width lane | Length m | Giá |
|---|---:|---|---:|---:|---:|---:|---:|---:|
| Xe máy | 2 | 8 / 14 / 20 | 8 | 70 | 0.0030 | 0.28 | 2.0 | 250 |
| Mô tô | 2 | 9 / 18.5 / 28 | 10 | 85 | 0.0040 | 0.30 | 2.2 | 600 |
| Ô tô 4 chỗ | 4 | 8 / 16 / 24 | 16 | 120 | 0.0050 | 0.58 | 4.2 | 800 |
| Ô tô 7 chỗ | 7 | 8 / 15 / 22 | 20 | 145 | 0.0060 | 0.65 | 4.8 | 1200 |
| Ba gác | 4 | 6 / 11.5 / 17 | 12 | 100 | 0.0045 | 0.55 | 3.2 | 450 |
| Xe buýt | 25 | 6 / 12.5 / 19 | 35 | 210 | 0.0100 | 0.85 | 10.0 | 2400 |
| Xe tải | 3 | 6 / 13 / 20 | 30 | 230 | 0.0090 | 0.85 | 7.0 | 1800 |
| Container | 2 | 5 / 11.5 / 18 | 45 | 300 | 0.0120 | 0.90 | 15.0 | 3000 |

Sức chứa ba gác/xe tải/container là quy ước game tạm, không phải số người được phép chở ngoài đời. Xe rộng nhất vẫn nhỏ hơn 1,5 lane. Độ khó rẽ dựa chủ yếu vào chiều dài; chiều rộng phải được dùng trong kiểm tra đường đi khả thi.

### Auto-cruise — cơ chế ĐÃ CHỐT, thông số TẠM

Mỗi loại xe có cruiseSpeed cơ sở khi chỉ có tài xế; bảng tạm lấy trung điểm Min/Max làm điểm khởi đầu, không chốt công thức trung điểm cho thiết kế cuối. Cruise không phải tốc độ trung bình thống kê của ván. Thả W/S phải tự hồi về mốc hiệu dụng từ cả hai phía; muốn duy trì nhanh/chậm hơn phải giữ W/S.

**ĐÃ CHỐT:** mỗi khách đi nhờ thêm làm giảm mốc trung vị trước khi chạm sàn, kể cả chưa quá tải; mức giảm và ngưỡng thấp nhất tùy xe/tình huống. **ĐỀ XUẤT công thức:** tuyến tính có sàn như ở trên; đây là một hàm giảm có kiểm soát để thử, chưa khóa đường cong cuối. Cấu hình theo từng VehicleDefinition:

| Key đề xuất | Giá trị | Đơn vị / ràng buộc |
|---|---|---|
| cruiseLossPerRider | Chưa gán số; cần thử từng xe | m/s cho mỗi khách, hữu hạn và > 0 |
| riderCruiseFloorSpeed | Chưa gán số; cần thử từng xe | m/s, baseMinSpeed <= floor < baseCruiseSpeed |

Sàn bằng min cho phép xe giảm tới min khi đủ khách; sàn cao hơn min làm xe dừng giảm trước min nếu không có giới hạn khác. Khi quá tải ép max hiệu dụng thấp hơn sàn cruise, clamp theo khoảng tốc độ hiệu dụng vẫn có ưu tiên. Không dùng cùng một mức giảm tuyệt đối cho mọi loại xe theo mặc định: một khách trên xe máy và một khách trên xe buýt cần được thử riêng. `n` chỉ đếm khách hiện tại, không tính tài xế hay tổng lượt đón; cho khách xuống/đổi xe phải tính lại. Không nhân thêm speedFactor vào passengerCruiseSpeed; phạt quá tải đã tác động qua effectiveMaxSpeed để tránh phạt cruise hai lần.

| Key đề xuất | TẠM | Đơn vị / ý nghĩa |
|---|---:|---|
| returnAcceleration | 3 | m/s², tự tăng tốc khi dưới effectiveCruiseSpeed |
| returnDeceleration | 4 | m/s², tự giảm tốc khi trên effectiveCruiseSpeed |

Hai rate trên tạm dùng chung; cruise thuộc từng VehicleDefinition khi có hệ thống nhiều xe. Có thể đề xuất rate riêng từng xe sau playtest. Với xe máy chỉ có tài xế, 20 → 14 m/s mất 1,5 s; 8 → 14 mất 2 s theo các số tạm này. **P1.2 đã triển khai và chạy simulation cho trường hợp xe máy này**; không suy ra các xe/tải khách khác đã được kiểm chứng hoặc số đã khóa cân bằng. Gia tốc khi giữ W và lực hãm S dùng config điều khiển riêng, không suy ra từ return rates. Nâng cấp động cơ hiện chỉ tăng max theo mô tả cũ; chưa tăng baseCruiseSpeed. Khi hết xăng, auto-cruise không được tự cấp lực kéo (kiểm tra trong prototype có fuel/coasting).

### Mục tiêu economy đã chốt: ô tô đầu tiên sau 1–1,5 phút

Mục tiêu là cơ hội mua xe trong lượt chơi đại diện, tính thời gian gameplay hoạt động, không tính pause/Help/shop; không phải bảo đảm mọi seed. Các giá/thu nhập trong bảng vẫn TẠM và chưa được chỉnh để khẳng định đã đạt mục tiêu.

Theo yêu cầu mới, thử **0,50 tiền/m** thay 0,15, giữ tiền đầu 200 và ô tô 800. Cần kiếm thêm 600 tiền, tương đương 1.200 m nếu chưa mất tiền: ~85,7 giây ở cruise 14 m/s, ~60 giây ở max 20 m/s, ~150 giây ở min 8 m/s. Chuyển tiếp tốc độ và va chạm có thể làm khác số lý thuyết. Giữ S liên tục là lượt đối chiếu, không buộc mọi chiến thuật đều đạt 60–90 giây. P2 chỉ đo đủ tiền, chưa có mua xe/shop. Mốc cũ 3–5 phút và thu nhập 0,15 thuộc lịch sử P2.0. Đây là số thử, chưa khóa economy các xe sau/chi phí shop.

### Cấu hình thử P2 — không thay thế director P3

P2 giữ lái P1.2, xe máy 8 L / 70 HP, 0,003 L/m; nước 0,8 L/s, ổ gà 12 HP và tối đa 10 tiền, xe 20 HP/cooldown 1 s, trôi 25 m sau cạn. TẠM: lực cản khi trôi 3 m/s², tốc độ trôi sàn 2 m/s để hoàn tất quãng trôi hữu hạn; W không cấp lực kéo khi cạn, S có thể hãm. Nhặt xăng tới +8 L, hộp sửa tới +40 HP trực tiếp trên đường; kho R/shop ở prototype sau.

Đường thử seeded: hazard đầu ở 130 m, cách 90 m, chu kỳ nước/ổ gà/xe; nước và ổ gà chỉ một lane có seed, xe chạy 6 m/s ở giữa. Giữ hai biên làm lối vượt xe; chưa tăng difficulty hoặc sinh chắn cả đường. Lookahead 140 m, cảnh báo ít nhất 60 m hoặc 3,5 s theo tốc độ (lấy lớn hơn). Một bình xăng mỗi 450 m, luân phiên hai bên, hộp sửa đầu 650 m rồi mỗi 900 m. Thẻ lần đầu pause trước hazard, timeout 8 s; focus nền giữ pause. Các số này đều TẠM, chờ chơi thử.

## Nâng cấp, vật phẩm và cửa hàng — TẠM

| Hạng mục | Giá | Hiệu ứng |
|---|---:|---|
| Động cơ (3 cấp) | 200 / 400 / 700 | +8% max speed mỗi cấp, cộng từ base |
| Bình xăng (3 cấp) | 180 / 350 / 600 | +15% tank mỗi cấp; không tự bơm đầy phần tăng |
| Gia cố (3 cấp) | 180 / 350 / 600 | +15% max HP mỗi cấp; không tự sửa phần tăng |
| Tiết kiệm xăng (3 cấp) | 220 / 420 / 750 | -8% tiêu hao base mỗi cấp |
| Bơm xăng trực tiếp | 60 | +8 L, clamp tank |
| Sửa trực tiếp | 70 | +40 HP, clamp max |
| Gói xăng mang theo | 75 | R: +8 L cho xe đang chạy |
| Bộ sửa mang theo | 85 | R: +40 HP cho xe đang chạy |
| Nitro | 120 | Space tiêu 1 gói, tối đa giữ 3 |

Đề xuất inventory vật phẩm R tối đa 3, chọn slot trong Tab; nitro dùng kho riêng. Nitro: bay 1.6 s, tăng tốc 30% trong lúc bay, cooldown 2 s; đường bay và đoàn tàu phải được kiểm tra theo xe dài nhất. Không bật bất tử toàn ván khi đang nhảy. Không thưởng tiền chỉ vì dùng item.

## Nguy hiểm và tiền phạt — TẠM

| Sự kiện | Giá trị khởi điểm |
|---|---|
| Nước | 0.8 L/giây tiếp xúc, cộng tiêu hao chạy bình thường |
| Ổ gà / ổ voi | 12 / 30 HP, mất tối đa 10 / 30 tiền đang có |
| Va xe di chuyển | 20 HP; cooldown cùng collider 1 s |
| Xe chết máy | +1 khách; 25% có 1 item; một lần/entity |
| Công an | Phạt cố định 300 + tịch thu xe đang chạy |
| Dân phòng | Phạt cố định 100; không tịch thu |
| Tai nạn | HP xe hiện tại = 0, trừ khi đủ secret step 4 |
| Tàu | Kết ván ngay khi va chạm |

Giá trị tiền phạt là tạm nhưng tính cố định là đã chốt. Chính sách thiếu tiền công an đề xuất: lấy số dư tới 0, tịch thu, xe dự phòng còn 50% **xăng hiện có**, tự thay; không có xe hợp lệ thì thua. Dân phòng thiếu tiền lấy tới 0 và tiếp tục. Không dùng cả “thua ngay” lẫn “mất nửa xăng” một cách ngẫu nhiên.

## Độ khó và RNG có kiểm soát — TẠM

```text
difficulty = clamp(distance / 10000, 0, 1)
spawnGapSeconds = lerp(4.0, 2.0, difficulty)
warningSeconds = lerp(3.0, 2.0, difficulty)
qteSeconds = max(0.9, lerp(1.8, 1.2, difficulty) - lengthPenalty)
lengthPenalty = clamp((vehicleLength - 4.2) * 0.025, 0, 0.3)
```

- Cửa hàng cách nhau ngẫu nhiên 600–900 m; báo trước ít nhất 4 s.
- Một nguồn xăng miễn phí có thể tiếp cận mỗi tối đa 500 m; nếu xe tiêu hao lớn cần bảo đảm theo tầm chạy còn lại chứ không chỉ mốc 500 m.
- Tối đa 2 nhóm nguy hiểm nặng liên tiếp; sau đó có ít nhất 3 s hành lang an toàn.
- Cooldown công an 1200 m, tàu 800 m, tai nạn 600 m; không chồng các event bắt buộc bất khả thi.
- Trọng số vật phẩm: xăng 45, sửa 35, nitro 20; chuẩn hóa khi roll, có pity hỗ trợ tài nguyên thấp. Pity không đảm bảo thắng và không cắt đường tiếp cận.
- Mọi thời gian phản ứng là sàn sau khi xét tốc độ/chiều dài; director phải nới khoảng cách hoặc bỏ mẫu nếu không thể đi qua.

## Cần kiểm chứng trước khóa cân bằng

Đo thời lượng ván, khoảng cách đạt tiền mua ô tô 4 chỗ, số lần tiếp tế, tỷ lệ chết theo nguyên nhân, tỷ lệ thất bại QTE theo xe, số seed bất khả thi và tỷ lệ đạt secret. Thử tải 1 người, đúng tải và quá tải; thử xe dài trên mọi mẫu giao lộ. Không tăng difficulty bằng tăng tiền phạt. Ghi seed/config version và kết quả thực, điều chỉnh một nhóm biến mỗi lần; chưa có dữ liệu đo ở bản tài liệu này.

Riêng passenger cruise: thử từng n từ 0 khách tới đúng tải, quá tải và tới sàn; kiểm tra min <= effectiveCruise <= max, tăng n không tăng cruise khi giữ nguyên xe/tình huống, bỏ khách không làm giảm cruise. So sánh xe máy/ô tô/buýt/container và đổi xe giữ khách. Đo tiền ròng/phút, quãng chạy mỗi bình và thời gian mua xe đầu tiên ở cruise/W/S; xác minh còn nhiều lựa chọn chở khách có ý nghĩa, vẫn phục vụ mục tiêu 1–1,5 phút. Chưa gán các hệ số mới hoặc sửa income/giá cho tới vòng cân bằng triển khai.

## Thử nghiệm nhịp sau feedback P2 — CHƯA ÁP DỤNG

Chi tiết [DESIGN_UPDATE_IMMERSION_TRAFFIC.md](DESIGN_UPDATE_IMMERSION_TRAFFIC.md). Baseline gap 90 m (~6,43 s cruise / 4,5 s max với hazard tĩnh); đề xuất thử riêng 75 m (~5,36 / 3,75 s), rồi 70 m (5 / 3,5 s). Giữ tốc độ, damage, 0,50 tiền/m, tiếp tế và warning >=3,5 s trong phép so sánh. Gap không tự chứng minh đường khả thi; xét footprint, vị trí ngang, hazard cũ và tiếp tế. Traffic ngược chiều cần warning theo relative speed.

Size/length hazard và HP/damage từng loại traffic chưa gán số. Nước dài dùng exposure time và ngân sách xăng hiện có; ổ gà dài một hit/entity; không tự nhân damage theo size hoặc mỗi frame. Chặn cứng 3 lane cần phương án khả dụng; nếu không thì loại mẫu. Húc phá không thưởng tiền/điểm riêng, có chi phí HP/đà/sửa cần thử; không đổi thu nhập bù ngầm va chạm tăng.

**P3A cập nhật số thử đã áp dụng:** `src/config.ts` có bốn biến thể nước (2,4×4; 3,2×7; 3,2×14; 5,7×9 m) và ổ gà (1,1×1,2; 1,5×1,8; 2,3×4; 5,7×5 m). Bản rộng 5,7 m chiếm hai làn, luôn để một làn biên; director bỏ mẫu nếu xe cứng cùng lúc khóa làn còn lại. Traffic vẫn rộng 1,9 dài 3,6 m, tốc độ độ lớn 6 m/s: làn trái −6, phải +6, giữa chọn dấu seeded. Warning có sàn 60 m và thêm cửa sổ 3,5 s theo tốc độ khép khoảng cách. Đây là số tạm P3A; câu “chưa gán số” bên trên là trạng thái trước vòng thử. HP/damage theo **loại** traffic và húc phá vẫn chưa có (P4.1); gap 75/70 m và mẫu cứng 3 lane vẫn chưa áp dụng.

**Vòng thử tiếp theo theo feedback P3A (config `p3a-crash-hazards-2`):** hao xăng nền 0,0038 L/m (+26,7% từ 0,003); bình 8 L, nhặt tối đa +8 L và khoảng tiếp tế 450 m giữ nguyên. Nước/ổ gà thêm bản rộng 5,7×24 m, nước 9,6×30 m và ổ gà 9,6×18 m. Ổ gà lần đầu chạm lấy 6 HP và tối đa 10 tiền; trong lúc còn tiếp xúc lấy thêm 12 HP/s. Xe giao thông lấy 20 HP đúng một lần mỗi entity, làm tài xế ngã 0,8 s rồi quay lại trong 1,8 s; xe dừng 0 và sau đó tự tăng tốc với rate hồi hiện có, W dùng gia tốc chủ động. Thời gian tài xế văng/quay lại miễn nhiễm damage/debuff. Mẫu phủ ba làn chỉ sinh khi xăng/HP hiện có đủ chi phí ước lượng tới và qua đoạn ở min 8 m/s cộng dự phòng 1 L hoặc 10 HP; thiếu thì thu về hai làn. Các số này TẠM, cần playtest cảm giác thiếu xăng; vẫn giữ mục tiêu 800 tiền sau 1–1,5 phút ở lượt đại diện, chưa đổi thu nhập/giá hoặc difficulty curve.

**Vòng thử hiện tại (`p3a-fuel-crash-slide-3`):** xe máy bình 5,5 L thay 8 L; hao nền 0,0045 L/m thay 0,0038; bình nhặt tối đa +5,5 L, vẫn cách 450 m. Mảng nước phủ ba làn chỉ sinh nếu còn đủ chi phí dự kiến cộng 0,5 L dự phòng (trước là 1 L), vì bình xe máy nhỏ hơn; nếu không thì chuyển thành hai làn. Va xe: xe trôi với gia tốc hãm 8 m/s², tại cruise 14 m/s trôi khoảng 12,25 m, tại max 20 m/s trôi 25 m. Xe trượt lệch tối đa 1,8 m để thấy rõ sau va chạm. Tài xế văng tiến với tốc độ đầu bằng 1,5 lần tốc độ va chạm trong 0,8 s, lệch bên tối đa 2,5 m rồi quay lại trong 1,8 s. Chỉ hồi tăng tốc sau khi đã dừng và tài xế đã về. Fuel/damage không phát sinh trong pha bảo vệ; distance vẫn tăng nhưng score/money không tăng. Đây đều là số tạm của xe máy; ô tô, mô tô, xe buýt, xe tải và các xe khác phải có bình/mức hao riêng theo `VehicleDefinition` khi được triển khai, cùng mô phỏng khả năng tới tiếp tế và economy riêng.

**Yêu cầu cân bằng tiếp theo — CHƯA ÁP DỤNG:** bình xăng nhặt hiện tối đa +5,5 L, bằng dung tích xe máy; hộp sửa hiện tối đa +40 HP trên 70 HP. Cả hai hồi quá nhiều theo cảm nhận chơi thử, cần giảm độc lập trong một vòng thử sau. Chọn lượng hồi theo từng `VehicleDefinition`, không mặc định một món lấp đầy bình hay khôi phục phần lớn HP; chưa khóa giá trị mới khi chưa mô phỏng. Đo phân bố xăng/HP trước và sau nhặt, tỷ lệ chết vì cạn xăng/hỏng xe, số lần buộc tìm nguồn tiếp tế, quãng đường an toàn sau khi nhặt và thời gian mua ô tô đầu ở cruise/W/S trên nhiều seed. Bảo đảm mọi đoạn ba làn bắt buộc vẫn có thể chịu được theo tài nguyên hiện có hoặc có nhánh tránh, kể cả sau khi giảm hồi.

**Traffic P4.1–P4.2 — CHƯA ÁP DỤNG:** mỗi loại xe giao thông cần HP và sát thương va chạm riêng; traffic mất HP khi tiếp xúc ổ gà dài theo thời gian, ngoài damage khi bị người chơi húc. Chọn HP/damage để có xe chịu được và xe có thể bị phá bởi môi trường; không đặt toàn bộ loại xe về cùng một ngưỡng. Xe HP=0 chỉ tạo hành khách một lần, bên cạnh nơi hỏng và trong phạm vi có thể tới đón; số khách không vượt quá số người trên xe/giới hạn cân bằng. Đo số xe hỏng theo từng nguyên nhân, số khách sinh/được đón, thu nhập tăng thêm và tần suất farm qua nhiều seed. Khách chỉ tăng điểm/tiền khi đã được đón và xe thực sự di chuyển, không thưởng ngay tại lúc xe hỏng.

**P3B bản thử (`p3b-junctions-1`):** giao lộ đầu 800 m, sau đó mỗi 800 m; giao lộ đầu luôn có đường thẳng, các giao lộ sau có thể bị chặn theo seed. Cửa sổ Q/E từ 1,8 s giảm tuyến tính tới 1,2 s ở khoảng 10 km, sàn 0,9 s; cue báo trước ít nhất khoảng 4 s. Bỏ lỡ khi đường thẳng bị chặn gây 20 HP và trạng thái ngã/trôi hiện có, đúng một lần/giao lộ. Vùng 60 m mỗi phía giao lộ bỏ hazard để tránh chồng thao tác. Gap hazard từ 90 m giảm dần về 75 m trong khoảng 10 km; nguồn xăng/sửa, lượng hồi, giá và thu nhập giữ như P3A để đo riêng nhịp đường. Những số này là TẠM, không coi là difficulty đã cân bằng. Lần sau đo tỷ lệ chọn rẽ thành công/bỏ lỡ, tài nguyên sau nhiều giao lộ và cảm giác điều khiển của từng xe dài.

**P4A bản thử (`p4a-passengers-1`) — tất cả số sau là TẠM:** người chờ đi nhờ đầu ở 260 m, tiếp theo mỗi 400 m, chọn bên đường theo seed mà không tiêu RNG hazard. F đón trong phạm vi dọc ±12 m, ngang ±1,8 m; không tự đón khi chạm. Xe máy 2 chỗ tính cả tài xế, trần kỹ thuật 6 khách, vẫn cho quá tải. Mỗi khách làm cruise giảm 2 m/s tới sàn 8 m/s; quá tải giảm max 8% và tăng hao xăng theo mét 15% mỗi người, có trần hệ số tốc độ 0,4 và hao xăng 3. Điểm mỗi mét tăng 4%/khách, tiền thêm 0,01/khách/m. Tài xế ngã/văng 0,8 s, nằm lại 0,5 s rồi quay về trong 1,8 s; vẫn miễn hậu quả toàn chuỗi. P4A chưa có định nghĩa các loại xe khác, garage hay shop. Cần đánh giá tiền/điểm **theo phút** và áp lực xăng trước khi khóa số: người chở khách đi chậm hơn dù được thưởng theo mét.

Báo cáo xác suất sống tới đủ 800, phân bố thời gian đạt mốc kèm lượt chết/censored, thu nhập ròng, HP/xăng mất, tiếp tế cho cruise/W/S nhiều seed. Kết quả P2.0 không nghiệm thu mật độ/traffic mới.
