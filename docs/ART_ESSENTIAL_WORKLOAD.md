# Art thiết yếu — thứ tự sản xuất sau khi chốt cân bằng

Ngày 24/10/2026. Đây là kế hoạch sản xuất rút gọn theo ưu tiên mới của chủ dự án. `ART_DIRECTION_3D.md` và `MODEL_ANIMATION_WORKLOAD.md` vẫn là đích chất lượng dài hạn; bảng này chỉ xác định mốc **bản game đầy đủ thiết yếu** trước đợt polish sau.

## Quy tắc chung

- Tập trung vào silhouette từ camera sau 9:16, kích thước đúng collider hiện hành, màu cơ sở và phần cứng cần để game diễn trạng thái thật.
- Một master xe dùng cho cả player và traffic; traffic có thể đổi màu, giảm chi tiết/LOD. Không nhân đôi tám model chỉ vì hai vai trò.
- Chỉ cần một finish đẹp cho mỗi xe lúc đầu. Nội thất ghế chi tiết, bảng điều khiển, biến thể sơn thứ hai/thứ ba, đèn/FX thật và props trang trí nhỏ để sau.
- Bánh, trục lái, body pivot, hitch container, seat/socket phải có **điểm gắn và phân cấp** để tích hợp; không bắt buộc mô phỏng/cử động chi tiết khi chưa có runtime nối.
- Xe máy, mô tô, car4, car7: ngoại thất bằng mức mẫu car4. Ba gác, bus, truck, container: khoảng 80% mức đó, vẫn khác silhouette thật. Hazard: khoảng 50–60%. Cảnh quan: khoảng 50%, tập trung hình lớn và cụm có bản sắc.
- Không thay collider, balance, hướng lái, roster hoặc nguồn spawn để hợp với mesh. Asset module vẫn tách khỏi `render.ts` cho đến khi chat code tích hợp.

## Các gói theo thứ tự

| Gói | Đầu ra thiết yếu | Để sau | Trạng thái |
|---|---|---|---|
| V1 — xe cơ bản | Car4, xe máy, mô tô, car7. Mỗi loại có ngoại thất gần/xa, root/pivot/socket, một finish, footprint chuẩn. | 3 palette, cabin/ghế đẹp, cosmetic animation tinh. | Source + preview + unit checks xong; chưa tích hợp, chưa có duyệt art. |
| V2 — xe còn lại và traffic | Ba gác, bus, truck, container. Reuse cả tám master cho traffic; container player có đầu kéo/rơ-moóc, traffic một cụm. | Chi tiết nội thất, mọi skin traffic, hàng hóa trang trí. | Source + catalog factory + unit checks xong; chưa tích hợp, chưa có duyệt art. |
| C1 — người thiết yếu | Một tài xế rõ từ sau, khách nhiều silhouette cốt lõi; pose lái/ngồi, vẫy, va/ngã, đứng dậy, từ chối. Mount trên các loại xe. | Secondary gesture và biểu cảm tinh. | Source 12 khách + tài xế, pose, mount, preview, unit checks xong; tỷ lệ/trang phục còn cần nâng tiếp, chưa nối roster/animation runtime. |
| H1 — hazard tĩnh và điểm dịch vụ | Nước các footprint đang dùng, ổ gà, rào, hàng rơi, pickup xăng/sửa, cụm tai nạn tái dùng car4, shop một silhouette. | Cây đổ hiện là mẫu dự phòng, không thêm spawn; shop nhiều skin, vết nhỏ/biến thể nhiều, props dressing. | Source + preview + footprint checks xong; chưa nối renderer. |
| H2 — hazard chuyển động | Tàu hữu hạn, công an/dân phòng, hàng rong, cứu thương. Chỉ pose/part cần đọc hướng và trạng thái. | Animation phản ứng dài, clip phụ. | Source + preview + unit checks xong; chưa kiểm chuyển động trong game. |
| R1 — đường | Mặt đường 4 m theo pathPose, mép/làn/bờ, giao lộ và rào nhánh thẳng hiện hành. | Drain/patch/biển nhỏ lặp lại; transition cảnh quan ở bản polish. | Source + checks xong; chưa nối geometry động của route. |
| E1 — cảnh quan | Nhà thấp, cửa hàng mặt tiền rộng, chung cư nhỏ, công viên, cây/bụi, ruộng, đồi, ven biển; năm family đang có trong `landscape.ts`. | Hồ/sông riêng, mọi facade/prop/LOD biến thể trong guide đầy đủ, anim cây. | Source + preview + clearance/seed checks xong; còn mặt bên phẳng và nhịp phố cần tuning, chưa nối placement trong game. |
| I1 — nối và QA | Chat code gắn asset, kiểm camera/collider/state/perf trong game; hoàn thiện các lỗi cản gameplay. | FX/SFX/shader/đèn production. | Chờ asset và chat code. |

