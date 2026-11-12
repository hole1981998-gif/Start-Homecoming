# Tự đánh giá: chuyển tiếp kết ván và điểm tốc độ (12/11/2026)

## Phạm vi và bằng chứng

- Base: `844d651` (`origin/main` lúc tạo nhánh); branch thử `codex/terminal-score-tuning`. Các số dưới đây là **TẠM**, chưa phải cân bằng đã chốt.
- Cấu hình: luật điểm `hybrid-v2` của game chính; `ver.noforce` giữ bản backup. Gói nhặt +50 và economy tiền không đổi.
- Automated: `pnpm lint`, `pnpm typecheck`, `pnpm build` đều exit 0; `pnpm exec vitest run --configLoader native --maxWorkers=4 --reporter=dot --silent` exit 0, 88 files/502 tests. Test mới kiểm tra điểm ở min/cruise/max, tốc độ tăng sau nâng cấp trong `stepRun`, tiền không đổi, chuyển động traffic/tàu/đồ rơi trên bản sao hình ảnh và RunResult bất biến. Build có cảnh báo bundle lớn >500 kB của Vite.
- Manual: in-app browser tại `http://127.0.0.1:5182/`. Với `?scenario=vehicle-failure&seed=17`, sau khi bấm bắt đầu, HP bằng 0 và quãng đường 4 m trong lúc bảng kết thúc còn ẩn; bảng hiện sau khoảng 2 giây, HP/quãng đường không đổi trong thời gian chờ. Với `?scenario=score-pickup&seed=17`, thẻ đầu tiên hiện lời giải thích mới và tạm dừng an toàn; đóng thẻ, giữ W, xe đạt 60,7 km/h, HUD nhận gói +50 tại 69 m; Esc tạm dừng và khởi động lại đưa điểm/quãng đường về 0. Sau đó mở `/?seed=17` làm bản chơi thử.
- Giới hạn bằng chứng: thử tay xác nhận thời gian bảng kết thúc và chỉ số bị khóa, nhưng tình huống `vehicle-failure` không chứng minh bằng mắt chuyển động từng tàu/NPC sau va chạm; phần đó được kiểm tra bằng test logic. Không có Product Design audit tool đang kết nối trong lượt này; UX review dưới đây dựa trên màn hình và thao tác browser vừa thử. Chưa có playtest dài đo phân bố điểm theo cấp động cơ/nitro.

## Game designer — dữ kiện và nhận định

- **Dữ kiện:** ở min 0 điểm/m, cruise 0,01 điểm/m, max catalog 0,40 điểm/m, trước hệ số khách. Từ cruise đến max catalog điểm/m tăng theo lũy thừa 1,5. Max catalog cố định, nên tốc độ cao hơn nhờ nâng cấp vẫn tăng điểm/m. Mỗi khách tăng 2% tới bốn khách. Kết quả ghi theo `hybrid-v2` để bảng điểm cũ không lẫn thang mới.
- **Nhận định:** giữ W và mua nâng cấp động cơ có mục tiêu điểm rõ hơn; ở trung vị vẫn có lượng điểm rất nhỏ đúng yêu cầu “gần 0”. Gói +50 vẫn có thể đáng đổi lấy rủi ro va chạm. Đoạn kết chuyển động giúp cú tai nạn có hậu quả trực quan mà không làm sai điểm cuối.
- **Rủi ro và đề xuất TẠM:** độ dốc 0,01→0,40 có thể khiến tốc độ tối đa áp đảo lựa chọn né an toàn; nitro và xe đã nâng cấp có thể kéo khoảng cách bảng điểm lớn. Sau khi bạn chơi thử, nên đo điểm/1 km ở cruise, giữ W, nâng cấp một cấp và nitro cùng seed; chỉ đổi hệ số nếu chênh lệch làm mất ý nghĩa chiến thuật né/nhặt.

## UI/UX — tự review

- **Ưu tiên vừa:** card đã nêu rõ W, nâng cấp động cơ, gói +50 và tiền riêng. Card xuất hiện trước khi điều khiển, có thể đóng, không che nguy hiểm đang chạy trong tình huống thử. Kiểm lại cách đọc trên màn hình nhỏ ở lượt UI sau.
- **Ưu tiên vừa:** trong hai giây sau kết ván, HUD vẫn hiện số đã chốt; người chơi thấy cảnh tiếp diễn rồi mới thấy kết quả. Cần chơi thử thêm các lý do kết ván khác (tàu, công an, hết xăng, secret) để nhận xét nhịp chuyển và âm thanh trên thiết bị thật.
- **Ưu tiên thấp:** thời gian kết thúc chỉ tích lũy khi tab hiển thị, tránh bỏ qua cảnh nếu chuyển tab. Cần quan sát ở máy yếu xem cảnh hậu kỳ có giữ được nhịp mượt; bản test hiện không cung cấp phép đo frame time riêng cho hai giây này.
