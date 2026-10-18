# Đường Về Nhà — Balance Config

> **Thiết kế hiện hành P6.1:** xem DESIGN_MOVING_EVENTS_TRAFFIC.md. Feedback mới thay mô hình tàu/công an bật-tắt chắn toàn đường của bản P6; phần mô tả P6 phía dưới là lịch sử implementation, chưa phải cơ chế chuyển động đã nghiệm thu. Chưa sửa runtime trong lượt cập nhật design này.

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
| Gói xăng mang theo | Bỏ | Không bán/không dùng |
| Bộ sửa mang theo | Bỏ | Không bán/không dùng |
| Vật phẩm mới | Chưa chốt giá | Nitro, star, chuối, Grab; theo DESIGN_ITEMS_HAZARDS.md, chưa triển khai |

Inventory ĐÃ CHỐT tối đa hai món, hai ô cố định dùng phím 1/2; R mở shop, Tab đổi xe, không dùng để chọn vật phẩm. Dùng ô 1 không dồn ô 2; món mua mới vào ô trống đầu tiên. Nitro nằm trong kho hai ô mới, không kho riêng. Các số thử cũ (bay 1.6 s, tăng tốc 30%, cooldown 2 s) chỉ là lịch sử, không tự dùng cho P5.1; đường bay và đoàn tàu phải được kiểm tra theo xe dài nhất. Không bật bất tử toàn ván khi đang nhảy. Không thưởng tiền chỉ vì dùng item.

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
- Trọng số vật phẩm mới chưa chốt; bỏ bảng roll gói xăng/sửa/nitro cũ. Pickup hồi trực tiếp trên đường giữ riêng khỏi kho.
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

**Traffic P4.1 đã có bản thử; P4.2 CHƯA ÁP DỤNG:** mỗi loại xe giao thông nay có HP và sát thương va chạm riêng; traffic mất HP khi tiếp xúc ổ gà dài theo thời gian, ngoài damage khi bị người chơi húc. Các số vẫn cần cân để có xe chịu được và xe có thể bị phá bởi môi trường. Ở P4.2, xe HP=0 mới tạo hành khách một lần, bên cạnh nơi hỏng và trong phạm vi có thể tới đón; số khách không vượt quá số người trên xe/giới hạn cân bằng. Đo số xe hỏng theo từng nguyên nhân, số khách sinh/được đón, thu nhập tăng thêm và tần suất farm qua nhiều seed. Khách chỉ tăng điểm/tiền khi đã được đón và xe thực sự di chuyển, không thưởng ngay tại lúc xe hỏng.

**P3B bản thử (`p3b-junctions-1`):** giao lộ đầu 800 m, sau đó mỗi 800 m; giao lộ đầu luôn có đường thẳng, các giao lộ sau có thể bị chặn theo seed. Cửa sổ Q/E từ 1,8 s giảm tuyến tính tới 1,2 s ở khoảng 10 km, sàn 0,9 s; cue báo trước ít nhất khoảng 4 s. Bỏ lỡ khi đường thẳng bị chặn gây 20 HP và trạng thái ngã/trôi hiện có, đúng một lần/giao lộ. Vùng 60 m mỗi phía giao lộ bỏ hazard để tránh chồng thao tác. Gap hazard từ 90 m giảm dần về 75 m trong khoảng 10 km; nguồn xăng/sửa, lượng hồi, giá và thu nhập giữ như P3A để đo riêng nhịp đường. Những số này là TẠM, không coi là difficulty đã cân bằng. Lần sau đo tỷ lệ chọn rẽ thành công/bỏ lỡ, tài nguyên sau nhiều giao lộ và cảm giác điều khiển của từng xe dài.

