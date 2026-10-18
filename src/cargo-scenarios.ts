import { entity, trafficTypes, type Entity } from './world';
import type { Run } from './survival';

export const cargoScenarios = [
  ['p63-crate-right', 'Xe tải thả kiện từ đuôi'],
  ['p63-barrel-left', 'Container thả thùng từ đuôi'],
  ['p63-roll-edge', 'Đồ lăn về phía lề'],
  ['p63-star', 'Kiểm tra star trước thùng nặng'],
  ['p63-nitro', 'Kiểm tra nhảy qua đồ rơi'],
  ['p63-wrecked', 'Xe nguồn hỏng trước lúc thả'],
] as const;

export function cargoScenario(run: Run, name: string): Run {
  const spec = cargoScenarios.find(([id]) => id === name) ?? cargoScenarios[0];
  const heavy = name === 'p63-barrel-left' || name === 'p63-star' || name === 'p63-nitro';
  const source = entity('traffic', `p63-source:${spec[0]}`, heavy ? 90 : 78, 3.2);
  source.trafficKind = heavy ? 'container' : 'truck';
  source.width = trafficTypes[source.trafficKind].width;
  source.length = trafficTypes[source.trafficKind].length;
  source.hp = trafficTypes[source.trafficKind].hp;
  source.speed = 2;
  source.baseSpeed = source.speed;
  source.cargoReleaseAt = heavy ? 2.3 : 3.5;
  source.cargoType = heavy ? 'barrel' : 'crate';
  source.displayName = heavy ? 'Container sắp rơi thùng' : 'Xe tải sắp rơi hàng';
  const entities: Entity[] = [source];
  if (name === 'p63-wrecked') {
    // Let the truck visibly encounter a pothole before its scheduled drop.
    source.hp = 5;
    const pothole = entity('pothole', 'p63-source-wreck-pothole', 86, source.x);
    pothole.width = 1.5;
    pothole.length = 2.5;
    entities.push(pothole);
  }
  const help = 'Chú ý cảnh báo trên xe cùng chiều: đồ tuột khỏi cửa sau, trượt về phía sau rồi lăn lệch hướng ngẫu nhiên theo seed. Kiện hàng trừ HP; thùng nặng gây ngã. A/D né, star miễn hại, nitro + Space nhảy. Xe nguồn hỏng trước khi thả sẽ không tạo đồ. Đây là thử riêng, chưa vào bản chơi đầy đủ.';
  return { ...run, inventory: name === 'p63-star' ? ['star', null] : name === 'p63-nitro' ? ['nitro', null] : [null, null],
    world: { ...run.world, integrated: false, experimentalTraffic: true, experimentalCargo: true,
      prototype: { version: 'p63-cargo-1', title: spec[1], description: help }, entities,
      nextHazard: 1e9, nextSpecial: 1e9, nextFuel: 1e9, nextRepair: 1e9, nextPassenger: 1e9, nextShopDistance: 1e9 } };
}
