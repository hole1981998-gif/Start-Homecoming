# Đường Về Nhà — Roadmap

> **Quyết định của chủ dự án 23/10/2026:** khép giai đoạn cân bằng ở revision `7478502` (`codex/c3-early-score-qte`) và chọn bản này làm nền cho các giai đoạn tiếp theo. Báo cáo cuối: `P8_C3_REFINEMENT_REVIEW_2026-10-23.md`; các giới hạn kiểm thử ghi trong báo cáo vẫn cần được theo dõi, không phải cam kết mọi chỉ số đã đạt. Việc đưa revision này thành `main`/nhánh mặc định trên GitHub còn phụ thuộc quy trình kiểm tra, CI và review trong AGENTS.md. `ver.noforce` tiếp tục là backup, chỉ sửa khi chủ dự án yêu cầu. Các đoạn P2/P5 bên dưới là lịch sử của baseline cũ.

> **Quyết định 20/10/2026:** đưa luật lực từ `ver.force` vào bản chính `/`; `ver.noforce.html` là backup, không chỉnh nếu chủ dự án không yêu cầu. Hệ số lực và sát thương vẫn TẠM. P8 cần kiểm tra thêm nhiều seed/tốc độ/xe, giao lộ, sát mép đường, camera, hiệu năng và economy trước khi khóa cân bằng.

> **Thiết kế hiện hành P6.1:** xem DESIGN_MOVING_EVENTS_TRAFFIC.md. Feedback mới thay mô hình tàu/công an bật-tắt chắn toàn đường của bản P6; phần mô tả P6 phía dưới là lịch sử implementation, chưa phải cơ chế chuyển động đã nghiệm thu. Chưa sửa runtime trong lượt cập nhật design này.

Roadmap là kế hoạch đề xuất, không phải báo cáo đã triển khai. Không có mốc thời gian cam kết. Mỗi feature dùng một branch và PR riêng theo AGENTS.md; milestone có thể gồm nhiều PR nhỏ. Tất cả số trong BALANCE_CONFIG.md cần playtest.

**Bổ sung ô tô 7 chỗ 21/10/2026:** bản chính/force có điểm điều hướng hơi trước tâm xe, tạo quét đuôi nhỏ hơn tải/buýt; chỉ áp dụng xe người chơi. Fixture `?scenario=handling-car7&seed=17` để thử A/D và thả lái trên đường trống. Hệ số TẠM; P8 đánh giá thêm né hazard, va chạm mép và cảm giác ở tốc độ cao. `ver.noforce` giữ nguyên backup.

