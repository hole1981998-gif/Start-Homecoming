import { balance, densityBalance, earlyBalance, forceBalance, movingBalance } from './config';
import { directorRoll } from './balance-director';
import { crossX } from './cross-motion';
import { movingEvent } from './moving-events';
import { trafficTypes, vehicles, type VehicleDefinition, type VehicleKind } from './vehicles';
import type { Entity, EntityKind } from './world';

/** Candidate C3. The first shop remains a quiet decision; later groups keep continuous spacing. */
export function p8EncounterDistance(index: number): number {
  if (index < 2) return balance.firstHazard + index * balance.hazardGap;
  if (index <= 55) return 350 + (index - 2) * 28.16;
  if (index <= 120) return 1842.48 + (index - 55) * 23.76;
  return 3386.88 + (index - 120) * 20.24;
}
for (let index = 3; index < 250; index++) {
  const gapSeconds = (p8EncounterDistance(index) - p8EncounterDistance(index - 1)) /
    vehicles.car4.cruiseSpeed;
  if (gapSeconds < .8 || gapSeconds > 1.8) throw new Error('Invalid P8 encounter clock');
}

export interface EncounterPlan { id: number; actors: Entity[]; heavy: boolean }
/** A stable, independent roll removes only a third layer; the seeded template remains unchanged. */
export function softenEarlyEncounter(plan: EncounterPlan, seed: number, index: number,
  arrivalSeconds: number): EncounterPlan {
  if (plan.actors.length < 3 || arrivalSeconds >= earlyBalance.endSeconds) return plan;
  const ramp = arrivalSeconds <= earlyBalance.fullReliefSeconds ? 1 :
    (earlyBalance.endSeconds - arrivalSeconds) /
      (earlyBalance.endSeconds - earlyBalance.fullReliefSeconds);
  const threshold = earlyBalance.thirdLayerReduction * ramp;
  if (directorRoll(seed, index, 0x425e2f19) / 0x100000000 >= threshold) return plan;
  return { ...plan, actors: plan.actors.slice(0, 2), heavy: false };
}
type Factory = (kind: EntityKind, id: string, distance: number, x: number) => Entity;
const lane = balance.laneWidth;

function setupTraffic(car: Entity, kind: VehicleKind, speed: number): Entity {
  car.trafficKind = kind; car.hp = trafficTypes[kind].hp;
  car.fuel = vehicles[kind].fuelCapacity; car.trafficMotion = 'powered';
  car.width = trafficTypes[kind].width; car.length = trafficTypes[kind].length;
  car.speed = speed; car.baseSpeed = speed;
  return car;
}

/** A sampled path includes steering time, the whole body, and traffic's projected position. */
export function hasTimedEscape(actors: Entity[], existing: Entity[], playerDistance: number,
  vehicle: VehicleDefinition, now: number, avoidWater = false): boolean {
  const start = Math.min(...actors.map(e => e.distance - e.length / 2)) - 24;
  const end = Math.max(...actors.map(e => e.distance + e.length / 2)) + vehicle.length + 8;
  const hard = [...actors, ...existing].filter(e => !e.consumed &&
    (e.kind === 'traffic' || e.kind === 'jam' || e.kind === 'accident' || e.kind === 'broken' ||
      e.kind === 'train' || e.kind === 'police' || e.kind === 'militia' ||
      avoidWater && e.kind === 'water') &&
    e.distance >= start - 100 && e.distance <= end + 100);
  const speed = Math.max(vehicle.minSpeed, vehicle.cruiseSpeed);
  const lateralLimit = (balance.laneWidth * balance.laneCount - vehicle.width) / 2;
  const positions = Array.from({ length: Math.floor(lateralLimit / .8) * 2 + 1 }, (_, i) =>
    (i - Math.floor(lateralLimit / .8)) * .8);
  let reachable = new Set(positions.map((_, i) => i));
  const dt = .4, steps = Math.ceil((end - start) / (speed * dt));
  const delay = Math.max(0, (start - playerDistance) / speed);
  for (let step = 0; step <= steps; step++) {
    const z = start + step * speed * dt, time = delay + step * dt;
    const next = new Set<number>();
    for (let i = 0; i < positions.length; i++) {
      if (![i - 2, i - 1, i, i + 1, i + 2].some(from => reachable.has(from) &&
        Math.abs(positions[from] - positions[i]) <=
          balance.lateralSpeed * dt * Math.min(1, vehicle.lateralGrip) + 1e-8)) continue;
      const x = positions[i];
      if (hard.some(e => {
        const at = e.distance + e.speed * time;
        const approach = e.crossingRole === 'vendor' ? Math.max(24, speed * 2 + vehicle.length / 2) :
          Math.max(60, speed * 2.4, speed * speed / (2 * balance.braking) + vehicle.length + 15);
        const activation = e.motionWaiting ? Math.max(0, (e.distance - playerDistance - approach) / speed) : 0;
        const atX = e.crossMotion ? crossX({ ...e.crossMotion,
          startedAt: e.motionWaiting ? now + activation : e.crossMotion.startedAt }, now + time) : e.x;
        const sweptWidth = (vehicle.width + e.width) / 2 +
          (vehicle.length >= 4 ? .22 : .08);
        return Math.abs(z - at) <= (vehicle.length + e.length) / 2 + .3 &&
          Math.abs(x - atX) <= sweptWidth;
      })) continue;
      next.add(i);
    }
    if (!next.size) return false;
    reachable = next;
  }
  return true;
}

