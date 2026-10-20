# Đường Về Nhà — Game Design

> **Quyết định 20/10/2026:** bản chơi chính tại `/` dùng luật lực của `ver.force`, bao gồm phản lực va chạm NPC/traffic/đồ rơi và điều khiển xe lớn. `ver.noforce.html` giữ nguyên làm backup. Các hệ số lực, sát thương và economy vẫn TẠM; các đoạn ghi “bản thử riêng” phía dưới là lịch sử trước quyết định này.

> **Thiết kế hiện hành P6.1:** xem DESIGN_MOVING_EVENTS_TRAFFIC.md. Feedback mới thay mô hình tàu/công an bật-tắt chắn toàn đường của bản P6; phần mô tả P6 phía dưới là lịch sử implementation, chưa phải cơ chế chuyển động đã nghiệm thu. Chưa sửa runtime trong lượt cập nhật design này.

## Trạng thái và nguồn quyết định

Tài liệu tổng hợp yêu cầu của chủ dự án trong hội thoại “Start coding with Codex” và yêu cầu bàn giao ngày 17/10/2026. Các câu trả lời cũ của assistant chỉ còn tham chiếu, không có nội dung để kiểm chứng; không coi lời khuyên bị thiếu là quyết định đã chốt.

- **ĐÃ CHỐT**: cơ chế được yêu cầu trực tiếp. Thay đổi cần chủ dự án đồng ý.
- **ĐỀ XUẤT**: cách giải quyết chỗ chưa rõ, dùng làm mặc định triển khai và có thể chỉnh sau chơi thử.
- **TẠM**: mọi con số cân bằng trong BALANCE_CONFIG.md, chưa phải kết quả playtest.

**Cập nhật đã chốt ngày 17/10/2026:** chủ dự án yêu cầu mỗi loại xe có tốc độ trung vị và tự trở về tốc độ này khi thả W/S; mục tiêu có cơ hội mua ô tô đầu tiên sau khoảng 1–1,5 phút. Các thay đổi này thay thế mô tả điều khiển cũ. Báo cáo P1 trước cập nhật vẫn là bằng chứng lịch sử, không chứng minh cơ chế mới đã được triển khai.

## Tầm nhìn và phạm vi

**BẢN THỬ ver.force — điều khiển xe lớn:** xe buýt lấy trục sau làm điểm bám tương đối, để đầu xe quét ra ngoài khi đánh lái; cảm giác quét được làm nặng hơn nhẹ so với bản thử đầu. Xe tải dùng cùng kiểu bám trục sau nhưng quét đầu ít hơn buýt. Container của người chơi tách thành đầu kéo và rơ-moóc nối bằng khớp: đầu kéo đổi hướng trước, bánh sau rơ-moóc bám theo có độ trễ và có thể lệch khỏi vệt đầu kéo. Container có hai vùng va chạm; cùng một chướng ngại gây sát thương chỉ trừ HP một lần: đầu chạm trước nhận đủ, rơ-moóc chạm trước nhận nửa. Vũng nước và ổ gà chỉ tác động khi đầu kéo chạm. Container chướng ngại giữ model và vùng va chạm một khối. Giữ A/D ở mép đường vẫn duy trì góc lái cho tới khi thả phím; ở tốc độ chậm góc nhỏ hơn. Bản noforce giữ cách lái cũ để đối chiếu. Số góc/quán tính hiện là TẠM, chưa duyệt cân bằng cho game chính.

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
| Space | Nhảy khi nitro đang boost và xe ở mặt đường; bấm riêng, không tự nhảy khi dùng món |
| 1 / 2 | Dành cho hai ô vật phẩm mới từ P5.1; P5 hiện chưa có món để dùng |
| F | Đón/tương tác hành khách đủ gần |
| G | Cho đúng một khách đang đi nhờ xuống xe, không mở menu và không dừng ván |
| R | Vào cửa hàng ven đường khi đủ điều kiện; C không còn được dùng |
| Tab | Đổi nhanh xe đang chạy khi có xe dự phòng, không mở popup |

**ĐỀ XUẤT:** S hãm tới tốc độ tối thiểu, không chạy lùi. “Tự do tới lui” được hiểu là điều chỉnh tốc độ dọc và vị trí ngang, không lùi ngược đường endless. UI chỉ báo hành động khả dụng. Cửa hàng tạm dừng mô phỏng trong ván đơn; Tab đổi nhanh xe hợp lệ, không mở UI. Không cho tương tác cửa hàng từ bất cứ đâu. Không có nitro thì không nhảy; cách kích hoạt nhảy mới cần thử ở P5.1.

### Tốc độ trung vị và thao tác giữ phím

**ĐÃ CHỐT:** mỗi loại xe có một tốc độ trung vị (`cruiseSpeed`), là tốc độ tự chạy khi người chơi không giữ W/S. Đây là mốc điều khiển của xe, không phải trung bình thống kê của tốc độ trong ván. Nếu đang nhanh hơn mốc này, thả phím sẽ tự giảm tốc về mốc; nếu đang chậm hơn, thả phím sẽ tự tăng tốc về mốc. Người chơi phải tiếp tục giữ W hoặc S để duy trì tốc độ cao/thấp hơn mốc. Không còn cơ chế thả W để giữ nguyên tốc độ hiện tại hoặc mặc định thả phím chạy ở tốc độ tối thiểu.