**Thử nghiệm vật lý song song:** `ver.force` có tình huống buýt và xe tải bám trục sau (xe tải quét nhẹ hơn) và container người chơi gồm đầu kéo/rơ-moóc có khớp; `ver.noforce` dùng đối chiếu cùng seed. Container chướng ngại chưa tách. Container người chơi đã có luật thử một HP event/entity, rơ-moóc chỉ chịu nửa damage và vũng nước/ổ gà chỉ xét đầu kéo. Trước khi nhập vào build chính, cần kiểm chứng collider khi cua/giao lộ, camera, mức sát thương và xe sát mép đường ở nhiều seed.

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
| 5 — Kinh tế ven đường | R mở shop, chỉ tiếp tế xăng/HP tại chỗ (bỏ gói mang theo), mua xe đủ catalog nhưng không trùng loại đang sở hữu, chọn một trong hai xe để nâng cấp, xăng/sửa, controlled stock | Tiền/stock không reroll; không bán gói xăng/sửa; nâng cấp đúng xe đã chọn, không tự equip/refill; mua xe thứ ba nguyên tử |
| 5.1 — Vật phẩm tăng lực | Kho hai ô 1/2, nitro boost/nhảy, invincible star | Timer/pause/restart đúng; star không bỏ trigger event; nhảy/landing có swept collision |
| 5.2 — Grab | Gói nhiều lượt sinh khách đặc biệt, thu nhập cao hơn khách thường | Spawn an toàn/idempotent; không trừ lượt khi thất bại; thưởng chỉ từ khách thực |
| 6 — Nguy hiểm đặc biệt | Công an/dân phòng, kẹt xe, xe chết máy, tai nạn, tàu và chuối; tích hợp nitro/star từ P5.1 | Tiền phạt cố định; thiếu tiền đúng chính sách; tàu không xuyên collider; thay xe không chết dây chuyền |
| 6.1 — Vật cản chuyển động và tai nạn phát sinh | Tàu chạy ngang/hitbox theo thân; officer 1–2 NPC qua lại, chuối làm đứng yên/vô hại; traffic va nhau/hazard gây hỏng; giữ rào/cây/xe ngang và hàng rong/cứu thương | Sweep hai phía, lối né công bằng; hỏng/sinh khách một lần; bản chơi tích hợp cùng shop/đồ/khách/giao lộ, không chỉ fixture |
| 6.2 — Lực môi trường | Gió/nước đẩy ngang làm khó lái | Lực có giới hạn; crash/star miễn debuff; pause/restart không tích lực |
| 6.3 — Đồ rơi từ traffic | Tải/container làm rơi vật lăn | Source/event seeded, không spawn dưới bánh, giới hạn pooling/cleanup, không chép qua nhánh |
| 7 — Kết ván đặc biệt | Chuỗi secret 4 bước, badge, kết quả và leaderboard local | Đúng chuỗi thì kết secret trước HP=0; sai thứ tự không kích hoạt; ghi điểm đúng một lần |
| 8 — Tuning độ khó và economy | Tuning difficulty curve theo quãng đường, áp lực xăng/HP, giá xe/nâng cấp/tiếp tế, thu nhập và chiến thuật chở khách; dùng placeholder | Đo đầu/giữa/cuối ván trên nhiều seed/xe; độ khó tăng cảm nhận được nhưng có lối giải/cue công bằng; báo cáo thời điểm mua thật, tiền ròng/phút, nguyên nhân chết; chủ dự án chơi và duyệt trước khi khóa số |
| 9 — Visual và art direction | Trên nền P8 đã chốt: hoàn thiện hình ảnh map/xe/nhân vật theo từng nhóm asset, đánh giá art direction và chỉnh sửa trước khi ghép nhóm kế tiếp | Rubric GAME_DESIGN.md: mỗi tiêu chí ít nhất 6/10, không lấy điểm trung bình che tiêu chí rớt; cảnh quan liên tục khi rẽ, silhouette rõ, hiệu năng có bằng chứng; chủ dự án duyệt asset/art trước tích hợp |
| 10 — UI | Thiết kế và tích hợp HUD, cảnh báo/QTE, onboarding, kho/shop, card/toast trên bản visual đã duyệt; review UX riêng | Input liên tục, HUD và cảnh báo không che hành lang lái/QTE, thông tin đọc được ở màn 9:16, tùy chọn tiếp cận và hiệu năng được kiểm tra |
| 11 — VFX | Tích hợp hiệu ứng va chạm, tài nguyên, vật phẩm, thời tiết và tín hiệu hazard theo từng nhóm asset đã bàn giao | Hiệu ứng khớp hitbox/timing, không che hazard/QTE; reduced motion hoạt động; kiểm tra cả sự kiện đồng thời và stress test |
| 12 — SFX và âm thanh cuối | Tích hợp SFX, music và ambience sau khi cue hình đã ổn; đánh giá rồi chỉnh sửa, sau đó kiểm thử toàn game | Âm khớp sự kiện và có cue hình tương đương; mute/volume độc lập hoạt động; kiểm tra lại gameplay/economy/performance và trình duyệt mục tiêu trên bản cuối |

**Thứ tự tiếp theo — ĐÃ CHỐT ngày 23/10/2026:** P8 cân bằng được chủ dự án chấp nhận làm baseline → P9 visual/art direction → P10 UI → P11 VFX → P12 SFX/âm thanh và kiểm thử cuối. Mỗi giai đoạn là một phạm vi review riêng. Agent ở chat khác tạo asset; repo game chỉ tích hợp từng bộ asset khi đã được bàn giao và chủ dự án yêu cầu, không tự tạo hoặc ghép asset hoàn chỉnh trước. Mỗi lần ghép phải kiểm tra tương thích, gameplay, readability, hiệu năng và regression trên revision mới. Những quan sát/giới hạn còn lại của P8 được giữ trong báo cáo để đối chiếu, không tự khởi động vòng cân bằng mới nếu không có feedback.

Trong mốc 0–8, dùng placeholder tối giản để giữ cảnh và UI rõ; không bắt đầu asset production-grade sớm. Có thể làm thay đổi placeholder phục vụ đọc gameplay mà không cần chờ art approval. Mốc 9 là một gate riêng; không tự xem việc yêu cầu làm prototype là đồng ý tạo hay tích hợp art hoàn chỉnh.

**Cảnh quan theo tuyến — ĐÃ CHỐT về hướng visual, CHƯA TRIỂN KHAI:** hai bên đường về sau có các vùng như thành phố, biển, hàng cây, vách núi/đồi và ruộng lúa. Từ các prototype tiếp theo, chỉ biểu diễn vùng bằng các mảng màu phẳng phân biệt được, phân bố tái hiện theo seed để dễ thấy lỗi nối cảnh; chưa tạo địa hình hay asset art hoàn chỉnh. Vị trí vùng và ranh giới phải gắn với tọa độ thế giới/tuyến, không gắn lại theo camera hoặc nhánh vừa chọn. Khi xe rẽ, giữ mảng màu ở nhánh cũ và quanh giao lộ cho tới khi chúng ra khỏi vùng nhìn rồi mới tái sử dụng dữ liệu/render; cùng một seed và lựa chọn rẽ phải cho cùng bố cục. Kiểm tra cả rẽ trái, rẽ phải, đi thẳng và nhiều giao lộ liên tiếp, đặc biệt lúc camera xoay. Mốc 8 kiểm tra tổng thể; việc thiết kế hình ảnh chi tiết, chuyển tiếp địa hình và art cảnh quan dành cho mốc 9 theo gate duyệt cuối.

