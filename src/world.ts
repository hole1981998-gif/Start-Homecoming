import { crossX, type CrossMotion } from './cross-motion';
import { fillStressWorld } from './stress-world';
import { movingEvent } from './moving-events';
import { isSpecial, specialPlan } from './special-events';
import { eventBalance } from './config';
import { balance, hazardSizes, itemBalance, shopBalance, stressBalance } from './config';
import { trafficSpawnKinds, trafficTypes, vehicles, type VehicleDefinition, type VehicleKind } from './vehicles';
export { trafficTypes } from './vehicles';
import { nearJunction, type RouteState, type Turn } from './route';
import { moveTrafficWithFuel } from './traffic-fuel';
const maxTrafficSpeed = Math.max(...Object.values(trafficTypes).map(type => type.speed));

export type EntityKind = 'wind' | 'water' | 'pothole' | 'traffic' | 'cargo' | 'fuel' | 'repair' | 'passenger' | 'shop' | 'police' | 'militia' | 'jam' | 'accident' | 'train' | 'broken';
export interface ShopStock { vehicles: VehicleKind[]; items?: { nitro: number; star: number; grab?: number; banana?: number } }
export type TrafficKind = VehicleKind;
export interface PassengerMotion { homeX: number; homeDistance: number; startedAt: number; phase: number; idle: boolean;
  ejectedAt?: number; fromX?: number; fromDistance?: number; crashRecovery?: boolean }
export interface Entity {
  id: string; kind: EntityKind; x: number; distance: number; width: number; length: number;
  speed: number; consumed: boolean; touching: boolean; lastHit: number;
  passengerType?: 'grab'; passengerMotion?: PassengerMotion; motionKey?: string; pickupable?: boolean; riderId?: string;
  trafficKind?: TrafficKind; hp?: number; wrecked?: boolean; wreckAge?: number; trafficContacts?: string[]; baseSpeed?: number;
  wreckPassengersSpawned?: boolean; wreckedByPlayer?: boolean;
  fuel?: number; trafficMotion?: 'powered' | 'coasting' | 'stopped'; coastRemaining?: number;
  shopStock?: ShopStock; eventAt?: number;
  lateralPush?: number; motionWaiting?: boolean; crossMotion?: CrossMotion; groupId?: string; stunned?: boolean;
  trafficPairContacts?: string[]; trafficStoppedByCollision?: boolean; trafficPlayerSource?: boolean;
  serviceRole?: 'ambulance';
  cargoReleaseAt?: number; cargoDropped?: boolean; cargoType?: 'crate' | 'barrel'; cargoVelocityX?: number; cargoExpiresAt?: number; cargoSourceId?: string;
  displayName?: string; help?: string;
}
export interface RetiredEntity { entity: Entity; route: RouteState; expireDistance: number }
export interface World { entities: Entity[]; retired: RetiredEntity[]; nextHazard: number; nextFuel: number; nextRepair: number;
  stress?: boolean; nextStress?: number; integrated?: boolean; experimentalMotion?: boolean; experimentalTraffic?: boolean; experimentalCargo?: boolean; prototype?: { version: string; title: string; description: string };
  nextSpecial?: number; nextPassenger: number; nextShop: number; nextShopDistance: number; rng: number; seed: number; branchSeed: number; branchId: number; branchVariant: number }
export const initialWorld = (seed: number, integrated = false): World => ({ entities: [], retired: [],
  ...(integrated ? { integrated: true, experimentalMotion: true, experimentalTraffic: true } : {}), nextHazard: 0, nextFuel: 1,
  nextRepair: 0, nextPassenger: 0, nextShop: 0, nextShopDistance: shopBalance.firstDistance,
  rng: seed >>> 0, seed, branchSeed: seed >>> 0, branchId: 0, branchVariant: 0 });
