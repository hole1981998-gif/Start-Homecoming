# P9 — giãn hai hàng cột ven đường (tự review, 27/10/2026)

Các cọc ở mép đường trước đây nằm trên mọi tile 4 m. Giờ hai hàng cọc đồng bộ theo quãng đường, cứ 8 m có một cặp. Làn, mép đường, collider và nhịp hazard không đổi. Vẫn ẩn cả cọc lẫn vạch trong giao lộ.

Manual: ChatGPT in-app browser, `?scenario=junction&seed=14&diagnostics`, bắt đầu ván, quan sát khoảng 739 m: hai hàng cọc còn rõ nhưng không dày kín như trước; camera, đường và HUD vẫn hiển thị. Đây là tự review một góc nhìn, chưa QA mọi vùng môi trường.

## Kiểm tra tự động

- `pnpm lint`: pass, exit 0. `pnpm typecheck`: pass, exit 0.
- `pnpm test --maxWorkers=2`: pass 62 file, 376/376 test, exit 0.
- `pnpm build`: pass, exit 0; Vite cảnh báo bundle Three.js >500 kB.
