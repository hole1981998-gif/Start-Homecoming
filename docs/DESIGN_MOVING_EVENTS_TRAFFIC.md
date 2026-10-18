# P6.1 — vật chắn chuyển động và tai nạn giao thông phát sinh

## Trạng thái
**ĐÃ CHỐT theo feedback chủ dự án 18/10/2026; ĐÃ CÓ BẢN THỬ TÌNH HUỐNG, CHƯA TÍCH HỢP.** Chủ dự án chưa đánh giá được tổng thể từ các fixture công an/tàu riêng lẻ. P6 hiện có khối chắn bật/tắt là giới hạn implementation, không phải design đúng. Implementation thử tách riêng theo yêu cầu tiếp sau; giá và độ khó ván thường chưa đổi.

## Tàu chạy ngang đường
- Tàu là đoàn vật thể có chiều dài hữu hạn, chạy liên tục từ phải qua trái hoặc trái qua phải. Đầu tàu tiến vào, các toa đi ngang, đuôi tàu rời đường; chuyển động primitive đủ đọc ở prototype, không chờ art production.
- Hitbox bám vị trí/hình khối thật của đoàn tàu trong simulation. Lane bị chiếm khi phần thân tàu đi vào lane đó, thông khi đuôi tàu thực sự đi khỏi. Tàu dài có thể che cả ba lane một lúc; không dùng timer để tắt đồng loạt cả ba collider khi đuôi vẫn còn trên đường, không làm tàu biến mất ngay tại mặt đường.
- Chạm thân tàu vẫn kết ván theo luật hiện có, kể cả star/dự phòng. Nitro + Space chỉ vượt khi xe thật sự đủ cao và toàn bộ footprint qua thân tàu, hạ cánh an toàn. Người chơi có thể né đoạn chưa bị chiếm/đã thông, chọn nhánh hợp lệ hoặc phanh chờ; director không tạo màn bắt buộc có nitro.
- **CHƯA CHỐT số:** tốc độ ngang, độ dài/số toa, tần suất và khoảng giữa các đoàn. Chu kỳ P6 đóng 8 s/mở 8 s chỉ là số của placeholder cũ, không tiếp tục coi là quy tắc chiếm lane P6.1.

## Công an/dân phòng di chuyển
- Mỗi NPC có footprint tương đương một người, đôi khi nhóm có hai NPC. Họ đi ngang qua lại giữa các lane khá nhanh, khiến người chơi phải chủ động né hoặc dùng chuối; không phải một vùng bắt phủ cả ba lane.
- Va chạm thật với **NPC còn khả năng bắt** mới áp dụng phạt/tịch thu theo loại và chính sách đủ/thiếu tiền đã có. Đi qua vị trí event hoặc băng qua cùng mốc quãng đường nhưng không chạm NPC thì không bị bắt. Star giữ luật không vô hiệu event khi thực sự chạm NPC đang bắt được.
- **ĐÃ CHỐT:** một chuối dùng thành công vô hiệu toàn bộ nhóm công an/dân phòng mục tiêu. Nhóm hai người thì cả hai đồng thời đứng yên và mất khả năng bắt, chỉ tiêu một chuối. Người chơi chạm bất kỳ người nào trong nhóm đã bị vô hiệu đều không bị phạt, tịch thu hay tác động xấu từ nhóm đó. Giữ cả hai ở vị trí hiện tại để đọc được hậu quả; không xóa NPC khỏi đường.
- Phạm vi vô hiệu là nhóm được nhắm tới, không lan sang nhóm khác trên đường. **ĐỀ XUẤT mặc định:** cả nhóm giữ trạng thái vô hại tới khi event được thu hồi, tránh tái kích hoạt ngay dưới xe. Thời lượng nếu muốn hồi phục, cách chọn nhóm/đường ném, xác suất nhóm hai và tốc độ chính xác chưa được chủ dự án chốt. Quy tắc một chuối vô hiệu cả nhóm là ĐÃ CHỐT, thay đề xuất cũ chỉ vô hiệu một người.