**Cập nhật placeholder 21/10/2026:** bản chính và `ver.force` có năm mảng màu thành phố, biển, hàng cây, vách núi/đồi, ruộng lúa. Ô nền 96 m (TẠM) lấy loại vùng từ seed + tọa độ thế giới. Hai dải lề rộng 30 m bám theo tim đường, đổi loại mỗi 96 m dọc tuyến; hash seed quyết định đoạn có hai bên cùng vùng hay khác vùng. Đường che đường nối giữa hai dải. Sau rẽ, dải của nhánh thẳng cũ còn theo nhánh cũ tới khi giao lộ rời vùng nhìn. Không tiêu RNG gameplay, không đổi collider/economy; `ver.noforce` backup giữ nền cũ. Đây chỉ là mảng màu để soi lỗi nối cảnh, chưa phải địa hình hay art cuối; tiếp tục kiểm tra nhiều giao lộ và seed tại mốc 8–9.

**Visual hành khách trên xe hộp kín — ĐÃ CHỐT, ĐÃ CÓ PLACEHOLDER:** chỉ xe người chơi dạng kín (ô tô, xe buýt, xe tải, container) hiện đầu/thân trên hành khách nhoài ra ngoài cửa sổ theo đúng số khách đang ngồi; tài xế không thò ra và không được tính. Xe chướng ngại giữ ngoại hình thường, không hiện hành khách ở cửa sổ. Khi thân xe người chơi được kéo dài/rộng theo loại xe, model người vẫn giữ kích thước bình thường. Ba gác có đầu xe hẹp, thùng và ba bánh riêng thay vì kéo giãn model xe máy. Có fixture DEV `?scenario=visual-vehicles-car4&seed=17` (đổi `car4` sang `car7`, `bus`, `truck`, `container`, `tricycle`) để xem xe chở đủ khách; `?scenario=traffic-gallery&seed=17` xem catalog traffic. Cần tiếp tục đánh giá khả năng đếm đầu khi xe dài/đông khách và khi đổi xe, cho xuống, crash/reboard; art chi tiết vẫn thuộc mốc 9 và gate duyệt cuối.

Âm thanh/VFX placeholder và cue tối thiểu có thể làm trong prototype để kiểm tra nhịp độ/tín hiệu. VFX hoàn chỉnh thuộc P11; SFX, nhạc và ambience hoàn chỉnh thuộc P12, sau visual và UI. Mỗi giai đoạn có review/sửa riêng; tích hợp asset khi chủ dự án bàn giao và yêu cầu. Trước đó ưu tiên cue Web Audio đơn giản, volume controls và cue hình ảnh tương đương.

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

**P4.2 có bản thử (`p4-2-traffic-passengers-1`):** xe hỏng do húc hoặc ổ gà tạo roster NPC seeded đúng một lần; 1–3 khách, không vượt sức chứa trừ tài xế. Chọn chỗ bên cạnh trong đường và ngoài footprint xác/hazard; nếu cả hai phía không an toàn thì trì hoãn, có thể bỏ nếu xe đã ra khỏi vùng dữ liệu. Khách dùng F và hệ tải/thu nhập hiện có, không thưởng ngay lúc sinh. Giữ khách sau khi xác biến mất, không sinh khách cho nhánh đã retire. Số khách và clearance TẠM; xem [PROTOTYPE_4_2_REVIEW.md](PROTOTYPE_4_2_REVIEW.md). Các ghi chú P4.2 chưa làm phía dưới là lịch sử P4.1.

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

**P4.2 lượt 2 — ĐÃ CHỐT và triển khai:** khách từ xe bị người chơi húc hỏng từ chối lên xe; giữ NPC và khóa F vĩnh viễn. Khách từ xe hỏng do ổ gà vẫn đón được. Xem phần cập nhật trong PROTOTYPE_4_2_REVIEW.md; nội dung P4.2 lượt đầu bên trên là lịch sử.

**Traffic fuel đã có bản thử theo feedback:** xe chướng ngại tiêu nhiên liệu theo loại và khi chạm nước; hết xăng trôi 25 m rồi dừng, còn collider và HP. Không tự sinh khách vì cạn xăng trong lát cắt này. DEV `?scenario=traffic-fuel&seed=17` cho quan sát xe cùng chiều cạn xăng; `traffic-fuel-oncoming` kiểm tra hướng âm. Xem [TRAFFIC_FUEL_REVIEW.md](TRAFFIC_FUEL_REVIEW.md). Các câu traffic chưa có fuel ở ghi chú cũ đã được thay thế.

