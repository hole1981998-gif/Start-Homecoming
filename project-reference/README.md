# Tiếp tục dự án trên máy khác

Ngày đóng gói: 26/10/2026. Đây là bộ tài liệu tham chiếu, không phải bản sao toàn bộ chat Codex.

## Lấy tài liệu

```sh
git clone --branch docs/machine-transfer-2026-10-26 https://github.com/hole1981998-gif/Start-Homecoming.git
cd Start-Homecoming
```

- `docs/`: tài liệu hiện có trên main của repository.
- `art-guide/`: art direction, model/animation workload và ba ảnh tham chiếu từ project mirror.
- `project-reference/balance-analysis/`: báo cáo, chỉ mục nguồn và dữ liệu/script cấp đầu của thư mục phân tích. Không đóng gói working trees và các bản chạy thử lồng trong experiment-2026-10-23.
- `project-reference/original-design-pack/`: bản tài liệu ban đầu để tham khảo lịch sử; không ghi đè docs/ hiện tại bằng bộ này.
- `project-reference/local-art-docs/`: snapshot tài liệu ART*.md từ checkout art/essential-asset-pack tại e9c9a9e; code và asset tương ứng không nằm trên branch tài liệu này. Đây không phải xác nhận đã tích hợp hay kiểm thử art.
- `project-reference/VFX_CHAT_HANDOFF.md`: brief và giới hạn của chat VFX này.
- `project-reference/sfx/`: bàn giao SFX và danh sách voiceline nháp mới nhất, lưu từ chat SFX; chưa có audio sản xuất.

## Trạng thái cần biết

Branch tài liệu được tạo từ origin/main f289612. Checkout làm việc trên máy cũ đang ở art/essential-asset-pack, commit e9c9a9e, có thay đổi chưa commit trong src/render.ts và các file Blender cùng backup .blend1. Các thay đổi đó không được đưa vào lần push tài liệu này. Vì vậy clone branch này không đủ để khôi phục bản art đang làm dở.

Các đường dẫn tuyệt đối trong tài liệu là đường dẫn trên máy cũ. Trên máy mới hãy dùng vị trí clone tương ứng. Tài liệu lịch sử có thể mô tả revision cũ; kiểm tra revision trước khi áp dụng. Art guide mới ưu tiên khi mâu thuẫn ghi chú art cũ, không thay luật gameplay.

Không có export hay cơ chế khôi phục chat tương tác đi kèm. Đã tóm tắt chat VFX và bổ sung nội dung cần thiết từ chat SFX; chưa thu thập toàn bộ các chat khác. Không kèm thông tin đăng nhập, cấu hình tài khoản hay toàn bộ thư mục .codex.

## Chạy dự án

Xem README.md, package.json và pnpm-lock.yaml. Repo khai báo pnpm@11.25.0; cài đúng môi trường tương ứng, chạy pnpm install --frozen-lockfile rồi pnpm dev. Đọc AGENTS.md trước khi sửa. Không coi bộ tài liệu này là phê duyệt bắt đầu art/VFX, đổi balance hay merge.