**ĐỀ XUẤT triển khai:** tốc độ hồi về thay đổi từ từ, có gia tốc/giảm tốc riêng; không giật tức thì, không vượt qua rồi dao động quanh mốc. W tăng tới giới hạn tối đa, S hãm tới giới hạn tối thiểu; nhấn W+S ưu tiên S. Chỉ giữ A/D vẫn được coi là thả W/S. Bắt đầu ván ở tốc độ trung vị. Pause/focus/Help không chạy quá trình hồi tốc; khi tiếp tục, input giữ cũ đã được xóa, tốc độ tiếp tục từ trạng thái đã pause và hồi về mốc nếu chưa nhấn lại W/S.

**ĐÃ CHỐT — ảnh hưởng hành khách:** tốc độ trung vị giảm dần khi số khách đi nhờ đang ở trên xe tăng, kể cả khi chưa quá tải. Mỗi loại xe có mức giảm và sàn trung vị riêng: xe có thể chạm tốc độ tối thiểu hoặc dừng giảm ở mức cao hơn, tùy đặc tính xe, số khách và giới hạn tốc độ hiệu dụng trong tình huống hiện tại. Trước khi chạm sàn, mỗi khách thêm làm giảm mốc; sau sàn, mốc không giảm thêm và không bao giờ xuống dưới tốc độ tối thiểu hiệu dụng. Tài xế không tính là một khách gây thêm phạt; mốc cơ sở đã bao gồm tài xế. Quy tắc này thay thế đề xuất cũ chỉ giảm cruise khi quá tải.

**ĐỀ XUẤT tương tác hệ thống:** dùng mức giảm theo từng khách và sàn cruise cấu hình riêng cho từng loại xe; sau đó giới hạn theo min/max hiệu dụng. Phạt quá tải hiện có vẫn giảm max speed và tăng hao xăng; không nhân thêm lần nữa cùng hệ số quá tải vào cruise sau khi đã tính giảm theo khách. Nâng cấp động cơ hiện chỉ tăng max speed theo bảng đã có, chưa tự tăng cruiseSpeed. Đón/cho khách xuống chỉ đổi mốc mục tiêu; vận tốc thực chuyển tiếp êm theo W/S và luật hồi tốc, không nhảy tức thì. Cho khách xuống làm mốc tăng trở lại theo số khách còn trên xe. Mua/thay xe giữ khách, tính lại mốc theo xe mới và tải đang giữ; tốc độ hiện tại được giới hạn về khoảng hợp lệ của xe mới, không gán ngay cruise để nhận cú tăng tốc miễn phí. Hết xăng/coasting và các chuyển động do QTE/nitro điều khiển có ưu tiên riêng, không bị auto-cruise cấp thêm lực kéo. Các thông số giảm/sàn/hồi tốc đều TẠM.

**Mục đích thiết kế:** tạo lựa chọn tốc độ chủ động bên cạnh lái ngang: giữ W để đi nhanh, giữ S để có thêm thời gian đọc tình huống, thả để trở về nhịp chạy mặc định. Playtest phải kiểm tra tải thao tác khi phối hợp WASD với Q/E/F/C/Space; không mặc định giữ phím nhiều hơn đồng nghĩa vui hơn. Help giải thích hành vi giữ/thả W/S; khi lái chỉ hiển thị tốc độ hiện tại, không hiện mốc cruise. Thông số trung vị xem ở kho/khi mua xe.

## Đường, giao lộ và độ khó

**ĐÃ CHỐT:** đường 3 lane nhưng xe lái tự do. Giao lộ có cảnh báo hướng, QTE bắt chọn nhanh; xe tự ôm cua và camera xoay theo. Xe dài như container khó rẽ hơn. Nếu đường thẳng bị chặn phải rẽ. Độ khó tăng theo quãng đường.

**ĐỀ XUẤT:** Q/E hợp lệ sẽ chốt hướng một lần; xe dài có cửa sổ ngắn hơn nhưng vẫn có thời gian phản ứng tối thiểu. Không bấm thì đi thẳng nếu còn thông; nếu buộc rẽ mà bỏ lỡ, xử lý va chạm với vật cản thật, không tự chọn hướng. Thất bại QTE không tạo phạt bí mật. Chỉ sinh tổ hợp có ít nhất một phương án khả thi với xe và tài nguyên hiện có. Tăng mật độ, phối hợp chướng ngại và giảm thời gian phản ứng tới một sàn, không tăng vô hạn.

**ĐÃ CHỐT sau feedback giao lộ:** chướng ngại đã thấy trên đường thẳng giữ nguyên vị trí khi chọn rẽ; nhánh được chọn có bộ chướng ngại riêng theo seed và hướng rẽ. Đường cũ, giao lộ và vật thể của nó chỉ được thu hồi khi đã ra khỏi vùng nhìn phía sau xe. Không sao chép hoặc bẻ vị trí chướng ngại đường thẳng sang nhánh mới.

**Feedback sau P3A:** chủ dự án vẫn thấy game dễ; ghi lại để đánh giá difficulty curve sau khi có thêm hệ thống, chưa tăng mật độ cùng vòng đổi xăng/va chạm. Xăng cần tạo cảm giác hơi thiếu và lần nhặt xăng đem lại sự nhẹ nhõm; thử tăng hao nền vừa phải rồi đo tài nguyên thấp trên nhiều seed, tránh chỉ nâng tốc độ để làm nhịp nhanh.

## Xe, xăng, độ bền và thay xe

