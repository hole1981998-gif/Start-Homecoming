# Đối chiếu gameplay ver.force / ver.noforce

Ngày 19/10/2026, Windows. Checkout `codex/p7-secret-ending` tại HEAD `c33664e`, có thay đổi P7/handling/sân thử chưa commit từ trước; không có remote. Đây là tự đánh giá của Codex từ test tự động và trình duyệt, chưa phải đánh giá của người chơi.

## Bản chơi

- `http://127.0.0.1:5173/ver.force.html?seed=17`: game P7 đầy đủ, thêm `ForceIntegration` dùng Cannon cho phản lực tiếp xúc giữa player, xe giao thông và kiện/thùng rơi. NPC dùng quét va chạm và chuyển động văng/ngã theo luật arcade để không biến thành vật chắn cứng.
- `http://127.0.0.1:5173/ver.noforce.html?seed=17`: cùng game và seed, gọi thẳng `stepRun` hiện tại. Trang `/` cũng dùng luật noforce. Link đổi bản hiện trên màn mở đầu và lúc lái, giữ query/seed.
- Ca so sánh nhanh: thêm `scenario=traffic-ram&seed=17` vào hai URL trong DEV. Xe buýt húc xe nhỏ gần điểm xuất phát. Đây là fixture để thấy lực, không dùng đánh giá mật độ/economy ván thường.
- Ca NPC: `ver.force.html?scenario=force-npc-hit&seed=17` đặt một khách ở giữa đường tại 18 m. Cùng query trên `ver.noforce.html` là đối chứng. Đây là fixture cô lập, không phản ánh xác suất khách ở ván thường.

## Điều thực sự được tích hợp

Arcade vẫn quyết định collision sweep, HP, ngã xe, khách quay lại, xăng/tiền/điểm, tàu, secret và thứ tự terminal event. Ở bản force, sau mỗi fixed tick lớp Cannon giải các body động trong phạm vi 65 m rồi trả vị trí/lateral velocity/speed phù hợp về Run. Không lấy contact engine để phát damage thêm. Player đang ngã/đã kết ván không bị lớp lực đẩy nữa; luật trôi/ngã hiện có giữ nguyên. Lực có thể làm vị trí và lựa chọn né ở các tick sau khác, nên economy của **cùng ván sau khi va chạm** có thể phân kỳ dù bảng số cân bằng giống nhau. Cannon được nạp động, bản noforce không cần tải module đó.

NPC ở `ver.force` không có phản lực cứng lên xe. Quét footprint cũ–mới phát hiện xe đang chạy tông NPC kể cả khi qua nhanh trong một tick; NPC văng theo hướng xe chạy, lệch sang bên, nằm một nhịp rồi đứng dậy. Trong khoảng này cùng va chạm không kích hoạt lặp. Nếu chính xe người chơi tông, NPC được gắn `pickupable=false` lâu dài, kể cả sau khi đứng dậy; xe giao thông tông không tự gắn cờ từ chối này. Lực cản tốc độ thử nghiệm là 2%, không đổi HP, tiền hoặc fuel từ cú tông NPC.

## Quan sát và giới hạn

**Dữ kiện tự động:** test cô lập cho thấy NPC văng/ngã/đứng dậy, không cản đáng kể tốc độ, không bị tính va chạm lặp, và F từ chối đón sau khi chính người chơi tông; bản noforce đối chứng vẫn đón được. Cùng input/seed tái hiện; ca xe máy húc ô tô giữ đúng một damage event và miễn đẩy player lúc ngã; ca xe buýt đẩy ô tô nhỏ tiến về trước. Ván seed 17 chạy 20 s ở bản force tới 344,5 m, HP 59,36, xăng 3,95 L, không NaN/âm tài nguyên, không gặp contact body động trong quỹ đạo mẫu đó. Điều này không đủ kết luận độ khó hay FPS dài hạn.

**Manual in-app browser:** mở cả hai URL seed 17, Bắt đầu chạy, giữ W ở force, quan sát HUD/quãng đường và cảnh; force pause rồi restart trả về 0 m, 200 tiền, 5,5 L và 70 HP. Ca `traffic-ram` trên force gây −8 HP ở xe buýt và xe vẫn tiếp tục chạy. Ca `p7-secret` trên force không dùng nitro/nhảy kết thúc đúng bằng “Va chạm tàu hoả” tại 12 m; có màn kết quả/Chơi lại. Với `force-npc-hit`, sau khi bắt đầu và giữ W, tại khoảng 18–20 m thấy NPC đã văng/đổ sang phải xe, xe vẫn chạy khoảng 64 km/h, HP 70. Đã reload về màn mở đầu để chủ dự án thử lại. Screenshot chỉ chứng minh trạng thái/đọc hình ở thời điểm chụp; hành vi F sau khi NPC đứng dậy do test logic xác nhận, chưa thao tác thủ công trong browser. Cảm giác tay lái, nhịp collision liên tục và phản lực ở mọi loại xe vẫn cần chủ dự án chơi thử.