export function nextShopDistance(distance: number, index: number, seed: number): number {
  if (index === 0) return shopBalance.secondDistance;
  const span = shopBalance.maxGap - shopBalance.minGap + 1;
  const offset = (Math.imul(seed ^ index, 1103515245) >>> 0) % span;
  for (let i = 0; i < span; i++) {
    const candidate = distance + shopBalance.minGap + (offset + i) % span;
    if (!nearJunction(candidate)) return candidate;
  }
  throw new Error('No safe shop interval');
}
const branchEntityId = (world: World, prefix: string, index: number) =>
  world.branchId === 0 ? `${prefix}-${index}` : `${prefix}-${world.branchId}-${index}`;
/** Keep the old straight branch until its junction leaves the rear view. */
export function forkWorld(world: World, route: RouteState, turn: Turn, junctionDistance: number): World {
  const split = junctionDistance - 8;
  const branchId = world.branchId + 1;
  const branchVariant = (world.branchVariant + (turn === 'left' ? 1 : 2)) % 3;
  const branchSeed = (Math.imul(world.branchSeed ^ Math.imul(route.index + 1, 0x9e3779b1) ^
    (turn === 'left' ? 0x51633e2d : 0x2734a901), 1664525) + 1013904223) >>> 0;
  let nextHazard = 0;
  while (hazardDistance(nextHazard) < split) nextHazard++;
  const oldRoute = { ...route, choice: null };
  let shopIndex = 0, shopDistance: number = shopBalance.firstDistance;
  while (shopDistance < split) { shopDistance = nextShopDistance(shopDistance, shopIndex, branchSeed); shopIndex++; }
  return { ...world, entities: world.entities.filter(e => e.distance < split),
    retired: [...world.retired, ...world.entities.filter(e => !e.consumed && e.distance >= split)
      .map(entity => ({ entity, route: oldRoute, expireDistance: junctionDistance + 64 }))],
    nextSpecial: world.nextSpecial === 1e9 ? 1e9 : Math.max(0, Math.ceil((split - eventBalance.firstDistance) / eventBalance.gap)),
    nextStress: world.stress ? Math.max(0, Math.ceil((split - stressBalance.first) / stressBalance.gap)) : world.nextStress,
    nextHazard, nextFuel: Math.max(1, Math.ceil(split / balance.fuelInterval)),
    nextRepair: Math.max(0, Math.ceil((split - balance.firstRepair) / balance.repairInterval)),
    nextPassenger: Math.max(0, Math.ceil((split - balance.firstPassenger) / balance.passengerInterval)),
    nextShop: shopIndex, nextShopDistance: shopDistance, rng: branchSeed, branchSeed, branchId, branchVariant };
}
export function entity(kind: EntityKind, id: string, distance: number, x: number): Entity {
  const sizes: Record<EntityKind, [number, number]> = { wind: [9.6, 65], water: [3.2, 7], pothole: [1.5, 1.8], traffic: [trafficTypes.car4.width, trafficTypes.car4.length], cargo: [.8, .8], fuel: [.8, .8], repair: [.8, .8], passenger: [.7, .7], shop: [1, 3], police: [9.6, .8], militia: [9.6, .8], jam: [6.2, 6], accident: [6.2, 5], train: [9.6, 2], broken: [1.9, 4.2] };
  return { id, kind, distance, x, width: sizes[kind][0], length: sizes[kind][1],
    speed: kind === 'traffic' ? balance.trafficSpeed : 0, consumed: false, touching: false, lastHit: -1e10,
    ...(kind === 'traffic' ? { trafficKind: 'car4' as const, hp: trafficTypes.car4.hp, wrecked: false,
      trafficContacts: [], baseSpeed: balance.trafficSpeed } : {}) };
}
/** Move traffic once per fixed step and resolve road patches against its swept footprint. */
export function advanceTraffic(entities: Entity[], dt: number): void {
  for (const car of entities) {
    if (car.kind !== 'traffic' || car.consumed) continue;
    if (car.wrecked || (car.hp ?? 0) <= 0) {
      car.speed = 0; car.wrecked = true; car.wreckAge = (car.wreckAge ?? 0) + dt;
      if (car.wreckAge >= balance.trafficWreckSeconds) car.consumed = true;
      continue;
    }
    const start = car.distance, contacts: string[] = [];
    moveTrafficWithFuel(car, entities, dt);
    let inWater = false;
    for (const patch of entities) {
      if (patch.consumed || (patch.kind !== 'pothole' && patch.kind !== 'water')) continue;
      const hit = sweptContact(car.x - patch.x, start - patch.distance, car.x - patch.x,
        car.distance - patch.distance, (car.width + patch.width) / 2, (car.length + patch.length) / 2);
      if (!hit) continue;
      const [enter, exit] = hit;
      if (patch.kind === 'pothole') {
        const firstTouch = !(car.trafficContacts ?? []).includes(patch.id);
        car.hp = Math.max(0, (car.hp ?? trafficTypes.car4.hp) -
          (firstTouch ? balance.potholeImpactDamage : 0) - (exit - enter) * dt * balance.potholeDamagePerSecond);
      } else inWater = true;
      if (exit >= 1 - 1e-9) contacts.push(patch.id);
    }
    car.trafficContacts = contacts;
    if ((car.hp ?? 0) <= 0) { car.hp = 0; car.wrecked = true; car.wreckAge = 0; car.speed = 0; }
    else if (car.trafficMotion === 'powered') car.speed = (car.baseSpeed ?? balance.trafficSpeed) * (inWater ? balance.trafficWaterSpeedFactor : 1);
  }
}
function passengerHash(id: string): number {
  let hash = 2166136261;
  for (const character of id) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619) >>> 0;
  return hash >>> 0;
}
/** Resolve each wreck once, after collision events. Unsafe exits wait; retired branches never spawn. */
export function spawnWreckPassengers(world: World, now: number, vehicle: VehicleDefinition): void {
  const additions: Entity[] = [];
  for (const car of world.entities) {
    if (car.kind !== 'traffic' || !car.wrecked || car.wreckPassengersSpawned) continue;
    const hash = passengerHash(`${world.seed}:${car.id}:occupants`);
    const count = 1 + hash % Math.min(balance.trafficPassengerLimit, vehicles[car.trafficKind ?? 'car4'].capacity - 1);
    const side = hash & 1 ? 1 : -1;
    const exits = [side * balance.laneWidth, -side * balance.laneWidth, 0]
      .filter(x => Math.abs(x - car.x) > (car.width + .7) / 2 + balance.trafficPassengerClearance)
      .sort((a, b) => Math.abs(a - car.x) - Math.abs(b - car.x));
    const positions = exits.map(x => Array.from({ length: count }, (_, index) => ({
      x,
      distance: car.distance + (index - (count - 1) / 2) * 2,
    })));
    const safe = positions.find(group => group.every(point => world.entities.every(hazard => {
      if (hazard.consumed || hazard.wrecked || (!['water', 'pothole', 'traffic'].includes(hazard.kind) &&
        !(world.experimentalMotion && ['jam', 'train', 'accident', 'broken'].includes(hazard.kind)))) return true;
      if (world.experimentalMotion) {
        const m = hazard.crossMotion, future = now + balance.warningSeconds;
        const minX = hazard.motionWaiting ? -balance.laneWidth * 1.5 : m ? m.type === 'pingpong' ? m.min : Math.min(hazard.x, crossX(m, future)) : hazard.x;
        const maxX = hazard.motionWaiting ? balance.laneWidth * 1.5 : m ? m.type === 'pingpong' ? m.max : Math.max(hazard.x, crossX(m, future)) : hazard.x;
        const end = hazard.distance + hazard.speed * balance.warningSeconds;
        const halfW = (vehicle.width + hazard.width) / 2 + balance.trafficPassengerClearance;
        const halfL = (vehicle.length + hazard.length) / 2 + balance.trafficPassengerClearance;
        return point.x < minX - halfW || point.x > maxX + halfW ||
          point.distance < Math.min(hazard.distance, end) - halfL || point.distance > Math.max(hazard.distance, end) + halfL;
      }
      // Reserve enough room for the current vehicle, not only the NPC's tiny collider.
      return Math.abs(point.x - hazard.x) > (vehicle.width + hazard.width) / 2 + balance.trafficPassengerClearance ||
        Math.abs(point.distance - hazard.distance) > (vehicle.length + hazard.length) / 2 + balance.trafficPassengerClearance;
    })));
    if (!safe) continue;
    car.wreckPassengersSpawned = true;
    for (let i = 0; i < safe.length; i++) {
      const point = safe[i], npc = entity('passenger', `wreck-rider:${car.id}:${i}`, point.distance, point.x);
      npc.motionKey = `${world.seed}:${npc.id}`; npc.riderId = npc.id;
      npc.pickupable = car.wreckedByPlayer !== true;
      // Remain in the checked safe pocket; wandering could carry them back into the patch.
      npc.passengerMotion = { ...passengerMotion(npc, now), idle: true };
      additions.push(npc);
    }
  }
  world.entities.push(...additions);
}
export function passengerMotion(e: Entity, at: number): PassengerMotion {
  const hash = passengerHash(e.motionKey ?? e.id);
  return { homeX: e.x, homeDistance: e.distance, startedAt: at,
    phase: hash / 0x100000000 * Math.PI * 2, idle: hash % 3 === 0 };
}
export function passengerPose(e: Entity, now: number): { height: number; roll: number } {
  const motion = e.passengerMotion;
  if (e.kind !== 'passenger' || motion?.ejectedAt === undefined) return { height: 0, roll: 0 };
  const flight = Math.max(0, Math.min(1, (now - motion.ejectedAt) / balance.passengerKickSeconds));
  const side = motion.homeX >= (motion.fromX ?? motion.homeX) ? 1 : -1;
  const height = flight < 1 ? (1 - flight) * 1.15 + Math.sin(Math.PI * flight) * 1.1 : 0;
  if (!motion.crashRecovery) return { height, roll: flight < 1 ? side * flight * Math.PI * 2 : 0 };
  if (flight < 1) return { height, roll: side * flight * (Math.PI * 2 + 1.2) };
  const standing = Math.max(0, Math.min(1, (now - motion.ejectedAt - balance.passengerKickSeconds -
    balance.passengerDownSeconds) / balance.passengerStandSeconds));
  return { height: 0, roll: side * 1.2 * (1 - standing) };
}
/** Deterministic, slow NPC motion independent of render FPS and hazard RNG. */
export function advancePassengers(entities: Entity[], now: number): void {
  for (const e of entities) {
    if (e.kind !== 'passenger' || e.consumed) continue;
    const motion = e.passengerMotion ?? passengerMotion(e, now);
    e.passengerMotion = motion;
    const flight = motion.ejectedAt === undefined ? Infinity : now - motion.ejectedAt;
    if (flight < balance.passengerKickSeconds) {
      const progress = Math.max(0, Math.min(1, flight / balance.passengerKickSeconds));
      const ease = 1 - (1 - progress) ** 3;
      e.x = (motion.fromX ?? motion.homeX) + (motion.homeX - (motion.fromX ?? motion.homeX)) * ease;
      e.distance = (motion.fromDistance ?? motion.homeDistance) +
        (motion.homeDistance - (motion.fromDistance ?? motion.homeDistance)) * progress;
      continue;
    }
    const elapsed = Math.max(0, now - motion.startedAt);
    if (motion.idle) { e.x = motion.homeX; e.distance = motion.homeDistance; continue; }
    const radius = balance.passengerWanderRadius / 2;
    const angle = elapsed * balance.passengerWanderSpeed / radius + motion.phase;
    e.x = motion.homeX + radius * (Math.cos(angle) - Math.cos(motion.phase));
    e.distance = motion.homeDistance + radius * (Math.sin(angle) - Math.sin(motion.phase));
  }
}
export function warningDistance(playerSpeed: number, target: Entity, vehicleLength: number = balance.vehicleLength): number {
  if (isSpecial(target.kind)) return Math.max(60, Math.max(0, playerSpeed - target.speed) * balance.warningSeconds + (vehicleLength + target.length) / 2);
  if (target.kind === 'shop') return Math.max(60, playerSpeed * 4);
  return Math.max(60, Math.max(0, playerSpeed - target.speed) * balance.warningSeconds);
}