**ĐÃ CHỐT:** có xe máy, mô tô, ô tô 4/7 chỗ, ba gác, xe buýt, xe tải, container. Mỗi loại khác tốc độ, sức chứa người, xăng và độ bền. Xe lớn chủ yếu dài hơn; chiều rộng luôn nhỏ hơn 1,5 lane. Giữ tối đa 2 xe. Mua xe thứ ba phải chọn bỏ một xe. Không mua thêm loại xe đang sở hữu, kể cả định bỏ chính loại đó để mua lại. Nâng cấp gắn với instance được chọn trong hai xe đang sở hữu; nâng xe dự phòng không tự equip hay hồi tài nguyên.

**ĐÃ CHỐT — danh mục xe giao thông:** xe chướng ngại cũng có đầy đủ các loại tương ứng với xe người chơi: xe máy, mô tô, ô tô 4/7 chỗ, ba gác, xe buýt, xe tải và container. Mỗi loại có HP, sức chịu va chạm và mức sát thương phù hợp với kích thước/khối lượng của chính loại đó; không coi mọi xe chướng ngại là một xe nhỏ đổi màu. Khi thiết kế bổ sung một loại xe cho người chơi, đồng thời bổ sung biến thể xe giao thông tương ứng vào danh mục thiết kế và kế hoạch kiểm thử. Bản P4.1 mở rộng đã có đủ tám loại với placeholder riêng; các số HP/sát thương/trọng số spawn hiện là TẠM và có thể cân riêng cho hai vai trò để giữ đường đi khả thi và húc phá có chi phí.

Xăng và độ bền là hai tài nguyên riêng. Nước làm hao xăng; va chạm gây hư hại theo loại. Có vật phẩm xăng và bộ sửa chữa. Hết xăng được trôi thêm một quãng cố định chung cho mọi xe. Xe hỏng hoặc bị tịch thu tự chuyển sang xe dự phòng; không còn xe hợp lệ thì thua.

**Bổ sung đã chốt sau P3A:** đâm xe đang chạy gây sát thương một lần với chiếc xe đó và hất tài xế ra đường. Xe dừng ở vận tốc 0; tài xế tự quay lại xe. Khách đi nhờ cũng ngã, mỗi người có thể quay lại hoặc rời đi theo RNG seed. Trong thời gian tài xế ngã và quay lại, xe/người không nhận damage hay debuff; thời gian vẫn trôi nhưng không cộng quãng đường/tiền. Khi tài xế đã lên xe, tốc độ tăng mượt từ 0 tới trung vị; giữ W làm tăng nhanh hơn. Nếu va chạm làm HP về 0 thì xử lý kết ván/thay xe theo luật tài nguyên, không tự phục hồi xe hỏng. Prototype P3A chỉ có tài xế để xem được bằng mắt; số khách và mất khách sẽ nối với hệ thống P4.

**Chỉnh theo feedback tiếp theo:** xe không dừng tức thì lúc đâm; nó trôi giảm tốc một đoạn, trượt lệch nhẹ khỏi xe va chạm rồi mới về 0. Tài xế văng tiến về phía trước và lệch sang bên xa xe hơn, sau đó tự quay lại. Trong toàn bộ giai đoạn trôi/ngã/quay lại vẫn miễn damage/debuff và không thưởng điểm/tiền cho quãng trôi ngoài điều khiển. Quãng đường thực vẫn tăng trên HUD. Xe máy thử bình 5,5 L và hao 0,0045 L/m; khi có nhiều xe, mỗi loại cần `fuelCapacity`, `fuelPerMeter` và mức nhặt xăng phù hợp riêng trong `VehicleDefinition`, không sao chép số xe máy. Cần mô phỏng với tốc độ/tải/hazard của từng xe và kiểm tra khả năng tới tiếp tế, tỷ lệ mua xe đầu, tần suất hết xăng.

**ĐÃ CHỐT cho prototype sau:** sau khi văng khỏi xe, tài xế nằm/ngã tại chỗ một nhịp, rồi đứng dậy và mới bắt đầu chạy về xe. Animation hoàn chỉnh sau này thể hiện rõ ba pha ngã xoài → đứng dậy → chạy; simulation phải có thời gian dừng tương ứng trước khi bắt đầu pha quay lại. Xe vẫn trôi đến khi dừng, thời gian miễn damage/debuff phủ toàn bộ chuỗi và không hồi tốc trước khi tài xế đã lên xe.

**ĐÃ CHỐT cho vòng cân bằng sau:** bình xăng và hộp sửa nhặt trên đường đang hồi quá nhiều so với sức chứa xe máy hiện tại. Giảm lượng hồi của cả hai để nhặt vật phẩm giúp thoát nguy trước mắt nhưng không mặc nhiên đưa xăng/độ bền về đầy. Cân mức hồi theo từng loại xe và cảm giác thiếu xăng mong muốn; giữ đường tới nguồn tiếp tế khả thi và kiểm tra lại khả năng mua xe đầu sau 1–1,5 phút. Chưa đổi số của bản P3A đang chơi.

**ĐỀ XUẤT:** hết xăng sau đoạn trôi cũng thử thay xe. Xe hợp lệ phải còn độ bền và xăng; xe bị tịch thu bị loại khỏi kho, xe hỏng/hết xăng vẫn chiếm slot nhưng không được tự chọn lại. Có thể phục hồi bằng vật phẩm trong UI an toàn khi có tài nguyên. Mua xe là giao dịch nguyên tử: chọn slot trước, chỉ trừ tiền khi xác nhận; không cho tồn tại 3 xe dù một frame. Xe mới mua mặc định trở thành xe đang chạy. Thay xe giữ nguyên tiền, vật phẩm và người; không hồi xăng/độ bền miễn phí. Có khoảng bảo vệ ngắn sau thay xe để tránh cùng một collider phá cả hai xe.

## Hành khách, điểm và tiền

