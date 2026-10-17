# Đường Về Nhà — Prototype 3A · giao thông và chướng ngại

P3A kế thừa vòng sinh tồn P2 và HUD overlay. Xe giao thông làn trái chạy ngược chiều, làn phải cùng chiều, làn giữa chọn hướng theo seed; mũi tên trên cảnh báo cho biết hướng. Nước và ổ gà có nhiều chiều rộng/chiều dài, tới 30 m và có mẫu phủ cả ba làn. Vì nhánh rẽ chưa có, đoạn phủ kín chỉ sinh khi xe còn đủ xăng/HP để chịu; nếu không, thu về hai làn. Mesh và vùng va chạm cùng kích thước. Ổ gà lấy HP lúc chạm và tiếp tục lấy theo thời gian; nước dài tính xăng theo thời gian tiếp xúc. Va xe trừ HP một lần/xe, tài xế văng xa, xe trôi giảm tốc rồi dừng và tài xế tự quay lại; trong lúc đó xe miễn nhiễm damage/debuff. Sau khi lên xe, xe tăng tốc dần, giữ W để nhanh hơn. Hệ thống hành khách chưa có ở P3A, nhưng mô phỏng đã có quy tắc seed cho số khách quay lại/mất sau tai nạn. Xe máy đang thử bình 5,5 L và hao nền 0,0045 L/m; density và economy tiền chưa đổi. Giao lộ/QTE và đường rẽ thuộc P3B tiếp theo.

**P2 giữ cruise P1.2:** tự chạy ở 14 m/s (50,4 km/h), giữ W/S để nhanh/chậm, thả để hồi. Thêm xăng/HP, nước/ổ gà/xe, nhặt xăng/sửa, điểm/tiền, coasting, kết ván và restart. Theo yêu cầu mới, thử thu nhập **0,50 tiền/m** để bám mục tiêu ô tô đầu tiên **1–1,5 phút**, thay mốc cũ 3–5 phút/0,15 tiền/m. Giữ tiền đầu 200 và giá ô tô 800. Các số còn TẠM; chưa có shop/mua xe nên mới đo khả năng đủ tiền.

**Bổ sung đã chốt:** thêm khách giảm cruise kể cả chưa quá tải; mức giảm/sàn tùy xe và giới hạn tình huống, không nhất thiết luôn chạm min. Tài xế không tính là khách thêm. Chưa triển khai hệ thống hành khách hoặc luật này trong P2.

Three.js + TypeScript strict + Vite. Desktop, bàn phím, khung 9:16. Placeholder geometry; không có art/SFX hoàn chỉnh.

## Chơi

`pnpm install --frozen-lockfile`, sau đó `pnpm dev`. Mở URL được in trong terminal, bấm **Bắt đầu lái**.

- Giữ W: tăng/duy trì tới 20 m/s (72 km/h).
- Giữ S: hãm/duy trì tới 8 m/s (28,8 km/h); không lùi, không dừng hẳn. W+S ưu tiên S.
- Thả W/S: hồi dần về 14 m/s (50,4 km/h), kể cả khi vẫn đang giữ A/D. Từ max về cruise mất 1,5 s; từ min lên cruise mất 2 s theo config tạm.
- A/D: lái ngang liên tục, không khóa lane.
- Esc: tạm dừng/tiếp tục. Mất focus sẽ pause, phải chủ động tiếp tục.
- Nút Hướng dẫn: xem lại input. Nút Chơi lại: reset quãng đường/vị trí và tốc độ về cruise. Pause ngừng cả quá trình hồi tốc; resume giữ vận tốc lúc pause và xóa phím cũ.