## VEH-03 car4 mẫu

`src/art/car4.ts` tạo model bằng Three.js theo +Y up, +Z forward, 1 đơn vị = 1 m. Không hiển thị ghế nội thất. Có 4 wheel pivot, body visual, bốn seat mount, socket đèn/FX/exit, near/far LOD và overlay clean/used/damaged/destroyed. Preview: `/art-preview/car4.html` khi chạy Vite. Asset chưa nối vào renderer game.

QA kỹ thuật hiện có: footprint render so với 1,86 × 4,2 m trong `src/vehicles.ts`; phía gương mềm cho phép nhô rất nhỏ. Near 2.625 triangles/147 meshes; far 1.549 triangles/84 meshes; 15 material objects. Car7 near/far 2.194/1.294 triangles. Đây là số của model art riêng, chưa tối ưu batch/instance. Chưa có benchmark FPS trong game, test input hay art review của chủ dự án.

LOD near/far đo từ model player theo thứ tự tam giác: xe máy 1.982/1.566, mô tô 1.996/1.580, car4 2.625/1.549, car7 2.194/1.294, ba gác 528/384, buýt 1.040/864, tải 798/634, container 1.258/882. Đây là độ phức tạp mesh, **không phải thang đo chất lượng 80%**. Traffic xe mở cộng thêm tài xế. Draw calls thực tế vẫn cần tối ưu sau tích hợp.

Các mục guide cũ bị hoãn ở đây không bị gọi là “đã hoàn tất”. Khi có game đầy đủ thiết yếu, mở một đợt polish riêng và kiểm lại workload gốc theo ID.

## Mở lại art direction đầy đủ theo yêu cầu mới

Chủ dự án đã bỏ giới hạn mức 50–80% để ưu tiên chất lượng và nuance theo `ART_DIRECTION_3D.md`. Bảng thiết yếu phía trên là mốc lịch sử, không còn là trần chất lượng. Đợt nâng đầu tiên đã thêm 12 archetype khách (ngoài tài xế), tách silhouette cây tán rộng/cọ/cây hoa, thay ba nón vách đá bằng dải địa hình, dựng ruộng lúa theo khóm có instancing, thêm lớp ven biển và cấu trúc nhà/màu sáng ấm. Một nhà ven đường được dựng bằng Blender; source `assets/art/roadside-shop.blend`, bản xuất gộp vật liệu `assets/art/roadside-shop.glb`, preview `/art-preview/blender-shop.html`. Mẫu Blender hiện là art candidate trong scene preview, chưa là prefab game.

`/art-preview/scene.html` cho chuyển giữa camera prototype và góc art direction đề xuất; lựa chọn thứ hai chỉ để so bố cục, không đổi camera gameplay. Lighting/tone mapping/shadow trong preview là nghiên cứu màu; renderer game chưa đổi. Theo feedback mới, thành phố có thêm dãy nhà cao tầng, cửa hàng mặt tiền rộng, công viên và hoán vị thứ tự/vị trí/màu theo seed cố định; `/art-preview/world-gallery.html` cho xem ba seed mẫu. Nhân vật được sửa đầu, tóc/mũ, tay chân và mặt theo ảnh tham chiếu người dùng, nhưng quần áo và tỷ lệ còn cần nâng tiếp. Nước có vật liệu phản chiếu nhẹ; ổ gà có vách dốc/normal tạo lớp sâu bằng hình khối, collider không đổi. Cần tiếp tục hoàn thiện chất lượng ngoại thất các xe còn lại, diễn xuất nhân vật, các vùng môi trường/điểm dịch vụ, FX/ánh sáng trong game, hiệu năng và art gate; không gọi gói này là art cuối đạt reference.

