# WORLD-LIGHT sau 5 km — tự đánh giá bản thử 10/11/2026

## Phạm vi và quyết định

Bản thử này triển khai đề xuất WORLD-LIGHT trong `PHUONG_AN_WORLD_2026-11-10.md` trên nền `685a9c0`, cộng cửa R và lịch tàu đã yêu cầu trước đó. Không thêm phí xăng theo thời gian/bò chậm; không giảm thu nhập theo km hoặc nhân damage theo km. `src/survival.ts`, `src/vehicles.ts`, luật nước 0,55 L/s và lượng hồi từng món không đổi. `ver.noforce` giữ lịch cũ. Mọi số mới là **TẠM**, cần chủ dự án chơi thử.

- Normal sau 5/8 km: khoảng tâm 19/18 m; W-template nước dài ×1,20/×1,35. Nếu nước mới trùng footprint ngang/dọc với nước khác, rút ngắn hoặc bỏ đúng actor nước đó; các actor khác của nhóm vẫn sinh nếu còn phương án lái khả thi. Pattern nước bổ sung bởi special cũng tránh trùng sau 5 km.
- Xăng sau trạm 5.280 m: 600 m, sau trạm đầu ≥8 km: 720 m; HP tương ứng 1.200/1.400 m sau trạm 5.650 m. Shop đầu 280/1.050 m giữ nguyên; gap shop sau lấy theo vị trí shop trước, 900–1.260 m sau 5 km và 1.080–1.440 m sau 8 km. Giá/lượng mỗi giao dịch không đổi.
- Cửa R tính theo tọa độ shop: ±16 m dọc đường cho **mọi shop từ đầu ván**; `ver.noforce` giữ ±30 m. Input, HUD, giao dịch và dọn entity dùng cùng hàm; lateral 1,8 m và shop clearance 45 m giữ nguyên.
- Special giữ 20 outcome không phải tàu trong 25 slot; tàu 5/25, gap slot 320 m trước 5 km và 300 m sau, tàu đã sinh cách nhau ≥600 m. Điều kiện chờ loại nước/ổ gà kín cả đường và gió khỏi vùng chờ; hazard hẹp còn có thể xuất hiện nếu để được lối khô. Tàu không đổi chiều dài, tốc độ, 4 giây băng qua, collision hoặc secret.

## Simulation và quan sát thực tế

**Báo cáo thử độc lập của chat cân bằng, chưa phải kiểm chứng bản ghép cuối:** checkpoint 5 km có hai xe đầy tài nguyên và nâng cấp cấp 1, 500 tiền, ba khách, bot đổi xe/tiếp tế/phanh; 60 seed xe máy + car4: P50 phần chơi còn lại baseline 484 s → WORLD-LIGHT 354 s, số lượt thêm ≥20 phút 8/60 → 0/60. Mẫu 12 seed mô tô + car7: 650 → 435 s. Phép thử này chưa ghép lịch tàu mới và chưa có xử lý overlap nước; không dùng làm median toàn ván hay cảm nhận người thật.

**Cửa R sau cập nhật toàn ván:** 30 seed × hai kiểu tốc độ trên tuyến có hazard với bot ưu tiên khách rồi shop: 30/30 lượt mỗi kiểu mua được car4 ở shop đầu; median lần lượt 21,4 s và 13,38 s. Đây là bài thử script, không chứng minh người chơi sẽ bấm R kịp ở mọi tốc độ. Test biên còn xác nhận R và giao dịch ở trong/ngoài ±16 m tại 280/1.050/5.100/9.000 m, entity tồn tại tới mép sau rồi dọn, và `ver.noforce` giữ ±30 m.

