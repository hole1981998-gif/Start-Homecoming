# Đường Về Nhà — Game Design

## Trạng thái và nguồn quyết định

Tài liệu tổng hợp yêu cầu của chủ dự án trong hội thoại “Start coding with Codex” và yêu cầu bàn giao ngày 17/10/2026. Các câu trả lời cũ của assistant chỉ còn tham chiếu, không có nội dung để kiểm chứng; không coi lời khuyên bị thiếu là quyết định đã chốt.

- **ĐÃ CHỐT**: cơ chế được yêu cầu trực tiếp. Thay đổi cần chủ dự án đồng ý.
- **ĐỀ XUẤT**: cách giải quyết chỗ chưa rõ, dùng làm mặc định triển khai và có thể chỉnh sau chơi thử.
- **TẠM**: mọi con số cân bằng trong BALANCE_CONFIG.md, chưa phải kết quả playtest.

**Cập nhật đã chốt ngày 17/10/2026:** chủ dự án yêu cầu mỗi loại xe có tốc độ trung vị và tự trở về tốc độ này khi thả W/S; mục tiêu có cơ hội mua ô tô đầu tiên sau khoảng 1–1,5 phút. Các thay đổi này thay thế mô tả điều khiển cũ. Báo cáo P1 trước cập nhật vẫn là bằng chứng lịch sử, không chứng minh cơ chế mới đã được triển khai.

## Tầm nhìn và phạm vi

**ĐÃ CHỐT:** game web 3D low-poly tạo hình bằng code, Three.js / TypeScript / Vite, chơi trên trình duyệt desktop trong khung dọc 9:16. Người đi làm về giữa mưa bão, ngập lụt; chạy càng xa càng nhiều điểm. Camera phía sau xe. Ván là endless run; không có đường vòng hay tuyến sự kiện riêng, không có mở khóa nội dung theo tiến trình. Giao lộ vẫn tồn tại: rẽ xong, hướng mới trở thành đường thẳng đang chạy. Secret ending kết thúc ván và trao badge “đã về nhà”.

**ĐỀ XUẤT:** toàn bộ tiền, xe, vật phẩm và nâng cấp thuộc ván hiện tại; chỉ lưu thiết lập, kỷ lục và badge giữa các ván. MVP dùng bảng điểm cục bộ, chưa có tài khoản/server. Vũ khí và chiến đấu từng được nhắc như ví dụ, chưa phải feature đã chốt; để ngoài MVP.

**ĐÃ CHỐT — mục tiêu cảm giác chơi:** tiết tấu nhanh, người chơi thường xuyên phải quan sát, quyết định và thao tác; game phải vui và có khoảnh khắc “wow”, tạo lý do muốn chạy thêm một ván. “Không thể dừng chơi” được hiểu là mục tiêu tạo flow và khả năng chơi lại, không phải dùng ép buộc hay che giấu cơ chế. Đạt mục tiêu bằng điều khiển phản hồi tốt, tín hiệu nguy hiểm công bằng, quyết định có ý nghĩa, cao trào xen nhịp thở ngắn và kết quả dễ hiểu. Không đánh đổi độ rõ ràng, khả năng tiếp cận hay tính công bằng chỉ để tăng áp lực.

## Vòng chơi và điều khiển

Chạy → đọc cảnh báo → né hoặc rẽ → đón khách/nhặt đồ → quản lý xăng, độ bền và tiền → ghé cửa hàng → mua/nâng cấp xe → xử lý thử thách tăng dần → kết thúc và ghi điểm.

| Phím | Hành vi |
|---|---|
| W / S | Giữ W để tăng/duy trì tốc độ cao; giữ S để giảm/duy trì tốc độ thấp. Thả cả hai: tốc độ tự trở về tốc độ trung vị riêng của loại xe |
| A / D | Lái ngang liên tục trong bề rộng đường; không khóa tâm lane |
| Q / E | Chọn rẽ trái / phải trong cửa sổ QTE giao lộ |
| Space | Dùng một gói nitro để lấy đà nhảy qua vật cản |
| R | Dùng vật phẩm hỗ trợ đang chọn; không dùng thay Space cho nitro |
| F | Tương tác NPC đủ gần |
| C | Vào cửa hàng ven đường khi đủ điều kiện |
| Tab | Mở garage và danh sách hành khách |

