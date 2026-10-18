# Vật phẩm và chướng ngại mở rộng — feedback 18/10/2026

> **Thiết kế hiện hành P6.1:** xem DESIGN_MOVING_EVENTS_TRAFFIC.md. Feedback mới thay mô hình tàu/công an bật-tắt chắn toàn đường của bản P6; phần mô tả P6 phía dưới là lịch sử implementation, chưa phải cơ chế chuyển động đã nghiệm thu. Chưa sửa runtime trong lượt cập nhật design này.

## Trạng thái và thứ tự ưu tiên

**ĐÃ CHỐT theo chủ dự án:** bỏ gói xăng/bộ sửa mang theo. Shop vẫn bán xe, nâng cấp và tiếp tế xăng/độ bền ngay tại chỗ; không bán hai gói hồi tài nguyên. Các pickup xăng/HP trên đường hiện có vẫn hồi trực tiếp, không đi vào kho. Chưa có yêu cầu bỏ các pickup đó.

P5 chỉ triển khai phần bỏ hai món cũ. Những tính năng dưới đây được đưa vào các prototype riêng vì ảnh hưởng collision, controller, event và economy. Chưa có trong bản chạy hiện tại. Quy tắc mới ở đây thay mô tả cũ về gói hồi tài nguyên, nitro kho riêng/Space và danh mục vật phẩm. Hai ô cố định dùng 1/2 được giữ làm thiết kế cho kho mới; hiện chưa có món để dùng nên không hiển thị hướng dẫn phím này.

## Danh mục vật phẩm (cơ chế ĐÃ CHỐT, thông số chưa cân bằng)

| Món | Hành vi | Điều chưa chốt / mặc định triển khai đề xuất |
|---|---|---|
| Nitro boost | Tăng tốc trong thời gian định sẵn và cho khả năng nhảy qua chướng ngại | Tách thời gian boost với thời gian bay. ĐỀ XUẤT: phím ô kích hoạt boost kèm một cú nhảy; chỉ vượt collider thuộc nhóm cho phép, phải hạ cánh an toàn. Không coi boost là bất tử. Chốt/test cách kích hoạt nhảy trước triển khai |
| Invincible star | Miễn mọi damage và debuff khi hiệu lực; vẫn trigger công an, dân phòng, tàu và các event | ĐỀ XUẤT: thời gian hữu hạn, không cộng dồn vô hạn; chặn hậu quả HP/xăng/giảm tốc/ngã do va chạm thường, không chặn trigger hay quyết định terminal của event. Công an vẫn bắt/phạt/tịch thu nếu không có chuối; tàu vẫn kết ván nếu va chạm, chỉ nhảy vượt hợp lệ mới tránh. Đây là diễn giải bảo thủ cần chủ dự án xác nhận khi thử P5.1, không âm thầm đổi luật tàu |
| Chuối | Ném vào mặt công an/dân phòng để tránh bị bắt | ĐỀ XUẤT: chỉ tiêu món trong cửa sổ phản ứng event đã báo trước, một lần cho một event; bấm ngoài cửa sổ không mất món. Không vô hiệu tàu hay va chạm thường. Phải triển khai event nền trước khi nghiệm thu |
| Ứng dụng Grab | Một gói có số lượt dùng định sẵn; mỗi lượt sinh khách đặc biệt trên đường, khách cho nhiều tiền hơn khách thường | ĐỀ XUẤT: gói giữ một ô tới khi hết lượt; một khách/event cho một lượt; tìm chỗ tiếp cận được phía trước, không sinh ngay trong collider/hazard. Nếu không tìm được chỗ thì không trừ lượt. Thưởng thêm chỉ khi đón và chở thực tế, không cộng ngay khi gọi |

**ĐỀ XUẤT chung:** hai ô không dồn sau khi dùng; khi đầy không âm thầm thay món. Giá, nguồn lấy món (shop/loot), thời lượng, số lượt Grab, hệ số thu nhập và cooldown chưa chốt; chưa thêm giá hay bán món chưa dùng được. Tạm không cho dùng lúc pause/ngã/kết ván. Dùng state simulation, không phụ thuộc VFX; restart xóa hiệu lực và yêu cầu spawn còn chờ. Khách Grab cần ID/loại và nguồn thưởng riêng; giữ luật capacity tính tài xế, quá tải, rơi/ở lại/từ chối lên xe hiện có.

## Bốn nhóm chướng ngại (ĐÃ CHỐT về hướng cơ chế)

