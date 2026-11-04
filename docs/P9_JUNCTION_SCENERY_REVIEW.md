# P9 — khoảng trống cảnh tại giao lộ (tự review)

- Revision kiểm tra: `codex/p9-junction-scenery`, base `7c3b527` (trước commit).
- Cấu hình: `p8-encounter-c3-refinement-1`; Edge/Windows, viewport 1000 × 840, seed 14, fixture DEV `/?scenario=junction&seed=14` bắt đầu cách giao lộ đầu 95 m.
- Thao tác thực: bấm Bắt đầu, giữ W, đợi cue chọn lối bật rồi nhấn Q hoặc E tại 764 m; tiếp tục đến 801 m. Edge nhận lần lượt “ĐÃ CHỌN TRÁI” và “ĐÃ CHỌN PHẢI”; không có lỗi JavaScript. Ảnh: [Q](evidence/p9-junction-scenery-q-seed14.png), [E](evidence/p9-junction-scenery-e-seed14.png).
- Kiểm tra hình học tự động: vùng cảnh 4 m chừa lối đường ngang trước khi chọn và sau cả hai hướng rẽ; 17 bài kiểm tra cảnh qua. Lint, typecheck, test đầy đủ (59 file/357 test) và production build qua. Build có cảnh báo kích thước chunk Three.js đã tồn tại.

## Game design review — tự đánh giá từ fixture và ảnh

- Dữ kiện: Q/E được nhận trong cửa sổ giao lộ; vùng trang trí không che nhánh rẽ ở hai ảnh tại 801 m. Cảnh trang trí không đổi collider, spawn hay RNG gameplay.
- Nhận xét: khoảng lề trống 40 m quanh giao lộ giúp nhận dạng lối rẽ sớm hơn, có thể làm cảnh hơi thưa. **ĐỀ XUẤT:** sau khi có số liệu chơi thật, nếu nhịp cảnh quá trống thì thử các chi tiết nhỏ ngoài footprint đường ngang, đo lại khoảng hở trên nhiều seed; không tăng hazard hay thu hẹp cửa sổ Q/E chỉ để lấp khoảng trống.

## UI/UX review — tự đánh giá từ Edge và ảnh

- Ưu tiên cao: đường rẽ phải đọc được trước và sau thao tác; hai hướng đạt trong lượt này. Cue chọn lối hiện trạng thái đã chọn đúng.
- Ưu tiên thấp: mép giữa nhựa đường và lề gần giao lộ còn tạo mảng lớn phẳng ở góc camera; kiểm tiếp trên màn hình nhỏ và seed khác. Ảnh không chứng minh cảm giác lái hoặc mức công bằng của mọi seed.

Giới hạn: chưa có đánh giá độc lập, chưa đo FPS/GPU trên thiết bị đích. Đây là sửa cảnh placeholder; chưa duyệt art direction cuối.