Ảnh kiểm chứng màn mở đầu và link đổi bản: [force_ab_preview.png](force_ab_preview.png).

**Tự review game design — ý kiến:** NPC mềm giải quyết cảm giác xe bị chặn vô lý; mất cơ hội đón sau khi tông tạo hậu quả chiến thuật rõ mà chưa cần trừ HP. Cần xem quãng văng 2,5–6 m và nhịp đứng dậy khoảng 1,6 s có đọc rõ ở tốc độ cao không; nếu không, ưu tiên cue tư thế trước khi tăng lực/phạt. Hai bản vẫn cần so cùng seed và nhiều loại xe; không đổi damage/economy từ một ca fixture. Kiểm tra thêm 30 seed dày đặc và tần suất mắc kẹt trước khi chọn force làm mặc định.

**Tự review UX — ý kiến:** link đổi bản và nhãn phiên bản đọc được trên màn mở đầu/HUD, nút Bắt đầu không bị đẩy khỏi khung sau khi rút gọn mô tả. Ưu tiên tiếp theo là cue lực ngắn gần xe thay vì bảng debug; chưa thêm VFX/art trong prototype. Trên màn nhỏ cần xem lại chỗ nhãn bản chơi sát dãy phím.

**Giới hạn kỹ thuật:** engine hiện chỉ giải các body phẳng, không thay hình học tàu, vũng nước, ổ gà, rào chắn hoặc lề. Body được dựng lại mỗi tick từ trạng thái gameplay, nên không phải một thế giới rigid-body liên tục; contact ở đúng biên sweep có thể thể hiện trễ một fixed tick (~16,7 ms). NPC dùng cung chuyển động arcade sau swept hit; chưa có ragdoll/animation chuyên biệt. Phản lực player lúc ngã ưu tiên luật crash hiện tại. Chưa đo FPS/memory trên nhiều thiết bị, chưa chứng minh toàn bộ ván force cân bằng hoặc mọi tuyến có thể hoàn thành.

## Cập nhật sau feedback sức nặng xe chướng ngại

Revision làm việc HEAD `c33664e` + working tree, Windows, seed 17, fixture `traffic-ram`; hệ số khối lượng va chạm traffic tăng **2 lần**, chỉ ở `ver.force`. Snapshot trạng thái trước bước arcade để nhận đúng xung lực đầu khi xe vừa hỏng. Xe lớn húc hỏng nhận một xung lực khi chạm xác; sau đó cặp player–xác không tiếp tục đẩy nhau, nhưng traffic/cargo khác vẫn va được với xác. Khi tài xế đang ngã, player không truyền thêm lực engine. HP/damage/economy/fuel và `ver.noforce` không đổi.

**Simulation thực tế:** trong ca xe buýt húc ô tô dừng tại 8 m, tốc độ buýt ngay trước phản lực là 13,73 m/s, sau tiếp xúc đầu 8,76 m/s; ô tô dịch từ 8,00 lên 8,20 m. Đến tick 100 buýt đã vượt qua và phục hồi trung vị, xác không bị đẩy lặp, contact engine đúng một lần; HP bị trừ một lần theo arcade. Ca xe máy va xe đang dừng xác nhận khi tài xế ngã, tick hồi phục tiếp theo không tiếp tục đẩy xe chướng ngại. Ca NPC trước đó vẫn qua, 20 s seed 17 bản force không có tài nguyên âm/NaN. Các kết quả này từ test tự động, không đo cảm giác tay lái.

**Manual in-app browser:** mở `ver.force.html?scenario=traffic-ram&seed=17`, bắt đầu, giữ W, thấy cue −8 HP, xe buýt tiếp tục chạy; tạm dừng và Chơi lại đưa quãng đường 0 m, tiền 200, xăng 35 L, HP 210. Ảnh [force_traffic_weight_preview.png](force_traffic_weight_preview.png) ghi HUD/cue ngay sau cú húc; ảnh không chứng minh được tốc độ phản lực nên dùng simulation ở trên cho phần đó. Cảnh thử đủ xác minh luồng input/HUD/va chạm/restart; chưa thử thủ công đủ mọi cặp xe và mọi tốc độ.

**Tự review game design — ý kiến:** cú đầu nặng hơn nhưng xe buýt không mắc kẹt trong xác, giữ chiến thuật xe lớn phá xe nhỏ. Hệ số 2 là giả định thử, chưa phải cân bằng chốt. Cần chủ dự án so cùng seed với `ver.noforce`, nhất là ô tô 4 chỗ đối đầu xe lớn và xe cùng chiều đang chạy; nếu bị chậm quá mức, giảm hệ số theo chủng loại thay vì tăng damage. Không suy từ fixture ngắn ra độ khó ván đầy đủ.

