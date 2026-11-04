# P9 — Nhà chợ 3D trong phố gameplay, lượt kiểm 26/10/2026

## Thay đổi

- Branch `codex/p9-city-market` nối tiếp `codex/p9-storm-mood` (`fd49ed3`). GLB `corner-market.glb` đã có từ trước nay thay `wide_storefront` ở cụm phố gần, đoạn thẳng, thay vì chỉ hiện trong preview. Không sửa `.blend`/`.glb` nguồn, gameplay, collider, spawn hay seed.
- Tải template một lần, grade theo palette bão và clone theo lô; mỗi copy sở hữu geometry/material để dispose khi cụm ra khỏi camera. Nếu tải GLB chậm, cụm native được thay lại ở frame kế. Trên cua vẫn dùng strip theo đường, không đặt công trình rộng vào tâm cua.
- Bài test lặp seed 0/1/2/17 và cả hai bên: lô native được thay, market rộng đúng kích thước, nằm ngoài mép đường và không giao các mặt tiền sát cạnh. `tests/art-blender-assets.test.ts` cùng kiểm các GLB khác.

## Browser và hiệu năng

Edge headless Windows / ANGLE D3D11 / NVIDIA RTX 2070, 540 × 960, DEV Vite. `handling-car4`, seed 14: market hiện trong camera sau 9:16 [ảnh đầu phố](evidence/p9-city-market/01-city-start.png), xe chạy qua vùng phố đến khoảng 186 m [ảnh khi lái](evidence/p9-city-market/02-city-driving.png), không có page error. Escape hiện màn pause, tiếp tục chạy; lượt restart riêng tại 20 m về 0 m và modal đầu. Đây là tự kiểm bằng browser automation, chưa là playtest cảm giác lái của người.

Tại 360 frame, số liệu diagnostics cửa sổ 360 frame: 57,4 FPS trung bình, frame P95 17,0 ms, CPU render 9,36 ms, 545 draw calls, 15.870 tam giác. Ở ảnh đầu phố khoảng 44 m, 120 frame: 59,9 FPS, P95 16,9 ms, CPU 8,85 ms, 636 draw calls, 36.488 tam giác. Các cảnh khác vị trí/culling nên không được coi là phép so hiệu năng A/B trực tiếp. Chưa đo thiết bị đích hay nhiều seed trong browser.

## Tự review

**Game designer — dữ kiện:** nhà chỉ trang trí, lô và road clearance được kiểm trong test; lái qua phố không lỗi trang. **Nhận định:** lô rộng làm phố có nhịp hình khác, không ảnh hưởng chiến thuật dự kiến. Chưa kiểm người chơi né chướng ngại dưới bóng market hoặc tại mọi nhánh cua.

**UI/UX designer — ưu tiên P2:** trong ảnh, mái/hiên market không che HUD, hành lang ba làn và vạch đường. Tốc độ cao, màn hình nhỏ và QTE ở gần market cần playtest người thật. Không có Product Design audit chuyên dụng vì browser tool không khởi tạo; đã tự soi ảnh và thao tác Edge.

**Art direction — Codex tự chấm trên cảnh phố đã xem:** silhouette 6/10; sáng tối 6/10; màu/mood 6/10; ngôn ngữ hình khối 6/10; ánh sáng/thời tiết/vật liệu 6/10; UI/typography 6/10; nhất quán phong cách 6/10; tiếp cận/hiệu năng 6/10 trên máy đang kiểm. Market cùng palette các nhà Blender khác và không trùm đường; ngưỡng này chỉ là tự đánh giá tối thiểu. Chưa có duyệt của chủ dự án, nhiều biome/thiết bị đích hoặc playtest người.

## Gate và bàn giao

Windows, Node 24.14.0, pnpm 11.25.0. `pnpm exec vitest run --configLoader native tests/art-blender-assets.test.ts`: exit 0 (9 tests); `pnpm lint`: exit 0; `pnpm typecheck`: exit 0. Lượt full suite đầu `pnpm test -- --reporter=dot`: exit 1, 1 ca `discovery.test.ts` timeout 5 s khi chạy nhiều worker (354 pass). Chạy lại nguyên suite với `pnpm test --maxWorkers=2`: exit 0, 59 files / 355 tests; không sửa timeout/rule/test. `pnpm build`: exit 0; Vite còn cảnh báo chunk Three.js >500 kB. CI: chờ. Review con người: chờ. Merge: không thực hiện.
