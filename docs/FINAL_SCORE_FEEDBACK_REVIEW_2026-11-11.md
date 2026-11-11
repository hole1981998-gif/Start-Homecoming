# Review tuning điểm và nhịp kết ván — 11/11/2026

## Phạm vi và bằng chứng

- Base: `3e3dc6e` (`origin/main` ngày 11/11/2026); branch `codex/final-score-feedback`.
- Config gameplay: `hybrid-late-b-trial-1`; test nhặt điểm dùng seed 17 và vị trí gói điểm có kiểm soát. Không đổi giá trị điểm, tần suất sinh, hitbox hay công thức tính.
- Gói điểm 3D tăng kích thước octahedron từ 0,27 m lên 0,48 m, nâng vật thể và thêm halo sáng đơn giản. Âm chime tăng gain từ 0,07 lên 0,14, phát ở playback rate gốc. Thông số âm lượng là tuning TẠM, cần nghe trên thiết bị thật.
- Popup `+50 ĐIỂM` dùng cùng luồng event 3 giây và tùy chọn popup vui. Card giải thích lần đầu xuất hiện trước gói điểm, tạm dừng an toàn và xem lại được trong Help. Màn hình kết quả chờ 2 giây sau terminal event; simulation đã kết thúc, cảnh và thời tiết tiếp tục được vẽ/animate trong lúc chờ.
- Simulation/test kiểm tra nhặt đúng một lần, tiền không đổi, popup không lặp, card được phân loại và âm không bị đổi playback rate. Đây là test tự động, không phải bằng chứng cảm giác điều khiển hoặc âm lượng thực tế.
- Chrome đã tải được trang bắt đầu tại `http://127.0.0.1:5173/`. Công cụ điều khiển trình duyệt dừng trước khi bấm Bắt đầu lái, nên **CHƯA KIỂM TRA THỦ CÔNG**: hình điểm ở 450 m, âm nhặt điểm, popup, card, thất bại, 2 giây chuyển bảng điểm, restart, camera/HUD và input.

## Tự review từ dữ liệu trên

**Game designer.** Dữ kiện: luật điểm và RNG không đổi; gói đầu tiên vẫn ở 450 m, thưởng 50 điểm. Nhận định: vật thể rõ hơn có thể khiến người chơi muốn lao vào làn nguy hiểm; card nhắc ưu tiên đường an toàn. ĐỀ XUẤT cho vòng sau: thử cùng seed và input ở tốc độ chậm/trung vị/nhanh, ghi tỷ lệ bỏ qua gói điểm và va chạm quanh gói trước khi chỉnh mật độ hay giá trị điểm. Chưa áp dụng thay đổi cân bằng lớn.

**UI/UX designer.** Ưu tiên cao: xem trực tiếp card có hiện trong safe window và có che QTE hay không; đo bằng một lượt chạy tới 450 m. Ưu tiên vừa: kiểm tra marker `+50 ĐIỂM` có đủ tương phản mà không che đường/HUD, cả khi tắt popup vui; so với HUD điểm tăng. Ưu tiên vừa: kiểm tra 2 giây sau terminal event đủ xem nguyên nhân thất bại và không gây hiểu nhầm là vẫn điều khiển được. Cần chơi thử ở Chrome để kết luận.

## Follow-up popup điểm và âm sấm — 11/11/2026

- Cùng branch, sau commit `456be6e`; seed kiểm tra trình duyệt: 17, config `hybrid-late-b-trial-1`, ChatGPT in-app browser. Lượt chạy từ đầu đến khoảng 445 m bằng cruise tự động, có va chạm nên vận tốc và HP biến động. Ở ảnh hiện tại, viên điểm vàng lớn nhìn thấy trên mặt đường phía trước; chưa thu thập viên đó nên **chưa xác nhận popup trong gameplay**, âm nhặt điểm hay cảm giác quay bằng mắt. Không dùng ảnh tĩnh làm bằng chứng tốc độ quay.
- Theo yêu cầu chủ dự án, popup điểm dùng asset mới tạo từ ảnh tham chiếu popup Hết xăng, tông xanh lá như xăng/sửa; caption theo giá trị `roadScore.value` là live text phủ lên dải xanh để đọc rõ. Asset được tạo bằng imagegen, thu kích thước xuất bản từ 1705×923 xuống 512×277 px (287 KB), rồi đặt tại `public/ui/event-popups/score.png`. Prompt: thẻ bo góc tỷ lệ 170:92, minh họa 2D phẳng người lái xe máy nhặt kim cương vàng trên đường mưa, bảng màu emerald/mint, bong bóng biểu tượng kim cương, dải xanh đậm trống phía dưới, không có chữ. Đây là art được chủ dự án yêu cầu trực tiếp cho popup này, không mở rộng sang art khác.
- Tốc độ quay của viên điểm tăng từ 0,7 lên 0,95 rad/s; halo đổi từ 0,35 lên 0,45 rad/s ngược chiều. Geometry, hitbox và điểm thưởng giữ nguyên.
- Audio code: `distant_thunder_loop` là một lớp sấm nền lặp liên tục; `lightning_distant_a` và `b` là one-shot luân phiên, có thể chồng lên lớp nền. One-shot trước đó cách 14–22 s ở lần đầu rồi 27–43 s; follow-up thử 8–14 s lần đầu, sau đó 16–26 s. Không ép hai one-shot chồng cùng lúc. Các khoảng thời gian là TẠM; chưa nghe trên loa/tai nghe thật, chưa kết luận cảm giác âm thanh đạt.
- Test liên quan kiểm tra lịch sấm có seed, asset popup tồn tại, popup điểm lấy đúng ảnh và logic nhặt điểm một lần. Lint/typecheck/build/test toàn bộ ghi trong phần bàn giao, không tính là playtest âm thanh.

**Tự review game designer từ code và ảnh:** Gói điểm rõ hơn có thể thúc đẩy đổi làn để nhặt; cần thử cùng seed với các tốc độ khác nhau và ghi va chạm cạnh điểm. Tiếng sấm xa thường xuyên hơn có thể làm thời tiết sống động nhưng dễ mỏi nếu quá dày; nghe ít nhất một lượt 4 phút ở âm lượng mặc định trước khi chốt. **ĐỀ XUẤT:** chỉ cân lại cadence sau khi nghe lượt đó, không tăng thêm gain lúc này.

**Tự review UI/UX từ code và ảnh:** Popup mới theo ngôn ngữ card sự kiện hiện có; cần kiểm tra live caption trong dải xanh ở kích thước khung chơi nhỏ, và đảm bảo popup không che QTE. Card giải thích điểm đã có, nhưng lượt kiểm tra trình duyệt này không thấy card do trạng thái discovery cục bộ; cần thử profile mới hoặc bật giới thiệu lại trong Help. Ưu tiên cao: xác minh popup thật sau khi nhặt; ưu tiên vừa: tốc độ quay và nghe âm sấm trực tiếp.