**P5 có bản thử:** C mở cửa hàng đúng vị trí và pause; mua xe với xác nhận bỏ một xe khi kho đầy; nâng cấp riêng từng instance; bơm/sửa; kho ba vật phẩm xăng/sửa, chọn trong shop và dùng R. Stock seeded không reroll, ô tô 4 chỗ luôn có ở shop để kiểm tra mốc mua. Hai shop đầu 600/1200 m, sau đó 600–900 m seeded. Đã thử giao dịch mua thật trên 30 seed mỗi cruise/W và thao tác browser; xem [PROTOTYPE_5_REVIEW.md](PROTOTYPE_5_REVIEW.md). Đây là bản thử core shop/controlled stock; nitro/Space, loot sự kiện và nguy hiểm đặc biệt nối P6; art hoàn chỉnh vẫn cuối. Những dòng “shop chưa có/P5 chưa làm” phía trên là lịch sử.

## Phân kỳ mới theo feedback vật phẩm/chướng ngại 18/10/2026

Đặc tả và các điểm còn ĐỀ XUẤT: [DESIGN_ITEMS_HAZARDS.md](DESIGN_ITEMS_HAZARDS.md). P5 chỉ bỏ hai món hồi tài nguyên mang theo; chưa triển khai các món/hazard mới. Thứ tự: P5 → P5.1 → P5.2 → P6 nền và chuối → P6.1 → P6.2 → P6.3 → P7 → P8 tuning → P9 UI/art → P10 SFX/VFX. Đây là kế hoạch, không phải báo cáo hoàn thành. Các mô tả P5 lịch sử về bán gói mang theo, C/R cũ, ba ô và nitro kho riêng được thay thế bởi yêu cầu mới.


## P5.1 — bản thử vật phẩm tăng lực (18/10/2026)
Đã triển khai kho hai ô cố định 1/2 (cả numpad), nitro chỉ boost, Space mới nhảy khi hiệu lực còn, star miễn damage/debuff thường. Xăng/sửa chỉ là service tại chỗ, không đưa lại gói hồi tài nguyên. Nguồn thử TẠM: mỗi shop một nitro và một star, không reroll; giá 120/180. Bản thường bắt đầu kho trống; fixture DEV items có sẵn hai món. Nitro boost 4 s, trần tốc độ ×1,3, nhảy 1,6 s cao 2,4 m; star 5 s. Bấm nitro khi hết xăng/coasting hoặc dùng lại cùng hiệu lực đang chạy không tiêu món; pause/crash/kết ván không cho dùng. Hai hiệu lực khác loại có thể dùng cùng lúc, không cộng dồn cùng loại. Timer theo thời gian gameplay; pause/shop/Help không làm hết hiệu lực.
Nitro không miễn va chạm: chỉ vượt mặt đường/xe thấp khi đủ cao và toàn bộ footprint thoát trước hạ cánh; không vượt bus/truck/container. Đụng trong lúc nhảy vẫn có thể ngã; ngã hủy boost/flight. Star không hồi/cấp xăng, tiêu hao chạy nền vẫn có; không tự phá traffic khi lướt qua. Hết star khi vẫn chạm hazard sẽ chịu hậu quả tiếp. Tại giao lộ, star vẫn ghi event/miss nhưng chặn damage/ngã của rào thường. Tàu/công an/dân phòng chưa có, chưa nghiệm thu luật terminal/trigger thực của P6; thiết kế star không bỏ trigger và tàu vẫn terminal khi đụng được giữ. Grab/chuối/hazard mới chưa triển khai.
Các số trên đều TẠM, chưa khóa economy/difficulty. Xem [PROTOTYPE_5_1_REVIEW.md](PROTOTYPE_5_1_REVIEW.md) cho command, seed, bằng chứng manual, giới hạn và tự review.


## Sửa điều khiển nitro theo chủ dự án — Space nhảy
Thay luật tự nhảy của P5.1 đầu: dùng nitro bằng phím ô 1/2 chỉ boost tốc độ trong thời lượng hiện có (TẠM 4 s). Nhấn Space riêng khi nitro đang hiệu lực và xe đang ở mặt đường để nhảy. Không tiêu thêm món/không reset thời lượng boost; giữ Space không tự nhảy lặp. Sau hạ cánh có thể nhấn Space lại nếu boost còn. Không nhảy khi pause/ngã/kết ván/hết xăng/coasting hoặc không có nitro; star riêng không cho nhảy. Cú nhảy đã bắt đầu vẫn đáp bình thường nếu boost hết giữa không trung. Không đổi giá/thời lượng, không chỉnh layout/art; UX/UI hoàn chỉnh để P tương ứng. Kết quả: [NITRO_SPACE_REVIEW.md](NITRO_SPACE_REVIEW.md).


