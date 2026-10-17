import { balance, hazardSizes } from './config';

export type EntityKind = 'water' | 'pothole' | 'traffic' | 'fuel' | 'repair';
export interface Entity {
  id: string; kind: EntityKind; x: number; distance: number; width: number; length: number;
  speed: number; consumed: boolean; touching: boolean; lastHit: number;
}
export interface World { entities: Entity[]; nextHazard: number; nextFuel: number; nextRepair: number; rng: number }
export const initialWorld = (seed: number): World => ({ entities: [], nextHazard: 0, nextFuel: 1, nextRepair: 0, rng: seed >>> 0 });
export function entity(kind: EntityKind, id: string, distance: number, x: number): Entity {
  const sizes: Record<EntityKind, [number, number]> = { water: [3.2, 7], pothole: [1.5, 1.8], traffic: [1.9, 3.6], fuel: [.8, .8], repair: [.8, .8] };
  return { id, kind, distance, x, width: sizes[kind][0], length: sizes[kind][1],
    speed: kind === 'traffic' ? balance.trafficSpeed : 0, consumed: false, touching: false, lastHit: -1e10 };
}
export function warningDistance(playerSpeed: number, target: Entity): number {
  return Math.max(60, Math.max(0, playerSpeed - target.speed) * balance.warningSeconds);
}

const laneCentres = [-balance.laneWidth, 0, balance.laneWidth];
const blocksLane = (e: Entity, x: number) => Math.abs(e.x - x) <= (e.width + balance.vehicleWidth) / 2;
/** Reject a combination that closes every lane across the current speed range. */
export function leavesOpenLane(candidate: Entity, existing: Entity[], distance: number): boolean {
  for (let speed = balance.minSpeed; speed <= balance.maxSpeed; speed += 1) {
    const closing = speed - candidate.speed;
    if (closing <= 0) continue;
    const time = Math.max(0, (candidate.distance - distance) / closing);
    const candidateAt = candidate.distance + candidate.speed * time;
    const concurrent = existing.filter(e => !e.consumed && (e.kind === 'traffic' || e.kind === 'pothole') &&
      Math.abs(e.distance + e.speed * time - candidateAt) <= (e.length + candidate.length + balance.vehicleLength) / 2 + 4);
    if (!laneCentres.some(x => !blocksLane(candidate, x) && concurrent.every(e => !blocksLane(e, x)))) return false;
  }
  return true;
}

const coversRoad = (e: Entity) => e.width >= balance.laneWidth * balance.laneCount - 1e-8;
function forcedPatchIsAffordable(e: Entity, distance: number, fuel: number, durability: number): boolean {
  if (!coversRoad(e)) return true;
  if (e.kind === 'water') {
    const cost = (e.distance - distance) * balance.fuelPerMeter +
      (e.length + balance.vehicleLength) / balance.minSpeed * balance.waterFuelPerSecond;
    return fuel >= cost + .5;
  }
  if (e.kind === 'pothole') {
    const cost = balance.potholeImpactDamage +
      (e.length + balance.vehicleLength) / balance.minSpeed * balance.potholeDamagePerSecond;
    return durability >= cost + 10;
  }
  return false;
}
function hasConcurrentCar(candidate: Entity, existing: Entity[], distance: number): boolean {
  for (let speed = balance.minSpeed; speed <= balance.maxSpeed; speed += 1) {
    const time = Math.max(0, (candidate.distance - distance) / speed);
    if (existing.some(e => e.kind === 'traffic' && !e.consumed &&
      Math.abs(e.distance + e.speed * time - candidate.distance) <=
        (e.length + candidate.length + balance.vehicleLength) / 2 + 4)) return true;
  }
  return false;
}

/** Forced three-lane costs require a resource budget until junction branches exist. */
export function fillWorld(world: World, distance: number, fuel: number = balance.fuelCapacity, durability: number = balance.durabilityCapacity): World {
  const w = { ...world, entities: world.entities.filter(e => e.distance + e.length / 2 > distance - 12) };
  const ahead = distance + balance.worldLookAhead;
  const random = () => {
    w.rng = (Math.imul(w.rng, 1664525) + 1013904223) >>> 0;
    return w.rng >>> 16;
  };
  const kinds: EntityKind[] = ['water', 'pothole', 'traffic'];
  while (balance.firstHazard + w.nextHazard * balance.hazardGap <= ahead) {
    const index = w.nextHazard++, kind = kinds[index % kinds.length];
    const lane = random() % 3 - 1;
    const hazard = entity(kind, `hazard-${index}`, balance.firstHazard + index * balance.hazardGap, lane * balance.laneWidth);
    if (kind === 'traffic') {
      // Lane directions are relative to the player's current route. The middle is seeded once.
      hazard.speed = lane < 0 ? -balance.trafficSpeed : lane > 0 ? balance.trafficSpeed :
        random() % 2 ? balance.trafficSpeed : -balance.trafficSpeed;
    } else if (kind === 'water' || kind === 'pothole') {
      const variants = hazardSizes[kind];
      const [width, length] = variants[random() % variants.length];
      hazard.width = width; hazard.length = length;
      // Two-lane patches leave an outside lane; three-lane patches cover the full road.
      if (coversRoad(hazard)) hazard.x = 0;
      else if (width > balance.laneWidth) hazard.x = (lane < 0 ? -1 : 1) * balance.laneWidth / 2;
    }
    if (!forcedPatchIsAffordable(hazard, distance, fuel, durability)) {
      hazard.width = 5.7; hazard.x = (lane < 0 ? -1 : 1) * balance.laneWidth / 2;
    }
    const forced = coversRoad(hazard);
    if (forced && kind === 'pothole' && hasConcurrentCar(hazard, w.entities, distance)) continue;
    if (forced || kind === 'water' || leavesOpenLane(hazard, w.entities, distance)) w.entities.push(hazard);
  }
  while (w.nextFuel * balance.fuelInterval <= ahead) {
    const index = w.nextFuel++;
    w.entities.push(entity('fuel', `fuel-${index}`, index * balance.fuelInterval, index % 2 ? -balance.laneWidth : balance.laneWidth));
  }
  while (balance.firstRepair + w.nextRepair * balance.repairInterval <= ahead) {
    const index = w.nextRepair++;
    w.entities.push(entity('repair', `repair-${index}`, balance.firstRepair + index * balance.repairInterval, index % 2 ? -balance.laneWidth : balance.laneWidth));
  }
  return w;
}

/** Slab sweep in relative 2D space, including sideways movement and moving traffic. */
export function sweptContact(x0: number, z0: number, x1: number, z1: number, halfWidth: number, halfLength: number): [number, number] | null {
  let enter = 0, exit = 1;
  for (const [a, b, extent] of [[x0, x1, halfWidth], [z0, z1, halfLength]]) {
    const delta = b - a;
    if (Math.abs(delta) < 1e-12) { if (Math.abs(a) > extent) return null; continue; }
    const t0 = (-extent - a) / delta, t1 = (extent - a) / delta;
    enter = Math.max(enter, Math.min(t0, t1)); exit = Math.min(exit, Math.max(t0, t1));
    if (exit < enter) return null;
  }
  return [enter, exit];
}
