# P8 C3 refinement — tự review 23/10/2026

Nguồn yêu cầu: `TINH_CHINH_C3_EARLY_SCORE_QTE_2026-10-23.md` của chat cân bằng, được chủ dự án chuyển sang chat code. Revision trước sửa `3ac54aa`; bản này dùng nhánh `codex/c3-early-score-qte`. Đây là tự review của Codex trên simulation và trình duyệt, không phải người chơi hoặc art director độc lập.

## Đã áp dụng

- Main P8: roll seed độc lập loại lớp thứ ba với xác suất 25% trước 45 giây active, tuyến tính về 0 ở 90 giây. ETA được chụp khi nhóm sinh; không chỉnh nhóm đã hiện. Giữ hai actor đầu, nhịp nhóm, pattern ID và RNG director. Backup không đổi director.
- Hàng rong main có vận tốc ngang 6,0 m/s trong 0,15 s; easing 0,45 s về 3,8 m/s, rồi đều. Một hàm vị trí phục vụ render, collision sweep và dự đoán đường thoát. Backup giữ 3,4 m/s tuyến tính.
- Giá vật phẩm main Nitro/Star/chuối/Grab là 50/80/25/120. Xăng/sửa tại shop, xe, nâng cấp, stock và duration không đổi. Backup giữ giá cũ.
- Điểm `speed-v1` dùng tốc độ thực, tham chiếu catalog và tải hợp lệ, trần 1,053 điểm/m. Kết quả ưu tiên điểm; bảng xếp hạng lọc theo phiên bản, vẫn giữ kết quả cũ. Backup dùng cách tính cũ.
- Q/E được đặt theo vị trí chiếu gần nhánh trái/phải và đếm tới mốc đóng, kèm cue báo trước. **Chưa đổi timing QTE 2,4→2,0 s.**

## Quyết định giữ timing QTE cũ

Thử đúng phương án dời cửa QTE và cung rẽ 8→2 m theo tài liệu; test logic rẽ và 30 seed đường chặn đều qua. Nhưng kiểm tra trực tiếp trên `?scenario=blocked-window&seed=17` tại khoảng 1.600 m thấy rào sửa đường vẽ cắt ngang đầu xe đang cua, trong khi collision không báo va chạm. Đây là mismatch hình học với overlay giao lộ. Sau khi hoàn nguyên timing/cung rẽ, cùng ca không còn thấy rào cắt ngang xe. Theo điều kiện trong tài liệu yêu cầu, giữ timing cũ cho đến khi road mesh, barrier, collider và xe dài được thiết kế/kiểm trọn vẹn. Không tuyên bố QTE 2,0 s đã hoàn thành.

## Dữ kiện và đánh giá

- Test nhóm early 1.000 seed: kiểm tỷ lệ giảm quanh 25% trước 45 s, giảm dần giữa 45–90 s và về 0 sau 90 s. Audit generator 100 đường seed sau khi gắn active time thực tế giả định theo tốc độ 14 m/s: 7.421 nhóm đo được, 2.263 nhóm ba lớp, 3.679 nhóm hai lớp; 72,0% nhóm có nước, 68,6% có traffic; 646 patch nước rộng/dài. Đây là dữ liệu spawn, không phải tỷ lệ người chơi gặp.
- Simulation pilot 30 seed/profile từ suite cân bằng trên revision cuối: cautious median 362 s (28/30 kết ván trước cap), average 384 s (29/30), fast 178 s (30/30); số mua car4 30/30 trong cả ba profile. Bot có script và tài nguyên/quyết định khác người thật; không dùng các số này làm cam kết 5 phút hoặc so tỷ lệ chết sớm C3 gốc vì chưa có A/B cùng pilot.
- Browser IAB, seed 17: `?scenario=junction` cho thấy cue Q/E ở hai mép nhánh, HUD cập nhật trong lúc lái; `?scenario=blocked-window` nhận Q, xe sang nhánh mới, HP giữ nguyên. Kiểm ảnh giữa cua cho thấy lỗi của phương án dời cung và dùng làm cơ sở hoàn nguyên. Bản chính mở/restart được. Chưa kiểm thủ công đủ tám loại xe, mọi kích thước màn hình, và menu mua/dùng đồ trên ván dài.

**Game design tự review:** giảm lớp thứ ba chỉ nới các quyết định nhiều lớp, vẫn giữ ít nhất hai lớp và train/police. Giá mới cho phép người bỏ lỡ khách mua đồ sớm; chưa có bằng chứng vòng chơi kinh tế thực của người chơi. Điểm khuyến khích W nhưng trần theo mét rõ ràng; cần đo hành vi người thật vì người chạy nhanh có thể chết sớm hơn. Đề xuất chưa áp dụng: đo tỷ lệ ngã/chết trước 90 s trên cùng seed và input C3 cũ/mới, rồi lấy nhận xét người chơi trước khi sửa mật độ hoặc tài nguyên thêm.

**UX tự review:** cue Q/E tách hai bên nhìn được ở khung 9:16; đếm tới mốc đóng thay vì tâm giao lộ. Nguy cơ: ở màn hình thấp, cue có thể gần cảnh báo khác; cần kiểm nhiều độ phân giải và khả năng đọc lúc hazard dày. Phần graphic/animation hoàn chỉnh để giai đoạn UI/art đã định. Không suy từ ảnh rằng timing lái công bằng với mọi xe.

## Kiểm tra kỹ thuật

Trên Windows/PowerShell, pnpm 11.25.0: `pnpm lint` exit 0; `pnpm typecheck` exit 0; `pnpm test` exit 0 (38 file, 266 test); `pnpm build` exit 0. Test mới kiểm luật điểm trên tám xe, trần điểm, hai chiều hàng rong, mốc chuyển tốc và giảm lớp theo 1.000 seed. `git diff --check` exit 0. Manual IAB như trên, gồm start, Q và lái qua giao lộ, quan sát HP/điểm, restart. Chưa test hết nhánh mua/dùng vật phẩm bằng tay; test giao dịch tự động chạy trong suite. CI chưa có kết quả tại thời điểm viết báo cáo. Không merge. Tài liệu này giữ các giới hạn manual/A-B nêu trên dù gate tự động xanh.
