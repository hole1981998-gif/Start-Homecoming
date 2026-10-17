# HUD overlay — kiểm tra và tự review 17/10/2026

## Phạm vi và kết quả

Base local 9b32613, branch feature/immersive-hud. User chấp nhận thử economy và yêu cầu cập nhật HUD mới. Đã đổi presentation, giữ nguyên src/config.ts, simulation.ts, survival.ts, world.ts và luật economy. Không thêm art production, QTE chưa tồn tại, audio, traffic hướng mới, size hazard hoặc tăng density. Chỉ hoàn thành phần HUD trong P2.1.

Tốc độ hiện tại trái trên; quãng đường giữa; điểm/tiền góc phải qua icon Trophy/Coins. Canvas full khung, bỏ dải nền HUD và footer lớn. Xăng/HP dùng hai vạch sau đuôi xe, tọa độ chiếu theo camera, clamp safe area; camera P2 theo hết biên ngang nên xe giữ gần tâm màn hình. Không còn số cruise trong HUD/intro/Help; vẫn giải thích giữ/thả W/S. Kho/shop xem thông số sẽ đến ở P4/P5.

RoadHud chỉ đọc Run, có tối đa 5 marker DOM tái sử dụng (một per kind), chọn hazard gần nhất và supply gần nhất, ưu tiên hazard nếu marker trùng. Icon Lucide 0.468.0 (ISC, package/lockfile pinned), hình/màu riêng và khoảng cách. Vị trí chiếu trên đường; marker ra ngoài màn được clamp và mũi tên xoay ra đúng phía. Cue giới hạn phần trên màn để không phủ xe; mesh hazard vẫn hiển thị. Đây là marker thông tin, không thay collider hoặc thay thời gian warning P2.

Hậu quả hiện số ngắn cạnh xe trong 1,5 s, ví dụ −12 HP/−10 tiền; water hiện icon và −xăng, mức hao cụ thể trong Help; coasting giữ countdown. Flavor chỉ thêm “OH MY XE!” cho impact, tắt ở màn thấp hoặc bằng checkbox. Aria-live ẩn giữ nội dung hậu quả chính xác; tài nguyên progress có nhãn và max. Không thêm flash/motion/audio nên không có phụ thuộc âm thanh hoặc animation để biết hậu quả. Popup pool cũ vẫn thuộc simulation, presentation mới không hiện hàng loạt caption.

## Kiểm tra tự động

Windows, Node 24.19.0, pnpm 11.25.0. Lint/typecheck/test/build thực chạy trên code cuối, tất cả exit 0; 28/28 test trong 7 file. Hai test RoadHud mới kiểm tra chọn cảnh báo/ưu tiên/clamp, không mutate Run, tắt flavor giữ số, hết hạn/restart xóa cue và coasting. Input/focus/discovery/end/restart cùng 30/60/144 FPS vẫn được kiểm tra. Kỳ vọng chuỗi HP trong discovery được cập nhật từ “70 / 70 HP” sang “70 HP”; vẫn kiểm tra reset HP.

R1 có lỗi type signature khi dùng createElement icon; đã sửa theo API package. R2 có test hiển thị HP cũ fail; đã sửa kỳ vọng đúng design mới. Không bỏ test hoặc giảm strict. R3 cuối: 28/28 pass. [Logs cuối](checks-hud/test.txt).

Simulation 30 seed × cruise/W/S (90 lượt, tới 600 s hoặc chết); observations so sánh JSON bằng nhau hoàn toàn với checks-economy-2/observations.json. Cruise đủ 800 sau 85,72 s; W 60,18 s; S 149,78 s. Cruise 21/30 sống hết 600 s, W/S 30/30; mọi lượt đủ tiền trước kết ván. Đây là bot như trước, không chứng minh người chơi chắc chắn đạt hoặc mua được xe khi chưa có shop.

Build JS 505,81 kB / gzip 131,29 kB, CSS 7,01 kB / gzip 2,31 kB. Vite có cảnh báo chunk >500 kB; build pass, chưa tách bundle trong phạm vi HUD. Mẫu diagnostics thật 640×600: 240 frames, ~60,0015 FPS, p95 frame 16,8 ms, mean render submission CPU ~0,531 ms. Chỉ một máy/session, không phải GPU timing hoặc benchmark mọi máy; CPU/GPU model chưa xác minh.

## Audit theo Product Design — tự review, ảnh mới trong lượt này

