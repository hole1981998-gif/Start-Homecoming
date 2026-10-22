# P8 Candidate A — review vòng đầu, 23/10/2026

Nguồn: `CAP_NHAT_PLAYTEST_2026-10-22.md` trong chat cân bằng. Đây là bản tự đánh giá của Codex từ generator, bot simulation và một lượt chơi thử trên in-app browser; chưa có playtest người thật độc lập. Base hiện tại là commit `5b0e296842d2375eff43882623faf3fe33f302e9`, cộng với các thay đổi chưa commit có sẵn trong checkout. Candidate A cũng chưa commit.

## Thay đổi có thể chơi thử

- Sau shop đầu, director tích hợp dùng lịch nhóm seeded 25,6 m, rồi 21,6 m, rồi 18,4 m. Mỗi nhóm hợp lệ có ít nhất hai lớp. Lịch tính trực tiếp theo index để các fixture vô hiệu hóa spawn bằng index lớn không bị treo.
- Thêm nhóm nước, traffic, gió, ổ gà, rào, hàng rong, dân phòng, xe chở đồ; mirror và phase seeded. Traffic trái chạy ngược chiều, phải cùng chiều; xe thả đồ luôn cùng chiều và ở làn phải. Chặn gió chồng vật chắn cố định. Có kiểm tuyến tránh va chạm theo thời gian và kiểm tuyến khô khi nhiên liệu thấp, nhưng đây chỉ là mô hình xấp xỉ tại tốc độ cruise, chưa mô phỏng trailer, khả năng giảm tốc của từng input hay ngân sách tài nguyên qua nhiều nhóm.
- Dân phòng phạt cố định 500, trừ tối đa số tiền đang có. Không đổi police, HP, fuel, pickup, giá xe, income, grip, QTE hay physics. `ver.noforce` vẫn dùng director cũ.
- Checkpoint `?scenario=p8-water&seed=17` dựng tuyến từ đầu với đúng xe 4 chỗ, rồi đặt người chơi trước vùng nước dài. Đây là fixture được cấp xe và tài nguyên, không dùng đo economy.

Catalog W01–W13 mới là bản thử cơ học, chưa được xác nhận đủ hai lựa chọn có ý nghĩa cho từng xe. W10 chưa ràng buộc pickup thật ở mép nước; W14 mới được gắn với tàu và hai patch trước/sau. Không gọi catalog này hoàn tất.

## Dữ kiện đã chạy

| Phép đo | Quan sát |
| --- | --- |
| Generator 300 seed, 0–3 km, bản A | 24.354 nhóm được đếm; 71,54% nhóm có nước; 70,57% có traffic; ít nhất một lane có nước trên 55,29% chiều dài 350–3.000 m; có 1.959 patch nước rộng ≥5,7 m và dài ≥20 m trên 300 đường. |
| Số lớp sau 850 m | 0 single, 11.761 cặp, 7.678 ba lớp: 60,5% / 39,5%, thấp hơn tỷ lệ ba lớp 55% đề xuất cho đoạn khó. |
| Special | 2.049/2.100 slot dự kiến xuất hiện trong 3 km; đây là spawn, không chứng minh người chơi gặp. |
| Khoảng trống hình học | P95 3,23 s ở 16 m/s; 2.823 khoảng >2 s trên 300 đường. Số này đo từ mép cuối nhóm đến mép đầu nhóm kế tiếp, **không phải** khoảng xử lý quyết định; chưa phân loại shop, QTE giao lộ, chờ tàu, hoặc thời điểm cue bắt người chơi quyết định. Gate <2 s chưa xác minh và chưa đạt theo phép đo thô. |
| Cùng bot, 30 seed, khởi đầu xe máy | Bot trung bình: director backup 16/30 lượt vẫn chạy ở trần 720 s, median chưa đo được; Candidate A 30/30 kết ván, median 204 s, Q25 167 s, Q75 241 s; 15 vì HP và 15 vì xăng. Bot nhìn trước và dự đoán cross-motion nên không tương đương người chơi trung bình. |
| Bot trung bình Candidate A, seed 1–300 | Năm lô 60 seed đều pass: 300/300 kết ván, 140 HP, 142 xăng, 18 công an; 299/300 mua car4. Median từng lô 172–194 s. Lần chạy gộp in median 185 s, Q25 150 s, Q75 220 s nhưng Vitest báo timeout RPC sau khi in nên exit 1; chỉ dùng số gộp này để tham khảo, không tính là một gate pass. |
| Mua ô tô 4 chỗ | 30/30 bot trung bình mua được, median 20,2 s; 28/30 trong 24 s. Bài mua xe thực riêng: 29/30 seed ở cruise, median 20,23 s. |
| Khảo sát xe cấp sẵn, bot trung bình 10 seed/xe | Xe máy khởi đầu bình thường có median 204 s trong 30 seed; mô tô cấp sẵn 155 s, car4 183 s, car7 182 s trong khảo sát 10 seed. Các bài cấp sẵn chỉ đánh giá hazard, không đánh giá mở khóa/economy. |
| Tương tác traffic | Bot thấy contact cặp traffic và traffic với chướng ngại trong 30/30 lượt A, nhưng phép đếm hiện lấy danh sách contact khi xe nằm trong vùng nhìn ±lookahead; chưa đo chính xác thời điểm cue/người chơi thực sự nhìn thấy. Chưa xác nhận gate ≥80% qua phút 2. |