**Trên code ghép, generator không có pilot:** 30 seed, 0–12 km, car4 làm tham chiếu, 225 tàu planned và 214 tàu spawned (7,13/đường), so với khoảng 5,73/đường trong audit baseline của báo cáo (+24,5% theo hai mẫu tương ứng). 20 seed từ 5–12 km: 2.107 nhóm normal tâm 5–8 km, 2.991 nhóm 8–12 km; 192 vũng rộng/dài, 100/120 bình xăng và 40/60 bộ HP ở hai đoạn, 59/61 shop, 86 tàu. Lấy mẫu tâm ba làn mỗi 20 m: 6.209/21.000 điểm nằm trong nước (29,6%), **0 điểm có hai nước chồng**. Tàu trong mẫu không có nước kín ba làn ở dải chờ −62 đến +12 m. Đây là mật độ **sinh ra**, không phải số gặp sau rẽ/va chạm; tỷ lệ nhóm normal thực còn chịu reject an toàn và không tăng đúng tỷ lệ gap danh nghĩa.

**Trình duyệt IAB, seed 17, bản Vite local:** ván thường khởi động 0 m, W/A làm tốc độ/quãng đường/HUD đổi; fixture shop mở bằng R ngay đầu ván, bơm +4,0 L và trừ 120 tiền đúng, tạm dừng/chơi lại trả về tài nguyên đầu. Checkpoint `?scenario=late-balance&seed=17` mở ở 5.000 m với car4 + xe máy; Tab đổi sang xe dự phòng, W/S đổi tốc, va traffic làm ngã và mất 26 HP, Esc tạm dừng, chơi lại trở về 5.000 m/xe ban đầu. Sau chỉnh cửa shop, IAB xác nhận lại R/giao dịch đầu ván và Tab/Esc/restart tại checkpoint. Chưa điều khiển thủ công qua một tàu sau 5 km, shop late ±16 m hoặc QTE trong lượt browser này; test simulation bảo vệ collision tàu, fork và shop boundary.

## Tự review

**Game design — dữ kiện:** tàu sinh nhiều hơn, vùng nước nhìn thấy và khoảng tiếp tế dài hơn; bài kiểm tra không thấy phí nước chồng trong 20 seed. **Nhận định:** đây là sức ép có cue, cho phép phanh/chọn lane/đổi xe vẫn có ích. Rủi ro là xăng trở thành nguyên nhân thua áp đảo; probe độc lập WORLD-LIGHT trước khi xử lý overlap có 15/20 lượt hết xăng. **ĐỀ XUẤT chưa áp dụng:** nếu chơi thử chỉ còn lo xăng, thử gap 540/660 m và đo lại cùng seed trước khi đụng income/damage. Kiểm thêm đường sống khi chờ tàu cạnh nước một/hai lane, quyết định rẽ, Grab và shop bỏ lỡ.

**UI/UX — tự đánh giá từ IAB:** cue shop mở được khi xe gần và giao dịch giữ pause; HUD xăng/HP/tiền phản hồi đúng. Cửa ±16 m từ shop đầu ở tốc độ nitro có thể khó bấm; cần chơi thử shop đầu và shop sau 5 km trên màn 9:16, kiểm cue 120 m trước khi chốt. Cần quan sát warning tàu thật, QTE và nước dài trong chuyển động; ảnh tĩnh không chứng minh timing. Không sửa art/UI polish trong lượt cân bằng này.

## Gate và bàn giao

Windows, Node/pnpm theo lockfile repo, worktree `codex/late-balance-round-a` từ `origin/main` 685a9c0. `pnpm lint` exit 0; `pnpm typecheck` exit 0; `pnpm exec vitest run --configLoader native --maxWorkers=4 --reporter=dot` exit 0, 86 file/485 test; `pnpm build` exit 0, có cảnh báo chunk Three.js 568 kB đã tồn tại. `git diff --check` exit 0. CI/review con người/merge sẽ ghi sau push/PR; chưa gọi bản thử độc lập hoặc compile là bằng chứng đã nghiệm thu gameplay. Bản chạy thử riêng: `pnpm dev --port 5174` tại worktree này, mở `http://127.0.0.1:5174/?scenario=late-balance&seed=17`; ván từ đầu tại `http://127.0.0.1:5174/?seed=17`. Main ở cổng 5173 không chứa cân bằng này trước khi PR được merge.