1. **Chắn đường gây ngã:** rào sửa đường, cây đổ, xe lớn chết máy nằm ngang, chiếm tối đa hai lane. Chạm làm ngã, không dùng chính sách instant lose của tàu. ĐỀ XUẤT: damage va chạm hữu hạn cấu hình theo loại, không đặt HP=0 trực tiếp; xe đã yếu vẫn có thể hỏng theo luật HP thông thường. Gây một lần cho một tiếp xúc, dùng chuỗi trôi/văng/nằm/đứng/quay về và miễn nhiễm hồi phục hiện có. Cần phân biệt rõ với collider tai nạn của secret.
2. **Di chuyển ngang lane:** hàng rong băng đường; cứu thương chạy nhanh và đổi lane liên tục. ĐỀ XUẤT: quỹ đạo seeded theo thời gian simulation, cue hướng và thời gian trước khi cắt đường; không teleport giữa lane; swept collision tính chuyển động cả hai phía. Không mặc định coi hàng rong là traffic phá hủy/sinh khách. Va chạm dùng hậu quả cấu hình riêng, chưa chốt damage.
3. **Làm khó điều khiển:** gió, dòng nước đẩy trôi. ĐỀ XUẤT: lực ngang có giới hạn, người chơi vẫn có quyền phản ứng; không đảo input bất ngờ. Có cue hướng/cường độ và vùng bắt đầu/kết thúc; miễn tác động trong crash hoặc khi star hiệu lực. Không dồn lực sau khi hết miễn nhiễm, pause không tích lực.
4. **Vật rơi từ traffic:** xe tải/container làm rơi đồ lăn xuống đường. ĐỀ XUẤT: sự kiện rơi có ID, xuất phát từ xe nguồn thực; giới hạn số vật và thời gian sống. Cue từ xe trước khi vật cắt hành lang lái; đồ lăn có collider/quỹ đạo seeded riêng, không sinh ngay dưới bánh. Quy định va chạm thường và vật gây ngã theo loại, không tự coi là collider secret.

**Công bằng:** hai lane bị chắn phải còn hành lang đủ cho xe hiện tại (kể cả xe dài/rộng và khả năng đổi lane); không chỉ đếm lane trống. Tổ hợp thêm xe/người/đồ rơi không được biến lối còn lại thành bẫy bắt buộc. Không sinh màn bắt buộc có vật phẩm nếu người chơi chưa có món đó. Giao lộ/nhánh vẫn giữ entity và seed riêng, không sao chép vật rơi sang nhánh chọn. Cảnh báo bằng graphic placeholder, không dùng art/SFX hoàn chỉnh trong các P này.

## Phân kỳ và tiêu chí nghiệm thu

| Prototype | Phạm vi | Gate chính |
|---|---|---|
| P5 hiện tại | Bỏ gói xăng/sửa mang theo, tiếp tế tại chỗ | UI không bán món, command cũ không thu tiền/hồi, phím 1/2 không hồi tài nguyên; mua xe/nâng cấp không hồi quy |
| P5.1 | Kho hai ô mới, nitro/jump, star | Timer fixed-step/pause/restart; jump/swept landing cho xe dài; không xuyên collider ngoài luật; star phân biệt damage/debuff với event; chưa nghiệm thu tương tác event thật trước P6 |
| P5.2 | Grab và dữ liệu khách đặc biệt | Không nhân đôi khách/thưởng; không tiêu lượt khi spawn bất khả thi; thu nhập theo quãng đường/khách thực; giữ đúng roster qua đổi xe/tai nạn; định giá sau simulation |
| P6 nền | Công an/dân phòng, tàu/tai nạn và chuối | Trigger dù star; chuối đúng cửa sổ/một event; thiếu tiền, tịch thu, terminal/secret có thứ tự; hồi quy nitro qua tàu |
| P6.1 | Chướng ngại chắn tối đa hai lane + chuyển lane | Lối thoát cho đủ tám loại xe; va một lần/ngã/miễn nhiễm; quỹ đạo liên tục và cue đủ phản ứng ở relative speed cao |
| P6.2 | Gió/nước đẩy | Input vẫn có tác dụng; giới hạn lực/tốc độ trôi; qua ranh vùng, star, crash, coasting, rẽ/pause không drift hoặc tích lực |
| P6.3 | Đồ rơi/lăn từ traffic | Spawn một lần/source, swept hai chiều, cleanup, giới hạn số entity, branch continuity, nguồn xe hỏng/ra khỏi màn không nhân đồ |

