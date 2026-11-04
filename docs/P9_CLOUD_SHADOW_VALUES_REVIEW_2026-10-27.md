# P9 — bóng mây tối và có nhiều cỡ (tự review, 27/10/2026)

## Thay đổi

- Bóng mây dùng cùng màu xanh than và opacity với bóng dài trang trí, bỏ sắc cyan sáng nổi riêng trên mặt đường.
- Hash art theo seed tạo bốn nhóm footprint từ nhỏ đến lớn; chỉ đổi hình và màu, không đổi collider, spawn, RNG gameplay hoặc cue hazard.
- Nhánh bắt đầu từ bản art tích hợp `8586768` vì `origin/main` hiện chưa chứa chuỗi art P9; cần review chuỗi nhánh trước khi merge. Đây là nhánh riêng cho bóng mây.

## Quan sát thủ công

- ChatGPT in-app browser, `?scenario=junction&seed=14&diagnostics`, bắt đầu ở 705 m, quan sát khoảng 707 m. Bản thử màu teal `#0c4657` chiếm tiền cảnh quá xanh; chỉnh về xanh than `#102a30` cho mảng tối gần bóng công trình hơn. Người lái, vạch lane và HUD vẫn nhìn được.
- `?scenario=p8-water&seed=17&diagnostics`, xem khoảng 845–895 m: bóng lớn qua nền đường, mặt nước xanh, ổ gà, traffic và hai NPC vẫn phân biệt được ở khung quan sát. Chưa kiểm tất cả hazard trong chính giữa bóng cùng một lúc.
- Chưa kiểm nhiều seed/cỡ mây bằng mắt, chưa đo FPS/P95 thiết bị đích. Test mẫu 48 cell xác nhận cỡ nhỏ/lớn xuất hiện, không thay thế review hình ảnh trong mọi biome.
- Game design: không đổi thời gian phản ứng hay hành vi va chạm; cần playtest hazard dưới bóng mây lớn để xác nhận cue không bị nuốt. UI/UX: HUD và lane còn đọc ở fixture trên, nhưng chưa kiểm lúc có nhiều cảnh báo cùng lúc.

## Gate

- Test liên quan: `pnpm exec vitest run --configLoader native tests/cloud-shadows.test.ts tests/art-road-shadows.test.ts` pass, 6/6, exit 0.
- `pnpm lint`: pass/exit 0.
- `pnpm typecheck`: pass/exit 0.
- `pnpm test`: pass/exit 0, 61 file / 374 test.
- `pnpm build`: pass/exit 0; Vite còn cảnh báo bundle Three.js trên 500 kB.

## Art direction nội bộ

Đây là tự đánh giá Codex và subagent art director nội bộ, không phải duyệt của chủ dự án. Mảng tối gần mood sketch hơn bản teal thử đầu tiên và có tương phản footprint theo seed. Art director khuyên giữ màu mới nhưng kiểm thêm 2–3 seed và hazard đúng trong mảng tối lớn. Chưa chấm lại rubric toàn cảnh vì thay đổi chỉ tác động bóng mây; mục tiêu visual >7/10 vẫn chưa được chứng minh.
