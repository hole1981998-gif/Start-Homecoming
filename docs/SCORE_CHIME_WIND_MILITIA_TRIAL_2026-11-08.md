# Bản thử âm điểm, vùng gió và dân phòng — 08/11/2026

**Revision thử:** `codex/score-chime-wind-militia` trên nền `3a6d27f`; config `score-chime-wind-militia-trial-5`. Các số cân bằng trong lượt này là **TẠM**. Bản `ver.noforce` vẫn giữ lịch và luật cũ.

## Thay đổi

- Dùng file chime ElevenLabs do chủ dự án gửi. Giữ bản gốc 4 giây trong `project-reference`; mỗi lần nhặt điểm chỉ phát 0,65 giây đầu và giảm âm từ 0,42 giây. Pitch tăng tối đa tám nấc; hụt mốc tiếp theo thì về nấc đầu.
- Với director bản chính, xác suất mời vùng gió mỗi slot 10→25%, cooldown 260→220 m, khoảng cách an toàn đến special 48→40 m. Gió vẫn không chồng lên tàu hoặc sự kiện chắn đường; chiều dài 65 m và lực đẩy giữ nguyên.
- Dân phòng xuất hiện thành cặp ở khoảng 2/3 nhóm thay vì 1/3. Nhóm công an, khoảng cách giữa nhóm, phạt tiền và tác dụng chuối giữ nguyên. Backup giữ xác suất cặp cũ.

## Bằng chứng hiện có

- Mô phỏng tạo đường, không có người lái: 30 seed × 3 biến thể nhánh × 5 km, đếm 2.037 vùng gió; cùng bài test ở revision trước là 1.971. Đây là số vùng được sinh, không chứng minh người chơi gặp hoặc né được hết.
- Mô phỏng 100 seed × 3 km: 129 nhóm dân phòng, 127 nhóm công an, 122 đoàn tàu; các ngưỡng độ phủ cũ vẫn đạt. Số nhóm dân phòng không tăng, nhưng số NPC mỗi nhóm tăng. 1.251 vùng gió được đếm trên cùng mẫu; kết quả phụ thuộc cửa sổ an toàn của director.
- Test chức năng kiểm tra cặp dân phòng bản chính nhiều hơn bản backup, cả hai thành viên có chuyển động, và chime mới được nạp với pitch theo combo cùng đoạn phát 0,65 giây. Build production chứa `score_chime`.
- Trình duyệt in-app trên Windows, URL `http://127.0.0.1:5180/?seed=17`: bắt đầu ván, giữ W, HUD khoảng 51 điểm ở 321 m, cảnh ba làn và điểm đọc được; không có console error. Chưa đi đủ xa để xác nhận cảm giác gió/dân phòng bằng thao tác người thật. Bản phát âm cần chủ dự án nghe nhận xét trực tiếp; kiểm thử tự động chỉ chứng minh file và tham số phát.

## Tự đánh giá của Codex

**Game designer:** Số vùng gió tăng khoảng 3,3% trên mẫu 5 km, nhỏ hơn mức tăng xác suất danh nghĩa vì director thường đang chờ vị trí an toàn. Dân phòng đông người hơn nhưng không tăng số lần xuất hiện của nhóm; cảm giác khó thực tế cần chơi thử. Giữ luật né và chuối nhất quán. **ĐỀ XUẤT chưa áp dụng:** nếu vẫn dễ, cân nhắc tăng số nhóm dân phòng theo lịch riêng, sau khi đo tỉ lệ chạm và thời gian phản ứng ở nhiều seed.

**UI/UX designer:** HUD điểm và vật điểm vẫn phân biệt được trên nền đường ở seed 17; không đổi cảnh báo gió/dân phòng. Âm thanh vẫn có cue hình. Ưu tiên chơi thử để đánh giá chime có bị dồn hoặc quá gắt khi nhặt liên tục, và cặp dân phòng có đủ rõ để nhận ra hai quỹ đạo. Chưa có bằng chứng từ ảnh cho timing hay độ công bằng.

## Giới hạn

Đây là nhánh thử phụ thuộc bản điểm combo chưa merge. Không coi kết quả tạo đường là một ván cân bằng đã nghiệm thu. Không tự thay lịch special hoặc số lần phạt tiền khi chỉ tăng số NPC trong nhóm.