Sau lượt xây phố tiếp theo, đã có hai nhà `.blend` chỉnh được (shop ven đường và midrise có tầng trệt bán hàng), công viên có giàn che/lối vào, ba nhà backlot khác chiều cao phía sau dãy mặt đường, và hai đoạn phố gần/xa nối tiếp trong cảnh mẫu. `setPose('walk', phase)` cho một nhịp bước tại chỗ, vẫn không quyết định thời gian di chuyển. Thứ tự việc còn đáng đầu tư nhất theo kiểm hình hiện tại: **(1)** nhân vật bớt dáng khớp mô-đun và thêm form tóc/trang phục rõ ở camera lái, **(2)** ánh sáng/mưa/mặt đường ướt và vật liệu nước/ổ gà khi đã có scene game thật, **(3)** gộp nhà/đường xa để giảm draw calls trước khi dùng nhiều vùng, **(4)** polish khác biệt các xe lớn trong cảnh game. Sân sau và phụ kiện nhỏ là ưu tiên sau. Mức tự đánh giá và bằng chứng ở `ART_QA_SELF_REVIEW.md`; chưa chuyển art cho code chat.

Bus đã có thêm chi tiết ngoại thất đọc từ sau và bên hông: dải màu, bảng tuyến, grille và cụm mái. Đây là polish model trong cùng footprint 2,72 × 10 m; chưa dựng khoang nội thất, chưa tích hợp vào gameplay. Các xe tải/container và animation người vẫn là việc tiếp theo theo chất lượng tổng thể, không vì bus được nâng mà coi cả gói V2 đạt art direction.

Nhân vật có đầu lớn hơn theo chất hoạt hình của ảnh reference, tay/chân đầy hơn và tóc dài liền form hơn; hip socket và chiều cao seat mount giữ như cũ. Đây vẫn là mesh/pose nguồn, chưa có thời gian animation mới và chưa thay thời lượng simulation.

`scene.html` thử nền trời/mây/sương và bóng mây khuếch tán để so ánh sáng ở camera prototype. Đây là art study nằm riêng ở preview; gameplay renderer chưa dùng ánh sáng/thời tiết này. Mặt đường ướt, mưa/VFX, cân độ sáng bóng nhà, và đọc cue khi lái vẫn còn cần làm/kiểm sau.

`createRoadTileArt` và `createJunctionArt` nay có `setWetness(0..1)` để code tích hợp sau điều khiển độ tối, độ nhám và clearcoat của mặt nhựa, không đổi lane width/collider. Preview đang thử mức 0,70 cùng ánh môi trường rất nhẹ; vũng nước vẫn khác màu và lòng sâu. Đây mới là nền vật liệu ướt, chưa có phản xạ động hay hạt mưa; không gọi đường/mưa hoàn tất.

Mesh thường của cụm cảnh **far** được gộp theo vật liệu sau khi dựng, còn cụm near và instanced field giữ nguyên. Trong scene prototype, số draw calls giảm từ 1.535 xuống 1.097 với cùng 37.014 tam giác theo thông số browser; hình phố và khoảng trống đường được xem lại, không thấy mất công trình. Đây là giảm lệnh vẽ của preview tĩnh, chưa phải benchmark FPS/bộ nhớ hoặc tối ưu toàn game.

Blender có thêm mẫu nhà chợ góc phố mặt tiền rộng, dãy cột/hiên, ban công, tháp đồng hồ và cửa bên/sau: `corner-market.blend` chỉnh được, `corner-market.glb` gộp 12 vật liệu, `blender-market.html` để kiểm riêng. Cảnh mẫu thử thay một storefront bằng mẫu này, vẫn chỉ preview chứ không ghép gameplay. Nhà này rộng 9,50 m và được đặt lùi để không lấn 3 làn; nếu code tích hợp, phải kiểm từng vùng/seed/đoạn cua và cache GLB.

Lớp mưa visual seeded trong `src/art/weather.ts` dùng một draw call, nhận thời gian và vị trí neo từ runtime, cho đổi cường độ mà không tác động simulation. Preview thử mưa nhẹ trong camera prototype để kiểm nước/ổ gà vẫn đọc được. Chưa có splash/hạt trên kính, gió theo biome hoặc kiểm thời tiết trong gameplay.

Nước ngập được làm lại để đọc là mặt nước phủ trên đường: mép thấp và hẹp hơn, tâm xanh rộng hơn; `setVisualTime` dao động cao độ/normal rất nhẹ và trượt gợn sáng. Cùng kích thước entity và collider cũ, ổ gà vẫn có vách sâu riêng. `scene.html` thử chuyển động này dưới mưa; chưa có splash hay shader phản xạ phức tạp.

