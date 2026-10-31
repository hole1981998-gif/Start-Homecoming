# Bàn giao chat VFX — Đường Về Nhà

Trạng thái: chat placeholder. Chưa được yêu cầu bắt đầu sản xuất VFX. Lần bàn giao này chỉ lưu tài liệu để chuyển máy; không tạo FX/shader/ảnh/video/code gameplay.

## Bối cảnh được cung cấp

Game web3D low-poly, Three.js/TypeScript/Vite, desktop, khung dọc 9:16, camera sau xe. Endless run về nhà giữa mưa bão/ngập lụt; đường ba làn nhưng lái ngang liên tục. Catalog có xe máy, mô tô, car4, car7, ba gác, bus, truck, container cho player và traffic. Né nguy hiểm, đón khách, quản lý xăng/HP/tiền, shop và đổi xe; humor đời thường, khó nhưng công bằng, secret ending. Main đã tích hợp force; noforce là backup theo brief ngày 21/10, cần xác minh lại trước triển khai. Balance và logic thuộc công đoạn lập trình/cân bằng.

Visual mới: low-poly trau chuốt, premium, màu tươi hấp dẫn, có hint buồn/khó khăn vì bão. Nuance qua cấu trúc, chất liệu, diễn xuất và bố cục; không phủ xám toàn cảnh. Guide mới ưu tiên ghi chú art cũ khi mâu thuẫn, không đổi gameplay.

## Phạm vi tương lai

Mưa/gió/nước, spray/splash, bụi/va chạm/spark, lửa/khói phá hủy, hiệu lực nitro/star/chuối/Grab và feedback visual môi trường/xe/NPC. Chỉ đọc nguồn cần thiết và kiểm tra trạng thái mới khi chủ dự án bắt đầu phase.

VFX chỉ trình bày; không phát thêm damage/collision/khách/loot. Simulation quyết định root/force/terminal; không cộng displacement/lean lần hai. Có gió đẩy, nước hao xăng; lực ngang nước đang tắt theo brief đã đọc. Crash miễn nhiễm theo state; traffic hỏng khác fuel-stopped. Cargo chỉ rơi từ đuôi tải/container cùng chiều còn chạy, kiện nhẹ và thùng nặng có hậu quả khác nhau.

Tàu hữu hạn chạy ngang; va thật vẫn terminal dù star. Star miễn damage/debuff thường, không xóa trigger police/tàu/accident. Nitro boost tách Space jump. Chuối vô hiệu cả nhóm officer. Container có tractor/trailer; trailer-hit nửa HP; nước/ổ gà xét đầu kéo. Không dùng FX thay luật.

Model phase chỉ chuẩn bị sockets fire/smoke/exhaust/spray/spark/banana/cargo và masks wet/charred/lamp; không giả định đã sản xuất FX. Đọc mục state/socket/phase boundary trong art-guide/MODEL_ANIMATION_WORKLOAD.md và phối hợp hợp đồng khi triển khai.

Tách Graphic UI khỏi FX. Không dùng bloom/flash/rain dày/motion blur che model hay hành lang phản ứng. Pause/reset/retire/pooling không sót effect. Có reduced motion và giảm quá tải thị giác, không đổi gameplay.

## Nguồn và quyền hạn

- art-guide/ART_DIRECTION_3D.md
- art-guide/MODEL_ANIMATION_WORKLOAD.md
- art-guide/references/ (ba ảnh)
- docs/GAME_DESIGN.md, docs/TECH_SPEC.md, docs/DESIGN_ITEMS_HAZARDS.md, docs/DESIGN_MOVING_EVENTS_TRAFFIC.md khi cần xác minh luật.

Không có ủy quyền gửi tin sang chat khác, tạo chat con hoặc bắt đầu phase khác chỉ từ brief này. Chờ chủ dự án chỉ định việc tiếp theo. Đây là tóm tắt ngữ cảnh đã nhận, không phải toàn văn lịch sử các chat khác hay xác minh runtime hiện tại.