## P5.2 — bản thử Grab và khách đặc biệt
Đã triển khai gói Grab trong kho hai ô 1/2. Số thử TẠM: giá 240, 3 lượt/gói, một gói mỗi shop, cooldown gọi 2 s; món giữ nguyên ô cho tới khi hết lượt, không tự dồn ô. Một lượt tạo một NPC Grab phía trước khoảng 45–120 m (tối thiểu cửa sổ phản ứng theo tốc độ), có dấu primitive và nhãn Grab. Không tìm được pocket an toàn/đủ xa, đang có khách Grab còn chờ hoặc chưa chọn nhánh giao lộ thì không trừ lượt. Không tự thêm khách hoặc thưởng tiền khi gọi; phải lái tới và nhấn F. Bỏ lỡ khách mất cơ hội, không hoàn lại lượt hay nhân khách sang nhánh khác.
Khách Grab giữ ID/type qua F/G, đổi hoặc mua xe và tai nạn. Khách quay lại tiếp tục có thưởng đúng một lần; khách rời đi không còn cộng thưởng, giữ luật từ chối đón lại sau tai nạn. Tối đa/capacity/quá tải/cruise và điểm số vẫn như khách thường. Thưởng tiền mỗi khách Grab TẠM ×10 phần riderMoneyPerMeter (0,10/m thay 0,01/m), không nhân thu nhập nền 0,50/m hoặc toàn bộ ví. Registry chỉ giữ ID khách còn liên quan trên xe/đang quay lại; type của người ngoài đường nằm trên entity. Restart xóa mọi dữ liệu ván.
Nguồn chờ giữ vị trí đã kiểm tra để không đi vào hazard; chỉ reserve pocket đón của khách đang chờ khi sinh hazard mới, vẫn tiêu RNG draw trước khi từ chối hazard đè pocket. Không xóa hazard đã có, không clear toàn bộ đường, không cho pickup tự động. Grab chưa khóa cân bằng: gói có chi phí cơ hội so với mua xe và tích nhiều khách trên bus có thể rất lời. UI/art vẫn placeholder; hoàn thiện ở P tương ứng. Xem [PROTOTYPE_5_2_REVIEW.md](PROTOTYPE_5_2_REVIEW.md).


## Grab chờ ở ven đường — cập nhật theo chủ dự án
Khách Grab được gọi chỉ xuất hiện ngẫu nhiên ở hai mép ngoài mặt đường, không ở tâm hay trong lane. Bên ưu tiên lấy từ seed/branch/sequence riêng, không ưu tiên gần xe và không tiêu hazard RNG. Nếu bên đó không an toàn thì thử bên kia; cả hai không hợp lệ thì giữ lượt. Vị trí đứng tính từ nửa bề rộng đường + nửa collider NPC; kiểm tra đường tiếp cận và hazard theo vị trí xe có thể chạy sát lề, không lấy tâm NPC ngoài đường làm tâm xe. Tầm F giữ nguyên; có test đón cho cả 8 loại xe. Không đổi giá/thưởng/lượt hay layout/art. Xem [GRAB_ROADSIDE_REVIEW.md](GRAB_ROADSIDE_REVIEW.md).


## P6 — bản thử sau khi duyệt P5.2
Đã có event công an/dân phòng, chuối, kẹt hai lane, xe chết máy, tai nạn và tàu; phạt cố định, tịch thu/thay xe, star vẫn trigger event, phanh chờ/nitro + Space qua tàu. Số thử chưa khóa cân bằng; chưa làm secret P7. Bước tiếp theo P6.1 (barrier và chướng ngại chuyển lane), rồi P6.2 lực ngang/P6.3 đồ rơi trước P7/P8; giữ UI/art ở mốc 9, SFX/VFX hoàn chỉnh mốc 10. Báo cáo [PROTOTYPE_6_REVIEW.md](PROTOTYPE_6_REVIEW.md); cần chủ dự án chơi và phản hồi, chưa merge.


## Bổ sung phạm vi P6.1 theo feedback mới
Chủ dự án chưa nghiệm thu tổng thể P6 từ các ca công an/tàu giả lập. P6.1 sửa chuyển động/hitbox tàu và officer, chuối làm đứng yên/vô hại, đồng thời bổ sung traffic va nhau/hazard gây tai nạn/hỏng xe thực. Có thể chia A/B trong cùng milestone để review; chưa gọi hoàn tất nếu thiếu bản chơi tích hợp và playtest tuyến có đủ hệ thống. Đặc tả: [DESIGN_MOVING_EVENTS_TRAFFIC.md](DESIGN_MOVING_EVENTS_TRAFFIC.md). Chưa đổi code trong lượt ghi nhận này; P8 mới tuning mật độ/curve/economy, P9 UI/art và P10 SFX/VFX giữ nguyên.