**P4A bản thử (`p4a-passengers-1`) — tất cả số sau là TẠM:** người chờ đi nhờ đầu ở 260 m, tiếp theo mỗi 400 m, chọn bên đường theo seed mà không tiêu RNG hazard. F đón trong phạm vi dọc ±12 m, ngang ±1,8 m; không tự đón khi chạm. G cho một khách xuống và chờ 2 s trước khi F đón lại cùng NPC. Xe máy 2 chỗ tính cả tài xế, trần kỹ thuật 6 khách, vẫn cho quá tải. Mỗi khách làm cruise giảm 2 m/s tới sàn 8 m/s; quá tải giảm max 8% và tăng hao xăng theo mét 15% mỗi người, có trần hệ số tốc độ 0,4 và hao xăng 3. Điểm mỗi mét tăng 4%/khách, tiền thêm 0,01/khách/m. Tài xế ngã/văng 0,8 s, nằm lại 0,5 s rồi quay về trong 1,8 s; vẫn miễn hậu quả toàn chuỗi và chướng ngại đang đè lên xe tới lúc rời collider. P4A chưa có định nghĩa các loại xe khác, garage hay shop. Cần đánh giá tiền/điểm **theo phút** và áp lực xăng trước khi khóa số: người chở khách đi chậm hơn dù được thưởng theo mét.

**Motion NPC P4A (`p4a-passengers-2`) — TẠM:** khách G bay ngang trong 0,65 s; khách chờ/ở lại có thể đứng yên hoặc đi với tốc độ quỹ đạo tối đa 0,45 m/s, luôn trong bán kính 1,5 m từ vị trí gốc. Vị trí hiển thị và vùng F theo fixed step, không theo frame render. Đây là số thử khả năng đọc và bắt nhịp, chưa phải cân bằng độ khó cuối.

**Sửa nhánh giao lộ (`p4a-branch-hazards-1`) — TẠM:** giữ nguyên các số xăng, HP, thu nhập, khoảng hazard, 60 m hành lang giao lộ và chu kỳ vật phẩm. Sau Q/E, nhánh mới có seed/ID riêng; pha loại chướng ngại lệch 1 bước khi rẽ trái, 2 bước khi rẽ phải để tránh chướng ngại cùng loại xuất hiện đúng vị trí dọc vừa thấy ở đường thẳng. Phân bố dài hạn vẫn luân phiên ba loại. Cần so sánh nhiều seed và quyết định rẽ khác nhau về lối tránh, nhặt vật phẩm, thời lượng sống và độ khó; chưa coi đây là balance cuối.

**P4B (`p4b-vehicles-1`) — TẠM:** `VehicleDefinition` trong code dùng bảng loại xe ở trên cho min/cruise/max, capacity, tank/HP, L/m, width/length và giá (giá mới chỉ phục vụ test transaction). Xe máy giữ baseline đang chơi: 5,5 L, 0,0045 L/m, +5,5 L/+40 HP khi nhặt; bảng gốc 8 L/0,003 L/m là số thiết kế trước P3A. Loss/sàn cruise thử theo loại: mô tô 2,4/9; ô tô 4 chỗ 1,6/9; ô tô 7 chỗ 0,9/9; ba gác 1/6; buýt 0,3/7; tải 1,3/7; container 1,8/5 (m/s mỗi khách / sàn m/s). Mức nhặt theo xe trong `src/vehicles.ts` vẫn lớn; yêu cầu giảm hồi trước đây chưa được cân độc lập, không coi đã hoàn tất. Trần kỹ thuật khách nâng lên 24 để xe buýt 25 chỗ có thể đầy, chưa chứng minh nhịp đón khách tới mức đó là phù hợp. Thời gian bảo vệ sau tự chuyển xe thử 1,5 s; Tab thủ công không cấp lại bảo vệ để tránh lạm dụng. Cần đánh giá lại thu nhập theo phút khi chở khách và nhịp xăng của xe lớn trước khi khóa số.

Báo cáo xác suất sống tới đủ 800, phân bố thời gian đạt mốc kèm lượt chết/censored, thu nhập ròng, HP/xăng mất, tiếp tế cho cruise/W/S nhiều seed. Kết quả P2.0 không nghiệm thu mật độ/traffic mới.

