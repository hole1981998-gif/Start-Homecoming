# P9 — Thuyền 3D trong cảnh ven biển, lượt kiểm 26/10/2026

## Thay đổi

- Branch `codex/p9-coastal-boat` nối tiếp `codex/p9-city-market` (`1a7627b`). GLB `coastal-fishing-boat.glb` đã có trong gallery nay hiện trong cụm biển gần của game, dùng template cache và clone sở hữu geometry/material riêng để dispose. Không sửa asset nguồn, gameplay, collider, spawn, nước hazard hay HUD.
- Chỉ gắn vào cụm `sea` LOD gần trên đoạn thẳng có cầu gỗ. Bờ biển ở cua vẫn dùng strip nhẹ, không đặt thuyền. Hai bên được lệch dọc để tránh lặp đối xứng khi seed có biển cả hai phía.
- Lượt đặt đầu test thấy hull giao cầu; lượt kế ảnh gameplay cho thấy hull lấn bờ kè. Đã sửa vị trí và thêm assertion hình bao không giao mép đường, cầu và bờ kè ở cả hai bên, seed 0/17; sea far và city không gắn thuyền. Đây là test geometry visual, không tạo collider mới.

## Browser và tự review

Edge headless Windows / ANGLE D3D11 / NVIDIA RTX 2070, 540 × 960, DEV Vite, `handling-car4`, seed 25 có biển hai bên. [Ảnh camera chơi ở khoảng 30 m](evidence/p9-coastal-boat/01-sea-start.png) cho thấy thuyền nằm sau kè, tách khỏi ba làn và HUD. Trên vị trí cuối, xe tự chạy tới 69 m; Escape hiện pause, tiếp tục và restart về 0 m; không có page error. Diagnostics tại 240 frame: 53,9 FPS trung bình, P95 33,1 ms, CPU render 9,90 ms, 559 draw calls và 16.344 tam giác. Cửa sổ này gồm khởi động/tải asset, không cho biết riêng chi phí thuyền. Một cửa sổ 600 frame sau đó đi sang vùng khác ở 119 m nên không dùng để kết luận cảnh có thuyền. Chưa có playtest người thật hoặc benchmark thiết bị đích.

**Game designer — dữ kiện:** chỉ thêm prop ngoài đường; test bảo vệ mép đường và không đổi state. **Nhận định:** hình ven biển có điểm nhận diện hơn, không thêm lựa chọn gameplay. Không đề xuất đổi balance.

**UI/UX designer — ưu tiên P2:** từ ảnh kiểm, thuyền không che vạch đường/cue và HUD; ở mép ảnh dọc 9:16 nên cần xem trên điện thoại thật. Chưa có QTE dưới cảnh biển và audit Product Design chuyên dụng do browser tool không khởi tạo; đây là Codex tự kiểm từ Edge/ảnh.

**Art direction — Codex tự chấm sơ bộ cảnh biển đã xem:** silhouette 6/10; sáng tối 6/10; màu/mood 6/10; hình khối 6/10; ánh sáng/thời tiết/vật liệu 6/10; UI/typography 6/10; nhất quán phong cách 6/10; tiếp cận/hiệu năng **5/10** do P95 33,1 ms ở lượt 240 frame đầu và thiếu đo thiết bị đích. Mục cuối dưới ngưỡng 6 nên art gate **chưa đạt**; cần so cùng seed có/không thuyền, đo warmup trên thiết bị mục tiêu và sửa nếu chi phí art gây chậm. Đây không phải review độc lập.

## Gate và bàn giao

Windows, Node 24.14.0, pnpm 11.25.0. Targeted test `pnpm exec vitest run --configLoader native tests/art-blender-assets.test.ts -t 'mounts the cached skiff'`: pass sau khi sửa vị trí. `pnpm lint`: exit 0; `pnpm typecheck`: exit 0. Full suite `pnpm test --maxWorkers=2`: exit 1 vì một ca `discovery.test.ts` timeout 5 s khi chạy cùng các bài mô phỏng (355 pass). Chạy lại nguyên suite `pnpm test --maxWorkers=1`: exit 0, 59 files / 356 tests, giữ nguyên timeout/rule/test. `pnpm build`: exit 0, còn warning Three.js chunk >500 kB. CI: chờ. Review con người: chờ. Merge: không thực hiện.
