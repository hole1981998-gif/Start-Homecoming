# Đường Về Nhà — Roadmap

Roadmap là kế hoạch đề xuất, không phải báo cáo đã triển khai. Không có mốc thời gian cam kết. Mỗi feature dùng một branch và PR riêng theo AGENTS.md; milestone có thể gồm nhiều PR nhỏ. Tất cả số trong BALANCE_CONFIG.md cần playtest.

| Mốc | Phạm vi | Điều kiện nghiệm thu |
|---|---|---|
| 0 — Nền dự án | Vite, TS strict, Three.js, lint/typecheck/test/build, config schema, CI | Clean checkout cài được theo lockfile; cả 4 check có kết quả thật; canvas 9:16 |
| 1 — Lái xe | Low-poly bằng code, đường 3 lane, WASD liên tục, cruise riêng từng loại xe và hồi tốc khi thả W/S, camera, pause/focus | Không khóa lane; giữ W/S duy trì nhanh/chậm; thả tự hồi từ cả hai phía không giật/dao động; không lùi; resize không méo; mở tab khác không làm chết xe |
| 2 — Vòng sinh tồn | Xăng/HP riêng, coasting chung, chướng ngại cơ bản, score/money theo distance, HUD, restart | Điểm không tăng khi pause; hết tài nguyên kết ván đúng; restart không rò trạng thái |
| 2.1 — HUD và nhịp chơi (bổ sung đề xuất) | Overlay, resource gần xe, graphic cue, mốc ven đường primitive; thử mật độ tách vòng | Không che đường, không cruise HUD; so sánh baseline và giữ mục tiêu economy |
| 3A — Traffic/hazard (chia nhỏ P3) | Hướng theo làn, size/chiều dài hazard, director khả thi | Relative speed warning, sweep, không spawn bẫy; chưa có lối giải thì không chặn kín |
| 3B — Tuyến endless | Chunk/pooling, giao lộ Q/E và QTE, camera rẽ, difficulty theo distance, RNG seeded | Đi thẳng/rẽ/bỏ lỡ đều đúng; xe dài có lối khả thi; seed tái hiện được |
| 4 — Người và xe | F đón khách, G cho một khách xuống ngay, capacity có tài xế, cruise giảm theo số khách với mức giảm/sàn riêng từng xe, quá tải, Tab đổi nhanh xe, đủ loại xe, kho 2 xe, tự thay | Thêm khách giảm cruise kể cả chưa quá tải; đạt sàn đúng từng xe/context; bỏ khách/đổi xe tính lại không giật tốc độ; mua xe thứ ba nguyên tử; đổi xe giữ khách; upgrade riêng không mất/nhân đôi |
| 4.1 — Traffic có HP và tương tác thế giới | Mở rộng traffic thành đủ loại xe tương ứng danh mục người chơi; HP/sức chịu va chạm/damage theo loại; xe lớn phá xe yếu; traffic chịu nước/ổ gà ở phần tài nguyên áp dụng được | Mỗi loại có silhouette/footprint và hậu quả va chạm đọc được; HP thay đổi đúng theo thời gian tiếp xúc, không hit lặp/farm; chi phí húc có ý nghĩa, không kích hoạt nhầm secret |
| 4.2 — Hành khách từ xe giao thông hỏng | Xe giao thông HP=0 để lại hành khách bên cạnh; người chơi có thể đón bằng F | Sinh khách đúng một lần, vị trí an toàn/tiếp cận được; không thưởng tự động; capacity/cruise/thu nhập cập nhật sau khi đón |
| 5 — Kinh tế ven đường | C shop, mua xe, nâng cấp xe hiện tại, xăng/sửa, R item, controlled loot | Hàng không reroll; tiền không âm; hủy giao dịch không mất tiền; tiếp tế khả thi |
| 6 — Nguy hiểm đặc biệt | Công an/dân phòng, kẹt xe, xe chết máy, tai nạn, tàu, Space nitro | Tiền phạt cố định; thiếu tiền đúng chính sách; tàu không xuyên collider; thay xe không chết dây chuyền |
| 7 — Kết ván đặc biệt | Chuỗi secret 4 bước, badge, kết quả và leaderboard local | Đúng chuỗi thì kết secret trước HP=0; sai thứ tự không kích hoạt; ghi điểm đúng một lần |
| 8 — Hoàn thiện | Mưa/ánh sáng/âm thanh đề xuất, accessibility, performance, cân bằng, hướng dẫn; kiểm tra tính liên tục của vùng cảnh quan bằng placeholder | Chơi đủ vòng trên các trình duyệt mục tiêu; số FPS có máy và cách đo; không che cảnh báo; rẽ không làm vùng cảnh quan đổi vị trí hoặc biến mất đột ngột |