**Sửa trạng thái khách sau tai nạn (`p4b-crash-rider-roster-1`) — TẠM:** mỗi khách trên xe có ID riêng; xác suất quay lại sau một vụ va chạm là 0,5 cho từng ID và crash index. Khách không quay lại không thể đón lại. Họ bay 0,65 s, nằm 0,4 s và đứng dậy trong 0,55 s trước khi đi quanh điểm đáp. Đây là thông số thử cho độ đọc hình, chưa phải tỷ lệ giữ khách đã cân bằng. Ván thường dùng seed mới khi restart; fixture phát triển `?scenario=passenger-crash-car&seed=17` tái hiện cùng va chạm để kiểm tra.

**P4.1 traffic (`p4-1-traffic-durability-1`) — tất cả số TẠM:** xe nhỏ 30 HP/20 sát thương/1,9 × 3,6 m; van 48 HP/27 sát thương/2,2 × 5,1 m; tải 78 HP/36 sát thương/2,7 × 7,2 m. Spawn seeded tỷ trọng nhỏ:van:tải = 2:1:1. Traffic chịu 6 HP khi mới vào ổ gà và 12 HP/s khi còn chạm, không bị trừ tiền; vũng nước giảm tốc còn 60% khi chạm, chưa mô phỏng bình xăng traffic. Xe máy/xe nhỏ gây 14 HP khi húc, ô tô 4/7 chỗ gây 24/30 HP, buýt/tải/container gây 55 HP. Xe lớn húc hỏng mục tiêu nhận 40% sát thương mục tiêu (làm tròn lên) và không ngã; các trường hợp khác vẫn ngã. Xác xe dừng/hiện 2,5 s rồi biến mất, không gây thêm damage. Chưa sinh khách từ xe hỏng (P4.2). Các chỉ số này cần cân lại dựa trên tỷ lệ chết/né ở nhiều seed và feedback cảm giác công bằng.

**P4.1 mở rộng đủ danh mục (`p4-1-traffic-roster-1`) — số TẠM:** xe chướng ngại dùng footprint cùng loại xe người chơi nhưng HP/sát thương được cân riêng. Làn trái ngược chiều, phải cùng chiều, giữa chọn hướng theo seed; bảng tốc độ là độ lớn m/s. Trọng số áp dụng khi sinh một traffic entity, tổng 16. Loại xe người chơi mới phải có đối ứng traffic và luật húc mới.

| Loại traffic | HP | Sát thương khi va | Tốc độ | Trọng số sinh |
|---|---:|---:|---:|---:|
| Xe máy | 20 | 12 | 8 | 3 |
| Mô tô | 26 | 16 | 10 | 2 |
| Ô tô 4 chỗ | 30 | 20 | 6 | 4 |
| Ô tô 7 chỗ | 48 | 26 | 5,5 | 2 |
| Ba gác | 32 | 18 | 5 | 2 |
| Xe buýt | 90 | 38 | 4 | 1 |
| Xe tải | 100 | 42 | 5 | 1 |
| Container | 130 | 50 | 4 | 1 |

Damage húc của xe người chơi theo cùng thứ tự loại trên: 14/18/24/30/22/55/60/70 HP. Buýt/tải/container chỉ đi xuyên sau cú húc nếu mục tiêu thực sự về 0 HP, và vẫn mất 40% sát thương của mục tiêu, làm tròn lên; trường hợp khác vẫn chịu crash. Cần đo tỷ lệ chết, thời gian phản ứng, làn còn đi được, chi phí húc và khả năng sống của cả xe nhỏ/lớn qua nhiều seed trước khi khóa số. Bảng ba loại P4.1 phía trên là số lịch sử của lát cắt trước, không phải danh mục spawn hiện hành.

## P4.2 — Thông số thử đã áp dụng
Config `p4-2-traffic-passengers-1`: số khách xe hỏng là 1..min(capacity − 1, 3), seeded theo ID xe và seed ván; tài xế traffic không tạo thêm khách. Clearance chỗ đón 0,5 m ngoài footprint xe người chơi/hazard, NPC đứng yên. Chưa thay đổi tiền/m, thưởng khách, giá xe, spawn traffic, nhiên liệu hoặc damage. Không cộng tiền/điểm khi phá xe. Đo cơ hội đón, lượng khách thực đón và thu nhập/phút trước khi tăng cap hoặc cân chi phí húc. Những đoạn P4.2 chưa áp dụng ở trên là lịch sử.