Dùng in-app browser hiện hữu tại 127.0.0.1:5173; ảnh đã lưu và mở lại từ file để kiểm tra, không sửa ảnh. Preflight không có saved user context; dùng design/code/feedback trong workspace. Đây là audit gọn luồng chơi/HUD/Help, không có reviewer độc lập hoặc claim full WCAG.

1. **Trước đổi — cần sửa:** [00-before](evidence-hud/00-before.png). Dải bảng đậm che phần trên và footer dưới, log chữ/mốc cruise kéo sự chú ý ra khỏi đường. Đây là bằng chứng baseline mới chụp trong lượt, không phải ảnh cache.
2. **HUD và lái hai biên — đạt trong mẫu:** [01-overlay](evidence-hud/01-overlay.png), [02-left-edge](evidence-hud/02-left-edge.png), [03-right-edge](evidence-hud/03-right-edge.png). Đã click bắt đầu, giữ W 5 s, A 1,1 s, D 2,2 s. Tốc độ/quãng đường đổi, camera theo hai biên, thanh tài nguyên sau bánh sau không cắt thân xe hoặc hướng né phía trước. Water có sóng; pothole vòng tròn; vị trí marker trùng hướng hazard nhìn thấy. Outline vàng là focus bàn phím của canvas, không vùng HUD.
3. **Màn 640×600 và hậu quả — đạt trong mẫu, chữ tài nguyên còn nhỏ:** [04-small](evidence-hud/04-small.png), [06-final-small](evidence-hud/06-final-small.png). Cán ổ gà thực: HP 38 xuống 26, popup −12 HP/−10 tiền tại bên xe; không bảng log, caption vui tự ẩn ở màn thấp. Không che mũi xe; marker nước/khoảng cách đọc được ở ảnh final. Số tài nguyên 10px cần chủ dự án đánh giá độ dễ đọc khi đang chơi, chưa coi đạt mọi mức zoom/thị lực.
4. **Pause/Help/thiết lập/restart — đạt các thao tác đã làm:** [05-help](evidence-hud/05-help.png). Esc pause, Help mở mô tả/legend lúc mô phỏng đã dừng; Tab tới checkbox, Space tắt, Esc đóng/tiếp tục; bản cuối bật lại flavor. Help nhỏ có scroll (P2 thấp: cần cuộn để thấy checkbox; keyboard vẫn tới được). Sau diagnostic, pause ở 206 m/303,5 tiền/7,4 L/70 HP; không chạy trong lúc xem menu. Chơi lại về 0 m/200/8 L/70 HP. Browser reset về viewport mặc định và URL sạch, để sẵn màn bắt đầu. Console error/warn cuối rỗng.

Ảnh bước 1–3 chứng minh bố cục/độ che và hành vi cụ thể nêu trên, không chứng minh công bằng mọi seed. Không manual kéo dài tới màn kết quả ở code HUD cuối; end/restart được regression test DOM thật. Không có manual fuel-empty/pickup riêng lượt HUD này; unit/integration baseline và RoadHud coasting test pass. Chưa test screen reader thật, độ tương phản bằng công cụ, zoom toàn ma trận, container hoặc giao lộ chưa triển khai.

## Tự review game design và UI/UX

Game design: dữ liệu bằng baseline cho thấy đổi presentation không thay economy/sinh tồn mẫu. Cue trực tiếp trên hazard giảm nhu cầu đọc bảng; tác động lên né tránh/focus cần chủ dự án chơi thực, bot không nhìn HUD. Giữ warning window và density giúp so sánh riêng UI. Không gọi gameplay feel đã được cải thiện chỉ từ FPS/ảnh.

UI/UX: ảnh mới cho thấy đường không còn bị bảng đậm cắt, tài nguyên gần xe và phân cấp chỉ số nhẹ hơn. Hai rủi ro còn lại: số xăng/HP nhỏ trên viewport thấp; Help dày chữ nhưng chỉ ở trạng thái an toàn. Marker supply bị ẩn khi trùng hazard để tránh che, item mesh vẫn có; cần theo dõi có bỏ lỡ tiếp tế do cue không. QTE cần vùng ưu tiên riêng khi triển khai P3, chưa thể nghiệm thu qua HUD P2. Không animation/VFX hoàn chỉnh ở bước này.

## Bàn giao

Không có remote nên chưa fetch/push/PR/CI; chưa merge. Commit/patch và source archive local để review; các gate local có kết quả ở trên. Docs lịch sử giữ nguyên, README/roadmap ghi trạng thái HUD mới. Chờ phản hồi chủ dự án về vị trí tài nguyên, độ lớn chữ và cách đọc icon; chưa chuyển sang tăng mật độ hoặc làm P3.