**ĐÃ CHỐT:** sức chứa tính cả tài xế. Xe 4 chỗ đủ tải là 1 tài xế + 3 người đi nhờ. Chở quá tải vẫn được nhưng chậm hơn và hao xăng hơn. Giữ nguyên toàn bộ người khi đổi xe, kể cả đổi xuống xe nhỏ. Có thể chủ động cho khách xuống. Mỗi khách tăng một phần nhỏ điểm theo quãng đường và tăng tiền nhận theo quãng đường; các phần tăng cộng tuyến tính theo số khách.

**ĐÃ CHỐT bổ sung:** chở thêm khách giảm tốc độ trung vị ngay cả trong sức chứa; quá tải tiếp tục chịu hậu quả đã có. Người chơi cân nhắc thưởng/thu nhập theo quãng đường so với nhịp di chuyển chậm hơn. Giữ W vẫn có thể tăng khỏi mốc trung vị đang chịu tải, tới max hiệu dụng; chưa bổ sung phạt max speed khi xe còn trong sức chứa. Cân bằng phải kiểm tra thu nhập ròng theo phút và xăng trên quãng đường, không chỉ nhìn thưởng mỗi mét; không mặc định càng đông khách càng lời hoặc càng ít khách càng tốt.

**ĐÃ CHỐT bổ sung:** F đón khách đủ gần; G cho đúng một khách xuống ngay trong lúc lái, không mở menu và không nhận tiền tức thì. Khách bị G đá bay ngang ra theo phong cách hài hước trước khi chạm đất; vị trí và thời gian bay không được làm mất khả năng đọc đường. Tab đổi nhanh giữa xe đang chạy và xe dự phòng hợp lệ khi hệ nhiều xe được triển khai; P4A chỉ có một xe nên Tab chưa có tác dụng. Tài xế không thể bỏ xuống và không tính thưởng; dùng `riders` cho người đi nhờ, `occupants = 1 + riders` cho tổng người. Hệ thống quá tải không cấm đón khách; có trần kỹ thuật để bảo vệ hiệu năng. Khi va xe, cả tài xế và khách đều văng ra. Khách quay lại theo RNG phải có chuyển động leo lại; khách không quay lại vẫn hiện bên đường và có thể đứng yên/đi lững thững trong bán kính 1,5 m quanh vị trí gốc, nhưng **không thể được đón lại bằng F**. Entity của họ phải tồn tại từ lúc văng, tiếp tục ở cùng vị trí sau khi tài xế quay lại, không biến mất rồi tái xuất hiện cạnh xe. Chỉ các khách chờ thông thường và khách do người chơi chủ động cho xuống mới có thể đón lại theo quy tắc thường. Cờ không thể đón lại phải tồn tại sau khi tài xế lên xe và không tự reset theo thời gian. Chuyển động phải có seed, chậm và được phản ánh trong vùng F để tăng thử thách mà không tạo bất ngờ thiếu công bằng. Trên xe mở như xe máy, mô tô, ba gác, nhân vật được xếp thành cụm lớn dần theo số khách để tạo nét hài hước, nhưng phải giữ silhouette xe và khả năng đọc đường. HUD dùng icon người cạnh điểm/tiền và hiển thị **tổng người trên xe tính cả tài xế**: xe máy trống là 1/2, có một khách là 2/2. Khi mọi người bị hất khỏi xe, tạm hiển thị 0/2 cho tới khi tài xế/khách quay lại.

**ĐÃ CHỐT cho lượt cập nhật visual xe người chơi:** trên xe người chơi dạng hộp kín như ô tô, xe buýt và container, tài xế ngồi trong cabin và không thò đầu ra ngoài. Hành khách hiện bằng đầu/thân trên nhoài ra cửa sổ; số người nhìn thấy tương ứng số khách thực đang ngồi trên xe, không tính tài xế. Xe chướng ngại giữ model thường, không có người thò cửa sổ. Bố trí theo cửa sổ còn chỗ, ưu tiên nhìn rõ cả silhouette xe và số người; không xuyên qua mui/thân xe, không để các đầu chồng nhau gây khó đếm. Xe lớn có thể kéo dài/rộng thân nhưng không được kéo lớn model người. Đây là placeholder visual trước, làm ở giai đoạn cập nhật hình ảnh xe; không đổi roster, capacity hay logic gameplay. Kiểm tra đổi xe, cho khách xuống/đón khách, crash/reboard và các số khách khác nhau để hình luôn khớp state.

**ĐÃ CHỐT cho prototype sau:** xe giao thông có nhiều chủng loại và HP riêng cũng tương tác với chướng ngại môi trường như xe người chơi. Ví dụ, đi qua ổ gà làm xe giao thông mất HP theo luật tiếp xúc của ổ gà dài. Khi HP xe giao thông về 0, hành khách xuất hiện bên cạnh xe để người chơi tới đón bằng thao tác đón khách thông thường. Xe chết máy sinh sẵn vẫn là loại sự kiện riêng; không sinh trùng hành khách nếu cùng một xe vừa chịu damage vừa chuyển sang trạng thái hỏng. **ĐỀ XUẤT triển khai:** số người xuất hiện dựa trên người đang ở xe và giới hạn cân bằng, chỉ sinh một lần tại vị trí an toàn có thể tiếp cận; không tự cộng tiền/điểm khi xe hỏng. Tính lại tốc độ trung vị, tải và thu nhập chỉ khi người chơi thực sự đón họ.

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

