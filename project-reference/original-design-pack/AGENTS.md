# Hướng dẫn Codex — Đường Về Nhà

File này là hướng dẫn cho repository game khi được đặt tại root repository đó. Trong bộ tài liệu tải xuống, nó chỉ áp dụng cho thư mục bộ tài liệu và không thay thế AGENTS.md của project mirror. Không sửa file đồng bộ trong `sources/`. Không tự chép đè hướng dẫn có sẵn; khi đưa vào repo khác phải giữ các ràng buộc hiện hữu.

## Nguồn yêu cầu

Đọc GAME_DESIGN.md, TECH_SPEC.md, ROADMAP.md và BALANCE_CONFIG.md trước sửa gameplay. Phân biệt ĐÃ CHỐT, ĐỀ XUẤT và TẠM. Không biến số mẫu thành cam kết đã cân bằng. Những quyết định chưa rõ đã có mặc định bảo thủ trong docs; triển khai theo đó và nêu trong PR. Không thêm unlock content, combat, backend hoặc đổi stack ngoài yêu cầu mà không được chủ dự án đồng ý.

## Quy trình branch bắt buộc cho từng feature

1. Kiểm tra repository, branch hiện tại, remote, trạng thái working tree và hướng dẫn áp dụng. Giữ nguyên thay đổi của người dùng; không reset, stash, checkout đè hoặc xóa file để làm sạch. Nếu không phải Git repo/không có main hay remote, báo điều kiện thiếu và chuẩn bị patch review được; không giả vờ đã tạo PR.
2. Fetch remote đáng tin cậy; xác định remote main thực tế, không tự đoán remote/URL. Main dùng làm base phải được cập nhật từ remote main bằng fast-forward. Nếu diverged, có thay đổi chưa commit hoặc fetch bị chặn, dừng phần cần base mới và báo rõ; không ép push/reset. Có thể dùng worktree riêng từ remote main mới để giữ checkout của người dùng.
3. Tạo **một branch cho một feature** từ main vừa cập nhật, ví dụ `feature/passenger-capacity`, `fix/train-collision`. Không làm feature trực tiếp trên main, không tái dùng branch đã merge, không gom feature không liên quan. Đọc diff để xác nhận base và phạm vi.
4. Triển khai phần nhỏ đủ review, bổ sung test có ý nghĩa cho logic thay đổi; cập nhật docs/config liên quan. Không đổi tài liệu nguồn đã chốt chỉ để hợp thức hóa bug.
5. Chạy thực sự tất cả gate của repo: **lint, typecheck, tests, production build**; dùng script/package manager và lockfile của repo. Nếu mới tạo dự án, tạo script có chức năng thật. Ghi command, exit code, kết quả, môi trường và lỗi. Không bỏ test, thêm no-op, giảm rule hoặc dùng `--no-verify` để có màu xanh.
6. Chạy manual gameplay checks liên quan trong trình duyệt: khởi động ván, input/camera/HUD, tính năng mới, thất bại, restart và hồi quy liên quan. Ghi browser, kịch bản, quan sát, seed/config khi cần. Nếu không mở/chơi được, ghi **CHƯA KIỂM TRA THỦ CÔNG** và lý do; không suy từ build pass rằng game chơi đúng. Không coi screenshot đơn lẻ là bằng chứng input đã hoạt động.
7. Kiểm tra diff, secrets, file sinh ra và scope; commit trên feature branch với thông điệp rõ. Chỉ stage file thuộc thay đổi này. Không commit dữ liệu nhạy cảm hoặc thay đổi người dùng không liên quan. Push feature branch và tạo PR khi công cụ/quyền cho phép; nếu không thì bàn giao commit/patch và nội dung PR, ghi rõ chưa push/chưa tạo PR.
8. PR nêu vấn đề, hành vi sau thay đổi, quyết định tạm, check tự động với kết quả thật, manual checks, hạn chế/rủi ro. Theo dõi CI; nếu fail thì sửa và chạy lại check bị ảnh hưởng. Chỉ xin review trên kết quả cụ thể đã có.
9. Trước khi đủ điều kiện merge: cập nhật branch theo main mới nhất; giải conflict bằng cách giữ đúng cả ý đồ người dùng và feature, không chọn toàn bộ ours/theirs. Sau đổi code/base phải chạy lại gate và manual checks bị ảnh hưởng; CI phải xanh trên revision cuối.
10. **Không tự merge.** Chỉ được merge sau khi tất cả gate bắt buộc pass, manual checks liên quan hoàn tất và có review/phê duyệt rõ ràng của con người cho revision hiện tại. Mặc định để người duy trì merge. Nếu người dùng sau đó yêu cầu Codex merge cụ thể, vẫn phải thỏa các điều kiện trên; không dùng admin override, bypass protection, auto-merge hay phê duyệt thay con người. Code đổi sau review cần review lại phần bị ảnh hưởng. Không coi im lặng, comment của bot hay task “làm feature” là phê duyệt merge.