**ĐỀ XUẤT:** S hãm tới tốc độ tối thiểu, không chạy lùi. “Tự do tới lui” được hiểu là điều chỉnh tốc độ dọc và vị trí ngang, không lùi ngược đường endless. UI chỉ báo hành động khả dụng. Tab/cửa hàng tạm dừng mô phỏng trong ván đơn; đóng UI mới tiếp tục. Không cho tương tác cửa hàng từ bất cứ đâu. Space không có nitro thì không nhảy.

### Tốc độ trung vị và thao tác giữ phím

**ĐÃ CHỐT:** mỗi loại xe có một tốc độ trung vị (`cruiseSpeed`), là tốc độ tự chạy khi người chơi không giữ W/S. Đây là mốc điều khiển của xe, không phải trung bình thống kê của tốc độ trong ván. Nếu đang nhanh hơn mốc này, thả phím sẽ tự giảm tốc về mốc; nếu đang chậm hơn, thả phím sẽ tự tăng tốc về mốc. Người chơi phải tiếp tục giữ W hoặc S để duy trì tốc độ cao/thấp hơn mốc. Không còn cơ chế thả W để giữ nguyên tốc độ hiện tại hoặc mặc định thả phím chạy ở tốc độ tối thiểu.

**ĐỀ XUẤT triển khai:** tốc độ hồi về thay đổi từ từ, có gia tốc/giảm tốc riêng; không giật tức thì, không vượt qua rồi dao động quanh mốc. W tăng tới giới hạn tối đa, S hãm tới giới hạn tối thiểu; nhấn W+S ưu tiên S. Chỉ giữ A/D vẫn được coi là thả W/S. Bắt đầu ván ở tốc độ trung vị. Pause/focus/Help không chạy quá trình hồi tốc; khi tiếp tục, input giữ cũ đã được xóa, tốc độ tiếp tục từ trạng thái đã pause và hồi về mốc nếu chưa nhấn lại W/S.

**ĐÃ CHỐT — ảnh hưởng hành khách:** tốc độ trung vị giảm dần khi số khách đi nhờ đang ở trên xe tăng, kể cả khi chưa quá tải. Mỗi loại xe có mức giảm và sàn trung vị riêng: xe có thể chạm tốc độ tối thiểu hoặc dừng giảm ở mức cao hơn, tùy đặc tính xe, số khách và giới hạn tốc độ hiệu dụng trong tình huống hiện tại. Trước khi chạm sàn, mỗi khách thêm làm giảm mốc; sau sàn, mốc không giảm thêm và không bao giờ xuống dưới tốc độ tối thiểu hiệu dụng. Tài xế không tính là một khách gây thêm phạt; mốc cơ sở đã bao gồm tài xế. Quy tắc này thay thế đề xuất cũ chỉ giảm cruise khi quá tải.

**ĐỀ XUẤT tương tác hệ thống:** dùng mức giảm theo từng khách và sàn cruise cấu hình riêng cho từng loại xe; sau đó giới hạn theo min/max hiệu dụng. Phạt quá tải hiện có vẫn giảm max speed và tăng hao xăng; không nhân thêm lần nữa cùng hệ số quá tải vào cruise sau khi đã tính giảm theo khách. Nâng cấp động cơ hiện chỉ tăng max speed theo bảng đã có, chưa tự tăng cruiseSpeed. Đón/cho khách xuống chỉ đổi mốc mục tiêu; vận tốc thực chuyển tiếp êm theo W/S và luật hồi tốc, không nhảy tức thì. Cho khách xuống làm mốc tăng trở lại theo số khách còn trên xe. Mua/thay xe giữ khách, tính lại mốc theo xe mới và tải đang giữ; tốc độ hiện tại được giới hạn về khoảng hợp lệ của xe mới, không gán ngay cruise để nhận cú tăng tốc miễn phí. Hết xăng/coasting và các chuyển động do QTE/nitro điều khiển có ưu tiên riêng, không bị auto-cruise cấp thêm lực kéo. Các thông số giảm/sàn/hồi tốc đều TẠM.

