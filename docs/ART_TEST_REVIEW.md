# Kiểm tra và tự review gói art thiết yếu — 24/10/2026

Revision lúc chạy: base `f289612`, branch `art/essential-asset-pack`, worktree có source art chưa commit. Môi trường: Windows, Node v24.22.1, pnpm 11.25.0, Vite 7.1.12. Source gameplay/config không sửa.

| Gate / kịch bản | Kết quả thực tế |
|---|---|
| `pnpm lint` | Exit 0; kiểm `src`, `tests`, `art-preview`. |
| `pnpm typecheck` | Exit 0; TypeScript strict gồm `art-preview`. |
| `pnpm test --reporter=dot` | Exit 0; 52 test files, 300 tests pass. Gồm footprint/pivot/timing/LOD mới và simulation hiện hữu. |
| `pnpm build` | Exit 0; xuất game và cả năm trang preview. Có cảnh báo chunk Three.js >500 kB, chưa đo ảnh hưởng runtime. |
| Preview browser local | Đã mở và nhìn `scene.html`, xe nhiều góc, người, nước, tàu, nhà, hàng rong, công an, shop và tai nạn trong in-app browser. Cảnh tĩnh 9:16 hiển thị 460 draw calls / 8.474 tam giác với ba xe. Đây là kiểm hình tĩnh, không phải gameplay test. |
| Manual gameplay trên bản đã gắn asset | **CHƯA KIỂM TRA THỦ CÔNG**: asset chưa nối `src/render.ts` theo yêu cầu để chat code tích hợp sau. Không suy gameplay đúng từ build/test. |
| CI trên revision cuối | Chưa có push/PR nên chưa có CI. |

Simulation hiện hữu trong `pnpm test` chạy config `p8-encounter-c3-refinement-1`. Ví dụ log integrated route dùng seeds 1, 7, 17, 42, 101, 126, cap 720 s và báo quãng đường 1.645–3.165 m với pilot script; không phải quan sát người chơi. Test cân bằng khác dùng seeds 1–30, profile cautious/average/fast; kết quả không bị thay đổi bởi các file art vốn chưa tích hợp. Bài test P6.1 dùng 30 seeds cho train/officer/vendor/ambulance và kiểm trạng thái simulation; không chứng minh model đã chuyển động chính xác trong game.

**Tự review góc game designer:** Dữ kiện là collider, tốc độ, thời gian và RNG gameplay không sửa; art có footprint và timing adapter kiểm tự động. Chưa có dữ liệu về nhịp, công bằng, độ khó hay cảm giác khi nhìn asset mới lúc lái. **ĐỀ XUẤT**, chưa áp dụng: sau tích hợp, thử một đoạn seeded có nước 2 làn + traffic và một đoạn train/vendor để so thời điểm nhận dạng hazard với cửa phản ứng hiện hành 3,5 s; ưu tiên tăng độ rõ cue trước khi thay cân bằng. Hỏi chủ dự án nhận xét trước mọi thay đổi lớn về balance/cơ chế.

**Tự review góc UI/UX designer:** Ưu tiên P1 là giữ khoảng nhìn trước xe và cue/QTE khi xe lớn, nhà/nhân vật ở hai mép và hazard rộng cùng xuất hiện. P1 nữa là phân biệt nước ngập, ổ gà và mặt đường ướt decorative khi xe chạy; bản preview tĩnh không kiểm được thời gian đọc. P2 là vị trí khách vẫy/công an/hàng rong khi camera nghiêng và lúc HUD đông. Sau tích hợp cần kiểm input/camera/HUD/onboarding/card/toast, thất bại/restart, chụp bằng chứng theo bước; hiện chưa có audit trên build art thật.

Đây đều là **Codex tự review** từ test log và preview đã nhìn trong lượt này, không có art director/game designer/UI designer độc lập hay người chơi quan sát trực tiếp.
