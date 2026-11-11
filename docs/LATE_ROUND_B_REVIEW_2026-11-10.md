# Review cân bằng B — 10/11/2026

**Trạng thái:** số TẠM, chưa khóa theo cảm giác người chơi. Branch `codex/late-balance-round-a`, base A `9976120`; ván chính chạy ở `http://127.0.0.1:5174/`, nhánh `ver.noforce` giữ luật cũ. Báo cáo này là Codex tự kiểm tra, không phải đánh giá của chuyên gia độc lập.

## Thay đổi và dữ kiện

- Điểm chuyển sang `hybrid-v1`: 0,20 điểm/m ở cruise catalog, 0 ở min, tối đa 1,5 lần ở max; khách cộng tối đa 8%. Gói +50 đầu ở 450 m, các gap seed riêng lần lượt 600–900, 750–1.050, 900–1.200 m theo nấc quãng đường. Điểm không đổi tiền. Bảng điểm cũ được tách phiên bản.
- Nitro vẫn boost 4 s và trần tốc độ ×1,3; đỉnh nhảy 5,2 m. Theo phản hồi chơi thử, thời gian bay tăng 1,6→1,7 s, thêm xấp xỉ 2 m ở 20 m/s. Bản backup giữ 2,4 m/1,6 s. Va chạm xe cao chỉ được bỏ qua khi cả cú nhảy thật sự đủ cao và thân xe đã qua; tàu và special vẫn theo luật riêng.
- Gió đơn 1,5→1,65 m/s, tiền khách thường 0,20→0,18 tiền/khách/m. Sau 8 km: template gió 6/15 có trọng số ×1,35, nhóm công an/dân phòng có 80% cơ hội hai người và tăng nhịp di chuyển. Sau 12 km: template ba actor có trọng số ×1,15. Sau 15 km: gap normal 16,5 m, special 280 m. Không đổi fuel/damage/giá.
- Trong mô phỏng 30 seed (1–30), điền world theo bước 40 m tới 18 km, số wind/km ở 5–8 km là 165, ở 8–12 km là 198,5 (+20,3%). Normal group sinh thực/km 12–15 km là 1.187,3, sau 15 km là 1.287,3 (+8,4%); special actor/km 90,7→102,3 (+12,8%). Tỷ lệ nhóm ba actor 8–12 km là 35,5%, 12–15 km là 36,0%: hiệu ứng trọng số nhỏ sau lọc an toàn, cần quan sát thêm. Mô phỏng này đo spawn, không chứng minh người chơi vượt được mọi tổ hợp.
- Kiểm tra thời điểm tàu/công an và trạm theo seed, nhảy qua container di động bằng xe máy/ô tô 4/7 chỗ, ForceIntegration không đẩy xe khi vượt nóc, và shop mua xe đầu ở 30 seed. Median mua xe đầu trong bài scripted là 21,4 s ở cruise và 13,38 s khi giữ W; fixture tự động không đại diện người chơi thật.

## Chơi thử và UI/UX