Xe tải có mái bạt dốc nhẹ với ba gọng, thùng có gân/rail/dải màu, cửa sau có bản lề/biển/reflector và cabin có visor/grille. Những phần này tăng nhận diện từ camera sau, vẫn cùng footprint 2,72 × 7 m, ba seat socket và wheel pivots. Đây là polish mesh, chưa là nội thất hay animation hàng hóa.

Container được thêm gân ngang mái, rãnh giữa, rail/dải màu trên thùng, khung góc và chi tiết khóa/cửa sau. Đầu kéo có visor, grille, bình nhiên liệu và bậc. Cấu trúc `tractor`/`trailer` và hitch, chiều rộng/dài 2,88 × 15 m theo prototype vẫn giữ; traffic tiếp tục dùng cùng family mesh nhưng không articulated như player.

## Đánh giá lại ưu tiên sau các lượt polish 24/10

Các master xe, hazard, người và năm biome đều đã có source/preview. Đích hiện tại là art direction **trên 7/10**, không còn trần chất lượng 50–80% của bảng thiết yếu ban đầu. Đây là Codex tự đánh giá từ preview tĩnh, chưa phải phê duyệt của art director hay điểm game đã tích hợp. Không push/chat code theo yêu cầu hiện tại.

| Ưu tiên | Việc còn lại | Bằng chứng hiện có / điều kiện hoàn tất |
|---|---|---|
| 1 | Cảnh mẫu có nhân vật, xe, hazard, mưa và lighting nhất quán ở camera chơi | Nhân vật vừa lên khoảng 6/10 ở ảnh tĩnh nhưng khớp/pose chưa liền; lighting/weather preview khoảng 6/10. Phải xem chuyển động, HUD/QTE và kiểm trên game thật trước khi chấm cuối. |
| 2 | Đưa ngôn ngữ vật liệu mưa bão từ art study sang giải pháp runtime có thể đo | Có road wetness, normal nước, splash và sky texture preview; phản xạ đường còn yếu, sky texture chưa là skybox/camera-aware, chưa đo frame P95. |
| 3 | Nâng silhouette và texture của môi trường theo từng biome | City, cây/ruộng/biển/vách tự đánh giá khoảng 6/10 tĩnh; dãy phố còn lặp, một số địa hình trống, vách còn dải liên tục. Giữ `variantSeed` và clearance khi thêm biến thể. |
| 4 | Polish ngoại thất xe/hazard sau khi nhìn trong cảnh chơi | Car4 là mốc tốt; bus/truck/container/ba gác và hazard khoảng 6/10 ở gallery, chưa kiểm tại cự ly và tốc độ gameplay. Không đổi footprint/socket/timing để làm đẹp. |
| 5 | Tối ưu và art direction gate cuối | Scene nhiều mesh >1.100 draw calls ở một frame preview, chưa phải FPS; cần cache/gộp/instance và chấm đủ tám tiêu chí trên cảnh đại diện đã gắn asset, mọi tiêu chí >7/10 theo yêu cầu chủ dự án. UI/typography và hiệu năng còn **chưa chấm**. |

Các phụ kiện nhỏ, skin sơn thêm, nội thất, anim phụ và trang trí không giúp sửa các điểm nghẽn trên trước; ưu tiên sau khi cảnh đại diện đạt chất lượng và chạy ổn.

**Chuyển giao NPC để chủ dự án sửa (25/10):** 13 mẫu người ban đầu đã được xuất ra `assets/art/people-edit-source.blend`, mỗi mẫu một collection; `people-edit-source.glb` là snapshot ban đầu từ mesh TypeScript. Chủ dự án sau đó tạo `driver.adjusted` và yêu cầu tiếp tục nắn NPC; kết quả mới được đóng gói riêng trong `people-polished.blend`, không ghi đè bản chủ dự án sửa. Nhà phố cao tầng `skyline-shophouse.blend`/`.glb` đã được dựng cho nhịp skyline; chỉ thử ở scene preview.

Trong lượt tối ưu tiếp theo, `optimizeNearScenery(root)` gộp mesh tĩnh **bên trong từng root công trình/cây** trước khi đặt cluster, giữ tên/transform root cho placement hoặc thay GLB. Ở cùng camera trong `scene.html`, draw calls giảm 1.126 → 870–871 (khoảng 23%); tam giác được gửi lên GPU tăng 47.240 → khoảng 50.500 khi chuyển sang culling theo cụm và thử đặt tòa cao tầng vào mặt phố. Đây là một frame preview, chưa chứng minh FPS game. Cần đo frame P95, bộ nhớ và nhiều seed/biome trước khi bật trong gameplay.

