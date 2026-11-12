# Đường ray tàu — tự đánh giá 11/11/2026

## Thay đổi

- Đặt hai thanh ray và các tà vẹt cố định ngang đường tại vị trí sự kiện tàu. Đây là hình học trang trí, không đổi collider, lịch tàu, RNG hay cân bằng.
- Ray xuất hiện khi sự kiện đã nằm trong thế giới, kể cả lúc tàu còn chờ ngoài màn hình. Tàu di chuyển ngang độc lập; ray ở lại sau khi toa cuối rời đường và chỉ được thu hồi khi sự kiện ra khỏi phạm vi thế giới.
- Kích thước/màu ray là **TẠM** để thử khả năng đọc trên nền đường mưa; không coi là art đã nghiệm thu.

## Kiểm tra

- Revision trước commit: base `3e3dc6e` (main); seed 17, `?scenario=p61-train-left&seed=17`, trình duyệt trong ứng dụng, Windows. Bắt đầu ván và đóng card đầu tiên. Quan sát ray nằm ngang dưới tàu ở khoảng 49 m; ở khoảng 71 m toa đã qua và ray vẫn nằm trên đường gần xe. Camera/HUD tiếp tục chạy, tốc độ trung vị khoảng 50,4 km/h. Chưa thử hướng tàu ngược, va chạm tàu, restart hoặc Q/E.
- Unit: kiểm tra ray tách khỏi thân tàu, có hai thanh ray/13 tà vẹt, giữ gốc cố định khi thân tàu đi ngang; kiểm tra footprint tàu cũ vẫn giữ.
- Lint `pnpm lint`: pass, exit 0. Typecheck `pnpm typecheck`: pass, exit 0. Build `pnpm build`: pass, exit 0. Full tests `pnpm test --maxWorkers=2 --testTimeout=15000 --reporter=dot`: 87 tệp, 493 ca pass, exit 0. Chạy trên Windows với pnpm 11.25.0.

## Tự review game design và UI/UX

**Dữ kiện:** screenshot trực tiếp ở 49 m và 71 m cho thấy ray cố định dưới tàu và tồn tại sau khi tàu rời. Test chỉ bảo vệ cấu trúc và vị trí ray; không chứng minh nhịp va chạm hay cảm giác lái.

**Game design — ý kiến:** ray giúp báo trước điểm cắt ngang và có thể làm cảnh đọc công bằng hơn khi tàu chưa xuất hiện. Không đổi độ khó/RNG. **ĐỀ XUẤT** cho lượt chơi thử tiếp: lái chậm qua ray ở cả hai hướng, kiểm tra ray không bị hiểu là chướng ngại gây sát thương riêng.

**UI/UX — ý kiến:** hai vạch sáng và tà vẹt đọc được trên đường tối mà không che xe/HUD. Ưu tiên kiểm tra ở độ phân giải hẹp, mưa dày và khi rẽ Q/E; nếu quá nổi, giảm sáng vật liệu thay vì xóa tín hiệu.
