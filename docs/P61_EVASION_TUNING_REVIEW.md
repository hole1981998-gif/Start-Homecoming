# P6.1 — chỉnh né tránh theo feedback

18/10/2026; branch codex/p61-evasion-tuning, base local d243fdc; config p61-scenarios-2. Repo không có remote nên không thể fetch/fast-forward remote main; lưu thay đổi local review được, không push/PR/CI/merge. Không sửa sources/. Chủ dự án duyệt thay đổi tuning trong chat; chưa duyệt tích hợp.

## Thay đổi

Thêm 4 ca riêng cho hai loại officer: nhanh 6,3 m/s và lệch nhịp (5,6/3,8 m/s, lệch dọc 3 m, hai phạm vi ngang chồng một phần). Giữ các ca cũ để so sánh, không tự tăng độ khó ván thường. Chuối vẫn vô hiệu toàn nhóm, phạt tối đa một lần/nhóm. Không teleport, dùng sweep/reflection hiện có. Không thêm quỹ đạo truy đuổi.

Chủ dự án xác nhận 4 s tính từ đầu tàu vào tới đuôi ra khỏi toàn đường. Cũ thực tế 5,6 s, không có timer 5 s. Giữ dài ngang 24 m, road 9,6 m, tăng speed 6→8,4 m/s; thời gian vào/rời mỗi lane vẫn theo hitbox. Hàng rong ngang 2,2→3,4 m/s, dài dọc 1,5→2,1 m, rộng 0,8→1,1 m; tăng chiều dài thân và footprint đồng bộ.

## Kiểm tra

Windows/Node24.19.0/pnpm11.25.0. pnpm lint, pnpm typecheck, pnpm build exit0. Build JS587,98 kB/gzip158,01; vẫn cảnh báo chunk>500kB. Test mục tiêu 18/18 pass, gồm timing hình học 4 s cả hai hướng, variant trong đường, chuối giữ cả nhóm đứng yên, vendor chuyển động liên tục. Sửa test star theo thời điểm va thật: tàu nhanh hơn đã rời đường trước khi xe chỉ cruise tới, nên dùng W để thật sự chạm tàu khi star còn hiệu lực; không đổi luật star.

Manual IAB seed17: nhóm công an lệch nhịp W1,9s +1, pause rồi W2,6s: qua86m,243,3tiền,70HP, không phạt; không khẳng định đã chạm riêng từng NPC từ ảnh. Tàu S5s rồi W6,5s: qua107m/70HP, sau5s tàu đã rời đường. Hàng rong W2,3s rồi W1,8s: thấy vật cản lớn hơn chạy ngang, va gây ngã ở77m,70HP, không terminal. Công an nhanh W2,2s,D0,65s,W1,6s: bị bắt và chuyển car4 ở71m, còn1,2tiền; thử né này không thành công. Console error tại ca cuối:0. Restart thông qua tải lại ca đã reset tài nguyên/input, pause/resume hoạt động. Dân phòng hai variation chưa chơi riêng trong browser; có simulation/test chung. Ảnh mới trong evidence/p61/tuning.

## Tự review

Game design: từ manual, nhịp né nhanh đã gây bắt ở một input né muộn; chưa đủ chứng minh công bằng/độ khó với người chơi. Hai NPC lệch nhịp giảm việc luôn tụ cùng tâm; vẫn có thể phanh chờ/chọn bên hoặc dùng chuối. ĐỀ XUẤT chưa áp dụng: người chơi so sánh ca nhanh/lệch nhịp với ca cũ, ghi có đọc kịp hướng chạy hay không trước tăng tốc thêm. Tàu nhanh làm thời gian chờ ngắn hơn và cửa sổ va khác; không coi đó đơn thuần tăng khó. RNG fixture giữ quỹ đạo cố định, seed đổi khách; chưa thử dense traffic hoặc cân economy.

UX chức năng tự review từ input và ảnh mới: intro mô tả kiểu di chuyển, dùng lại input/chuối, không thêm menu. Ở xa NPC vẫn nhỏ; chưa biết cue đủ đọc trong bản tích hợp. Visual polish/audit UI đầy đủ để phase UI theo yêu cầu trước. Không có chuyên gia độc lập. Chờ chủ dự án thử 19 ca trước tích hợp; các giới hạn timeline player/NPC và fuel cùng tick trong báo cáo P6.1 cũ vẫn còn.

Gate toàn bộ source cuối: pnpm test exit0,160 tests/24 files (13,62s); pnpm simulate exit0,73 tests/6 files. Matrix 30 seed ×19ca ×10s =570 lượt, finite/tài nguyên không âm; đây là fixture hình học cố định, không phải win rate/cân bằng tuyến thật. JSON lưu tại evidence/p61/tuning/simulation-summary.json. Các gate lint/typecheck/build và manual ở trên cùng source; sau đó chỉ thêm tài liệu/evidence.

## Hàng rong rộng hơn — version3
Branch codex/p61-wider-vendor, base307b7bf, 18/10/2026. Tăng rộng ngang1,1→1,8m; giữ dài2,1m/tốc3,4m/s; render/collider chung footprint. pnpm lint/typecheck/test/build đều exit0;160tests/24files, matrix570ca trong test. Build còn cảnh báo chunk>500kB. IAB seed17 W2,3s lưu ảnh06-vendor-wide.png, tiếpW1,8s:77m/70HP, ngã không terminal, console0error. Tự review gameplay: thân rộng chiếm hành lang lâu hơn, chưa kết luận đủ khó/công bằng từ một input; chờ chủ dự án thử. UX chức năng: hình thân rộng khớp collider; visual polish để phase riêng. Chỉ fixture DEV. Không remote nên không fetch remote-main/push/PR/CI; commitlocal, chưa merge.
