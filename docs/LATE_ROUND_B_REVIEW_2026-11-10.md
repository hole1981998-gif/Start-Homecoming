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
- **Tự review game designer:** số gói điểm thưa giúp giữ lựa chọn lấy điểm hay tránh nguy hiểm, còn điểm di chuyển làm ván không bị rỗng điểm; cần người chơi xác nhận gói +50 có đủ hấp dẫn và mốc 15 km không tăng áp lực đột ngột. Cú nhảy cao hơn nhưng cửa sổ canh thời điểm vẫn hẹp trên container; đề xuất thử thêm cue thời điểm cất cánh trước khi tăng tiếp khoảng bay.
- **Tự review UX:** HUD hiển thị điểm, tiền, quãng đường trực tiếp trên cảnh; nhãn +50 tồn tại ngắn dưới điểm. Trên fixture nhảy, hướng dẫn hiện đủ phím nhưng chưa chỉ điểm canh Space bằng graphic. Ưu tiên cao: quan sát người chơi thử lại container và cue của nó. Chưa có audit screenshot từng bước trong lượt này; ảnh đơn không chứng minh timing/input.

## Gate và giới hạn

| Gate | Lệnh | Kết quả |
|---|---|---|
| Lint | `pnpm lint` | pass, exit 0 |
| Typecheck | `pnpm typecheck` | pass, exit 0 |
| Tests | `pnpm exec vitest run --configLoader native --maxWorkers=4 --reporter=dot` | pass, exit 0; 87 files, 490 tests, 111,35 s |
| Build | `pnpm build` | pass, exit 0; cảnh báo chunk Three 568 kB |

Chưa đủ manual check cho nhảy container theo cảm giác người chơi, QTE, shop và restart ở revision B. Cần giữ PR chờ review đúng revision cuối; không tự merge khi các điều kiện của `AGENTS.md` chưa đủ.
