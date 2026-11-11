# Mũ lực lượng và đèn xe cứu thương — tự review 11/11/2026

Revision: `codex/authority-service-visibility` từ `main`/`origin/main` `3e3dc6e`; seed kiểm tra mô phỏng: 17.

## Thay đổi

- Mũ công an thành mũ kê cao có vành và phù hiệu; mũ dân phòng có vành rộng, chóp riêng. Dáng mũ giữ cùng khớp đầu khi NPC chuyển động.
- Đèn đỏ/xanh trên mui xe cứu thương chớp luân phiên theo `activeSeconds` (5 nhịp/s, số TẠM). Một nguồn sáng nhỏ đổi màu theo bên đang bật. Livery nằm trên thân xe để cùng nghiêng khi xe hỏng. Áp dụng trên xe giao thông trong game; master preview dùng chung bộ service.
- Không đổi footprint va chạm, tốc độ, cân bằng, lịch spawn hoặc cue cảnh báo.

## Kiểm tra

- `pnpm lint`: pass, exit 0.
- `pnpm typecheck`: pass, exit 0.
- `pnpm test tests/art-moving-events.test.ts --maxWorkers=2 --reporter=dot`: pass, 10/10, exit 0. Mũ nằm cao hơn đầu; đèn đổi bên, lặp lại ổn định theo cùng thời gian mô phỏng.
- `pnpm build`: pass, exit 0; cảnh báo chunk Three >500 kB có từ trước.
- `pnpm test --maxWorkers=2 --testTimeout=15000 --reporter=dot`: fail, exit 1, 86 tệp/493 ca pass, 1 ca `tests/ui.test.ts` timeout ở 15 s khi nhiều worktree cùng chạy gate. Chưa kết luận đây là hồi quy; cần chạy lại không tải song song.
- Manual trong trình duyệt: **CHƯA KIỂM TRA THỦ CÔNG**. Bản dev `http://127.0.0.1:5175/?scenario=p61-ambulance&seed=17` chạy; trình duyệt trong agent con không khả dụng, thao tác Chrome bị timeout. Chưa xác nhận bằng mắt độ sáng, nhịp chớp, đọc mũ khi lái/đổi camera/QTE, kết ván và restart.

## Tự review game designer / UI UX

Dữ kiện: test hình học và thời gian ở trên; chưa có playtest người chơi. Ý kiến game designer: cue xe cứu thương rõ hơn có thể giúp đọc nguy hiểm mà không tăng độ khó. Nhịp chớp 5/s là TẠM, nên kiểm tra seed 17 và các tình huống mưa dày để tránh quá gắt. Ý kiến UI/UX: mũ tạo silhouette hai lực lượng ở khoảng xa, song cần kiểm tra ở tỷ lệ khung dọc thực và màu nền trời; không dựa vào màu đèn làm tín hiệu nguy hiểm duy nhất. Không coi test art là bằng chứng cảm giác lái hay công bằng.
