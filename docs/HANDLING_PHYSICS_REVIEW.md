# Thử quán tính ngang và nghiêng xe

Ngày 19/10/2026, Windows, config `p7-handling-1`, revision làm việc trên `codex/p7-secret-ending` (working tree còn thay đổi P7 chưa commit). Đây là tự đánh giá của Codex từ simulation và thao tác in-app browser, không phải review chuyên gia độc lập. Các số trong BALANCE_CONFIG.md là TẠM.

Mọi xe người chơi giữ tốc độ ngang mục tiêu khi nhấn A/D nhưng không đạt hoặc bỏ tốc độ đó tức thì. Gia tốc/hãm ngang bị giới hạn bởi độ bám xe và giảm khi tốc độ tiến tăng; khi thả hoặc đảo hướng, vận tốc ngang còn lại làm xe trượt tiếp. Mép đường kẹp vị trí và triệt vận tốc hướng ra ngoài. Mesh nghiêng theo vận tốc/gia tốc ngang ở mức riêng từng xe; collider và tài nguyên vẫn dùng simulation, không dùng góc nghiêng để xử lý va chạm. Xe chướng ngại giữ logic cũ.

## Bản chơi thử

Mở `http://127.0.0.1:5173/?scenario=handling-motorcycle&seed=17` để thử xe máy trên đường trống. Thay `motorcycle` bằng `motorbike`, `car4`, `car7`, `tricycle`, `bus`, `truck` hoặc `container`. Bấm Bắt đầu lái, giữ W rồi A/D, thả lái; lặp lại khi giữ S để so quãng trượt. Đây là fixture DEV chỉ tắt spawner, không thay luật lái ván thường. Những xe lớn có tốc độ, kích thước và giới hạn mép đường khác nhau nên so cảm giác, không suy riêng khác biệt độ bám từ một lượt chơi.

## Bằng chứng và tự review

- Simulation fixed step kiểm tra cùng vận tốc ngang ban đầu: tốc độ cao trượt xa hơn tốc độ thấp; cùng tốc độ, grip thấp trượt xa hơn; đảo lái giảm vận tốc ngang và không vượt mép đường. Test tích hợp kiểm tra ô tô 4 chỗ và container thật sử dụng grip của xe đang equip, không đổi công thức kiếm tiền theo quãng đường. Test 30/60/144 FPS và 20 phút seeded của nền lái tiếp tục kiểm tra tính quyết định.
- In-app browser: mở fixture xe máy, tăng tốc rồi A/D; screenshot khi đổi hướng cho thấy thân xe nghiêng, xe di chuyển ngang trong hành lang lái, HUD và tài nguyên vẫn đọc được. Mở fixture container, đánh lái và thấy game tiếp tục chạy, không lỗi render. Thao tác trực tiếp này chưa đo định lượng góc nghiêng hay cảm giác của người chơi.
- Trên cùng bộ 30 seed baseline, số ván kết thúc trong mẫu tăng từ 9 lên 11 khi chỉ cruise, 13 lên 16 khi giữ W, 3 lên 4 khi giữ S; cả ba chiến thuật vẫn đủ tiền mua xe 30/30 seed với median lần lượt 85,72 s, 60,18 s, 149,78 s. Đây là dấu hiệu độ khó tăng do đường lái, không phải bằng chứng curve dài đã đạt. Cần kiểm tra riêng seed chết thêm trước khi khóa số grip.
- **Ý kiến game design:** quán tính làm né muộn ở tốc độ cao khó hơn theo cách người chơi có thể học. Cần cân ở P8 bằng cùng seed/input tại các tốc độ và xe, đặc biệt cửa sổ phản ứng 3,5 s, đường bị phủ hai làn, gió và giao lộ. Nếu lượt chết tăng mạnh, ưu tiên cảnh báo sớm hoặc giảm grip penalty hơn là tăng xăng/HP bù ngầm. **Ý kiến UX:** nghiêng giúp báo hướng/lực trượt trực quan; nên kiểm tra các xe dài có che resource ring và cue ở P9. Không thêm popup chữ cho trượt thông thường.

Gate trên Windows: `pnpm lint` exit 0; `pnpm typecheck` exit 0 sau khi sửa kiểu tham số test; `pnpm test` exit 0 (30 files, 214 tests); `pnpm simulate` exit 0 (11 files, 121 tests); `pnpm build` exit 0 (cảnh báo bundle >500 kB đã có, build thành công). Browser kiểm tra thêm ca tàu: không nhảy kết ván “Va chạm tàu hoả” ở 12 m; Chơi lại đưa vào ván mới. Chưa đo playtest người thật hoặc xác suất sống toàn bộ catalog sau thay đổi, nên chưa chốt độ bám. Không có remote ở checkout này; không có CI/PR/merge. File P6.3 đã sửa từ trước được giữ nguyên.