| 9 — Art review và tích hợp cuối | Chỉ sau prototype gameplay và chỉ khi chủ dự án đồng ý rõ: review mood mưa bão trầm màu nhưng vui tươi; thiết kế cảnh quan thành phố, biển, hàng cây, vách núi/đồi, ruộng lúa... rồi tạo/hoàn thiện và ghép art | Có bảng điểm từng tiêu chí theo GAME_DESIGN.md; không tiêu chí nào dưới 6; điểm thấp đã sửa và chấm lại; vùng cảnh quan liền mạch qua giao lộ; được chủ dự án duyệt trước khi tạo/ghép art hoàn chỉnh |

Trong mốc 0–8, dùng placeholder tối giản để giữ cảnh và UI rõ; không bắt đầu asset production-grade sớm. Có thể làm thay đổi placeholder phục vụ đọc gameplay mà không cần chờ art approval. Mốc 9 là một gate riêng; không tự xem việc yêu cầu làm prototype là đồng ý tạo hay tích hợp art hoàn chỉnh.

**Cảnh quan theo tuyến — ĐÃ CHỐT về hướng visual, CHƯA TRIỂN KHAI:** hai bên đường về sau có các vùng như thành phố, biển, hàng cây, vách núi/đồi và ruộng lúa. Từ các prototype tiếp theo, chỉ biểu diễn vùng bằng các mảng màu phẳng phân biệt được, phân bố tái hiện theo seed để dễ thấy lỗi nối cảnh; chưa tạo địa hình hay asset art hoàn chỉnh. Vị trí vùng và ranh giới phải gắn với tọa độ thế giới/tuyến, không gắn lại theo camera hoặc nhánh vừa chọn. Khi xe rẽ, giữ mảng màu ở nhánh cũ và quanh giao lộ cho tới khi chúng ra khỏi vùng nhìn rồi mới tái sử dụng dữ liệu/render; cùng một seed và lựa chọn rẽ phải cho cùng bố cục. Kiểm tra cả rẽ trái, rẽ phải, đi thẳng và nhiều giao lộ liên tiếp, đặc biệt lúc camera xoay. Mốc 8 kiểm tra tổng thể; việc thiết kế hình ảnh chi tiết, chuyển tiếp địa hình và art cảnh quan dành cho mốc 9 theo gate duyệt cuối.

**Visual hành khách trên xe hộp kín — ĐÃ CHỐT, CHƯA TRIỂN KHAI:** lượt cập nhật hình ảnh xe sau này làm ô tô, xe buýt và container có đầu/hình mặt hành khách thò ra cửa sổ theo đúng số khách đang ngồi. Tài xế luôn ở trong cabin, không thò đầu ra ngoài và không được tính vào số đầu ở cửa sổ. Số/hàng ghế đang có khách phải khớp với roster sau đón, cho xuống, đổi xe và crash/reboard; giữ hình khối xe dễ nhận ra và không che đường. Làm placeholder đơn giản khi đến lượt cập nhật visual xe; art chi tiết vẫn thuộc mốc 9 và gate duyệt cuối.

Âm thanh placeholder và cue tối thiểu có thể làm trong prototype để kiểm tra nhịp độ/tín hiệu. Sản xuất nhạc và SFX hoàn chỉnh thực hiện cùng giai đoạn cuối sau khi chủ dự án đồng ý. Trước đó ưu tiên cue Web Audio đơn giản, volume controls và cue hình ảnh tương đương.

Onboarding và polish tương tác được làm bằng thứ tự: input intro có thể bỏ qua → card cơ chế/chướng ngại lần đầu trong safe window → graphic UI/VFX/SFX placeholder cho item/skill/event → caption vui tùy chọn với pool 3–4 câu mỗi nhóm; không giữ bảng log chữ khi lái. Kiểm tra không che hazard/QTE và không spam. Minh họa art hoàn chỉnh, voice hoặc SFX production chỉ ở giai đoạn cuối sau khi được chủ dự án duyệt.