**P4.2 lượt 2:** config `p4-2-traffic-passengers-2`, không đổi số cân bằng. Khách từ xe bị người chơi húc hỏng không thể đón; 61 NPC sinh trong fixture 30 seed là người ở lại, không còn là 61 cơ hội đón. Không dùng kết quả fixture lượt đầu để suy thu nhập cứu khách.

## Traffic fuel — số thử
Config `p4-2-traffic-fuel-1`: mỗi loại traffic dùng `fuelCapacity` và `fuelPerMeter` của VehicleDefinition cùng loại (không clone số xe máy). Sinh đầy bình, không roll lượng xăng/RNG mới. Nước +0,8 L/s mỗi patch đang chạm khi còn powered, hết xăng coasting 25 m, drag 3 m/s², crawl tối đa 2 m/s, sau đó 0. Hết xăng không tự mất HP hoặc sinh khách. Các số coasting dùng config chung hiện có, chưa được cân riêng cho traffic. Giá/damage/thu nhập và xăng người chơi giữ nguyên. Chưa thêm traffic vào cảnh thường ở trạng thái gần cạn vì sẽ đổi nhịp/độ khó; đây có thể là đề xuất cân bằng riêng sau review.

## P5 — Số thử đã áp dụng (`p5-roadside-economy-1`)
Shop 600 m, 1200 m, sau đó gap seeded 600–900 m; cảnh báo tối thiểu 4 s hoặc 60 m, C đủ gần cùng phía ±30 m dọc/1,8 m ngang. Không spawn tâm hazard mới trong 45 m quanh shop. Số này TẠM và có thể làm ván dễ hơn; giữ RNG draw của hazard bị bỏ để so sánh được. Mỗi shop có xe máy/car4 và hai loại khác seeded, một chiếc mỗi loại; xăng/sửa mang theo stock 2–4 mỗi loại, không refresh khi vào lại.
Giá/effect dùng bảng trên: engine +8% max/cấp, tank/armour +15% max/cấp, economy −8% L/m nền/cấp, ba cấp. Không tự bơm/sửa khi tăng max. Bơm 60 tiền tới +8 L; sửa 70 tới +40 HP; gói xăng 75, bộ sửa 85, cùng mức hồi và clamp. R inventory ba ô; chọn trong shop, không dùng Tab chọn món. Nitro chưa bán trước khi có Space/P6.
Mục tiêu đo lần này là giao dịch mua thật tại shop 1200 m, không chỉ đủ tiền: pilot né hazard và chủ động tiếp cận shop, 30 seed × cruise/W, mua được 29/30 và 28/30; median có mua 85,72 s và 60,18 s. Đây là mẫu giới hạn, không bảo đảm mọi seed. Ca đường trống không nhặt đồ chỉ còn ~0,10 L trước khi mua xe mới; chưa khóa mức căng xăng. Chi phí tiếp tế sớm chủ động làm chậm việc mua ô tô; không tự tăng income để bù. Xem PROTOTYPE_5_REVIEW.md cho giới hạn và đề xuất.

## P5 feedback (`p5-controls-garage-2`)
Kho hai món/hai ô 1/2; R shop. Không đổi giá/effect, fuel/HP, income hoặc difficulty curve trong lượt này. Shop đầy catalog xe, không mua trùng loại sở hữu. Giá nâng cấp tra cấp của instance được chọn, kể cả dự phòng; không refill khi tăng max. Việc hiện đủ catalog làm lựa chọn mua khác bản roll hai loại, cần đánh giá chiến thuật sau; không gọi giá/economy hiện tại đã cân. Gate tuning riêng mốc 8 phải đo khó theo quãng đường (đầu/giữa/cuối ván) và economy/giá trước giai đoạn art 9 và SFX/VFX 10.