## P6.1 — bản thử tình huống trước tích hợp (18/10/2026)
Theo yêu cầu mới nhất của chủ dự án: triển khai và duyệt các tình huống riêng trước; chỉ làm bản tích hợp khi chủ dự án đồng ý. Đã có 15 fixture DEV tại http://127.0.0.1:5173/p61.html, version `p61-scenarios-1`: tàu ngang hữu hạn, officer 1/2 người, chuối vô hiệu cả nhóm, traffic va nhau/hazard, rào, hàng rong và cứu thương. Chỉ fixture bật experimentalMotion/experimentalTraffic; director ván thường chưa dùng các cơ chế này. Đây chưa phải hoàn thành toàn bộ P6.1.
Các số mới đều TẠM: tàu dài ngang 24 m, sâu 2,8 m, tốc độ ngang 6 m/s; NPC rộng/sâu 0,65 m, chạy ngang 4,5 m/s trong ±4,35 m; rào rộng 6,2 m/sâu 1,4 m, damage traffic 20 một lần; hàng rong ngang 2,2 m/s; cứu thương dọc 16 m/s. Không đổi giá, thu nhập, fuel hay mật độ ván thường. Báo cáo và giới hạn tích hợp: [PROTOTYPE_6_1_SCENARIOS_REVIEW.md](PROTOTYPE_6_1_SCENARIOS_REVIEW.md). P8 tuning độ khó/economy, P9 UI/art, P10 SFX/VFX giữ nguyên.


## P6.1 tuning tình huống — feedback 18/10/2026
Version `p61-scenarios-2`, chỉ DEV, chưa tích hợp. Tàu chạy từ đầu vào tới đuôi rời toàn mặt đường trong 4 s (chủ dự án xác nhận), speed = (24 + 9,6)/4 = 8,4 m/s, giữ kích thước. Thời gian ở mỗi lane suy ra từ hình học, không timer tắt collider. Thêm 4 fixture công an/dân phòng: chạy nhanh 6,3 m/s; lệch nhịp 5,6 và 3,8 m/s, cách dọc 3 m, phạm vi ngang [-4,35;1,6] và [-1,6;4,35] m. Giữ nhóm/chuối/phạt như cũ. Hàng rong tăng 2,2→3,4 m/s, dài 1,5→2,1 m, rộng 0,8→1,1 m. Các số mới TẠM để chủ dự án chơi thử, chưa điều chỉnh director/difficulty curve/economy. Hub hiện có 19 ca. Báo cáo: [P61_EVASION_TUNING_REVIEW.md](P61_EVASION_TUNING_REVIEW.md).


## P6.1 — đã có bản tích hợp, chờ chơi duyệt
Chủ dự án duyệt bộ thử và yêu cầu tích hợp ngày18/10/2026. Version runtime `p61-integrated-1`: bản thường tại / bật chuyển động ngang và traffic tự tương tác; giữ bộ19fixture riêng để tái hiện. Tàu24m ngang/8,4m/s qua toàn đường4s; officer seeded một người (TẠM2/3) hoặc hai (TẠM1/3), profile thường/nhanh/lệch nhịp đã thử; chuối vô hiệu nhóm. Slot jam cũ chọn seeded rào/hàng rong/cứu thương, mỗi loại TẠM1/3; không thêm slot, giữ event đầu1700m/gap1250m/corridor110m, giá/fuel/economy không đổi. Hàng rong rộng1,8m/dài2,1m/ngang3,4m/s. Start tàu/hàng rong ước lượng theo cruise lúc spawn, lead2,4s/2s; phanh làm xe chờ quỹ đạo thật. Các mô tả “chưa tích hợp” phía trên là lịch sử. Tuning curve/economy P8, UI/art P9, SFX/VFX P10 vẫn sau. Báo cáo: [PROTOTYPE_6_1_INTEGRATED_REVIEW.md](PROTOTYPE_6_1_INTEGRATED_REVIEW.md).


## P6.1 — stress test và sửa kích hoạt tàu (18/10/2026)
Theo yêu cầu chủ dự án: có chế độ DEV `?scenario=stress&seed=17` dùng simulation tích hợp, cố ý dày/không cân bằng; không dùng density này cho ván thường. Thêm tối thiểu2traffic/24m,patch mỗi48m,special mỗi72m,preload480m; đủ catalogtraffic và tuần tự officer/tàu/rào/hàng rong/cứu thương/accident/broken. Container+bus,10000tiền,chuối/nitro mẫu; giữ luật ngã/hỏng/tàu terminal. `start=288` hoặc576 là checkpointQA để dễ gặp phần sau.
Sửa runtime thường thành `p61-integrated-2`: tàu chờ ngoài vùng vẽ, kích hoạt một lần theo khoảng tiếp cận thực max(60m,v×2,4s,v²/(2×braking)+chiều dài xe+15m), không lấy ETA trung vị cố định lúc spawn xa; giữ crossing4s và8,4m/s. Rẽ truyền activeSeconds/speed hiện tại khi fillWorld. Đây là sửa thời điểm event, không đổi giá/fuel/density normal. Báo cáo: [P61_STRESS_TRAIN_REVIEW.md](P61_STRESS_TRAIN_REVIEW.md).


