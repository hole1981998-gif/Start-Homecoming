# Tự review: âm thụp khi tông NPC và kiện hàng

## Phạm vi

Revision nền `ce311fc`, branch `codex/owner-impact-foley`, seed thử `17`. Năm MP3 do chủ dự án giao được chép nguyên bản vào `project-reference/sfx/owner-impact-foley-2026-11-07`. Ba file đầu đi cùng SFX và thoại hiện có khi xe người chơi tông hành khách trên đường, dân phòng, công an hoặc hàng rong. Khi xe NPC tông hành khách, lớp thụp cũng phát theo thay đổi `lastHit`. Hai file sau đi cùng tiếng kiện hàng khi người chơi tông `cargoType=crate`; thùng tròn giữ âm riêng.

Đo trong AudioContext ở browser: năm file dài lần lượt 2,116 / 1,440 / 1,080 / 2,136 / 0,705 giây; âm tác động bắt đầu sau khoảng 0,10 / 0,12 / 0,25 / 0,09 / 0,17 giây. Bộ phát bỏ khoảng lặng tương ứng để giảm trễ, giới hạn đuôi 0,7 giây và hạ gain mượt. Biến thể được chọn theo seed, tránh lặp liền. Theo feedback tiếp theo của chủ dự án, gain lớp thụp tăng riêng lên 0,95 cho người và 0,8 cho kiện; gain bus và âm nền giữ nguyên. Không đổi sát thương, mô phỏng, tiền, RNG gameplay hoặc cue hình ảnh.

## Kiểm tra

| Gate | Kết quả |
| --- | --- |
| `pnpm lint` | Pass, exit 0 |
| `pnpm typecheck` | Pass, exit 0 |
| `pnpm exec vitest run --configLoader native --maxWorkers=2 --reporter=dot` | Pass, 79 file / 433 test, exit 0 |
| `pnpm build` | Pass, exit 0; cảnh báo chunk Three.js >500 kB đã có từ trước |

Test audio xác nhận lớp âm mới chồng với SFX hiện có, có offset đầu file và gain mới, ba biến thể tiếng người được dùng không lặp liền, hai biến thể kiện hàng khác nhau, thùng tròn không gọi tiếng kiện. Test cũng bao phủ nhiều lần tông công an/dân phòng và hàng rong.

**Manual:** ChatGPT in-app browser, `http://127.0.0.1:5173/?scenario=force-npc-hit&seed=17`. Bắt đầu, xe chạy qua NPC, HUD tốc độ/điểm/xăng cập nhật, không thấy lỗi console. Mở thêm `?scenario=p63-crate-right&seed=17`, xe tải xuất hiện và người chơi có thể lái/va chạm; lượt lái thử trúng xe tải trước kiện nên **chưa kiểm tra thủ công tiếng kiện đúng lúc**. Dùng `?scenario=coast&seed=17` để kiểm tra ván kết thúc khi hết xăng ở 26 m và nút Chơi lại đưa vào ván mới. Công cụ browser không truyền âm đầu ra để Codex nghe trực tiếp; mức âm cuối cần chủ dự án nghe trong bản chơi đang mở.

**Tự review góc game designer:** Lớp thụp tăng phản hồi cơ thể/vật liệu, không đổi mức khó hay độ công bằng. Vì hiệu ứng chỉ phát khi trạng thái va chạm thay đổi, không dự kiến lặp mỗi frame. Rủi ro cảm nhận: ở cảnh đông xe, nhiều tiếng tông gần nhau có thể bị dày; thử lại seed có nhiều NPC và chỉnh gain riêng nếu cần.

**Tự review góc UI/UX:** Cảnh thử vẫn có HUD, cảnh báo, slider Hiệu ứng và cue va chạm hình ảnh. Tăng gain chỉ ở lớp mới; tắt SFX vẫn tắt lớp này. Chưa đánh giá bằng tai trên loa nhỏ hoặc khi nhiều voice chồng nhau; đây là lần nghe cần thiết trước khi khóa mix.
