# Kiểm tra sửa chướng ngại ở nhánh rẽ

Revision kiểm tra: `fix/junction-branch-hazards` (working tree trước commit). Config `p4a-branch-hazards-1`; test seed 17 và mẫu QTE 30 seed của bộ test hiện có. Không đổi các số economy/tài nguyên. Tự kiểm tra bởi Codex, không phải review độc lập.

## Dữ kiện kiểm tra

- `pnpm lint`: exit 0. `pnpm typecheck`: exit 0. `pnpm test`: exit 0, 53/53 test. `pnpm build`: exit 0; Vite có cảnh báo chunk trên 500 kB, không phải lỗi build.
- Unit/integration seed 17: chướng ngại cũ nằm trên route cũ sau Q/E; nhánh trái và phải có ID, loại và vị trí không gian riêng; world cũ rời vùng dữ liệu sau giao lộ 65 m. Bấm Q/E sớm hay muộn cùng một giao lộ cho cùng nhánh. Xe ở đường thẳng bỏ lại không va chạm với xe đã rẽ. Mẫu 30 seed QTE: 30/30 lượt bỏ lỡ nhánh thẳng bị chắn bị xử lý, 30/30 lượt rẽ kịp tránh được.
- Simulation economy hiện có, 30 seed mỗi chiến thuật: cruise đạt 800 tiền 30/30, trung vị 85,7 s; giữ W 30/30, 61,2 s; giữ S 28/30, 149,8 s. Đây là kết quả bộ test, không phải đo cảm giác lái từ người chơi.
- Manual trong in-app browser tại `127.0.0.1:5173`: fixture `?scenario=branch-hazard`, seed 17, giao lộ 1600 m, bắt đầu 1582 m. Bấm Q và E ở hai lượt riêng: cue chọn đúng trái/phải, HUD/quãng đường tiếp tục chạy và camera theo nhánh. Fixture `?scenario=blocked-window`, không bấm Q/E: đường thẳng bị chắn trừ 20 HP một lần, xe vào trạng thái trôi/ngã; nút chơi lại về trạng thái sẵn sàng 70 HP và 5,5 L. Ảnh nhìn trong lượt manual xác nhận cue và chuyển cảnh; ảnh riêng không chứng minh phép tách entity, phần đó được test logic ở trên. Chưa kiểm tra bằng tay chuyến đi nhiều giao lộ liên tiếp hoặc thiết bị di động.
- Product Design plugin audit tool không có trong danh sách tool khả dụng của lượt này; dùng checklist UX thủ công từ màn hình đang chạy.

## Tự review game design

Dữ kiện: rẽ không còn biến chướng ngại đường thẳng đã nhìn thấy thành vật cản ở nhánh mới, trong khi khoảng hazard và vùng quyết định an toàn không đổi. Chướng ngại nhánh trái/phải khác loại tại cùng mốc dọc, giúp lựa chọn có hậu quả riêng mà không thêm phạt ngầm. Chưa có dữ liệu chơi người thật để kết luận nhịp hay độ khó đã đạt.

**ĐỀ XUẤT, chưa áp dụng:** ở vòng P4B, đo 30–100 seed và các chuỗi rẽ liên tiếp về tỷ lệ nhánh không có lối khả thi, thời gian phản ứng sau cua, lượng xăng/HP lúc ra giao lộ và tỷ lệ chọn nhánh. Nếu nhánh sau cua gây bất ngờ quá sát, tăng hành lang đọc được hoặc cue sớm trước khi tăng mật độ. Hỏi chủ dự án về cảm giác rẽ trong bản chơi thử rồi mới đổi số cân bằng lớn.

## Tự review UI/UX

Ưu tiên cao: cue Q/E và trạng thái đã chọn hiện rõ trong lượt manual; màn hình sau cua giữ HUD xăng/HP và quãng đường đọc được. Va chạm đường bị chắn có thông báo damage và tư thế tài xế trực quan; restart rõ. Điểm chưa đủ chứng cứ: ảnh tĩnh không chứng minh cảm giác xoay camera, độ mượt, tầm nhìn chướng ngại sau cua hoặc thao tác trên bàn phím khác. Cần người chơi thử ở nhiều tốc độ và phản hồi cụ thể trước khi chỉnh camera/UI. Không làm art polish trong sửa logic này.

## Bàn giao

Repo hiện không có remote nên không fetch/push/CI/PR; không merge. Sau commit, đối chiếu commit ID với kết quả trên; các gate cần chạy lại nếu code đổi.