Mỗi P cần fixture seed cố định để chơi thử, simulation nhiều seed/loại xe, bốn gate lint/typecheck/test/build và manual input/hậu quả/restart. Báo cáo rõ phần đã chạy và chưa kiểm tra. Gate tuning P8 đánh giá lại curve và economy sau khi có các cơ chế này; không tăng ngầm sức ép ở lượt cập nhật P5 này.

## Đề xuất tự review thiết kế (chưa áp dụng cân bằng)

Vật phẩm có thể làm game vốn đang dễ trở nên dễ hơn: đo tỷ lệ sống, thời gian dưới ngưỡng xăng, số event né bằng món và tiền ròng/phút theo từng khoảng quãng đường, so với baseline không món trên cùng seed. Grab có nguy cơ biến thành nguồn tiền tự nuôi; thử chi phí/lượt so với phần thưởng tăng thêm thực nhận, không chỉ tiền lý thuyết. Chướng ngại ngang/đồ rơi tăng tải đọc cảnh; thử riêng từng loại trước phối hợp. Các nhận định này là dự đoán từ thiết kế, chưa phải kết quả playtest tính năng mới.

## Trạng thái triển khai sau P5.1
P5.1 đã có bản thử với mặc định kích hoạt nitro kèm nhảy và giá/nguồn shop TẠM ở GAME_DESIGN.md/BALANCE_CONFIG.md. Các dòng “chưa có” phía trên mô tả thời điểm lập kế hoạch; P5.2/P6 vẫn chưa làm. Star với event thật vẫn cần gate P6. Chi tiết kiểm tra: [PROTOTYPE_5_1_REVIEW.md](PROTOTYPE_5_1_REVIEW.md).


## Sửa điều khiển nitro theo chủ dự án — Space nhảy
Thay luật tự nhảy của P5.1 đầu: dùng nitro bằng phím ô 1/2 chỉ boost tốc độ trong thời lượng hiện có (TẠM 4 s). Nhấn Space riêng khi nitro đang hiệu lực và xe đang ở mặt đường để nhảy. Không tiêu thêm món/không reset thời lượng boost; giữ Space không tự nhảy lặp. Sau hạ cánh có thể nhấn Space lại nếu boost còn. Không nhảy khi pause/ngã/kết ván/hết xăng/coasting hoặc không có nitro; star riêng không cho nhảy. Cú nhảy đã bắt đầu vẫn đáp bình thường nếu boost hết giữa không trung. Không đổi giá/thời lượng, không chỉnh layout/art; UX/UI hoàn chỉnh để P tương ứng. Kết quả: [NITRO_SPACE_REVIEW.md](NITRO_SPACE_REVIEW.md).


## P5.2 — bản thử Grab và khách đặc biệt
Đã triển khai gói Grab trong kho hai ô 1/2. Số thử TẠM: giá 240, 3 lượt/gói, một gói mỗi shop, cooldown gọi 2 s; món giữ nguyên ô cho tới khi hết lượt, không tự dồn ô. Một lượt tạo một NPC Grab phía trước khoảng 45–120 m (tối thiểu cửa sổ phản ứng theo tốc độ), có dấu primitive và nhãn Grab. Không tìm được pocket an toàn/đủ xa, đang có khách Grab còn chờ hoặc chưa chọn nhánh giao lộ thì không trừ lượt. Không tự thêm khách hoặc thưởng tiền khi gọi; phải lái tới và nhấn F. Bỏ lỡ khách mất cơ hội, không hoàn lại lượt hay nhân khách sang nhánh khác.
Khách Grab giữ ID/type qua F/G, đổi hoặc mua xe và tai nạn. Khách quay lại tiếp tục có thưởng đúng một lần; khách rời đi không còn cộng thưởng, giữ luật từ chối đón lại sau tai nạn. Tối đa/capacity/quá tải/cruise và điểm số vẫn như khách thường. Thưởng tiền mỗi khách Grab TẠM ×10 phần riderMoneyPerMeter (0,10/m thay 0,01/m), không nhân thu nhập nền 0,50/m hoặc toàn bộ ví. Registry chỉ giữ ID khách còn liên quan trên xe/đang quay lại; type của người ngoài đường nằm trên entity. Restart xóa mọi dữ liệu ván.
Nguồn chờ giữ vị trí đã kiểm tra để không đi vào hazard; chỉ reserve pocket đón của khách đang chờ khi sinh hazard mới, vẫn tiêu RNG draw trước khi từ chối hazard đè pocket. Không xóa hazard đã có, không clear toàn bộ đường, không cho pickup tự động. Grab chưa khóa cân bằng: gói có chi phí cơ hội so với mua xe và tích nhiều khách trên bus có thể rất lời. UI/art vẫn placeholder; hoàn thiện ở P tương ứng. Xem [PROTOTYPE_5_2_REVIEW.md](PROTOTYPE_5_2_REVIEW.md).