**Mục đích thiết kế:** tạo lựa chọn tốc độ chủ động bên cạnh lái ngang: giữ W để đi nhanh, giữ S để có thêm thời gian đọc tình huống, thả để trở về nhịp chạy mặc định. Playtest phải kiểm tra tải thao tác khi phối hợp WASD với Q/E/F/C/Space; không mặc định giữ phím nhiều hơn đồng nghĩa vui hơn. Help giải thích hành vi giữ/thả W/S; khi lái chỉ hiển thị tốc độ hiện tại, không hiện mốc cruise. Thông số trung vị xem ở kho/khi mua xe.

## Đường, giao lộ và độ khó

**ĐÃ CHỐT:** đường 3 lane nhưng xe lái tự do. Giao lộ có cảnh báo hướng, QTE bắt chọn nhanh; xe tự ôm cua và camera xoay theo. Xe dài như container khó rẽ hơn. Nếu đường thẳng bị chặn phải rẽ. Độ khó tăng theo quãng đường.

**ĐỀ XUẤT:** Q/E hợp lệ sẽ chốt hướng một lần; xe dài có cửa sổ ngắn hơn nhưng vẫn có thời gian phản ứng tối thiểu. Không bấm thì đi thẳng nếu còn thông; nếu buộc rẽ mà bỏ lỡ, xử lý va chạm với vật cản thật, không tự chọn hướng. Thất bại QTE không tạo phạt bí mật. Chỉ sinh tổ hợp có ít nhất một phương án khả thi với xe và tài nguyên hiện có. Tăng mật độ, phối hợp chướng ngại và giảm thời gian phản ứng tới một sàn, không tăng vô hạn.

**Feedback sau P3A:** chủ dự án vẫn thấy game dễ; ghi lại để đánh giá difficulty curve sau khi có thêm hệ thống, chưa tăng mật độ cùng vòng đổi xăng/va chạm. Xăng cần tạo cảm giác hơi thiếu và lần nhặt xăng đem lại sự nhẹ nhõm; thử tăng hao nền vừa phải rồi đo tài nguyên thấp trên nhiều seed, tránh chỉ nâng tốc độ để làm nhịp nhanh.

## Xe, xăng, độ bền và thay xe

**ĐÃ CHỐT:** có xe máy, mô tô, ô tô 4/7 chỗ, ba gác, xe buýt, xe tải, container. Mỗi loại khác tốc độ, sức chứa người, xăng và độ bền. Xe lớn chủ yếu dài hơn; chiều rộng luôn nhỏ hơn 1,5 lane. Giữ tối đa 2 xe. Mua xe thứ ba phải chọn bỏ một xe. Nâng cấp gắn với từng xe; cửa hàng nâng cấp xe đang chạy.

Xăng và độ bền là hai tài nguyên riêng. Nước làm hao xăng; va chạm gây hư hại theo loại. Có vật phẩm xăng và bộ sửa chữa. Hết xăng được trôi thêm một quãng cố định chung cho mọi xe. Xe hỏng hoặc bị tịch thu tự chuyển sang xe dự phòng; không còn xe hợp lệ thì thua.

**Bổ sung đã chốt sau P3A:** đâm xe đang chạy gây sát thương một lần với chiếc xe đó và hất tài xế ra đường. Xe dừng ở vận tốc 0; tài xế tự quay lại xe. Khách đi nhờ cũng ngã, mỗi người có thể quay lại hoặc rời đi theo RNG seed. Trong thời gian tài xế ngã và quay lại, xe/người không nhận damage hay debuff; thời gian vẫn trôi nhưng không cộng quãng đường/tiền. Khi tài xế đã lên xe, tốc độ tăng mượt từ 0 tới trung vị; giữ W làm tăng nhanh hơn. Nếu va chạm làm HP về 0 thì xử lý kết ván/thay xe theo luật tài nguyên, không tự phục hồi xe hỏng. Prototype P3A chỉ có tài xế để xem được bằng mắt; số khách và mất khách sẽ nối với hệ thống P4.

**ĐỀ XUẤT:** hết xăng sau đoạn trôi cũng thử thay xe. Xe hợp lệ phải còn độ bền và xăng; xe bị tịch thu bị loại khỏi kho, xe hỏng/hết xăng vẫn chiếm slot nhưng không được tự chọn lại. Có thể phục hồi bằng vật phẩm trong UI an toàn khi có tài nguyên. Mua xe là giao dịch nguyên tử: chọn slot trước, chỉ trừ tiền khi xác nhận; không cho tồn tại 3 xe dù một frame. Xe mới mua mặc định trở thành xe đang chạy. Thay xe giữ nguyên tiền, vật phẩm và người; không hồi xăng/độ bền miễn phí. Có khoảng bảo vệ ngắn sau thay xe để tránh cùng một collider phá cả hai xe.

