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
