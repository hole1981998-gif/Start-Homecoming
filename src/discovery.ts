import { uiIcon, type UiIcon } from './ui-icons';
import type { EntityKind } from './world';
import type { PowerItem } from './items';

export type Discovery = 'passenger' | 'wind' | 'train' | 'officers' | 'obstacles' | PowerItem;
export const discoveryCards: Record<Discovery, { title: string; copy: string; icon: UiIcon }> = {
  passenger: { title: 'Cho đi nhờ nhé?', copy: 'F đón khi ở gần · G cho xuống. Khách chiếm chỗ và làm xe chậm hơn.', icon: 'passenger' },
  wind: { title: 'Giữ vững tay lái', copy: 'Gió đẩy ngang. Lái ngược hướng gió để giữ đường.', icon: 'wind' },
  train: { title: 'Nhường đường cho tàu', copy: 'Giữ S phanh và chờ đường mở. Chạm tàu luôn kết ván, kể cả có sao.', icon: 'train' },
  officers: { title: 'Có chốt phía trước', copy: 'Công an: phạt và tịch thu xe. Dân phòng: phạt tiền. Dùng chuối khi cue xuất hiện; sao không tránh được.', icon: 'shield' },
  obstacles: { title: 'Đọc đường, tìm lối', copy: 'Né xe, vật cản và đồ rơi. Nước hao xăng; ổ gà mất HP. Tai nạn có thể làm hỏng xe hoàn toàn.', icon: 'obstacles' },
  nitro: { title: 'Nitro', copy: 'Dùng ô 1/2 để tăng tốc. Khi nitro đang bật, Space để nhảy; không vượt xe cao.', icon: 'nitro' },
  star: { title: 'Ngôi sao', copy: 'Dùng ô 1/2 để chống sát thương và tác động thường. Tàu, chốt và sự kiện vẫn có hiệu lực.', icon: 'star' },
  banana: { title: 'Chuối', copy: 'Dùng ô 1/2 khi cue chốt xuất hiện để vô hiệu cả nhóm. Ngoài cửa sổ này không mất món.', icon: 'banana' },
  grab: { title: 'Gọi khách Grab', copy: 'Dùng ô 1/2 để gọi khách phía trước, rồi F đón. Mỗi gói có nhiều lượt; không tự nhận khách.', icon: 'grab' },
};
export function discoveryCategory(kind: EntityKind): Discovery | null {
  if (kind === 'fuel' || kind === 'repair' || kind === 'shop') return null;
  if (kind === 'police' || kind === 'militia') return 'officers';
  return kind === 'passenger' || kind === 'wind' || kind === 'train' ? kind : 'obstacles';
}
export function readDiscoveries(): Set<Discovery> {
  const seen = new Set<Discovery>();
  try {
    const data: unknown = JSON.parse(localStorage.getItem('dvn.discovery.v2') ?? '[]');
    if (Array.isArray(data)) for (const key of data) if (typeof key === 'string' && Object.hasOwn(discoveryCards, key)) seen.add(key as Discovery);
    const legacy: unknown = JSON.parse(localStorage.getItem('dvn.cards.v1') ?? '[]');
    const kinds: EntityKind[] = ['passenger', 'wind', 'train', 'police', 'militia', 'water', 'pothole', 'traffic', 'cargo', 'jam', 'accident', 'broken'];
    if (Array.isArray(legacy)) for (const key of legacy) if (kinds.includes(key as EntityKind)) {
      const category = discoveryCategory(key as EntityKind); if (category) seen.add(category);
    }
  } catch { /* Storage is optional; in-memory seen state still lasts this session. */ }
  return seen;
}
export function saveDiscoveries(seen: Set<Discovery>): void {
  try { localStorage.setItem('dvn.discovery.v2', JSON.stringify([...seen])); } catch { /* Session state remains. */ }
}
export function discoveryIllustration(key: Discovery): HTMLElement {
  const node = uiIcon(discoveryCards[key].icon); node.classList.add('discovery-illustration'); return node;
}