- Trình duyệt trong ứng dụng, `seed=17`, checkpoint 5 km: đã mở bản chơi, quan sát HUD ở 5.000 m với ô tô 4 chỗ/ba khách; một ván người dùng chơi kết thúc ở 9.005 m, 1.144 điểm, HP 0. Đây là quan sát trạng thái cuối, không phải Codex tự lái ván đó.
- Codex tự thao tác fixture `?scenario=nitro-high&seed=17`: hai lần bấm nitro/W/Space đều va container do canh thời điểm chưa đúng. Test mô phỏng có kiểm soát vượt được với thời điểm hợp lệ; **chưa xác nhận bằng tay cảm giác dễ nhảy sau tăng 0,1 s**. Restart, QTE và shop chưa kiểm tra thủ công trong lượt B.
- Kiểm tra bổ sung trên revision `ab4ae92`, IAB, seed 17: fixture `shop` mở bằng R, bơm +4,0 L làm tiền 4.000,5→3.880,5 và xăng 1,0→5,0 L; Esc tạm dừng và nút Chơi lại từ đầu đưa tiền/xăng về 4.000/1,0. Fixture `blocked-window` hiện Q/E và đếm ngược 0,4 s; bấm Q trễ dẫn tới va chạm, 123→103 HP và tài xế ngã. Checkpoint 12 km: xe chạy 12.000→12.190 m, va chạm làm xe dự phòng xe máy tự thay; checkpoint 15 km: va chạm ở khoảng 15.023 m, HP 212→192, tài xế ngã. Đây là các đoạn ngắn, không chứng minh độ công bằng của toàn bộ mốc khó.
- Thử lại `nitro-high` trên revision `ab4ae92` vẫn va container do canh thời điểm; lúc mở thẻ lần đầu phát hiện lời hướng dẫn sai rằng nitro không vượt được xe cao. Đã sửa lời hướng dẫn trên bản chính, bản backup giữ câu cũ. Chưa có bằng chứng chơi tay vượt container ở revision này.
- **Tự review game designer:** số gói điểm thưa giúp giữ lựa chọn lấy điểm hay tránh nguy hiểm, còn điểm di chuyển làm ván không bị rỗng điểm; cần người chơi xác nhận gói +50 có đủ hấp dẫn và mốc 15 km không tăng áp lực đột ngột. Cú nhảy cao hơn nhưng cửa sổ canh thời điểm vẫn hẹp trên container; đề xuất thử thêm cue thời điểm cất cánh trước khi tăng tiếp khoảng bay.
- **Tự review UX:** HUD hiển thị điểm, tiền, quãng đường trực tiếp trên cảnh; nhãn +50 tồn tại ngắn dưới điểm. Trên fixture nhảy, hướng dẫn hiện đủ phím nhưng chưa chỉ điểm canh Space bằng graphic. Ưu tiên cao: quan sát người chơi thử lại container và cue của nó. Chưa có audit screenshot từng bước trong lượt này; ảnh đơn không chứng minh timing/input.

## Gate và giới hạn

| Gate | Lệnh | Kết quả |
|---|---|---|
| Lint | `pnpm lint` | pass, exit 0 |
| Typecheck | `pnpm typecheck` | pass, exit 0 |
| Tests | `pnpm exec vitest run --configLoader native --maxWorkers=4 --reporter=dot` | pass, exit 0; 87 files, 490 tests, 128,10 s trên revision sau sửa hướng dẫn |
| Build | `pnpm build` | pass, exit 0; cảnh báo chunk Three 568 kB |

Đã kiểm tra thủ công shop, restart, QTE bị lỡ và các đoạn đầu của mốc 12/15 km. Chưa đủ manual check cho cảm giác nhảy container thành công và QTE rẽ thành công; các đoạn 12/15 km chưa đánh giá được độ công bằng trên ván dài. Cần giữ PR chờ review đúng revision cuối; không tự merge khi các điều kiện của `AGENTS.md` chưa đủ.

## Kiểm tra theo feedback ngày 11/11/2026