## Yêu cầu mới — vật phẩm/chướng ngại 18/10/2026 (ưu tiên hơn mô tả cũ)

Xem [DESIGN_ITEMS_HAZARDS.md](DESIGN_ITEMS_HAZARDS.md) cho cơ chế đã chốt, đề xuất cần thử, phân kỳ và gate. P5 bỏ gói xăng/bộ sửa mang theo, chỉ tiếp tế trực tiếp tại shop; giữ mua xe/nâng cấp. Pickup tài nguyên trên đường vẫn hồi trực tiếp. Nitro boost/nhảy, star miễn damage/debuff nhưng không chặn event, chuối né công an/dân phòng và Grab nhiều lượt gọi khách đặc biệt đưa vào P5.1/P5.2/P6. Bốn nhóm hazard đưa vào P6.1–P6.3. Hai ô 1/2 dành cho hệ vật phẩm tương lai; hiện chưa có món để dùng. Giá/thời lượng/số lượt/hệ số thưởng chưa chốt, không dùng số cũ như số đã cân bằng; nitro kho riêng/Space cũ không còn là thiết kế hiện hành. Star với terminal tàu là điểm cần xác nhận theo diễn giải bảo thủ trong đặc tả.


## P5.1 — bản thử vật phẩm tăng lực (18/10/2026)
Đã triển khai kho hai ô cố định 1/2 (cả numpad), nitro chỉ boost, Space mới nhảy khi hiệu lực còn, star miễn damage/debuff thường. Xăng/sửa chỉ là service tại chỗ, không đưa lại gói hồi tài nguyên. Nguồn thử TẠM: mỗi shop một nitro và một star, không reroll; giá 120/180. Bản thường bắt đầu kho trống; fixture DEV items có sẵn hai món. Nitro boost 4 s, trần tốc độ ×1,3, nhảy 1,6 s cao 2,4 m; star 5 s. Bấm nitro khi hết xăng/coasting hoặc dùng lại cùng hiệu lực đang chạy không tiêu món; pause/crash/kết ván không cho dùng. Hai hiệu lực khác loại có thể dùng cùng lúc, không cộng dồn cùng loại. Timer theo thời gian gameplay; pause/shop/Help không làm hết hiệu lực.
Nitro không miễn va chạm: chỉ vượt mặt đường/xe thấp khi đủ cao và toàn bộ footprint thoát trước hạ cánh; không vượt bus/truck/container. Đụng trong lúc nhảy vẫn có thể ngã; ngã hủy boost/flight. Star không hồi/cấp xăng, tiêu hao chạy nền vẫn có; không tự phá traffic khi lướt qua. Hết star khi vẫn chạm hazard sẽ chịu hậu quả tiếp. Tại giao lộ, star vẫn ghi event/miss nhưng chặn damage/ngã của rào thường. Tàu/công an/dân phòng chưa có, chưa nghiệm thu luật terminal/trigger thực của P6; thiết kế star không bỏ trigger và tàu vẫn terminal khi đụng được giữ. Grab/chuối/hazard mới chưa triển khai.
Các số trên đều TẠM, chưa khóa economy/difficulty. Xem [PROTOTYPE_5_1_REVIEW.md](PROTOTYPE_5_1_REVIEW.md) cho command, seed, bằng chứng manual, giới hạn và tự review.


## Sửa điều khiển nitro theo chủ dự án — Space nhảy
Thay luật tự nhảy của P5.1 đầu: dùng nitro bằng phím ô 1/2 chỉ boost tốc độ trong thời lượng hiện có (TẠM 4 s). Nhấn Space riêng khi nitro đang hiệu lực và xe đang ở mặt đường để nhảy. Không tiêu thêm món/không reset thời lượng boost; giữ Space không tự nhảy lặp. Sau hạ cánh có thể nhấn Space lại nếu boost còn. Không nhảy khi pause/ngã/kết ván/hết xăng/coasting hoặc không có nitro; star riêng không cho nhảy. Cú nhảy đã bắt đầu vẫn đáp bình thường nếu boost hết giữa không trung. Không đổi giá/thời lượng, không chỉnh layout/art; UX/UI hoàn chỉnh để P tương ứng. Kết quả: [NITRO_SPACE_REVIEW.md](NITRO_SPACE_REVIEW.md).