## Traffic tự tương tác và gây tai nạn
- **ĐÃ CHỐT về cơ chế:** xe chướng ngại tương tác với hazard khác và va lẫn nhau. Khi giao thông đông ở độ khó cao, các tương tác có thể gây tai nạn, giảm HP rồi hỏng xe; không chỉ sinh một khối accident có sẵn để người chơi chạm.
- Dùng đặc tính riêng của từng loại xe đã có (HP/sức chịu va chạm/kích thước), xử lý hậu quả hai phía khi va nhau. Chạm hazard áp dụng các phần luật/tài nguyên tương ứng, ví dụ ổ gà giảm HP theo thời gian; không mặc định mọi lần chạm đều hỏng tức thì.
- Phân biệt **cơ chế va chạm** với **tuning tần suất**: P6.1 bổ sung tương tác, P8 mới cân mật độ/curve và xác suất tai nạn theo quãng đường. Không tăng đông xe hay damage ngầm chỉ để dễ thấy tai nạn.
- Xe HP=0 chuyển hỏng đúng một lần, không nhân khách/loot ở mỗi frame hay sau cleanup. Giữ luật khách từ xe bị người chơi húc hỏng không nhận lên xe người chơi; tai nạn môi trường/traffic–traffic dùng luật khách môi trường hiện có. Nếu có chuỗi va chạm, lưu nguồn gây hỏng rõ ràng; cách quy trách nhiệm gián tiếp còn là đề xuất triển khai cần ghi khi làm.
- **CHƯA CHỐT:** mọi xác xe có trở thành event accident làm xe người chơi HP=0 hay chỉ là xác/vật cản thường. Mặc định bảo thủ giữ tách riêng: hỏng traffic không tự tạo collider secret hoặc instant-destroy mới. P7 chỉ tính đúng loại vụ tai nạn có ID/điều kiện được định nghĩa cho secret; không vô tình đổi luật húc phá đã duyệt.

## Implementation đề xuất và gate P6.1
1. Tọa độ/quỹ đạo ngang do fixed-step simulation quản lý, RNG seeded cho hướng/tốc độ/phase; renderer và cue đọc cùng pose. Pause/shop không làm NPC/tàu chạy tiếp. Di chuyển qua lại liên tục, không teleport tại mép đường; rẽ giữ dữ liệu nhánh và retire cảnh cũ như hiện có.
2. Sweep chuyển động tương đối cả hai phía cho player–tàu, player–officer, traffic–traffic và traffic–hazard. Timestamp/tie-break ổn định, group ID để chuối cập nhật đồng thời cả nhóm và trừ món một lần; contact/pair ID chống damage/phạt lặp do đứng chồng nhau; xử lý hai xe đồng thời, không phụ thuộc thứ tự mảng. Không cộng hậu quả theo render FPS.
3. Director xét cả quỹ đạo trong thời gian người chơi tới, bề rộng/chiều dài xe, tốc độ khép khoảng cách, quãng phanh và QTE. Nhóm hai NPC vẫn cần cửa sổ né công bằng; traffic tự tai nạn không được sinh vật cản ngay dưới xe người chơi mà không có tín hiệu/khoảng phản ứng hợp lý. Không bảo đảm an toàn chỉ bằng đếm lane trống ở thời điểm spawn.
4. Bổ sung fixture hướng trái/phải, một/hai officer, một chuối vô hiệu cả hai cùng nhóm và chạm từng người không bị bắt, không vô hiệu nhóm khác, tàu đầu/giữa/đuôi, chạm khi nhảy/hạ cánh, hai traffic va nhau/hazard/chuỗi hỏng. Chạy nhiều seed và đủ catalog xe; kiểm tra 30/60/144 FPS, pause, restart, rẽ/cleanup/idempotence.
5. **Gate sau khi chủ dự án duyệt các tình huống riêng:** ván bình thường có shop, vật phẩm, hành khách, giao lộ, tài nguyên và các event mới cùng hoạt động. Fixture chỉ hỗ trợ tái hiện bug, không thay bản này. Bàn giao link ván thường và fixture, ghi seed/config cùng playtest tuyến dài có tương tác thật; tách rõ kết quả fixture và nhận xét tổng thể.
6. Theo yêu cầu tiếp sau, P6.1 chia hai bước: A — bộ tình huống riêng gồm tàu/officer/chuối, rào/vật cản ngang và traffic tương tác; B — chỉ sau khi chủ dự án duyệt A mới triển khai bản chơi tích hợp. Không gọi milestone xong khi mới có A hoặc khi chỉ test tình huống đặt sẵn. Rào/cây/xe chắn và hàng rong/cứu thương theo scope P6.1 cũ vẫn được giữ, không tự xóa khỏi roadmap.

