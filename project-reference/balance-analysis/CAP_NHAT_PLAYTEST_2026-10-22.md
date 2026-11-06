# Cân bằng P8 sau chơi thử — 22/10/2026

## Phạm vi và nguồn

Đây là đề xuất để Codex triển khai sau khi chủ dự án xác nhận, chưa sửa repo, chưa merge. Ưu tiên yêu cầu mới trong tài liệu này khi khác với đề xuất ngày 21/10. Giữ mechanic, lực, điều khiển và QTE hiện hành; chỉnh số và cách cấu thành pattern từ mechanic sẵn có. Việc thay director/validator để thực hiện số mới là công việc implementation cần thiết, không phải thêm mechanic.

Đã đọc trực tiếp GitHub nhánh `codex/p8-balance-pass`, commit `5b0e296842d2375eff43882623faf3fe33f302e9`, commit ngày 22/10/2026 21:30:37 giờ Việt Nam, thông điệp `Tune P8 hazard density and seeded pattern coverage`.

- [Review P8 tại revision kiểm tra](https://github.com/hole1981998-gif/Start-Homecoming/blob/5b0e296842d2375eff43882623faf3fe33f302e9/docs/P8_BALANCE_TRIAL_REVIEW.md)
- [Config](https://github.com/hole1981998-gif/Start-Homecoming/blob/5b0e296842d2375eff43882623faf3fe33f302e9/src/config.ts)
- [Director](https://github.com/hole1981998-gif/Start-Homecoming/blob/5b0e296842d2375eff43882623faf3fe33f302e9/src/balance-director.ts)
- [Generator và traffic](https://github.com/hole1981998-gif/Start-Homecoming/blob/5b0e296842d2375eff43882623faf3fe33f302e9/src/world.ts)
- [Bot simulation](https://github.com/hole1981998-gif/Start-Homecoming/blob/5b0e296842d2375eff43882623faf3fe33f302e9/tests/balance-simulation.test.ts)

Không đọc lại toàn bộ prototype cũ. Số simulation dưới đây lấy từ review đã commit, không phải simulation mới do chat này chạy. Người chơi báo ván có thể kéo dài 10–20 phút; đây là dữ liệu chơi thử tự báo, phù hợp với kết luận balance vẫn dễ, nhưng không tự biến thành thống kê median.

## Kết luận kiểm tra

1. Lịch gốc vẫn gap 80→70 m. Ở 14 m/s, khoảng cách tâm slot tương đương 5,71→5 giây; 24 m/s vẫn là 3,33→2,92 giây. Chiều dài patch và lớp phụ làm khoảng trống thực khác các số này, nhưng cấu trúc lịch vẫn giải thích được đoạn rỗng 4–5 giây.
2. Sau hai nhóm nặng, generator có thể bỏ slot khi khoảng từ cuối nhóm trước chưa đạt `max(45 m, vehicle.maxSpeed * 3)`. Với car4 là 72 m: mục tiêu nghỉ ít nhất 3 giây theo tốc độ tối đa trái trực tiếp yêu cầu nhịp mới dưới 2 giây. Shop/giao lộ/special tiếp tục làm mất slot; không thể khắc phục chỉ bằng tăng trọng số nước.
3. Sau 850 m, nhóm sinh thực tế vẫn 23,9% đơn / 56,8% cặp / 19,3% ba. Phần lớn cặp kiểm còn một lane trống; lane sạch có thể giải bài mà không trả giá. Đếm đủ 12 ID chưa chứng minh có 12 lựa chọn thú vị.
4. Nước đã tăng nhưng trung bình mới 17,75 patch/3 km; patch rộng ≥5,7 m và dài ≥20 m chỉ 3,19/3 km. Ở 14 m/s tương đương khoảng một patch nước mỗi 12 giây nếu phân bố đều. Đây chỉ là quy đổi mật độ, không phải nhịp encounter đo được.
5. Review 300 seed/profile: median thận trọng 483 s, trung bình 525 s, nhanh 325 s. Nhóm trung bình còn 70/300 lượt chưa kết ván ở trần 720 s. Mục tiêu 225–255 s chưa đạt. Bộ test hiện chủ yếu xác nhận chạy được và có mua xe, không buộc median phải đạt.
6. Mẫu bốn xe bổ sung là car4/car7/buýt/container; còn thiếu mô tô trong bộ kiểm xe trọng tâm. Phải bổ sung xe máy/mô tô/car4/car7, không dùng kết quả xe giải trí để thay thế.
7. Traffic có tốc độ khác nhau và chịu tác động nước/ổ gà; tuy nhiên generator phần lớn đặt xe vào lane còn trống, các lớp traffic thường đặt cùng chiều theo lane. Có mechanic collision không đảm bảo xe được đặt vào quỹ đạo có thể gặp nhau. Chưa có số đo collision traffic↔traffic/obstacle trong review để kết luận tần suất thực.

## Mục tiêu mới và cách hiểu

- Giữ giao dịch car4 chủ động khoảng 20–24 s ở cruise; không thay economy mở đầu. W mua nhanh hơn là vấn đề đã ghi nhận, chưa được yêu cầu sửa ở vòng này.
- Giữ median người chơi trung bình 4 phút: dải thử 225–255 s thời gian chơi chủ động; không tính menu/shop/pause. Báo thêm thời gian thực và quãng đường, tránh dùng đứng phanh làm sai kết luận.
- Dùng đoạn cuối của balance hôm nay làm mức sàn tham chiếu, rồi tăng chất lượng tổ hợp và nhịp liên tục. Không sao chép nguyên đoạn cuối vì chính nó vẫn thưa; không nhân tất cả sát thương lên cùng một hệ số.
- Sau shop đầu và trở lại điều khiển bình thường: khoảng trống xử lý giữa các encounter kế tiếp phải dưới 2 s. Đích 0,8–1,6 s, P95 ≤1,8 s, không khoảng >2 s không có lý do được log. Ngoại lệ chỉ gồm pause/shop, đang ngã/mất quyền điều khiển, chờ tàu và đoạn QTE thực sự chiếm nhiệm vụ điều khiển. Không coi cả vùng 120 m quanh giao lộ là ngoại lệ.
- Khoảng trống xử lý là từ lúc vừa giải xong tình huống trước đến khi cần quyết định cho tình huống tiếp theo. Đo thêm khoảng giữa các cửa sổ quyết định và giữa các vùng tiếp xúc; không đánh tráo bằng số object/cue đang hiện.
- Giữ cảnh báo tối thiểu 3,5 s theo tốc độ tiếp cận thực. Nhiều cue có thể chồng thời gian. Nhịp quyết định <2 s không có nghĩa người chơi chỉ được báo trước <2 s.
- Tham chiếu “2/3 siêu khó” cũ chỉ còn là giới hạn cảm giác áp lực cao trào có tuyến sống, không dùng tỷ lệ chết của stress bất công làm mục tiêu. Không gọi proposal này đã đạt 2/3 khi chưa có phép đo so sánh cùng điều kiện.

## Bảng candidate A — nhịp, nước, traffic

Các số cột sau là điểm khởi đầu thử, không phải số đã nghiệm thu.

| Hạng mục | Git hiện tại | Candidate A |
|---|---|---|
| Slot gốc | 80→70 m trong 3 km | Bỏ làm đồng hồ duy nhất; lên lịch theo thời gian gặp dự kiến, đổi sang mét theo tốc độ tham chiếu và relative speed |
| Nhịp encounter sau shop đầu | Chưa có gate <2 s | 1,4–1,8 s ở sàn; 1,0–1,5 s sau 90 s; 0,8–1,3 s sau 180 s; tránh nhiệm vụ lái bất khả thi |
| Nhóm đơn/cặp/ba cuối game | 23,9/56,8/19,3% sau reject | Từ sau shop đầu: 0/65/35%; từ 90 s: 0/45/55%. Đo sau reject; ghép lớp tối đa ba trước khi thử phức tạp hơn |
| Nhịp nghỉ sau hai nhóm nặng | ≥45 m hoặc 3 s ở max speed | 0,8–1,5 s; giảm số lựa chọn/hướng đổi lane trong nhịp nhẹ, không bỏ sạch slot |
| Nhóm có nước | Chưa đo theo nhóm | 65–75% ở sàn; 75–85% ở đoạn khó; không tăng riêng xác suất nước đến mức traffic biến mất |
| Phần đường có nước ở ít nhất một lane | Chưa đo | 40–55% quãng đường ở sàn; 55–70% đoạn khó; đo hợp nhất diện tích/đoạn chồng, không cộng trùng patch |
| Ngập hai lane mép, để giữa | Có khả năng qua pattern | 15–20% nhóm nước; giữa có traffic đi qua theo phase, không đóng giữa vĩnh viễn |
| Chiều dài dải nước chính | Ưu tiên 24 m, có 30 m toàn bề ngang | 24–45 m ở sàn, 30–60 m đoạn khó; ưu tiên một/hai lane. Full-width không phải mặc định |
| Traffic hiện diện trong tổ hợp | RNG loại/lớp, chưa gate encounter | 55–65% nhóm ở sàn; 65–75% đoạn khó; thường 2 xe, một số nhóm 3 xe có quỹ đạo khác nhau |
| Nhóm có giao cắt/tương tác traffic thật | Không có số đo | Candidate 20–30% nhóm traffic có cơ hội tương tác; đo collision thật riêng, không bắt mọi cơ hội phải tông |
| Dân phòng | 100 | Phạt cố định 500/lần bắt, lấy tối đa tiền đang có, không âm; không cộng thêm tịch thu xe |
| Damage, lực, grip, QTE | P8 hiện tại | Giữ vòng A để tách nguyên nhân |
| Tiền đầu/khách đầu/shop đầu/giá car4 | 280/60 m/280 m/300 | Giữ |
| Xăng traffic | Bật | Giữ khi thử A; so ON/OFF riêng, chưa quyết định tắt |

Đổi cách lên lịch cần sửa validator hiện đang buộc `gap/maxSpeed >= 3,5 s`: đây là ràng buộc giãn slot, không phải bằng chứng cảnh báo đúng. Thay bằng kiểm lookahead/lead cho từng encounter và kiểm quỹ đạo giữa các nhóm. Không đơn thuần bỏ validator rồi đặt gap 20 m.

Không ép <2 s bằng phát sinh thêm hazard khi người chơi phanh tại một chỗ; không spawn sau lưng hoặc ngay sát xe. Đo khi tiến về phía trước, giữ lịch seeded ổn định, không reroll để trừng phạt lựa chọn. Khi tăng tốc/nitro, bảo toàn thời gian cảnh báo; khi giảm tốc, pattern nối tiếp phải vẫn có ý nghĩa mà không chặn khả năng dừng hợp lệ.

## Catalog pattern nước và đánh đổi

Bỏ đặt hazard độc lập ngẫu nhiên khỏi luồng chính sau shop đầu. Giữ RNG nhẹ bằng chọn template có trọng số, mirror trái/phải, phase và chiều dài trong biên đã kiểm. Không bỏ seed và không bỏ mọi biến thiên. Pattern lỗi phải được thay bằng template hợp lệ nhẹ hơn có hai lớp, hoặc dời có bù nhịp; không âm thầm rơi về single/rỗng.

| ID | Bố cục dùng mechanic sẵn có | Lựa chọn cần tạo |
|---|---|---|
| W01 | Nước dài trái, rồi phải, overlap ngắn; traffic lệch phase | Theo lane khô cần hai lần đổi hướng, cắt qua nước tốn xăng nhưng ít lái |
| W02 | Hai dải mép ngập, traffic cùng chiều ở giữa | Chờ/phanh lấy khe giữa, hoặc vượt qua nước |
| W03 | Hai lane liền ngập, lane khô có xe chậm | Theo xe mất tốc độ hoặc vượt qua vùng ngập |
| W04 | Nước một lane, ổ gà lane khác, traffic lane còn lại có khe | Đổi thời điểm qua khe hoặc trả xăng; không ép trả HP khi không đủ HP |
| W05 | Nước bắt đầu trước traffic chậm và kết thúc sau nó | Theo đuôi an toàn, vượt trong nước; tránh làn khô cố định giải cả cụm |
| W06 | Gió đẩy về lane ngập, traffic chắn một phần phía ngược | Giữ lái lâu hoặc đổi lane trước; gió vẫn countersteer được |
| W07 | Rào và nước lệch chiều dài, khe thông lần lượt đổi bên | Lái sớm qua khe hoặc lấy đường nước ngắn hơn; không buộc container lách khe nhỏ hơn footprint |
| W08 | Hàng rong băng qua đầu vũng, khe khô mở theo phase | Nhường đường/phanh hoặc đổi hướng qua nước; không đặt NPC không có cue |
| W09 | Xe tải thả đồ phía trước, nước che lane tránh thuận tay | Phanh chờ vật rơi, chuyển lane nhiều hơn hoặc dùng nước; vật rơi phải thật sự được release |
| W10 | Tiếp tế ở mép nước, lane khô có traffic | Lấy xăng phải trả một phần xăng/đổi vị trí, hoặc bỏ pickup giữ tuyến thuận lợi |
| W11 | Dân phòng ở phần khô, nước cho đường vòng có thể đọc | Chấp nhận xăng hoặc căn thời điểm; chạm dân phòng phạt 500, không bắt mọi đường đều bị bắt |
| W12 | Đoạn nước ngắt quãng nối tiếp với xe hai tốc độ cùng chiều | Chọn thời điểm vượt, không chỉ giữ một lane qua tất cả |
| W13 | Traffic đối đầu ở hai lane khác nhau, mép nước lệch nhau | Đi theo cửa sổ thời gian; không cho xe đối đầu spawn trong vùng báo thiếu lead |
| W14 | Nước trước khu chờ tàu, sau tàu lane khô thay bên | Chọn nơi chờ và chuẩn bị thoát; luôn có cách chờ không mất hết xăng, không bắt buộc nitro |

Từng template cần ít nhất một tuyến tránh va chạm cứng với xe hiện hành. Ưu tiên hai phương án: một ít xăng nhưng cần lái/thời điểm chính xác hơn, một dễ lái hơn nhưng tốn xăng. Không bắt hai phương án ngang giá; chúng phải khác nhau có ý nghĩa. Nếu “lane sạch + giữ nguyên hướng” luôn tốt nhất thì template chưa đạt. Không ép mất HP ở mọi nhóm để rút ngắn ván.

Tránh lặp ID trong ba nhóm liên tiếp; tránh để cùng một lane là lời giải khô đơn giản quá ba nhóm. Cho phép chạy nước có chủ đích nếu ngân sách đủ. Các điều kiện này phải kiểm sau mirror/phase/reject, không chỉ ở lịch yêu cầu.

## Làm traffic tương tác thực sự

Tạo các bố cục sau bằng traffic/va chạm hiện có: xe nhanh phía sau xe chậm cùng lane; xe dẫn đầu vào nước chậm đi, xe sau tiếp cận; xe đi tới rào/vật cản đúng quỹ đạo; xe qua ổ gà rồi bị dòng xe sau bắt kịp; traffic chạy trên các dải nước W02/W03/W05. Không thêm AI đổi lane hoặc mechanic đâm xe mới.

Tính thời gian bắt kịp từ khoảng cách đầu–đuôi và chênh lệch tốc độ. Ví dụ xe sau 10 m/s, xe trước 6 m/s, khe thân 12 m → khoảng 3 s để bắt kịp trước các tác động khác. Đặt cuộc gặp trong tầm nhìn và trước khi xe bị retire; không chỉ chọn hai model khác nhau rồi coi là có tương tác. Va chạm phải chạy qua hệ damage/force sẵn có, không dựng animation nổ thay thế.

Đích kiểm ban đầu: trong ≥80% lượt sống qua phút 2, có ít nhất một traffic↔traffic và một traffic↔obstacle collision diễn ra trong vùng người chơi có thể nhìn/cảnh báo. Đây là target thử, chưa biết có phù hợp giới hạn vật lý/hiệu năng. Đo thêm số tương tác/phút và số tiếp diễn làm mất tuyến thoát. Không tăng lực để đạt chỉ tiêu. Nếu tỷ lệ collision quá thấp, sửa hình học/phase/chênh tốc trước khi tăng số xe.

## Xăng và economy: kiểm số trước khi tăng nước

Car4 hiện 10 L, tiêu hao 0,0055 L/m, pickup 3,6 L/480 m, nước 0,8 L/s. Một pickup mỗi 480 m tương đương 7,5 L/km nếu nhặt hết, cao hơn tiêu hao đường khô 5,5 L/km. Ở 14 m/s, mỗi phút đường khô tốn khoảng 4,62 L, pickup tối đa theo lịch bù 6,3 L; dư khoảng 1,68 L/phút trước nước/shop/load. Đây là phép tính đường đều lý tưởng, không phải kết quả bot.

Một vũng 30 m đi ở 14 m/s gây khoảng 1,71 L phí nước, chưa tính chiều dài thân xe, tốc độ thay đổi và các hệ số tải. Đi chậm trong nước có thể tốn nhiều hơn. Do đó không thể tăng độ phủ nước rồi đồng thời giảm pickup mạnh mà không đo thời gian thực ngâm nước.

Vòng A giữ các pickup/shop/HP hiện có, tăng áp lực bằng pattern. Nếu đủ nhịp và lựa chọn mà median vẫn >255 s, thử B chỉ đổi fuel gap 480→520 m và pickup car4 3,6→3,0 L, car7 4,2→3,6 L, mô tô 3,4→3,0 L, xe máy 3→2,6 L; các số này là candidate phụ, không áp cùng lúc mù quáng. Cần sửa validator fuelInterval hiện giới hạn 500 m nếu dùng 520 m. Giữ HP/damage vòng B đầu để xác định nguyên nhân. Không cân xe giải trí bằng cách làm yếu đồng loạt xe trọng tâm.

Không đổi tiền khách ở vòng A: car4 một khách ở 14 m/s tạo khoảng 184,8 tiền/phút gồm nền; ba khách khoảng 520,8 tiền/phút trước tải làm giảm tốc. Phạt dân phòng 500 vì thế nặng hơn rất nhiều với ít khách. Phải log số tiền mất thực tế (bị chặn bởi ví), không ghi mọi lần đều mất 500. Không tăng cảnh sát 300 theo dân phòng khi chưa được yêu cầu.

Xăng traffic ON/OFF: so cùng seed/lịch/input, đo xe đang chạy trong tầm nhìn, collision/phút, xe hết xăng trước khi đến vùng chơi, CPU và tỷ lệ tuyến bị kẹt. ON hợp lý về continuity nhưng có thể làm xe dừng; OFF có thể giữ traffic sống động lâu hơn nhưng đổi vòng đời hiện có. Chưa có số đo để khẳng định OFF tốt hơn. Báo bảng hai phương án rồi chủ dự án quyết định, như yêu cầu trước.

## Đo và điều kiện nghiệm thu

1. Kiểm 300–1000 seed, đủ xe máy/mô tô/car4/car7, tối thiểu ba profile. Bắt đầu 30 seed để tìm lỗi, sau đó mở rộng theo từng batch để tránh timeout. Không cấp xe/tiền/item miễn phí cho bài economy; bài khởi đầu từng xe phải ghi rõ chỉ khảo sát hazard.
2. Log theo seed: planned/spawned/encountered/rejected và lý do; các mốc quyết định; khoảng rỗng; diện tích/chiều dài nước hợp nhất; thời gian thực ngâm nước; NPC/traffic collision theo cặp; cargo source/released/encountered riêng; nhiên liệu/HP vào/ra theo từng nguồn; tiền khách/base/shop/phạt; số lane change và tuyến khả thi.
3. Bot hiện biết chính xác vị trí, còn dự đoán cross-motion; phản ứng 0,7 s không làm nó tương đương người trung bình. Giữ bot này như đối chứng kỹ thuật, thêm profile giới hạn thông tin theo cue thật và lỗi thao tác có seed. Không chỉnh bot ngu hơn chỉ để median đẹp. So cùng bot trước/sau.
4. Báo terminal và censored riêng, đường cong sống sót, median/Q25/Q75, còn sống ở 4/6/8/12 phút, nguyên nhân kết ván. Nếu >50% còn sống ở cap thì ghi median chưa đo được. Không lấy riêng lượt chết để tính median.
5. Gate nhịp: từ sau shop đầu, các khoảng >2 s khi đang tiến phải được phân loại; không có khoảng rỗng do reject bị bỏ qua. Gate fairness kiểm quỹ đạo theo thời gian, tốc độ/đổi lane/footprint và tail sweep; lane trống một frame không đủ. Không chồng train/police thành tình huống bắt buộc kết ván.
6. Gate lựa chọn: ghi tuyến “giữ lane sạch” xuyên nhóm; kiểm xem template có ít nhất hai hành động khả thi khi ngân sách cho phép. Với tài nguyên thấp vẫn phải có đường sống hợp lý, không dựa vào item chưa được cấp. Kiểm trữ lượng sau chuỗi nước, không chỉ từng patch độc lập cộng dự phòng 0,5 L.
7. Người thật: 12–20 người kỹ năng trung bình, 2 ván làm quen rồi tối thiểu 3 ván/người; báo median toàn mẫu và median theo người, thời gian chủ động và thời gian thực, phiên bản/seed/xe. Đích 225–255 s; báo khoảng bất định. Người chơi giỏi có thể sống lâu hơn 4 phút, nhưng tỷ lệ 10–20 phút cần giảm rõ và không do exploit lane an toàn hay tiếp tế vô hạn.
8. Shop đầu, QTE, va chạm lực, ngã/đứng dậy, restart phải kiểm lại trong browser; tests pass không thay thế được kiểm visual/cue.

## Thứ tự triển khai và A/B

- A: thay lịch encounter, bỏ random single sau onboarding, sửa nhịp nghỉ, thêm catalog nước/traffic và dân phòng 500. Giữ tài nguyên/damage/physics/economy để xác định tác động.
- So A với commit nguồn bằng cùng seed/profile và playtest. Nếu median còn dài, kiểm trước tiên nhóm rỗng, lane giải đơn giản, collision không xảy ra, bot mua/hồi tài nguyên; không nhảy thẳng sang tăng damage.
- B: chỉ sau khi A đạt nhịp/fairness, thử mức xăng nêu trên nếu còn dư. Nếu A quá ngắn (<210 s ở người trung bình), giảm thời gian ngâm nước/chuỗi nhóm ba trước khi nới lại nhịp thành 4–5 s.
- Xăng traffic ON/OFF là thí nghiệm độc lập, không trộn vào A/B tài nguyên. Chỉ chốt sau khi có số liệu và chủ dự án chọn.

Không nghiệm thu dựa trên “đã đủ pattern ID”, “bot có chết”, hay lint/build pass. Kết quả cần chứng minh nhịp dưới 2 s, nhiều nước nhìn thấy được, traffic có tương tác trong vùng chơi, và median người thật gần 4 phút. Chưa có phép chạy mới trong báo cáo này.
