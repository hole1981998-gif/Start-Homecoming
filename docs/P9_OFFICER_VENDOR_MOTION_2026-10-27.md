# P9 — chuyển động công an, dân phòng và hàng rong (Codex tự review, 27/10/2026)

## Thay đổi

- Công an giữ một tay ra hiệu dừng, dao động nhẹ theo thời gian mô phỏng; dân phòng vẫy tay cao hơn và xoay người điều hướng. Khi choáng, cả hai trở về pose hồi phục, không tiếp tục ra hiệu.
- Người bán đặt hai tay hướng tới tay đẩy, thân hơi chúi theo bước; bánh xe có dấu nhận hướng và quay khi di chuyển, thùng hàng nhún nhẹ. Khi đứng yên/choáng, bánh dừng.
- Sau review code, thứ tự xoay bánh được cố định để trục bánh luôn nằm ngang khi lăn; test kiểm trục ở hai thời điểm khác nhau.
- Chỉ sửa khớp, vị trí cục bộ của thùng hàng và góc bánh. Root/crossMotion, hitbox, collider, gameplay RNG và damage giữ nguyên. Base là PR cảnh P9 nên nhánh này phải review sau PR cảnh.

## Kiểm tra hiện vật

- Edge headless 540 × 960, seed 17: [công an](evidence/p9-officer-vendor-motion/p61-police-one-seed17.png) ở khoảng 43 m, [dân phòng](evidence/p9-officer-vendor-motion/p61-militia-two-seed17.png) ở khoảng 45 m, [hàng rong](evidence/p9-officer-vendor-motion/p61-vendor-seed17.png) ở khoảng 45 m. Mỗi fixture đã đóng card lần đầu và chạy tới gần NPC; không có page error. Ảnh đơn lẻ chỉ cho thấy dáng, không chứng minh chuyển động theo thời gian.
- Cho fixture hàng rong chạy tiếp 49→89 m, HP còn 123: lượt này **không va chạm**, nên không khẳng định đã kiểm hiệu ứng ngã. Bấm restart đưa về 0 m; không có page error.
- Unit test lấy hai thời điểm khác nhau để kiểm cử chỉ thay đổi, cùng thời điểm cho kết quả giống nhau; bánh chỉ quay khi đẩy và root không di chuyển bởi animation. Test không thay thế playtest hình ảnh thực thời gian.

## Gate trên mã cuối

Windows, Node 24, pnpm 11.25. `pnpm lint` pass/exit 0; `pnpm typecheck` pass/exit 0; `pnpm test --maxWorkers=2` pass/exit 0 (63 file, 382 test); `pnpm build` pass/exit 0. Build còn cảnh báo bundle Three.js >500 kB. Sau sửa trục bánh, fixture hàng rong được mở lại trong Edge ở 47–48 m, không có page error.

## Tự review sau test

- **Game designer — dữ kiện:** phạm vi va chạm và lịch xuất hiện không đổi. **ĐỀ XUẤT:** trong playtest người thật, so khả năng nhận diện công an/dân phòng và xe hàng rong ở tốc độ 50–90 km/h dưới bóng mây; chỉ cân bằng cảnh báo nếu có bằng chứng đọc chậm.
- **UI/UX designer — ưu tiên P2:** cử chỉ hiện nằm trong silhouette NPC nhỏ ở xa; icon cảnh báo vẫn là cue chính. Cần xem thực trên màn hình nhỏ/giảm animation; screenshot chưa đo cảm giác và timing.
- **Art direction — tự đánh giá giới hạn:** silhouette 6/10, sáng tối 6/10, màu/mood 6/10, hình khối 6/10, ánh sáng/vật liệu 6/10, UI/typography 6/10, nhất quán 6/10, tiếp cận/hiệu năng 6/10 trên ba fixture nêu trên. Không có art director độc lập hay phê duyệt của chủ dự án trong lượt này.
