# P6.3 — tích hợp gió và đồ rơi vào ván đầy đủ

Ngày 18/10/2026. Branch `codex/integrate-p62-p63-hazards`, base local `c2d776c`; repository không có remote để fetch/push/PR. Đây là **tự review của Codex** từ simulation, test và thao tác IAB localhost, không phải nhận xét của người chơi hay chuyên gia độc lập. Giá trị mật độ và tốc độ vẫn **TẠM**.

## Phạm vi và quyết định

P6.1 đã có trong bản thường: tàu, officer, hàng rong, cứu thương, blocker và traffic va chạm. Lượt này thêm gió P6.2 và đồ rơi P6.3 vào bản thường `p63-integrated-1` bằng các slot trong lịch hazard sẵn có, không tăng tổng số slot. Mỗi 9 vị trí có tối đa một vùng gió dài 65 m, một xe nguồn tải/container chạy cùng chiều; slot vẫn bị bỏ nếu trùng shop, giao lộ hoặc hành lang sự kiện. Xe nguồn còn chạy mới thả sau 2,3 s; vật xuất phát sau đuôi, lùi rồi lăn lệch seeded, tối đa bốn vật đang hoạt động. Gió đẩy xe người chơi và traffic đang chuyển động; star, lúc ngã và bảo vệ thay xe miễn lực. Nước vẫn hao xăng và hãm tốc, **chưa đẩy ngang**. Không tạo slot gió chồng nước, ổ gà hay vật cố định; trường hợp chồng động hoãn theo quyết định trước. Stress P6.1 giữ lịch riêng làm mốc tham chiếu P8.

Checkpoint QA `/?scenario=integrated-hazards&seed=17` bắt đầu 1870 m với ô tô, xe dự phòng và vật phẩm mẫu để gặp gió/đồ rơi sớm trong **director đầy đủ**. Bản chơi tự nhiên từ đầu là `/?seed=17`; checkpoint không dùng đo economy.

## Kết quả simulation và kiểm tra

- Sinh tuyến 0–5000 m, 30 seed × 3 biến thể nhánh: **393 vùng gió và 360 xe nguồn có lịch thả**, không có gió chồng patch/vật cố định trong dữ liệu sinh, nguồn đều là tải/container còn chạy cùng chiều ở làn phải. Đây là số entity theo 90 tuyến, không phải số lần người chơi gặp.
- Pilot scripted trên 6 seed, tối đa 240 s/ván, có shop/khách/giao lộ/sự kiện thật, không cấp tài nguyên: cả 6 ván tiếp tục chạy tới giới hạn; mỗi ván thấy **3–5 vùng gió, 4–5 xe nguồn và 4–5 đồ rơi thực**; không phát hiện tài nguyên âm/NaN. Pilot chọn làn theo heuristic, không chứng minh cảm giác né hoặc độ khó đã đạt. So với trước, bản này vẫn có dấu hiệu **dễ**: cả 6 pilot sống 240 s; cần P8 đo độ khó và economy trên nhiều kiểu lái.
- Test chức năng bảo vệ quỹ đạo gió, nguồn còn chạy, chỉ rơi một lần, va chạm crate/barrel, star/nhảy, fork nhánh, checkpoint và kết quả seed. `pnpm lint`, `pnpm typecheck`, `pnpm build` pass. `pnpm test --maxWorkers=1 --minWorkers=1` pass **207/207**, 29 file; `pnpm simulate --maxWorkers=1 --minWorkers=1` pass **120/120**, 11 file. Test P5 economy cần timeout 30 s thay 15 s vì workload sau tích hợp; vẫn chạy đủ 30 seed × 3 chiến lược và giữ nguyên assertion.

## Kiểm tra thủ công và tự review

IAB localhost, seed 17: đã bấm bắt đầu ván `integrated-checkpoint` ở 1450 m, thấy HUD/camera/chướng ngại, ngã sau va chạm traffic, pause và restart. Trong `integrated-hazards` ở 1870 m, thấy xe trôi về mép đường sau vùng gió; ở 2132 m thấy kiện đang lăn và cue 32 m trong cùng ván; tiếp tục tới khoảng 3900 m và restart đưa đầy đủ tài nguyên về đầu checkpoint. Ảnh mới của cùng ván: [cảnh báo gió 59 m tới mép vùng](evidence/p63-integrated-wind.png) và [cue đồ rơi 63 m](evidence/p63-integrated-cargo.png). Ảnh chứng minh hình/cue tại một thời điểm, không tự chứng minh timing/điều khiển; phần đó lấy từ quan sát IAB liên tiếp và simulation. Ca `stress` seed 17, không lái: sau khi xe dự phòng được dùng, HP về 0 ở 435 m / 0:46, màn kết quả ghi một lượt; bấm “Chơi lại” đưa xăng/HP/tiền về đầu ca. Các bản thử riêng P6.2/P6.3 còn hoạt động.

Game design — dữ kiện: 3–5 vùng gió và 4–5 đồ rơi mỗi ván pilot 240 s, không tăng slot hazard; gió có thể kéo xe lệch tới mép nếu không chống lái, người chơi có đường bù A/D vì 1,5 m/s < tốc độ lái 5 m/s. Ý kiến: nhịp chưa chắc đủ căng như mong muốn; **ĐỀ XUẤT** ở P8 thử tăng tần suất cặp gió/đồ rơi trên cùng seed sau khi đo thời gian phản ứng, số va chạm công bằng và tỷ lệ sống, tránh tăng damage hoặc ghép nhiều nguồn bất khả thi trước.

UX — dữ kiện: modal đầu ván nêu gió, đồ rơi và nước không đẩy; cue gió tính khoảng cách tới mép vùng thay vì tâm; cue nguồn báo sắp rơi và icon vật báo hướng sau cú rơi. Ý kiến ưu tiên trung bình: cần người chơi đánh giá mức dễ thấy của kiện nhỏ khi road/camera đang lệch do gió, đặc biệt khi giữ W. Nếu khó đọc, tăng tương phản/cue chứ chưa đánh giá art hoàn chỉnh ở giai đoạn này. Chưa đo phản xạ người chơi, accessibility hoặc hiệu năng trên máy khác.

Chưa có CI/PR do repo không có remote; không merge. Review con người cho revision tích hợp hiện tại: đang chờ chủ dự án chơi thử và nhận xét.
