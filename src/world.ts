import { crossX, type CrossMotion } from './cross-motion';
import { directorRoll, layerCount, roadHazard, waterSizeIndex } from './balance-director';
import { hasTimedEscape, makeP8Encounter, p8Affordable, p8EncounterDistance,
  p8ProtectedCorridor } from './p8-encounters';
import { fillStressWorld } from './stress-world';
import { movingEvent } from './moving-events';
import { isSpecial, specialPlan } from './special-events';
import { eventBalance } from './config';
import { balance, cargoBalance, densityBalance, forceBalance, hazardSizes, itemBalance, shopBalance, stressBalance } from './config';
import { trafficSpawnKinds, trafficTypes, vehicles, vehicleDefinition, waterFuelPerSecond, type VehicleDefinition, type VehicleKind } from './vehicles';
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
  fuel?: number; trafficMotion?: 'powered' | 'coasting' | 'stopped'; coastRemaining?: number; balanceProfile?: 'backup';
  shopStock?: ShopStock; eventAt?: number;
  lateralPush?: number; motionWaiting?: boolean; crossMotion?: CrossMotion; crossingRole?: 'vendor'; groupId?: string; stunned?: boolean;
  trafficPairContacts?: string[]; trafficStoppedByCollision?: boolean; trafficPlayerSource?: boolean;
  serviceRole?: 'ambulance';
  cargoReleaseAt?: number; cargoDropped?: boolean; cargoType?: 'crate' | 'barrel'; cargoVelocityX?: number; cargoExpiresAt?: number; cargoSourceId?: string;
  displayName?: string; help?: string;
  patternId?: number;
}
export interface RetiredEntity { entity: Entity; route: RouteState; expireDistance: number }
export interface World { entities: Entity[]; retired: RetiredEntity[]; nextHazard: number; nextFuel: number; nextRepair: number;
  stress?: boolean; nextStress?: number; integrated?: boolean; experimentalMotion?: boolean; experimentalTraffic?: boolean; experimentalCargo?: boolean; prototype?: { version: string; title: string; description: string };
  nextSpecial?: number; lastSpecialDistance?: number; nextPassenger: number; nextShop: number; nextShopDistance: number; rng: number; seed: number; branchSeed: number; branchId: number; branchVariant: number;
  pendingWind?: boolean; pendingCargo?: boolean; lastWindDistance?: number; lastCargoDistance?: number;
  heavyPatternStreak?: number; lastPatternEnd?: number; recentPatternIds?: number[];
  branchAvoidKinds?: Record<number, EntityKind>; directorVersion?: 'p8' | 'backup' }