const laneCentres = [-balance.laneWidth, 0, balance.laneWidth];
export function passengerDistance(index: number): number { return balance.firstPassenger + index * balance.passengerInterval; }
/** Gap eases from 90 m to 75 m over roughly the first 10 km. */
export function hazardDistance(index: number): number {
  const rampSteps = Math.ceil(10000 / balance.hazardGap);
  const ramped = Math.min(index, rampSteps);
  const range = balance.hazardGap - balance.hazardGapMin;
  const reduction = range / rampSteps * ramped * (ramped - 1) / 2 + range * Math.max(0, index - rampSteps);
  return balance.firstHazard + balance.hazardGap * index - reduction;
}
const blocksLane = (e: Entity, x: number, vehicle: VehicleDefinition) =>
  Math.abs(e.x - x) <= (e.width + vehicle.width) / 2;
/** Reject a combination that closes every lane across the current speed range. */
export function leavesOpenLane(candidate: Entity, existing: Entity[], distance: number,
  vehicle: VehicleDefinition = vehicles.motorcycle): boolean {
  for (let speed = vehicle.minSpeed; speed <= vehicle.maxSpeed; speed += 1) {
    const closing = speed - candidate.speed;
    if (closing <= 0) continue;
    const time = Math.max(0, (candidate.distance - distance) / closing);
    const candidateAt = candidate.distance + candidate.speed * time;
    const concurrent = existing.filter(e => !e.consumed && (e.kind === 'traffic' || e.kind === 'pothole') &&
      Math.abs(e.distance + e.speed * time - candidateAt) <= (e.length + candidate.length + vehicle.length) / 2 + 4);
    if (!laneCentres.some(x => !blocksLane(candidate, x, vehicle) && concurrent.every(e => !blocksLane(e, x, vehicle)))) return false;
  }
  return true;
}

