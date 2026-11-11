import {eventBalance,backupEventBalance,itemBalance} from './config';
import { uiIcon, type UiIcon } from './ui-icons';
import type { EntityKind } from './world';
import type { PowerItem } from './items';

export type Discovery = 'passenger' | 'score' | 'wind' | 'train' | 'officers' | 'obstacles' | 'shop' | 'supplies' | 'junction' | 'switching' | PowerItem;
export const discoveryCards: Record<Discovery, { title: string; copy: string; icon: UiIcon }> = {
  score: { title: 'Điểm được tính thế nào?', copy: 'Lái xe để tích điểm theo quãng đường. Ở tốc độ tối thiểu, bạn không nhận điểm di chuyển; chạy nhanh hơn và chở khách sẽ tăng điểm kiếm được.\n\nViên sáng trên đường cho thêm 50 điểm khi xe chạm vào. Bạn không cần nhặt hết: hãy ưu tiên đường an toàn. Điểm và tiền là hai thứ riêng.', icon: 'star' },
  switching: {title:'Có hai xe rồi, đổi bằng Tab nhé!',copy:'Bạn đã có xe dự phòng. Khi đang lái, bấm Tab để đổi qua lại giữa hai xe còn chạy được. Khách sẽ đi theo bạn sang xe kia.\n\nMỗi xe giữ riêng xăng, độ bền và nâng cấp; đổi xe không được nạp lại miễn phí. Nhớ xem sức chứa để tránh quá tải nhé.',icon:'car'},
  passenger: { title: 'Cho đi nhờ nhé?', copy: 'Lại gần khách rồi bấm F để đón lên xe. Muốn cho một người xuống, bấm G. Chở khách giúp bạn kiếm thêm tiền.\n\nMỗi xe có sức chứa riêng, tính cả người lái. Càng đông xe càng chậm; quá tải còn làm tốn xăng hơn, nên nhớ chừa chỗ nhé.', icon: 'passenger' },
  obstacles: { title: 'Cẩn thận đường phía trước', copy: 'Vũng nước làm hao thêm xăng; cán ổ gà vừa mất độ bền, vừa rơi tiền. Đụng xe, vật cản hay đồ rơi có thể làm bạn ngã và mất độ bền.\n\nRiêng điểm tai nạn có thể làm hỏng xe ngay. Giảm tốc bằng S, lái A/D để tìm khoảng trống; đừng cố lấy điểm nếu đường quá chật.', icon: 'obstacles' },
  officers: { title: 'Có chốt phía trước', copy: `Đụng công an là mất tiền và bị thu xe đang lái. Còn xe dự phòng chạy được thì đổi sang xe đó; hết xe là thua.\n\nDân phòng không thu xe: họ lấy 50% tiền, tối thiểu ${eventBalance.militiaFine} khi bạn có đủ; thiếu thì lấy hết số đang có. Mua chuối trong cửa hàng rồi bấm 1 hoặc 2 khi đến gần chốt để né. Ngôi sao không giúp tránh bị bắt.`, icon: 'shield' },
  shop: { title: 'Ghé cửa hàng tiếp tế nhé', copy: 'Đến gần cửa hàng rồi bấm R để ghé vào. Game sẽ dừng, bạn cứ thong thả chọn đồ.\n\nỞ đây có bơm xăng, sửa xe, mua xe mới, nâng cấp và vật phẩm. Chọn đúng xe đang lái hoặc xe dự phòng trước khi tiếp tế hay nâng cấp. Kho giữ tối đa hai xe; mua xe thứ ba phải chọn một xe để bỏ. Mua xong hoặc huỷ rồi hãy tiếp tục lái.', icon: 'bag' },
  supplies: { title: 'Có đồ tiếp tế trên đường', copy: 'Lái xe chạm vào bình xăng hoặc bộ sửa chữa để nhặt. Bình xăng nạp thêm nhiên liệu, bộ sửa chữa hồi độ bền cho xe đang lái; không cần bấm F.\n\nHai món này dùng ngay, không chiếm ô vật phẩm. Nếu bỏ lỡ, bạn vẫn có thể bơm xăng và sửa xe ở cửa hàng.', icon: 'repair' },
  junction: { title: 'Sắp tới ngã rẽ rồi', copy: 'Khi hai tag Q/E sáng lên, bấm Q để rẽ trái hoặc E để rẽ phải. Tag nhấp nháy là hướng bạn đã chọn.\n\nKhông chọn thì xe đi thẳng, nhưng có ngã rẽ bị chắn đường thẳng. Nhìn đường từ sớm và chọn trước khi tag tối lại nhé.', icon: 'obstacles' },
  wind: { title: 'Gió đang đẩy xe đấy', copy: 'Qua vùng gió, xe sẽ bị đẩy ngang. Nhìn hướng gió rồi giữ A hoặc D ngược lại để giữ đường. Giảm tốc bằng S nếu thấy khó kiểm soát; đừng để gió đẩy mình vào xe khác.', icon: 'wind' },
  train: { title: 'Nhường đường cho tàu', copy: 'Tàu đang băng qua đường. Giữ S để phanh và chờ tàu qua hẳn rồi đi tiếp.\n\nĐụng tàu là kết thúc chuyến đi ngay, dù còn xe dự phòng hay đang dùng ngôi sao. Đừng cố chen qua nhé.', icon: 'train' },
  nitro: { title: 'Nitro', copy: `Bấm phím của ô chứa nitro (1 hoặc 2) để tăng tốc trong ${itemBalance.boostSeconds} giây. Khi nitro còn hiệu lực, bấm Space để nhảy.\n\nNhảy đủ cao và canh đúng lúc có thể vượt xe lớn; chạm lúc cất cánh hoặc tiếp đất vẫn gây va chạm. Mỗi lần dùng hết một món.`, icon: 'nitro' },
  star: { title: 'Ngôi sao', copy: `Bấm 1 hoặc 2 theo ô chứa ngôi sao để được bảo vệ trong ${itemBalance.starSeconds} giây, tránh sát thương và phần lớn tác động thường.\n\nTàu vẫn làm bạn thua, công an và dân phòng vẫn bắt được. Ngôi sao cũng không vô hiệu điểm tai nạn đặc biệt, nên vẫn phải nhìn đường.`, icon: 'star' },
  banana: { title: 'Mang chuối để né chốt', copy: 'Mua chuối ở cửa hàng, rồi bấm 1 hoặc 2 theo ô chứa chuối khi đến gần công an hoặc dân phòng. Chuối giúp bạn vượt cả nhóm chốt đó mà không bị bắt.\n\nBấm quá sớm hay quá muộn thì món chưa dùng được và không bị mất. Chuối không giúp né tàu hay chướng ngại khác.', icon: 'banana' },
  grab: { title: 'Gọi khách Grab', copy: `Bấm 1 hoặc 2 theo ô chứa Grab để gọi khách xuất hiện phía trước. Lại gần rồi bấm F để đón; gọi xong chưa có nghĩa là khách đã lên xe.\n\nMột gói gọi được ${itemBalance.grabUses} lượt. Khách Grab giúp kiếm thêm tiền, nhưng vẫn chiếm chỗ như mọi người khác.`, icon: 'grab' },
};
export function discoveryCopy(key:Discovery,backup=false):string {
 if (key === 'nitro' && backup) return `Bấm phím của ô chứa nitro (1 hoặc 2) để tăng tốc trong ${itemBalance.boostSeconds} giây. Khi nitro còn hiệu lực, bấm Space để nhảy.\n\nNhảy giúp vượt chướng ngại thấp, không vượt được xe cao. Mỗi lần dùng hết một món; chọn lúc đường đủ thoáng nhé.`;
 return key==='officers' && backup ? `Đụng công an là mất tiền và bị thu xe đang lái. Hết xe còn chạy được thì chuyến đi kết thúc. Dân phòng chỉ thu tiền, mức ${backupEventBalance.militiaFine}; không đủ thì họ lấy số đang có. Mua chuối ở cửa hàng và bấm 1 hoặc 2 khi đến gần chốt để né. Ngôi sao không tránh được chốt.` : discoveryCards[key].copy;
}
export function discoveryCategory(kind: EntityKind): Discovery | null {
  if (kind === 'score') return 'score';
  if (kind === 'shop') return 'shop';
  if (kind === 'fuel' || kind === 'repair') return 'supplies';
  if (kind === 'police' || kind === 'militia') return 'officers';
  return kind === 'passenger' || kind === 'wind' || kind === 'train' ? kind : 'obstacles';
}
export function readDiscoveries(): Set<Discovery> {
  const seen = new Set<Discovery>();
  try {
    const saved=localStorage.getItem('dvn.discovery.v2');
    const data: unknown = JSON.parse(saved ?? '[]');
    if (Array.isArray(data)) for (const key of data) if (typeof key === 'string' && Object.hasOwn(discoveryCards, key)) seen.add(key as Discovery);
    // A saved empty list is an explicit replay request; never re-import old acknowledgements.
    if(saved!==null)return seen;
    const legacy: unknown = JSON.parse(localStorage.getItem('dvn.cards.v1') ?? '[]');
    const kinds: EntityKind[] = ['fuel','repair','shop','passenger', 'wind', 'train', 'police', 'militia', 'water', 'pothole', 'traffic', 'cargo', 'jam', 'accident', 'broken'];
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
