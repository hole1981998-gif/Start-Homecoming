# P9 — dọn vạch nối ngã tư (27/10/2026)

## Vấn đề và thay đổi

Chủ dự án thấy vạch nối của đường thẳng cắt ngang đường rẽ, rồi bị bẻ thành một đường vòng đè lên đường cũ sau khi chọn Q/E. Các ribbon mép đường trong `createJunctionTurnArt` đổi hình theo lựa chọn; vạch dài của nhánh thẳng cũ lại chạm cuối cung.

Bỏ các ribbon mép ở riêng apron giao lộ và vạch dài trên đường thẳng cũ. Giữ asphalt cong nối các tile với đường ngang; vạch trên tile bình thường tự nối lại sau vùng giao lộ. Đây là lựa chọn bỏ vạch gây nhiễu mà chủ dự án cho phép; không đổi route, collider, QTE, vật lý hay balance.

## Kiểm tra

- ChatGPT in-app browser, `?scenario=junction&seed=14&diagnostics`: khởi đầu 705 m, giữ W tới khoảng 755 m. Q/E hiện đúng; vùng giao lộ không còn hai vạch nối dài trên mặt asphalt. Bấm E và xe tiếp tục sang nhánh mới; ở khoảng 824–832 m vạch tile bình thường trở lại. Không giữ được ảnh đúng khoảnh khắc giữa cung vì ván vẫn chạy trong lúc chụp; không coi ảnh sau cua là bằng chứng đầy đủ cho từng frame của cung.
- `pnpm lint` exit 0; `pnpm typecheck` exit 0; `pnpm test --maxWorkers=2` exit 0 (63 file, 384 test); `pnpm build` exit 0. Build có cảnh báo chunk Three.js >500 kB.
- Tự review game designer: Q/E vẫn chọn nhánh và không đổi thời gian phản ứng. UI/UX: cue Q/E và vạch lane trước/sau giao lộ còn đọc được ở seed 14; cần chủ dự án kiểm tra cảm giác vào cua. Chưa đo GPU yếu hay nhiều seed.

Base là `b99b648` trên chuỗi P9 chưa merge main; chưa có review con người cho revision này.
