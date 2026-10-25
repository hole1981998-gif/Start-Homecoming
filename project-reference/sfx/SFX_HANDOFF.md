# Bàn giao SFX — Đường Về Nhà

Đóng gói 26/10/2026 từ chat “SFX — Đường Về Nhà” (01a15f38-309a-7d61-8ba9-6efd85e83531). Chỉ bảo toàn nội dung để chuyển máy, không bắt đầu sản xuất âm thanh.

## Yêu cầu và lựa chọn của chủ dự án

- Âm thanh đầy đủ, có sắc thái cho mọi tương tác trong game. Direction đời thường, ấm, có tính người, xen căng thẳng mưa bão; nhiều chi tiết nhưng không mệt và không biến game thành combat.
- Ưu tiên tự làm procedural/layered bằng Web Audio. Chỉ dùng API nếu chất lượng tự làm không đạt. Voiceline NPC dùng ElevenLabs khi cần nếu không tự tạo đủ tốt. Đây là lựa chọn công nghệ, không phải yêu cầu tạo audio trong lần bàn giao.
- Đã yêu cầu soạn khoảng 3–4 câu ngắn, gần gũi, chân thật theo tình huống NPC; sau đó yêu cầu tông hơi cục súc, hài đời thường, thêm hàng rong suýt bị tông/bị tông, khách, người đi đường và dân nền mưa bão.
- Danh sách làm lại mới nhất nằm ở NPC_VOICELINES_DRAFT.md, giữ nguyên văn. Không gán trạng thái đã duyệt nếu chưa có xác nhận tiếp theo. Bản cũ chỉ là lịch sử và không ưu tiên hơn bản mới.

## Phạm vi event cần bao phủ khi triển khai

Tám loại xe: động cơ, tăng/hãm/coast/stop, steer/skid/va chạm/xe hỏng. Mưa/gió/nước/ổ gà; cargo release/roll/hit; tàu tiếp cận/đi qua/đuôi thông; police/militia/chuối; khách gọi/đón/cho xuống/ngã/đứng/quay lại/từ chối; nitro/jump/landing/star/Grab; shop/service/upgrade/switch; QTE warning/confirm/miss; pause/restart/failure/secret. Music chỉ làm khi được yêu cầu.

## Ràng buộc kỹ thuật và mix

Audio chỉ theo event/state hiện hành, không phát damage/collision/khách/loot và không chờ audio trong simulation. Event idempotent; cùng pair/entity không spam hit mỗi frame. Pause/restart phải dừng/reset đúng; nguồn ở nhánh cũ hoặc đã retire không phát tiếp. Tách volume/mute music/SFX/ambience; ambience/voice nền giảm khi có cảnh báo. Tránh lạm dụng còi, âm cao và giật mình. Hazard luôn có cue thị giác tương ứng.

Chat trước đã nêu hướng AudioDirector và ba bus, nhưng lần đóng gói này chưa xác minh code có lớp đó. Các state như vendor_move/vendor_hit/recover, pickupable=false là ngữ cảnh đã đối chiếu trong chat cũ; kiểm tra lại revision trước nối âm. Không đóng âm theo timing cũ. Câu dài ưu tiên safe window; va chạm ưu tiên tiếng kêu ngắn. Voiceline không thay diễn xuất hay cue hình.

## Tài liệu và trạng thái

Đọc đúng phần cần trong art-guide/ART_DIRECTION_3D.md, art-guide/MODEL_ANIMATION_WORKLOAD.md, docs/GAME_DESIGN.md và docs/TECH_SPEC.md; xác minh branch/revision hiện hành. Guide mới ưu tiên ghi chú art cũ khi mâu thuẫn, không thay gameplay.

Chưa tìm thấy file audio .wav/.mp3/.ogg/.flac hoặc bộ SFX guide riêng trong repo và project mirror đã kiểm tra. Nguồn hiện có là nội dung chat; chưa tạo âm thanh, gọi API, thu voice hay tích hợp. Không có ủy quyền gửi tin sang chat khác từ lần bàn giao này.

