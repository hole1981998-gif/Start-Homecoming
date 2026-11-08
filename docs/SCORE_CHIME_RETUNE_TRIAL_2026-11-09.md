# Nghe thử chime điểm take #4 — 09/11/2026

**Revision thử:** `codex/score-chime-retune`, trên nền `fda386c`; config gameplay `score-chime-wind-militia-trial-5` giữ nguyên. Đây là chỉnh âm **TẠM**, không đổi điểm, tiền, mật độ chướng ngại hoặc luật combo.

## Thay đổi và lý do

- Thay nội dung `score_chime.mp3` bằng take `#4` do chủ dự án gửi. SHA-256 mới: `570687D99AEF551ED48C146EFD187484E8A1631D0A4C90557DF5E630D2E05D7A`. File tải xuống gốc không bị sửa.
- Hạ đồng loạt chuỗi tám nấc 2 bán âm: hệ số phát từ khoảng 0,802 đến 1,457, thay cho 0,9 đến 1,635. Sau feedback nghe thử, giảm gain riêng của chime 0,8→0,55→0,28→0,12→0,07, lọc dải cao từ 3,2 kHz và nâng dải thấp +5 dB dưới 700 Hz. Mức chênh giữa các nấc, quy tắc giữ nấc cuối, reset khi hụt điểm, thời lượng phát và fade giữ nguyên.

## Kiểm tra và giới hạn

- Kiểm thử `road-score` và `audio-feedback` đã qua 21/21; xác nhận điểm nhặt tăng nấc, âm dùng đúng asset, có lọc dải cao và nâng dải thấp. Toàn bộ test qua 450/450; lint, typecheck và production build đều exit 0. Build chứa file chime đúng SHA-256 nêu trên.
- Manual trong in-app browser Windows tại `http://127.0.0.1:5181/?seed=17`: ở mức âm 0,55 đã bắt đầu ván, giữ W, điểm tăng từ 0 lên 42 ở 210 m; ở mức 0,12 quan sát 108 điểm ở 422 m với xe ô tô 4 chỗ. Sau lần chỉnh cuối xuống 0,07, tab tự tải lại, màn bắt đầu hiện bình thường, không có console error; chưa chơi hết ván riêng ở mức 0,07. Công cụ không cung cấp cách nghe trực tiếp loa của người chơi để kết luận âm cuối đã dễ chịu. Cần chủ dự án nghe và nhận xét. Chưa kiểm tra thủ công thất bại và restart trong lượt chỉnh âm này; các bài test liên quan qua trong bộ 450 test.
- **Tự review game designer:** không đổi cơ chế hoặc economy; nấc âm cuối thấp hơn nên dự kiến giảm cảm giác gắt khi ăn chuỗi dài. Đây là dự đoán từ pitch, không phải bằng chứng nghe thực tế. **ĐỀ XUẤT chưa áp dụng:** nếu chuỗi kém phấn khích, tăng lại 1 bán âm thay vì tăng volume.
- **Tự review UI/UX designer:** phản hồi điểm vẫn có số điểm và vật điểm trên đường khi tắt âm; không thêm overlay hay thay HUD. Ưu tiên nghe thử nhiều lần nhặt liên tiếp và một lần trượt điểm để kiểm tra cảm giác nhận biết reset.

`ver.noforce` và file art/visual không đổi. PR này xếp sau bản chime/gió/dân phòng trước đó; chưa merge.
