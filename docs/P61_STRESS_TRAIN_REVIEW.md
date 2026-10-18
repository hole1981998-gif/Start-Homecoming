# P6.1 — stress test tích hợp và tàu đứng ngoài đường

18/10/2026; branch codex/p61-stress-and-train, base local b741cad. Runtime thường p61-integrated-2; stress metadata p61-stress-1. Đây là tự review Codex từ commands, simulation và input browser thật; không có reviewer độc lập.

## Bản chơi

Stress từ đầu: http://127.0.0.1:5173/?scenario=stress&seed=17 . Đoạn sau: thêm &start=288 hoặc &start=576. Hub /p61.html có các link. Chế độ DEV dùng đầy đủ simulation/hệ thống của bản tích hợp; không phải một fixture chỉ có một hazard. Production bỏ query scenario như trước, ván thường không bật stress.

Stress cấp container+bus dự phòng,10000tiền,chuối/nitro để thử. 1/2 dùng vật phẩm,Space khi nitro,Tab đổi xe,F/G khách,Rshop,Esc pause. Không miễn damage/tàu terminal hoặc tự hồi sinh; gặp khó có thể restart/checkpoint. Chơi lại giữ seed/start và reset mọi tài nguyên. Input start được kiểm tra finite,giới hạn0–10000m và snap theo24m.

## Vì sao tàu trông đứng yên

Code trước đặt startedAt ngay khi sinh từ khoảng cách/tốc độ trung vị. Với xe giữ W,tới ray sớm hơn ETA đó là khả thi: đoàn tàu vẫn ở origin ngoài đường và renderer vẫn vẽ nó. Đây là lỗi phối hợp thời điểm kích hoạt với cách vẽ, không phải mất velocity của tàu. Ngoài ra selectTurn gọi fillWorld không truyền now nên moving event mới sau rẽ có clock gốc0 thay vì activeSeconds hiện tại.

Sửa: train có motionWaiting khi còn xa, không vẽ body nằm chờ và không advance quỹ đạo. Khi vào khoảng tiếp cận thực max(60m,v×2,4s,v²/(2×braking)+vehicle.length+15m),clone train và set startedAt=now đúng một lần. Sau đó chạy ngang liên tục, không tiếp tục kéo ETA theo người chơi, phanh không dừng đoàn tàu. Cue vẫn báo sắp tới khi body chưa vào đường. Giữ tốc8,4m/s,body24m/crossing4s,hitbox thật và star không cứu terminal. Rẽ truyền clock/speed hiện tại. Safe-exit khách reserve vùng ray chờ bảo thủ.

Một người chạy chậm có thể tới sau khi tàu đã qua: hợp lệ, khác với chạy xuyên lúc tàu chưa được khởi hành do ETA cố định. Không bảo đảm mọi seed buộc chạm tàu. Bản từ đầu dùng sửa này, không chỉ stress.

## Mật độ stress

Stream seeded cộng thêm vào normal world:2traffic mỗi24m,full roster8loại;patch mỗi48m có width1,5/5,7/9,6m và length4/20/35m;special mỗi72m theo vòng công an,dân phòng,tàu,rào,hàng rong,cứu thương,accident,broken. Vòng lặp sau tiếp tục, không chỉ spawn một lần. Có mẫu NPC fuel thấp để thử hết xăng/coasting. Preload480m cho traffic tự tương tác trước khi người chơi tới; IDs/counter tách theo branch, giữ retirement nhánh cũ. Không clear shop/khách/đồ/tài nguyên để lấy một sa bàn trống. Có thể chồng cả ba lane, chuỗi hỏng và phạt nối tiếp theo yêu cầu không cân bằng; không mang pattern này sang director thường.

## Kiểm tra tự động

Windows/Node24.19.0/pnpm11.25.0. pnpm lint exit0;pnpm typecheck exit0;pnpm build exit0,JS594,67kB/gzip160,30kB,còn cảnh báo chunk>500kB. pnpm test --maxWorkers=1 --minWorkers=1 exit0:177tests/26files,42,19s. pnpm simulate --maxWorkers=1 --minWorkers=1 exit0:90tests/8files. Không đổi timeout hoặc cắt số lượt. Bài stress ban đầu gom6seed bị timeout5s; tách thành6 test case độc lập vẫn đủ6seed×30s (hoặc tới terminal), mỗi seed khoảng1,1–1,6s. Lỗi type test fixture được sửa bằng annotation World, không bỏ typecheck.

