# P9 — gió bay thay vùng màu trên đường (tự review, 26/10/2026)

## Thay đổi

Vùng gió không còn mesh màu phủ cả ba làn. Một InstancedMesh gồm 30 vệt mảnh, hơi cong, dài/ngắn và nghiêng khác nhau bay ngang theo dấu `lateralPush`; không ghi depth hoặc che kín lane. Thời gian lấy từ active time của simulation; giảm chuyển động giữ vệt tĩnh nhưng HUD cảnh báo và hướng gió vẫn còn. Thẻ hướng dẫn thường và fixture gió đã đổi câu mô tả cho đúng hình mới. Không đổi diện tích, lực, thời điểm gió hay collider.

## Kiểm tra thực tế

Codex parent xem IAB/Windows trên `p62-wind-right&seed=17&diagnostics` và `p62-wind-left&seed=17&diagnostics`. Ở khoảng 42 m trước gió, HUD Wind và khoảng cách còn rõ; trong vùng gần 90–95 m, vệt bay hiện trên đường, nền road giữ nguyên màu, làn và xe vẫn đọc được. Bản đầu 44 vệt quá dày, trông như các đường kẻ song song; bản sau giảm còn 30 vệt, thêm độ cong/góc/chiều dài và hạ alpha. Ảnh tĩnh bản sau vẫn hơi giống vết xước trắng. Gió trái/phải có lực làm lệch xe đúng hướng; parent đã tạm dừng ở 90 m và chơi lại về 0 m/xăng ban đầu. Không có bằng chứng đo trực tiếp tốc độ GPU trên thiết bị đích hoặc kiểm gió cạnh nước trong cùng khung.

Art director là **agent Codex cùng nhóm**, review dựa trên mã và quan sát do parent chuyển lại, không có trình duyệt trong phiên agent; tự đánh giá cue gió **6–7/10**, chưa đạt ngưỡng chủ dự án muốn. HUD khoảng cách là cảnh báo chính vì VFX không vẽ một ranh giới màu cứng.

Rubric toàn cảnh hiện tại, cũng là tự đánh giá: silhouette/đọc hình 7; sáng tối 6; màu/mood 6; ngôn ngữ hình khối 6; ánh sáng/VFX 6–7; UI/typography 7; nhất quán 6; tiếp cận/hiệu năng 6. VFX gió không giải quyết các mặt tiền GLB còn kem hoặc dải fog cuối đường, và chưa được benchmark hay thử chế độ giảm chuyển động trên thiết bị đích. Mục tiêu **mỗi tiêu chí >7/10 vẫn chưa đạt**.

## Gate và đánh giá

Targeted `art-wind-streaks`, `road-hud`, `environment-forces` có một lần fail vì test giới hạn ngang .25 m, trong khi ribbon cong rộng .28 m; sửa ngưỡng bảo vệ hình nhỏ thành .35 m. `pnpm lint`, `pnpm typecheck`, `pnpm build`: pass (exit 0); build vẫn cảnh báo chunk Three.js trên 500 kB. `pnpm test --maxWorkers=2`: 61 file, 367/367 test pass (exit 0). Chưa có CI/review con người và chưa merge.

**Game design — dữ kiện:** lực, thời điểm hazard và HUD không đổi; người chơi vẫn thấy cảnh báo trước vùng. **Nhận định:** thay lớp màu bằng gió bay giúp mặt đường liên tục và ít nhầm với nước, nhưng mép bắt đầu/kết thúc kém sắc hơn. ĐỀ XUẤT: kiểm playtest người thật ở nhiều seed để xem họ nhận biết lúc vào/ra gió qua HUD và chuyển động; chỉ thêm cue mép vùng nếu phản ứng muộn, không đổi lực để bù cho art.

**UI/UX — dữ kiện:** card lần đầu và fixture đã dùng từ “vệt gió bay”, không còn nói “vùng màu”. **Ưu tiên vừa:** xác minh cue khi có nước/bóng mây và với giảm chuyển động trên thiết bị đích; ảnh tĩnh không chứng minh timing/cảm giác bù lái.