Các số trong bảng phụ thuộc đúng code và seed lúc chạy, không phải thông số đã duyệt. Số 1.959 patch không cho biết tỷ lệ đường có ít nhất một patch; cần đo riêng nếu dùng chỉ số đó.

## Manual gameplay và tự review

In-app browser tại `http://127.0.0.1:5173/?scenario=p8-water&seed=17`: khởi động được, thấy vùng nước dài và traffic trên đường, thử A, quan sát xe va chạm/ngã, HP giảm 20 và xăng giảm; Esc tạm dừng, restart đưa seed 17 về 787 m, 10 L, 105 HP, 1/4 người. Screenshot gameplay cho thấy vùng nước và xe đọc được ở khoảng nhìn hiện tại. Đây là một lượt ngắn, chưa thử shop, thất bại do hết xăng, QTE giao lộ hay toàn bộ pattern bằng tay.

Tự review game design: mật độ mới làm hành trình đòi hỏi chọn lane hơn, nhưng cú nhảy độ khó so với backup quá mạnh; bot trung bình từ nhiều lượt censored xuống median 204 s. Nước là nguồn áp lực chính và nhiều lượt kết thúc vì xăng. Chưa đủ căn cứ kết luận người thật đạt mục tiêu 225–255 s, hoặc mỗi W-template thật sự có hai lựa chọn đáng cân nhắc. Đề xuất kiểm riêng khoảng quyết định thực theo tốc độ đóng, giữ nguyên damage/fuel trong vòng A; sau đó sửa nhóm bị bỏ qua và giảm các đoạn ba lớp gây buộc chịu nước nếu người chơi không có thời gian/phương án hợp lý. Đây là **ĐỀ XUẤT**, chưa áp dụng thêm thay đổi lớn.

Tự review UX/UI: overlay HUD hiện đọc được khi lái ở checkpoint, xăng/HP nằm gần xe; cue gió và popup HP xuất hiện, ngã xe đọc được. Ưu tiên kiểm cảnh báo ở tốc độ cao và khi nhiều cue chồng, vì screenshot không chứng minh đủ 3,5 s phản ứng. UI polish/art/SFX vẫn để phase đã thống nhất; không coi lượt này là audit UI toàn diện.

## Gate và giới hạn bàn giao

- `pnpm lint`: pass (exit 0).
- `pnpm typecheck`: pass (exit 0).
- `pnpm build`: pass (exit 0).
- `pnpm exec vitest run --configLoader native --maxWorkers=2 --reporter=dot`: pass 36 file / 258 test (exit 0). Lượt chạy đầu từng fail vì lịch O(n) với index 1e9; đã sửa và chạy lại xanh. Các kỳ vọng P5 và dân phòng cũ được chuyển sang director backup / mức fine mới, không xóa test.
- `git diff --check`: pass (exit 0); chỉ có cảnh báo Git sẽ đổi LF sang CRLF khi chạm file. Quét mẫu private key/token trong source/tests/doc hiện có không có kết quả.
- Đã chạy 300 seed generator và 300 lượt bot trung bình chia năm lô. Chưa chạy 300 lượt cho mỗi profile/loại xe, chưa có log reason cho mọi reject, chưa đo ngân sách fuel/HP theo nguồn, chưa có bot giới hạn thông tin theo cue thật, chưa có playtest 12–20 người, chưa kiểm gate warning 3,5 s trên tương đối động. Đây là các điều kiện chưa đạt, không phải pass ngầm.
- Remote đã fetch thành công nhưng không có `origin/main` hay `origin/master`; `origin/HEAD` trỏ branch feature cũ. Checkout cũng có thay đổi chưa commit từ công việc trước. Theo `AGENTS.md`, chưa tạo branch mới từ remote main, chưa commit, push, PR hoặc merge Candidate A. Không chạm `ver.noforce`.

Muốn nghiệm thu A, cần trước hết xác định branch main thực tế, tách thay đổi cũ khỏi diff A có chủ đích, hoàn thành gate nhịp/công bằng/telemetry ở trên và xin chủ dự án nhận xét sau khi chơi. Chưa chạy Candidate B fuel.