Visual chỉ cần primitive chuyển động rõ và khớp collider để kiểm tra gameplay. UI/art đầy đủ ở P9, SFX/VFX hoàn chỉnh P10; đây không phải lý do hoãn chuyển động cơ học hoặc cue cần để né ở P6.1.

## Kiểm tra lượt cập nhật tài liệu
Branch local codex/p6-1-moving-events-design, base b75f447; chỉ sửa sáu file design, không sửa runtime/test/config TypeScript hay sources/. Đã chạy pnpm lint, pnpm typecheck, pnpm test (142 tests/23 files), pnpm build: tất cả exit 0; build còn cảnh báo chunk 577,88 kB. Đây chỉ là kiểm tra hồi quy bản code P6 hiện có, không chứng minh chuyển động P6.1 đã chạy. Manual gameplay mới: chưa chạy vì chưa triển khai các cơ chế mới. Git diff --check pass. Repo không có remote, chưa push/PR/CI; chưa merge, chờ chơi thử khi P6.1 có bản triển khai.


## P6.1 — bản thử tình huống trước tích hợp (18/10/2026)
Theo yêu cầu mới nhất của chủ dự án: triển khai và duyệt các tình huống riêng trước; chỉ làm bản tích hợp khi chủ dự án đồng ý. Đã có 15 fixture DEV tại http://127.0.0.1:5173/p61.html, version `p61-scenarios-1`: tàu ngang hữu hạn, officer 1/2 người, chuối vô hiệu cả nhóm, traffic va nhau/hazard, rào, hàng rong và cứu thương. Chỉ fixture bật experimentalMotion/experimentalTraffic; director ván thường chưa dùng các cơ chế này. Đây chưa phải hoàn thành toàn bộ P6.1.
Các số mới đều TẠM: tàu dài ngang 24 m, sâu 2,8 m, tốc độ ngang 6 m/s; NPC rộng/sâu 0,65 m, chạy ngang 4,5 m/s trong ±4,35 m; rào rộng 6,2 m/sâu 1,4 m, damage traffic 20 một lần; hàng rong ngang 2,2 m/s; cứu thương dọc 16 m/s. Không đổi giá, thu nhập, fuel hay mật độ ván thường. Báo cáo và giới hạn tích hợp: [PROTOTYPE_6_1_SCENARIOS_REVIEW.md](PROTOTYPE_6_1_SCENARIOS_REVIEW.md). P8 tuning độ khó/economy, P9 UI/art, P10 SFX/VFX giữ nguyên.


## P6.1 tuning tình huống — feedback 18/10/2026
Version `p61-scenarios-2`, chỉ DEV, chưa tích hợp. Tàu chạy từ đầu vào tới đuôi rời toàn mặt đường trong 4 s (chủ dự án xác nhận), speed = (24 + 9,6)/4 = 8,4 m/s, giữ kích thước. Thời gian ở mỗi lane suy ra từ hình học, không timer tắt collider. Thêm 4 fixture công an/dân phòng: chạy nhanh 6,3 m/s; lệch nhịp 5,6 và 3,8 m/s, cách dọc 3 m, phạm vi ngang [-4,35;1,6] và [-1,6;4,35] m. Giữ nhóm/chuối/phạt như cũ. Hàng rong tăng 2,2→3,4 m/s, dài 1,5→2,1 m, rộng 0,8→1,1 m. Các số mới TẠM để chủ dự án chơi thử, chưa điều chỉnh director/difficulty curve/economy. Hub hiện có 19 ca. Báo cáo: [P61_EVASION_TUNING_REVIEW.md](P61_EVASION_TUNING_REVIEW.md).
