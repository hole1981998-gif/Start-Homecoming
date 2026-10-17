# P4B — kiểm tra khách sau va chạm

Revision: branch `fix/passenger-crash-outcome-and-recovery`, config `p4b-crash-rider-roster-1`. Tự đánh giá của Codex, không phải review độc lập.

## Dữ kiện đã kiểm tra

- `pnpm lint`, `pnpm typecheck`, `pnpm test` (64 test), `pnpm simulate` (13 test), `pnpm build`: pass sau khi sửa fixture; build có cảnh báo bundle >500 kB. Simulation 30 seed ghi median đạt 800 tiền: cruise 85,7 s, W 61,2 s, S 149,8 s. Đây là mẫu economy hiện tại, không đo trực tiếp tỷ lệ khách quay lại.
- Test outcome duyệt 256 seed với 4 khách: có đủ kết quả 0–4 khách ở lại, và hoán vị danh sách khách không đổi quyết định của từng ID. Test survival xác nhận ID được giữ nhất quán qua crash, reboard, F/G và crash tiếp theo; test world xác nhận bay → nằm → đứng. Test HUD xác nhận không gợi F cho khách từ chối quay lại.
- In-app browser tại `?scenario=passenger-crash-car&seed=17`: bắt đầu 4/4, va chạm ô tô trước mắt xe làm HUD về 0/4 khi cả nhóm rơi, sau tài xế quay lại HUD 2/4; hai NPC ở lại hiện trên đường. HP 120 → 100 đúng một va chạm. Quan sát được hình sau khi đứng dậy; **chưa bắt được screenshot đúng khoảnh khắc nằm/ngồi dậy** vì thời gian chuyển động ngắn. Test pose thuần xác nhận trạng thái đó nhưng chưa thay cho xác nhận trực quan từng frame.
- Nhấn Chơi lại sau va chạm đưa bản thử về màn sẵn sàng với 4/4, xăng 16 L, HP 120 và quãng đường/điểm 0; không giữ NPC từ lượt trước.

## Tự review game design

Dữ kiện: kết quả từng người đa dạng qua seed, không còn quy luật cố định “luôn đúng một người ở lại”; trong fixture ô tô seed 17 còn một khách trên xe. Nhận định: mất khách tạo hậu quả dễ hiểu hơn nếu họ còn hiện tại điểm rơi và không nhận F. Tỷ lệ 0,5 hiện là số thử; **đề xuất** lấy mẫu nhiều va chạm trong các lượt chơi thật rồi hỏi người chơi liệu việc mất cả nhóm có quá phạt hay không trước khi thay đổi tỷ lệ. Không đổi economy trong sửa lỗi này.

## Tự review UI/UX

Ưu tiên cao: HUD 0/4 trong giai đoạn cả tài xế lẫn khách đang ở ngoài xe và 2/4 sau reboard khớp trạng thái simulation; lời mời F không còn hiện với khách từ chối. Ưu tiên trung bình: cần quan sát trực tiếp animation nằm/đứng ở tốc độ chơi thật và từ nhiều góc camera, nhất là khi có hazard phủ mặt đường. Visual prototype còn placeholder; không polish art ở vòng này.

Manual chưa kiểm tra trong lượt này: failure terminal và quan sát animation từng frame. Unit UI hiện có kiểm tra failure/restart; vẫn cần playtest người chơi trên bản này. Không có remote Git để chạy CI/push/PR.
