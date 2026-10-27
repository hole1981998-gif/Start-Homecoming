# P9 — sửa animation nhân vật đứng hình (tự review, 27/10/2026)

## Nguyên nhân và thay đổi

- Trong bản chơi, `prefers-reduced-motion: reduce` khiến `visualTime` của nhân vật bằng 0; NPC đi, vẫy, khách trên xe và tài xế nhìn gần như đứng hình. Trình duyệt đang dùng để QA thật sự trả `reducedMotion: true`. Animation pose báo trạng thái chơi giờ luôn lấy `activeSeconds` của simulation, nên vẫn dừng đúng khi pause và chạy lại đúng khi restart. Không đổi vận tốc/root motion hoặc nhịp hazard.
- Trang `art-preview/people.html` trước chỉ vẽ một pose tĩnh ở phase 0,25 khi đổi lựa chọn. Nay chạy vòng render theo frame cho walk, hail, idle, riding và các pose theo phase. GLB tài xế reset pivot về rest mỗi frame để không tích lũy xoay; frame đầu được vẽ ngay sau chọn pose.

## Kiểm tra thủ công

ChatGPT in-app browser, `art-preview/people.html`, nhân vật học sinh: hai ảnh liên tiếp ở walk cho thấy vị trí chân thay đổi; hai ảnh hail cho thấy tay đổi từ giơ cao sang ngang và quay lại theo chu kỳ. Driver GLB ở walk có dáng chân bước khi chọn. Preview đã mở trong tab có thể xem trực tiếp. Các pose crash và ngồi được nối với phase nhưng chưa kiểm hết bằng chuỗi screenshot dài. Cần QA thêm trong bản chơi ở nhiều seed, nhất là NPC nhỏ xa camera.

## Gate tự động

- `pnpm lint`: pass, exit 0. `pnpm typecheck`: pass, exit 0.
- `pnpm test --maxWorkers=2`: pass 63 file, 379/379 test, exit 0.
- `pnpm build`: pass, exit 0; Vite cảnh báo bundle Three.js >500 kB.

## Tự review

Game design: không đổi simulation. UI/UX: đi và vẫy là cue trạng thái có ý nghĩa, không còn bị vô hiệu do chế độ giảm hiệu ứng màn hình. Art: animation procedural còn đơn giản; việc hết đứng hình không đồng nghĩa đã duyệt độ mượt cuối.
