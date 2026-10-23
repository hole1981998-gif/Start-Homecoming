# Sân thử lực va chạm arcade × Cannon

Ngày 19/10/2026, Windows. Revision làm việc trên `codex/p7-secret-ending`; các thay đổi P7/handling từ trước vẫn chưa commit, file P6.3 có sửa trước được giữ nguyên. Đây là tự đánh giá của Codex từ test và in-app browser. Số khối lượng, lực và damage là **TẠM**; sân thử chưa vào ván chính.

## Chơi thử

Mở `http://127.0.0.1:5173/physics.html?case=mixed&seed=17`. Trang có năm ca: hỗn hợp, xe ↔ xe, xe ↔ NPC, thùng rơi và chuỗi xe. Bấm **Bắt đầu**, W/S điều tốc, A/D lái, Esc tạm dừng, R tạo ván mới cùng seed. Xe người chơi màu vàng, traffic đỏ, NPC xanh, hàng rơi xám; chỉ số HP và số va chạm ở trên. Ca riêng cho phép tách từng tương tác; ca hỗn hợp để xem phản ứng dây chuyền. Đây là sân thử phản lực, không phải game có economy/shop/secret.

## Cơ chế và bằng chứng

- Cannon giải tiếp xúc giữa rigid bodies, mặt đường/lề và quán tính. Motor arcade áp xung lực có trần để xe vẫn đáp ứng phím, không đặt thẳng vị trí khi va chạm. Damage/choáng dùng severity từ tốc độ tương đối và reduced mass; nhiều contact points của cùng cặp trong một tick được gộp, có cooldown 0,75 s để không nhân HP mất khi vật vẫn chạm.
- Test mô phỏng: va xe–xe trừ HP hai phía một lần cho cú đầu; NPC là body động; thùng sinh từ phía sau xe tải rồi có contact thật; chuỗi xe finite/tái hiện cùng seed; 30/60/120 FPS cho cùng kết quả ở 60 Hz; reset xoá contact/HP cũ.
- In-app browser: ca hỗn hợp cho thấy xe traffic, NPC và người chơi đẩy nhau, HP người chơi giảm từ 120 xuống 110 trong lượt quan sát, 12 contact được đếm; ca thùng rơi sinh hai vật thể và có `cargo–player`, HP còn 116. Screenshot xác nhận cảnh và UI, không chứng minh chất lượng lực/timing bằng cảm giác người chơi. Không thấy lỗi render trong hai ca đã chơi.

## Tự review game design và UX

**Dữ kiện:** va chạm không còn chỉ cắt HP; xe/thùng/NPC có phản lực và đường đi tiếp diễn. **Ý kiến:** ca hỗn hợp dễ quá tải vì nhiều va chạm dồn, cần xem từng ca riêng trước. Motor traffic tiếp tục đẩy sau va chạm tạo các contact lặp sau cooldown; trước tích hợp nên thử giới hạn đẩy khi kẹt và luật xe hỏng/khách rơi. Khi đem vào ván chính phải giữ tàu thua ngay, secret xét đúng trước damage, player crash immunity, traffic HP/idempotence, collision tốc độ cao và tính khả thi spawn. Không dùng số damage sân thử để âm thầm thay cân bằng hiện hành.

**UX:** màu và silhouette placeholder giúp phân biệt bốn nhóm; contact hiện dưới dạng text debug vì đây là sân thử. Nếu tích hợp, phản hồi cần VFX/số tài nguyên gần đối tượng như định hướng UI, tránh bảng log. Ca hỗn hợp cần đánh giá khả năng đọc khi nhiều vật trong một màn 9:16; cần chủ dự án chơi để nhận xét độ bật, độ trôi và mức hài hước của NPC.

## Gate và hạn chế

Windows, revision làm việc cuối: `pnpm lint` exit 0; `pnpm typecheck` exit 0; `pnpm test` exit 0 (31 files, 218 tests); `pnpm simulate` exit 0 (11 files, 121 tests); `pnpm build` exit 0, có `dist/physics.html`. Manual in-app browser: Bắt đầu, quan sát contact/HP trong ca hỗn hợp và thùng rơi; Esc pause, R restart đưa HP/số hit về đầu; viewport desktop. Sân thử dùng Cannon 0.20.0, package lock đã cập nhật. Chưa đo mobile FPS/memory, chưa thử mọi xe/độ lệch seed hoặc tiếp xúc trùng hazard gió/nước/ổ gà. Severity hiện lấy độ lớn vận tốc tương đối, chưa chiếu theo pháp tuyến contact. Chưa chạy một ván chính bằng Cannon vì chưa tích hợp. Không có remote/CI/PR/merge trong checkout này.