**ĐÃ CHỐT:** cửa hàng ở ven đường; danh sách xe phải đủ catalog người chơi, gồm ba gác và container. Xe đã sở hữu hiện trạng thái không thể mua, không bị thiếu khỏi danh mục do roll ngẫu nhiên. Chọn xe đang lái hoặc dự phòng trước khi nâng cấp, chi phí/cấp áp dụng đúng instance đó. **ĐỀ XUẤT:** cảnh báo sớm, R trong vùng tiếp cận mở UI an toàn; bơm xăng/sửa trực tiếp, mua xe và nâng cấp theo danh mục. Không bán gói xăng/bộ sửa mang theo; vật phẩm mới theo phân kỳ DESIGN_ITEMS_HAZARDS.md, nguồn bán/loot chưa chốt; không ép người chơi cần nitro khi không thể có nitro.

## Secret ending — bốn bước đúng thứ tự

**ĐÃ CHỐT:** (1) mua ô tô 4 chỗ khi không chở khách → (2) đón thêm đủ 3 khách trong chuyến chạy → (3) nitro boost qua một đoàn tàu → (4) đâm vào một vụ tai nạn giao thông. Đủ chuỗi thì kết ván, badge “đã về nhà”, ghi điểm lúc đó.

**ĐỀ XUẤT bảo thủ:** “không chở khách” vẫn có tài xế; bước 2 tính 3 người thực sự ở trên xe, không tính 3 lượt đón rồi cho xuống. Phải giữ chiếc ô tô đã mua làm xe đang chạy và giữ 3 khách tới hết chuỗi; đổi/bỏ xe hoặc thay đổi số khách làm reset chuỗi. Sự kiện ngoài thứ tự không tiến bước; không reset chỉ vì chạy qua sự kiện không liên quan. Nhảy chỉ tính khi bay qua và hạ cánh an toàn ở phía bên kia một đoàn tàu thật, không tính bấm Space gần đường ray. Bước 4 phải là collider của vụ tai nạn đã sinh. Khi hợp lệ, secret ending được xét trước hư xe/thay xe; va chạm tàu vẫn thua ngay. Chuỗi không qua nhiều ván, không tự bắt đầu với xe có sẵn đầu ván. Các quy tắc giữ xe/khách là đề xuất, không suy diễn thành quyết định lịch sử.

**CẬP NHẬT ĐÃ CHỐT 19/10/2026 (thay chuỗi cũ phía trên):** không cần mua ô tô 4 chỗ khi xe rỗng. Người chơi có thể mua hoặc chuyển sang chiếc ô tô 4 chỗ đã sở hữu. Muốn bật green flag phải để xe đó không có khách cũ rồi đón mới đủ ba khách; nếu lúc trang bị đã có khách, phải cho tất cả xuống trước khi đón lại. Sau khi green flag bật, nhảy qua một đoàn tàu thật, rồi va vào **xe chướng ngại hoặc vụ tai nạn** để mở kết bí mật. Chỉ giữ thứ tự này, không bắt ba sự kiện liên tục hoặc nằm trong cùng một đoạn đường. Cờ gắn với xe đang chạy và ba khách hiện tại; mất khách, đổi xe hoặc ngã làm mất cờ, nhưng có thể bắt đầu lại khi ô tô 4 chỗ rỗng. Tàu va trực tiếp vẫn kết ván. Va chạm cuối được xét trước sát thương/hiệu ứng ngã của đúng xe chướng ngại hoặc tai nạn đó.

**CẬP NHẬT ĐÃ CHỐT — cảm giác lái:** mọi xe người chơi nghiêng khi đánh lái. Chuyển động ngang có quán tính: thả hoặc đảo A/D vẫn còn trượt ngắn trước khi dừng/đổi hướng; chạy nhanh dễ trượt hơn và mỗi loại xe có độ bám riêng. Xe chướng ngại chưa nhận mô hình bám của người chơi. Các hệ số độ bám/góc nghiêng P7 hiện là số TẠM để thử cảm giác, không chốt cân bằng. Đường thử DEV không thay mật độ nguy hiểm ván thường.

**ĐỀ XUẤT đang có sân thử riêng — vật lý va chạm:** phối hợp bộ giải vật lý cho phản lực, đẩy/trôi/lăn của xe người chơi, NPC, xe chướng ngại và hàng rơi với luật arcade giữ quyền quyết định input, HP, choáng và kết ván. Xem `physics.html`. Đây chưa phải luật của ván chính; không tự mang damage hoặc ragdoll từ sân thử vào các event đã chốt như tàu/secret. Sau khi chủ dự án chơi và duyệt hướng cảm giác, cần xác định phạm vi tích hợp, giới hạn hiệu năng trên máy yếu, xử lý nhiều va chạm trong cùng tick và tương tác với ngã/khách trước khi đổi gameplay chính.

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

**ĐÃ CHỐT sau feedback P4B:** khi tai nạn, từng hành khách được quyết định quay lại hoặc ở lại; người ở lại không nhận F đón lại. Họ phải có nhịp văng/ngã, nằm ngắn rồi đứng dậy trước khi đi lững thững. HUD sức chứa, hình nhân vật và logic F phải phản ánh cùng một danh sách khách, không sinh lại khách bị bỏ sau khi tài xế lên xe. Tỷ lệ quay lại và thời lượng animation trong BALANCE_CONFIG.md là TẠM.

Đặc tả, ràng buộc công bằng, phân kỳ P2.1/P3A/P3B/P4.1 và kế hoạch kiểm chứng: [DESIGN_UPDATE_IMMERSION_TRAFFIC.md](DESIGN_UPDATE_IMMERSION_TRAFFIC.md). Build P2.0 chưa triển khai các thay đổi này. Mẫu phủ kín đường cần giải pháp hợp lệ; chưa có thì cấm sinh. Không tự coi xe bị húc là tai nạn kích hoạt secret.

