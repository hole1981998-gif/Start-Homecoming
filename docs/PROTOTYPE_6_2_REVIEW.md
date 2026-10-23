# P6.2 — gió và nước đẩy ngang

18/10/2026;branch codex/p62-environment-forces,base local551e442. Config fixture p62-forces-1;normal vẫn p61-integrated-2. Tự review Codex từ simulation,keyboard/browser và ảnh mới;không có reviewer độc lập.

## Phạm vi và bản chơi

http://127.0.0.1:5173/p61.html#forces có8ca:gió phải/trái,nước phải/trái,mixed,star,crash,coast. A/D vẫn lái,1star,2nitro/Space,Esc pause. Fixture DEV có vật phẩm mẫu,coast chỉ0,23L đầu;không chứng minh economy. Chỉ làm bản tình huống trước để duyệt,các vùng mới chưa sinh trong normal director hoặc stress. Không sửa archive stress581c4df,không tắt fuel traffic;P8 vẫn hỏi chủ dự án theo note đã lưu. Không tạo art/VFX/SFX hoàn chỉnh.

## Implementation/quyết định TẠM

forceBalance trong config.ts:wind1,5m/s,current2m/s,maxPush2,2m/s<lateralSpeed5m/s;vùng45–110m,rộng9,6m. Mô hình prototype là tốc độ đẩy ngang trực tiếp theo phần thời gian tiếp xúc,không lưu momentum/impulse giữa tick. Không gọi đây là mô phỏng lực gia tốc quán tính đã chốt. Tổng nhiều vùng bị cap,AD giữ nguyên controller,biên đường theo width xe. Full length xe được tính khi xác định vào/ra vùng.

environment-forces tách render/UI,đẩy x thật trước sweep collision nên có thể gây va chạm thật. Gió không thêm damage/fuel;nước giữ nước gốc và fuel cost. Star,crash,vùng được protect sau ngã/thay xe không chịu lực;không tích để trả lại sau miễn nhiễm. Coasting vẫn chịu lực ngang. Nitro-jump vượt đủ cao bỏ current nước,không bỏ gió trên không. Rời vùng/pause không có drift môi trường dư;AD có quán tính controller vốn có. Branch cũ chỉ render,không tiếp tục đẩy ở nhánh mới. Chưa áp lực lên traffic NPC.

Vùng gió dùng primitive phẳng xanh lục,nước xanh lam. Wind icon/Waves và mũi tên hướng;một mũi tên1,5m/s,hai mũi tên2m/s. Không thêm bảng log/production art. Lần đầu gặp có card pause,Help vẫn xem lại;đã bổ sung wind vào validation seenCards để không lặp thẻ sau mỗi reload. Không thêm caption flavor chưa được duyệt cho gió.

## Gate

Windows,Node24.19.0,pnpm11.25.0. pnpm lint exit0;pnpm typecheck exit0;pnpm build exit0,JS596,63kB/gzip160,87kB,cảnh báo chunk>500kB còn. pnpm test --maxWorkers=1 --minWorkers=1 exit0:192tests/27files,45,47s. pnpm simulate --maxWorkers=1 --minWorkers=1 exit0:105tests/9files. Giữ timeout/rule/số lượt. Annotation/type feedback được sửa khi thêm kind wind;không bỏ typecheck. Git diff/secret-pattern kiểm tra trước commit.

15tests force mới:entry/exit theo footprint và sweep,overlap cap,AD thắng lực đối nghịch,wind không thu fuel/HP,no residual sau exit,star hết hạn không catch-up,pause identity,crash/protected immunity,waterfuelkhông đổi,currentclear khi bay/windkhôngclear,force dẫn tới collision thật,coasting,retire branch,normal không spawn,tám loại xe×támca bound/source immutability,30/60/144FPS bằng nhau. P6.1/stress/shop/khách regression vẫn chạy.

Simulation48lượt=6seed×8fixture×10s hoặc tới terminal,AD scripted theo chu kỳ;JSON ở evidence/p62/summary.json. Seed1,7,17,42,101,126;hình học/lực fixture cố định nên nhiều endpoint giống nhau,không coi là48layout RNG. Coasting kết ván fuel khoảng76m,HP70;những ca khác tới140m,còn chạy theo script. ScriptAD tránh được xe trong matrix crash;unitcase và manual riêng mới chứng minh crash. Matrix star không tự dùng món,star được kiểm tra riêng bằng test/mmanual. Tám loại xe còn được chạy riêng10s/fixture và kiểm tra biên;không gọi đó là stress NPC đông.

