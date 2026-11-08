# Tự review: độ rõ tiếng động cơ người chơi

## Quan sát và thay đổi

Revision nền `3a2698e`, branch `codex/engine-presence-mix`, seed chơi thử `17`. Đo RMS file gốc bằng AudioContext trong trình duyệt: dải 350 Hz–3 kHz của xe máy khoảng 0,0705, trong khi mưa khoảng 0,0787. Sau gain hiện tại và bus, hai nguồn gần ngang nhau ở dải giúp nhận ra tiếng máy; nhạc còn che thêm. File động cơ ô tô và xe nặng có RMS tổng thấp hơn xe máy (0,099 và 0,113 so với 0,215).

Thêm EQ đỉnh 850 Hz, +6 dB, Q 0,8 riêng cho động cơ người chơi, giữ vòng lặp và tốc độ phát theo tốc độ xe. Bù gain ô tô 1,7 lần và xe nặng 1,5 lần so với mức xe máy; mức khi trôi vẫn thấp hơn khi có lực kéo. Ngắt kết nối EQ khi chuyển xe, tạm dừng và reset. Không đổi mưa, nhạc, âm xe NPC hoặc gameplay.

## Kiểm tra

| Gate | Kết quả |
| --- | --- |
| `pnpm lint` | Pass, exit 0 |
| `pnpm typecheck` | Pass, exit 0 sau khi sửa mock filter |
| `pnpm exec vitest run --configLoader native --maxWorkers=2 --reporter=dot` | Pass, 79 file / 433 test, exit 0 |
| `pnpm build` | Pass, exit 0; cảnh báo chunk Three.js >500 kB đã có từ trước |

**Manual:** ChatGPT in-app browser, `http://127.0.0.1:5183/?seed=17`. Bắt đầu ván, giữ W: tốc độ tăng từ khoảng 50 lên 69 km/h, HUD/xăng cập nhật. Tiếp tục đến kết thúc vì hết xăng tại 1057 m, nhấn Chơi lại và thấy ván mới tiếp tục. Không thấy lỗi console. Bài test audio xác nhận engine loop khởi động, có EQ, chuyển xe lấy file ô tô, pause/reset dừng stem. Không có đường thu âm từ browser để nghe kiểm chứng mức âm bằng tai; chủ dự án cần nghe bản chạy trên loa/tai nghe đích.

**Tự review góc game designer:** Đổi mix không tác động độ khó, RNG, chiến thuật hay sự công bằng. Động cơ rõ hơn dự kiến làm phản hồi tốc độ dễ cảm nhận. Cần nghe thực tế để biết xe có lấn cảnh báo khi đông traffic không.

**Tự review góc UI/UX:** Ba slider âm lượng vẫn có ở màn đầu và màn kết thúc; HUD và cảnh báo vẫn hiện khi tắt tiếng. Thử thực tế xác nhận luồng bắt đầu, lái, kết thúc, chơi lại. Đề xuất lần nghe sau: so sánh xe máy và ô tô tại cùng tốc độ, cùng mức slider, trên loa nhỏ và tai nghe trước khi khóa mức cuối.