- **Dữ kiện:** người chơi báo đoạn 0–5 km khó hơn và thiếu popup sự kiện/thẻ giải thích. Bản xem trước `seed=17` có ván kết thúc ở 3.566 m sau 3:21 do tàu. Đây là ván của người chơi, không phải Codex tự lái.
- **Nguyên nhân độ khó:** lịch 25 slot với 5 tàu được áp dụng ngay từ 650 m, dù kế hoạch tăng tàu dành cho sau 5 km. Với seed 17, 0–5 km có 3 tàu thay vì 2 theo lịch trước. Template dân phòng số 11 cũng lấy cả nhóm hai người trước ngưỡng 8 km. Đã sửa lịch cũ cho 0–5 km, lịch tăng tàu từ 5 km; khi chuyển lịch, chọn pha seeded tránh vi phạm cooldown với sự kiện ngay trước mốc. Template đó giữ một dân phòng trước 8 km. Test so 30 seed với lịch trước, kiểm tra nhánh sau ngưỡng và cooldown xuyên ngưỡng.
- **Mô phỏng đường sinh, không có người lái:** 30 seed đến 12 km tạo 209 slot tàu, 198 tàu thực sự sinh (6,6/đường); số slot trước đó ở seed 17 đã tăng sai trong 0–5 km. Mô phỏng 30 seed theo bước 40 m đến 18 km ghi nhận 66 tàu thực sinh ở 0–5 km và 56 ở 5–8 km. Đây không phải số tàu người chơi chắc chắn gặp vì corridor và nhánh đường có thể lọc tiếp.
- **Nguyên nhân popup/thẻ:** trên máy chơi thử, tùy chọn **Popup vui** đang tắt; lịch thẻ lần đầu đã được lưu tại `dvn.discovery.v2`, nên không hiện lại. Codex đã bật **Popup vui** và dùng nút **Giới thiệu lại khi gặp** trong màn Help trên cùng origin của bản chơi thử. Hai lựa chọn lưu trên máy, áp dụng ở ván kế tiếp. Event popup hiển thị 3 giây theo design thay vì 2,5 giây; HUD biến động tài nguyên vẫn hoạt động độc lập với popup vui. Help Nitro cũng được cập nhật cho luật nhảy xe cao của bản chính, bản backup giữ câu cũ.
- **Lỗi vẽ phát hiện khi thử build:** trong một lần khởi động lại, slot hazard đổi loại nhưng renderer tái dùng mesh theo ID slot cũ. Khi slot thành gió, mesh cũ không có `windArt`; lỗi `setVisualTime` khiến khung vẽ ngừng cập nhật ở 0 m. Cache mesh giờ phân biệt cả loại hazard và loại xe traffic, tránh tái dùng sai art.
- **Manual sau sửa, trình duyệt trong ứng dụng, build production, seed 17:** bắt đầu ván mới, thấy đường/xe/HUD và đi từ 0 đến 914 m; card cửa hàng ở 220 m và card tiếp tế ở 420 m dừng an toàn; khi chạm vật phẩm/xe, popup `TIẾP TẾ XĂNG`, `TAI NẠNN`, `SỬA CHỮA NÈ` xuất hiện, phản hồi HP/xăng hiện trên HUD. Giữ W ghi nhận 69,4 km/h rồi xe hồi trung vị; Esc tạm dừng, Chơi lại từ đầu trả về 0 m/280 tiền/7,2 L, bắt đầu lại hiện cảnh và chạy được. Console giữ một lỗi `setVisualTime` cũ từ trước lần reload; sau reload không thấy lỗi mới trong lượt quan sát. Chưa tự lái đủ 5 km hay xác nhận cảm giác khó bằng tay.
- **Tự review game designer:** phục hồi nhịp đầu khiến người chơi có cửa học né và mua xe trước khi lịch tàu dày hơn. Số tàu thực tế có thể bị lọc bởi corridor/shop; đếm slot là bằng chứng nguyên nhân, chưa chứng minh cảm giác khó trên ván dài. Cần người chơi thử cùng seed và nhận xét mốc 5 km có gắt bất ngờ không.
- **Tự review UX:** tùy chọn popup tắt và trạng thái đã xem thẻ tồn tại giữa các lần chơi, dễ bị hiểu là tính năng biến mất. Ưu tiên cao là cho người chơi thấy lại hai lựa chọn này trong Help; đã xác nhận nút reset hoạt động trên bản xem trước. Cần quan sát card xuất hiện trong ván mới và popup sau một sự kiện; ảnh màn hình tĩnh không chứng minh được timing.
- **Gate sau sửa:** `pnpm lint`, `pnpm typecheck`, `pnpm build` đều exit 0; `pnpm exec vitest run --configLoader native --maxWorkers=4 --reporter=dot` exit 0 với 87 files, 492 tests. Build báo chunk Three 568 kB vượt ngưỡng cảnh báo 500 kB; đây chưa phải đo FPS trên máy người chơi.
