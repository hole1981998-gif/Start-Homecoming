# Traffic hết xăng — P4.2 bổ sung

Parent `dc157a5`, branch `feature/traffic-fuel`, config `p4-2-traffic-fuel-1`. Windows/PowerShell/pnpm theo lockfile. Remote đã kiểm tra lại: HEAD P4.1, chưa có main/master; patch riêng từ P4.2 hiện có, không giả vờ đã cập nhật main. Chưa PR theo main, chưa merge, CI/review người thật chưa có.

## Hành vi

Mỗi xe chướng ngại dùng dung tích/L/m của loại xe tương ứng. Instance có xăng riêng, chạy hướng âm/dương đều tiêu theo quãng đường tuyệt đối; nước vừa hãm tốc vừa tiêu thêm xăng trong thời gian chạm. Tick chia tại mốc cạn; phần thời gian còn lại chuyển sang trôi, không hồi lực kéo. Trôi đúng tối đa 25 m rồi đứng yên, vẫn còn HP/collider, vẫn chịu ổ gà hoặc bị người chơi húc. Giữ heading ngược chiều khi vận tốc về 0. Cue có ký hiệu xăng/dừng và accessible label, không mở thêm bảng chữ.

Mặc định TẠM: traffic sinh đầy bình. Không thêm RNG fuel thấp, không thay density, thu nhập, damage hay xăng người chơi. Vì traffic mới chỉ được mô phỏng trong vùng world đang hoạt động, nhiều xe sẽ bị người chơi vượt qua trước lúc cạn; có nhiên liệu không đồng nghĩa bản thường sẽ xuất hiện nhiều xe dừng. Chưa mô phỏng lịch sử tiêu xăng của xe ngoài vùng dữ liệu. Không thêm refuel AI.

Hết xăng riêng không đặt HP=0/wreck hoặc tự tạo khách. Sự kiện xe chết máy/khách P6 vẫn giữ phân kỳ; nếu xe hết xăng tiếp tục bị ổ gà phá HP=0, luật khách P4.2 hiện có mới áp dụng. Cờ khách từ cú húc gây hỏng từ chối F vẫn giữ nguyên.

## Tự kiểm tra và simulation

Code và test trong cùng revision bàn giao, report này thuộc cùng commit; không có reviewer độc lập.

| Gate | Command | Kết quả |
|---|---|---|
| Lint | `pnpm lint` | exit 0 |
| Typecheck | `pnpm typecheck` | exit 0 |
| Tests | `pnpm test` | exit 0, 82/82 |
| Simulation | `pnpm simulate` | exit 0, 13/13 |
| Build | `pnpm build` | exit 0, cảnh báo chunk 542,60 kB |

Test mới chạy đủ tám loại và cả hai hướng: tiêu theo loại/instance, không refill sau tick; nước tiêu theo tiếp xúc, cạn trong tick; trôi đúng 25 m và không tự chạy lại; HP giữ nguyên khi chỉ cạn; xe dừng vẫn đâm được và chịu ổ gà; kết quả fuel/coast khớp ở 30/60/144 render FPS; cue phân biệt trôi/dừng. Các test P4.2 khách bị húc từ chối F vẫn pass.

Simulation economy 30 seed × cruise/W/S, tối đa 600 s: median đủ 800 lần lượt 85,72/60,18/149,78 s; số đủ tiền 30/30, 30/30, 29/30; chết 13/14/3. Không thay đổi số so với bản trước trong tập mẫu này. Điều này không chứng minh mọi seed đều công bằng hoặc tần suất traffic hết xăng đã cân; pilot không cứu khách chủ động. Test fuel là kịch bản kiểm soát, không phải đo tỷ lệ cạn trong bản thường.

## Manual IAB, seed 17

`?scenario=traffic-fuel&seed=17`: ô tô làn phải ở 90 m, 6 m/s, 0,006 L để thử nhanh. Start, giữ S khoảng 12 s: người chơi ~99 m, cue ô tô cách 17 m ghi “đã dừng vì hết xăng”; HP người chơi 70. Restart trả về 0 m/200 tiền/70 HP. Lượt tiếp theo giữ D ~0,8 s rồi S ~13,5 s: đâm xe dừng, HP 70→50 và HUD 0/2 trong crash, distance ~117 m nhưng điểm ~113 vì không thưởng đoạn trôi crash. Đã để lại fixture sẵn sàng cho người chơi. Input/camera/HUD được quan sát trong ca này; chưa manual xe ngược chiều/all types/nhiều giao lộ, chưa đo FPS thực. Không gọi frame-rate simulation là benchmark GPU.

## Tự review gameplay và UX

Dữ kiện: xe cạn không mất HP và vẫn là chướng ngại, dừng có báo; các số economy mẫu không đổi. Nhận xét: tạo biến đổi tốc độ trong giao thông hợp logic, nhưng sinh đầy bình khiến cơ chế ít xuất hiện trong vùng lookahead ngắn. ĐỀ XUẤT nếu chủ dự án muốn thấy thường xuyên hơn: thử riêng lượng nhiên liệu còn lại seeded lúc traffic vào vùng mô phỏng, so baseline nhiều seed về làn tránh/tỷ lệ chết trước khi áp dụng. Chưa thay lượng spawn fuel hoặc tăng khó.

UX tự kiểm tra theo input và accessibility state hiện tại: ký hiệu xăng phân biệt với mũi tên hướng, trạng thái dừng không còn báo cùng chiều gây nhầm; không thêm menu/log hay polish UI. Hạn chế: khả năng đọc ký hiệu lúc chạy nhanh cần phản hồi người chơi; chưa audit visual toàn bộ theo nhịp review đã thống nhất. Art/SFX đầy đủ vẫn để cuối.
