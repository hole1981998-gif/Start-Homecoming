# Review bản thử quét đuôi buýt/container

- Revision: nhánh `codex/large-vehicle-tail-sweep` (commit ghi khi bàn giao).
- Phạm vi: chỉ `ver.force`; `ver.noforce` giữ góc thân xe bằng 0. Seed 17; fixture `force-tail-bus` và `force-tail-container`.
- Simulation: giữ D 180 fixed steps từ tốc độ tối đa trong đường thử có ô tô đỗ ở 32 m. Buýt đạt góc 0,219 rad, một lượt tiếp xúc, ô tô bị đẩy 1,20 m. Container đạt 0,264 rad, hai lượt tiếp xúc, ô tô bị đẩy 1,62 m. Cùng input ở noforce không đẩy ô tô. Đây là dữ kiện của fixture, chưa phải phân bố nhiều seed.
- Browser: ChatGPT in-app browser tại `127.0.0.1:5173`, seed 17. Khởi động và giữ D: hình buýt/container nghiêng hướng chạy, đuôi quét vào hành lang bên trái; HUD/đường/cảnh báo vẫn đọc được. Đổi sang noforce cho thấy thân container thẳng. Restart thử được. Chưa kiểm tra hết nhánh rẽ và mọi tổ hợp chướng ngại.
- Tự review game design: góc container rõ hơn buýt, phù hợp chiều dài; ô tô bên cạnh tạo quyết định giữ lái hay thả D. Đề xuất chỉ sau nhận xét của chủ dự án: thử giảm góc container khoảng 10% nếu đuôi chiếm quá nhiều làn trong giao thông dày, rồi so tỉ lệ va quệt trên nhiều seed.
- Tự review UI/UX: camera theo đầu xe nên đuôi lớn có thể đi sát mép màn hình; cần quan sát thêm khi rẽ giao lộ. Ưu tiên trung bình; kiểm chứng bằng playtest góc cua trái/phải và xe ở hai mép đường. Chưa polish UI/art trong bản thử này.
- Giới hạn: Cannon đẩy traffic khi đuôi chạm, nhưng cú chạm chỉ do đuôi chưa áp dụng HP/ngã; damage arcade hiện hành vẫn hoạt động ở va chạm thân xe cũ. Cần thống nhất luật damage một lần trước khi tích hợp vào bản chính.
