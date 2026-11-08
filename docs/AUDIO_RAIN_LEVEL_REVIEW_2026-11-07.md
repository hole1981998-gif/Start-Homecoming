# Tự review: hạ tiếng mưa rào

Revision nền `b295e54`, branch `codex/rain-shower-level-down`. Theo feedback chủ dự án, hạ riêng gain vòng mưa từ 3 xuống 2,5 (−16,7%, khoảng −1,6 dB). Giữ nguyên file mưa, loop, gain sấm, gió, nhạc, SFX và slider của người chơi. Không đổi gameplay hoặc cue hình ảnh.

## Kiểm tra

| Gate | Kết quả |
| --- | --- |
| `pnpm lint` | Pass, exit 0 |
| `pnpm typecheck` | Pass, exit 0 |
| `pnpm exec vitest run --configLoader native --maxWorkers=2 --reporter=dot` | Pass, 79 file / 433 test, exit 0 |
| `pnpm build` | Pass, exit 0; cảnh báo chunk Three.js >500 kB đã có từ trước |

Test audio xác nhận vòng mưa vẫn loop và nhận target gain 2,5. **Manual:** ChatGPT in-app browser, `http://127.0.0.1:5173/?scenario=passenger&seed=17` vẫn chạy, HUD và cảnh mưa hiện, không thấy lỗi console. Ở `?scenario=coast&seed=17`, ván kết thúc hết xăng ở 26 m và Chơi lại vào ván mới. Công cụ browser không cho Codex nghe âm đầu ra, nên mức mưa cần chủ dự án nghe trên thiết bị đích.

**Tự review góc game designer:** Chỉ đổi mức âm nền, không đổi độ khó, RNG, nhịp sự kiện hoặc công bằng. Hạ mưa nhẹ có thể giúp nghe tiếng xe/thoại tốt hơn; kiểm tra bằng tai ở cảnh bão có sấm để biết mưa còn đủ hiện diện.

**Tự review góc UI/UX:** Slider “Mưa và gió” và cue mưa hình ảnh vẫn có. Các hazard vẫn có tín hiệu hình, không phụ thuộc âm mưa để nhận biết. Chưa kiểm chứng bằng tai sự cân bằng mưa với sấm ở loa nhỏ.
