# P8 — dữ liệu bàn giao cân bằng C3 (23/10/2026)

## Mục đích

Tài liệu này chuyển dữ liệu đã mô phỏng cho chat cân bằng quyết định vòng tiếp theo. Nó **không** áp số C3 vào code và không thay thế playtest người thật.

## Phiên bản nguồn và phạm vi

- Bản code mô phỏng: working tree Candidate A ngày 22/10/2026; source provenance đầy đủ được giữ tại thư mục balance-analysis của phiên làm việc.
- Báo cáo Candidate A đã có trên Git: commit `ba05449` trên branch `codex/p8-balance-pass`.
- Candidate C3 chỉ thay ngân sách sống sót của bốn xe chính, phí nước, chiều dài nước trong W-template và khoảng cách nhóm sau shop đầu.
- Không đổi giá xe, income, shop, damage, physics/force/grip, QTE, tốc độ, footprint, công an 300, dân phòng 500; không đổi ba gác, buýt, tải, container.

## Kết quả simulation đã chạy

Bot proxy đổi ga theo tình huống, seed 1–100, bước gameplay 1/60 s:

| Candidate | P25 | P50 | P75 | Sống tới 300 s | Kết ván HP / xăng / công an / censored |
|---|---:|---:|---:|---:|---:|
| A hiện tại | 119 s | 145 s | 176 s | 0/100 | 45 / 44 / 11 / 0 |
| C1 | 202 s | 254 s | 295 s | 25/100 | 53 / 41 / 6 / 0 |
| C2 | 219 s | 274 s | 329 s | 41/100 | 42 / 46 / 12 / 0 |
| **C3 đề nghị chơi thử** | **227 s** | **309 s** | **420 s** | **54/100** | **56 / 34 / 10 / 0** |

Mục tiêu tạm cho người chơi là P50 khoảng 300 s, dải đánh giá 270–330 s. Đây là proxy bot có lợi thế đọc chính xác lane/chuyển động; không được gọi là kết quả người chơi thật.

## Thông số C3 tái lập chính xác

So với Candidate A:

| Xe | HP | Tank L | L/m | Pickup xăng L | Pickup HP |
|---|---:|---:|---:|---:|---:|
| Xe máy | 70 → 122,5 | 5,5 → 7,15 | 0,0045 → 0,0036 | 3 → 4,35 | 16 → 25,6 |
| Mô tô | 80 → 140 | 7,5 → 9,75 | 0,0048 → 0,00384 | 3,4 → 4,93 | 18 → 28,8 |
| Ô tô 4 chỗ | 105 → 183,75 | 10 → 13 | 0,0055 → 0,0044 | 3,6 → 5,22 | 24 → 38,4 |
| Ô tô 7 chỗ | 125 → 218,75 | 13 → 16,9 | 0,0065 → 0,0052 | 4,2 → 6,09 | 28 → 44,8 |

- Hao xăng nước: `0,8 → 0,55 L/s` cho mỗi patch đang chạm.
- Chiều dài nước trong các W-template: `×0,9`; chỉ helper của template, không đổi fixture/special/catalog size ngoài helper.
- Sau shop đầu, tâm nhóm: `25,6 / 21,6 / 18,4 m → 28,16 / 23,76 / 20,24 m`.
- Mốc nối lịch nhóm phải là `1.842,48 m` và `3.386,88 m`; nhóm đầu vẫn bắt đầu tại `350 m`.

## Kiểm chứng mật độ đường của C3

Audit generator 30 seed, xe 4 chỗ đầy tài nguyên, đoạn 350–3.000 m:

| Chỉ số | Candidate A | C3 |
|---|---:|---:|
| Nước phủ ít nhất một lane | 54,20% | 48,80% |
| Nhóm có nước | 70,19% | 70,47% |
| Nhóm có traffic | 71,06% | 71,01% |
| Số nhóm | 2.419 | 2.218 |

C3 vẫn giữ đường đông và nhiều nước. Tỷ lệ nhóm có nước hầu như giữ nguyên; phần giảm chủ yếu do rút chiều dài patch và nới tâm nhóm 10%.

## Ràng buộc cần giữ khi triển khai hoặc cân tiếp

1. Traffic vẫn dùng chung `fuelCapacity` và `fuelPerMeter` theo loại xe, nên C3 cũng cho traffic bốn loại tương ứng chạy xa hơn. HP traffic thuộc catalog khác, không tăng theo HP người chơi.
2. Xăng traffic vẫn bật. Đây chưa phải quyết định bật/tắt cuối cùng; cần hỏi chủ dự án trước vòng cân riêng tính năng đó.
3. Phí nước cộng theo số patch chồng lên nhau. C3 không đổi luật này; cần log thời gian tiếp xúc 1/2/3 patch trước khi kết luận nguyên nhân hao xăng.
4. `ver.noforce` là bản backup. Chưa áp C3 vào code dùng chung vì làm vậy có thể đổi tài nguyên của backup; nếu triển khai cần tách profile có chủ đích hoặc xác nhận cho phép backup cùng nhận config mới.
5. Khoảng tâm nhóm 1,76 → 1,485 → 1,265 giây ở 16 m/s không chứng minh gate “decision gap <2 s” đạt trong cảnh thực. Cần đo khe xử lý thực sau reject, shop và giao lộ.

## Khuyến nghị vòng tiếp theo

- Cho chủ dự án thử C2 và C3 cùng 5–10 seed; ghi seed, xe, thời lượng chủ động, quãng đường, nguyên nhân kết ván, HP/xăng nhận–mất, lần shop và thời gian trong nước.
- Nếu người chơi dưới 270 s: chỉ nới nhánh gây chết chủ đạo 5–10% (HP/repair nếu chết HP, fuel pickup/drain nếu chết xăng), không đổi đồng thời giá/shop/physics.
- Nếu vượt 330 s hoặc xe quá lì: ưu tiên C2 hoặc giảm đúng nhánh dư thay vì tăng mật độ/damage đột ngột.
- Sau khi chốt candidate, mở rộng ít nhất 300 seed cho profile cruise, giữ W và đổi ga; đối chiếu theo xe máy, mô tô, car4, car7.

## Giới hạn bằng chứng

Các số trên được chạy bằng simulation gameplay qua `stepRun`/`fillWorld`, không phải kiểm chứng trình duyệt hay nhóm người chơi. Chưa có manual playtest của C3 và chưa có 300–1.000 seed cho mọi profile. Không dùng báo cáo này để tuyên bố balance đã chốt.
