# P9 — ánh sáng mặt đứng nhà GLB (27/10/2026)

## Thay đổi

- Tô sắc độ ambient xanh tối theo hướng mặt đứng và hướng đèn chính sau khi đặt từng nhà GLB vào cảnh.
- Giữ màu cửa hàng/điểm nhấn riêng; chuyển bước tô màu lên trước bước gộp mesh và tách nhóm gộp có vertex color.
- Mesh đã đặt sở hữu geometry/material riêng; mẫu GLB cache và các file Blender nguồn không đổi.
- Vòng màu tiếp theo hạ riêng các mảng plaster lớn của skyline/shop/market về xám xanh dịu, và giảm nhẹ đèn rọi mặt tiền phải; giữ kính, mái hiên, cửa hàng và tín hiệu gameplay.

## Kiểm tra thực tế

Revision trước commit: nhánh `codex/p9-glb-facade-shading`, base `1e61251`. Seed/config: `handling-car4&seed=14` và `junction&seed=14&diagnostics`, Vite local, trình duyệt ChatGPT in-app trên Windows. Ở handling-car4, ván chạy từ 0 m qua 219 m: dãy nhà trái có mảng tối rõ hơn, dãy phải vẫn khá sáng/ấm; đường, xe và HUD đọc được. Ở junction, chạy từ 705 m đến 771 m, tạm dừng và chơi lại trả về 705 m, xăng 7,2 L; không thấy lỗi console trong hai kịch bản. Ảnh một khung không chứng minh cảm giác lái; vòng này không đánh giá lại điều khiển hoặc công bằng hazard.

## Gate

- `pnpm lint`: pass, exit 0.
- `pnpm typecheck`: pass, exit 0.
- `pnpm test -- tests/art-storm-lighting.test.ts tests/art-blender-assets.test.ts`: pass, exit 0, 61 file / 372 test. Lệnh này khiến Vitest chạy toàn bộ suite; không báo là chỉ chạy hai file.
- Sau chỉnh màu, lượt `pnpm test` chạy song song với các gate khác có 1 test mô phỏng dài hết 5 giây (371 pass, 1 timeout). Chạy lại `pnpm test` riêng trên mã cuối: pass, exit 0, 61 file / 372 test. Không tăng timeout hay sửa test.
- `pnpm build`: pass, exit 0. Vite còn cảnh báo bundle Three.js trên 500 kB, không phải lỗi build.

## Tự review art direction

Art director là subagent Codex nội bộ, không phải reviewer độc lập. Tự chấm tạm theo rubric AGENTS.md: silhouette 7; sáng tối 6; màu/mood 7; ngôn ngữ khối 6; ánh sáng/vật liệu 6; UI 7; nhất quán 6; hiệu năng/tiếp cận 6. Bằng chứng hình ảnh chỉ có IAB seed 14 trên một viewport; chưa đo FPS thiết bị đích. Sau vòng màu, nhà phải bớt cam nhẹ nhưng thay đổi trên màn chơi nhỏ; không nâng điểm chỉ vì thông số đã đổi. Tiêu chí sáng tối và vật liệu chưa đạt mục tiêu trên 7/10. Việc tiếp theo: tạo bóng rộng có chủ đích trên mặt đứng bên phải rồi kiểm tra thêm tại cảnh có hai dãy nhà; tránh hạ sáng toàn bộ cửa hàng và điểm nhấn gameplay.

## Game/UI review giới hạn

- Game design: không đổi spawn, thời lượng hay damage; fixture handling chỉ để đọc cảnh. Chưa có cơ sở để đề xuất cân bằng mới.
- UI/UX: HUD và hành lang lái đọc được ở hai kịch bản, nhưng góc viewport này chưa đại diện thiết bị nhỏ hơn. Tạm dừng và restart hoạt động ở junction.