## Grab chờ ở ven đường — cập nhật theo chủ dự án
Khách Grab được gọi chỉ xuất hiện ngẫu nhiên ở hai mép ngoài mặt đường, không ở tâm hay trong lane. Bên ưu tiên lấy từ seed/branch/sequence riêng, không ưu tiên gần xe và không tiêu hazard RNG. Nếu bên đó không an toàn thì thử bên kia; cả hai không hợp lệ thì giữ lượt. Vị trí đứng tính từ nửa bề rộng đường + nửa collider NPC; kiểm tra đường tiếp cận và hazard theo vị trí xe có thể chạy sát lề, không lấy tâm NPC ngoài đường làm tâm xe. Tầm F giữ nguyên; có test đón cho cả 8 loại xe. Không đổi giá/thưởng/lượt hay layout/art. Xem [GRAB_ROADSIDE_REVIEW.md](GRAB_ROADSIDE_REVIEW.md).


## P6 — event và chuối đã có bản thử
Chuối vào hai ô 1/2, bán 80 TẠM, một món/shop. Chỉ tiêu một món để vô hiệu một công an/dân phòng trong cửa sổ cảnh báo; ngoài tầm, pause, ngã hoặc kết ván không mất món. Star vẫn bị phạt/tịch thu, tai nạn hỏng xe và tàu kết ván. Tàu có collider sweep, phanh S dừng chờ hoặc boost rồi Space; nitro không tự nhảy. Kẹt hai lane gây ngã; xe chết máy sinh một NPC cần F và TẠM 25% chuối nếu ô trống. P6.1–3 chướng ngại mở rộng và P7 secret vẫn để bước sau. Hình/cue primitive, UI/art và SFX/VFX đầy đủ giữ đúng phase. Chi tiết luật triển khai trong GAME_DESIGN.md, số ở BALANCE_CONFIG.md; kết quả [PROTOTYPE_6_REVIEW.md](PROTOTYPE_6_REVIEW.md).


## P6.1: sửa chuối và hazard chuyển động theo chủ dự án
Tàu và từng officer có chuyển động/hitbox ngang thật. **ĐÃ CHỐT:** một chuối vô hiệu toàn bộ nhóm mục tiêu; nhóm hai officer thì cả hai đứng yên và vô hại khi người chơi chạm, chỉ tiêu một món. Giữ NPC tại vị trí hiện tại, không consumed/xóa cả event như P6; không tác động nhóm khác. Traffic có thể va hazard và va nhau gây HP giảm/hỏng/tai nạn, không tự biến xác thường thành collider secret. Toàn bộ chi tiết và gate ván tích hợp: [DESIGN_MOVING_EVENTS_TRAFFIC.md](DESIGN_MOVING_EVENTS_TRAFFIC.md). Chưa sửa runtime.


## P6.1 — bản thử tình huống trước tích hợp (18/10/2026)
Theo yêu cầu mới nhất của chủ dự án: triển khai và duyệt các tình huống riêng trước; chỉ làm bản tích hợp khi chủ dự án đồng ý. Đã có 15 fixture DEV tại http://127.0.0.1:5173/p61.html, version `p61-scenarios-1`: tàu ngang hữu hạn, officer 1/2 người, chuối vô hiệu cả nhóm, traffic va nhau/hazard, rào, hàng rong và cứu thương. Chỉ fixture bật experimentalMotion/experimentalTraffic; director ván thường chưa dùng các cơ chế này. Đây chưa phải hoàn thành toàn bộ P6.1.
Các số mới đều TẠM: tàu dài ngang 24 m, sâu 2,8 m, tốc độ ngang 6 m/s; NPC rộng/sâu 0,65 m, chạy ngang 4,5 m/s trong ±4,35 m; rào rộng 6,2 m/sâu 1,4 m, damage traffic 20 một lần; hàng rong ngang 2,2 m/s; cứu thương dọc 16 m/s. Không đổi giá, thu nhập, fuel hay mật độ ván thường. Báo cáo và giới hạn tích hợp: [PROTOTYPE_6_1_SCENARIOS_REVIEW.md](PROTOTYPE_6_1_SCENARIOS_REVIEW.md). P8 tuning độ khó/economy, P9 UI/art, P10 SFX/VFX giữ nguyên.