Sau **mỗi vòng simulation/playtest**, ghi report rồi yêu cầu review theo hai vai: game designer đề xuất cân bằng dựa trên bằng chứng và hỏi ý kiến chủ dự án trước các thay đổi lớn; UI/UX designer đề xuất cải thiện luồng, độ rõ ràng và animation UI. Giai đoạn prototype giữ UI đơn giản, chỉ sửa những điểm gây khó hiểu/cản thao tác; animation polish để sau.

Khi UI prototype đã chạy và Product Design sẵn có, dùng audit để kiểm tra onboarding/flow qua screenshot có dẫn chứng; gameplay feel, điều khiển và balance vẫn cần playtest trực tiếp.

## Các PR gợi ý và phụ thuộc

**P1.2 ngày 17/10/2026:** đã áp dụng cruise xe máy 14 m/s và hồi từ cả hai phía; cập nhật simulation, config, Help/HUD và test. Bằng chứng simulation/playtest và tự review xem PROTOTYPE_1_2_REVIEW.md; vẫn chờ feedback chủ dự án để khóa cảm giác lái/các số tạm. Kiểm tra giảm cruise theo khách, quá tải, đổi xe, coasting và nitro sẽ mở rộng ở prototype có các hệ thống đó. Báo cáo P1 cũ giữ nguyên làm lịch sử cho luật cũ.

**Cập nhật P2:** chủ dự án đã nhận xét P1.2 ổn và cho chuyển P2. P2 kế thừa nền lái, bổ sung xăng/HP, coasting 25 m, chướng ngại một lane, nhặt tiếp tế, điểm/tiền, kết ván/restart và hướng dẫn an toàn. Trước đây thử 0,15 tiền/m; bản cân lại theo mục tiêu mới thử 0,50 tiền/m (xem ECONOMY_60_90_REVIEW.md). Xem PROTOTYPE_2_REVIEW.md cho kết quả thực và giới hạn; chưa gọi P3, shop hoặc hành khách hoàn thành. P2 ở nhánh local riêng từ P1.2 được chấp nhận để tiếp tục; không tự merge main khi chưa có remote/CI và các điều kiện còn thiếu.

**Mục tiêu economy đã chốt:** có cơ hội mua ô tô đầu tiên sau 1–1,5 phút gameplay hoạt động trong lượt đại diện. P2 bắt đầu kiểm tra quãng đường/thu nhập ở cruise, W, S; P4–P5 hoàn thiện kiểm tra cùng hành khách/shop/chi phí. Ghi median và phân bố thời gian/khả năng mua ở nhiều seed, không chỉ chọn một lượt max speed tốt nhất. Chưa tự thay giá/thu nhập lớn chỉ để đạt số mục tiêu.

Khởi tạo công cụ → movement → tài nguyên/score → collision → road director/QTE → passenger → vehicle inventory/replacement → shop/upgrades → items/nitro → police → train/accident → secret → leaderboard → polish. Có thể dùng event giả trong test để phát triển system trước khi có model, nhưng không gọi đó là gameplay đã hoàn thành. Không tích hợp PR phụ thuộc trước khi base PR merge hoặc rebase lại từ main mới.

## Quyết định cần xác nhận khi chơi thử

1. Công an thiếu tiền: mặc định đề xuất mất nửa xăng xe dự phòng; dân phòng lấy tới 0.
2. Secret yêu cầu giữ đúng xe 4 chỗ và đủ 3 khách; đổi xe/giảm khách reset.
3. Tab đổi nhanh xe khi có xe dự phòng; shop pause; S chỉ hãm, không lùi; hết xăng hết coast thử xe dự phòng.
4. Tiền/nâng cấp chỉ trong ván; leaderboard MVP cục bộ; không có vũ khí MVP.

Các mục trên đã có mặc định để triển khai prototype, không phải cớ dừng mọi công việc chờ xác nhận. Nếu thay đổi tác động lớn, cập nhật tài liệu và test trước PR.

## Ma trận chơi thử tối thiểu trước bản phát hành

