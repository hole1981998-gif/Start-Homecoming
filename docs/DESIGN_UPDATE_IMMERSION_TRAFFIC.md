# Cập nhật design — HUD trong gameplay, nhịp chơi và giao thông

Ngày 17/10/2026. Nguồn: feedback trực tiếp của chủ dự án sau P2. Tài liệu thiết kế, chưa phải báo cáo tính năng đã chạy. Build P2.0 và các báo cáo cũ giữ nguyên; số thử mới chưa được simulation/playtest. Những yêu cầu bên dưới thay thế hướng dẫn cũ bắt hiển thị cruise trên HUD và dùng bảng chữ cho phản hồi thường xuyên.

## Quyết định UI đã chốt

- Tốc độ hiện tại, quãng đường, điểm và tiền đặt trực tiếp trên nền gameplay; không chia thêm một vùng màn hình dành cho bảng HUD. Có thể dùng viền chữ/bóng nhẹ để đọc trên nền thay đổi.
- Xăng và độ bền dạng tối giản, gần xe người chơi nhưng không che thân xe, mặt đường phía trước, vật phẩm hay chướng ngại. Đây là UI gắn theo vị trí xe trên màn hình, không phải vật thể có va chạm.
- Không hiện con số tốc độ trung vị hoặc target cruise trong HUD khi lái. Bản chính thức xem thông số xe ở kho/khi mua; người chơi tự ghi nhớ. Hướng dẫn chỉ giải thích hành vi giữ/thả W/S. Thông tin tải khách trong kho cho thấy ảnh hưởng lên cruise; không thêm đồng hồ cruise vào đường chạy.
- Cảnh báo và QTE dùng Graphic UI ngay trong gameplay: icon, dấu hướng, vùng nguy hiểm, tiến trình thời gian. Phân biệt bằng hình dạng, chuyển động và tương phản, không chỉ màu hoặc đoạn văn.
- Hậu quả tương tác truyền qua VFX, SFX cue và UI tại chỗ; bỏ bảng log chữ liên tục khỏi trải nghiệm lái chính thức. Số biến động nhỏ như −12 HP, −10 tiền hoặc +xăng có thể hiện cạnh tài nguyên liên quan. Giá trị chính xác xem ở UI an toàn; không yêu cầu một câu đầy đủ cho mỗi event.
- Vũng nước: nước bắn, cue nước, xăng thay đổi. Ổ gà: impact, phản hồi HP và popup ngắn như “OH MY XE!”. Flash đỏ ở nhân vật/xe bị thương là hướng thử, phải đi kèm icon/hình dạng; không làm đỏ cả cảnh tới mức mất khả năng né.
- Popup vui là điểm nhấn tùy chọn, không thay một bảng chữ bằng nhiều câu nổi liên tục. Giữ giới hạn/gộp/cooldown và các biến thể caption, cho tắt flavor và giảm chuyển động. Tắt âm thanh hoặc hiệu ứng vẫn đọc được hậu quả bằng UI tĩnh.
- Giữ intro/thẻ cơ chế lần đầu trong trạng thái an toàn, cùng Help, kho, shop và màn kết quả để đọc thông tin chi tiết. Không có bảng chữ thường trực khi đang lái.

## Bố cục và ngôn ngữ hình ảnh — đề xuất để thử

Tốc độ hiện tại ở góc trên trái; quãng đường ở trên giữa; điểm và tiền nhỏ hơn ở góc trên phải. Nhóm chữ gọn trong khung 9:16, không có dải nền đặc. Điểm và tiền ưu tiên thấp hơn hướng đi/QTE.

Hai vạch ngắn có icon giọt xăng/cờ-lê ở hai bên hoặc sau đuôi xe. Neo theo tọa độ chiếu của xe, clamp vào safe area và đổi bên/thu gọn khi gần mép. Tránh vùng ngay trước mũi xe và hình chiếu collider; nếu không đủ chỗ, đưa về góc dưới ngoài hành lang lái. Kiểm tra tại hai biên, khi rẽ, khi xe dài và viewport nhỏ. Khi bình thường giữ yên; gần cạn mới tăng nhấn tương phản, không nhấp nháy liên tục.

