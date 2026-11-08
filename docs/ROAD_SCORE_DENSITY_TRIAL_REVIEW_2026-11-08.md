# Bản thử điểm trên đường và special dày hơn — 08/11/2026

> Cập nhật theo feedback chủ dự án: phần đo bên dưới là vòng `road-v1` trước khi chỉnh. Bản `road-v2`, config `road-score-special-density-trial-2`, thử +3 mỗi vật, cách 8 m, các dải 64 m chiếm 1–3 làn theo seed. Bảng điểm tách version. Browser IAB seed 17: bấm Bắt đầu, giữ W 5 giây tới khoảng 180 m, thấy rõ dải hai làn kéo dài, nhặt 33 điểm, HUD và điều khiển vẫn hoạt động. Đây là một lượt quan sát, chưa chứng minh mọi seed đều dễ đọc hoặc độ khó đã đạt; không dùng kết luận nhịp độ của `road-v1` như dữ kiện của `road-v2`.

**Tự review `road-v2`:** nhịp nhặt tăng rõ mà mỗi viên chỉ bằng 1/4 điểm trước; các đoạn 2–3 làn giảm yêu cầu đổi làn liên tục, còn điểm nằm trên hazard giữ lựa chọn mạo hiểm. UI hiện có thể đọc dải hai làn ở seed 17 nhưng nhiều vật sáng cùng lúc có thể làm rối cảnh báo hazard ở tốc độ cao. Lần chơi sau nên hỏi chủ dự án điểm có lấn cảnh báo nước/tàu không và có thấy đủ lý do để chịu va chạm không. Đây là nhận định từ một lượt browser và test seeded, chưa phải đánh giá người chơi.

## Phạm vi và dữ kiện

- Nền: `origin/main` e0eb3f4580ee32b95660637b98cd548771bc900d; branch `codex/road-score-encounters`. Config `road-score-special-density-trial-1`; seed 17 cho browser, seed 1–100 cho độ phủ, 1–30 cho pilot. Số mới đều **TẠM**.
- Ván chính nhặt vật điểm +12 ở khoảng cách cách nhau 24 m, đầu 96 m. Làn được seed riêng; điểm có thể trùng hazard. Không cộng điểm từ quãng đường/tốc độ/khách. Tiền và giá giữ nguyên. `ver.noforce` vẫn dùng luật điểm và lịch special cũ.
- Special: gap 360→320 m; cooldown công an 1200→900 m, tàu 800→600 m. Chu kỳ 12 loại và minimum gap 220 m giữ nguyên. Dân phòng thu 110 hoặc số dư thấp hơn khi tiền ≤220; khi >220 thu 50% số tiền tại va chạm.
- `tests/balance-coverage.test.ts`, 100 seed, đường sinh đến 3 km: 776 nhóm special; công an 129, dân phòng 134, tàu 126. Baseline P8 trước đó là 700 nhóm trên cùng 100 đường. Rào/hàng rong/cứu thương có mặt ở 63/65/65 đường. Backup vẫn 685 special và 98 cặp hazard đúng baseline riêng.
- `tests/balance-simulation.test.ts`, 30 seed × ba pilot có phản ứng giới hạn, tối đa 720 s: trung bình gặp 4,5 special (cẩn thận), 4,7 (trung bình), 4,0 (nhanh). Median thời lượng lần lượt 387/473/192 s. Xe đầu vẫn được mua ở median 20,2/20,2/12,7 s. Đây là bot, không đại diện kỹ năng người chơi.
- `tests/road-score.test.ts` kiểm điểm chỉ cộng khi swept contact, không cộng khi bỏ làn/đi qua khoảng trống, nhặt một lần, tiền không đổi, lấy điểm trong nước vẫn hao xăng, và phạt dân phòng không trần. Test độ phủ có điểm trùng patch nước/ổ gà trên nhiều seed.

## Tự review game designer

**Dữ kiện:** tăng 10,9% nhóm special được sinh trên 100 đường so với P8; số special bot thực gặp là khoảng 4–5 trước khi kết ván. Người lái tốt vẫn có thể sống lâu nhờ né và tiếp tế. Điểm giờ tạo lựa chọn chủ động khi đi qua patch nguy hiểm. Phạt dân phòng ở ví lớn tạo áp lực tiền rõ hơn, không làm tăng âm thầm theo distance.

**Nhận định/đề xuất chờ người chơi thử:** 24 m/+12 điểm có thể khiến vài làn đổi quá thường xuyên hoặc không đủ hấp dẫn để chịu va chạm nặng. Sau lượt chơi, hỏi có thường bỏ điểm, có phân biệt được điểm với tiền/xăng, và có thấy rủi ro xứng đáng. Chỉ sau nhận xét đó mới chỉnh giá trị/mật độ điểm hoặc mức phạt. Chưa đo được fairness của điểm trùng tàu hay traffic trong ván thật.

## Tự review UI/UX

**Quan sát browser:** IAB tại `http://127.0.0.1:5174/?seed=17` đã hiện start, khung lái, HUD, vật điểm trên đường; sau bấm Bắt đầu tốc độ 50,4 km/h, tiền 280→282,6 theo quãng đường, điểm vẫn 0 khi đi qua làn khác. Giữ A 1,2 s làm xe chuyển rõ từ làn giữa sang mép trái. Biểu tượng điểm vàng thấp trên mặt đường, có vòng sáng; phải kiểm thêm độ đọc khi chồng nước, xe, mưa và khi tăng tốc. Ở IAB `?scenario=stress&seed=17`, xe từ container đổi sang buýt sau tai nạn, HP buýt về 0 ở 435 m, màn kết ván hiển thị; bấm Chơi lại đưa về container 300 HP, 45 L, 10.000 tiền cùng seed. Chưa tự lái trúng vật điểm trong browser.

**Ưu tiên:** trước khi khóa art/UI, cho chủ dự án chơi cùng seed và hỏi vật điểm có đọc được ở ba làn, thời gian phản ứng đủ không, khi bỏ điểm có hiểu vì sao, và sau va chạm có đọc được trừ tiền. Ảnh đơn lẻ không chứng minh điều khiển/timing/fairness.

## Gate và giới hạn

- Windows, Node/pnpm từ lockfile. `pnpm lint` pass; `pnpm typecheck` pass; `pnpm test --maxWorkers=2 --reporter=dot` pass 80 files/440 tests; `pnpm build` pass (cảnh báo chunk Three.js >500 kB, không fail).
- Manual browser: start, A điều hướng, camera/HUD, tiền/điểm khác nhau, hỏng xe, màn kết ván và restart đã quan sát. Nhặt vật điểm bằng phím và va chạm riêng từng công an/dân phòng/tàu **CHƯA KIỂM TRA THỦ CÔNG**; unit/integration simulation có kiểm các đường logic này nhưng không thay thế chơi tay.
- Đây là bản thử cần nhận xét của chủ dự án. Không suy từ số spawn rằng mọi người đều gặp 776/100 đường hay độ khó đã đạt. PR chỉ để review, chưa merge.
