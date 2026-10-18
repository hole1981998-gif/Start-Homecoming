# Review placeholder xe và hành khách — 18/10/2026

- Revision: branch `codex/vehicle-occupant-visuals`, dựa trên `e8d1164`; seed `17`, config `p63-integrated-1`.
- Thay đổi: ba gác có đầu xe, thùng sau, thành thùng và ba bánh riêng; xe kín hiển thị một đầu/thân trên ở cửa sổ cho mỗi hành khách, không tính tài xế. Xe traffic lấy số khách từ cùng hàm seeded dùng lúc xe hỏng. Đây là placeholder hình khối, chưa phải art cuối.
- Simulation tự chạy: `pnpm simulate` pass 120/120; `pnpm test` pass 207/207. Đây là kiểm tra logic, không chứng minh độ rõ của model.
- Manual trong ChatGPT in-app browser: `?scenario=vehicles-tricycle&seed=17` bắt đầu ván, Tab sang ba gác; thấy thùng và silhouette khác xe máy, HUD 1/4. `?scenario=visual-vehicles-car4&seed=17` bắt đầu ván, thấy ba hình khách và HUD 4/4; nhấn G còn hai hình và HUD 3/4. `?scenario=traffic-gallery&seed=17` bắt đầu ván, thấy danh mục traffic không phát sinh lỗi console. Đã kiểm tra va chạm ở `?scenario=passenger-crash-car&seed=17`: HUD chuyển 4/4 xuống 0/4 khi khách văng; chưa kiểm tra thủ công mọi biến thể bus/container và chuỗi crash/reboard dài.
- Tự review game design: không đổi tốc độ, spawn, sát thương, economy hoặc RNG. Hình khách giúp đọc được mục tiêu chở khách nhưng khi buýt đầy 24 khách, hình người có thể dày; cần xem trên màn nhỏ trước art gate.
- Tự review UI/UX: đầu/thân trên màu sáng hiện ra ngoài thành xe, không phủ hành lang đường hoặc cảnh báo. Ở khoảng cách traffic xa, không thể đếm khách bằng mắt; HUD chỉ đếm xe người chơi. Ưu tiên sau: kiểm tra silhouette/cửa sổ xe buýt, tải, container ở các độ phân giải khác nhau và trong crash/reboard.
- Giới hạn: chưa có review art direction độc lập; art chi tiết để mốc 9 theo roadmap.