**Cập nhật theo feedback chủ dự án 17/10:** thử hai cung mảnh ôm hai bên thân/sau xe, xăng bên trái màu vàng ấm, độ bền bên phải màu xanh nhạt, icon và số L/HP sát chân cung; xem [ảnh tham chiếu](references/resource-arcs.png). Cung chỉ là HUD, không che xe hoặc vùng lái phía trước; giữ số và nhãn truy cập, trạng thái gần cạn đổi tương phản mà không nháy. Bản P2 hiện thử trên xe máy; xe kích cỡ khác và màn hẹp phải kiểm tra lại khi có trong prototype.

**Tham chiếu cho popup/card và tổn thất ở prototype sau:** [ảnh feedback thứ hai](references/impact-popup.png) đặt minh họa/caption ngắn kiểu sticker ở vùng trên đường, còn số mất HP/tiền nổi nhỏ gần xe đúng thời điểm va chạm. Card giải thích cơ chế lần đầu vẫn phải pause an toàn và đủ chữ để hiểu luật; sticker không thay card này. Popup thường không che hành lang né, cảnh báo hay cung tài nguyên; mỗi biến động có số, đơn vị và tương phản đọc được, không chỉ dựa vào màu. Đây là hướng bố cục/VFX để thử về sau, chưa áp dụng art hoặc animation hoàn chỉnh trong lần đổi cung P2.

| Tín hiệu | Hình thức placeholder | Luật đọc |
|---|---|---|
| Hazard ở phía trước | Icon theo hướng/làn + dấu viền giới hạn | Không phủ kín bề mặt nguy hiểm hoặc che vật phẩm nằm sau |
| Xe ngược chiều | Silhouette/mặt trước và chevron hướng đối nghịch | Phân biệt với đuôi xe cùng chiều kể cả ảnh xám |
| QTE giao lộ | Mũi tên Q/E + vòng/đường đếm thời gian | Chỉ chỉ hướng hợp lệ, tiến trình dễ đọc, không hiện hai kết quả mâu thuẫn |
| Va chạm | Impact gọn + nhấn thanh HP + số mất ngắn | Không che hazard tiếp theo, có chế độ giảm chuyển động |
| Pickup | Icon bay ngắn hoặc nhấn tài nguyên nhận được | Không sinh popup bấm đóng, không cần đọc câu |

Thứ tự ưu tiên: QTE/nguy hiểm sắp va chạm → xe và hành lang né → tài nguyên nguy cấp → chỉ số tiến trình → flavor. Prototype dùng primitive/icon đơn giản; VFX/SFX hoàn chỉnh vẫn qua art gate cuối. Chưa khóa palette hoặc thiết kế asset.

## Nhận định nhịp P2 từ code và feedback

Feedback thực: chủ dự án thấy chậm và chưa cần tập trung đủ. Code P2.0: hazard cố định cách 90 m, chu kỳ nước/ổ gà/xe; xe giao thông luôn giữa, 6 m/s; cruise người chơi 14 m/s, max 20 m/s. Khoảng cách spawn tĩnh tương đương 6,43 s ở cruise hoặc 4,5 s ở max; đây không phải thống kê khoảng cách va chạm với xe di chuyển. Xe xuất hiện mỗi 270 m và hai biên luôn là đường vượt; đây là một lý do có thể khiến chiến thuật bám biên dễ lặp. Chưa có số đo tập trung hoặc mức vui.

Giả thuyết cần tách thử: (1) thiếu mốc ven đường làm chuyển động khó cảm nhận; (2) khoảng nghỉ dài; (3) tình huống lặp làm ít quyết định. Tăng tốc xe ngay sẽ đổi thu nhập/phút, thời gian phản ứng và hiệu quả tài nguyên; ưu tiên kiểm tra ba giả thuyết trên trước.