`scene.html` nay có camera chạy thử 9:16, cho xe/camera tiến qua vũng nước, ổ gà và traffic trong cảnh mẫu; số frame P95 hiển thị là vòng 120 frame của **preview trên máy đang xem**, không phải benchmark game, không có HUD/collider/spawn hay giao lộ động. Skyline Blender được đẩy ra xa để nóc còn nằm trong khung 9:16 ở camera ban đầu. Cần vẫn kiểm camera theo route thật và các xe lớn, rồi đo P95 trong game trước khi chấm hiệu năng cuối.

Ở biome ven biển LOD gần, cầu gỗ cập thuyền và điểm neo nhỏ tạo mốc giữa vùng mặt nước lớn; LOD xa vẫn giản lược. Vách có thêm hai nhịp võng/nhô trên đường viền và facet màu ở mặt đá để bớt dạng dải liên tục. Đây là nâng hình khối trang trí ở ngoài hành lang lái, chưa tạo tương tác/spawn/collider mới; cần nhìn lại trong camera route thật trước khi nâng điểm art direction.

Biên nước hazard nay dùng một profile bất đối xứng chung cho footprint, vách nông và mặt nước, thay viền bầu dục lặp; phần nhìn vẫn phủ gần đúng width/length entity theo test. Nó chưa thành mô phỏng nước có splash khi xe lao qua hoặc phản xạ động, và không đổi collision/timing của hazard.

Cảnh `scene.html` có thể bật một lớp HUD **mô phỏng** bố cục hiện hành (tốc độ, tiền/người, vòng tài nguyên, cue nước/ổ gà) ở camera tĩnh hoặc chạy thử. Đây là công cụ soi tương phản/chồng lấn, không đọc state game và không thay HUD/runtime. Khi bật HUD trong preview chuyển động, cue được chiếu theo camera của cảnh; chữ góc phải trên mặt tiền sáng còn cần kiểm/tuning trong game thật.

Buýt near có thêm gân ngang, rãnh thoát mưa và cửa thoát hiểm thấp trên mái để mặt phẳng dài bớt trống ở camera sau 9:16. LOD far bỏ các phần này; footprint/capacity/socket giữ nguyên. Đây là nâng mức đọc cấu tạo, chưa chứng minh ngoại thất bus đã đạt >7/10 khi lái và có khách thật.

`scene.html` nay chọn được cả tám xe ở camera prototype hoặc camera chạy thử, có HUD minh họa cập nhật capacity/xăng/HP theo catalog. Camera lùi theo chiều dài xe và mặt đường mẫu kéo ra sau để container không lộ nền trống; đây chỉ là kiểm bố cục, không thay camera trong game. Khi thử từng loại, xe mở cho thấy tài xế mẫu còn quá to và che thân xe, đang chờ mẫu NPC Blender của chủ dự án. Car7 được thêm mép kính/cửa hậu, cụm đèn và cánh gió sau để mặt đuôi đọc rõ hơn từ camera chơi; footprint 2,08 × 4,8 m giữ nguyên. Vẫn cần chấm chất lượng trên gameplay thật.

## Hướng sketch cyan-blue / nắng xiên (25/10)

Sketch mới của chủ dự án đặt đích: môi trường cyan-blue mạnh đối trọng nắng cam-vàng, bóng dài lớn trên đường, sương xanh che xa; nước và ổ gà vuông bo nhẹ gần prototype, mặt nước gợn bằng mesh; xe và hazard có màu nổi trên nền, tám xe player có nhận diện màu riêng. Đây là **hướng art đang triển khai**, chưa là nghiệm thu hay shader/post-process trong game.

Cảnh `scene.html` nay thử ambient cyan, nắng xiên ấm, fog xanh từ khoảng 36–100 m và dải bóng dài minh họa; chọn được năm biome bằng cùng camera chơi, với HUD mock. Nền preview đã hạ để không che nước biển/ruộng. `src/art/hazards.ts` chuyển nước/ổ gà sang superellipse mềm trong footprint cũ; nước near có nhiều vòng/cạnh hơn và gợn vertex theo thời gian. Biển/ruộng near trong `src/art/scenery.ts` có plane chia lưới và `setVisualTime`; không phát clock nội bộ. `src/art/vehicle-catalog.ts` cấp tám màu player riêng và tăng nhẹ saturation cho màu traffic được truyền vào. `src/art/water-body.ts` bổ sung master sông/hồ near/far chia lưới, bờ và gợn vertex; `/art-preview/world-gallery.html` cho kiểm riêng. Đây là source decorative, chưa thêm vùng sông/hồ vào spawn/route. Material/lighting mới chưa có ở `src/render.ts`; còn phải đo camera route, contrast cue và perf game thật.

