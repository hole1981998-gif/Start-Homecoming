# P4.1 — xe giao thông có HP

Revision: branch `feature/p4-1-traffic-durability`, config `p4-1-traffic-durability-1`, seed thử tay 17. Đây là tự review của Codex từ test/simulation và lượt chơi trực tiếp, không phải chuyên gia độc lập.

## Quan sát thực tế

- Kiểm tra tự động: `pnpm lint` pass, `pnpm typecheck` pass, `pnpm test` 69/69 pass, `pnpm simulate` 13/13 pass, `pnpm build` pass (cảnh báo bundle >500 kB). Test mới xác nhận ba loại traffic seeded, HP/sát thương/kích thước theo loại, nước hãm, ổ gà gây impact một lần và damage theo thời gian, wreck dừng/không hit lại, buýt húc xe nhỏ mất 8 HP rồi chạy tiếp, xe máy vẫn ngã và mất 20 HP.
- Mẫu economy/survival 30 seed (`tests/playtest.test.ts`): cruise đủ tiền mua ô tô ở 30/30 seed, median 85,7 s, chết 10/30; giữ W 30/30, median 61,2 s, chết 14/30; giữ S 26/30, median 149,8 s, chết 4/30. Bản P4B trước sửa traffic ghi 8/30, 9/30, 3/30 lượt chết tương ứng. Đây là mẫu chiến thuật cố định, chưa phản ánh né chủ động và chưa chứng minh mọi seed công bằng.
- Trình duyệt trong app, `?scenario=traffic-ram&seed=17`: bắt đầu 1/25, buýt 210 HP; húc xe nhỏ tại khoảng 2 m, HP còn 202, xe tiếp tục chạy và không có màn ngã. Đến 37 m vẫn 202 HP. `?scenario=vehicle-failure&seed=17`: xe máy 20 HP va xe ở 5 m, kết ván ở 0 HP; bấm Chơi lại bắt đầu ván mới, HP về 20 trong fixture. Camera/HUD hiện bình thường; chưa đo FPS trên thiết bị người chơi.
- Trình duyệt trong app, ván thường `/`: màn sẵn sàng hiển thị 1/2, 5,5 L và 70 HP; giữ A, camera/đường đổi tương đối tới sát mép trái mà xe còn trong mặt đường, cảnh báo nước bên phải 60 m đọc được; nhấn Chơi lại đưa quãng đường/điểm về 0 và modal bắt đầu. Đã để tab bản thường mở sẵn cho chủ dự án chơi thử.

## Tự review game design

**Dữ kiện:** xe loại nặng gây tăng tử vong ở cả ba chiến thuật mô phỏng, mạnh nhất khi giữ W. Húc phá tạo lựa chọn chiến thuật cho buýt/tải/container, nhưng chi phí HP không bằng 0; xe nhỏ tránh hoặc chịu ngã. **Nhận định:** tăng nguy hiểm hợp feedback trước rằng game còn dễ, nhưng 14/30 lượt giữ W chết là mức đáng theo dõi. **ĐỀ XUẤT, chưa áp dụng:** sau playtest chủ dự án, nếu cảm giác xe tải ngược chiều quá phạt, thử giảm damage traffic tải 36→30 hoặc giảm tỷ trọng tải 1/4→1/6, chạy lại cùng seed và so sánh số lượt chết, thời gian đủ 800 tiền và số va chạm không thể tránh. Không đổi economy trước khi có nhận xét.

## Tự review UI/UX

Ưu tiên cao: xe nhỏ/van/tải có chiều dài, rộng và màu khác nhau bằng placeholder; xác xám ngắn giúp đọc hậu quả húc. Cue graphic vẫn cho hướng xe; thẻ lần đầu giải thích loại xe và húc. Ưu tiên trung bình: bản hiện chưa có dấu HP trên xe giao thông; người chơi phải học khả năng húc qua kho/Help/thử nghiệm. P sau có thể thêm cue nhỏ gần xe nếu người chơi thấy quyết định húc thiếu thông tin. Không dùng art hoàn chỉnh ở P4.1.

## Giới hạn

Traffic chưa có nhiên liệu riêng: nước chỉ giảm tốc, không đốt fuel. Chưa có va chạm traffic–traffic, khách xuất hiện từ xe hỏng (P4.2), hay shop để sửa sau khi húc (P5). Hai sự kiện húc người chơi và traffic chết vì ổ gà trong cùng một fixed tick hiện ưu tiên cập nhật traffic trước; đây là trường hợp biên cần test thêm nếu dữ liệu chơi thực phát sinh. Không có remote Git nên chưa chạy CI, push hoặc tạo PR; không merge.
