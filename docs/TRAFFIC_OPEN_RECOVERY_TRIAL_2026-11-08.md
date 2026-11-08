# Bản thử traffic xe mở ngã và dựng xe — 08/11/2026

- Base `origin/main` e0eb3f4; branch `codex/traffic-open-vehicle-falls`; seed 17. Fixture `?scenario=traffic-open-recovery&seed=17`. `ver.noforce` giữ nguyên.
- Mô tô, xe máy, ba gác traffic còn HP sau va chạm dừng lại, tài xế văng ra, xe nghiêng, sau thời gian ngã/đứng dậy/quay lại như tài xế người chơi thì dựng xe, chạy tiếp bằng xăng còn lại. Các xe kín vẫn theo luật dừng hiện hành. Khi HP về 0, xe hỏng; roster sinh thêm tài xế thành NPC một lần. Xe do người chơi húc hỏng tạo người từ chối lên xe theo cờ hiện có.
- Simulation: test va chạm người chơi với cả ba loại xe mở, bảo toàn xăng trong lúc ngã và chạy tiếp sau khoảng 3,1 s; test va chạm giữa hai xe traffic, bảo toàn luật xe kín; test roster deterministic và không sinh lặp. Bộ test toàn repo 80 files/438 tests pass; lint/typecheck/build pass sau chỉnh cuối.
- Browser IAB seed 17, fixture: đã bấm Bắt đầu, thấy mô tô bên phải và ba gác bên trái nghiêng xuống, người bên phải văng ra, HUD/input còn hoạt động. Pha dựng xe trọn vẹn **chưa quan sát được trực tiếp** do xe ra khỏi khung khi chờ; simulation xác nhận trạng thái phục hồi nhưng không thay cho cảm giác nhìn.

## Tự review game designer

**Dữ kiện:** xe mở sống sau va chạm quay lại giao thông, nên một chướng ngại có thể tiếp tục xuất hiện thay vì bị xóa. Không cấp HP/xăng miễn phí. **Nhận định:** tăng tính sống động và áp lực né ở đoạn đông; nếu xe đứng ngay cửa hẹp và dựng lại trong lúc người chơi tới, cần kiểm tra cue trước khi tăng tần suất spawn. Đề xuất chờ người chơi thử tốc độ dựng và khả năng nhận ra xe còn chạy được.

## Tự review UI/UX

**Dữ kiện:** góc nghiêng xe và người văng tách được trên ảnh fixture bên phải. **Rủi ro:** ba gác ở xa và cảnh mưa khó đọc người đứng bên cạnh; nên xem trực tiếp ở nhiều khoảng cách và giữ cue HP/xác xe rõ. Đây là tự review từ một lượt browser và unit simulation, không phải art direction cuối.