## P8 — câu hỏi bắt buộc trước cân bằng xăng traffic
Theo yêu cầu chủ dự án18/10/2026, khi bắt đầu bước tuning/cân bằng phải hỏi: **“Có nên tắt tính năng xăng cho xe chướng ngại không?”** Chờ chủ dự án trả lời trước khi thay đổi luật fuel của traffic; hiện vẫn giữ bật. Không hiểu yêu cầu ghi chú này là đồng ý tắt. Lưu ý tác động tới xe hết xăng/coasting/dừng, mật độ ùn tắc/tai nạn phát sinh và khách từ xe hỏng; nếu cần so A/B phải giữ cùng seed/input/xe. Mốc stress và dữ liệu đã đóng băng: [BALANCE_REFERENCE_P61_STRESS.md](BALANCE_REFERENCE_P61_STRESS.md).


## P6.2 — bản thử lực ngang, chờ duyệt tích hợp
Đã có8fixture DEV tại /p61.html#forces: gió trái/phải,nước đẩy trái/phải,hai vùng ngược hướng,star,ngã,coasting. Version p62-forces-1. Mô hình TẠM là tốc độ đẩy ngang có giới hạn,không tích vận tốc:wind1,5m/s,current2m/s,tổng cap2,2m/s nhỏ hơn AD5m/s;vùng45–110m rộng9,6m. Star/crash/protected footprint miễn lực;gió vẫn tác động khi nhảy,nước đẩy không tác động khi đủ độ cao;coasting vẫn có thể trôi ngang. Rời vùng/pause không có impulse bù. Nước giữ fuel cost cũ,gió không thêm HP/fuel cost. Chỉ source lực P6.2 áp dụng cho người chơi;chưa director/NPC-force/density/economy mới. P6.1 thường và stress snapshot giữ nguyên,quyết định fuel traffic vẫn hỏi chủ dự án tại P8. Báo cáo: [PROTOTYPE_6_2_REVIEW.md](PROTOTYPE_6_2_REVIEW.md).

## Cập nhật P6.2 theo feedback chơi thử (18/10/2026)
Bản `p62-forces-2` thay thế quy tắc lực của `p62-forces-1` ở trên. Gió vẫn tạm 1,5 m/s với giới hạn tổng 2,2 m/s; chỉ miễn đẩy khi đang ngã, star hoặc đang trong bảo vệ thay xe. Tài xế trở lại xe mà xe còn trong vùng thì gió tác dụng ngay, dù ID vùng vẫn nằm trong danh sách bảo vệ damage/debuff sau tai nạn. Xe chướng ngại đang chạy, kể cả đang trôi do hết xăng, cũng bị gió đẩy ngang và va chạm theo quỹ đạo mới; xe đã dừng/hỏng và vật chắn cố định không bị đẩy. Lực ngang của nước tạm dừng theo yêu cầu chủ dự án; nước vẫn giảm tốc và hao xăng theo luật cũ. Các URL thử nước cũ trỏ về ca nước không lực. Tám fixture DEV mới gồm hai gió, một nước cơ bản, hai gió ngược hướng, star, ngã, coasting và xe chướng ngại. Chưa tích hợp nguồn gió vào ván thường/stress; dữ liệu stress P6.1 đóng băng và câu hỏi fuel traffic ở P8 giữ nguyên. Xem [P62_WIND_RECOVERY_REVIEW.md](P62_WIND_RECOVERY_REVIEW.md).

## P6.3 — thử đồ rơi trước tích hợp
Sáu ca DEV tại `/p61.html#cargo` thử xe tải/container cùng chiều làm rơi vật ở cửa sau, vật trượt lùi và lăn lệch hướng theo seed, va chạm nhẹ/nặng, star, nitro + Space và xe nguồn hỏng. Bản này chỉ là prototype tình huống, chưa thay director ván thường/stress. Chờ chủ dự án chơi và nhận xét; khi được duyệt, tích hợp P6.2 gió và P6.3 đồ rơi vào game cùng một lượt, rồi đánh giá difficulty/economy. Tạm hoãn việc phối hợp gió với nước, ổ gà và vật cố định. Giá trị thử chưa cân bằng; xem [P63_TRAFFIC_CARGO_REVIEW.md](P63_TRAFFIC_CARGO_REVIEW.md).

## P6.3 — cập nhật tích hợp sau duyệt

Chủ dự án đã duyệt ca thử và yêu cầu tích hợp ngày 18/10/2026. Bản chơi thường nay có gió P6.2 và đồ rơi P6.3 bên cạnh toàn bộ P6.1; bản stress tham chiếu giữ nguyên lịch riêng. Duy trì nước không có lực ngang và chưa tạo trường hợp gió chồng nước/ổ gà/vật cố định. Bước kế tiếp vẫn là P7 rồi P8 tuning độ khó/economy trước UI/art P9 và âm/VFX cuối P10. Xem [P63_INTEGRATED_HAZARDS_REVIEW.md](P63_INTEGRATED_HAZARDS_REVIEW.md).

