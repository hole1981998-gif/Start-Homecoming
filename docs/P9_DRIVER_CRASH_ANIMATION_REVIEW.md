# P9 — tài xế Blender trong chuỗi va chạm

Ngày 26/10/2026. Nhánh `codex/p9-driver-crash-animation` tách từ P9 visual tại `2ba3992`. Đây là tự kiểm của Codex, chưa phải duyệt hình cuối.

## Thay đổi

Tài xế ngồi lái đã dùng mesh copy từ `driver.adjusted` của chủ dự án, nhưng khi văng khỏi xe renderer chuyển sang mẫu procedural khác. Nay cùng mesh Blender được clone cho tài xế văng, nằm và đứng dậy. Các pivot hip, torso, tay, chân, khuỷu và gối nhận pose từ `driverCrashPose(s.crash.elapsed)`; root vẫn đi theo vị trí/yaw/độ nghiêng do simulation hiện hành quyết định. Nếu GLB thiếu pivot, renderer giữ mẫu procedural làm fallback. Không sửa source `.blend`, collider, thời gian crash, tài nguyên, RNG hay luật kết ván.

## Kiểm tra

- `tests/art-runtime-people.test.ts`: tải GLB thật, xác nhận hip hạ xuống ở grounded, nâng trong recover, pose lấy lại cùng thời điểm không tích lũy transform, template gốc không bị đổi. 5/5 pass.
- In-app browser, `/?scenario=passenger-crash-car&seed=17&diagnostics`: bắt đầu với car4 và 4/4 người; khoảng 14 m va chạm làm HP 184→164, tài xế/khách văng và HUD báo miễn nhiễm, sau đó xe tăng tốc lại. Escape giữ nguyên khoảng cách 14 m trong pause, restart khôi phục 4/4 và 0 m. Mẫu tài xế rất nhỏ ở góc chơi và modal pause che cảnh; ảnh màn chơi trong lượt này chưa đủ để đánh giá nét pose/shape ở từng pha.
- Windows local, riêng nhánh animation tại `724a8ea`: `pnpm lint`, `pnpm typecheck`, `pnpm build` exit 0; `pnpm test --maxWorkers=2` exit 0, 60 file / 363 test. Targeted Vitest 5/5 pass. Build cảnh báo chunk Three.js trên 500 kB. Trước đó workspace chung có một lượt 364/364 cùng chỉnh lighting chưa commit, nhưng kết quả riêng nhánh này là 363/363. CI chưa kiểm.

## Tự review

- **Game designer:** chỉ thay biểu diễn cùng trạng thái; dữ kiện va chạm và hồi lại được quan sát ở fixture, chưa có lý do đổi damage hoặc thời lượng.
- **UI/UX:** cue crash và tài nguyên vẫn đọc được; cần kiểm pause ở nhiều pha và cảnh đông người để thấy rõ người văng, không thêm overlay.
- **Art direction:** continuity của tài xế tốt hơn vì cùng mẫu Blender ở xe và trên đường. Pose vẫn xoay pivot procedural, chưa có skeletal clip/diễn xuất đạt reference; chưa tự nâng điểm nhân vật lên trên 7/10. Cần xem cận cảnh và người dùng duyệt.

Merge: chưa thực hiện. File Blender chủ dự án đang sửa vẫn nằm cục bộ, không thuộc thay đổi này.