## Hành khách, điểm và tiền

**ĐÃ CHỐT:** sức chứa tính cả tài xế. Xe 4 chỗ đủ tải là 1 tài xế + 3 người đi nhờ. Chở quá tải vẫn được nhưng chậm hơn và hao xăng hơn. Giữ nguyên toàn bộ người khi đổi xe, kể cả đổi xuống xe nhỏ. Có thể chủ động cho khách xuống. Mỗi khách tăng một phần nhỏ điểm theo quãng đường và tăng tiền nhận theo quãng đường; các phần tăng cộng tuyến tính theo số khách.

**ĐÃ CHỐT bổ sung:** chở thêm khách giảm tốc độ trung vị ngay cả trong sức chứa; quá tải tiếp tục chịu hậu quả đã có. Người chơi cân nhắc thưởng/thu nhập theo quãng đường so với nhịp di chuyển chậm hơn. Giữ W vẫn có thể tăng khỏi mốc trung vị đang chịu tải, tới max hiệu dụng; chưa bổ sung phạt max speed khi xe còn trong sức chứa. Cân bằng phải kiểm tra thu nhập ròng theo phút và xăng trên quãng đường, không chỉ nhìn thưởng mỗi mét; không mặc định càng đông khách càng lời hoặc càng ít khách càng tốt.

**ĐỀ XUẤT:** tài xế không thể bỏ xuống và không tính thưởng; dùng `riders` cho người đi nhờ, `occupants = 1 + riders` cho tổng người. Đón bằng F gần NPC; xe chết máy cho thêm khách/vật phẩm qua sự kiện va chạm riêng có giới hạn một lần. Cho khách xuống qua Tab, không nhận tiền tức thì. Hệ thống quá tải không cấm đón khách; có trần kỹ thuật để bảo vệ hiệu năng, không thay thế sức chứa thiết kế.

Điểm và thu nhập chỉ cộng khi tiến thêm quãng đường hợp lệ, không cộng theo thời gian đứng trong UI, đoạn camera quay hay đổi xe. Công thức và mức phạt ở BALANCE_CONFIG.md. Bảng xếp hạng ghi điểm ngay lúc ván kết thúc, kể cả secret ending.

**ĐÃ CHỐT — mục tiêu economy:** người chơi có cơ hội mua ô tô đầu tiên sau khoảng **1–1,5 phút thời gian gameplay hoạt động** trong một lượt chơi đại diện; không tính thời gian đọc Help/pause/shop và không bảo đảm mọi seed/chiến thuật đều đạt mốc này. Đây là mục tiêu trải nghiệm, chưa phải bộ giá/thu nhập đã cân bằng. Với auto-cruise, phải đo riêng lượt chạy chủ yếu ở cruise, giữ W thường xuyên và chủ động hãm S; không cân economy chỉ theo max speed hoặc buộc luôn giữ W mới tiếp cận được xe đầu tiên. Thay đổi lớn về giá, thu nhập hay chi phí vẫn trình chủ dự án trước khi áp dụng.

**Cập nhật economy theo yêu cầu mới 17/10/2026:** mục tiêu 1–1,5 phút thay thế mốc 3–5 phút trước đó. P2 thử thu nhập nền **0,50 tiền/m** thay 0,15; giữ tiền đầu 200 và giá ô tô 4 chỗ 800. Cần thêm 600 tiền (~1.200 m khi chưa mất tiền): khoảng 85,7 giây ở cruise hoặc 60 giây ở max sau khi đạt tốc độ đó. Số TẠM; P2 chưa có shop nên chỉ đo đủ tiền, chưa mua thật. Thời gian tính gameplay hoạt động; khách, chi phí và cơ hội gặp shop sẽ được kiểm chứng lại ở P4–P5.

## Chướng ngại và cửa hàng