## P5.2 — bản thử Grab và khách đặc biệt
Đã triển khai gói Grab trong kho hai ô 1/2. Số thử TẠM: giá 240, 3 lượt/gói, một gói mỗi shop, cooldown gọi 2 s; món giữ nguyên ô cho tới khi hết lượt, không tự dồn ô. Một lượt tạo một NPC Grab phía trước khoảng 45–120 m (tối thiểu cửa sổ phản ứng theo tốc độ), có dấu primitive và nhãn Grab. Không tìm được pocket an toàn/đủ xa, đang có khách Grab còn chờ hoặc chưa chọn nhánh giao lộ thì không trừ lượt. Không tự thêm khách hoặc thưởng tiền khi gọi; phải lái tới và nhấn F. Bỏ lỡ khách mất cơ hội, không hoàn lại lượt hay nhân khách sang nhánh khác.
Khách Grab giữ ID/type qua F/G, đổi hoặc mua xe và tai nạn. Khách quay lại tiếp tục có thưởng đúng một lần; khách rời đi không còn cộng thưởng, giữ luật từ chối đón lại sau tai nạn. Tối đa/capacity/quá tải/cruise và điểm số vẫn như khách thường. Thưởng tiền mỗi khách Grab TẠM ×10 phần riderMoneyPerMeter (0,10/m thay 0,01/m), không nhân thu nhập nền 0,50/m hoặc toàn bộ ví. Registry chỉ giữ ID khách còn liên quan trên xe/đang quay lại; type của người ngoài đường nằm trên entity. Restart xóa mọi dữ liệu ván.
Nguồn chờ giữ vị trí đã kiểm tra để không đi vào hazard; chỉ reserve pocket đón của khách đang chờ khi sinh hazard mới, vẫn tiêu RNG draw trước khi từ chối hazard đè pocket. Không xóa hazard đã có, không clear toàn bộ đường, không cho pickup tự động. Grab chưa khóa cân bằng: gói có chi phí cơ hội so với mua xe và tích nhiều khách trên bus có thể rất lời. UI/art vẫn placeholder; hoàn thiện ở P tương ứng. Xem [PROTOTYPE_5_2_REVIEW.md](PROTOTYPE_5_2_REVIEW.md).


## Grab chờ ở ven đường — cập nhật theo chủ dự án
Khách Grab được gọi chỉ xuất hiện ngẫu nhiên ở hai mép ngoài mặt đường, không ở tâm hay trong lane. Bên ưu tiên lấy từ seed/branch/sequence riêng, không ưu tiên gần xe và không tiêu hazard RNG. Nếu bên đó không an toàn thì thử bên kia; cả hai không hợp lệ thì giữ lượt. Vị trí đứng tính từ nửa bề rộng đường + nửa collider NPC; kiểm tra đường tiếp cận và hazard theo vị trí xe có thể chạy sát lề, không lấy tâm NPC ngoài đường làm tâm xe. Tầm F giữ nguyên; có test đón cho cả 8 loại xe. Không đổi giá/thưởng/lượt hay layout/art. Xem [GRAB_ROADSIDE_REVIEW.md](GRAB_ROADSIDE_REVIEW.md).


## P6 — config thử, chưa cân bằng
Nguồn runtime: eventBalance trong src/config.ts, config version p6-special-events-1. Công an 300, dân phòng 100; thiếu tiền công an giữ nửa xăng dự phòng đang có, dân phòng lấy tới 0. Chuối giá 80/món, 1 món/shop; cửa sổ 3,5 s có xét footprint xe (tầm tối thiểu 45 m). Event đầu 1.700 m, gap 1.250 m; director có thể bỏ mẫu cạnh shop/junction/Grab; corridor 110 m. Event đầu sau shop 1.200 m để không phá nhịp mua xe đầu. Tàu đóng 8 s/mở 8 s, clearance 1,8 m; S gần ray phanh tới 0. Xe chết máy 1 khách cần F, 25% thêm chuối nếu ô trống; không ghi đè vật phẩm. Chưa đổi thu nhập, giá xe, fuel/HP hay curve theo distance. Bằng chứng/giới hạn và đề xuất tuning: [PROTOTYPE_6_REVIEW.md](PROTOTYPE_6_REVIEW.md).