## P4.2 — Trạng thái bản thử
Đã có NPC từ traffic hỏng do húc/ổ gà; F đón thủ công, không tự thêm khách hoặc thưởng. Bản thử dùng số khách seeded giới hạn tối đa 3 và không vượt sức chứa trừ tài xế; đây là mặc định bảo thủ TẠM cho economy, không phải mô hình đầy xe buýt. Chỉ xuất hiện nếu có chỗ bên cạnh ngoài hazard, có thể trì hoãn/bỏ qua khi không tìm được chỗ trước lúc thu hồi dữ liệu. Khách này đứng yên ở chỗ đã kiểm tra; visual/animation hoàn chỉnh tiếp tục để giai đoạn cuối.

**Cập nhật chủ dự án — P4.2 lượt 2:** khách từ traffic bị cú húc của người chơi làm HP về 0 được gắn `pickupable=false` vĩnh viễn cho NPC đó. Họ vẫn xuất hiện bên đường nhưng F và cue đón bỏ qua. Xe hỏng do môi trường vẫn sinh khách đón được. Chốt theo nguyên nhân gây hỏng: cú húc chỉ làm mất HP nhưng sau đó ổ gà mới làm HP=0 thì vẫn thuộc môi trường. Không áp dụng cho khách chờ thường/G cho xuống. Thay thế luật đón mọi khách từ xe hỏng ở bản P4.2 đầu.

## Traffic có nhiên liệu — cập nhật theo chủ dự án
ĐÃ CHỐT: xe chướng ngại cũng có xăng và có thể hết xăng. Bản thử `p4-2-traffic-fuel-1` dùng dung tích và L/m của loại xe tương ứng; mỗi instance giữ xăng riêng. Mặc định sinh đầy bình để chưa tăng ngầm độ khó. Qua nước vừa chậm vừa hao xăng, hết xăng trôi chung 25 m rồi dừng, không tự hồi lực kéo/xăng. Xe còn HP không được coi là wreck; vẫn có collider và chịu ổ gà/va chạm. Chưa tự tạo khách chỉ vì hết xăng; event xe chết máy/hành khách của P6 giữ phân kỳ. Các mô tả traffic chưa có fuel ở trên là lịch sử trước cập nhật này.

## P5 — Bản thử kinh tế ven đường
Đã triển khai C ghé shop có vị trí thật và cảnh báo, pause mô phỏng trong khi mua. Giá/mức nâng cấp dùng bảng TẠM hiện có; thu nhập nền vẫn 0,50/m. Hai shop đầu 600/1200 m là mặc định bảo thủ TẠM để kiểm tra mua ô tô thật quanh 1–1,5 phút; các shop sau seeded trong khoảng 600–900 m và ngoài hành lang giao lộ. Mỗi shop có xe máy, ô tô 4 chỗ và hai loại xe khác theo seed; mỗi loại bán một chiếc. Vật phẩm xăng/sửa có stock seeded 2–4 món/loại, không reroll khi mở lại. Đây là controlled stock cho lát cắt shop; loot/nitro và sự kiện đặc biệt đường đi tiếp tục nối ở P6, chưa gọi đã có toàn bộ loot director cuối.
Mua xe mới trở thành xe đang chạy, giữ khách và lưu tài nguyên/nâng cấp xe cũ. Kho tối đa hai instance: mua xe thứ ba phải chọn xe bỏ và xác nhận rõ; huỷ/thiếu tiền/command cũ không thay dữ liệu. Bốn nâng cấp động cơ/bình/gia cố/tiết kiệm có ba cấp và gắn instance đang chạy. Nâng dung tích/HP tối đa không tự cấp thêm tài nguyên. Bơm/sửa trực tiếp và vật phẩm R clamp theo xe hiện tại.
R dùng món chọn trong shop, tối đa ba món. Tab luôn đổi xe, thay mô tả cũ dùng Tab chọn inventory. Không tiêu vật phẩm khi tài nguyên đầy hoặc khi pause/crash; kho reset khi chơi lại. Nitro/Space dành P6, không bán món chưa dùng được trong P5. Chưa tự thay mức hồi của vật phẩm miễn phí trên đường; feedback giảm lượng hồi vẫn cần vòng cân riêng.

## Feedback P5 — điều khiển, garage và thứ tự hoàn thiện (ĐÃ CHỐT)
Thay luật P5 lượt đầu: R mở shop, bỏ C; kho hai ô cố định dùng 1/2, không chọn món bằng R/Tab và không dồn vị trí sau dùng. Danh mục shop hiển thị đủ tám loại hiện có, ba gác/container luôn có dòng tương ứng; loại đang sở hữu bị khoá mua ở UI lẫn transaction. Nâng cấp cho phép chọn một trong hai instance (đang lái/dự phòng), không tự thay xe hoặc hồi tài nguyên.
Roadmap cuối: tuning độ khó/economy/giá trước → UI/visual art và review/chỉnh art direction → hoàn thiện/review/chỉnh SFX/VFX cuối cùng. Game hiện còn quá dễ và khó dần theo quãng đường chưa rõ theo feedback chủ dự án; coi đây là vấn đề chưa đạt, phải đánh giá lại ở gate tuning. Lượt này chỉ cập nhật kế hoạch và cơ chế P5 được yêu cầu, chưa tự tăng difficulty/damage hay thay giá. Quy trình duyệt art và rubric mỗi tiêu chí tối thiểu 6/10 vẫn giữ; chỉ sửa cue/input cần thiết trước giai đoạn art.
Các ghi chú P5 lượt đầu phía trên về kho ba món, C/R cũ, shop roll hai loại xe và chỉ nâng xe đang chạy là lịch sử, được yêu cầu mới này thay thế.

