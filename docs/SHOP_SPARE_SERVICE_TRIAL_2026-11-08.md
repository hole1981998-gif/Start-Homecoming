# Tiếp tế xe dự phòng — kiểm tra 08/11/2026

- Base `origin/main` e0eb3f4; branch `codex/shop-spare-service`; fixture `?scenario=shop-spare-disabled&seed=17`.
- Chọn xe đang lái/dự phòng ở mục Tiếp tế. Bơm/sửa dùng giá và mức hiện hành, chỉ sửa instance đã chọn, không tự equip hoặc cấp tài nguyên cho xe khác.
- Automated: lint/typecheck/build pass; full test suite 79 files/436 tests pass. Test mới cho xe dự phòng 0 HP/còn 2 L: sửa lên 20 HP, tiền trừ 140, xe đang lái giữ nguyên, Tab đổi được sang xe vừa sửa, giao dịch sai target bị từ chối.
- Browser IAB, seed 17: bấm Bắt đầu, R mở shop, chọn Ô tô 7 chỗ dự phòng `2.0 L / 0 HP`, bấm Sửa: tiền `4.000→3.860`, xe dự phòng `20 HP`; đóng shop, Tab đổi sang ô tô, HUD hiện `2.0 L / 20 HP` và xe chạy. Đây là quan sát input thực trên fixture, không chỉ screenshot.

**Tự review gameplay:** giải quyết slot dự phòng chết bằng chi phí sửa đúng mức, giữ lựa chọn dùng tiền cho xe đang lái hay dự phòng. Không đổi economy. **Tự review UX:** selector và tài nguyên xe đã chọn đọc được trong shop, nhưng nếu người chơi đang lái gấp cần bảo đảm shop pause như hiện tại. Cần người chơi nhận xét liệu chọn xe trước bơm/sửa có rõ ý nghĩa. Không phải review độc lập.