export const initialWorld = (seed: number, integrated = false, directorVersion: 'p8' | 'backup' = 'p8'): World => ({ entities: [], retired: [], directorVersion,
  ...(integrated ? { integrated: true, experimentalMotion: true, experimentalTraffic: true, experimentalCargo: true } : {}), nextHazard: 0, nextFuel: 1,
  nextRepair: 0, nextPassenger: 0, nextShop: 0, nextShopDistance: shopBalance.firstDistance,
  rng: seed >>> 0, seed, branchSeed: seed >>> 0, branchId: 0, branchVariant: 0,
  pendingWind: false, pendingCargo: false, lastWindDistance: -1e9, lastCargoDistance: -1e9,
  heavyPatternStreak: 0, lastPatternEnd: -1e9, recentPatternIds: [], branchAvoidKinds: {} });
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
/** Reserve the actual shifted special location before packing dense P8 groups around it. */
function p8SpecialTarget(index: number, seed: number): number {
  let previous = -1e9;
  for (let event = 0; event <= index; event++) {
    const planned = specialPlan(event, seed).distance;
    let target = planned + Math.ceil(Math.max(0, previous + eventBalance.minimumGap - planned) / 40) * 40;
    let shop: number = shopBalance.firstDistance, shopIndex = 0;
    for (let attempt = 0; attempt < 16; attempt++) {
      while (shop < target - eventBalance.corridor) {
        shop = nextShopDistance(shop, shopIndex, seed); shopIndex++;
      }
      const beforeShop = shopIndex > 0 ? (() => {
        let old: number = shopBalance.firstDistance;
        for (let i = 0; i < shopIndex - 1; i++) old = nextShopDistance(old, i, seed);
        return old;
      })() : -1e9;
      if (!nearJunction(target) && Math.abs(target - shop) >= eventBalance.corridor &&
          Math.abs(target - beforeShop) >= eventBalance.corridor) break;
      target += 40;
    }
    previous = target;
  }
  return previous;
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
  const encounterAt = world.integrated && world.directorVersion !== 'backup' && !world.stress ?
    p8EncounterDistance : hazardDistance;
  while (encounterAt(nextHazard) < split) nextHazard++;
  const oldRoute = { ...route, choice: null };
  const branchAvoidKinds = Object.fromEntries(world.entities.filter(e =>
    e.distance >= split && e.distance < split + 240 && e.id.startsWith('hazard-') &&
    !e.id.startsWith('hazard-pair-') && !e.id.startsWith('hazard-third-'))
    .map(e => [Math.round(e.distance), e.kind]));
  let shopIndex = 0, shopDistance: number = shopBalance.firstDistance;
  while (shopDistance < split) { shopDistance = nextShopDistance(shopDistance, shopIndex, branchSeed); shopIndex++; }
  return { ...world, entities: world.entities.filter(e => e.distance < split),
    retired: [...world.retired, ...world.entities.filter(e => !e.consumed && e.distance >= split)
      .map(entity => ({ entity, route: oldRoute, expireDistance: junctionDistance + 64 }))],
    nextSpecial: world.nextSpecial === 1e9 ? 1e9 : Math.max(0, Math.ceil((split - eventBalance.firstDistance) / eventBalance.gap)),
    lastSpecialDistance: undefined,
    nextStress: world.stress ? Math.max(0, Math.ceil((split - stressBalance.first) / stressBalance.gap)) : world.nextStress,
    nextHazard, nextFuel: Math.max(1, Math.ceil(split / balance.fuelInterval)),
    nextRepair: Math.max(0, Math.ceil((split - balance.firstRepair) / balance.repairInterval)),
    nextPassenger: Math.max(0, Math.ceil((split - balance.firstPassenger) / balance.passengerInterval)),
    nextShop: shopIndex, nextShopDistance: shopDistance, rng: branchSeed, branchSeed, branchId, branchVariant,
    pendingWind: false, pendingCargo: false, lastWindDistance: split - densityBalance.windCooldown,
    lastCargoDistance: split - densityBalance.cargoCooldown, heavyPatternStreak: 0,
    lastPatternEnd: split - 100, recentPatternIds: [], branchAvoidKinds };
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
/** A wreck's passenger roster count is stable across repeated collision checks. */
export function trafficPassengerCount(seed: number, car: Pick<Entity, 'id' | 'trafficKind'>): number {
  const limit = Math.min(balance.trafficPassengerLimit, vehicles[car.trafficKind ?? 'car4'].capacity - 1);
  return limit > 0 ? 1 + passengerHash(`${seed}:${car.id}:occupants`) % limit : 0;
}
/** Resolve each wreck once, after collision events. Unsafe exits wait; retired branches never spawn. */
export function spawnWreckPassengers(world: World, now: number, vehicle: VehicleDefinition): void {
  const additions: Entity[] = [];
  for (const car of world.entities) {
    if (car.kind !== 'traffic' || !car.wrecked || car.wreckPassengersSpawned) continue;
    const hash = passengerHash(`${world.seed}:${car.id}:occupants`);
    const count = trafficPassengerCount(world.seed, car);
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
  if (target.kind === 'wind') return target.length / 2 + Math.max(60, playerSpeed * balance.warningSeconds);
  if (isSpecial(target.kind)) return Math.max(60, Math.max(0, playerSpeed - target.speed) * balance.warningSeconds + (vehicleLength + target.length) / 2);
  if (target.kind === 'shop') return Math.max(60, playerSpeed * 4);
  return Math.max(60, Math.max(0, playerSpeed - target.speed) * balance.warningSeconds);
}

const laneCentres = [-balance.laneWidth, 0, balance.laneWidth];
export function passengerDistance(index: number): number { return balance.firstPassenger + index * balance.passengerInterval; }
/** Gap eases from 80 m to 70 m over roughly the first 3 km. */
export function hazardDistance(index: number): number {
  const rampSteps = Math.ceil(3000 / balance.hazardGap);
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
  fuelFactor: number, vehicle: VehicleDefinition, profile?: 'backup'): boolean {
  if (!coversRoad(e)) return true;
  if (e.kind === 'water') {
    // Evaluate the current load; boarding later is a player choice that changes the remaining budget.
    const cost = (e.distance - distance) * vehicle.fuelPerMeter * fuelFactor +
      (e.length + vehicle.length) / vehicle.minSpeed * waterFuelPerSecond(profile);
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
  const backupDirector = world.directorVersion === 'backup' || !!world.stress;
  const ahead = distance + Math.max(balance.worldLookAhead,
    (vehicle.maxSpeed * itemBalance.boostFactor + maxTrafficSpeed) * balance.warningSeconds + vehicle.length / 2);
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
  // Existing supplies and passengers are known before arranging nearby trade-offs.
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
  if (!backupDirector) spawnSpecials();
  const encounterAt = w.integrated && !backupDirector ? p8EncounterDistance : hazardDistance;
  while (encounterAt(w.nextHazard) <= ahead) {
    const index = w.nextHazard++;
    const spawnAt = encounterAt(index);
    if (w.integrated && !backupDirector && index >= 2) {
      // Keep the request seeded. A gentler two-layer template replaces an unsafe one.
      const nearestSpecial = Math.max(0,
        Math.round((spawnAt - eventBalance.firstDistance) / eventBalance.gap));
      const reservedSpecials = [...new Set([Math.max(0, nearestSpecial - 1), nearestSpecial,
        nearestSpecial + 1])].map(i => ({ at: p8SpecialTarget(i, w.branchSeed),
        kind: specialPlan(i, w.branchSeed).kind }));
      const make = (kind: EntityKind, id: string, at: number, x: number) =>
        entity(kind, w.branchId ? id.replace(/^hazard-(pair-|third-)?/,
          prefix => `${prefix}${w.branchId}-`) : id, at, x);
      const choices = [undefined, 15, 16, 10] as const;
      let chosen: ReturnType<typeof makeP8Encounter> | undefined;
      for (const requestedId of choices) {
        const plan = makeP8Encounter(w.branchSeed, index, spawnAt, distance, now,
          w.recentPatternIds ?? [], make, requestedId);
        if (plan.actors.some(e => nearJunction(e.distance) &&
          Math.abs(e.distance - (balance.firstJunction + Math.round((e.distance - balance.firstJunction) /
            balance.junctionInterval) * balance.junctionInterval)) < 14)) continue;
        if (reservedSpecials.some(special => p8ProtectedCorridor(plan.actors,
          w.nextShopDistance, special.at, special.kind))) continue;
        if (w.entities.some(e => e.kind === 'shop' && plan.actors.some(actor =>
          Math.abs(actor.distance - e.distance) < shopBalance.clearance + actor.length / 2))) continue;
        if (!p8Affordable(plan.actors, distance, fuel, fuelFactor, vehicle)) continue;
        if (w.entities.some(npc => npc.kind === 'passenger' && npc.passengerType === 'grab' &&
          !npc.consumed && plan.actors.some(e => Math.abs(npc.distance - e.distance) <
            (e.length + vehicle.length) / 2 + itemBalance.grabClearance &&
            Math.abs(npc.x - e.x) < (e.width + vehicle.width) / 2 + itemBalance.grabClearance))) continue;
        if (plan.actors.some(actor => w.entities.some(existing => !existing.consumed &&
          (actor.kind === 'wind' && ['jam', 'train', 'accident', 'broken'].includes(existing.kind) ||
            existing.kind === 'wind' && ['jam', 'train', 'accident', 'broken'].includes(actor.kind)) &&
          Math.abs(actor.distance - existing.distance) <= (actor.length + existing.length) / 2))) continue;
        if (!hasTimedEscape(plan.actors, w.entities, distance, vehicle, now)) continue;
        if (fuel < vehicle.fuelCapacity * .6 &&
            !hasTimedEscape(plan.actors, w.entities, distance, vehicle, now, true)) continue;
        chosen = plan; break;
      }
      if (chosen) {
        w.entities.push(...chosen.actors);
        w.recentPatternIds = [...(w.recentPatternIds ?? []).slice(-2), chosen.id];
        w.lastPatternEnd = Math.max(...chosen.actors.map(e => e.distance + e.length / 2));
        w.heavyPatternStreak = chosen.heavy ? (w.heavyPatternStreak ?? 0) + 1 : 0;
      }
      continue;
    }
    if (w.integrated && !backupDirector) {
      const offer = directorRoll(w.branchSeed, index, 0x674e8a19) % 100;
      if (offer < densityBalance.windChancePercent) w.pendingWind = true;
      else if (offer < densityBalance.windChancePercent + densityBalance.cargoChancePercent) w.pendingCargo = true;
    }
    const windReady = w.pendingWind && spawnAt - (w.lastWindDistance ?? -1e9) >= densityBalance.windCooldown;
    const cargoReady = w.pendingCargo && spawnAt - (w.lastCargoDistance ?? -1e9) >= densityBalance.cargoCooldown;
    const windSlot = backupDirector ? !!w.integrated && !w.stress &&
      index % forceBalance.integratedEveryHazards === forceBalance.integratedOffset :
      !!windReady && (!cargoReady || index % 2 === 0);
    const cargoSlot = backupDirector ? !!w.integrated && !w.stress &&
      index % cargoBalance.integratedEveryHazards === cargoBalance.integratedOffset :
      !!cargoReady && !windSlot;
    const backupKinds: EntityKind[] = ['water', 'pothole', 'traffic'];
    let kind: EntityKind = windSlot ? 'wind' : cargoSlot ? 'traffic' : backupDirector ?
      backupKinds[(index + w.branchVariant) % backupKinds.length] : roadHazard(w.branchSeed, index);
    if (!backupDirector && !windSlot && !cargoSlot && w.branchAvoidKinds?.[Math.round(spawnAt)] === kind)
      kind = kind === 'water' ? 'pothole' : kind === 'pothole' ? 'traffic' : 'water';
    // A junction is a short decision corridor, not a surprise hazard stack.
    if (nearJunction(spawnAt)) continue;
    const specialIndex = Math.max(0, Math.round((spawnAt - eventBalance.firstDistance) / eventBalance.gap));
    random(); // Preserve the hazard stream's draw count across lane-selection changes.
    const laneHash = (Math.imul(w.branchSeed ^ Math.imul(index + 1, 0x9e3779b1), 1664525) + 1013904223) >>> 0;
    const lane = (laneHash >>> 16) % 3 - 1;
    const hazard = entity(kind, branchEntityId(w, 'hazard', index), spawnAt, lane * balance.laneWidth);
    if (kind === 'wind') {
      hazard.x = 0; hazard.width = forceBalance.windWidth; hazard.length = forceBalance.zoneLength;
      hazard.lateralPush = random() % 2 ? forceBalance.windPush : -forceBalance.windPush;
      hazard.displayName = 'Gió ngang';
    }
    if (kind === 'traffic') {
      const variant = cargoSlot ? (random() % 2 ? 'truck' : 'container') : trafficSpawnKinds[random() % trafficSpawnKinds.length];
      hazard.trafficKind = variant; hazard.hp = trafficTypes[variant].hp;
      hazard.fuel = vehicles[variant].fuelCapacity; hazard.trafficMotion = 'powered';
      hazard.width = trafficTypes[variant].width; hazard.length = trafficTypes[variant].length;
      // Lane directions are relative to the player's current route. The middle is seeded once.
      hazard.speed = cargoSlot ? trafficTypes[variant].speed : lane < 0 ? -trafficTypes[variant].speed : lane > 0 ? trafficTypes[variant].speed :
        random() % 2 ? trafficTypes[variant].speed : -trafficTypes[variant].speed;
      hazard.baseSpeed = hazard.speed;
      if (cargoSlot) {
        hazard.x = balance.laneWidth;
        hazard.cargoReleaseAt = now + cargoBalance.integratedReleaseDelay;
        hazard.cargoType = variant === 'container' ? 'barrel' : 'crate';
      }
    } else if (kind === 'water' || kind === 'pothole') {
      const variants = hazardSizes[kind];
      const [width, length] = variants[kind === 'water' && !backupDirector ? waterSizeIndex(w.branchSeed, index) : random() % variants.length];
      hazard.width = width; hazard.length = length;
      // Two-lane patches leave an outside lane; three-lane patches cover the full road.
      if (coversRoad(hazard)) hazard.x = 0;
      else if (width > balance.laneWidth) hazard.x = (lane < 0 ? -1 : 1) * balance.laneWidth / 2;
    }
    if (kind !== 'wind' && !forcedPatchIsAffordable(hazard, distance, fuel, durability, fuelFactor, vehicle,
      backupDirector ? 'backup' : undefined)) {
      hazard.width = 5.7; hazard.x = (lane < 0 ? -1 : 1) * balance.laneWidth / 2;
    }
    // Consume the usual hazard draws before rejecting it, so shop stock/corridors cannot reroll later hazards.
    const eventCorridor = w.nextSpecial !== 1e9 &&
      Math.abs(specialPlan(specialIndex, w.branchSeed).distance - spawnAt) <
        (backupDirector ? eventBalance.corridor : densityBalance.specialClearance + hazard.length / 2);
    const shopCorridor = Math.abs(w.nextShopDistance - spawnAt) < shopBalance.clearance + (backupDirector ? 0 : hazard.length / 2) ||
      w.entities.some(e => e.kind === 'shop' && Math.abs(e.distance - spawnAt) <
        shopBalance.clearance + (backupDirector ? 0 : hazard.length / 2));
    if (shopCorridor || eventCorridor && !(backupDirector && (windSlot || cargoSlot))) continue;
    if (!backupDirector && (w.heavyPatternStreak ?? 0) >= 2 &&
        spawnAt - (w.lastPatternEnd ?? -1e9) < Math.max(densityBalance.heavyBreatherMetres, vehicle.maxSpeed * 3)) {
      w.heavyPatternStreak = 0;
      continue;
    }
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
    if (forced || kind === 'water' || leavesOpenLane(hazard, w.entities, distance, vehicle)) {
      w.entities.push(hazard);
      if (backupDirector) {
        const pairEvery = spawnAt >= 2400 ? 3 : spawnAt >= 1200 ? 5 : Infinity;
        if ((kind === 'water' || kind === 'pothole' || kind === 'traffic') &&
            hazard.width <= balance.laneWidth && index % pairEvery === 0) {
          const secondKind: EntityKind = kind === 'water' ? 'pothole' : 'water';
          const available = laneCentres.filter(x => !blocksLane(hazard, x, vehicle));
          if (available.length >= 2) {
            const secondLane = available[(laneHash >>> 22) % available.length];
            const second = entity(secondKind, branchEntityId(w, 'hazard-pair', index), spawnAt + 4, secondLane);
            second.width = secondKind === 'water' ? 3.2 : 1.5;
            second.length = secondKind === 'water' ? 7 : 4;
            if (laneCentres.some(x => !blocksLane(hazard, x, vehicle) && !blocksLane(second, x, vehicle)) &&
                (secondKind === 'water' || leavesOpenLane(second, w.entities, distance, vehicle))) w.entities.push(second);
          }
        }
        continue;
      }
      if (windSlot) { w.pendingWind = false; w.lastWindDistance = spawnAt; }
      if (cargoSlot) { w.pendingCargo = false; w.lastCargoDistance = spawnAt; }
      const pickup = w.entities.find(e => (e.kind === 'fuel' || e.kind === 'repair') &&
        Math.abs(e.distance - spawnAt) <= 32);
      const requestedLayers = layerCount(w.branchSeed, index, spawnAt);
      let patternChoice = directorRoll(w.branchSeed, index, 0x71a4cd9f) % 4;
      if (kind === 'water') {
        const choices = [1, 3, 2, 4];
        for (let attempt = 0; attempt < choices.length && (w.recentPatternIds ?? []).includes(choices[patternChoice]); attempt++)
          patternChoice = (patternChoice + 1) % choices.length;
      }
      const edgeTriple = requestedLayers === 3 && kind === 'water' &&
        hazard.width <= balance.laneWidth && patternChoice === 2;
      if (edgeTriple) hazard.x = laneHash & 1 ? -balance.laneWidth : balance.laneWidth;
      const openLanes = laneCentres.filter(x => !blocksLane(hazard, x, vehicle));
      const extraKind: EntityKind = windSlot || cargoSlot || kind !== 'water' ? 'water' :
        patternChoice === 0 || patternChoice === 3 ? 'traffic' : patternChoice === 1 ? 'pothole' : 'water';
      const wantsExtra = spawnAt >= densityBalance.fullPatternsStart && (windSlot || cargoSlot) ||
        requestedLayers > 1;
      const canForceWater = kind === 'water' && hazard.width > balance.laneWidth &&
        forcedPatchIsAffordable({ ...hazard, width: balance.laneWidth * balance.laneCount },
          distance, fuel, durability, fuelFactor, vehicle, backupDirector ? 'backup' : undefined);
      const secondLane = windSlot ? Math.sign(hazard.lateralPush ?? 1) * balance.laneWidth : edgeTriple ? -hazard.x :
        kind === 'water' && patternChoice === 0 && openLanes.includes(balance.laneWidth) ? balance.laneWidth :
        openLanes.length ? openLanes[(laneHash >>> 22) % openLanes.length] : 0;
      const second = entity(extraKind, branchEntityId(w, 'hazard-pair', index),
        spawnAt + (windSlot ? 12 : edgeTriple ? 18 : patternChoice === 3 ? 14 :
          hazard.width > balance.laneWidth ? 0 : 6), secondLane);
      if (extraKind === 'water') { second.width = 3.2; second.length = 14; }
      if (extraKind === 'pothole') { second.width = 1.5; second.length = 4; }
      if (extraKind === 'traffic') {
        const variant = trafficSpawnKinds[directorRoll(w.branchSeed, index, 0x449729c1) % trafficSpawnKinds.length];
        second.trafficKind = variant; second.hp = trafficTypes[variant].hp;
        second.fuel = vehicles[variant].fuelCapacity; second.trafficMotion = 'powered';
        second.width = trafficTypes[variant].width; second.length = trafficTypes[variant].length;
        second.speed = secondLane < 0 ? -trafficTypes[variant].speed : trafficTypes[variant].speed;
        second.baseSpeed = second.speed;
      }
      const extraClear = (candidate: Entity) => {
        const nearest = Math.max(0, Math.round((candidate.distance - eventBalance.firstDistance) / eventBalance.gap));
        return !nearJunction(candidate.distance) &&
          Math.abs(candidate.distance - specialPlan(nearest, w.branchSeed).distance) >=
            densityBalance.specialClearance + candidate.length / 2 &&
          !w.entities.some(e => e.kind === 'shop' &&
            Math.abs(e.distance - candidate.distance) < shopBalance.clearance + candidate.length / 2);
      };
      const freeLane = windSlot || laneCentres.some(x => !blocksLane(hazard, x, vehicle) && !blocksLane(second, x, vehicle));
      const safePair = extraKind === 'water' || leavesOpenLane(second, w.entities, distance, vehicle);
      const addSecond = wantsExtra && (windSlot || openLanes.length > 0) && extraClear(second) && safePair &&
        (freeLane || kind === 'water' && canForceWater);
      let thirdEnd = -Infinity;
      if (addSecond) {
        w.entities.push(second);
        const patternId = windSlot ? 6 : cargoSlot ? 10 : pickup ? 5 :
          kind === 'water' && extraKind === 'traffic' && secondLane > 0 && patternChoice === 0 ? 1 :
            kind === 'water' && extraKind === 'pothole' || kind === 'pothole' ? 3 :
              extraKind === 'water' && kind === 'water' ? 2 : 4;
        hazard.patternId = patternId; second.patternId = patternId;
        w.recentPatternIds = [...(w.recentPatternIds ?? []).slice(-2), patternId];
        if (requestedLayers === 3 && !coversRoad(hazard) && !windSlot && !cargoSlot) {
          const third = entity(edgeTriple ? 'traffic' : 'water', branchEntityId(w, 'hazard-third', index),
            spawnAt, edgeTriple ? 0 : hazard.x);
          third.patternId = patternId;
          if (edgeTriple) {
            const variant = trafficSpawnKinds[directorRoll(w.branchSeed, index, 0x8c25f431) % trafficSpawnKinds.length];
            third.trafficKind = variant; third.hp = trafficTypes[variant].hp;
            third.fuel = vehicles[variant].fuelCapacity; third.trafficMotion = 'powered';
            third.width = trafficTypes[variant].width; third.length = trafficTypes[variant].length;
            third.speed = trafficTypes[variant].speed; third.baseSpeed = third.speed;
          } else { third.width = 3.2; third.length = 7; }
          const offsets = edgeTriple ? [9, -9, 6, -6] : [18, -14, 12, -8];
          const thirdAt = offsets.find(offset => {
            third.distance = spawnAt + offset;
            return extraClear(third) && (third.kind === 'water' || leavesOpenLane(third, w.entities, distance, vehicle));
          });
          if (thirdAt !== undefined) {
            third.distance = spawnAt + thirdAt;
            w.entities.push(third); thirdEnd = third.distance + third.length / 2;
          }
        }
      } else if (pickup && hazard.width <= balance.laneWidth) hazard.patternId = 5;
      const groupEnd = Math.max(hazard.distance + hazard.length / 2,
        addSecond ? second.distance + second.length / 2 : -Infinity, thirdEnd);
      w.lastPatternEnd = groupEnd;
      w.heavyPatternStreak = addSecond ? (w.heavyPatternStreak ?? 0) + 1 : 0;
    }
  }
  if (backupDirector) spawnSpecials();
  function spawnSpecials(): void {
  // Separate deterministic stream; defer a blocked event to a safe nearby corridor.
  if (w.nextSpecial === undefined) w.nextSpecial = 0;
  while (specialPlan(w.nextSpecial, w.branchSeed).distance <= ahead) {
    const index = w.nextSpecial, plan = specialPlan(index, w.branchSeed);
    const nearReservedHazard = (at: number) => backupDirector && Array.from({ length: 6 }, (_, n) =>
      Math.max(0, w.nextHazard - 3) + n).some(hazardIndex => {
        const wind = !!w.integrated && hazardIndex % forceBalance.integratedEveryHazards === forceBalance.integratedOffset;
        const cargo = !!w.integrated && hazardIndex % cargoBalance.integratedEveryHazards === cargoBalance.integratedOffset;
        return (wind || cargo) && Math.abs(hazardDistance(hazardIndex) - at) <=
          ((wind ? forceBalance.zoneLength : vehicles.truck.length) + (plan.kind === 'train' ? 3 : 7)) / 2 + 8;
      });
    const earliest = Math.max(plan.distance,
      distance + vehicle.maxSpeed * (backupDirector ? 1 : itemBalance.boostFactor) * eventBalance.reactionSeconds,
      (w.lastSpecialDistance ?? -1e9) + eventBalance.minimumGap);
    const firstOffset = Math.max(0, Math.ceil((earliest - plan.distance) / 40) * 40);
    const candidates = backupDirector ? [0, 40, 80, 120, 160].map(offset => plan.distance + offset) :
      Array.from({ length: 9 }, (_, n) => plan.distance + firstOffset + n * 40);
    const shifted = candidates.find(at =>
      at <= ahead && at >= distance + vehicle.maxSpeed *
        (backupDirector ? 1 : itemBalance.boostFactor) * eventBalance.reactionSeconds &&
      at - (w.lastSpecialDistance ?? -Infinity) >= eventBalance.minimumGap && !nearJunction(at) &&
      !nearReservedHazard(at) &&
      !w.entities.some(e => (e.kind === 'water' || e.kind === 'pothole' || e.kind === 'traffic') &&
        !e.consumed && Math.abs(e.distance - at) <= (e.length + (plan.kind === 'train' ? 3 : 7)) / 2 + 8) &&
      !w.entities.some(e => (e.kind === 'wind' || e.cargoReleaseAt !== undefined) &&
        Math.abs(e.distance - at) <= (e.length + (plan.kind === 'train' ? 3 : 7)) / 2 + 8) &&
      !w.entities.some(e => (e.kind === 'shop' || (e.kind === 'passenger' && e.passengerType === 'grab' && !e.consumed)) &&
        Math.abs(e.distance - at) < eventBalance.corridor) &&
      (backupDirector || Math.abs(w.nextShopDistance - at) >= eventBalance.corridor) &&
      (backupDirector || plan.kind !== 'train' || !w.entities.some(e =>
        ['water', 'pothole', 'traffic', 'wind'].includes(e.kind) && !e.consumed &&
        e.distance + e.length / 2 >= at - 62 && e.distance - e.length / 2 <= at + 12)));
    if (shifted === undefined) {
      if (backupDirector && plan.distance + 160 <= ahead) { w.nextSpecial++; continue; }
      // Keep this outcome pending. On the next chunk the search moves forward, not onto the player.
      break;
    }
    w.nextSpecial++;
    const event = entity(plan.kind, branchEntityId(w, 'event', index), shifted,
      plan.kind === 'police' || plan.kind === 'militia' || plan.kind === 'train' ? 0 : plan.x);
    const patternId = backupDirector ? undefined : plan.kind === 'jam' ? plan.variant === 'barrier' ? 7 : plan.variant === 'vendor' ? 8 : 9 :
      plan.kind === 'police' || plan.kind === 'militia' ? 11 : plan.kind === 'train' ? 14 : undefined;
    event.patternId = patternId;
    const actors = w.integrated ? movingEvent(event, index, w.branchSeed, now, plan.variant) : [event];
    if (backupDirector) for (const actor of actors) if (actor.crossingRole === 'vendor' && actor.crossMotion) {
      actor.motionWaiting = false; actor.crossingRole = undefined;
      actor.crossMotion.startedAt += Math.max(0, (actor.distance - distance) / vehicle.cruiseSpeed - 2);
    }
    w.entities.push(...actors);
    if (w.integrated && !backupDirector && plan.kind === 'train') {
      const side = directorRoll(w.branchSeed, index, 0x1fb318a5) & 1 ? 1 : -1;
      for (const [tag, offset, x] of [['before', -29, -side], ['after', 29, side]] as const) {
        const water = entity('water', branchEntityId(w, `event-pattern-${tag}`, index),
          shifted + offset, x * balance.laneWidth);
        water.width = 3.2; water.length = 24; water.patternId = 14;
        w.entities.push(water);
      }
    }
    if (w.integrated && patternId === 7) {
      const water = entity('water', branchEntityId(w, 'event-pattern', index), shifted + 2,
        event.x < 0 ? balance.laneWidth : -balance.laneWidth);
      water.width = 3.2; water.length = 14; water.patternId = patternId;
      if (forcedPatchIsAffordable({ ...water, width: balance.laneWidth * balance.laneCount },
        distance, fuel, durability, fuelFactor, vehicle, backupDirector ? 'backup' : undefined)) w.entities.push(water);
    } else if (w.integrated && patternId === 8) {
      const water = entity('water', branchEntityId(w, 'event-pattern', index), shifted + 9,
        directorRoll(w.branchSeed, index, 0x1f682aa9) % 2 ? balance.laneWidth : -balance.laneWidth);
      water.width = 3.2; water.length = 14; water.patternId = patternId;
      w.entities.push(water);
    } else if (w.integrated && patternId === 9) {
      const traffic = entity('traffic', branchEntityId(w, 'event-pattern', index), shifted + 18,
        event.x < 0 ? balance.laneWidth : -balance.laneWidth);
      traffic.trafficKind = 'motorbike'; traffic.hp = trafficTypes.motorbike.hp;
      traffic.fuel = vehicles.motorbike.fuelCapacity; traffic.trafficMotion = 'powered';
      traffic.width = trafficTypes.motorbike.width; traffic.length = trafficTypes.motorbike.length;
      traffic.speed = trafficTypes.motorbike.speed; traffic.baseSpeed = traffic.speed; traffic.patternId = patternId;
      if (leavesOpenLane(traffic, w.entities, distance, vehicle)) w.entities.push(traffic);
    } else if (w.integrated && patternId === 11) {
      const supply = w.entities.find(e => (e.kind === 'passenger' || e.kind === 'fuel' || e.kind === 'repair') &&
        Math.abs(e.distance - shifted) < 45);
      if (supply) supply.patternId = patternId;
      else {
        const passenger = entity('passenger', branchEntityId(w, 'event-pattern', index), shifted + 24,
          directorRoll(w.branchSeed, index, 0x7197c42d) % 2 ? balance.laneWidth : -balance.laneWidth);
        passenger.motionKey = `${w.branchSeed}:event:${index}`;
        passenger.patternId = patternId;
        w.entities.push(passenger);
      }
    }
    w.lastSpecialDistance = shifted;
  }
  }
  if (w.stress) fillStressWorld(w, Math.max(ahead, distance + stressBalance.lookAhead), now, distance);
  w.entities = w.entities.map(e => {
    if (!e.motionWaiting || !e.crossMotion) return e;
    const approach = e.crossingRole === 'vendor'
      ? Math.max(24, speed * 2 + vehicle.length / 2)
      : Math.max(60, speed * 2.4, speed * speed / (2 * balance.braking) + vehicle.length + 15);
    return e.distance - distance <= approach ? { ...e, motionWaiting: false, crossMotion: { ...e.crossMotion, startedAt: now } } : e;
  });
  if (w.directorVersion === 'backup') for (const car of w.entities) {
    if (car.kind !== 'traffic' || car.balanceProfile === 'backup') continue;
    car.balanceProfile = 'backup';
    car.fuel = vehicleDefinition(car.trafficKind ?? 'car4', 'backup').fuelCapacity;
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
