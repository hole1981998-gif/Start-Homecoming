# Bản thử giá xe, điểm, ổ gà và còi — 08/11/2026

- Nền: `e0eb3f4` (remote main) + bản ghép `f5d54e0`; nhánh `codex/playtest-balance-visual-audio`. Config `shop-score-visibility-trial-3`, seed trình duyệt 17.
- Theo yêu cầu chủ dự án: giá ba gác 300, 7 chỗ 1100, buýt 2200, tải 1300, container 2200; phí ổ gà 5; buýt 28 L/168 HP, container 36 L/240 HP. Đây là số thử, chưa xác nhận cảm giác cân bằng. `ver.noforce` giữ giá/tài nguyên/phí ổ gà/còi cũ.
- Điểm giữ 3 điểm/viên và khoảng cách 8 m. Một dải dài 8 điểm có 70% cơ hội một làn, 20% hai làn, 10% ba làn theo seed. Vẫn cho điểm trùng hazard. Model điểm là hình thoi nhỏ bay trên mặt đường, tự phát sáng nhẹ, bỏ vòng sáng dưới.
- Còi T tăng gain phát từ 0,72 lên 1,05 ở bản chính. Voiceline, âm traffic và volume SFX chung không đổi. Không có phép đo âm lượng cảm nhận bằng tai trong môi trường tự động; cần chủ dự án nghe thử trên loa của mình.

## Kiểm tra thực tế

- Sau chỉnh cuối: `pnpm lint`, `pnpm typecheck`, `pnpm build` đều exit 0. Toàn bộ `pnpm exec vitest run --configLoader native --maxWorkers=4 --reporter=dot`: 81 file, 448 test pass. Sau thay đổi cuối ở luồng backup còi, 5 file/56 test liên quan pass.
- Lượt đầu chạy song song với lint/typecheck/build có 3 bài DOM/audio timeout ở giới hạn 5 giây do tải máy; chạy tuần tự giới hạn 4 workers thì qua hết. Lỗi type của bản dự thảo đã sửa trước lượt test cuối.
- Simulation seeded: 30 seed cho mỗi chiến thuật cautious/average/fast đều hữu hạn. Đây là bot có thời gian phản ứng giả định, không chứng minh độ khó cho người thật. Bộ test giao dịch chứng minh đúng giá mới và giá backup; test ổ gà dài chứng minh chỉ trừ 5 tiền một lần; test dải điểm chứng minh đa số một làn nhưng còn dải hai/ba làn.
- Trình duyệt in-app, seed 17: bắt đầu, giữ W, đón khách, nhặt điểm (0→15 ở 135 m), HUD/quãng đường/camera cập nhật. Ảnh trong lượt kiểm tra cho thấy hình thoi nổi trên đường, không có vòng. Đã bấm T; công cụ không cho nghe âm thanh để xác nhận mức gain cảm nhận. Chưa tự chơi qua mọi loại xe/cửa hàng, thất bại và restart trong lượt này; giao dịch và restart được kiểm tra bằng test tự động.

## Tự review

- **Game design — dữ kiện:** giá mới hạ ngưỡng mua xe, buýt/container giảm 20% tài nguyên ban đầu, phí ổ gà giảm còn một nửa. Dải một làn chiếm đa số; điểm vẫn có thể nằm trên chướng ngại. **Nhận định:** lựa chọn mạo hiểm lấy điểm vẫn tồn tại và hình ảnh ít tranh sự chú ý với hazard. Tác động lên tỷ lệ mua xe nặng, thời lượng sống sau khi mua và mức khó khi chạy xa cần đo từ lượt chơi thật. **Đề xuất để chủ dự án đánh giá sau:** nếu buýt/container vẫn sống quá lâu, đo quãng đường và lần va chạm theo từng loại trước khi giảm thêm HP/xăng.
- **UI/UX — dữ kiện:** điểm nhỏ, cao hơn mặt đường, phát sáng nhẹ và không còn vòng nền; seed 17 đọc được dải điểm trên đường. **Nhận định:** độ phân biệt với mảnh đồ rơi/ổ gà ở vùng cảnh tối còn phải xem trên màn hình người chơi. Còi cần nghe thử cạnh voiceline và traffic ở cùng mức volume. Ưu tiên kiểm chứng độ rõ cue trước khi tăng sáng hoặc âm lượng tiếp.