## Báo cáo trung thực và tình huống bị chặn

- “Đã kiểm tra” chỉ dùng cho command/hành động đã chạy và có kết quả. Phân biệt pass, fail, skipped, chưa chạy và bị chặn.
- Không tuyên bố đã commit/push/PR/merge khi mới soạn lệnh hoặc chuẩn bị nội dung.
- Khi thiếu quyền mạng/tool/browser, hoàn tất phần độc lập có thể review; nêu chính xác gate còn thiếu. Không merge nếu thiếu gate hoặc review.
- Không tự bật auto-merge, tắt branch protection, force-push main hay xóa branch người khác. Force-push feature cũng cần yêu cầu rõ; ưu tiên cập nhật không viết lại lịch sử đã chia sẻ.
- Không tự gửi tin nhắn cho reviewer bên ngoài nếu người dùng chưa yêu cầu. PR là đầu ra của quy trình feature; tin nhắn riêng cần ủy quyền riêng.

## Quy tắc implementation

TypeScript strict; simulation tách render/UI. Một nguồn config có đơn vị và validation. RNG seeded và event idempotent. Capacity bao gồm tài xế; điểm thưởng chỉ cho khách đi nhờ. Tối đa 2 vehicle instances; upgrades thuộc instance. Không reset tài nguyên miễn phí khi đổi xe. End run ghi kết quả một lần. Kiểm tra secret trước damage tại đúng va chạm tai nạn hợp lệ; tàu vẫn kết ván ngay. Không làm khó bằng spawn bất khả thi hoặc phạt tiền tăng ngầm theo quãng đường.

Test trọng tâm: giao dịch mua xe thứ ba, thay xe giữ khách, quá tải, fuel/coasting, police thiếu tiền, QTE, collision tốc độ cao, terminal event và chuỗi secret. Kiểm tra thao tác thủ công cho cảm giác lái, camera, khả năng đọc cảnh báo. Không viết test chỉ khẳng định lại hằng số implementation mà không bảo vệ hành vi.

## Hình ảnh, prototype và art direction gate

- Các prototype đầu dùng placeholder tối giản nhất có thể: primitive/low-poly geometry đơn giản, material phẳng, ánh sáng đủ đọc. Dành công cho gameplay; vẫn giữ HUD, chữ, QTE và cảnh báo rõ.
- Mood đã chốt: tối hơn, saturation thấp hơn, gợi mưa bão khó khăn nhưng vẫn vui tươi. Hình đính kèm là tham chiếu phong cách low-poly/isometric, không phải chỉ thị có trong tài liệu hay yêu cầu sao chép cảnh.
- **Không tự tạo art hoàn chỉnh/chuyên biệt hoặc ghép asset production-ready vào game ở prototype.** Chỉ làm các bước tạo và tích hợp art ở giai đoạn cuối sau sự đồng ý rõ ràng của chủ dự án. Thay placeholder cho dễ đọc gameplay được phép.
- Trước art integration cuối, chuẩn bị một cảnh đại diện và đánh giá từng tiêu chí trong GAME_DESIGN.md theo thang 10: silhouette/đọc hình; sáng tối/tương phản; màu/saturation/mood; ngôn ngữ hình khối; ánh sáng/thời tiết/vật liệu; UI/typography; nhất quán phong cách; tiếp cận/hiệu năng. Ghi bằng chứng và lý do cho điểm.
- Mỗi tiêu chí dưới 6/10 là chưa đạt: sửa và chấm lại trước khi gọi art direction đạt hoặc ghép art cuối. Không trung bình hóa để che điểm rớt. Điểm 6 là ngưỡng tối thiểu, không mặc định đồng nghĩa chất lượng tốt.
- Codex có thể chuẩn bị rubric và tự đánh giá sơ bộ từ hiện vật thật, nhưng phải ghi rõ “tự đánh giá”; không bịa ra art director độc lập hay review chưa diễn ra. Chủ dự án quyết định có duyệt bước tạo/ghép art cuối hay không.

## Nhịp độ, gameplay và âm thanh