## Yêu cầu mới — vật phẩm/chướng ngại 18/10/2026 (ưu tiên hơn mô tả cũ)

Xem [DESIGN_ITEMS_HAZARDS.md](DESIGN_ITEMS_HAZARDS.md) cho cơ chế đã chốt, đề xuất cần thử, phân kỳ và gate. P5 bỏ gói xăng/bộ sửa mang theo, chỉ tiếp tế trực tiếp tại shop; giữ mua xe/nâng cấp. Pickup tài nguyên trên đường vẫn hồi trực tiếp. Nitro boost/nhảy, star miễn damage/debuff nhưng không chặn event, chuối né công an/dân phòng và Grab nhiều lượt gọi khách đặc biệt đưa vào P5.1/P5.2/P6. Bốn nhóm hazard đưa vào P6.1–P6.3. Hai ô 1/2 dành cho hệ vật phẩm tương lai; hiện chưa có món để dùng. Giá/thời lượng/số lượt/hệ số thưởng chưa chốt, không dùng số cũ như số đã cân bằng; nitro kho riêng/Space cũ không còn là thiết kế hiện hành. Star với terminal tàu là điểm cần xác nhận theo diễn giải bảo thủ trong đặc tả.


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


## P6 — bản thử sự kiện đặc biệt (18/10/2026)
P5.2/Grab ven đường đã được chủ dự án nhận xét ổn và chuyển bước. P6 có công an/dân phòng, chuối trong hai ô 1/2, kẹt xe hai làn, xe chết máy, tai nạn và tàu với collider thật. Star vẫn trigger phạt/tịch thu/tai nạn/tàu; chỉ miễn damage/debuff và ngã thông thường. S ở gần ray cho phanh tới 0 để chờ; thả S tự tăng dần lại, W tăng nhanh hơn. Nitro vẫn chỉ boost, Space nhảy riêng.
Thông số TẠM: công an 300, dân phòng 100, chuối 80 (một món/shop), event đầu 1.700 m, khoảng giữa 1.250 m trước khi director bỏ mẫu không phù hợp, hành lang 110 m. Tàu đóng 8 s/mở 8 s theo thời gian gameplay, clearance nhảy 1,8 m; xét toàn bộ chiều dài xe. Event đầu để sau shop 1.200 m, giữ cơ hội mua xe đầu 1–1,5 phút; chưa tuning curve P8. Không bắt buộc có nitro: có thể dừng chờ mở đường. Biển/icon và khối hình vẫn placeholder, không phải art tàu hoàn chỉnh.
Theo mặc định bảo thủ trong design: thiếu tiền công an lấy tới 0, tịch thu instance hiện tại, xe dự phòng còn 50% lượng xăng đang có rồi tự chuyển; đủ tiền không giảm xăng dự phòng. Xe tịch thu được bỏ khỏi kho khi đã chuyển thành công, giải phóng slot; không có xe hợp lệ thì kết ván. Dân phòng chỉ lấy tới 0. Tai nạn HP=0 rồi thay xe/thua; tàu luôn thua dù có star/xe dự phòng. Event idempotent, ưu tiên tàu khi va chạm trùng thời điểm.
Xe chết máy tạo một NPC thực để F đón, không tự cộng khách/tiền/điểm; TẠM 25% thêm một chuối vào ô trống, kho đầy thì không ghi đè. Kẹt xe/tai nạn hiện chỉ che hai lane và để khoảng đủ rộng cho container; chưa sinh kẹt kín ba lane. P6.1–P6.3 theo roadmap làm barrier/chuyển lane, lực ngang và đồ rơi; P7 mới làm chuỗi secret/badge, chưa tự ghi thành tích nhảy tàu hay secret ở P6.
Báo cáo kiểm tra và giới hạn: [PROTOTYPE_6_REVIEW.md](PROTOTYPE_6_REVIEW.md). Các trạng thái “P6 chưa làm” phía trên là lịch sử.


## Chốt design P6.1 sau feedback P6
Tàu chạy ngang hữu hạn, hitbox đi cùng thân/đuôi; bỏ cơ chế chiếm ba lane bằng timer bật/tắt. Công an/dân phòng là một NPC, đôi khi hai, đi qua lại nhanh, chỉ bắt khi va thật. **ĐÃ CHỐT:** một chuối vô hiệu cả nhóm mục tiêu; nhóm hai người thì cả hai đứng yên và vô hại khi người chơi chạm, chỉ tiêu một món, không lan sang nhóm khác. Traffic va hazard và va nhau có thể tạo tai nạn/hỏng xe thực; không chỉ accident sinh sẵn. Các số tốc độ/tần suất chưa khóa, không tự tăng khó. Chi tiết đã chốt/đề xuất và bản chơi tích hợp bắt buộc: [DESIGN_MOVING_EVENTS_TRAFFIC.md](DESIGN_MOVING_EVENTS_TRAFFIC.md). Các dòng P6 ở trên mô tả bản code lịch sử, chưa đáp ứng đủ thiết kế này.


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