Một lượt palette tiếp theo làm màu tường/viền các nhà code-native ấm-cool rõ hơn, đồng thời tăng nắng cam trong scene preview. Pickup xăng/sửa, rào, toa tàu, cứu thương và hàng rong được tăng saturation ở các mảng nhận diện; rào có sọc cả hai mặt để đọc từ hai chiều. Không đổi vị trí, socket, footprint hay animation timing. Cần xem các màu này với sky/fog và HUD trên route thật trước khi coi là palette cuối.

Rig `src/art/storm-lighting.ts` đóng gói sky gradient, môi trường cyan, nắng cam xiên, fill, fog xanh và cấu hình renderer ACES/VSM. `setAnchor(x,z)` cho ánh sáng bám camera/đoạn route khi chạy; `scene.html` đang dùng rig này. Hai dải bóng chéo minh họa vẫn nằm riêng ở preview, chưa có thuật toán đặt bóng theo nhà/đường động. Đây là gói để chat code thử tích hợp sau, chưa chứng minh art direction trong gameplay.

Ba nhà Blender dùng trong scene phố (`skyline-shophouse`, `corner-market`, `roadside-midrise`) đã được chỉnh vật liệu ở source `.blend` và xuất lại `.glb`: tường ấm sâu hơn, viền đất nung rõ hơn, mái/ô kính xanh bão đậm hơn. Script `assets/art/export-roadside-buildings.py` gộp 12/10 nhóm vật liệu cho market/midrise và xoay riêng midrise từ trục Y của source sang trục đứng export; `export-skyline-shophouse.py` tiếp tục giữ 12 nhóm cho skyline. Chỉ đổi palette/GLB, không đổi footprint, placement, collision hay NPC. Browser gallery cho thấy cả ba nhà đúng trục; scene phố vẫn còn fog khiến dãy xa nhạt và bóng đường proxy, cần xử lý khi runtime tích hợp.

Sông/hồ source tiếp tục tăng độ gợn mesh near theo ba tần số không đồng pha, giữ far nhỏ để tránh shimmer; tâm nước sông xanh sâu hơn, bờ được nâng thành dốc thấp thay đường viền phẳng. Bờ vẫn nằm trong kích thước yêu cầu của root; hồ dùng màu/dao động dịu hơn để không trông như hố xoáy. Gallery 9:16 cho thấy các facet nước gần rõ hơn, nhưng chưa có địa hình nối bờ, foam hay placement trong route. `setVisualTime` vẫn nhận clock từ caller và không ảnh hưởng collider/spawn.

Hai dải bóng chéo cứng của scene preview được thay bằng `src/art/road-shadows.ts`: một source road-local có mép feather, hình hơi gãy và có `dispose`, đặt hai bản trên đường mẫu. Đây là mảng tối art để thử chiaroscuro, không phải shadow caster vật lý; route runtime phải đặt theo `pathPose` và kiểm hazard/cue không mất tương phản trước khi sử dụng. Không đổi lighting rig hay gameplay renderer.

Ổ gà near có vách nghiêng cao hơn và vertex color từ viền đất sáng sang lòng tối theo một hướng nắng cố định; đáy tối/lạnh hơn để đọc chiều sâu từ camera sau. Water vẫn giữ mặt phẳng nông và normal map gợn riêng. Đây là chiều sâu giả lập phía trên mặt đường, không khoét geometry road/collider; cần kiểm cue trong route thật dưới bóng và mưa.

Car7 near được thêm ô kính mái tối, gioăng, gân dập và đầu ray mái; ở camera sau 9:16 mảng mái lớn nay có cấu trúc rõ thay một tấm sơn trống. Far LOD bỏ các chi tiết này, bảy seat/socket và footprint 2,08 × 4,8 m giữ nguyên. Đây là ngoại thất nguồn, chưa chỉnh nội thất hay camera game.

