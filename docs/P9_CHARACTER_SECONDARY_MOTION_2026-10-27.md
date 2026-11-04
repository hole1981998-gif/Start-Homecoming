# P9 — chuyển động phụ của nhân vật (tự review, 27/10/2026)

Sau khi sửa animation đứng hình, pose ngồi xe và đứng vẫn có biên độ rất nhỏ. Tăng nhịp thở/đổi trọng tâm ở vai, thân, đầu và tay cho nhân vật procedural; đồng bộ độ rung nhẹ của mesh tài xế Blender khi lái. Pose từ chối có lắc đầu, pose nằm sau va chạm có nhịp thở nhẹ. Không thay vị trí root, ghế, thời lượng crash hoặc simulation.

Preview Blender driver dùng cùng biên độ với runtime cho stand/riding/refuse. Trong `art-preview/people.html` đã xem trực tiếp walk, hail, riding, ejected, grounded, recover, seated và refuse ở góc sau/ba phần tư. Các pose thay đổi hình; grounded là tư thế nằm giữ, còn seated/riding đang được xem không có xe/ghế trong preview nên nhân vật trông lơ lửng ở đó. Cần đánh giá thêm khi gắn lên xe trong gameplay và ở tốc độ khung hình thật.

## Kiểm tra

- Test riêng: `pnpm exec vitest run --configLoader native tests/art-people.test.ts tests/art-runtime-people.test.ts` pass 17/17. Lượt đầu có một test mới chọn nhầm mesh `head` thay vì pivot `head_pivot`, đã sửa test để đo đúng khớp rồi chạy lại pass; code animation không đổi vì lỗi đó.
- `pnpm lint`: pass, exit 0. `pnpm typecheck`: pass, exit 0.
- `pnpm test --maxWorkers=2`: pass 63 file, 380/380 test, exit 0.
- `pnpm build`: pass, exit 0; Vite cảnh báo bundle Three.js >500 kB.

## Tự review

Game designer: pose chỉ truyền trạng thái hình ảnh, không ảnh hưởng di chuyển hoặc độ khó. UI/UX: cử chỉ đi/vẫy rõ hơn, nhưng nhân vật xa camera vẫn nhỏ; không dùng animation như cue duy nhất. Art: chuyển động procedural đã bớt đứng tượng, song chưa thay thế animation keyframe chi tiết nếu chủ dự án muốn mức cao hơn.
