# Bộ va chạm xe do chủ dự án cung cấp · 07/11/2026

Chín MP3 giữ nguyên dữ liệu gốc, chỉ đổi tên để game tham chiếu ổn định.

| Trong game | File gốc trong Downloads | Áp dụng |
| --- | --- | --- |
| `light_01.mp3` | `motorbike_crashing_a_#1-1794026549191.mp3` | Xe máy, mô tô, ba gác |
| `light_02.mp3` | `motorbike_crashing_a_#2-1794026560131.mp3` | Xe máy, mô tô, ba gác |
| `light_03.mp3` | `motorbike_crashing_a_#3-1794026566914.mp3` | Xe máy, mô tô, ba gác |
| `medium_01.mp3` | `4_seat_Car_impacts_w_#1-1794026640795.mp3` | Ô tô 4/7 chỗ |
| `medium_02.mp3` | `4_seat_Car_impacts_w_#2-1794026648316.mp3` | Ô tô 4/7 chỗ |
| `medium_03.mp3` | `4_seat_Car_impacts_w_#3-1794026657217.mp3` | Ô tô 4/7 chỗ |
| `heavy_01.mp3` | `Heavy_bus_impact_wit_#1-1794026728072.mp3` | Buýt, xe tải, container |
| `heavy_02.mp3` | `Heavy_bus_impact_wit_#2-1794026734218.mp3` | Buýt, xe tải, container |
| `heavy_03.mp3` | `Heavy_bus_impact_wit_#3-1794026740603.mp3` | Buýt, xe tải, container |

Mỗi nhóm chọn biến thể theo seed và tránh lặp liền. Bản `medium_02` có khoảng lặng đầu gần 0,3 giây; bộ phát bắt đầu ở 0,29 giây để âm va chạm trùng hình. Mức gain được cân riêng từng file trong `src/audio-director.ts`.