Ba gác near có sàn ghép ba tấm gỗ, đường ghép cửa thùng, khóa giữa, bản lề và phản quang sau bên hông; thùng vẫn trống để không che bốn vị trí khách/hàng hiện có. Từ camera 9:16 cấu trúc sàn/cửa dễ đọc hơn; sau đó mẫu tài xế đã được nắn lại theo collection `driver.adjusted` của chủ dự án, không đổi mount/footprint.

Sketch 25/10 mới dẫn lượt contrast: exposure 1,12, ambient/fill bớt phủ đều, nắng cam xiên và vệt sáng phụ lên mặt phố; nhựa đường sáng olive ở vùng nắng, dải bóng foreground chuyển teal đậm và rộng hơn. Đây vẫn là study ở `scene.html`, chưa có placement bóng theo vật thể hoặc renderer gameplay. Mặt sông, hồ và biển dùng tam giác non-indexed tô riêng từng mặt xanh lam/cyan như ảnh tham chiếu; hồ chuyển từ lưới tỏa tâm sang lưới oval để không tạo xoáy tâm. Nước hazard trên road vẫn riêng, giữ hình nông dễ nhận biết.

Theo feedback tỉ lệ semi-chibi, `src/art/people.ts` nay hạ/nắn vai, làm thân bụng và hông nở, giảm đầu theo `driver.adjusted`, sửa vị trí mắt/mũi/miệng, tóc sau, mũ và chi tiết áo tài xế. `assets/art/people-proportions-pass.glb` chứa 13 mẫu đứng từ mã mới; bản này vẫn chỉ xấp xỉ shape chủ dự án nắn. `assets/art/people-polished.blend` có scene `PeoplePolished` với **tài xế copy trực tiếp từ `driver.adjusted`**, 12 NPC procedural còn lại; `assets/art/driver-adjusted-delivery.glb` chứa riêng tài xế đúng mesh Blender. Scene `PeopleEdit` trong file mới vẫn giữ `driver.adjusted` tham chiếu của chủ dự án; file gốc `people-edit-source.blend` và `.blend1` không bị chép đè. Tỉ lệ phải tiếp tục kiểm trong gameplay và các pose với mọi xe; đây chưa là approval art cuối.

Sau khi tài xế preview đã dùng mesh Blender thật, 12 NPC procedural được giới hạn bề ngang vai theo eo/hông để giảm dáng vai bè; các mẫu worker, parent và senior đã xem lại ở góc sau/ba phần tư. `people-proportions-pass.glb` và scene `PeoplePolished` được xuất lại theo mã mới, vẫn giữ driver copy nguyên từ `driver.adjusted`. Form tay/chân và trang phục NPC còn cứng, chưa gọi là đạt ref; không thay chiều cao, hip socket, collider hay thời lượng pose.

Phố seeded B/C nay phân bố sáu mặt tiền theo độ rộng thật của từng module cộng khoảng hở tối thiểu, rồi chia phần khoảng trống còn lại ngẫu nhiên có seed. Thứ tự nhà, màu, độ lùi và góc xoay vẫn biến thiên; district A giữ layout để không phá placement của các mẫu Blender trong cảnh. Vỉa hè/sân sau dài thêm để các mặt tiền cuối vẫn có nền. Kiểm `world-gallery.html` B/C và `scene.html` ở camera prototype thấy nhịp khoảng cách khác nhau, không thấy nhà chồng nhau hoặc lấn đường; các khối nhà code-native vẫn cần nâng chi tiết facade trước khi gọi phố đạt art direction.

## Hợp đồng với prototype hiện hành

### Chỉnh sáng theo feedback mới

Nắng chính và hai vệt nắng phụ trong `storm-lighting.ts` chuyển từ cam-vàng sang trắng ấm, giảm cường độ để nhà không nhuộm vàng. Hemisphere, ambient và fill thiên cyan-blue hơn để mặt khuất có sắc xanh nhưng vẫn giữ vùng tối. `markGameplayAccentTarget` chỉ đánh dấu mesh xe/hazard đường cho một directional light nhẹ riêng; cảnh phố, đường và sky không nhận đèn này. Preview đã gắn cho player, traffic, nước và ổ gà. Khi tích hợp runtime, chỉ đánh dấu các object gameplay tương ứng và cập nhật anchor theo vị trí xe.

Mái car4/car7/bus/truck/container nay theo màu thân được chọn, tăng sáng vừa phải và có emissive rất nhẹ để nhận diện ở vùng bóng. Đây là màu của source art; không thêm skin/biến thể xe. Xem trực tiếp ở camera prototype `scene.html` với car4, car7, bus, truck, container; mái có hue riêng, bóng trước xe xanh hơn. Độ nổi khi lái dưới mưa/HUD thật vẫn chưa kiểm.

