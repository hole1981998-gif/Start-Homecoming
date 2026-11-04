# P9 — nhân vật chuyển động và khách xe hai bánh (tự review, 27/10/2026)

## Thay đổi

- Bước đi có nhịp nâng hông nhẹ, chân và tay đối pha, gối gập khi chân quét về sau. Pose giơ tay có biên độ vẫy rõ hơn và chu kỳ 2 giây. Chỉ thay pose hình ảnh theo `activeSeconds`; không thêm root motion vào simulation.
- Xe máy và mô tô trước chỉ có một ghế khách dựng sẵn. Khi quá tải, khách tiếp theo rơi về người hộp placeholder. Mọi khách trên xe mở nay dùng cùng model nhân vật như khách đầu, gắn thêm điểm ngồi ở phía sau khi vượt số ghế dựng sẵn. Chuyển model người chơi từ far sang near LOD; không đổi sức chứa hay phạt quá tải.

## Kiểm tra

- `pnpm exec vitest run --configLoader native tests/art-open-passengers.test.ts tests/art-people.test.ts tests/art-runtime-people.test.ts`: pass 18/18, exit 0. Test ghế quá tải cả xe máy/mô tô, pha bước và vẫy lặp lại, không tích lũy lệch pose.
- Manual: ChatGPT in-app browser `art-preview/people.html`, học sinh pose walk/hail: bước chân đối pha, một tay vẫy hiện rõ. Bản chơi `?scenario=passenger-crash&seed=17&diagnostics` ở khoảng 2 m: HUD 4/2 và ba khách trên xe máy đều là model người, không thấy thân/hộp placeholder. Kịch bản này sớm gặp xe cản; chưa kiểm hành vi quá tải kéo dài hoặc mô tô trong browser.
- `pnpm lint`: pass, exit 0. `pnpm typecheck`: pass, exit 0.
- `pnpm test --maxWorkers=2`: pass 63 file, 379/379 test, exit 0.
- `pnpm build`: pass, exit 0; Vite cảnh báo bundle Three.js >500 kB.

## Tự review

Game design: không đổi simulation/capacity. UI/UX: nhóm 4/2 trên xe máy nhìn dày ở góc camera sau, nhưng nhận ra đầu và thân từng người; cần người chơi đánh giá mức chồng hình khi có nhiều khách hơn. Art direction: chuyển động có nhịp hơn song vẫn là animation procedural cơ bản, chưa đạt mức keyframe phong phú hay duyệt cuối.