## P6.1: thay cấu hình chiếm lane (chưa code/chưa cân bằng)
Chu kỳ tàu 8/8 s của P6 không phải design tàu chạy ngang: P6.1 cần cấu hình độ dài đoàn, tốc độ ngang, hướng, khoảng cách/cue; thời gian chiếm lane suy ra từ quỹ đạo và kích thước. Officer cần width/length một người, số lượng một/đôi khi hai, tốc độ/phase đi qua lại và trạng thái trúng chuối; chưa chốt số hay thời gian hồi phục. Không đổi tiền phạt/giá, không mặc định nâng mật độ hoặc damage traffic ở lượt ghi design này. Xem DESIGN_MOVING_EVENTS_TRAFFIC.md; tuning curve và economy giữ tại P8.


## P6.1 — bản thử tình huống trước tích hợp (18/10/2026)
Theo yêu cầu mới nhất của chủ dự án: triển khai và duyệt các tình huống riêng trước; chỉ làm bản tích hợp khi chủ dự án đồng ý. Đã có 15 fixture DEV tại http://127.0.0.1:5173/p61.html, version `p61-scenarios-1`: tàu ngang hữu hạn, officer 1/2 người, chuối vô hiệu cả nhóm, traffic va nhau/hazard, rào, hàng rong và cứu thương. Chỉ fixture bật experimentalMotion/experimentalTraffic; director ván thường chưa dùng các cơ chế này. Đây chưa phải hoàn thành toàn bộ P6.1.
Các số mới đều TẠM: tàu dài ngang 24 m, sâu 2,8 m, tốc độ ngang 6 m/s; NPC rộng/sâu 0,65 m, chạy ngang 4,5 m/s trong ±4,35 m; rào rộng 6,2 m/sâu 1,4 m, damage traffic 20 một lần; hàng rong ngang 2,2 m/s; cứu thương dọc 16 m/s. Không đổi giá, thu nhập, fuel hay mật độ ván thường. Báo cáo và giới hạn tích hợp: [PROTOTYPE_6_1_SCENARIOS_REVIEW.md](PROTOTYPE_6_1_SCENARIOS_REVIEW.md). P8 tuning độ khó/economy, P9 UI/art, P10 SFX/VFX giữ nguyên.


## P6.1 tuning tình huống — feedback 18/10/2026
Version `p61-scenarios-2`, chỉ DEV, chưa tích hợp. Tàu chạy từ đầu vào tới đuôi rời toàn mặt đường trong 4 s (chủ dự án xác nhận), speed = (24 + 9,6)/4 = 8,4 m/s, giữ kích thước. Thời gian ở mỗi lane suy ra từ hình học, không timer tắt collider. Thêm 4 fixture công an/dân phòng: chạy nhanh 6,3 m/s; lệch nhịp 5,6 và 3,8 m/s, cách dọc 3 m, phạm vi ngang [-4,35;1,6] và [-1,6;4,35] m. Giữ nhóm/chuối/phạt như cũ. Hàng rong tăng 2,2→3,4 m/s, dài 1,5→2,1 m, rộng 0,8→1,1 m. Các số mới TẠM để chủ dự án chơi thử, chưa điều chỉnh director/difficulty curve/economy. Hub hiện có 19 ca. Báo cáo: [P61_EVASION_TUNING_REVIEW.md](P61_EVASION_TUNING_REVIEW.md).

Feedback kế tiếp: P6.1 scenario version3 tăng bề rộng ngang hàng rong 1,1→1,8 m (TẠM), giữ chiều dài2,1m/tốc độ3,4m/s. Render và collider cùng đọc footprint; chỉ fixture DEV, chưa tích hợp.
