# Cho khách xuống xe: ngã rồi đứng dậy — 11/11/2026

## Thay đổi

Phím G vẫn cho một khách xuống và giữ nguyên tiền, điểm, vị trí đích, thời gian cấm đón lại. NPC nay dùng chuỗi tư thế sẵn có: bay trong 0,65 s, nằm trên đường 0,4 s, đứng dậy trong 0,55 s. Đây là cách hiển thị; luật va chạm và cân bằng không đổi. Các thời gian là số TẠM trong `balance`.

## Bằng chứng và giới hạn

- Base `main`/`origin/main`: `3e3dc6e`; branch `codex/npc-kick-fall`. Test G với seed 17 xác nhận tư thế trước/sau từng mốc, độ nghiêng lúc chạm đất, đứng thẳng cuối pha, vị trí đứng yên trong lúc hồi phục và thời gian cấm đón lại.
- Windows/PowerShell, pnpm 11.25.0: `pnpm lint` (exit 0), `pnpm typecheck` (exit 0), `pnpm test tests/passengers.test.ts tests/art-runtime-people.test.ts tests/passenger-outcomes.test.ts --maxWorkers=2 --testTimeout=15000` (14/14 ca, exit 0), `pnpm test --maxWorkers=2 --testTimeout=15000 --reporter=dot` (87 tệp, 492 ca, exit 0), `pnpm build` (exit 0). Build còn cảnh báo sẵn có về chunk Three.js trên 500 kB.
- **CHƯA KIỂM TRA THỦ CÔNG** trong browser ở lượt này: trình duyệt tích hợp không khả dụng từ phiên kiểm tra này. Ảnh tĩnh hay test mô phỏng không chứng minh được cảm giác chuyển động trong game.

## Tự review từ test mô phỏng và mã nguồn

- Game designer: G không thêm phạt hoặc đổi chiến thuật đón khách; thời gian đứng dậy ngắn, không làm chậm ván. Cần chơi thử xem cú văng còn dễ nhìn giữa mưa và tốc độ chạy hay không. ĐỀ XUẤT: nếu khó đọc, điều chỉnh camera/cue thị giác trước khi tăng thời gian ngã; chưa áp dụng.
- UI/UX designer: P1 kiểm tra NPC có chạm mặt đường rõ và không chuyển sang tư thế đứng trước lúc chạm; P2 kiểm tra hoạt ảnh khi rẽ và ở mép đường. Test hiện có xác nhận thứ tự tư thế, chưa đánh giá hình ảnh hay độ mượt trên màn hình.
