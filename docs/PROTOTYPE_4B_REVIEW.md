# P4B — nhiều xe và xe dự phòng

Revision kiểm tra: working tree `feature/p4b-vehicle-inventory` trước commit. Config `p4b-vehicles-1`, seed 17 cho manual fixture; 30 seed mỗi chiến thuật cho baseline economy. Đây là tự kiểm tra của Codex, không có chuyên gia độc lập tham gia. Tất cả thông số xe mới đều TẠM.

## Kết quả thực

- Gate Windows/PowerShell, pnpm 11.25: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` đều exit 0 ở lần chạy cuối; 60/60 test pass, gồm assertion va chạm theo chiều rộng xe. Vite báo bundle >500 kB, build vẫn pass.
- Simulation 60 giây trên đường sạch cho 8 loại xe, trống và chở tới 3 khách: mọi lượt tiếp tục chạy, không âm tài nguyên, cruise đạt mốc tương ứng. Xe máy trống đi 840 m, còn 1,72 L, kiếm 420; ô tô 4 chỗ trống đi 960 m, còn 11,2/16 L, kiếm 480; ô tô 4 chỗ chở 3 khách đi 675 m, còn 12,63 L, kiếm 358. Xe buýt trống đi 750 m, còn 27,5/35 L, kiếm 375; chở 3 khách đi 696 m, còn 28,04 L, kiếm 369. Mẫu đầy đủ trong output `tests/vehicles.test.ts`.
- Baseline 30 seed kiếm đủ 800 tiền với xe máy: cruise 30/30, trung vị 85,7 s; W 30/30, 61,2 s; S 28/30, 149,8 s. Đây chỉ là mốc **đủ tiền**, P4B chưa có shop nên chưa đo thời điểm mua thật.
- Test logic: xe thứ ba không trừ tiền/thay slot nếu thiếu tiền hoặc chưa chọn xe bỏ; sau xác nhận còn đúng hai instance. Tab giữ khách, xăng/HP/nâng cấp từng xe; damage chí mạng và hết coast chuyển xe dự phòng đúng một lần; xe mới được bảo vệ ngắn, Tab thủ công không kéo dài miễn nhiễm. Collider và fuel theo định nghĩa xe. Test P4A/P3B tiếp tục qua.
- Manual in-app browser trên localhost: `?scenario=vehicles` bắt đầu, Tab xe máy → ô tô 4 chỗ → xe máy: HUD 1/2 → 1/4 → 1/2 và xăng/HP đổi theo đúng instance, đường/camera tiếp tục chạy. `?scenario=vehicles-bus` và `?scenario=vehicles-container`: xe dài và cung tài nguyên nằm trong màn, đường phía trước còn đọc được sau chỉnh camera. `?scenario=vehicle-replacement`: va xe khi còn 20 HP làm xe máy hỏng, ô tô dự phòng xuất hiện và tiếp tục chạy với 120 HP; restart trả về xe máy 20 HP của fixture. `?scenario=vehicle-failure`: cùng va chạm không có xe dự phòng thì hiện màn kết ván; Chơi lại tạo lượt mới. Đã nhìn ảnh màn hình và accessibility tree trong lượt kiểm tra; chưa thử bằng tay tất cả tám loại xe, mọi tốc độ và chuỗi giao lộ dài.
- Không có tool Product Design audit trong danh sách tool khả dụng; UX bên dưới là checklist thủ công từ build đang chạy. Ảnh màn hình không chứng minh cảm giác lái dài hạn hay độ công bằng RNG.

## Tự review game design

Dữ kiện: xe khác nhau rõ về tốc độ/tải/tank trong simulation; đổi xe là quyết định tài nguyên vì từng instance giữ lại xăng/HP. Auto replacement ngăn thua ngay khi còn xe dự phòng, nhưng chỉ dùng được một xe khác. Chở thêm khách vẫn tăng tiền theo **mét**, song trong mẫu 60 giây ô tô 4 chỗ chở 3 khách kiếm 358 so với 480 khi trống do cruise giảm; đây là yếu tố khiến việc đón khách ít hấp dẫn theo **phút**. Xe buýt 3 khách cũng chỉ 369 so với 375 khi trống. Chưa đo lượt với va chạm/thời gian đón khách, nên chưa kết luận cân bằng thực tế.

**ĐỀ XUẤT chưa áp dụng:** trước P5, đo thêm chiến thuật đón khách 0–3 và đổi xe ở nhiều seed, gồm thời gian thật đến shop đầu. Nếu chở khách tiếp tục giảm tiền/phút và không có lợi ích khác, thử tăng thưởng tiền mỗi khách theo mét từng bước nhỏ hoặc giảm nhẹ cruise loss của ô tô/buýt, mỗi lần chỉ chỉnh một nhóm số. Đồng thời giảm mức hồi bình xăng/hộp sửa theo feedback cũ và đo tỷ lệ thiếu xăng sau tiếp tế; không tự áp dụng số mới trong vòng P4B. Cần chủ dự án chơi thử và nhận xét áp lực xăng, lợi ích chở khách trước thay đổi cân bằng lớn.

## Tự review UI/UX

Ưu tiên cao: tên xe, sức chứa gồm tài xế và hai tài nguyên hiện hành đổi ngay sau Tab; xe dài được camera lùi để thấy thân xe lẫn đường phía trước. Modal đầu ván nói rõ khi có xe dự phòng; failure/restart đọc được. Hạn chế hiện tại: khi auto replacement, tín hiệu chủ yếu là model xe, tên và chỉ số HUD đổi; chưa có cue VFX/SFX tối giản riêng để người chơi nhận ra nguyên nhân lúc đang tập trung vào đường. Nên thêm cue ngắn tại xe trong bước UX kế tiếp, không thêm bảng text lớn. Chưa kiểm tra bàn phím di động hoặc reduced motion.

## Giới hạn quy trình

Không có remote, remote main mới, CI hay PR; nhánh local dựa trên bản P4A/sửa giao lộ đã được chủ dự án chấp nhận trong chat. Chưa merge. Báo cáo sẽ được chốt với kết quả gate cuối và commit ID khi bàn giao.