## Manual IAB seed17

- Gió phải:restart sau card,hữu hiệu W3,3s tới67m,thấy vùng/cue→,xe bị dịch tương đối đường;01-wind.png. A0,7s,1star,W1s tới105m,HP70/fuel5,0L,ô1trống/star3,7s;02-counter-star.png. Ảnh không tự chứng minh x chính xác hoặc immunity;test displacement riêng bảo vệ phần đó.
- Nước trái:W3,3s tới67m,thấy vùng xanh lam/cue←←,fuel khoảng4,2L;D0,7s tới80m/70HP/3,6L;03-current.png. Không áp penaltyHP mới. Console error0 ở các ca đã đọc.
- Coast:W qua thời gian card rồi tới0fuel/coasting,tiếpW kết ván76m/70HP/238,1tiền,active khoảng5s. Thời gian chờ card không cộng active time. Reload/card lặp đã được phát hiện trong playtest và sửa persistence cùng regression roundtrip wind.
- Crash:revision cuối W5s tới79m,50HP/5,3L,HUD0/2 và tài xế đang ngã/trượt;04-crash.png. So sánh không có lực khi ngã dựa test cùng state,camera/ảnh không đủ đo điều đó độc lập. Pause/resume hoạt động;restart gió đã đưa về0m/200/5,5L.
- Mẫu current240frames~59,999FPS,P95frame16,8ms,renderCPU1,492ms,mẫu ngắn trên máy này. Chưa có perf stress dày với lực.

CHƯA KIỂM TRA THỦ CÔNG riêng wind-left/current-right/mixed/star-title fixture;đã có test/simulation và manual các cơ chế tương ứng. Chưa playtest production cho lực:fixture DEV-only. Không suy build pass thành gameplay pass.

## Tự review gameplay

Dữ kiện:AD có thể kéo ngược lực trong test,manual vẫn lái được;current65m hao nhiều xăng theo luật gốc,trong matrix từ5,5L xuống khoảng1,041L ở140m. Gió chỉ đổi chiến thuật làn,không tự thu tài nguyên. Ý kiến:wind1,5 có thể nhẹ khi người chơi luôn giữAD;current2 và đoạn dài có thể tạo thử thách tài nguyên mạnh hơn lực lái. ĐỀ XUẤT chưa áp dụng:chủ dự án so sánh giữ/nhảAD trong mỗi vùng rồi chọn cảm giác mong muốn;trước tích hợp mới thử ghép một traffic lệch lane và đo cửa sổ phản ứng. Không tăng density/damage hoặc khóa giá/fuel từ fixture này. Nếu muốn quán tính/giật gió theo thời gian,cần quyết định mới thay mô hình push stateless hiện tại.

## Tự review UX chức năng và giới hạn

Từ ảnh mới/input:ranh màu và arrow phân biệt hai hướng,giữ input cũ;first card pause và persistence đã sửa. P2:cue neo tâm vùng sẽ hiển thị0m khi đã qua tâm nhưng còn ở vùng,cần chỉ trạng thái đang đẩy/khoảng còn lại khi làm UX. Camera theo xe nên displacement khó định lượng bằng ảnh;không dùng ảnh để khẳng định steering feel. UI/art audit đầy đủ dời phase tương ứng theo yêu cầu trước;không nhận có Product Design audit hoặc chuyên gia độc lập.

Mô hình tính phần contact theo sweep trước dịch lực và clamp vị trí,không là solver continuous cho mọi vùng nhỏ/diagonal/overlap bất thường. Đã thử vùng dài phẳng;chưa director fairness/force ảnh hưởng NPC/đường cong mật độ cao. Tích hợp cần thêm ca ghép nhiều hazard và rẽ thực tế,tuning sau chủ dự án duyệt cảm giác. Khoảnh khắc ngã có skid cũ vẫn dịch ngang nhưng không do gió;đừng nhầm thành force immunity fail. Không gặp URL-policy denial trong lượt này.

Repo không remote nên không fetch/fast-forward remote main/push/PR/CI. Base local ghi rõ,không sửa sources/. Commit local,chờ chủ dự án chơi duyệt,chưa merge;không tự chuyển P6.3 hoặc tích hợp lực vào normal sau lượt này.
