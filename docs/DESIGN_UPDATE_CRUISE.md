# Quyết định thiết kế — tốc độ trung vị

**Trạng thái hiện tại:** P1.2 đã triển khai cruise xe máy và cập nhật HUD/Help; xem PROTOTYPE_1_2_REVIEW.md. Các mục bên dưới ghi lại lịch sử quyết định/lượt kiểm tra trước triển khai; passenger cruise và các hệ thống tương tác còn chờ prototype tương ứng.

Ngày 17/10/2026. Nguồn: yêu cầu trực tiếp của chủ dự án trong chat sau playtest P1. Cập nhật trên branch P1 đang review, phạm vi chỉ tài liệu; không tạo feature code phụ thuộc hoặc tự merge main. Không có remote để lấy base mới, push/PR/CI; bàn giao local và patch theo fallback AGENTS.md.

## Đã chốt

- Mỗi loại xe có cruiseSpeed riêng. Không giữ W/S thì tốc độ tự hồi về mốc từ phía nhanh hơn hoặc chậm hơn. Phải giữ W/S để duy trì nhanh/chậm.
- Mục tiêu economy đã xác nhận ở lượt trước: có cơ hội mua ô tô đầu tiên sau 3–5 phút gameplay hoạt động trong lượt đại diện.

## Đề xuất và số tạm

- Hồi tốc êm, không overshoot; giữ W+S ưu tiên S; pause không hồi, resume không dùng input giữ cũ.
- Bảng cruise ban đầu lấy trung điểm min/max, toàn bộ còn TẠM. Ví dụ xe máy min/cruise/max = 8/14/20 m/s.
- ReturnAcceleration 3 m/s², returnDeceleration 4 m/s² là TẠM; chưa được simulation/playtest bằng luật mới.
- Đề xuất ban đầu chỉ hạ cruise theo quá tải đã được thay bằng quyết định bổ sung bên dưới. Engine upgrade chưa tự nâng cruise; đổi xe không tặng tăng tốc tức thì; coasting/nitro/QTE có ưu tiên riêng.

## Bổ sung của chủ dự án: cruise giảm theo từng khách

ĐÃ CHỐT: khách tăng thì cruise giảm kể cả chưa quá tải, tới sàn theo từng xe/tình huống; có thể chạm min hoặc dừng trên min. Tài xế không chịu phạt như một khách thêm. ĐỀ XUẤT: `max(riderCruiseFloorSpeed, baseCruiseSpeed - n * cruiseLossPerRider)`, sau đó clamp min/max hiệu dụng. Các hệ số riêng từng xe chưa gán số. Không nhân thêm cùng hệ số quá tải vào cruise; max/fuel vẫn theo luật quá tải cũ. Đón/bỏ khách đổi target êm, đổi xe giữ khách và recompute.

Đã đồng bộ thiết kế, spec, balance và roadmap. Cần review economy theo tiền ròng/phút vì thêm thưởng mỗi mét không bảo đảm thu nhập theo phút tăng khi xe chậm đi. Giữ mục tiêu ô tô đầu tiên 3–5 phút; chưa chỉnh thu nhập/giá. UI sau này phải giải thích target theo tải, tránh người chơi tưởng phím W/S bị lỗi. Đây là tự review thiết kế của Codex, chưa có simulation/playtest cho luật tải khách mới. Bản chạy P1 chưa thay đổi; báo cáo/gates bên dưới chỉ xác nhận build cũ.

Hồi quy sau bổ sung (17/10/2026, 11:26 UTC+7): lint/typecheck/tests/build đều exit 0, 8/8 tests; seed/config/kết quả simulation cũ trùng bảng bên dưới, production hash không đổi. Tự review game design của vòng này: dữ liệu xác nhận không đổi nền cũ, chưa trả lời được mức giảm theo khách hoặc mục tiêu economy; cần simulation có passenger controller khi triển khai. Tự review UI/UX: chưa có UI tải khách để audit, Help/HUD mới phải được kiểm tra bằng build và ảnh hiện tại ở lượt triển khai; không dùng ảnh P1 cũ làm bằng chứng cho luật mới. Manual luật mới vẫn CHƯA KIỂM TRA vì lượt này chỉ cập nhật tài liệu.

Đã cập nhật GAME_DESIGN, TECH_SPEC, BALANCE_CONFIG, ROADMAP và README trong repo. Nguồn đồng bộ ngoài workspace không bị sửa. Báo cáo P1 và logs cũ vẫn nguyên trạng là lịch sử.

## Kiểm tra và tự review vòng hồi quy

Revision gameplay vẫn `5b3ec91`, config `p1.1`, production JS vẫn `index-CsQXXHv8.js`; đây là thay đổi tài liệu trên code không đổi. Windows NT 10.0.22621, Node 24.19.0, pnpm 11.25.0.

- `pnpm lint`: pass, exit 0.
- `pnpm typecheck`: pass, exit 0.
- `pnpm test`: pass, exit 0, 8/8. Chạy lại input simulation cũ 3 seed × 20 phút; seed 17/42/20261017 vẫn lần lượt đạt 14.075,808 / 14.121,993 / 14.463,003 m; seed 42 lặp lại bằng nhau. Đây **không phải** kết quả cruise mới.
- `pnpm build`: pass, exit 0; bundle không thay đổi.
- Diff check không có lỗi whitespace; chỉ tài liệu được thay đổi. Không thêm test mô phỏng bản sao đặc tả.
- Manual cho luật cruise mới: **CHƯA KIỂM TRA THỦ CÔNG**, vì chưa triển khai theo phạm vi yêu cầu chỉ cập nhật design. Không audit ảnh cũ thành UI mới.

**Game-design self-review (Codex):** luật mới phù hợp mục tiêu thao tác thường xuyên; cần kiểm tra việc giữ W/S cùng QTE/tương tác có quá tải tay hay không. Economy phải tính lại theo phân bố thời gian chạy cruise/W/S, không mặc định luôn max speed. Phép tính tĩnh từ bảng tạm: xe máy cruise 14 m/s cần khoảng 35,7 phút để kiếm 600 tiền thiếu mua ô tô nếu không khách/chi phí, nên chưa đạt mốc 3–5 phút. Chưa chỉnh giá/thu nhập; thay đổi lớn cần đề xuất riêng và ý kiến chủ dự án.

**UI/UX self-review (Codex):** Help hiện tại nói thả W giữ tốc độ nên phải sửa cùng revision code sau này; HUD nên giúp nhận ra mốc tự chạy mà không che đường. Ưu tiên hướng dẫn rõ và kiểm tra hồi từ hai phía, sau pause/focus/đổi xe. Không phát sinh art/animation hoàn chỉnh. Không có bằng chứng UX cho cơ chế mới trong lượt tài liệu này.

Review con người: yêu cầu thiết kế được chủ dự án duyệt trực tiếp; cảm giác điều khiển và các số tạm chưa được duyệt qua playtest. Chưa push, chưa PR, chưa CI remote, chưa merge.
