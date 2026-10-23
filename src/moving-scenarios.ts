import { balance, movingVersion, movingBalance as c } from './config';
import type { Run } from './survival';
import { entity, type Entity } from './world';
import { newVehicle, trafficTypes, vehicles, type VehicleKind } from './vehicles';
import { crossX, type CrossMotion } from './cross-motion';

export const movingScenarios = [
  ['p61-train-left', 'Tàu từ phải sang trái', 'Giữ S chờ đầu/toa/đuôi chạy qua; hoặc 1 bật nitro rồi Space.'],
  ['p61-train-right', 'Tàu từ trái sang phải', 'So sánh các lane được giải phóng theo đuôi tàu, không biến mất đồng loạt.'],
  ['p61-train-container', 'Container gặp tàu', 'Xe dài cần toàn bộ thân qua tàu trước khi hạ cánh; có thể S dừng chờ.'],
  ['p61-police-one', 'Một công an qua lại', 'Né NPC bằng A/D; chạm thật mới bị bắt. Phím 1 ném chuối khi cue hiện.'],
  ['p61-police-two', 'Hai công an cùng nhóm', 'Một chuối vô hiệu cả hai, giữ họ đứng trên đường; chạm họ không bị bắt.'],
  ['p61-militia-two', 'Hai dân phòng cùng nhóm', 'Thử né hoặc 1 ném chuối. Không ném và chạm: phạt đúng một lần cho nhóm.'],
  ['p61-police-fast', 'Công an chạy nhanh', 'Hai người quét ngang nhanh hơn; A/D chủ động né hoặc dùng một chuối cho cả nhóm.'],
  ['p61-police-stagger', 'Công an lệch nhịp', 'Hai người lệch khoảng đường, tốc độ và phạm vi; không còn luôn gặp nhau ở giữa.'],
  ['p61-militia-fast', 'Dân phòng chạy nhanh', 'Hai người quét ngang nhanh hơn; S giảm tốc để chọn cửa sổ né.'],
  ['p61-militia-stagger', 'Dân phòng lệch nhịp', 'Hai người di chuyển lệch nhịp và cách nhau dọc đường; chuối vẫn vô hiệu cả nhóm.'],
  ['p61-groups', 'Hai nhóm độc lập', 'Nhóm đầu hai người; nhóm sau vẫn bắt được dù nhóm đầu đã trúng chuối.'],
  ['p61-traffic-pair', 'Ô tô va xe buýt', 'Bạn ở lane trái; quan sát thanh HP và xe nhỏ hỏng, khách sinh đúng một lần.'],
  ['p61-traffic-chain', 'Chuỗi va chạm ba xe', 'Xe sau có thể đâm xe đã dừng sau vụ va chạm đầu; theo dõi HP và khách.'],
  ['p61-traffic-barrier', 'Traffic va rào chắn', 'Xe NPC va rào nhận damage một lần và dừng; bạn ở lane trái để quan sát.'],
  ['p61-traffic-train', 'Traffic bị tàu va', 'Hitbox tàu ngang có thể làm xe NPC hỏng; khách chỉ sinh khi có pocket an toàn.'],
  ['p61-traffic-hole', 'Traffic vào ổ gà dài', 'Xe NPC mất HP theo thời gian tiếp xúc rồi hỏng; F đón khách nếu tiếp cận được.'],
  ['p61-barrier', 'Rào chắn hai lane', 'Lane phải còn trống. Chạm rào gây ngã và hồi phục, không instant lose.'],
  ['p61-vendor', 'Hàng rong băng đường', 'Vật cản nhỏ chạy ngang liên tục. A/D né; chạm gây ngã.'],
  ['p61-ambulance', 'Cứu thương đổi lane', 'Xe ngược chiều nhanh và qua lại giữa các lane; quan sát hướng và né.'],
] as const;

