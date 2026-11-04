# P9 — chuyển động nhân vật trong runtime (tự review)

- Revision kiểm tra: `codex/p9-people-animation`, base `d2abb12` (trước commit).
- Cấu hình: `p8-encounter-c3-refinement-1`; Edge/Windows, viewport 1000 × 840, seed 17, các fixture DEV được nêu dưới đây.
- `handling-motorcycle`: [ảnh tài xế](evidence/p9-people-riding-seed17.png); tạm dừng giữ quãng đường không đổi, hai ảnh chụp cách nhau 1 giây giống hệt nhau; tiếp tục chạy tăng quãng đường, nút chơi lại về 0 m.
- `force-npc-hit`: [ảnh NPC](evidence/p9-people-npc-seed17.png) ở khoảng 25 m sau va chạm, nhân vật dùng tư thế văng/ngã hiện có. `p8-vendor`: [ảnh người bán](evidence/p9-people-vendor-seed17.png) ở khoảng 63 m; người và xe hàng hiện trong cảnh. `vehicle-failure`: [ảnh kết ván](evidence/p9-people-failure-seed17.png), kết thúc ở 4 m với thông báo “Xe không chạy tiếp được”; bấm chơi lại bắt đầu lượt mới. Không có lỗi JavaScript trong các lượt này.
- Bằng chứng chuyển động khớp thời gian: test kiểm tư thế đi, thở, vẫy tay, rig tài xế Blender và NPC sự kiện tại nhiều thời điểm; gọi lại cùng thời gian trả cùng tư thế. Chuyển động chỉ dùng `activeSeconds` của simulation; crash/recovery vẫn dùng timer gameplay. Tùy chọn giảm chuyển động của hệ điều hành cố định nhịp trang trí. Không thêm collider, lực hay nguồn RNG.
- Gate đã chạy trên thay đổi cuối: `pnpm lint` pass, `pnpm typecheck` pass, `pnpm test --maxWorkers=1` pass (59 file, 359 test), `pnpm build` pass. Build có cảnh báo kích thước chunk Three.js đã tồn tại.

## Game design review — tự đánh giá từ fixture và test

- Dữ kiện: người ngồi không trượt khỏi điểm ghế trong test; NPC va chạm và kết ván/chơi lại vẫn hoạt động trong Edge. Người chờ có cử chỉ vẫy tay giúp nhận ra mục tiêu đón khách; người không thể đón giữ tư thế đứng với nhịp thở nhẹ.
- Nhận xét: cử chỉ nhỏ giúp cảnh sống hơn mà không cạnh tranh với cảnh báo. **ĐỀ XUẤT:** nếu playtest cho thấy vẫy tay quá nổi khi nhiều NPC xuất hiện, giảm biên độ hoặc chỉ kích hoạt trong tầm đón; kiểm bằng seed có nhóm khách đông và đo khả năng nhận ra hazard, chưa đổi cân bằng.

## UI/UX review — tự đánh giá từ Edge và ảnh

- Ưu tiên cao: pause đóng băng cả gameplay lẫn hình, đã kiểm bằng hai ảnh giống hệt nhau; crash và kết ván vẫn rõ, không phát sinh overlay mới.
- Ưu tiên vừa: tư thế người bán hàng nhỏ ở góc nhìn 9:16, khó xác nhận nhịp chân từ ảnh tĩnh; cần người chơi xem trực tiếp trên thiết bị đích. Ảnh không chứng minh cảm giác timing hay mức công bằng của va chạm.

Giới hạn: chưa có đánh giá độc lập hoặc số FPS/GPU trên thiết bị đích. Chuyển động procedural là placeholder, chưa phải art/animation cuối.