/** Seeded templates use existing hazards only; mirror and phase are separate stable draws. */
export function makeP8Encounter(seed: number, index: number, at: number, playerDistance: number,
  now: number, recent: number[], make: Factory, requestedId?: number): EncounterPlan {
  const roll = directorRoll(seed, index, 0x217c5ebd);
  const mirror = directorRoll(seed, index, 0x3127765a) & 1 ? 1 : -1;
  const phase = (directorRoll(seed, index, 0x58f261ad) % 7) - 3;
  const waterChoices = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13,
    4, 6, 7, 8, 10, 11] as const;
  let id = requestedId ?? (roll % 100 < (at < 1700 ? 58 : 68) ?
    waterChoices[(roll >>> 8) % waterChoices.length] : 15 + (roll >>> 8) % 2);
  for (let tries = 0; tries < 16 && recent.includes(id); tries++) id = id === 13 ? 15 : id === 16 ? 1 : id + 1;
  const actors: Entity[] = [];
  const add = (kind: EntityKind, offset: number, x: number) => {
    const e = make(kind, `hazard-${actors.length ? actors.length === 1 ? 'pair-' : 'third-' : ''}${index}`,
      at + offset, x * mirror);
    e.patternId = id; actors.push(e); return e;
  };
  const water = (offset: number, x: number, width = 3.2, length = 24) => {
    const e = add('water', offset, x); e.width = width; e.length = length * .9; return e;
  };
  const hole = (offset: number, x: number) => {
    const e = add('pothole', offset, x); e.width = 2.3; e.length = 4; return e;
  };
  const car = (offset: number, x: number, kind: VehicleKind = 'car4', forward?: boolean) => {
    const actualLane = x * mirror;
    const sameDirection = forward ?? (actualLane > 0 || actualLane === 0 && !!(roll & 1));
    return setupTraffic(add('traffic', offset, x), kind,
      (sameDirection ? 1 : -1) * trafficTypes[kind].speed);
  };
  // All distances are relative to the first decision; overlap creates a visible choice rather than a clean lane.
  switch (id) {
    case 1: water(0, -lane, 3.2, 24); water(12, lane, 3.2, 24); car(12 + phase, 0); break;
    case 2: water(0, -lane, 3.2, 24); water(0, lane, 3.2, 24); car(10 + phase, 0, 'tricycle'); break;
    case 3: water(0, -lane / 2, 5.7, 27); car(12 + phase, lane, 'bus'); break;
    case 4: water(0, -lane, 3.2, 24); hole(9, 0); car(14 + phase, lane); break;
    case 5: water(0, lane, 3.2, 40); car(8 + phase, lane, 'car7'); car(23, -lane, 'motorbike'); break;
    case 6: {
      const wind = add('wind', 0, 0); wind.width = forceBalance.windWidth; wind.length = 45;
      wind.lateralPush = forceBalance.windPush * mirror; water(7, lane, 3.2, 24); car(16 + phase, -lane); break;
    }
    case 7: {
      const barrier = add('jam', 6, -lane / 2); barrier.width = movingBalance.barrierWidth;
      barrier.length = movingBalance.barrierDepth; barrier.displayName = 'Rào sửa đường';
      water(13, lane, 3.2, 24); break;
    }
    case 8: {
      const vendor = add('jam', 12 + phase, 0);
      actors[0] = movingEvent(vendor, index, seed, now, 'vendor')[0];
      actors[0].patternId = id; water(0, lane, 3.2, 24); break;
    }
    case 9: {
      const source = car(20 + phase, lane * mirror, 'truck', true);
      source.cargoReleaseAt = now + Math.max(0, (at - playerDistance) / balance.cruiseSpeed - 2);
      source.cargoType = 'crate'; water(0, 0, 3.2, 24); break;
    }
    case 10: water(0, lane, 3.2, 24); car(12 + phase, -lane, 'car7'); break;
    case 11: {
      const officer = add('militia', 13 + phase, 0);
      actors[0] = movingEvent(officer, index, seed, now)[0];
      actors[0].patternId = id; water(0, lane, 3.2, 24); break;
    }
    case 12: water(0, -lane, 3.2, 24); water(18, lane, 3.2, 24); car(18 + phase, 0, 'car4'); break;
    case 13: water(0, -lane / 2, 5.7, 24); car(12 + phase, lane, 'motorbike', false);
      car(27, -lane, 'car4', false); break;
    case 15: {
      const wind = add('wind', 0, 0); wind.width = forceBalance.windWidth; wind.length = 38;
      wind.lateralPush = -forceBalance.windPush * mirror; hole(15, lane); break;
    }
    default: car(8 + phase, lane, 'car7'); hole(16, 0); break;
  }
  return { id, actors, heavy: actors.length >= 3 };
}

export function p8Affordable(actors: Entity[], playerDistance: number, fuel: number,
  fuelFactor: number, vehicle: VehicleDefinition): boolean {
  const roadWide = actors.filter(e => e.kind === 'water' && e.width >= lane * 3 - .01);
  if (!roadWide.length) return true;
  const travel = (Math.max(...roadWide.map(e => e.distance + e.length / 2)) - playerDistance) *
    vehicle.fuelPerMeter * fuelFactor;
  const water = roadWide.reduce((total, e) => total +
    (e.length + vehicle.length) / vehicle.minSpeed * balance.waterFuelPerSecond, 0);
  return fuel >= travel + water + .5;
}

export function p8ProtectedCorridor(actors: Entity[], shopAt: number, specialAt: number,
  specialKind: EntityKind): boolean {
  return actors.some(e => {
    const shop = Math.abs(e.distance - shopAt) < (e.length + 4) / 2 + 8;
    const trainWater = specialKind === 'train' && e.kind === 'water' &&
      e.distance + e.length / 2 >= specialAt - 62 && e.distance - e.length / 2 <= specialAt + 12;
    const special = trainWater || Math.abs(e.distance - specialAt) < e.length / 2 +
      (e.kind === 'water' ? 12 : densityBalance.specialClearance / 2);
    return shop || special;
  });
}
