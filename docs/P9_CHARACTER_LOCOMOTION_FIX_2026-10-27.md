# P9 — sửa hướng và bước chạy nhân vật (Codex tự review, 27/10/2026)

## Phạm vi

- Người bán và xe hàng cùng xoay theo vận tốc băng ngang; người bán đứng ở phía sau xe hàng ở cả hai chiều. Công an/dân phòng nhìn theo chiều chạy thực, gồm lúc patrol pingpong quay đầu; chân dùng pose chạy với sải rộng và nhịp nhanh hơn.
- Khi té xe, tài xế đứng lên rồi chạy tới xe; cùng model Blender đang dùng ở cảnh văng có chuyển động hip, chân, gối, tay. Khách **được simulation chọn quay lại** đứng lên rồi chạy về xe bằng pose procedural. Khách bị bỏ lại không bị ép quay về.
- Chỉ đổi hình ảnh và nội suy vị trí nhìn thấy. Đồng hồ va chạm, danh sách khách trở lại, hitbox, tài nguyên, RNG và kết quả crash do simulation giữ nguyên.
- Review code phát hiện xe tốc độ cao có thể còn trượt sau mốc quay về 3,1 giây. Pose chạy của tài xế/khách trở lại được giữ cho tới khi trạng thái crash thật sự kết thúc, tránh chân đứng yên khi model còn theo xe; test kiểm mốc sau 3,1 giây. Ca tốc độ cao này chưa được xem trực tiếp trong browser.
- Nhánh dựa trên `c3d29c4` của PR #12 vì chuỗi P9 chưa vào `origin/main`.

## Kiểm tra trình duyệt thực tế

Edge headless Windows, 540 × 960, DEV Vite, seed 17; Codex thao tác browser, không phải playtest người thật.

| Bước | Bằng chứng | Quan sát |
|---|---|---|
| 1. Công an | [ảnh `p61-police-one`](evidence/p9-character-locomotion/p61-police-one.png) | Ở khoảng 52 m; thân quay ngang đúng chiều băng đường, chân tách bước, cue chuối và làn còn đọc được. |
| 2. Dân phòng | [ảnh `p61-militia-two`](evidence/p9-character-locomotion/p61-militia-two.png) | Khoảng 50–54 m; hai người hướng theo chiều chạy riêng, không cùng nhìn một chiều. |
| 3. Hàng rong | [ảnh `p61-vendor`](evidence/p9-character-locomotion/p61-vendor.png) | Khoảng 51–52 m; người ở sau xe hàng, cùng trục đẩy; không còn dáng đứng ngang 90°. |
| 4. Té và quay lại | [đầu đoạn về xe](evidence/p9-character-locomotion/crash-return-early.png), [cuối đoạn](evidence/p9-character-locomotion/crash-return-late.png) | `passenger-crash-car`, va chạm ở khoảng 14 m; tài xế và các khách được chọn quay lại di chuyển tới xe theo hai pha ảnh. HUD crash, HP và người còn đọc được. Escape pause, nút trong modal restart về 0 m và 4/4 người. Không có page error. |

Ảnh tĩnh không tự chứng minh nhịp chân; test khớp tại hai pha chạy và browser chạy liên tục bổ sung bằng chứng. Chưa đo cảm giác trên máy khác hoặc tốc độ rất cao.

## Review sau lượt test

- **Game designer — dữ kiện:** va chạm, thời gian bất động/hồi lại và quyết định khách trở lại không đổi; cùng fixture crash vẫn xảy ra và restart đúng. **ĐỀ XUẤT:** cho người chơi xem đoạn quay về ở xe máy và ô tô trên thiết bị thật, nhận xét liệu 1,8 giây hiện có đủ để đọc động tác không, rồi mới cân nhắc thời lượng cân bằng.
- **UI/UX designer — ưu tiên P2:** hướng chạy đã tách rõ hơn khỏi dáng đứng trượt; cue chuối, mép làn, HUD và xe còn thấy trong ảnh. Ở góc camera xa, bàn chân NPC vẫn nhỏ; cần người thật kiểm nhận diện trên màn nhỏ. Product Design Browser audit không khởi tạo được vì lỗi `CreateProcessSecurityEnvironment failed (0x80070020)`; đây là checklist thủ công dựa trên ảnh Edge chụp mới trong lượt này, không phải audit plugin hoàn tất.
- **Art direction — tự đánh giá trong 5 ảnh:** silhouette 6/10, sáng tối 6/10, màu/mood 6/10, ngôn ngữ hình khối 6/10, ánh sáng/vật liệu 6/10, UI 6/10, nhất quán 6/10, tiếp cận/hiệu năng 6/10. Chỉ chấm trên fixture nêu trên; không phải duyệt art cuối của chủ dự án.

## Gate trên mã cuối

Windows, Node 24, pnpm 11.25. `pnpm lint` pass/exit 0; `pnpm typecheck` pass/exit 0; `pnpm test --maxWorkers=2` pass/exit 0 (63 file); `pnpm build` pass/exit 0. Build còn cảnh báo chunk Three.js >500 kB. CI và review con người: chờ; merge: chưa làm.