- Xe nhỏ/ô tô/container: lái, phanh, rẽ cả hai phía, QTE bỏ lỡ, lane bị chặn.
- Không có xe dự phòng/có xe hợp lệ/có xe hết xăng hoặc HP=0: hỏng, tịch thu, coast hết.
- Không khách/thêm từng khách/đúng tải/quá tải; cruise giảm tới sàn theo từng loại xe, có xe chạm min và xe dừng trên min; đổi từ xe nhiều chỗ xuống xe nhỏ; cho khách xuống và đón lại; so sánh thu nhập ròng/phút với mục tiêu mua xe 1–1,5 phút.
- Đủ/thiếu tiền ở cả hai lực lượng; mua xe thứ ba rồi hủy; nâng cấp chỉ xe hiện tại.
- Có/không nitro; nhảy thiếu đà, qua tàu an toàn, chạm tàu, đâm tai nạn thường.
- Secret đủ chuỗi, sai thứ tự, reset giữa chuỗi và hai terminal event gần nhau.
- Restart nhiều lần, mất focus, resize, UI bàn phím, save hỏng và bảng điểm trùng.
- Nhiều seed ở đầu/giữa/cuối difficulty; ghi rõ đây là lấy mẫu, không khẳng định chứng minh mọi seed.

## Definition of Done

Implementation khớp phạm vi đã chốt; số tạm ở config; lint/typecheck/tests/build chạy và pass; manual gameplay liên quan có bằng chứng; lỗi còn lại và giới hạn được ghi trong PR; docs cập nhật; reviewer con người duyệt. Chưa đạt mục nào thì ghi rõ, không đánh dấu hoàn thành hoặc merge để né check.

## Feedback P2: kế hoạch kế tiếp

Đọc [DESIGN_UPDATE_IMMERSION_TRAFFIC.md](DESIGN_UPDATE_IMMERSION_TRAFFIC.md) trước P2.1. P2.0 giữ nguyên làm baseline. P2.1 ưu tiên UI và mốc tốc độ thị giác rồi thử gap 75/70 m từng vòng, chưa áp dụng số. P3A làm traffic trái ngược/phải cùng/giữa seeded và hazard nhiều size; P3B thêm QTE/tuyến và mẫu phủ kín có phương án hợp lệ. P4.1 chỉ sau P4 có xe người chơi khác nhau. Cân lợi ích húc với chi phí sửa/đổi xe ở P5; xe lớn không bất tử. Các mốc P5–P9 giữ tên; SFX/art hoàn chỉnh vẫn ở gate cuối.

## Trạng thái sau cập nhật HUD

Đã triển khai phần HUD của P2.1: chỉ số overlay, thanh xăng/HP sau xe, bỏ số cruise cả intro/Help, graphic marker hazard/tiếp tế, phản hồi hậu quả ngắn và nút icon. Chưa triển khai các phần còn lại của P2.1 (thử mật độ/trang trí mới), P3A/B, hoặc VFX/SFX hoàn chỉnh. Gameplay/economy kế thừa bản 0,50/m. Chi tiết bằng chứng và tự review: [HUD_REVIEW.md](HUD_REVIEW.md). Các mô tả “chưa triển khai HUD” bên trên là trạng thái tại thời điểm ghi chú ban đầu.

**Thử bố cục tài nguyên tiếp theo:** hai thanh ngang được thay bằng cung xăng trái/HP phải ôm quanh xe máy, vẫn hiện số và icon. Ảnh tham chiếu và yêu cầu popup/card hậu quả sau này ở [DESIGN_UPDATE_IMMERSION_TRAFFIC.md](DESIGN_UPDATE_IMMERSION_TRAFFIC.md). Bản thử và giới hạn kiểm tra: [ARC_HUD_REVIEW.md](ARC_HUD_REVIEW.md).

**P3A đang có bản thử:** xe trái ngược chiều, phải cùng chiều, giữa seeded; nước/ổ gà nhiều cỡ tới hai làn; cảnh báo xét tốc độ khép khoảng cách và director bỏ tổ hợp chặn cứng cả ba làn ở dải tốc độ hiện tại. Mật độ và economy giữ như P2. Kết quả simulation, giới hạn manual và phần P3B còn lại ở [PROTOTYPE_3A_REVIEW.md](PROTOTYPE_3A_REVIEW.md). Hai cung tài nguyên còn nhọn theo feedback; chỉnh vào lượt HUD sau.