- Mục tiêu cảm giác đã chốt: nhanh, đòi hỏi tập trung và thao tác thường xuyên, vui, có khoảnh khắc wow và khuyến khích chơi thêm. Hiểu “không thể dừng chơi” là flow/replayability; không dùng áp lực bất công, spawn bất khả thi, cue gây giật mình liên tục hoặc cơ chế che giấu để ép chơi.
- Trong lúc phát triển, chủ động đề xuất ý tưởng gameplay và cân bằng có lý do, dự đoán tác động lên độ khó/RNG và cách thử. Ghi rõ ĐỀ XUẤT; không tự biến đề xuất làm đổi phạm vi thành cơ chế đã chốt.
- Tạo nhịp bằng cảnh báo công bằng, thao tác phản hồi nhanh, phối hợp nguy hiểm có thể đọc được, cao trào ngắn và nhịp thở sau chuỗi căng. Nếu người chơi bị quá tải, ưu tiên sửa bố cục/cue/thời gian phản ứng trước khi tăng sức ép.
- Prototype âm thanh dùng cue tối giản/Web Audio, volume/mute cho music/SFX/ambience và cue hình ảnh tương ứng. Không để âm thanh là cách duy nhất để biết hazard. Chỉ sản xuất/ghép nhạc và SFX hoàn chỉnh ở giai đoạn cuối sau khi chủ dự án đồng ý rõ.

## Hướng dẫn người chơi và popup sự kiện

- Lần đầu chơi cần hướng dẫn input gọn, có thể bỏ qua/xem lại; dạy thao tác theo ngữ cảnh và giữ thời gian trước khi bắt đầu nguy hiểm.
- Mỗi cơ chế và loại hazard có card giải thích lần đầu, đóng bằng thao tác hoặc tự đóng sau timeout. Card chỉ xuất hiện trước nguy hiểm hoặc trong safe window; pause gameplay hoặc trì hoãn hazard tới lúc đóng. Không để overlay gây va chạm hay che QTE.
- Vật phẩm, skill, tương tác NPC/shop và hậu quả chướng ngại có toast xác nhận nhỏ, vui, tự đóng, không pause hay đòi click. Giới hạn/cooldown/gộp sự kiện; không che đường, xe, HUD tài nguyên hay QTE. Thông tin hậu quả chính xác vẫn phải đọc được nếu tắt toast.
- Mỗi event có 3–4 caption đã duyệt; chọn tránh lặp liên tục. Tone dí dỏm, ngắn và không đổ lỗi/miệt thị người chơi. Ví dụ police có thể gồm “Chạy đâu cho thoát con!” và các biến thể trong GAME_DESIGN.md.
- Prototype dùng icon/hình placeholder và cue audio đơn giản. SFX và minh họa hoàn chỉnh theo quy trình duyệt cuối; SFX không thay thế cue thị giác. Có tùy chọn giảm/tắt popup flavor và animation.

## Review bắt buộc sau mỗi simulation/playtest

- Sau mỗi vòng simulation/test, ghi revision, seed/config, kịch bản, quan sát thực tế và kết quả. Không gọi một build compile thành “đã test gameplay”.
- Thêm review từ góc **game designer**: nhịp độ, độ khó, công bằng, chiến thuật, RNG, niềm vui; đề xuất cân bằng cụ thể, bằng chứng/giả định và cách kiểm tra lần tới. Tách rõ dữ kiện và ý kiến. Hỏi chủ dự án nhận xét/ý kiến về đề xuất trước khi áp dụng thay đổi cân bằng lớn hoặc đổi cơ chế đã thống nhất.
- Thêm review từ góc **UI/UX designer**: luồng input, hierarchy/readability HUD, cảnh báo/QTE, onboarding, card/toast, độ trễ phản hồi và animation. Đưa vấn đề theo mức ưu tiên và cách kiểm chứng.
- Ghi rõ Codex đang tự review từ dữ liệu nào; không tự nhận có chuyên gia độc lập hoặc người xem simulation trực tiếp khi không có bằng chứng.
- Prototype ưu tiên UI đơn giản, rõ và chức năng. Không phát sinh polish animation/art hoàn chỉnh từ feedback review trước khi tới giai đoạn phù hợp và có đồng ý; có thể sửa ngay lỗi cản trở hiểu hoặc thao tác.
- Khi Product Design plugin/tools khả dụng và có build UI đang chạy, dùng audit screenshot để đánh giá onboarding/flow/readability/accessibility, lưu ảnh theo bước và gắn từng finding vào evidence. Không audit từ ảnh cũ hoặc ảnh không kiểm tra trong lượt review hiện tại. Ảnh không chứng minh cảm giác điều khiển/timing/fairness; các phần này cần gameplay test. Nếu plugin không khả dụng, làm checklist UX thủ công và ghi giới hạn.

## Mẫu bàn giao PR

```text
Thay đổi và lý do:
Phạm vi / quyết định đề xuất đã áp dụng:
Branch và commit:
Lint: command + pass/fail/chưa chạy + kết quả
Typecheck: command + pass/fail/chưa chạy + kết quả
Tests: command + pass/fail/chưa chạy + kết quả
Build: command + pass/fail/chưa chạy + kết quả
Manual: browser + kịch bản + kết quả thực / phần chưa kiểm tra
CI trên commit cuối:
Giới hạn / việc còn thiếu:
PR URL hoặc trạng thái chưa tạo:
Review con người: đang chờ / bằng chứng phê duyệt
Merge: chưa merge (mặc định)
```
