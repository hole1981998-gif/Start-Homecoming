import { balance, movingBalance as c } from './config';
import { type Entity } from './world';
import { vehicles, trafficTypes } from './vehicles';
import type { CrossMotion } from './cross-motion';
import type { JamVariant } from './special-events';

/** Separate seeded event stream: never consumes hazard/shop RNG. */
export function movingEvent(event: Entity, index: number, seed: number, now: number,
  jamVariant?: JamVariant): Entity[] {
  const hash = (Math.imul(seed ^ Math.imul(index + 1, 0x9e3779b1), 1664525) + 1013904223) >>> 0;
  const side = hash & 1 ? 1 : -1;
  const motion = (origin: number, velocity: number, type: CrossMotion['type'] = 'linear'): CrossMotion =>
    ({ origin, velocity, type, startedAt: now, min: -c.patrolBound, max: c.patrolBound });
  if (event.kind === 'train') {
    event.x = -side * c.trainOrigin; event.width = c.trainWidth; event.length = c.trainDepth;
    event.crossMotion = motion(event.x, side * c.trainSpeed);
    // Activation follows the actual approach, rather than an ETA frozen when spawned far away.
    event.motionWaiting = true;
    event.displayName = 'Tàu chạy ngang'; event.help = 'S phanh dừng chờ đuôi tàu; hoặc nitro rồi Space khi đủ khoảng vượt. Chạm thân tàu kết ván.';
  } else if (event.kind === 'police' || event.kind === 'militia') {
    const count = (hash >>> 2) % 3 === 0 ? 2 : 1;
    const variant = (hash >>> 5) % 3;
    return Array.from({ length: count }, (_, i) => {
      const npc = { ...event, id: event.id + '-npc-' + i, groupId: event.id, width: c.npcWidth, length: c.npcDepth,
        x: i ? c.patrolBound : -c.patrolBound };
      const speed = variant === 1 ? c.patrolFastSpeed : variant === 2 ? i ? c.patrolSlowSpeed : c.patrolStaggerSpeed : c.patrolSpeed;
      npc.crossMotion = motion(npc.x, (i ? -1 : 1) * speed, 'pingpong');
      if (variant === 2 && count === 2) {
        npc.distance += i * c.patrolStaggerDepth;
        npc.crossMotion.min = i ? -1.6 : -c.patrolBound;
        npc.crossMotion.max = i ? c.patrolBound : 1.6;
      }
      npc.displayName = event.kind === 'police' ? 'Công an qua lại' : 'Dân phòng qua lại';
      npc.help = 'Né người đang chạy ngang bằng A/D hoặc S chờ cửa sổ. Một chuối làm cả nhóm đứng yên và vô hại.';
      return npc;
    });
  } else if (event.kind === 'jam') {
    const variant = jamVariant ?? (['barrier', 'vendor', 'ambulance'] as const)[(hash >>> 8) % 3];
    if (variant === 'barrier') {
      event.width = c.barrierWidth; event.length = c.barrierDepth;
      event.displayName = 'Rào sửa đường'; event.help = 'Né lane còn trống. Chạm rào gây ngã xe.';
    } else if (variant === 'vendor') {
      event.x = -side * 6; event.width = c.vendorWidth; event.length = c.vendorLength;
      event.crossMotion = motion(event.x, side * c.vendorSpeed);
      // Start from the actual approach, not a cruise-speed ETA fixed at spawn time.
      event.motionWaiting = true; event.crossingRole = 'vendor';
      event.displayName = 'Hàng rong băng đường'; event.help = 'Vật cản chạy ngang; A/D né hoặc S chọn lúc đi qua. Chạm gây ngã.';
    } else {
      event.kind = 'traffic'; event.trafficKind = 'car7'; event.serviceRole = 'ambulance';
      event.width = vehicles.car7.width; event.length = vehicles.car7.length;
      event.hp = trafficTypes.car7.hp; event.fuel = vehicles.car7.fuelCapacity; event.trafficMotion = 'powered';
      event.speed = -c.ambulanceSpeed; event.baseSpeed = event.speed;
      event.x = -side * balance.laneWidth;
      event.crossMotion = { ...motion(event.x, side * 3, 'pingpong'), min: -balance.laneWidth, max: balance.laneWidth };
      event.displayName = 'Cứu thương đổi lane'; event.help = 'Xe ngược chiều nhanh, di chuyển qua lại giữa các lane; đọc hướng rồi né.';
    }
  }
  return [event];
}