const coversRoad = (e: Entity) => e.width >= balance.laneWidth * balance.laneCount - 1e-8;
function forcedPatchIsAffordable(e: Entity, distance: number, fuel: number, durability: number,
  fuelFactor: number, vehicle: VehicleDefinition): boolean {
  if (!coversRoad(e)) return true;
  if (e.kind === 'water') {
    // Evaluate the current load; boarding later is a player choice that changes the remaining budget.
    const cost = (e.distance - distance) * vehicle.fuelPerMeter * fuelFactor +
      (e.length + vehicle.length) / vehicle.minSpeed * balance.waterFuelPerSecond;
    return fuel >= cost + .5;
  }
  if (e.kind === 'pothole') {
    const cost = balance.potholeImpactDamage +
      (e.length + vehicle.length) / vehicle.minSpeed * balance.potholeDamagePerSecond;
    return durability >= cost + 10;
  }
  return false;
}
function hasConcurrentCar(candidate: Entity, existing: Entity[], distance: number, vehicle: VehicleDefinition): boolean {
  for (let speed = vehicle.minSpeed; speed <= vehicle.maxSpeed; speed += 1) {
    const time = Math.max(0, (candidate.distance - distance) / speed);
    if (existing.some(e => e.kind === 'traffic' && !e.consumed &&
      Math.abs(e.distance + e.speed * time - candidate.distance) <=
        (e.length + candidate.length + vehicle.length) / 2 + 4)) return true;
  }
  return false;
}