## P6.2 — bản thử lực ngang, chờ duyệt tích hợp
Đã có8fixture DEV tại /p61.html#forces: gió trái/phải,nước đẩy trái/phải,hai vùng ngược hướng,star,ngã,coasting. Version p62-forces-1. Mô hình TẠM là tốc độ đẩy ngang có giới hạn,không tích vận tốc:wind1,5m/s,current2m/s,tổng cap2,2m/s nhỏ hơn AD5m/s;vùng45–110m rộng9,6m. Star/crash/protected footprint miễn lực;gió vẫn tác động khi nhảy,nước đẩy không tác động khi đủ độ cao;coasting vẫn có thể trôi ngang. Rời vùng/pause không có impulse bù. Nước giữ fuel cost cũ,gió không thêm HP/fuel cost. Chỉ source lực P6.2 áp dụng cho người chơi;chưa director/NPC-force/density/economy mới. P6.1 thường và stress snapshot giữ nguyên,quyết định fuel traffic vẫn hỏi chủ dự án tại P8. Báo cáo: [PROTOTYPE_6_2_REVIEW.md](PROTOTYPE_6_2_REVIEW.md).

## Cập nhật P6.2 theo feedback chơi thử (18/10/2026)
Bản `p62-forces-2` thay thế quy tắc lực của `p62-forces-1` ở trên. Gió vẫn tạm 1,5 m/s với giới hạn tổng 2,2 m/s; chỉ miễn đẩy khi đang ngã, star hoặc đang trong bảo vệ thay xe. Tài xế trở lại xe mà xe còn trong vùng thì gió tác dụng ngay, dù ID vùng vẫn nằm trong danh sách bảo vệ damage/debuff sau tai nạn. Xe chướng ngại đang chạy, kể cả đang trôi do hết xăng, cũng bị gió đẩy ngang và va chạm theo quỹ đạo mới; xe đã dừng/hỏng và vật chắn cố định không bị đẩy. Lực ngang của nước tạm dừng theo yêu cầu chủ dự án; nước vẫn giảm tốc và hao xăng theo luật cũ. Các URL thử nước cũ trỏ về ca nước không lực. Tám fixture DEV mới gồm hai gió, một nước cơ bản, hai gió ngược hướng, star, ngã, coasting và xe chướng ngại. Chưa tích hợp nguồn gió vào ván thường/stress; dữ liệu stress P6.1 đóng băng và câu hỏi fuel traffic ở P8 giữ nguyên. Xem [P62_WIND_RECOVERY_REVIEW.md](P62_WIND_RECOVERY_REVIEW.md).

## P6.3 — hướng rơi đồ từ traffic (18/10/2026)
Đồ chỉ tuột khỏi **cửa sau xe tải/container đang chạy cùng chiều**. Sau khi xuất hiện tại trục đuôi, vật trượt lùi rồi lăn lệch trái/phải theo hướng được seed chọn; không phóng ngang khỏi hông xe. Hướng lăn không được tiết lộ trước cú rơi. Cảnh báo sớm đặt trên xe nguồn, tiếp theo là cue theo vật thật. Kiện nhẹ trừ HP một lần, thùng nặng trừ HP và gây ngã; số damage và quỹ đạo còn TẠM. P6.3 thử riêng trước, sau khi chủ dự án duyệt mới tích hợp cùng P6.2 gió vào ván đầy đủ. Phối hợp gió với nước/ổ gà/vật cố định được hoãn lại.

## Bản so sánh lực va chạm 19/10/2026

**ĐÃ CHỐT cho thử nghiệm:** giữ hai bản chơi song song `ver.force` và `ver.noforce` trên cùng gameplay và seed. Bản force thêm phản lực va chạm vật lý cho người chơi, NPC, xe giao thông và đồ rơi; bản noforce giữ cơ chế hiện tại. So cảm giác lái, độ rõ của tai nạn và khả năng kiểm soát trước khi quyết định tích hợp lực vào bản chính. Các số phản lực/khối lượng là **TẠM**, không tự thay damage hay economy đã chốt.

**ĐÃ CHỐT cho `ver.force`:** NPC bị xe đang chạy tông phải văng đi, té ngã rồi đứng dậy; NPC không được chặn xe như vật cứng. NPC bị chính xe người chơi tông sẽ từ chối lên xe sau đó. Quãng văng, thời gian ngã và mức giảm tốc 2% hiện là **TẠM** để thử cảm giác; `ver.noforce` giữ luật cũ để đối chiếu. Xem [PHYSICS_FORCE_AB_REVIEW.md](PHYSICS_FORCE_AB_REVIEW.md).

**Feedback xe–xe cho `ver.force`:** xe chướng ngại cần cảm giác nặng hơn khi bị húc. Bản thử tăng quán tính traffic so với xe người chơi, giữ nguyên damage/HP và khả năng xe lớn húc hỏng xe nhỏ. Xác vừa bị húc nhận một phản lực đầu; sau đó xe lớn đi qua theo luật phá xe thay vì bị dừng cứng hoặc liên tục đẩy xác. Hệ số quán tính là **TẠM**, cần chủ dự án thử cảm giác trước khi chốt.

**Cập nhật sau feedback tiếp theo (19/10/2026):** cú húc cần đẩy xe chướng ngại đi một đoạn thấy rõ, rồi giảm đà dần. Xe còn hoạt động tiếp tục chạy bằng tốc độ nền sau khi trượt; xe bị hỏng chỉ trôi do lực va chạm rồi dừng, không tự chạy lùi hoặc tăng tốc lại. Vẫn chỉ tính một damage event cho cú húc hợp lệ. Những trị lực/ma sát là **TẠM** cho `ver.force`; đoạn mô tả “chỉ đẩy xác một đoạn ngắn” phía trên là lịch sử thử nghiệm trước cập nhật này.
