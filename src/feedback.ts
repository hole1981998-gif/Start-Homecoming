import type { EntityKind } from './world';
export type FeedbackKind = EntityKind | 'coast' | 'drop';
/** Short editorial placeholder lines; numeric consequences are kept separately. */
export const captions: Record<FeedbackKind, readonly string[]> = {
  water: ['Đường hơi ướt rồi!', 'Qua vùng nước nhé!', 'Bình xăng để ý nào!'],
  pothole: ['Đường hơi xóc!', 'Giữ chắc tay lái!', 'Một cú nảy nhỏ!'],
  traffic: ['Chạm xe rồi!', 'Giữ khoảng cách nhé!', 'Đường đang đông!'],
  fuel: ['Có xăng rồi!', 'Tiếp sức nào!', 'Bình xăng tới đây!'],
  repair: ['Xe khỏe hơn rồi!', 'Vá xe xong!', 'Chạy tiếp nào!'],
  passenger: ['Lên xe nào!', 'Có bạn đồng hành!', 'Đi chung nhé!'],
  drop: ['Tạm biệt nhé!', 'Hẹn chuyến sau!', 'Xuống xe an toàn!'],
  coast: ['Xe còn đà!', 'Tìm xăng phía trước!', 'Giữ tay lái nhé!'],
};
export const initialFeedbackCounts = (): Record<FeedbackKind, number> => ({ water: 0, pothole: 0, traffic: 0, fuel: 0, repair: 0, passenger: 0, drop: 0, coast: 0 });