**P4B sửa continuity khách sau crash:** đã chuyển số khách trên xe thành danh sách ID, quyết định từng khách theo seed/crash index, giữ NPC bị bỏ lại không thể đón và thêm nhịp ngã/đứng dậy. Ván chơi bình thường đổi seed khi restart; `?seed=` trong DEV và fixture va chạm ô tô dùng để tái hiện lỗi. Tỷ lệ và timing chờ đánh giá chơi thử, không khóa cân bằng.

**P4.1 bản thử:** traffic seeded có xe nhỏ/van/tải với HP, kích thước và sát thương khác nhau; chịu ổ gà theo thời gian và chậm trong nước. Xe lớn của người chơi có thể húc hỏng mục tiêu nhỏ và đi tiếp với chi phí HP; xác xe là placeholder ngắn hạn rồi thu hồi. `?scenario=traffic-ram&seed=17` là ca thử buýt húc xe nhỏ. P4.2 mới sinh hành khách từ xe giao thông hỏng. Số và mức tăng khó cần được review trong [PROTOTYPE_4_1_REVIEW.md](PROTOTYPE_4_1_REVIEW.md) trước khi khóa cân bằng.

**Mở rộng danh mục P4.1 — ĐÃ CÓ BẢN THỬ:** đã bổ sung xe máy, mô tô, ô tô 4/7 chỗ, ba gác, xe buýt, xe tải và container làm traffic, với HP, sát thương, footprint, tốc độ/trọng số sinh và placeholder riêng. Mọi loại xe người chơi được thêm về sau phải có traffic và luật húc tương ứng; catalog typecheck chặn thiếu loại. Xem [PROTOTYPE_4_1_TRAFFIC_ROSTER_REVIEW.md](PROTOTYPE_4_1_TRAFFIC_ROSTER_REVIEW.md) cho simulation/manual và rủi ro cân bằng; không coi số tạm là đã chốt. P4.2 khách từ xe hỏng vẫn chưa làm.

**Feedback tiếp sau P3A:** chủ dự án chấp nhận kỹ thuật P3A, thấy độ khó vẫn thấp và xăng dư; difficulty curve để đánh giá thêm. Vòng thử mới tăng hao xăng nhẹ, thêm nước/ổ gà dài và phủ ba làn có kiểm tra tài nguyên, ổ gà gây damage liên tục khi chạm, va xe hất tài xế xuống và tự quay lại trong trạng thái miễn nhiễm. Hành khách ngã/quay lại theo seed đã có luật simulation nhưng chưa có nhân vật hành khách chơi được tới P4. Xem [P3A_CRASH_REVIEW.md](P3A_CRASH_REVIEW.md) trước khi cân thêm density/difficulty hoặc vào P3B.

**Feedback xăng và ngã xe tiếp theo:** giảm bình xe máy, tăng hao xăng; xe bị đâm trôi giảm tốc tới 0 và tài xế văng xa hơn. P sau có thêm phương tiện phải tách dung tích và tiêu hao riêng cho từng loại xe, mô phỏng cân bằng fuel/economy riêng trước khi chấp nhận. Difficulty curve vẫn đánh giá sau, không tăng mật độ cùng vòng này. Xem [P3A_FUEL_SLIDE_REVIEW.md](P3A_FUEL_SLIDE_REVIEW.md).

**Feedback mới cho P4 trở đi:** giảm lượng hồi từ bình xăng/hộp sửa nhặt trên đường; hiện tại bình nhặt có thể đổ đầy xe máy và hộp sửa hồi hơn nửa HP, làm tài nguyên bớt căng thẳng. P4.1 cho xe giao thông nhiều loại/HP tương tác với chướng ngại môi trường; P4.2 cho hành khách xuất hiện bên cạnh xe giao thông khi HP về 0, rồi đón bằng F. P3A đang chơi chưa đổi. Khi triển khai, so sánh nhiều seed về tài nguyên, tỷ lệ chết, số khách phát sinh/được đón và thời gian mua xe đầu; gameplay review phải nêu đề xuất cải thiện cụ thể từ kết quả, không chỉ báo cáo số.

**P3B đang có bản thử:** giao lộ theo seed mỗi 800 m, Q/E chốt rẽ trong cửa sổ thời gian giảm dần theo quãng đường, đường thẳng đôi khi bị chắn, đường và camera ôm cua theo tuyến đã chọn. Mảnh đường và entity được tái dùng, khoảng hazard giảm dần 90→75 m trong khoảng 10 km; 60 m quanh giao lộ không sinh hazard để người chơi tập trung vào QTE. Xem [PROTOTYPE_3B_REVIEW.md](PROTOTYPE_3B_REVIEW.md) cho kết quả simulation, manual và giới hạn.

