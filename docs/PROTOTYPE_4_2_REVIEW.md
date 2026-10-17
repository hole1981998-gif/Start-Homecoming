# P4.2 — Khách từ xe giao thông hỏng

Revision: patch trên parent `46f1369`, branch `feature/p4-2-traffic-passengers`; config `p4-2-traffic-passengers-1`. Windows, PowerShell, pnpm theo lockfile. Report thuộc cùng commit với implementation. Codex tự review từ test tự động và thao tác IAB thật, không có reviewer độc lập.

## Thay đổi và quyết định tạm

- Xe hỏng vì người chơi húc hoặc ổ gà sinh NPC đúng một lần, giữ ID sau khi xác hết 2,5 s; nhánh retire không sinh NPC vào nhánh mới.
- Roster theo seed/source ID, không tiêu hazard RNG. 1..min(capacity − 1, 3) khách, không bao gồm tài xế. Đây là mặc định bảo thủ TẠM, không mô phỏng xe buýt đầy.
- Chọn tâm làn gần xác nhưng ngoài footprint xác; kiểm tra footprint xe đang chạy và clearance 0,5 m ngoài hazard. Không có chỗ cho cả nhóm thì chờ, có thể bỏ khi source ra khỏi vùng dữ liệu. Khách đứng yên trong chỗ đã kiểm tra; không bảo đảm an toàn vĩnh viễn trước traffic di chuyển về sau.
- F đón như khách thường, không tự board hoặc thưởng khi xe hỏng; hệ tải, cruise, thu nhập sau đón dùng P4 hiện có. Không thay giá, income, damage hoặc nhiên liệu.

## Các vòng kiểm tra

Vòng đầu: 72/73 test pass; ca ổ gà chưa sinh khách vì clearance thử 1,5 m làm hành lang biên quá hẹp cho buýt. Hạ clearance kỹ thuật xuống 0,5 m; test tích hợp cả húc và ổ gà pass. Sau đó bổ sung chọn chỗ ngoài xác ở cả ba làn và kiểm tra nhiều loại/seed.

Vòng cuối trên code bàn giao:

| Gate | Command | Kết quả |
|---|---|---|
| Lint | `pnpm lint` | exit 0 |
| Typecheck | `pnpm typecheck` | exit 0 |
| Tests | `pnpm test` | exit 0, 76/76 |
| Simulation | `pnpm simulate` | exit 0, 13/13 |
| Build | `pnpm build` | exit 0; cảnh báo chunk 540,54 kB, chưa tối ưu bundle |
| Diff | `git diff --check` | exit 0 |

Test mới: tám loại × 30 seed; đủ giới hạn sức chứa, ID duy nhất, vị trí ngoài xác trên ba làn; không sinh lặp sau nhiều fixed step/xác hết hạn; defer khi phủ kín đường; không đổi hazard RNG; nhánh cũ; húc/ổ gà; F một lần; restart; kết quả giống nhau ở 30/60/144 render FPS mô phỏng.

Simulation fixture buýt húc ô tô, seed 1–30: 61 NPC được sinh, 1–3/source, không tự board. Đây là cơ hội đón trong fixture, không phải số khách người chơi sẽ nhặt được trong ván thường. Economy pilot 30 seed mỗi chiến thuật không chủ động đón khách: cruise 30/30 đủ 800, median 85,72 s, 13 lượt chết trong cửa sổ 600 s; W 30/30, 60,18 s, 14 lượt chết; S 29/30, 149,78 s, 3 lượt chết, seed 113 chưa đủ. Không dùng dữ liệu pilot này để khẳng định economy sau cứu khách đã cân bằng.

## Manual — IAB, seed 17

- `?scenario=traffic-passengers&seed=17`: start, giữ W húc xe ở 55 m, buýt 210→202 HP, vẫn chạy. Sang trái bằng A và F: HUD 1/25→2/25. Quan sát bằng accessibility state; không suy số NPC chỉ từ mesh.
- `?scenario=traffic-passengers-pothole&seed=17`: sang trái tránh patch, giữ S; F ba lần gần 45 m: 1/25→4/25, HP vẫn 210. Xe nguồn hỏng vì ổ gà, khách không tự board. Pause đứng yên; restart về 0 m/200 tiền/1/25/210 HP.
- Sau điều chỉnh chọn chỗ ngoài xác: `?scenario=vehicle-failure&seed=17`, start/W: HP 20→0, hiện kết ván ở khoảng 4 m, không phục hồi ván.
- Bản thử đã để sẵn ở scenario traffic-passengers. Camera/input/HUD được quan sát trong các ca trên; chưa manual nhiều giao lộ, mọi loại xe hoặc trình duyệt khác. Chưa đo FPS thực trên máy.

## Tự review gameplay

Dữ kiện: húc ô tô bằng buýt tốn 8 HP và tạo 1–3 cơ hội đón; phải lái sang bên và bấm F. Nhận xét: có thêm quyết định lấy khách sau va chạm, nhưng fixture ở W đi qua cửa sổ đón nhanh, một lượt manual chỉ đón được một người. Giảm tốc để đón là lựa chọn có ý nghĩa; chưa đủ bằng chứng để tăng reach hoặc giảm HP húc. ĐỀ XUẤT lượt sau so sánh né/húc bằng buýt ở 30 seed có pilot chủ động F, đo khách thực đón, tiền/phút và HP/km trước khi tăng cap hay đổi damage. Chờ chủ dự án nhận xét; chưa áp dụng cân bằng lớn.

## Tự review UX

Theo nhịp review prototype đã thống nhất, chỉ xem luồng/input, không audit/polish visual toàn bộ. F dùng cùng cue hiện có; HUD cập nhật đúng tổng người; pause/restart không giữ khách ván cũ. Rủi ro P2: cửa sổ F ở W ngắn, cần thử cảm giác bằng tay thêm. Không thêm menu hoặc bảng log. Chưa làm audit screenshot Product Design đầy đủ trong vòng này; screenshot đơn lẻ không được dùng làm bằng chứng timing.

## Git / bàn giao

Remote URL đã xác nhận: `https://github.com/hole1981998-gif/Start-Homecoming.git`. `ls-remote --symref` trả HEAD là branch P4.1, không có main/master. Vì thiếu main, đây là patch/branch review dựa P4.1 đã duyệt, chưa có PR theo base main và chưa merge. Không tạo main hoặc giả vờ đã cập nhật main. CI/review người thật trên revision cuối: chưa có.
