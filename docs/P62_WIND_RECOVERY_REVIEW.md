# P6.2 — sửa gió sau tai nạn, xe chướng ngại và tạm dừng dòng nước

18/10/2026. Branch `codex/fix-p62-wind-recovery-traffic`, base local `3ad5214`; fixture `p62-forces-2`. Codex tự review từ simulation có seed, thao tác trình duyệt và ảnh lưu tại `evidence/p62/`. Không có reviewer độc lập.

## Thay đổi và lý do

Sau va chạm, `protectedEntities` giữ ID vùng gió cho đến khi xe rời footprint để bảo vệ khỏi damage/debuff. P6.2 trước đó cũng dùng danh sách này chặn lực gió, khiến tài xế đã trở lại xe vẫn không bị đẩy. Bản sửa chỉ miễn lực khi `crash` còn hiệu lực, có star, hoặc đang bảo vệ lúc thay xe. Sau khi tài xế lên xe, nếu vẫn trong vùng thì gió lại đẩy ngay; không cộng dồn impulse trong lúc ngã. Bảo vệ damage/debuff của xe sau tai nạn vẫn giữ.

Gió đẩy ngang các xe chướng ngại **đang chạy**, kể cả khi đang trôi vì hết xăng. Vị trí sau đẩy đi qua timeline sweep/collision cũ, vì vậy có thể dẫn xe vào ổ gà hay xe khác. Xe dừng/hỏng, ổ gà, rào, tàu và vật cố định không trôi theo gió. Lực ngang của nước được tạm dừng; nước vẫn gây hao xăng/giảm tốc theo luật P trước. Các URL thử `p62-current-right/left` cũ chuyển về ca nước không lực. Ca hai vùng ngược hướng nay dùng hai vùng gió. Gió vẫn chỉ là fixture DEV, chưa xuất hiện trên đường thường hoặc stress.

## Test và simulation

Windows, Node 24.19.0, pnpm 11.25.0. `pnpm lint`: exit 0; `pnpm typecheck`: exit 0; `pnpm build`: exit 0 (JS 597,10 kB, gzip 161,00 kB; cảnh báo chunk >500 kB còn). `pnpm test --maxWorkers=1 --minWorkers=1`: exit 0, 193 test/27 file. `pnpm simulate --maxWorkers=1 --minWorkers=1`: exit 0, 106 test/9 file. Không nới timeout/bỏ test.

Test mới tái hiện tai nạn thật ở seed 17: xe đang ngã không chịu lực, tài xế lên xe khi vẫn trong vùng và ID vùng còn trong `protectedEntities`, sau đó x tăng so với bản không gió. Test nước giữ fuel cost nhưng x không đổi; ngay cả entity nước có `lateralPush` cũ cũng không đẩy. Xe chướng ngại chạy trong gió trôi ngang, gặp ổ gà và mất HP, bản không gió thì không; xe dừng và vùng gió cố định không bị đẩy. 48 lượt scripted AD = 6 seed (1,7,17,42,101,126) × 8 fixture × tối đa 10 giây, không số lỗi finite/resource/bounds. Đây là cùng layout cố định giữa các seed, không phải 48 map khác nhau; ca xe chướng ngại có thể va người chơi, ví dụ seed 17 còn 50 HP ở 92 m. Baseline P5/simulation stress P6.1 vẫn qua; không coi kết quả này là difficulty/economy đã cân bằng.

## Chơi thử thủ công

ChatGPT in-app browser tại localhost:5173, seed 17, bàn phím W/S/Esc thật. Ca `p62-crash`: W vào ô tô tại khoảng 70–80 m, HP từ 70 xuống 50; tài xế đã lên xe, xe tăng tốc lại. Đối chiếu tác dụng gió sau lên xe bằng test trạng thái ở trên vì HUD/ảnh không hiện trực tiếp tọa độ x. Ca `p62-traffic`: W tới vùng, quan sát xe NPC đã bị đẩy từ phía trái sang phải của đường; [ảnh xe](evidence/p62/05-wind-traffic.png). Ca `p62-water-baseline`: W tới khoảng 65 m, xăng từ 5,5 xuống khoảng 4,3 L, cue không có mũi tên lực; [ảnh nước](evidence/p62/06-water-no-push.png). Esc pause, restart đặt lại 0 m/200 tiền/5,5 L. Screenshot riêng không chứng minh lực theo thời gian; test sweep bảo vệ điều đó.

## Tự review và giới hạn

Gameplay: gió tác động lại ngay sau hồi phục tạo quyết định lái tiếp trong cùng vùng, trong khi thời gian ngã vẫn an toàn. Xe NPC đổi làn vì gió làm nguy cơ va chạm bớt cố định; đây là **nhận định** từ ca cố định, chưa đo độ công bằng trong mật độ cao. ĐỀ XUẤT chưa áp dụng: trước tích hợp hãy kiểm tra cửa sổ né một xe đang bị gió đẩy, rồi mới quyết định tần suất vùng gió ở P8; không tăng mật độ/phạt ngầm.

UX chức năng: ca nước được đổi tên rõ “không đẩy”, không còn arrow; các ca cũ vẫn mở được. HUD không có số gió trung gian hay cảnh báo hướng xe NPC đổi lane từ xa; nếu tích hợp, cần cue sớm để người chơi dự đoán quỹ đạo. UI/art polish vẫn theo phase riêng. Lực gió trên xe NPC hiện áp dụng cho traffic đang chạy, chưa áp dụng lên công an/dân phòng/hàng rong đang băng đường hay tàu; đồ vật cố định giữ nguyên. Simulation dùng displacement giới hạn theo sweep, chưa giải mọi trường hợp nhiều vùng nhỏ chồng nhau. Không có review độc lập.

Git không có remote nên không fetch/fast-forward remote main, push, tạo PR hay xem CI. Local branch dựa trên commit prototype đã bàn giao; không merge. Archive P6.1 `archives/p61-stress-581c4df/source.zip` vẫn có SHA256 `0f6014282dd1582bc10e5445c2bb1cc5b0fee8f4a93fe088c09e53373808a31c`. Câu hỏi P8 về xăng traffic vẫn chờ chủ dự án tại đúng phase đó.