| Sự kiện đã chốt | Hậu quả |
|---|---|
| Vũng nước một phần hoặc cả 3 lane | Hao xăng |
| Ổ gà / ổ voi | Mất độ bền và rơi một phần tiền |
| Xe đang di chuyển | Va chạm mất độ bền |
| Xe chết máy | Va chạm có thêm khách, có thể có vật phẩm |
| Kẹt xe 2–3 lane | Né lane còn lại hoặc rẽ nếu bị chặn hết |
| Chắn tàu | Rẽ, giảm tốc chờ khe vượt, hoặc nhảy có nitro; đụng tàu kết thúc ván ngay |
| Tai nạn giữa hai xe đang chạy | Sinh ngẫu nhiên có cảnh báo; đụng làm độ bền về 0, thay xe hoặc thua |
| Công an | Tịch thu xe và phạt tiền cố định |
| Dân phòng | Phạt tiền, không tịch thu xe |

**ĐỀ XUẤT về điểm mơ hồ:** mức phạt không tăng theo tiền người chơi hay quãng đường. Nếu không đủ tiền khi gặp công an: lấy tiền còn lại, tịch thu xe hiện tại; nếu có xe dự phòng hợp lệ thì trừ 50% lượng xăng hiện có của xe đó rồi tự chuyển; không có thì thua. Đây là lựa chọn nhánh “xe 2 giảm nửa xăng” mà chủ dự án còn để mở, cần xác nhận khi playtest. Nếu thiếu tiền phạt dân phòng: lấy tới 0, không tịch thu, không tạo nợ, vẫn chạy. Mọi giao dịch không cho tiền âm.

**ĐÃ CHỐT:** cửa hàng ở ven đường, có RNG vừa phải; nâng cấp chỉ gắn xe đang chạy. **ĐỀ XUẤT:** cảnh báo sớm, C trong vùng tiếp cận mở UI an toàn; mua xăng, sửa chữa, vật phẩm, xe và nâng cấp theo danh mục. RNG có seed, trọng số, giới hạn chuỗi xấu, khoảng cách bảo đảm tiếp tế. Không đổi hàng khi mở lại cùng cửa hàng; không ép người chơi cần nitro khi không thể có nitro.

## Secret ending — bốn bước đúng thứ tự

**ĐÃ CHỐT:** (1) mua ô tô 4 chỗ khi không chở khách → (2) đón thêm đủ 3 khách trong chuyến chạy → (3) nitro boost qua một đoàn tàu → (4) đâm vào một vụ tai nạn giao thông. Đủ chuỗi thì kết ván, badge “đã về nhà”, ghi điểm lúc đó.

**ĐỀ XUẤT bảo thủ:** “không chở khách” vẫn có tài xế; bước 2 tính 3 người thực sự ở trên xe, không tính 3 lượt đón rồi cho xuống. Phải giữ chiếc ô tô đã mua làm xe đang chạy và giữ 3 khách tới hết chuỗi; đổi/bỏ xe hoặc thay đổi số khách làm reset chuỗi. Sự kiện ngoài thứ tự không tiến bước; không reset chỉ vì chạy qua sự kiện không liên quan. Nhảy chỉ tính khi bay qua và hạ cánh an toàn ở phía bên kia một đoàn tàu thật, không tính bấm Space gần đường ray. Bước 4 phải là collider của vụ tai nạn đã sinh. Khi hợp lệ, secret ending được xét trước hư xe/thay xe; va chạm tàu vẫn thua ngay. Chuỗi không qua nhiều ván, không tự bắt đầu với xe có sẵn đầu ván. Các quy tắc giữ xe/khách là đề xuất, không suy diễn thành quyết định lịch sử.

## Trải nghiệm và tiêu chí hoàn thành

HUD có tốc độ hiện tại, quãng đường, điểm và tiền phủ trực tiếp lên gameplay, không chiếm một vùng bảng riêng; xăng/độ bền tối giản gần xe, tránh thân xe và hành lang phía trước. Không hiện cruise khi lái; xem ở kho/khi mua. Số người/tải, xe dự phòng và vật phẩm trình bày gọn theo ngữ cảnh; cảnh báo/QTE dùng Graphic UI trong màn chơi. Low-poly rõ silhouette, mưa không che tín hiệu nguy hiểm. Không chỉ dựa vào màu; có icon/chữ/hướng. Kết ván nêu nguyên nhân, điểm, quãng đường và badge nếu đạt. Không dùng nội dung mở khóa để ép chơi lại.