/** Forced three-lane costs require a resource budget until junction branches exist. */
export function fillWorld(world: World, distance: number, fuel: number = balance.fuelCapacity,
  durability: number = balance.durabilityCapacity, fuelFactor = 1,
  vehicle: VehicleDefinition = vehicles.motorcycle, now = 0, speed = vehicle.cruiseSpeed): World {
  const w = { ...world, entities: world.entities.filter(e => e.kind === 'cargo' && (e.consumed || now >= (e.cargoExpiresAt ?? Infinity)) ? false : e.kind === 'shop' ?
    e.distance + shopBalance.reach >= distance : e.distance + e.length / 2 > distance - 12),
    retired: world.retired.filter(e => e.expireDistance >= distance) };
  const ahead = distance + Math.max(balance.worldLookAhead, (vehicle.maxSpeed + maxTrafficSpeed) * balance.warningSeconds);
  while (w.nextShopDistance <= ahead) {
    const index = w.nextShop, at = w.nextShopDistance;
    const shop = entity('shop', branchEntityId(w, 'shop', index), at, index % 2 ? balance.laneWidth : -balance.laneWidth);
    shop.shopStock = { vehicles: Object.keys(vehicles) as VehicleKind[], items: { nitro: 1, star: 1, grab: itemBalance.grabShopStock, banana: 1 } };
    w.entities.push(shop);
    w.nextShopDistance = nextShopDistance(at, index, w.branchSeed); w.nextShop++;
  }
  const random = () => {
    w.rng = (Math.imul(w.rng, 1664525) + 1013904223) >>> 0;
    return w.rng >>> 16;
  };
  const kinds: EntityKind[] = ['water', 'pothole', 'traffic'];
  while (hazardDistance(w.nextHazard) <= ahead) {
    const index = w.nextHazard++, kind = kinds[(index + w.branchVariant) % kinds.length];
    const spawnAt = hazardDistance(index);
    // A junction is a short decision corridor, not a surprise hazard stack.
    if (nearJunction(spawnAt)) continue;
    const specialIndex = Math.max(0, Math.round((spawnAt - eventBalance.firstDistance) / eventBalance.gap));
    const eventCorridor = w.nextSpecial !== 1e9 && Math.abs(specialPlan(specialIndex, w.branchSeed).distance - spawnAt) < eventBalance.corridor;
    const shopCorridor = Math.abs(w.nextShopDistance - spawnAt) < shopBalance.clearance ||
      w.entities.some(e => e.kind === 'shop' && Math.abs(e.distance - spawnAt) < shopBalance.clearance);
    const lane = random() % 3 - 1;
    const hazard = entity(kind, branchEntityId(w, 'hazard', index), spawnAt, lane * balance.laneWidth);
    if (kind === 'traffic') {
      const variant = trafficSpawnKinds[random() % trafficSpawnKinds.length];
      hazard.trafficKind = variant; hazard.hp = trafficTypes[variant].hp;
      hazard.fuel = vehicles[variant].fuelCapacity; hazard.trafficMotion = 'powered';
      hazard.width = trafficTypes[variant].width; hazard.length = trafficTypes[variant].length;
      // Lane directions are relative to the player's current route. The middle is seeded once.
      hazard.speed = lane < 0 ? -trafficTypes[variant].speed : lane > 0 ? trafficTypes[variant].speed :
        random() % 2 ? trafficTypes[variant].speed : -trafficTypes[variant].speed;
      hazard.baseSpeed = hazard.speed;
    } else if (kind === 'water' || kind === 'pothole') {
      const variants = hazardSizes[kind];
      const [width, length] = variants[random() % variants.length];
      hazard.width = width; hazard.length = length;
      // Two-lane patches leave an outside lane; three-lane patches cover the full road.
      if (coversRoad(hazard)) hazard.x = 0;
      else if (width > balance.laneWidth) hazard.x = (lane < 0 ? -1 : 1) * balance.laneWidth / 2;
    }
    if (!forcedPatchIsAffordable(hazard, distance, fuel, durability, fuelFactor, vehicle)) {
      hazard.width = 5.7; hazard.x = (lane < 0 ? -1 : 1) * balance.laneWidth / 2;
    }
    // Consume the usual hazard draws before rejecting it, so shop stock/corridors cannot reroll later hazards.
    if (shopCorridor || eventCorridor) continue;
    // A call reserves only its pickup pocket, never rerolls hazard RNG or clears whole road sections.
    const grabPocket = w.entities.some(npc => npc.kind === 'passenger' && npc.passengerType === 'grab' &&
      !npc.consumed && npc.pickupable !== false && (() => {
        const t = Math.max(0, npc.distance - distance) / vehicle.minSpeed;
        const from = Math.min(hazard.distance, hazard.distance + hazard.speed * t);
        const to = Math.max(hazard.distance, hazard.distance + hazard.speed * t);
        const clearance = (vehicle.length + hazard.length) / 2 + itemBalance.grabClearance;
        const bound = (balance.laneWidth * balance.laneCount - vehicle.width) / 2;
        const pickupX = Math.max(-bound, Math.min(bound, npc.x));
        return Math.abs(pickupX - hazard.x) <= (vehicle.width + hazard.width) / 2 + itemBalance.grabClearance &&
          npc.distance >= from - clearance && npc.distance <= to + clearance;
      })());
    if (grabPocket) continue;
    const forced = coversRoad(hazard);
    if (forced && kind === 'pothole' && hasConcurrentCar(hazard, w.entities, distance, vehicle)) continue;
    if (forced || kind === 'water' || leavesOpenLane(hazard, w.entities, distance, vehicle)) w.entities.push(hazard);
  }
  while (w.nextFuel * balance.fuelInterval <= ahead) {
    const index = w.nextFuel++;
    w.entities.push(entity('fuel', branchEntityId(w, 'fuel', index), index * balance.fuelInterval,
      (index + w.branchId) % 2 ? -balance.laneWidth : balance.laneWidth));
  }
  while (balance.firstRepair + w.nextRepair * balance.repairInterval <= ahead) {
    const index = w.nextRepair++;
    w.entities.push(entity('repair', branchEntityId(w, 'repair', index), balance.firstRepair + index * balance.repairInterval,
      (index + w.branchId) % 2 ? -balance.laneWidth : balance.laneWidth));
  }
  while (passengerDistance(w.nextPassenger) <= ahead) {
    const index = w.nextPassenger++;
    const x = ((Math.imul(w.branchSeed ^ (index + 1), 1103515245) >>> 0) & 1) ? balance.laneWidth : -balance.laneWidth;
    const passenger = entity('passenger', branchEntityId(w, 'passenger', index), passengerDistance(index), x);
    passenger.motionKey = `${w.branchSeed}:waiting:${index}`;
    w.entities.push(passenger);
  }
  // Separate deterministic stream; skip shop/junction/Grab corridors rather than force an impossible stack.
  if (w.nextSpecial === undefined) w.nextSpecial = 0;
  while (specialPlan(w.nextSpecial, w.branchSeed).distance <= ahead) {
    const index = w.nextSpecial++, plan = specialPlan(index, w.branchSeed);
    if (plan.distance < distance + vehicle.maxSpeed * eventBalance.reactionSeconds || nearJunction(plan.distance) ||
      w.entities.some(e => (e.kind === 'shop' || (e.kind === 'passenger' && e.passengerType === 'grab' && !e.consumed)) &&
        Math.abs(e.distance - plan.distance) < eventBalance.corridor)) continue;
    const event = entity(plan.kind, branchEntityId(w, 'event', index), plan.distance,
      plan.kind === 'police' || plan.kind === 'militia' || plan.kind === 'train' ? 0 : plan.x);
    if (w.integrated) w.entities.push(...movingEvent(event, index, w.branchSeed, now, distance, vehicle));
    else w.entities.push(event);
  }
  if (w.stress) fillStressWorld(w, Math.max(ahead, distance + stressBalance.lookAhead), now, distance, vehicle);
  w.entities = w.entities.map(e => {
    if (!e.motionWaiting || !e.crossMotion) return e;
    const approach = Math.max(60, speed * 2.4, speed * speed / (2 * balance.braking) + vehicle.length + 15);
    return e.distance - distance <= approach ? { ...e, motionWaiting: false, crossMotion: { ...e.crossMotion, startedAt: now } } : e;
  });
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