Sau khi xem ở camera chơi, đèn accent được chuyển sang góc chéo từ phía sau xe và tăng nhẹ để mặt đuôi, hông xe nhận sáng lạnh ở vùng bóng; nó vẫn chỉ thuộc layer gameplay. Ổ gà dùng viền ngoài xanh than và vách nghiêng cát sáng hơn để lòng tối tách khỏi đường. Nước giữ palette hiện tại. Không đổi footprint, collider, spawn hay cue HUD.

Theo làm rõ của chủ dự án, layer gameplay chỉ gắn cho xe, NPC **đang ở trên đường** (công an/dân phòng, người bán hàng rong) và hazard đường; khách chờ ở lề không nhận đèn accent. Scene mẫu có thêm công an và thùng hàng để nhìn phân cấp này ở camera sau. Áo công an và đai thùng sáng hơn một chút, không đổi kích thước/pose. Nước trang trí biển, ruộng, sông, hồ đã giảm saturation và độ chênh giữa các facet; nước hazard trên làn chạy giữ nguyên để không bị lẫn với cảnh quan.

### Ưu tiên rút gọn sau feedback 25/10

Chủ dự án ưu tiên hoàn thành bản chơi thiết yếu. Vòng polish người trước tích hợp chỉ cần **6 mẫu khách** có vai trò/hình dáng khác nhau: `commuter`, `student`, `child`, `worker`, `parent`, `senior`, cộng tài xế. Sáu mẫu khách còn lại đã có source nhưng không cần tiếp tục polish ở vòng này; không xóa để tránh phá khả năng reuse. Tạm hoãn skin sơn, nội thất, props nhỏ, biểu cảm/animation phụ và các biến thể trang trí không cải thiện độ đọc gameplay.

Đích hình ảnh ưu tiên ngay: nhà ven đường có local color trung tính/tối hơn, mặt khuất nhận ambient cyan tối, nắng ấm tạo mảng sáng rõ; fog cyan tăng về cuối đường trên geometry và gradient nền trời được hòa cùng tông ở chân trời. `storm-lighting.ts`, palette nhà code-native và cảnh `scene.html` đã thử hướng này. Nhà Blender nhập vào cảnh được giảm saturation/độ sáng bằng helper `gradeStormCityBuilding()` dùng lại được; `.blend` và `.glb` gốc chưa đổi. Nước hazard gần giảm từ lưới 12×16 ô (384 tam giác) xuống 8×10 ô (160 tam giác), các màu facet sát nhau hơn; footprint/collider giữ nguyên. Cần chủ dự án xem cảnh sau chỉnh, rồi kiểm cả hai yêu cầu trên route game thật trước khi duyệt art cuối.

- Kích thước tám xe lấy từ `src/vehicles.ts`: 0,896×2; 0,96×2,2; 1,86×4,2; 2,08×4,8; 1,76×3,2; 2,72×10; 2,72×7; 2,88×15 m. `src/art` chỉ cấp mesh, pivot và socket; không cấp collider mới.
- Nước/ổ gà nhận `entity.width` và `entity.length` trực tiếp. Tàu 24×2,8 m, rào 6,2×1,4 m, vendor 1,8×2,1 m; cứu thương dùng car7 2,08×4,8 m. Animation di chuyển lấy từ `crossMotion`/simulation. Không thay nhịp train, patrol hay vendor trong art.
- `src/art/timing.ts` chuyển thời gian va của tài xế và khách sang phase pose bằng chính `balance` hiện hành. Driver: 0,8 s văng + 0,5 s dừng + 1,8 s trở lại. Khách: 0,65 s văng + 0,4 s nằm + 0,55 s đứng. Khi code tích hợp phải sample lại theo simulation active time, xử lý pause/reset/retire, không phát clip độc lập gây trễ gameplay.
- Đường chạy ba làn × 3,2 m, sample mỗi 4 m. Cụm cảnh quan theo `roadsideRegions()` dài 96 m, chỉ decorative, ở ngoài mặt đường. Không thêm spawn/collider cho cây đổ mẫu dự phòng.
- Preview riêng: `/art-preview/vehicle-gallery.html`, `/art-preview/people.html`, `/art-preview/world-gallery.html`. Bản xem trước không chứng minh cảm giác lái, thời điểm va, tốc độ khung hình hay art review độc lập.