**P7 bản thử ngày 19/10/2026:** đã nối chuỗi kết ván bí mật bốn bước với thực thể tàu/tai nạn thật, huy hiệu và bảng điểm lưu trên máy. Ca DEV `?scenario=p7-secret&seed=17` bắt đầu sau hai bước mua ô tô 4 chỗ rỗng và đón đủ ba khách, đặt tàu ngang và tai nạn sát nhau để thử ngay: bấm `1`, rồi `Space`. Trong ván thường người chơi vẫn phải tự thực hiện đủ bốn bước. Xem [PROTOTYPE_7_REVIEW.md](PROTOTYPE_7_REVIEW.md). Chưa khóa cân bằng mật độ chướng ngại; P8 xử lý sau feedback.

**P7 sửa điều kiện secret theo chủ dự án:** trang bị ô tô 4 chỗ mua mới hoặc xe dự phòng, làm rỗng khách cũ rồi đón mới đủ ba khách; nhảy qua tàu, sau đó va xe chướng ngại **hoặc** tai nạn, không cần liên tục. `?scenario=p7-secret&seed=17` thử nhánh tai nạn; `?scenario=p7-secret-traffic&seed=17` thử nhánh xe chướng ngại. Quy tắc mới trong GAME_DESIGN.md thay phần mô tả P7 lịch sử ở trên.

**Bổ sung thử vật lý lái sau P7:** quán tính ngang và nghiêng theo lái cho mọi xe người chơi, grip riêng từng loại, tốc độ cao trượt xa hơn; có fixture đường trống `?scenario=handling-<vehicleKind>&seed=17`. Các hệ số vẫn TẠM; P8 đo ảnh hưởng lên né hazard, mép đường, độ khó và economy trước art P9. Xem [HANDLING_PHYSICS_REVIEW.md](HANDLING_PHYSICS_REVIEW.md).

**Sân thử va chạm arcade × engine, chưa tích hợp ván chính:** `physics.html?case=mixed&seed=17` và bốn ca xe–xe, xe–NPC, thùng rơi, chuỗi xe. Mục tiêu lấy feedback cảm giác phản lực/đọc hình trước khi quyết định scope tích hợp vào gameplay; không đổi kết ván, traffic damage, khách hoặc economy chính trong lượt thử này. Xem [PHYSICS_COLLISION_SANDBOX_REVIEW.md](PHYSICS_COLLISION_SANDBOX_REVIEW.md).

## Bản đối chiếu lực va chạm (19/10/2026)

Hai URL thử `ver.force.html` và `ver.noforce.html` chạy cùng gameplay P7 và seed; bản force thêm Cannon phản lực sau bước luật arcade, bản noforce giữ nguyên. Đây là nhánh thử A/B song song trước quyết định tích hợp vào build chính. Đánh giá cảm giác lái, phản ứng xe/NPC/thùng, nguy cơ kẹt hoặc va chạm lặp, FPS và các bất biến tàu/secret/crash trước khi chọn luật lực cuối. Xem `PHYSICS_FORCE_AB_REVIEW.md`.

**Điều chỉnh NPC trong bản thử force:** xe húc NPC làm NPC bay/ngã/đứng dậy, không bị NPC chặn cứng; NPC do người chơi tông từ chối lên xe vĩnh viễn. So `?scenario=force-npc-hit&seed=17` trên hai bản, kiểm tra thêm nhiều xe/tốc độ và gameplay thường trước khi đưa vào bản mặc định. Các hệ số phản ứng vẫn TẠM.

**Điều chỉnh sức nặng traffic trong `ver.force`:** thử tại `?scenario=traffic-ram&seed=17`; traffic nặng gấp đôi trong solver, một cú húc phá gây chậm xe lớn và chỉ đẩy xác một đoạn ngắn, sau đó xe lớn tiếp tục đi. Kiểm tra thêm xe máy/ô tô và xe đang chạy cùng/ngược chiều trước khi chốt hệ số ở P8. Không đưa thay đổi này vào `ver.noforce`.

**Lượt chỉnh tiếp theo:** `ver.force` bổ sung động lượng trượt sau húc: xe hỏng trôi rồi dừng, xe còn HP trượt rồi tiếp tục chạy theo tốc độ nền. Ca mới `?scenario=force-car-ram&seed=17` cho ô tô 4 chỗ đuổi ô tô cùng chiều, cạnh ca buýt `traffic-ram`. Tại P8 vẫn cần thử nhiều loại xe/tốc độ và nguy cơ va chạm dây chuyền trước khi chốt lực; bản `ver.noforce` không đổi.
