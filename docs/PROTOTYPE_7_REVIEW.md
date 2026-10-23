# P7 — kết ván bí mật và tình huống thử

Ngày 19/10/2026. Revision đang phát triển trên `codex/p7-secret-ending`; config `p7-secret-1`, seed 17. Đây là tự đánh giá của Codex từ simulation và thao tác trình duyệt, không phải đánh giá độc lập. Quyết định thiết kế lấy từ GAME_DESIGN.md: mua ô tô 4 chỗ khi xe rỗng, giữ ba hành khách, dùng nitro nhảy qua tàu đang chuyển động và hạ xuống phía xa, sau đó chạm một vụ tai nạn thật. Rơi khách hoặc đổi xe đặt lại chuỗi. Tàu chạm xe vẫn kết ván; kết bí mật được xét trước damage tai nạn hợp lệ.

**Cập nhật luật sau feedback:** ô tô 4 chỗ có thể mua mới hoặc đổi sang; nếu đã có khách thì cho hết khách xuống rồi đón ba khách mới. Vượt tàu và va xe chướng ngại hoặc tai nạn theo thứ tự, không cần nối liền. Mô tả mua xe rỗng và accident-only trong câu lịch sử ở trên đã được thay thế.

## Bản thử để chủ dự án chơi

`http://127.0.0.1:5173/?scenario=p7-secret&seed=17` là checkpoint DEV sau hai bước đầu. Xe đã có ba khách và một nitro; tàu chạy ngang cách khoảng 15 m, tai nạn cách 48 m. Bấm **Bắt đầu lái**, ngay sau đó bấm **1** rồi **Space** để bật nitro và nhảy. Xe hạ xuống sau tàu và chạy vào tai nạn để mở kết bí mật. Nếu chạm tàu khi chưa nhảy, ván kết thúc bình thường; bấm **Chơi lại** để thử tiếp. Bản thường `/` không tự cấp ô tô, khách hoặc nitro.

Thay `scenario=p7-secret` thành `scenario=p7-secret-traffic` để thử kết bằng va vào xe chướng ngại. Hai fixture đặt contact gần để QA nhanh; ván thường không đặt giới hạn thời gian hay quãng đường giữa tàu và contact cuối.

Sau cập nhật luật, Codex đã thử trực tiếp nhánh traffic trên in-app browser: Bắt đầu → `1` → Space, vượt tàu và kết “Đã về nhà!” tại 40 m khi chạm xe chướng ngại, xe vẫn 120 HP và đủ ba khách. Test mô phỏng cũng kiểm tra mua mới/đổi sang ô tô, khách cũ phải xuống hết, va tàu khi không nhảy và cả hai loại contact cuối. Đây là bằng chứng chức năng, chưa phải playtest cảm giác dài hạn của chuỗi trong ván thường.

## Bằng chứng

- Kiểm tra trực tiếp bằng in-app browser tại URL trên: nhấn Bắt đầu, `1`, Space; UI báo nitro 3,8 s, tàu cách 13 m. Sau khoảng 2 giây, kết ván tại 43 m với “Đã về nhà!”, ba khách còn trên xe, độ bền 120 HP, huy hiệu và bảng điểm trên máy hiện ra. Thử lần nữa không bấm phím: xe chạm tàu tại 12 m, kết ván “Va chạm tàu hoả”. Chơi lại đưa về checkpoint ban đầu. Cảnh báo tàu là graphic/world cue; thử này xác minh input, thất bại và restart.
- Simulation P7 dùng thực thể tàu có chuyển động ngang và accident cùng hệ collision của ván; nhảy qua đủ cao/hạ sau tàu mở bước cuối. Không nhảy thì tàu kết ván. Kết quả như nhau ở 30/60/144 FPS. Test mua ô tô thật, đón đủ ba khách, bỏ khách/đổi xe và lưu huy hiệu/bảng điểm chống ghi trùng.
- Bộ simulation và playtest nền tiếp tục chạy để phát hiện hồi quy. Con số economy, độ hiếm tàu và tai nạn vẫn là TẠM.

## Tự review gameplay và UX

**Quan sát:** checkpoint đưa người chơi tới chuỗi tàu → tai nạn trong vài giây, giải quyết việc phải lái lâu mới gặp được điều kiện hiếm. Va tàu trước khi nhảy vẫn kết ván, nên không có đường tắt bằng nitro đơn thuần. **Ý kiến game design:** bước cuối có thể quá phụ thuộc RNG trong ván thường; P8 nên đo xác suất hoàn thành trên nhiều seed, thời gian săn chuỗi và mức đọc được của tai nạn sau tàu, rồi đề xuất tuning riêng. Không tăng mật độ ván thường ở P7 chỉ dựa trên một ca DEV.

**Quan sát UX:** ca thử có hướng dẫn phím ngay trước khi bắt đầu, cue tàu theo khoảng cách và kết quả hiện rõ. **Ý kiến UX:** màn kết bí mật/leaderboard còn dùng typography prototype; P9 nên đánh giá hierarchy, khoảng trống và viewport nhỏ. Bản chơi cần đo người mới hiểu thời điểm bấm Space hay không; screenshot kết thúc không chứng minh timing dễ đọc. Ưu tiên kiểm chứng phản hồi chơi thực trước khi polish.

## Bàn giao

Trên Windows tại revision làm việc cuối: `pnpm lint` exit 0; `pnpm typecheck` exit 0; `pnpm test` exit 0 (30 files, 212 tests); `pnpm build` exit 0; `pnpm simulate` exit 0 (11 files, 120 tests). Lần chạy test đầu cùng lúc với build/simulate có một timeout 5 giây ở test discovery cũ; chạy lại riêng toàn bộ suite qua, không tăng timeout hoặc bỏ test. Sau đó thêm assertion traffic cách 130 m và chạy lại `tests/secret-ending.test.ts` qua 4/4. Manual đã kiểm tra chuỗi chính trên in-app browser; chưa chơi thủ công một ván thường từ đầu tới kết bí mật vì mật độ hiện tại thấp. Không đổi mật độ/economy. Chờ chủ dự án chơi checkpoint và phản hồi. Chưa có remote/CI/PR ở checkout này; chưa merge.
