# P9 — Nhân vật 3D trong ván, lượt kiểm 26/10/2026

## Thay đổi và nguồn

- Branch `codex/p9-character-runtime` nối tiếp commit `0b7f661` của sửa khách cửa sổ; nền art `67dafca` không bị ghi đè. Không sửa source người dùng trong `assets/art/` hay số cân bằng.
- Tài xế xe máy, mô tô, ba gác dùng bản `driver-adjusted-delivery.glb` đã có, lấy pose ngồi từ pivot nguồn. Nếu GLB không có pivot hợp lệ, giữ tài xế procedural. Không dùng clock animation riêng.
- Khách trên xe mở dùng model người theo ghế/ID thay cho khối hộp. Người chờ hoặc bị văng bên đường dùng sáu archetype chọn ổn định từ ID, pose từ `activeSeconds` và state `passengerMotion`. Tài xế văng dùng pose theo `crash.elapsed`.
- Khách quay lại sau crash cũng dùng model người theo ID; khách ở cửa sổ xe kín đổi từ hai hộp sang đầu đa diện và thân trụ low poly, vẫn một bust cho một khách. Khách quá tải ngoài số ghế trên xe mở còn dùng placeholder cũ, cần kiểm riêng.
- Chỉ thêm `drawCalls` và `triangles` vào `?diagnostics`; gameplay, roster, capacity, collider, RNG, shop và damage giữ nguyên.

## Gameplay/browser đã chạy

Edge headless Windows, 540 × 960, seed 17, Vite DEV. Test hình ban đầu dùng SwiftShader; kiểm hiệu năng sau dùng NVIDIA RTX 2070 / ANGLE D3D11. Đây là thao tác tự động trên browser thật, **không** là playtest cảm giác lái của người.

| Kịch bản | Quan sát |
|---|---|
| `visual-vehicles-motorcycle`, `motorbike`, `tricycle` | Xe chạy và HUD đúng 2/2, 2/2, 4/4; tài xế Blender và khách ngồi thấy trong camera 9:16. [Mô tô](evidence/p9-character-runtime/qa-visual-vehicles-motorbike-after.png), [ba gác](evidence/p9-character-runtime/qa-visual-vehicles-tricycle-after.png). Không có page error. |
| `visual-vehicles-tricycle` + G, pause, restart | HUD 4/4 → 3/4 và thùng bớt một khách; restart trở về 0 m, 4/4, xăng/HP đầu. [Ảnh sau G](evidence/p9-character-runtime/qa-tricycle-g.png). |
| `passenger` + F | Đóng card, bấm F lúc xe ở 4 m gần người chờ tại 5 m: HUD 1/2 → 2/2 và hiện `+1 người`; không có page error. |
| `passenger-crash-car` | Qua các thẻ khám phá an toàn, va chạm ở khoảng 8 m: HP 184 → 164 và khách 4/4 → 0/4; người hiện ngoài xe theo pha văng. Sau hồi, HUD 2/4 và hai khách không trở lại vẫn đứng cạnh đường. [Pha văng](evidence/p9-character-runtime/qa-crash-early.png), [sau hồi](evidence/p9-character-runtime/qa-crash-recover.png). Không có page error. |
| `visual-vehicles-bus`, `vehicles-car4`, `p8-water` | Bus đầy 25/25 với bust ở cửa sổ [ảnh bus](evidence/p9-character-runtime/qa-bus-windows.png); Tab từ xe máy sang car4 thấy HUD 1/4; vùng nước render và xe còn chạy. Không có page error. Ca Tab thực hiện trước lượt thay khách trên xe mở, chưa lặp trên mã cuối. |

Lượt F đầu bấm sau khi xe đã qua người chờ nên không đón được; đã lặp đúng cự ly và pass như bảng trên. Chưa kiểm mọi seed/biome, QTE đông người, thiết bị đích, và cảm giác lái bằng người thật. Thẻ khám phá có thể pause game và đã được đóng qua nút `#play`; screenshot không thay bằng chứng timing/input.

## Hiệu năng trên máy hiện tại

`?diagnostics=1`, Edge headless ANGLE D3D11 / NVIDIA RTX 2070, 540 × 960, seed 17; `frameP95Ms` tính trên cửa sổ frame được nêu. Đây không phải benchmark thiết bị mục tiêu. Draw calls/tam giác là frame cuối của cửa sổ, không phải trung bình.

| Cảnh | Frame / cửa sổ | FPS trung bình | P95 ms | Render CPU trung bình ms | Draw calls | Tam giác |
|---|---:|---:|---:|---:|---:|---:|
| Ba gác `handling-tricycle` | 240 / 240 | 57,1 | 16,9 | 8,78 | 504 | 18.862 |
| Bus 25/25 khởi động | 240 / 240 | 54,3 | 33,3 | 12,39 | 704 | 21.302 |
| Bus 25/25 sau warmup | 720 / 600 | 58,2 | 16,9 | 9,14 | 739 | 29.636 |
| `p8-water` | 240 / 240 | 58,3 | 17,0 | 13,52 | 995 | 30.706 |

Bus còn spike lúc khởi động/chuyển cảnh; CPU của vùng nước cao hơn. Backend SwiftShader thử trước đó chỉ khoảng 2,8–3,5 FPS và không dùng để kết luận GPU. Cần đo nhiều seed, GPU/memory/stutter trên thiết bị đích và trước/sau khi thay GLB nguồn.

## Gate tự động

Windows, Node 24.14.0, pnpm 11.25.0. Trên mã cuối của lượt này, chạy tuần tự: `pnpm lint` exit 0; `pnpm typecheck` exit 0; `pnpm test` exit 0 (gồm test GLB thật, cast/pose và full gameplay suite); `pnpm build` exit 0. Vite vẫn cảnh báo chunk Three.js >500 kB. Không bỏ test, đổi timeout/rule hay dùng `--no-verify`.

## Tự review theo vai trò

**Game designer — dữ kiện:** HUD, HP và roster trong các ca trên khớp state; F đón được khi ở đúng cự ly; không đổi logic/RNG/tốc độ. **Nhận định/ĐỀ XUẤT:** người bên đường và pha văng dễ nhận diện hơn. Lượt tới kiểm G khi quá tải và crash/reboard ở nhiều seed trước bất cứ chỉnh cân bằng nào.

**UI/UX designer — ưu tiên P2:** camera sau đọc được tài xế/khách mà không che hành lang lái hoặc HUD trong ảnh đã xem. Lượt đầu có thẻ discovery dày chữ; ảnh tĩnh không chứng minh độ rõ cảnh báo khi QTE, camera cua, thao tác cảm giác hoặc accessibility. Kiểm trên màn điện thoại thật và đo phản hồi input tiếp.

**Art direction — tự đánh giá sơ bộ từ ảnh/game thật:** silhouette 6/10; sáng tối 6/10; màu/mood 6/10; hình khối 6/10; ánh sáng/thời tiết/vật liệu 5/10; UI/typography 6/10; nhất quán phong cách 6/10 sau bust low poly và người thật trên xe mở; tiếp cận/hiệu năng **chưa chấm** vì chưa có thiết bị đích và người kiểm thực. Tiêu chí ánh sáng/vật liệu dưới 6 cần sửa/chấm lại; art gate cuối **chưa đạt**. Đây không phải review art director độc lập.