**Tự review UX — ý kiến:** HUD và cue −8 HP hiện rõ trong ca húc; vận tốc giảm tức thời có thể đọc qua số tốc độ nhưng thiếu cue quán tính gần xe. Ưu tiên nhận feedback người chơi về cảm giác húc; VFX/SFX hoàn chỉnh vẫn ở giai đoạn sau. Không đổi UI trong lượt này.

## Cập nhật động lượng trượt sau húc

Theo feedback tiếp theo, phiên bản chỉ có một bước đẩy làm xe chướng ngại dịch quá ít. Bản `ver.force` hiện giữ vận tốc va chạm dư theo từng traffic giữa các tick, hãm tới 0 sau cú húc. Xe hỏng có `speed=0` (không tự lái) nhưng trượt bởi dư lực; xe còn sống giữ `speed` và `baseSpeed` của bản arcade, trượt thêm rồi tự tiếp tục chạy. Lực bật ngược của solver không được ghi thành hướng lái mới. `ver.noforce`, HP, damage, tiền, xăng và điều kiện kết ván không đổi. Hệ số vẫn **TẠM**.

**Simulation tự động, HEAD `c33664e` + working tree, seed 17:** buýt húc ô tô đứng tại 8 m: tốc độ buýt ở bước tiếp xúc đầu 8,76 m/s, xác trượt đến 10,88 m trong 100 tick rồi đứng yên, chỉ một cặp contact player–xác. Ô tô 4 chỗ húc ô tô cùng chiều đang chạy 5 m/s: xe kia còn 6 HP, đi thêm khoảng 1,76 m ngoài quãng tự chạy trong 4 s và trở lại đúng 5 m/s; không chuyển sang số lùi. Chạy đối chứng arcade cùng seed/input giữ nguyên HP xe chướng ngại và độ bền player ở mốc 4 s. Test NPC trước đó và ca 20 s seed 17 không lỗi tài nguyên. Hai fixture DEV `traffic-ram` và `force-car-ram` cho người chơi lặp lại cùng seed.

**Manual in-app browser, seed 17:** ca `force-car-ram` bắt đầu bằng ô tô 4 chỗ, giữ W húc xe cùng chiều; thấy −20 HP, tài xế văng ra, xe chướng ngại vẫn ở phía trước sau lúc trượt và người chơi tăng tốc lại. Tạm dừng và Chơi lại khôi phục 0 m, 200 tiền, 16 L, 120 HP. Ảnh [force_car_slide_preview.png](force_car_slide_preview.png) ghi cảnh xe ở phía trước sau khi tài xế quay lại; quãng trượt 1,76 m được đo bởi simulation, không suy từ ảnh. Chưa chơi thủ công tất cả loại xe hoặc đường dày đặc.

**Tự review game design — ý kiến:** phần trượt tạo phản hồi nhìn thấy được mà vẫn phân biệt xác trôi với xe sống tiếp tục chạy. Car–car còn 6 HP là đúng bảng damage hiện tại; chưa đánh giá độ khó toàn ván hay tương tác dây chuyền khi nhiều xe cùng bị đẩy. ĐỀ XUẤT kiểm tra thêm va chạm cùng/ngược chiều ở các tốc độ và tần suất kẹt trong stress trước khi khóa hệ số; không tăng damage chỉ để làm lực trông mạnh hơn.

**Tự review UX — ý kiến:** trong ca ô tô–ô tô, HUD −20 HP và trạng thái tài xế ngã đọc được, nhưng xe chồng hình ngay thời điểm impact nên quãng trượt khó ước lượng từ một ảnh. Cần quan sát liên tục hoặc so video/telemetry vị trí; VFX/SFX và art vẫn theo giai đoạn sau. Ca fixture nên gắn nhãn `ver.force` thay vì nhãn P6.1 chung; đã cập nhật nhãn đó.

## Gate

Windows, HEAD `c33664e` cùng working tree chưa commit. Sau cập nhật động lượng: `pnpm lint` exit 0; `pnpm typecheck` exit 0; `pnpm test` exit 0 (32 files, 224 tests); `pnpm simulate` exit 0 (11 files, 121 tests); `pnpm build` exit 0 (có `dist/ver.force.html` và `dist/ver.noforce.html`); `git diff --check` exit 0 (cảnh báo LF/CRLF, không có lỗi whitespace). Sau bổ sung assertion đối chứng HP/damage, lint/typecheck/test chạy lại và qua; simulation/build đã qua trên cùng code runtime, không chạy lại cho thay đổi test-only. CI/PR/merge: chưa có vì checkout không có remote và base main cập nhật không xác minh được; thay đổi P7/handling trước đó đang ở working tree. Không commit đè thay đổi người dùng.