Một bản chơi được cần đủ vòng chạy–tương tác–mua–thay xe–kết ván; mọi quy tắc phải có test hoặc kiểm tra thủ công phù hợp, không chỉ cảnh demo chạy hình.

## Art direction và quy trình hình ảnh

**ĐÃ CHỐT:** hình ảnh low-poly/isometric là tham chiếu phong cách; mood tối hơn, saturation thấp hơn nhưng vẫn vui tươi, đồng thời thể hiện rõ mưa bão và hành trình khó khăn. Tham chiếu đính kèm là nguồn về phong cách tạo hình/đọc khối; không phải chỉ thị để sao chép nguyên xi bố cục hay màu sắc.

**ĐÃ CHỐT về quy trình:** các prototype đầu chỉ dùng placeholder tối giản nhất có thể, ưu tiên primitive/geometry đơn sắc và hiệu ứng mưa nhẹ; tiết kiệm công tạo art. UI và cảnh báo vẫn phải đủ rõ để đánh giá gameplay. Chỉ tạo art hoàn chỉnh/chuyên biệt và ghép vào game ở các bước cuối sau khi chủ dự án đồng ý rõ ràng. Không tự sinh bộ asset hoặc tích hợp art production-ready trong prototype.

**ĐỀ XUẤT art direction:** nền xanh xám, slate và tím xám; điểm nhấn ấm nhỏ ở đèn xe/cửa hàng để giữ thân thiện. Dùng tương phản sáng tối và silhouette trước, màu sau. Mưa, mặt đường ướt, nước ngập và mây giông gợi gian khó; biểu cảm hình khối, cây/công trình và hoạt họa vẫn ngộ nghĩnh. Tránh phủ một lớp tối làm chìm xe, NPC, QTE hoặc hazard. Các màu cụ thể là gợi ý, chưa chốt palette.

## Art direction gate — đánh giá như art director

Trước khi xin duyệt bước tạo/ghép art cuối, chuẩn bị một cảnh đại diện trong build và bảng đánh giá riêng cho từng tiêu chí dưới đây, thang 1–10, kèm ảnh/build, nhận xét cụ thể và ít nhất một đề xuất sửa cho điểm dưới 8. Đây là review có người xem hiện vật; Codex có thể tự chấm sơ bộ nhưng phải ghi rõ đó là tự đánh giá, không giả lập ý kiến của art director độc lập.

| Tiêu chí | Điều cần đánh giá |
|---|---|
| Đọc hình / silhouette | Xe, người, đường và hazard nhận ra nhanh ở góc camera thực |
| Giá trị sáng tối và độ tương phản | Phân tầng mặt đường, xe, UI; điểm nguy hiểm không chìm |
| Màu sắc, saturation và mood | Trầm, giảm saturation, ra mưa bão nhưng vẫn ấm áp/vui tươi |
| Ngôn ngữ hình khối low-poly | Đơn giản, nhất quán, nhìn sạch ở góc isometric/3D |
| Ánh sáng, thời tiết và vật liệu | Mưa/đường ướt có không khí mà không gây nhiễu hoặc che tầm nhìn |
| UI, typography và phân cấp | Fuel, durability, tiền, hành khách, QTE đọc được khi đang lái |
| Nhất quán phong cách | Xe, môi trường, VFX và UI cùng một thế giới thị giác |
| Khả năng tiếp cận và hiệu năng | Không phụ thuộc riêng màu sắc; chạy rõ và ổn ở kích thước desktop mục tiêu |

**Ngưỡng:** tiêu chí nào dưới 6/10 là **CHƯA ĐẠT** và cần sửa, chấm lại trước khi chấp nhận art direction hoặc chuyển sang ghép art cuối. Điểm 6–7 đạt ngưỡng tối thiểu nhưng cần ghi vấn đề; 8–10 không thay thế kiểm tra gameplay/hiệu năng. Không lấy trung bình để che tiêu chí dưới 6. Chỉ bắt đầu tạo và tích hợp art hoàn chỉnh sau khi có bảng đánh giá, không còn tiêu chí dưới 6, và chủ dự án đồng ý rõ ràng cho bước đó.

## Âm thanh và nhịp độ