function motion(origin: number, velocity: number, type: CrossMotion['type'] = 'linear', startedAt = 0): CrossMotion {
  return { type, origin, velocity, startedAt, min: -c.patrolBound, max: c.patrolBound };
}
function car(kind: VehicleKind, id: string, at: number, speed: number): Entity {
  return { ...entity('traffic', id, at, 0), trafficKind: kind, hp: trafficTypes[kind].hp,
    width: vehicles[kind].width, length: vehicles[kind].length, speed, baseSpeed: speed,
    fuel: vehicles[kind].fuelCapacity, trafficMotion: 'powered' };
}
/** DEV fixtures only. No call from the normal director or shop. */
export function movingScenario(run: Run, scenario: string): Run {
  const definition = movingScenarios.find(s => s[0] === scenario) ?? movingScenarios[0];
  const entities: Entity[] = [];
  let chosen: VehicleKind = 'motorcycle', x = 0, experimentalTraffic = false;
  if (scenario.startsWith('p61-train')) {
    const direction = scenario === 'p61-train-right' ? 1 : -1;
    chosen = scenario === 'p61-train-container' ? 'container' : 'motorcycle';
    const train = entity('train', 'p61-train', 70, -direction * c.trainOrigin);
    train.width = c.trainWidth; train.length = c.trainDepth;
    train.crossMotion = motion(train.x, direction * c.trainSpeed);
    train.displayName = 'Tàu chạy ngang'; train.help = definition[2]; entities.push(train);
  } else if (scenario.includes('police') || scenario.includes('militia') || scenario === 'p61-groups') {
    const kind = scenario.includes('militia') ? 'militia' : 'police';
    const count = scenario === 'p61-police-one' ? 1 : 2;
    for (let group = 0; group < (scenario === 'p61-groups' ? 2 : 1); group++) for (let i = 0; i < (group ? 1 : count); i++) {
      const npc = entity(kind, `p61-officer-${group}-${i}`, 70 + group * 65, i ? c.patrolBound : -c.patrolBound);
      npc.groupId = `p61-group-${group}`; npc.width = c.npcWidth; npc.length = c.npcDepth;
      const fast = scenario.endsWith('-fast'), stagger = scenario.endsWith('-stagger');
      const speed = fast ? c.patrolFastSpeed : stagger ? i ? c.patrolSlowSpeed : c.patrolStaggerSpeed : c.patrolSpeed;
      npc.crossMotion = motion(npc.x, (i ? -1 : 1) * speed, 'pingpong');
      if (stagger) {
        npc.distance += i * c.patrolStaggerDepth;
        npc.crossMotion.min = i ? -1.6 : -c.patrolBound;
        npc.crossMotion.max = i ? c.patrolBound : 1.6;
      }
      npc.displayName = kind === 'police' ? 'Công an đi ngang' : 'Dân phòng đi ngang';
      npc.help = definition[2]; entities.push(npc);
    }
  } else if (scenario.startsWith('p61-traffic')) {
    experimentalTraffic = true; x = -balance.laneWidth;
    if (scenario === 'p61-traffic-barrier') {
      const target = car('car4', 'p61-block-car', 75, 10);
      const barrier = entity('jam', 'p61-roadworks', 95, 1.6); barrier.width = 6.2; barrier.length = 1.4;
      barrier.displayName = 'Rào sửa đường'; barrier.help = definition[2]; entities.push(target, barrier);
    } else if (scenario === 'p61-traffic-train') {
      const target = car('car4', 'p61-train-car', 85, 6);
      const train = entity('train', 'p61-npc-train', 95, c.trainOrigin);
      train.width = c.trainWidth; train.length = c.trainDepth;
      train.crossMotion = motion(c.trainOrigin, -c.trainSpeed);
      entities.push(target, train);
    } else if (scenario === 'p61-traffic-hole') {
      const target = car('car4', 'p61-patch-car', 85, 6); target.hp = 35;
      const hole = entity('pothole', 'p61-long-hole', 95, 0); hole.width = 2.4; hole.length = 30;
      entities.push(target, hole);
    } else if (scenario === 'p61-traffic-chain') {
      const a = car('car4', 'p61-a', 55, 8); a.hp = 20;
      entities.push(a, car('bus', 'p61-b', 90, -8), car('car4', 'p61-c', 125, -16));
    } else entities.push(car('car4', 'p61-small', 70, 10), car('bus', 'p61-bus', 110, -6));
  } else if (scenario === 'p61-barrier' || scenario === 'p61-vendor') {
    const obstacle = entity('jam', 'p61-barrier', scenario === 'p61-vendor' ? 60 : 70, -1.6);
    obstacle.displayName = scenario === 'p61-vendor' ? 'Hàng rong băng ngang' : 'Rào sửa đường';
    obstacle.help = definition[2]; obstacle.width = c.barrierWidth; obstacle.length = c.barrierDepth;
    if (scenario === 'p61-vendor') {
      obstacle.width = c.vendorWidth; obstacle.length = c.vendorLength; obstacle.x = -6;
      obstacle.crossMotion = motion(-6, c.vendorSpeed, 'linear', 1.5);
    }
    entities.push(obstacle);
  } else if (scenario === 'p61-ambulance') {
    experimentalTraffic = true;
    const ambulance = car('car7', 'p61-ambulance', 140, -c.ambulanceSpeed);
    ambulance.serviceRole = 'ambulance'; ambulance.displayName = 'Cứu thương đổi làn'; ambulance.help = definition[2];
    ambulance.crossMotion = { ...motion(-3.2, 3, 'pingpong'), min: -3.2, max: 3.2 };
    ambulance.x = crossX(ambulance.crossMotion, 0); entities.push(ambulance);
  }
  const vehicle = newVehicle(chosen, 'p61-player');
  return { ...run, x, vehicleInstances: [vehicle, newVehicle('car4', 'p61-spare')], activeVehicleId: vehicle.id,
    fuel: vehicle.fuel, durability: vehicle.durability, speed: vehicles[chosen].cruiseSpeed,
    inventory: scenario.startsWith('p61-train') ? ['nitro', 'star'] : ['banana', 'star'],
    world: { ...run.world, entities, integrated: false, experimentalMotion: true, experimentalTraffic, experimentalCargo: false, prototype: { version: movingVersion, title: definition[1], description: definition[2] },
      nextSpecial: 1e9, nextHazard: 1e9, nextFuel: 1e9, nextRepair: 1e9, nextPassenger: 1e9, nextShopDistance: 1e9 } };
}