## Luật gameplay bổ sung

**Đã ghi vào đích thiết kế theo yêu cầu chủ dự án:**

- Làn trái có xe ngược chiều người chơi; làn phải có xe cùng chiều; làn giữa chọn một trong hai hướng có seed. Trái/phải tính theo hướng người chơi đang chạy, cập nhật sau mỗi lần rẽ. Đây là quy tắc sinh traffic, không khóa thao tác A/D.
- Vũng nước, ổ gà/ổ voi có nhiều chiều rộng và chiều dài: nhỏ, lớn, kéo dài; có thể chiếm 2 hoặc 3 làn. Silhouette/diện tích nhìn thấy phải khớp vùng tác động.
- Xe chướng ngại có nhiều loại, sát thương va chạm khác nhau và HP riêng. Xe lớn như buýt/container có thể húc phá xe yếu hơn. Điều kiện phá, sát thương ngược và chi phí còn là đề xuất, chưa khóa số.

**Đề xuất triển khai công bằng:** hướng xe giữa được chọn khi spawn và giữ nguyên, không quay đầu tức thì trước mặt người chơi. Không thêm AI đổi làn trong lần thử đầu. Cảnh báo xe đối đầu dùng tốc độ khép khoảng cách: `closingSpeed = playerSpeed - signedTrafficSpeed`; tốc độ xe ngược chiều mang dấu âm. Cùng chiều nhanh hơn người chơi cần cảnh báo tiếp cận từ phía sau trước khi cho phép xuất hiện trong vùng ảnh hưởng. Dùng swept collision; không chỉ lấy khoảng cách chia tốc độ người chơi.

Vũng nước trải dài tính hao xăng theo thời gian tiếp xúc; ổ gà dài mặc định một hit mỗi vùng/entity, không trừ HP mỗi frame. Nếu muốn nhiều đoạn gây hit phải có silhouette/cue riêng và cooldown rõ. Nước phủ 3 làn chỉ được dùng như đoạn chi phí có thể chịu được với tài nguyên hiện tại hoặc có nhánh tránh; không gọi là “né được”. Vật cản cứng phủ 3 làn chỉ sinh khi có nhánh rẽ/giải pháp đã khả dụng và đủ thời gian; trước khi có hệ thống đó thì cấm mẫu. S giảm tốc không giải quyết một bức tường cứng vì xe không dừng hẳn.

**Cập nhật theo yêu cầu chủ dự án sau P3A:** luật ổ gà dài “một hit” ở đoạn trên đã được thay thế: có một cú impact/tiền lúc chạm lần đầu, sau đó mất HP theo thời gian còn tiếp xúc, không lấy lại tiền mỗi frame. Cho thêm nước/ổ gà dài hàng chục mét và mẫu phủ cả ba làn. Khi P3B chưa có nhánh rẽ, chỉ sinh mẫu phủ kín nếu xăng/HP còn đủ để chịu toàn bộ đoạn theo tốc độ thấp nhất và có dự phòng; nếu thiếu tài nguyên thì thu về hai làn. Mẫu phủ kín là chi phí buộc chấp nhận, không gọi là lối né được. Xe cứng không thể xuyên vẫn cấm khóa kín ba làn trước khi có đường rẽ hợp lệ.

Xe có HP không đồng nghĩa mọi xe chạm nhau đều cho thêm khách/loot: quy tắc xe chết máy cũ là event riêng. Xe bị phá không tự biến thành collider tai nạn chí tử hoặc bước secret. Trong prototype húc phá, đề xuất xe HP=0 rời collider ngay, văng chỉ là hiệu ứng; chưa mô phỏng dây chuyền xe va nhau. Không thưởng tiền/điểm farm từ húc; điểm/thu nhập vẫn theo quãng đường và khách. Xe lớn chịu hao HP/đà hoặc chi phí sửa có thể đo được; không mặc định húc miễn phí.

## Chia prototype và tiêu chí nghiệm thu

