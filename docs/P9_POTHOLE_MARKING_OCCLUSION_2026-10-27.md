# P9 — che vạch đường dưới ổ gà rộng (tự review, 27/10/2026)

Ổ gà 2–3 làn từng đặt lớp footprint tại 0,015 m, thấp hơn đỉnh vạch sơn đường 0,025 m; mặt đáy tại khoảng 0,022–0,025 m cũng không che được vạch. Nâng lớp footprint ổ gà lên 0,030 m và mặt đáy lên 0,037–0,040 m. Mép nổi, kích thước collider, lực tác động và cấu hình hazard không đổi. Mặt nước giữ nguyên.

Test hình học so độ cao thực tế của vạch, footprint và đáy trên ổ gà rộng 9,6 m. Đây là sửa render, không đổi balance. Cần nhìn lại trực tiếp ở tình huống ổ gà nhiều làn để xác nhận chiều sâu nhìn vẫn rõ.

## Kiểm tra

- `pnpm exec vitest run --configLoader native tests/art-hazards.test.ts`: pass 10/10, exit 0.
- `pnpm lint`: pass, exit 0. `pnpm typecheck`: pass, exit 0.
- `pnpm test --maxWorkers=2`: pass 62 file, 376/376 test, exit 0.
- `pnpm build`: pass, exit 0; Vite cảnh báo bundle Three.js >500 kB.
- Manual: chưa kiểm tra trực tiếp ổ gà ba làn trong bản chơi; test hình học chỉ xác nhận thứ tự lớp vẽ, không chứng minh chất lượng hình khi có ánh sáng/mưa.
