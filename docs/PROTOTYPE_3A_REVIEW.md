# Prototype 3A — giao thông và hình học chướng ngại

Ngày 17/10/2026, branch `feature/prototype-3a-traffic-geometry`, base local `2142816`. Chủ dự án chấp nhận P2 và yêu cầu bắt đầu P3. Theo roadmap, vòng này chỉ triển khai P3A để đánh giá riêng giao thông và kích thước; P3B giao lộ/QTE, tuyến/rẽ và difficulty theo quãng đường chưa triển khai. Hai cung xăng/HP còn nhọn được ghi là feedback cho lượt HUD sau.

## Hành vi trong bản thử

- Xe ở làn trái chạy ngược chiều người chơi (−6 m/s), làn phải cùng chiều (+6 m/s); làn giữa chọn một lần theo RNG seed, không quay đầu đột ngột. Cảnh báo hiện mũi tên ↓/↑ và nhãn truy cập bằng chữ, mở sớm theo tốc độ khép khoảng cách. Đèn trước/sau phân biệt hai hướng ở placeholder 3D.
- Nước có bốn kích thước từ 2,4×4 tới 5,7×9 m, trong đó có đoạn dài 14 m; ổ gà có bốn kích thước từ 1,1×1,2 tới 5,7×5 m. Biến thể 5,7 m chiếm hai làn và để làn biên đối diện trống. Mesh được scale theo collider thật. Nước dài hao xăng theo thời gian tiếp xúc; ổ gà dài một hit/entity.
- Director xét cản cứng dự đoán cùng thời điểm ở các tốc độ 8–20 m/s, bỏ mẫu mới nếu không còn làn trống. Chưa mở chướng ngại cứng kín ba làn, vì chưa có nhánh rẽ khả dụng. Mật độ 90 m, warning sàn 3,5 s, damage, fuel, tiền 0,50/m và giá xe đầu 800 giữ nguyên.

## Kiểm tra

Windows, Node/pnpm của workspace. `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` chạy trên source P3A; kết quả cuối ghi trong bàn giao. Test mới xét hướng làn theo seed, cửa sổ cảnh báo xe ngược/cùng chiều, va chạm tương đối, vùng hai làn có lối, director bác tổ hợp chặn kín, ổ gà dài không hit lặp. Sweep/contact và test focus/pause/restart từ P2 tiếp tục chạy.

Simulation bot 30 seed × cruise/giữ W/giữ S, 600 s mỗi lượt hoặc tới kết ván; cùng config `p3a-traffic-geometry-1`, seed 17/42/20261017/100–126. Không có giá trị NaN, tiền âm, xăng/HP vượt biên hoặc >20 entity hoạt động trong suite. Tất cả lượt đủ 800 trước kết ván. Median thời điểm đủ 800: cruise 85,7 s; W 60,2 s; S 149,8 s. Kết ván trước 600 s: cruise 1/30; W 0/30; S 0/30. HP cuối trung bình: 63,8 / 66,4 / 70,0. Đây là bot phản ứng có thông tin đầy đủ về entity và footprint, không đại diện kỹ năng người chơi. Bot P3A được cập nhật để nhìn chiều rộng thực; không so số chết/HP trực tiếp với bot P2 cũ dùng footprint đơn giản hơn.

**CHƯA KIỂM TRA THỦ CÔNG TRONG TRÌNH DUYỆT:** công cụ browser của lượt này không được phép mở localhost theo chính sách URL đã trả về trước đó. HTTP/build/test không xác nhận được cảm giác lái, độ đọc mũi tên và mesh, hoặc khả năng nhìn hai làn rộng trên màn nhỏ. Cần chủ dự án chơi bản preview và phản hồi; chưa gọi P3A nghiệm thu đủ manual.

## Tự review

Game design: mẫu xe đối đầu ở trái tạo quyết định né khác xe cùng chiều; vùng rộng tăng yêu cầu đọc mặt đường nhưng director giữ một lối cứng khả dụng. Thu nhập/mốc mua xe không đổi trong bot, phù hợp mục tiêu 1–1,5 phút khi ở cruise hoặc giữ W. Nhịp chướng ngại vẫn 90 m và chưa có giao lộ; người chơi có thể tiếp tục thấy đoạn chạy thưa. Đề xuất kiểm chứng tiếp bằng playtest người dùng trước khi thử gap 75/70 m riêng, không đổi cùng lúc với P3B.

UI/UX: icon xe thêm mũi tên hướng và Help/intro nói rõ quy tắc làn; mesh biến thể khớp collider để người chơi có thể đọc kích thước từ hình. Cần kiểm tra trên browser ở tốc độ tối đa xem cue xe ngược chiều có đủ sớm, và patch hai làn có ranh giới đủ rõ. Số xăng/HP còn ở cung có góc nhọn theo feedback chủ dự án; sửa ở lượt HUD sau, không chi phối luật P3A.

Không có remote, nên chưa fetch/push/PR/CI. Chưa có review con người hoặc merge. P3B giao lộ/QTE/tuyến, các mẫu chặn kín có lối rẽ và difficulty còn là công việc kế tiếp; HP/sát thương theo loại xe và húc phá là P4.1 sau khi có kho xe.