| Bước | Phạm vi đề xuất | Điều cần chứng minh |
|---|---|---|
| P2.1 — đọc đường và cảm giác tốc độ | HUD overlay, thanh xăng/HP gần xe, bỏ cruise HUD, cue graphic cho hazard P2, feedback tại chỗ, mốc ven đường primitive/pooling | Không che hành lang lái; mute/reduced motion vẫn hiểu; thông số gameplay không đổi trong lượt so sánh UI |
| P2.1 — thử nhịp riêng | So sánh gap 90 m hiện tại với 75 m rồi 70 m, vẫn hazard một làn và tốc độ cũ | Giữ cảnh báo >=3,5 s; lối né/tới tiếp tế khả thi; đủ tiền xe đầu trong mục tiêu 1–1,5 phút ở lượt đại diện; các số mới chưa áp dụng |
| P3A — traffic và hình học hazard | Trái ngược/phải cùng/giữa seeded; biến thể nhỏ/dài/2 làn; director kiểm tra đường đi | Cửa sổ phản ứng theo tốc độ tương đối, không xuyên collider, không có tổ hợp bẫy; xe dài có lối đi |
| P3B — tuyến/giao lộ | Chunk, difficulty, QTE graphic, rẽ và cập nhật hệ quy chiếu; mở mẫu 3 làn có phương án hợp lệ | Không bắt buộc giải pháp chưa sở hữu; cảnh báo/QTE không chồng nhau gây mất input |
| P4 — người và nhiều xe | Kế thừa luật tải/cruise, giới hạn kho, thay xe; dựng danh mục traffic | Xem cruise tại kho/mua; giữ hành khách và tài nguyên đúng; xe to không mặc định tối ưu |
| P4.1 — húc phá (bổ sung) | HP/sát thương theo loại traffic; buýt/container húc phá; cue impact tối giản | Thiệt hại hai phía theo thứ tự event ổn định, không hit lặp theo FPS, không farm, không chạm logic secret sai |
| P5 và P6 | Shop/chi phí sửa xăng và nguy hiểm đặc biệt | Cân lại lợi ích húc/né, xe dài, mua xe và tiếp tế; xác minh tàu/tai nạn vẫn giữ luật riêng |
| P8/P9 | Hoàn thiện VFX/SFX/UI/art sau duyệt cuối | Thể hiện nước bắn/impact/“OH MY XE!” mà vẫn rõ, tiết chế chữ và giữ hiệu năng |

Không tăng mật độ, thêm hướng traffic, đổi damage và thay economy cùng một vòng; mỗi vòng cần seed/config và baseline đối chiếu. P2.1 là bước đề xuất kế tiếp, không được coi là build đã cập nhật. P3A/B là cách chia nhỏ P3, các mốc P5–P9 giữ tên cũ.

## Kế hoạch simulation và playtest

- Dùng cùng seed giữa baseline/biến thể và đủ mẫu nhiều seed; bot đánh giá đường đi có xét input ngang/gia tốc, chiều rộng/chiều dài và lookahead hữu hạn. Bot biết trước mọi entity không chứng minh phản ứng người chơi.
- Đo khoảng thời gian giữa quyết định né thực, chuỗi không cần input ngang, va chạm/phút, HP/xăng mất theo nguyên nhân, thời lượng ván, khả năng tới tiếp tế và phân bố thời gian đủ 800 tiền. Ghi cả các lượt chết trước khi đủ tiền để tránh chỉ báo cáo người sống sót.
- So sánh cruise/W/S; traffic cùng/ngược; hazard nhỏ/dài/2/3 làn; xe nhỏ/buýt/container khi có. Kiểm tra đường tới trước va chạm và tài nguyên đủ trả đoạn bắt buộc; loại seed/mẫu bất khả thi hoặc fallback đường trống.
- UI kiểm tra đang lái sát hai mép, nhặt đồ, nguy hiểm nối tiếp, QTE, rẽ, cạn xăng, HP thấp, pause/restart; viewport 640×600 và màn lớn. Xác minh vùng cue không phủ xe/hazard, không dựa riêng màu/âm thanh. Chụp evidence hiện tại khi triển khai và chơi input thực, không dùng ảnh P2 cũ chứng minh UI mới.
- Người chơi đánh giá trực tiếp: có phải nhìn/đổi hướng thường xuyên hơn, hiểu lý do mất tài nguyên không, có đủ nhịp thở không. Chỉ số bot không thay cho cảm giác cuốn hút.

