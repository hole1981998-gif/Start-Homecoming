import type { EntityKind } from './world';
export type FeedbackKind = Exclude<EntityKind, 'wind'> | 'coast' | 'drop';
/** Short editorial placeholder lines; numeric consequences are kept separately. */
export const captions: Record<FeedbackKind, readonly string[]> = {
  water: ['Đường hơi ướt rồi!', 'Qua vùng nước nhé!', 'Bình xăng để ý nào!'],
  pothole: ['Đường hơi xóc!', 'Giữ chắc tay lái!', 'Một cú nảy nhỏ!'],
  traffic: ['Chạm xe rồi!', 'Giữ khoảng cách nhé!', 'Đường đang đông!'],
  cargo: ['Đồ rơi lăn tới!', 'Cẩn thận kiện hàng!', 'Né thùng lăn nhé!'],
  fuel: ['Có xăng rồi!', 'Tiếp sức nào!', 'Bình xăng tới đây!'],
  repair: ['Xe khỏe hơn rồi!', 'Vá xe xong!', 'Chạy tiếp nào!'],
  passenger: ['Lên xe nào!', 'Có bạn đồng hành!', 'Đi chung nhé!'],
  drop: ['Tạm biệt nhé!', 'Hẹn chuyến sau!', 'Xuống xe an toàn!'],
  coast: ['Xe còn đà!', 'Tìm xăng phía trước!', 'Giữ tay lái nhé!'],
  police: ['Công an'],
  militia: ['Dân phòng'],
  jam: ['Kẹt xe'],
  accident: ['Tai nạn'],
  train: ['Tàu hoả'],
  broken: ['Xe chết máy'],
  shop: ['Ghé tiếp tế nhé!', 'Cửa hàng phía trước!', 'Chăm xe một chút!'],
};
export const initialFeedbackCounts = (): Record<FeedbackKind, number> => ({ water: 0, pothole: 0, traffic: 0, cargo: 0, fuel: 0, repair: 0, passenger: 0, drop: 0, coast: 0, shop: 0, police: 0, militia: 0, jam: 0, accident: 0, train: 0, broken: 0 });