Regression mới: stress opt-in/density/all catalog/all hazard families/IDs/seed; checkpoint validation; train pending không advance, kích hoạt theo tốc8/14/20/31m/s rồi đổi pose; giữ W trên generated approach thật thấy train chạy rồi terminal; fork dùng clock hiện tại;6 stress simulation finite/không âm và không mutate source. Các suite tích hợp/fixture cũ chạy lại. JSON chi tiết tại evidence/p61/stress/summary.json.

Kết quả W-only,không auto né/vật phẩm,cap30s: seed1/7/17/101/126 kết ván do tàu khoảng232m;seed42 còn chạy khoảng329m. Max entity tương ứng65,68,74,78,71,74. Đây là số tồn tại trong world,không phải tất cả cùng được camera nhìn thấy. Tàu đã thực sự tác động; không dùng win rate này làm difficulty/economy. Tuyến thường6seed240s trong suite vẫn finite nhưng pilot đọc dữ liệu tương lai, không thay playtest người dùng.

## Manual IAB

Stress seed17: W6s tới91m,container bị công an tịch thu,đổi bus,9735,6tiền/210HP;thấy nhiều loại traffic/nước,cue và thanh HP.01-dense.png. Tiếp W10s tới192m/157HP,tiếpW6s kết ván train231m/146HP khoảng18s. Không có miễn terminal trá hình. Pause không chạy tiếp trong thời gian đọc state. Console error0 tại các lần đọc. Mẫu360frames60,003FPS,P95frame16,8ms,mean renderCPU3,57ms. Mẫu ngắn trên máy này,không chứng minh mọi dense scenario ổn định60FPS.

Checkpoint tích hợp thường seed1: W8,5s rồi S0,8s lưu02-train-moving-a.png ở1668m;S0,8s lưu03-train-moving-b.png ở1681m. Đoàn tàu đã thay vị trí rõ giữa hai ảnh,thân/hitbox không đứng ngoài trái. S2,5s rồi W5s qua1748m,120HP/14,2L,không terminal. Đây là QA shortcut có xe/tài nguyên mẫu,không economy run.

Stress start288: URL đúng đưa HUD288m;W5s tới322m,284HP và10008,7tiền,ngã/rào và nhiều traffic/patch hiện cùng nhau.04-later-section.png;console error0. Start576 có kiểm tra tự động,CHƯA KIỂM TRA THỦ CÔNG riêng. Stress shop/F/G không lặp lại manual trong lượt này; các test tích hợp/UI trước vẫn chạy. Chưa kiểm tra production dài sau sửa; build pass không được coi là manual gameplay production.

## Tự review

Gameplay: stress đã tạo hậu quả thật nhanh,đủ gây chuỗi va/hỏng/đổi xe/tàu terminal. Việc khó tới các loại sau là chủ ý của stress không cân bằng nên cung cấp checkpoint để bao phủ,không tự thêm miễn nhiễm hoặc revive. ĐỀ XUẤT chưa áp dụng: khi chủ dự án báo lỗi,gửi seed/start và input ngắn để biến thành regression;đừng giảm damage/chỉnh economy từ run này. P8 vẫn cần đo tuyến thường riêng.

UX chức năng: intro ghi rõ stress và tài nguyên mẫu,giữ input cũ,checkpoint ởhub thay thêm menu lúc lái. Train chờ được ẩn nên không còn mesh đỗ gợi sai;hai ảnh mới + input chứng minh tiến ngang. Khi rất đông,chỉ một cue hazard ưu tiên và nhiều thanh HP dễ che nhau; ghi cho phase UX,không polish art/UI lúc này theo yêu cầu trước. Không làm Product Design visual audit hoàn chỉnh; đây là tự review chức năng từ ảnh/input hiện tại.

Giới hạn: stress có thể không có lối né/có combo bất khả thi theo yêu cầu mới,không là template spawn cân bằng;không kết luận zero bug hay mọi triple-contact đều phủ hết. Không gặp từ chối URL localhost trong lượt này. Không remote nên không fetch/fast-forward remote main/push/PR/CI;commit local trên feature branch,không sửa sources/,chưa merge,chờ chủ dự án thử. UI/art/SFX đầy đủ và tuning roadmap giữ nguyên.