Tự review thiết kế lần này dựa trên code P2 và feedback chủ dự án: ưu tiên UI không che đường và phá tính lặp trước; rủi ro lớn nhất là traffic ngược chiều cùng hazard rộng làm cạn thời gian phản ứng. Chưa có simulation/playtest cho các đề xuất mới. Thu nhập 0,15/m tiếp tục là số đã đồng ý thử; chưa đổi tốc độ, damage, giá hoặc tài nguyên trong build đang chạy.

## Kiểm tra bàn giao cập nhật design

Base local fd43510, branch docs/immersive-ui-traffic-design. Không có remote nên chưa fetch/push/PR/CI; main chưa merge. Phạm vi chỉ tài liệu và hướng dẫn liên quan; src/tests/index/package không thay đổi. Đã kiểm tra diff và liên kết nội bộ. Nguồn docs đồng bộ bên ngoài không bị sửa.

Windows, Node 24.19.0, pnpm 11.25.0; chạy thực trong lượt này: `pnpm lint` exit 0, `pnpm typecheck` exit 0, `pnpm test` exit 0 (26/26, 6 file), `pnpm build` exit 0 (JS 496,58 kB / gzip 128,51 kB). Bộ test chạy lại sampling P2.0: seed 17/42/20261017, cruise/W/S, 9 lượt × 600 s; đủ 800 ở cruise 285,72–290,48 s, W 200,18 s, S 499,78 s; 9/9 bot sống hết mẫu. Đây là hồi quy baseline, không test luật mới.

Tự review game design sau sampling: bot W luôn còn 70 HP ở các seed mẫu, phù hợp giả thuyết đường hiện tại dễ lặp nhưng không chứng minh người chơi thấy vui/chán. Giữ baseline để so sánh; thử nhịp sau UI, không tăng damage đồng thời. Tự review UI/UX: feedback chủ dự án là bằng chứng ưu tiên giảm bảng và chuyển cue vào gameplay; khả năng đọc bố cục mới chưa được xác minh. Lượt này chỉ chỉnh tài liệu nên không có manual gameplay mới và không audit screenshot mới; evidence P2 cũ chỉ thuộc báo cáo P2.0. Manual/UI audit và simulation luật mới còn phải thực hiện khi triển khai từng bước.

## Mục tiêu economy được thay thế sau ghi chú này

Chủ dự án yêu cầu mua ô tô đầu tiên trong 1–1,5 phút thay 3–5 phút. Baseline economy kế tiếp dùng 0,50 tiền/m, giữ tiền đầu 200/giá 800; các ghi nhận 0,15 và số simulation P2.0 bên trên là lịch sử. Khi thử mật độ P2.1 dùng baseline mới, không đổi đồng thời economy. Xem ECONOMY_60_90_REVIEW.md.

## Trạng thái sau cập nhật HUD

Đã triển khai phần HUD của P2.1: chỉ số overlay, thanh xăng/HP sau xe, bỏ số cruise cả intro/Help, graphic marker hazard/tiếp tế, phản hồi hậu quả ngắn và nút icon. Chưa triển khai các phần còn lại của P2.1 (thử mật độ/trang trí mới), P3A/B, hoặc VFX/SFX hoàn chỉnh. Gameplay/economy kế thừa bản 0,50/m. Chi tiết bằng chứng và tự review: [HUD_REVIEW.md](HUD_REVIEW.md). Các mô tả “chưa triển khai HUD” bên trên là trạng thái tại thời điểm ghi chú ban đầu.
