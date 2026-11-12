# Tóc phía sau tài xế — kiểm tra 11/11/2026

- Revision: `codex/player-driver-back-hair` (trước commit); seed `17`, cấu hình ván thường và `visual-vehicles-motorcycle`.
- In-app browser tại `127.0.0.1:5179`: mở ván, nhìn từ camera sau, giữ A để đánh lái, tạm dừng bằng Esc và chơi lại. Tóc màu sẫm hiện dưới mũ ở ván thường; đi theo đầu khi xe nghiêng. Ván có khách ngồi sau che một phần tài xế. Restart đưa điểm, tiền và tài nguyên về đầu ván. Trang `art-preview/people.html` cho thấy tóc không xuyên mũ ở góc sau và ba phần tư.
- Test tự động: test riêng model 19/19 đạt; cả bộ chạy giới hạn 4 worker 493/493 đạt. Lần chạy không giới hạn worker có 3 timeout khi cùng chạy mô phỏng nặng; chạy lại giới hạn worker không còn lỗi. Lint, typecheck, build đạt.

**Tự review game design:** Không thay đổi nhịp độ, độ khó, chiến thuật hoặc RNG. Silhouette tóc đủ nhận ra tài xế ở góc camera sau khi xe chưa chở khách. Chưa cần đổi cân bằng.

**Tự review UI/UX:** Phần tóc không che HUD, cảnh báo hay đường lái. Với khách ngồi sau, tóc tài xế khó thấy vì bị che khuất tự nhiên; đây là giới hạn góc nhìn, không ảnh hưởng điều khiển. Trang xem trước nhân vật hiển thị cùng phần tóc để kiểm tra rõ hơn.