**Sửa tiếp nối trước P4B:** chướng ngại đường thẳng đã nhìn thấy không chuyển sang nhánh rẽ. Q/E tách entity cũ để giữ hình ảnh giao lộ và sinh riêng entity của nhánh chọn theo seed; nhánh cũ hết hiệu lực va chạm/nhặt và chỉ thu hồi khi lùi khỏi vùng nhìn. Xem [JUNCTION_BRANCH_HAZARD_REVIEW.md](JUNCTION_BRANCH_HAZARD_REVIEW.md) cho kết quả thực và giới hạn. Đây là sửa tính liên tục của P3B, không mở thêm cơ chế/economy P4B.

**P4 chia lát cắt review được:** P4A thử người chờ đi nhờ seeded, F đón thủ công, G cho từng khách xuống trong khi lái, sức chứa xe máy tính cả tài xế, thưởng theo quãng đường và cruise giảm theo khách; quá tải ảnh hưởng max/fuel. Khách văng/ngồi lại hoặc đứng lại sau va chạm có placeholder chuyển động; xe mở xếp nhân vật thành cụm lớn dần theo số khách. HUD đếm khách có icon cạnh điểm/tiền. Tab được giữ cho đổi nhanh xe; P4A chỉ có một xe nên chưa có tác dụng. P4B tiếp theo mới đưa nhiều loại xe, kho tối đa hai xe, thay xe giữ khách/tài nguyên và phần mua xe/shop phụ thuộc P5; không gọi P4 hoàn tất từ P4A. Cảnh quan seeded dạng mảng màu vẫn là hạng mục placeholder riêng của các prototype tiếp theo theo ghi chú đầu tài liệu; art chi tiết giữ ở mốc 9.

**P4B bản thử:** tám định nghĩa xe với tốc độ, kích thước, sức chứa, xăng/HP và mức nhặt riêng; state giữ tối đa hai instance với tài nguyên/nâng cấp độc lập. Tab đổi xe tức thì, giữ khách; xe hỏng hoặc hết đà chuyển sang xe còn dùng được, được bảo vệ ngắn và khỏi hazard đang đè cho tới khi thoát collider. Bản thường vẫn bắt đầu bằng xe máy; kịch bản thử DEV `?scenario=vehicles` thêm ô tô 4 chỗ, `?scenario=vehicles-bus` và các loại khác thêm xe tương ứng. Logic mua xe thứ ba yêu cầu chọn xe bỏ đã có test giao dịch nguyên tử, chưa có giao diện mua/shop (P5). Xem [PROTOTYPE_4B_REVIEW.md](PROTOTYPE_4B_REVIEW.md); cân bằng các xe và cảnh quan màu seeded chưa hoàn tất.

**Feedback P4A tiếp theo:** HUD tính tổng người kể cả tài xế (xe máy trống 1/2); G làm khách bay ngang trước khi đứng lại. NPC chờ và khách không quay về đứng yên hoặc di chuyển chậm trong vòng 1,5 m, pickup/cue theo vị trí thực. Xem [P4A_PASSENGER_MOTION_REVIEW.md](P4A_PASSENGER_MOTION_REVIEW.md) cho kiểm thử; motion vẫn là primitive placeholder.

**Ghi chú cho prototype sau:** tài xế văng ra cần ngã/nằm tại chỗ một nhịp, đứng dậy rồi mới chạy về xe. Giữ miễn nhiễm toàn bộ chuỗi và chỉ hồi tốc khi đã lên xe; thêm thời gian dừng vào simulation trước animation hoàn chỉnh.

**Sửa hồi quy P4B:** khách ngẫu nhiên không quay lại sau tai nạn được giữ thành entity ngay từ lúc va chạm; cùng entity tiếp tục văng/đáp đúng vị trí, không biến mất rồi xuất hiện cạnh xe sau khi tài xế trở lại. Họ bị khóa đón lại bằng F vĩnh viễn. Khách được chọn quay lại nhập lại xe; khách chờ thường và khách do G cho xuống vẫn theo luật đón khách bình thường.
