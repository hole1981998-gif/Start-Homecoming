# P4.1 — danh mục xe chướng ngại đồng bộ

Revision: branch `feature/p4-1-traffic-durability`, config `p4-1-traffic-roster-1`. Đây là tự đánh giá của Codex từ test/simulation và lượt chơi trực tiếp, không phải chuyên gia độc lập. Các số HP, sát thương, tốc độ và trọng số spawn đều TẠM.

## Dữ kiện đã kiểm tra

- `pnpm lint`, `pnpm typecheck`, `pnpm test` (70 test), `pnpm simulate` (13 test), `pnpm build`: pass. Build còn cảnh báo chunk >500 kB.
- Catalog traffic và luật húc dùng cùng `VehicleKind` với tám loại xe người chơi; test xác nhận đủ tám loại sinh ra qua seed, hình học/hướng/tốc độ/HP đúng definition và va chạm từng loại gây sát thương đúng một lần. Test húc cùng mục tiêu bằng từng xe người chơi xác nhận xe lớn chỉ xuyên khi mục tiêu thực sự hỏng. Test cũ về ổ gà/nước, ngã xe, giao lộ và restart vẫn pass.
- Mẫu 30 seed, hành vi điều khiển cố định: cruise đủ 800 tiền 30/30, median 85,7 s, chết 13/30; W 30/30, median 60,2 s, chết 14/30; S 29/30, median 149,8 s, chết 3/30. Bản P4.1 ba loại trước đó là 10/14/4 lượt chết tương ứng. Đây không phải tỷ lệ chết của người biết né/húc, và không chứng minh mọi seed công bằng.
- In-app browser tại `?scenario=traffic-gallery&seed=17`: tám placeholder hiện trên đường với silhouette xe hai bánh, ba gác, xe hộp kín và xe dài khác nhau; cue cho xe đầu là “Xe máy”. Tại `?scenario=traffic-kind-container&seed=17`: container lớn có cue đúng tên/khoảng cách; xe máy va ở khoảng 26 m, HP 70→20, HUD hiển thị −50 HP và pha ngã/trôi. Chưa chơi thủ công hết cả tám loại riêng lẻ; unit test bao phủ sát thương của từng loại.

## Tự review game design

**Dữ kiện:** danh mục đủ tám loại làm cruise chết thêm 3/30 seed so với bản ba loại, nhưng giữ W không tăng lượt chết. **Nhận định:** xe hai bánh tạo nhịp né/húc khác xe lớn; container có hậu quả rõ, song một cú 50 HP với xe máy 70 HP khá nặng. **ĐỀ XUẤT, chưa áp dụng:** sau phản hồi chơi thử, nếu container/buýt xuất hiện quá bất ngờ, ưu tiên tăng thời gian đọc silhouette/cue hoặc giảm trọng số xe lớn trước khi giảm HP/sát thương; đo cùng seed số va không thể tránh, lượt chết và khả năng đạt 800 tiền. Không tăng mật độ cùng vòng này.

## Tự review UI/UX

Ưu tiên cao: graphic warning giữ hướng và tên đúng loại cho accessibility; xe dài có thân/cabin riêng, xe mở lộ tài xế, đủ để phân biệt ở cự ly gần. Ưu tiên trung bình: ở xa, silhouette placeholder của ô tô 4/7 và buýt/tải còn nhỏ trong phối cảnh; khi art/UI bước cuối tới, thử cue kích thước hoặc hình loại xe gần marker, không che hành lang lái. Chưa làm art production hay nhạc/SFX hoàn chỉnh.

## Giới hạn

Traffic chưa có xăng riêng; nước chỉ giảm tốc. Traffic–traffic collision và khách từ xe hỏng vẫn thuộc bước sau. Va người chơi và traffic chết vì ổ gà trong cùng fixed tick hiện ưu tiên cập nhật traffic trước; tiếp tục theo dõi nếu phát sinh trường hợp biên trong chơi thật. Chưa đo FPS trên máy người chơi. Repository không có remote nên chưa fetch/CI/push/PR; chưa merge.
