# Intro tĩnh — bản chủ dự án xem thử

## Shotlist đã ghép

| Mốc toàn intro | Hình | Âm |
| --- | --- | --- |
| 0–2s | Đen | Im lặng 0–1s; từ 1s văn phòng + bàn phím |
| 2–6s | Làm việc | Fade in vừa phải; văn phòng + bàn phím; mưa nhỏ từ 4s |
| 6–7,5s | Ngoảnh nhìn | Fade out nhanh hình cũ rồi fade in vừa phải; dừng bàn phím, tiếng “hở” một lần |
| 7,5–9,75s | Bên cửa sổ 1 | Mưa tăng, văn phòng giảm |
| 9,75–12s | Bên cửa sổ 2 | “Hừm” rõ hơn tại 10,5s; mưa tăng, văn phòng giảm |
| 12–17s | Đồng hồ | Fade in nhanh, zoom sát và đưa mặt đồng hồ về gần tâm khung; mưa nhỏ lại, văn phòng về mức shot 1; bước chân từ 15s, bỏ khoảng lặng ~0,48s đầu file |
| 17–21s | Mặc vest | Bước chân tiếp; áo khoác tại 18s; hình fade out gần hết âm áo khoác, từ 19,65–21s |
| 21–25s | Nền đen + logo | Logo hiện dần trong 1,2s, thu nhỏ đều suốt 4s, mờ đi trong giây cuối; mưa và văn phòng tiếp; còi xe máy tại 23s |

Chủ dự án xác nhận ảnh đồng hồ được giữ nguyên và logo bắt đầu **sau shot 4**. Sau lần nghe thử, chủ dự án yêu cầu nhịp dài hơn; bản này dài 25s, logo bắt đầu tại 21s. Shot 4 là ảnh tĩnh theo nguồn, không nội suy chuyển động nhân vật. Tiếng tại logo được chọn tạm từ còi xe máy đã có trong game vì yêu cầu chưa chỉ rõ âm nào; có thể thay sau khi nghe bản dựng.

## Tích hợp

- Intro hiện trên bản game chính trước menu, không chạy trên bản `ver.noforce` hoặc kịch bản thử tình huống. Vì trình duyệt chặn tự phát tiếng trước thao tác người dùng, người chơi bấm **Xem intro** để bắt đầu 25 giây. Có **Bỏ qua**, Esc để bỏ qua, và **Xem intro lại** ở menu. `?intro=0` bỏ intro khi cần kiểm tra trực tiếp game.
- Chuyển tab trong lúc intro sẽ tạm dừng hình và tiếng; bấm **Tiếp tục intro** khi quay lại. Âm mưa và văn phòng phát liên tục qua ranh giới shot. Âm lượng intro theo các thanh “Hiệu ứng” và “Mưa và gió” hiện có.
- Các ảnh và âm chủ dự án cung cấp được chép nguyên trạng vào `public/intro`; tiếng còi logo là bản sao file âm thanh sẵn có trong repo.

## Tự review và bằng chứng

- Bản thử: `codex/static-intro`, seed 17, trình duyệt in-app tại `http://127.0.0.1:5186/?seed=17`.
- Quan sát thủ công bản 25s trên trình duyệt in-app: màn mở đen có nút phát/bỏ qua; sau bấm phát hiện hình văn phòng; cảnh mặc vest và logo hiện đúng thứ tự; hết intro quay về menu. Đã kiểm tra riêng khung 16s: mặt đồng hồ được phóng lớn, vẫn nằm trọn khung. Khung 21,4s: logo hiện mờ, không bị cắt chữ; khung 24,5s: logo nhỏ hơn và đang mờ đi. Bản 21s đầu đã thử bấm bắt đầu lái và thấy card đầu tiên xuất hiện. Tự đo file âm trong trình duyệt: bước chân có tiếng rõ đầu tiên khoảng 0,5s; áo khoác dài khoảng 1,9s và gần kết thúc âm ở khoảng 1,8s. Đây là quan sát hình/input và biên độ file, **không phải** bằng chứng đã nghe và duyệt chất lượng âm.
- Game design: intro không thay simulation/economy. Bỏ qua và xem lại giúp người chơi không phải chờ 21 giây mỗi lần thử. Cần chủ dự án đánh giá nhịp 4 giây đồng hồ và chất âm còi ở logo; chưa đề xuất đổi timing.
- UI/UX: nút bắt đầu rõ, có lối bỏ qua và hỗ trợ Esc; intro che toàn bộ HUD khi chạy. Cần kiểm tra thêm âm lượng thực nghe, đúng thời điểm tiếng áo khoác, mức chuyển động với người nhạy cảm và trải nghiệm màn hình điện thoại trước khi gộp.
- Art direction: **Codex tự đánh giá sơ bộ** cảnh đại diện shot 1, shot 3 và logo trong trình duyệt, không phải review độc lập. Silhouette/đọc hình **8/10** (nhân vật và đồng hồ rõ ở khung tĩnh); sáng tối/tương phản **7/10** (cửa sổ mưa xanh tách đèn phòng cam); màu/saturation/mood **7/10** (u ám vừa phải, màu nhân vật vẫn đọc được); ngôn ngữ hình khối **7/10** (cùng phong cách low-poly giữa ảnh); ánh sáng/thời tiết/vật liệu **7/10** (đèn văn phòng và mưa nhất quán); UI/typography **7/10** (logo nổi trên nền đen, nút bỏ qua đọc được); nhất quán phong cách **7/10** (6 ảnh cùng ngôn ngữ hình); tiếp cận/hiệu năng **6/10** (có bỏ qua nhưng 6 PNG gốc ~9 MB cần theo dõi thời gian tải thực trên mạng chậm và mức chuyển động). Không có tiêu chí dưới 6, nhưng vẫn cần chủ dự án đánh giá và chưa tuyên bố đã qua duyệt art direction cuối.
