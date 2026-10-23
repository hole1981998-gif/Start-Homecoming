# Mốc tham chiếu stress P6.1 cho P8

Đã lưu theo yêu cầu chủ dự án18/10/2026. Runtime không đổi. Bản đóng băng: commit **581c4df**; normal p61-integrated-2,stress p61-stress-1.

- [Source ZIP](../archives/p61-stress-581c4df/source.zip) chứa source,lockfile,tests,config,báo cáo và evidence đúng commit này. Không chép node_modules hay dữ liệu ngoài Git. [Manifest/hash](../archives/p61-stress-581c4df/manifest.json).
- [Dữ liệu simulation](evidence/p61/stress/summary.json) lưu seed,input policy,W-only cap30s,kết quả,max entities và môi trường/gate;4 ảnh cùng thư mục lưu dense và tàu chuyển động.
- [Báo cáo](P61_STRESS_TRAIN_REVIEW.md) giữ manual input,quan sát,giới hạn và tự review. Không có input replay từng tick của thao tác người chơi; không giả vờ dữ liệu đã ghi chi tiết hơn thực tế.

Tái lập độc lập: giải nén ZIP vào thư mục khác,Node24.19.0/pnpm11.25.0,chạy pnpm install --frozen-lockfile rồi pnpm dev. Mở ?scenario=stress&seed=17; thêm &start=288 hoặc576 để thử đoạn sau. Nếu5173 đang dùng,khởi động dev với port khác và thay URL tương ứng. Không giải nén đè project đang phát triển. Archive source không phải bản executable độc lập và không chứa dependencies cài sẵn.

Mẫu stress cố ý không cân bằng:2traffic/24m,patch mỗi48m,special72m,preload480m,container+bus/10000tiền/vật phẩm mẫu. Dùng làm mốc kiểm tra tải,va chạm và so sánh thay đổi; không dùng trực tiếp win rate/tiền mẫu để kết luận độ khó/economy tuyến thường. Khi P8 thử số mới,giữ nguyên archive/evidence này và lưu config/revision/kết quả mới bên cạnh để so.

**Việc cần hỏi tại P8:** “Có nên tắt tính năng xăng cho xe chướng ngại không?” Hiện bật;chưa có quyết định tắt. Chủ dự án muốn được hỏi ở bước cân bằng,không hỏi lại ngay trong lượt lưu dữ liệu này. So sánh tác động fuel/coasting/stopped traffic,tai nạn liên hoàn và khách phát sinh bằng cùng seed/input trước chốt.

Chỉ thay đổi tài liệu/lưu trữ;không sửa gameplay hay chạy playtest mới. Bằng chứng gameplay/gate của snapshot là báo cáo581c4df;không đổi nhãn thành kết quả của một lượt chơi mới. Repo không remote,chưa push/PR/CI/merge.

Kiểm tra lượt lưu: ZIP SHA256 khớp manifest, đủ source/config/tests/lockfile/summary;git diff --check pass. pnpm lint/typecheck/build exit0;pnpm test --maxWorkers=1 --minWorkers=1 exit0,177tests/26files. Build còn cảnh báo chunk>500kB như snapshot. Không thêm/chạy playtest mới vì runtime không đổi.
