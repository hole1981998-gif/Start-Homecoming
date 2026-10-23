# P8 C3 — áp dụng cân bằng và dữ liệu kiểm chứng (23/10/2026)

## Trạng thái

Candidate C3 đã được áp vào bản chơi chính. `ver.noforce` giữ profile tài nguyên Candidate A và lịch đường cũ, đúng vai trò bản backup. Các con số dưới đây là kết quả mô phỏng script trên code hiện tại, chưa phải đánh giá chơi của chủ dự án.

## Phạm vi thay đổi C3

- Xe máy, mô tô, ô tô 4 và 7 chỗ: HP, dung tích bình, tiêu hao theo mét, mức nhặt xăng/sửa theo bảng C3 trong `P8_CANDIDATE_C3_BALANCE_HANDOFF_2026-10-23.md`.
- Nước: hao xăng 0,55 L/s/patch đang chạm; chiều dài patch nước trong template P8 giảm 10%.
- Tâm nhóm sau shop đầu: 28,16 / 23,76 / 20,24 m, nối tại 1.842,48 m và 3.386,88 m.
- Giá xe, thu nhập, shop, damage, physics/handling, QTE, tốc độ, footprint giữ nguyên so với Candidate A. Ba gác, buýt, tải, container không đổi thông số xe.

## Mô phỏng trên code đã áp

Script finite-reaction `adaptive`, seed 1–100, tối đa 720 s, bước gameplay 1/60 s, xuất từ `tests/balance-simulation.test.ts`. Lần chạy cuối sau khi sửa nhịp worker: **8/8 test pass, exit 0**. Đây là proxy có điều khiển theo kịch bản, chưa phải playtest người thật:

| Chỉ số | Kết quả |
|---|---:|
| P25 / P50 / P75 thời lượng | 223 / 301 / 362 s |
| Hết xăng / hết HP / công an / censored | 45 / 45 / 8 / 2 |
| Mua ô tô đầu tiên | 100/100 lượt, trung vị 12,8 s |
| Trung bình quãng đường | 3.487 m |
| Trung bình số va chạm / lượt | 10,9 |
| Trung bình thời gian chạm nước / lượt | 18,2 s |
| Gặp cặp traffic / traffic đụng vật cản | 100/100 / 100/100 lượt |

Ô tô đầu tiên nhanh vì giá car4 hiện là 300 và tiền đầu 280; đây là cơ chế đã có ở Candidate A, không phải thay đổi C3. Bot đọc tình huống chính xác hơn người chơi và không đại diện cảm giác lái.

Audit generator 100 seed, đoạn 350–3.000 m: ít nhất một lane có nước trên 49,47% quãng đường; 72,04% nhóm có nước; 70,41% nhóm có traffic; 645 patch nước rộng và dài; P95 khoảng trống giữa các cửa sổ chướng ngại là 3,48 s. Mốc mong muốn “decision gap dưới 2 s” **chưa đạt ở P95**; không tự siết spawn thêm vì có nguy cơ thiếu thời gian phản ứng. Cần đánh giá cảm giác bằng người chơi trước vòng cân tiếp.

## Đính chính dữ liệu thí nghiệm nguồn

Báo cáo handoff C3 ghi car4 13 L, car7 16,9 L và proxy P50 309 s. Kiểm tra code trong thư mục `balance-analysis/experiment-2026-10-23/mixed_final_pilot` cho thấy lượt thí nghiệm tạo bảng 309 s đã **hoán đổi hai bình**: car4 16,9 L, car7 13 L. Bản áp hiện tại dùng **đúng bảng thông số được bàn giao**: car4 13 L, car7 16,9 L. Vì thế không dùng hàng 309 s làm dự báo định lượng cho bản chơi hiện tại; kết quả cần dùng là 301 s/100 seed trên code đã áp, với giới hạn test runner nêu trên.

## Gameplay và UX tự review

- Dữ kiện: đường vẫn nhiều nước và traffic; mô phỏng kết thúc gần đều bởi xăng và HP. Ô tô đầu tiên xuất hiện rất sớm. 2/100 lượt chưa kết thúc trong 720 s.
- Nhận định game design: C3 đưa proxy về khoảng 5 phút mà không làm đường trống hẳn. P95 gap 3,48 s cho thấy có nhịp thở dài; đây là điểm cần thử trực tiếp trước khi thay đổi mật độ. Đề xuất **chưa áp dụng**: chỉ điều chỉnh nhánh gây kết ván chủ đạo sau khi có seed và cảm nhận người chơi, tránh sửa xăng + HP + mật độ cùng lúc. Quyết định riêng về xăng xe chướng ngại vẫn cần hỏi chủ dự án.
- UX: HUD tài nguyên và chỉ số nhìn được khi lái; mở/restart bản chính và backup hoạt động. Chưa có bằng chứng playtest người thật về khả năng đọc chướng ngại ở 3–5 phút. Không thêm UI polish trong vòng cân này.

## Kiểm tra và hạn chế bàn giao

- `pnpm lint`: exit 0; `pnpm typecheck`: exit 0; `pnpm build`: exit 0 trên Windows/PowerShell, pnpm 11.25.0.
- `pnpm test`: exit 0, 37 file và 262 test pass. Vitest các bài ngoài mô phỏng cân bằng: 36 file, 253 test pass, exit 0. Bài mô phỏng cân bằng riêng, 30 seed mỗi profile: 1 file, 9 test pass, exit 0. Bài `adaptive` 100 seed: 1 file, 8 test pass, exit 0.
- Manual trên trình duyệt tích hợp, seed 17: bản chính bắt đầu với 7,15 L/122,5 HP; giữ W và lái A, HUD cập nhật tốc độ/quãng đường/xăng; pause và restart khôi phục tài nguyên. Bản backup bắt đầu với 5,5 L/70 HP và lái được. Kịch bản `?scenario=coast&seed=17` trên bản chính đi đến hết xăng, trôi 25 m, kết ván và chơi lại được. Đây là fixture để kiểm tra luồng, chưa phải ván thường 5 phút bằng tay.
- `git diff --check`: exit 0; không thấy lỗi whitespace. GitHub xác nhận nhánh mặc định thực tế là `feature/p4-1-traffic-durability`, không có `origin/main`. `main` cục bộ đã fast-forward lên đúng nhánh mặc định này; branch hiện tại `codex/p8-balance-pass` là hậu duệ của base đó. Trạng thái commit/push/PR được ghi ở bàn giao cuối. Không tự chép đè backup hoặc merge.
