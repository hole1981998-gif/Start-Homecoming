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
| baseMoneyPerMeter | 0.02 | Thu nhập cơ bản |
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

Hai rate trên tạm dùng chung; cruise thuộc từng VehicleDefinition. Có thể đề xuất rate riêng từng xe sau playtest. Với xe máy chỉ có tài xế, 20 → 14 m/s mất 1,5 s; 8 → 14 mất 2 s theo các số tạm này. Đây là phép tính thiết kế, **chưa chạy simulation cho cơ chế mới**. Gia tốc khi giữ W và lực hãm S dùng config điều khiển riêng, không suy ra từ return rates. Nâng cấp động cơ hiện chỉ tăng max theo mô tả cũ; chưa tăng baseCruiseSpeed. Khi hết xăng, auto-cruise không được tự cấp lực kéo.

### Mục tiêu economy đã chốt: ô tô đầu tiên sau 3–5 phút

Mục tiêu là cơ hội mua xe trong lượt chơi đại diện, tính thời gian gameplay hoạt động, không tính pause/Help/shop; không phải bảo đảm mọi seed. Các giá/thu nhập trong bảng vẫn TẠM và chưa được chỉnh để khẳng định đã đạt mục tiêu.

Với số cũ, 800 - 200 = 600 tiền thiếu; thu nhập nền 0,02/m cần 30.000 m. Ở cruise xe máy tạm 14 m/s, mất khoảng 35,7 phút nếu không khách/chi phí, nên rõ ràng chưa đạt mục tiêu mới. Không tự tăng income hoặc giảm giá trong bản cập nhật tài liệu này. Khi triển khai kinh tế, mô phỏng ít nhất các chiến thuật cruise chủ yếu, giữ W nhiều, hãm S nhiều, có/không khách và chi phí tiếp tế; trình thay đổi cân bằng lớn trước khi áp dụng. Giữ công thức xăng/điểm/tiền theo distance hợp lệ, không thưởng riêng cho thời gian giữ phím và không thêm hệ số hao xăng theo tốc độ chưa được duyệt.

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

Riêng passenger cruise: thử từng n từ 0 khách tới đúng tải, quá tải và tới sàn; kiểm tra min <= effectiveCruise <= max, tăng n không tăng cruise khi giữ nguyên xe/tình huống, bỏ khách không làm giảm cruise. So sánh xe máy/ô tô/buýt/container và đổi xe giữ khách. Đo tiền ròng/phút, quãng chạy mỗi bình và thời gian mua xe đầu tiên ở cruise/W/S; xác minh còn nhiều lựa chọn chở khách có ý nghĩa, vẫn phục vụ mục tiêu 3–5 phút. Chưa gán các hệ số mới hoặc sửa income/giá cho tới vòng cân bằng triển khai.