**ĐỀ XUẤT:** âm thanh xây cảm giác chuyển động và cảnh báo, nhưng không làm người chơi mệt. Nền là mưa gió/đường ướt nhẹ; động cơ đổi cao độ theo tốc độ; mỗi loại nguy hiểm có tín hiệu ngắn, khác nhau và nghe được qua nền. QTE giao lộ có cue báo trước và cue xác nhận hướng; cửa hàng, nhặt vật phẩm, nitro, va chạm và thay xe có âm thanh riêng. Nitro/đoàn tàu/tai nạn có thể tạo khoảnh khắc âm thanh “wow” bằng khoảng lặng ngắn rồi nhấn âm trầm/impact có kiểm soát, không lạm dụng.

Trong prototype, dùng Web Audio oscillator/noise hoặc âm thanh placeholder rất ngắn, âm lượng thấp; không sản xuất nhạc hay thư viện SFX hoàn chỉnh. Có nút mute/volume tách nhạc, hiệu ứng và môi trường; cảnh báo quan trọng vẫn phải có biểu tượng/chữ/hình ảnh để không phụ thuộc âm thanh. Tránh tiếng còi/âm cao lặp liên tục. **ĐỀ XUẤT** phân lớp nhạc: loop nền có nhịp vừa phải, thêm lớp tiết tấu khi difficulty tăng; chừa khoảng trống cho cues. Nhạc và SFX production-ready chỉ tạo/tích hợp cùng giai đoạn art cuối sau khi chủ dự án đồng ý rõ.

Độ căng phải đến từ quyết định và bố cục nguy hiểm có thể đọc trước, không từ spawn bất khả thi. Dùng thử nghiệm chơi để kiểm tra người chơi phải tập trung mà vẫn cảm thấy công bằng: cảnh báo trước va chạm, không chồng quá nhiều cue, có nhịp thở ngắn sau chuỗi thử thách và thất bại giải thích được.

## Hướng dẫn lần đầu, thẻ khám phá và phản hồi sự kiện

**ĐÃ CHỐT:** lần đầu chơi có hướng dẫn input; cơ chế gameplay và từng loại chướng ngại có thẻ giải thích khi xuất hiện lần đầu. Người chơi có thể đóng thẻ sau khi đọc; nếu không thao tác, thẻ tự đóng sau đủ thời gian. Tương tác vật phẩm, skill và chướng ngại có popup nhỏ xác nhận hành động/sự kiện, kèm hình minh họa vui và lời thoại có nhiều biến thể (ví dụ gặp công an: hình công an tuýt còi, “Chạy đâu cho thoát con”). SFX phù hợp sẽ được thêm sau.

**ĐỀ XUẤT triển khai:** hướng dẫn input ngắn ở safe start, có thể bỏ qua; giới thiệu từng input bằng prompt theo ngữ cảnh thay vì dồn một màn dài. Card lần đầu xuất hiện trong vùng an toàn trước khi chướng ngại có thể gây va chạm; không bật card che đúng lúc QTE hoặc lái xe nguy hiểm. Card giải thích cơ chế có nút đóng rõ và timeout; nếu game đang chạy thì ngừng sinh nguy hiểm mới cho đến khi card đóng, hoặc mở card ở safe window. Sau lần đầu, chỉ hiện cue ngắn; nội dung hướng dẫn xem lại trong Help/Pause.

Cập nhật theo feedback P2: phản hồi chính là VFX/SFX cue và UI tại chỗ (nhấn tài nguyên, icon, số biến động ngắn), không dùng bảng log chữ khi lái. Popup caption chỉ là điểm nhấn tùy chọn, tự đóng nhanh, không pause; tránh xe, QTE, tài nguyên và hành lang né. Không bắt buộc caption cho mọi va chạm/pickup. Có cooldown và hàng đợi gộp sự kiện để không spam; sự kiện gameplay vẫn rõ nếu popup bị bỏ qua. Mỗi loại event có 3–4 dòng thoại đã duyệt, chọn có kiểm soát, tránh lặp liên tiếp; ngôn từ vui, ngắn, không miệt thị người chơi. Hình và SFX giai đoạn đầu là placeholder nhẹ; tạo hình minh họa hoàn chỉnh và thêm SFX sản xuất sau theo gate đồng ý giai đoạn cuối. Lời thoại công an dưới đây là ví dụ minh họa tone, không bắt buộc chỉ có một câu:

- “Chạy đâu cho thoát con!”
- “Tấp vào lề nào, tay lái lụa!”
- “Bữa nay hết đường luồn nhé!”
- “Giấy tờ với xe… mời làm việc!”

**ĐỀ XUẤT lưu trạng thái:** đánh dấu card đã đọc theo profile local để không lặp giữa các ván; có thể mở lại từ Help. Nếu local storage bị xóa/hỏng, card được phép hiện lại. Bật/tắt phụ đề và tùy chọn giảm/chặn popup là lựa chọn accessibility hữu ích.

## Review sau mỗi vòng simulation/playtest

**ĐÃ CHỐT quy trình:** sau mỗi vòng simulation hoặc test gameplay, có hai lượt đánh giá riêng trước khi chuyển sang vòng cân bằng/UX tiếp theo:

1. **Game designer:** đọc kết quả thực (build/seed/kịch bản, hành vi, điểm số và nguyên nhân thất bại nếu có); đánh giá nhịp độ, độ khó, tính công bằng, lựa chọn chiến thuật, RNG và mức vui; đưa đề xuất cân bằng cụ thể kèm lý do, tác động dự kiến và cách xác minh ở lần thử sau. Phân biệt dữ kiện đo được với nhận định. Sau đó hỏi ý kiến chủ dự án về đề xuất trước khi thay đổi các thông số/cơ chế ảnh hưởng lớn.
2. **UI/UX designer:** rà lại luồng thao tác, khả năng đọc HUD/cảnh báo/QTE, onboarding/cards, popup và mức cản trở khi lái; xem xét animation UI về thời gian, easing, ưu tiên và khả năng tắt/giảm chuyển động. Đưa đề xuất có mức ưu tiên và cách kiểm tra. Prototype chỉ cần UI đơn giản, rõ ràng; chưa đánh bóng thị giác/animation hoàn chỉnh.

Vai trò có thể do Codex đảm nhiệm như các góc review; phải ghi rõ nếu tự đánh giá từ dữ liệu hiện có, không tự nhận là chuyên gia độc lập đã xem test live. Báo cáo review không được biến đề xuất thành cơ chế đã chốt. Không cần chờ ý kiến cho sửa lỗi hiển thị hiển nhiên hoặc thay đổi reversible nhỏ; với thay đổi cân bằng lớn hoặc đổi hành vi UX đã thống nhất, trình đề xuất và hỏi ý kiến trước khi áp dụng.

**Công cụ tùy chọn:** khi đã có prototype UI chạy được và plugin Product Design đang kết nối, dùng Product Design audit cho onboarding/flow/màn hình dựa trên ảnh chụp hiện tại. Ghi bước, ảnh và phát hiện UX/accessibility gắn với bằng chứng. Ảnh không chứng minh được cảm giác lái, timing input hay fairness; các phần đó phải được chơi thử trực tiếp. Nếu plugin/tool không sẵn có, tiếp tục checklist UI/UX thủ công và ghi giới hạn.

## Cập nhật sau feedback P2 — UI và giao thông

**ĐÃ CHỐT theo yêu cầu chủ dự án:** HUD phủ gameplay; xăng/HP gần xe; không hiện cruise khi lái; cảnh báo/QTE dùng graphic và phản hồi tại chỗ, hạn chế bảng chữ. Traffic trái ngược chiều, phải cùng chiều, giữa chọn hướng seeded theo hệ quy chiếu người chơi; hazard nhiều size/chiều dài, có thể chiếm 2–3 lane. Traffic có loại, sát thương và HP khác nhau để xe lớn có thể húc phá. Thông số và điều kiện cụ thể còn ĐỀ XUẤT/TẠM.

Đặc tả, ràng buộc công bằng, phân kỳ P2.1/P3A/P3B/P4.1 và kế hoạch kiểm chứng: [DESIGN_UPDATE_IMMERSION_TRAFFIC.md](DESIGN_UPDATE_IMMERSION_TRAFFIC.md). Build P2.0 chưa triển khai các thay đổi này. Mẫu phủ kín đường cần giải pháp hợp lệ; chưa có thì cấm sinh. Không tự coi xe bị húc là tai nạn kích hoạt secret.
