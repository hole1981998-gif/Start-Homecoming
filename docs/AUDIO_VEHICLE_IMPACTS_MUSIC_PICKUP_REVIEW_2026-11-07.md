# Tự review: nhạc nền, đón khách và va chạm theo hạng xe

## Thay đổi và lý do

Revision nền `c003197`, branch `codex/vehicle-impact-family-mix`, seed thử `17`. Hạ gain bus nhạc từ 0,42 xuống 0,36 (khoảng 1,3 dB), vẫn giữ slider nhạc và ducking khi có thoại. Khi đón khách, phát thêm một trong ba tiếng thụp người ở gain 0,78 cùng tiếng pickup hiện có; không đổi lời cảm ơn, điều kiện đón hoặc sức chứa.

Chép chín MP3 do chủ dự án giao vào `project-reference/sfx/owner-vehicle-impacts-2026-11-07`. Nhóm nhẹ phục vụ xe máy/mô tô/ba gác; nhóm vừa phục vụ ô tô 4/7 chỗ; nhóm nặng phục vụ buýt/tải/container. Lớp mới đi cùng SFX cũ ở va chạm xe người chơi với xe/chướng ngại và xe NPC va xe/chướng ngại. Cặp hai xe NPC chọn nhóm nặng nhất trong cặp. Không thêm lớp xe cho hành khách bị tông, kiện hàng hoặc tàu vì các sự kiện này đã có âm vật liệu riêng. Biến thể dùng seed và không lặp ngay. Đo AudioContext cho thấy cả chín file dài 2 giây; riêng `medium_02` có khoảng lặng đầu khoảng 0,3 giây, được bỏ khi phát. Mức nguồn RMS dao động khoảng 0,044–0,118 nên mỗi take được bù gain nhẹ trước khi hòa với SFX cũ.

## Kiểm tra

| Gate | Kết quả |
| --- | --- |
| `pnpm lint` | Pass, exit 0 |
| `pnpm typecheck` | Pass, exit 0 |
| `pnpm exec vitest run --configLoader native --maxWorkers=2 --reporter=dot` | Pass, 79 file / 433 test, exit 0 |
| `pnpm build` | Pass, exit 0; cảnh báo chunk Three.js >500 kB đã có từ trước |

Test audio kiểm tra thụp được phát cùng pickup, gain nhạc giảm, cả ba take trong mỗi nhóm xe được chọn mà không lặp liền, bản ô tô thứ hai bỏ khoảng lặng, tiếng mới đi cùng va chạm xe NPC với xe hoặc chướng ngại.

**Manual:** ChatGPT in-app browser, `http://127.0.0.1:5173/?scenario=passenger&seed=17`: bắt đầu và nhấn F, số người tăng 1/2 → 2/2, toast đón khách xuất hiện; HUD tốc độ/xăng cập nhật. `?scenario=crash&seed=17`: va xe, tài xế ngã, HP 123 → 103; không có lỗi console. `?scenario=coast&seed=17`: kết thúc hết xăng ở 26 m, nhấn Chơi lại vào ván mới. Công cụ browser không truyền âm đầu ra để Codex tự nghe, nên cần chủ dự án nghe mức nhạc và các lớp va chạm trên loa/tai nghe đích.

**Tự review góc game designer:** Chỉ đổi mix, không đổi sát thương, spawn, RNG gameplay hay luật mua xe. Ba nhóm âm được dự đoán giúp người chơi phân biệt khối lượng xe. Rủi ro là âm mới và cũ chồng nhau ở đoạn nhiều xe; thử seed đông traffic để cân lại nếu cần.

**Tự review góc UI/UX:** Cue hình ảnh, HP, rider count và slider nhạc/SFX vẫn hoạt động; người chơi không phải dựa chỉ vào âm thanh để biết va chạm hay đã đón khách. Cần nghe thực tế để đánh giá liệu lớp va chạm có che thoại hoặc cảnh báo khi ba sự kiện gần nhau.