Nước hao thêm xăng; ổ gà mất HP liên tục khi còn chạm và mất tiền một lần; va xe mất HP một lần mỗi xe và kích hoạt ngã nếu xe chưa hỏng. Lái chạm bình xăng/hộp sửa để nhặt, có cảnh báo bằng icon/hướng và thẻ lần đầu ở khoảng cách an toàn. Hết xăng trôi thêm 25 m; HP về 0 hoặc hết đà thì kết ván, ghi kết quả local một lần. Pause/Help không hao tài nguyên hoặc cộng thu nhập. Help có thể tắt lời nhắc vui; số hậu quả vẫn hiện. Chưa có giao lộ, hành khách chơi được, nhiều xe, shop, nitro hoặc secret.

## Check

Node 24.19.0, pnpm 11.25.0. Chạy `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`.
`pnpm simulate` chạy lại các kịch bản mô phỏng. `pnpm preview --port 5173` phục vụ production build sau `pnpm build`.

Config: `src/config.ts`, đơn vị m/s và m, số TẠM. Lái thuần dữ liệu: `src/simulation.ts`; sinh tồn/thứ tự collision: `src/survival.ts`; thế giới seeded: `src/world.ts`. Render/UI không cộng distance. `pnpm simulate` gồm cả mô phỏng lái và survival/economy có bot, không phải playtest người dùng. Seed mặc định 17 cho các lượt chơi lại để tái hiện feedback. `?diagnostics=1` bật số đo DOM, không analytics. DEV-only QA tại dev server: `?scenario=coast`, `?scenario=supplies` và `?scenario=crash`; bị loại khỏi production, không phải chế độ chơi của người dùng.

## Phát triển tiếp

P1.2 và P2 đã được chủ dự án chấp nhận để chuyển tiếp; P3A ở branch local riêng, chưa merge; chưa có remote để fetch/PR/CI. Mỗi feature có check, manual review và review con người theo AGENTS.md. Xăng chạy/thu nhập/điểm dùng **distance hợp lệ**; nước dùng thời gian tiếp xúc thực.

Mỗi lần simulation/playtest cần báo cáo kèm tự review game design và UI/UX. Thay đổi cân bằng lớn phải xin ý kiến chủ dự án. Không diễn giải simulation đường trống thành chứng minh economy cân bằng. Không tạo/tích hợp art hoặc SFX hoàn chỉnh trước gate riêng.

Các tài liệu thiết kế trong `docs/` xuất phát từ bộ tài liệu chủ dự án ngày 17/10/2026 và được cập nhật theo quyết định mới trong chat. Chúng mô tả đích thiết kế, không phải báo cáo đã triển khai. Báo cáo P1 giữ nguyên làm lịch sử cho build cũ. Nguồn đồng bộ bên ngoài không bị sửa.

## Feedback thiết kế sau P2

Đã cập nhật [UI/nhịp chơi/traffic và phân kỳ prototype](docs/DESIGN_UPDATE_IMMERSION_TRAFFIC.md), cùng GDD/spec/roadmap/balance. Đây là design kế tiếp, chưa đổi P2.0 đang chạy. Đề xuất P2.1 cho HUD overlay/cue/mốc ven đường và thử nhịp; P3A/B cho traffic nhiều hướng/hazard rộng/QTE; P4.1 cho HP traffic/húc phá sau hệ thống nhiều xe.

## HUD mới đã triển khai

Chỉ số phủ lên gameplay, tài nguyên gọn sau đuôi xe, không hiển thị số cruise/target; nút điều khiển dạng icon. Cảnh báo hazard/tiếp tế có icon, khoảng cách và vị trí theo thế giới; số hậu quả ngắn tại xe thay bảng log. Help/discovery/kết quả giữ phần giải thích an toàn. Giữ economy 0,50/m và gameplay; chưa tăng mật độ, thêm QTE hoặc VFX/SFX hoàn chỉnh. Xem [HUD_REVIEW.md](docs/HUD_REVIEW.md) cho kiểm tra và giới hạn.

Chủ dự án thấy hai cung xăng/độ bền còn hơi nhọn; ghi để chỉnh hình cung ở lượt HUD sau, không đổi trong P3A. Báo cáo kiểm tra P3A ở [PROTOTYPE_3A_REVIEW.md](docs/PROTOTYPE_3A_REVIEW.md).
