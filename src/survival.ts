import { environmentalPush, pushTrafficWithWind } from './environment-forces';
import { advanceCrossMotion, crossBoundaries, retireCrossers } from './cross-motion';
import { advanceInteractingTraffic } from './traffic-interactions';
import { advanceCargo, releaseCargo } from './traffic-cargo';
import { eventBalance } from './config';
import { isSpecial, trainClosed } from './special-events';
import { balance, cargoBalance, itemBalance } from './config';
import { initialState, step, type Input, type State } from './simulation';
import { advancePassengers, advanceTraffic, entity, fillWorld, forkWorld, initialWorld, passengerMotion, spawnWreckPassengers, sweptContact, trafficTypes, type EntityKind, type World } from './world';
import { captions, initialFeedbackCounts, type FeedbackKind } from './feedback';
import { canChoose, compactRoute, initialRoute, junction, type RouteState, type Turn } from './route';
import { effectiveVehicle, newVehicle, vehicleRam, vehicles, type VehicleDefinition, type VehicleInstance } from './vehicles';
import { splitCrashRiders } from './passenger-outcomes';
import { canSecretEnd, guardedSecret, initialSecret, secretLanding, secretPickup, secretTrainOverlap, secretVehicle, type SecretState } from './secret';

import { jumpHeight, hasBoost, hasStar, newPowers, powerBoundaries, type PowerItem, type Powers } from './items';

export interface RunResult { runId: string; seed: number; config: string; reason: 'fuel' | 'damage' | 'train' | 'police' | 'secret'; distance: number; score: number; money: number; seconds: number }
export interface CrashState { elapsed: number; side: -1 | 1; originDistance: number; originX: number; impactSpeed: number;
  returningRiderIds: string[]; strandedRiderIds: string[] }
export interface Run extends State {
  runId: string; seed: number; fuel: number; durability: number; score: number; money: number;
  activeSeconds: number; motion: 'powered' | 'coasting'; coastRemaining: number;
  world: World; result: RunResult | null; eventSequence: number; feedback: string; feedbackAt: number;
  feedbackKind: FeedbackKind | null; feedbackFlavor: string; feedbackCounts: Record<FeedbackKind, number>;
  crash: CrashState | null; recovering: boolean; riderIds: string[]; lostPassengers: number; crashRng: number; crashNumber: number;
  protectedEntities: string[];
  route: RouteState;
  vehicleInstances: VehicleInstance[]; activeVehicleId: string; replacementProtectedUntil: number;
  grabUses: number[]; grabSequence: number; nextGrabAt: number; grabRiderIds: string[];
  shopId: string | null; economySequence: number; inventory: Array<PowerItem | null>; powers: Powers;
  secret: SecretState;
}
export const initialRun = (seed = 17, runId = 'simulation'): Run => ({ ...initialState(),
  runId, seed, fuel: balance.fuelCapacity, durability: balance.durabilityCapacity, score: 0,
  money: balance.initialMoney, activeSeconds: 0, motion: 'powered', coastRemaining: balance.coastDistance,
  world: fillWorld(initialWorld(seed, true), 0), result: null, eventSequence: 0, feedback: '', feedbackAt: -100,
  feedbackKind: null, feedbackFlavor: '', feedbackCounts: initialFeedbackCounts(),
  crash: null, recovering: false, riderIds: [], lostPassengers: 0, crashRng: (seed ^ 0x9e3779b9) >>> 0, crashNumber: 0,
  protectedEntities: [],
  route: initialRoute(),
  vehicleInstances: [newVehicle('motorcycle', `${runId}-motorcycle`)],
  activeVehicleId: `${runId}-motorcycle`, replacementProtectedUntil: 0,
  grabUses: [0, 0], grabSequence: 0, nextGrabAt: 0, grabRiderIds: [],
  shopId: null, economySequence: 0, inventory: [null, null], powers: newPowers(), secret: initialSecret(),
});
export const names: Record<EntityKind, string> = { wind: 'Gió ngang', water: 'Vũng nước', pothole: 'Ổ gà', traffic: 'Xe đang chạy', cargo: 'Đồ rơi đang lăn', fuel: 'Xăng', repair: 'Bộ sửa chữa', passenger: 'Người cần đi nhờ', shop: 'Cửa hàng ven đường', police: 'Công an', militia: 'Dân phòng', jam: 'Kẹt xe', accident: 'Tai nạn', train: 'Tàu hoả', broken: 'Xe chết máy' };

export const activeVehicle = (run: Run): VehicleDefinition =>
  effectiveVehicle(run.vehicleInstances.find(v => v.id === run.activeVehicleId)!);
export function passengerDrive(count: number, vehicle: VehicleDefinition = vehicles.motorcycle):
  { cruiseSpeed: number; maxSpeed: number; fuelFactor: number } {
  const overload = Math.max(0, count + 1 - vehicle.capacity);
  const maxSpeed = vehicle.maxSpeed * Math.max(balance.minSpeedFactor, 1 - overload * balance.overloadSpeedPenalty);
  const cruiseSpeed = Math.min(maxSpeed, Math.max(vehicle.cruiseFloor, vehicle.cruiseSpeed - count * vehicle.cruiseLoss));
  return { cruiseSpeed, maxSpeed, fuelFactor: Math.min(balance.maxFuelLoadFactor, 1 + overload * balance.overloadFuelPenalty) };
}
function saveVehicle(run: Run): VehicleInstance[] {
  return run.vehicleInstances.map(v => v.id === run.activeVehicleId ?
    { ...v, fuel: run.fuel, durability: run.durability } : v);
}
export function switchVehicle(run: Run, targetId?: string, automatic = false): Run {
  if (run.phase !== 'running' || run.crash) return run;
  if (!automatic && run.activeSeconds < run.replacementProtectedUntil) return run;
  const stored = saveVehicle(run);
  const target = stored.find(v => v.id === (targetId ?? stored.find(v => v.id !== run.activeVehicleId)?.id));
  if (!target || target.id === run.activeVehicleId || target.disabled || target.durability <= 0 || target.fuel <= 0) return run;
  const definition = effectiveVehicle(target);
  const protectedEntities = run.world.entities.filter(e => harmful(e.kind) &&
    overlapsVehicle(run.x, run.distance, e, definition)).map(e => e.id);
  return { ...run, vehicleInstances: stored, activeVehicleId: target.id,
    secret: secretVehicle(initialSecret(), target.kind, target.id, run.riderIds.length),
    fuel: target.fuel, durability: target.durability, motion: 'powered', coastRemaining: balance.coastDistance,
    speed: Math.min(run.speed, definition.maxSpeed), recovering: true,
    replacementProtectedUntil: automatic ? run.activeSeconds + 1.5 : run.replacementProtectedUntil,
    protectedEntities: [...new Set([...run.protectedEntities, ...protectedEntities])],
    x: Math.max(-(balance.laneWidth * 3 - definition.width) / 2,
      Math.min((balance.laneWidth * 3 - definition.width) / 2, run.x)) };
}

function passengerEvent(run: Run, kind: 'passenger' | 'drop', message: string): Run {
  const count = run.feedbackCounts[kind];
  return { ...run, eventSequence: run.eventSequence + 1, feedbackKind: kind, feedback: message,
    feedbackAt: run.activeSeconds, feedbackFlavor: captions[kind][count % captions[kind].length],
    feedbackCounts: { ...run.feedbackCounts, [kind]: count + 1 } };
}

/** F is an explicit interaction, not a contact pickup. */
export function pickUpPassenger(run: Run): Run {
  if (run.phase !== 'running' || run.crash || run.riderIds.length >= balance.riderLimit) return run;
  const candidate = run.world.entities.filter(e => e.kind === 'passenger' && e.pickupable !== false && !e.consumed && e.lastHit <= run.activeSeconds &&
    Math.abs(e.distance - run.distance) <= balance.passengerReach &&
    Math.abs(e.x - run.x) <= balance.passengerLateralReach)
    .sort((a, b) => Math.abs(a.distance - run.distance) - Math.abs(b.distance - run.distance))[0];
  if (!candidate) return run;
  const riderId = candidate.riderId ?? candidate.id;
  if (run.riderIds.includes(riderId)) return run;
  const world = { ...run.world, entities: run.world.entities.map(e => e.id === candidate.id ? { ...e, consumed: true } : e) };
  const riderIds = [...run.riderIds, riderId];
  return passengerEvent({ ...run, world, riderIds, secret: secretPickup(run.secret, run.activeVehicleId, riderIds.length),
    grabRiderIds: candidate.passengerType === 'grab' ? [...run.grabRiderIds.filter(id => id !== riderId), riderId] : run.grabRiderIds },
    'passenger', candidate.passengerType === 'grab' ? 'Đón khách Grab · +1 người' : 'Đón khách · +1 người');
}

export function dropPassenger(run: Run): Run {
  if (run.phase !== 'running' || run.riderIds.length === 0 || run.crash) return run;
  const side = run.x >= 0 ? 1 : -1;
  const riderId = run.riderIds[run.riderIds.length - 1];
  const passenger = entity('passenger', `dropped-${run.runId}-${run.eventSequence}`,
    run.distance + run.speed * balance.passengerKickSeconds - 2,
    side * balance.laneWidth * 1.3);
  passenger.motionKey = `${run.seed}:dropped:${run.eventSequence}`;
  passenger.riderId = riderId;
  if (run.grabRiderIds.includes(riderId)) passenger.passengerType = 'grab';
  passenger.lastHit = run.activeSeconds + balance.passengerReboardDelaySeconds;
  passenger.passengerMotion = { ...passengerMotion(passenger, run.activeSeconds + balance.passengerKickSeconds),
    ejectedAt: run.activeSeconds, fromX: run.x, fromDistance: run.distance };
  passenger.x = run.x; passenger.distance = run.distance;
  const remaining = run.riderIds.slice(0, -1);
  const activeKind = run.vehicleInstances.find(v => v.id === run.activeVehicleId)?.kind ?? 'motorcycle';
  return passengerEvent({ ...run, riderIds: remaining,
    secret: secretVehicle(initialSecret(), activeKind, run.activeVehicleId, remaining.length), grabRiderIds: run.grabRiderIds.filter(id => id !== riderId),
    world: { ...run.world, entities: [...run.world.entities, passenger] } }, 'drop', 'Khách xuống xe · −1 người');
}

const harmful = (kind: EntityKind) => kind === 'wind' || kind === 'water' || kind === 'pothole' || kind === 'traffic' || kind === 'cargo';
function overlapsVehicle(x: number, distance: number, e: World['entities'][number], vehicle: VehicleDefinition): boolean {
  return Math.abs(x - e.x) <= (vehicle.width + e.width) / 2 &&
    Math.abs(distance - e.distance) <= (vehicle.length + e.length) / 2;
}

export function selectTurn(run: Run, turn: Turn): Run {
  const next = junction(run.seed, run.route.index);
  if (run.phase !== 'running' || run.crash || run.route.choice || !canChoose(run.distance, run.speed, next)) return run;
  const forked = forkWorld(run.world, run.route, turn, next.distance);
  return { ...run, route: { ...run.route, choice: turn },
    world: fillWorld(forked, run.distance, run.fuel, run.durability,
      passengerDrive(run.riderIds.length, activeVehicle(run)).fuelFactor, activeVehicle(run), run.activeSeconds, run.speed) };
}

export function stepRun(before: Run, input: Input): Run {
  if (before.phase !== 'running') return before;
  const trainCuts: number[] = [];
  for (const e of before.world.entities) if (e.kind === 'train' && !e.crossMotion && !e.consumed && e.eventAt !== undefined) {
    const age = before.activeSeconds - e.eventAt;
    const cycle = Math.floor(age / eventBalance.trainPeriod);
    for (const offset of [eventBalance.trainClosedSeconds, eventBalance.trainPeriod]) {
      const at = e.eventAt + cycle * eventBalance.trainPeriod + offset;
      if (at > before.activeSeconds + 1e-9 && at < before.activeSeconds + balance.fixedStep - 1e-9) trainCuts.push(at);
    }
  }
  if (before.world.experimentalMotion) trainCuts.push(...crossBoundaries(before.world.entities, before.activeSeconds, balance.fixedStep));
  if (trainCuts.length === 0 && before.activeSeconds >= before.powers.boostUntil && before.activeSeconds >= before.powers.starUntil &&
      before.activeSeconds >= before.powers.jumpAt + itemBalance.jumpSeconds) return stepRunSegment(before, input, balance.fixedStep);
  const cuts = [...new Set([...trainCuts, ...powerBoundaries(before, balance.fixedStep)])].sort((a, b) => a - b);
  if (cuts.length === 0) return stepRunSegment(before, input, balance.fixedStep);
  const end = before.activeSeconds + balance.fixedStep;
  let run = before;
  for (const boundary of [...cuts, end]) {
    if (run.phase !== 'running') break;
    const dt = boundary - run.activeSeconds;
    if (dt > 1e-10) run = stepRunSegment(run, input, dt);
  }
  return { ...run, ticks: before.ticks + 1 };
}
function splitSegment(before: Run, input: Input, dt: number, cut: number): Run {
  const first = stepRunSegment(before, input, cut);
  const elapsed = first.activeSeconds - before.activeSeconds;
  if (first.phase !== 'running') return first;
  const remaining = dt - elapsed;
  if (remaining <= 1e-10) return first;
  const next = stepRunSegment(first, input, remaining);
  return { ...next, ticks: before.ticks + 1 };
}
function stepRunSegment(before: Run, input: Input, dt: number): Run {
  const vehicle = activeVehicle(before);
  if (before.crash) {
    const world = fillWorld(before.world, before.distance, before.fuel, before.durability,
      passengerDrive(before.riderIds.length, vehicle).fuelFactor, vehicle, before.activeSeconds, before.speed);
    const elapsed = before.crash.elapsed + dt;
    const slideTime = Math.min(dt, before.speed / balance.crashSlideDeceleration);
    const speed = Math.max(0, before.speed - balance.crashSlideDeceleration * dt);
    const distance = before.distance + before.speed * slideTime - balance.crashSlideDeceleration * slideTime * slideTime / 2;
    const skidProgress = Math.min(1, elapsed / balance.driverFallSeconds);
    const x = Math.max(-balance.laneWidth * 1.5 + vehicle.width / 2,
      Math.min(balance.laneWidth * 1.5 - vehicle.width / 2,
        before.crash.originX + before.crash.side * balance.crashSkidLateralMetres * skidProgress));
    const returned = elapsed >= balance.driverFallSeconds + balance.driverPauseSeconds + balance.driverReturnSeconds && speed === 0;
    const movedEntities = world.entities.map(e => ({ ...e, touching: false }));
    for (const e of movedEntities) if (e.kind === 'train') e.eventAt ??= before.activeSeconds;
    if (world.experimentalMotion) advanceCrossMotion(movedEntities, before.activeSeconds + dt);
    pushTrafficWithWind(movedEntities, world.entities, dt);
    const npcCuts = world.experimentalTraffic ? advanceInteractingTraffic(movedEntities, world.entities, dt) : [];
    if (world.integrated && npcCuts.length) return splitSegment(before, input, dt, npcCuts[0]);
    if (!world.experimentalTraffic) advanceTraffic(movedEntities, dt);
    if (world.experimentalCargo) advanceCargo(movedEntities, dt, before.activeSeconds + dt);
    const protectedEntities = new Set(before.protectedEntities);
    for (let i = 0; i < movedEntities.length; i++) {
      const e = movedEntities[i], previousEntity = world.entities[i];
      if (!e.consumed && harmful(e.kind) && sweptContact(before.x - previousEntity.x, before.distance - previousEntity.distance,
        x - e.x, distance - e.distance, (vehicle.width + e.width) / 2, (vehicle.length + e.length) / 2)) {
        protectedEntities.add(e.id);
      }
    }
    advancePassengers(movedEntities, before.activeSeconds + dt);
    spawnWreckPassengers({ ...world, entities: movedEntities }, before.activeSeconds + dt, vehicle);
    // Falling grants damage/debuff immunity, never immunity to a train's terminal collider.
    const trainHit = movedEntities.find(e => e.kind === 'train' && !e.consumed && (e.crossMotion || trainClosed(e, before.activeSeconds + dt / 2)) &&
      sweptContact(before.x - world.entities[movedEntities.indexOf(e)].x, before.distance - e.distance, x - e.x, distance - e.distance,
        (vehicle.width + e.width) / 2, (vehicle.length + e.length) / 2));
    if (trainHit) {
      const hit = sweptContact(before.x - world.entities[movedEntities.indexOf(trainHit)].x, before.distance - trainHit.distance, x - trainHit.x, distance - trainHit.distance,
        (vehicle.width + trainHit.width) / 2, (vehicle.length + trainHit.length) / 2)![0];
      const at = before.activeSeconds + hit * dt, stop = before.distance + (distance - before.distance) * hit;
      return { ...before, phase: 'ended', speed: 0, distance: stop, activeSeconds: at,
        result: { runId: before.runId, seed: before.seed, config: before.world.prototype?.version ?? balance.version, reason: 'train', distance: stop,
          score: before.score, money: before.money, seconds: at } };
    }
    if (world.experimentalMotion) retireCrossers(movedEntities);
    if (world.experimentalCargo) releaseCargo(movedEntities, before.activeSeconds + dt, distance, world.branchSeed);
    const crashed: Run = { ...before, world: { ...world, entities: movedEntities,
      retired: world.retired.map(entry => ({ ...entry, entity: (() => { const copy = { ...entry.entity, distance: entry.entity.distance + entry.entity.speed * dt }; advanceCrossMotion([copy], before.activeSeconds + dt); return copy; })() })) },
      protectedEntities: [...protectedEntities],
      ticks: before.ticks + 1, activeSeconds: before.activeSeconds + dt, distance, x, speed, lateralVelocity: 0,
      crash: returned ? null : { ...before.crash, elapsed }, recovering: returned && before.fuel > 0,
      riderIds: returned ? before.crash.returningRiderIds : before.riderIds };
    return { ...crashed, vehicleInstances: saveVehicle(crashed) };
  }
  const baseDrive = passengerDrive(before.riderIds.length, vehicle);
  const boosted = hasBoost(before) && before.fuel > 0 && before.motion === 'powered';
  const drive = boosted ? { ...baseDrive, maxSpeed: baseDrive.maxSpeed * (boosted ? itemBalance.boostFactor : 1),
    cruiseSpeed: baseDrive.cruiseSpeed * itemBalance.boostFactor } : baseDrive;
  const driveConfig = { ...balance, minSpeed: Math.min(vehicle.minSpeed, drive.maxSpeed), cruiseSpeed: drive.cruiseSpeed,
    maxSpeed: drive.maxSpeed, vehicleWidth: vehicle.width, lateralGrip: vehicle.lateralGrip };
  const driveInput = boosted ? { ...input, accelerate: !input.brake } : input;
  const driven = before.recovering ? (() => {
    const steering = step({ ...before, speed: driveConfig.minSpeed }, driveInput, dt, driveConfig);
    const target = driveInput.accelerate ? drive.maxSpeed : driveInput.brake ? before.speed : drive.cruiseSpeed;
    const rate = driveInput.accelerate ? balance.acceleration : driveInput.brake ? 0 : balance.returnAcceleration;
    const speed = Math.min(target, before.speed + rate * dt);
    return { ...steering, speed, distance: before.distance + (before.speed + speed) * dt / 2 };
  })() : step(before, driveInput, dt, driveConfig);
  // S can stop at a crossing; after releasing it recovery smoothly returns to cruise.
  const waitingAtTrain = before.world.entities.some(e => e.kind === 'train' && !e.consumed &&
    e.distance >= before.distance && e.distance - before.distance < Math.max(60, before.speed * before.speed / (2 * balance.braking) + vehicle.length));
  if (waitingAtTrain && input.brake && before.fuel > 0) {
    driven.speed = Math.max(0, before.speed - balance.braking * dt);
    driven.distance = before.distance + (before.speed + driven.speed) * dt / 2;
  }
  if (before.motion === 'coasting' || before.fuel <= 0) {
    driven.speed = Math.max(Math.min(balance.coastCrawlSpeed, vehicle.minSpeed),
      before.speed - (input.brake ? balance.braking : balance.coastDrag) * dt);
    driven.distance = before.distance + (before.speed + driven.speed) * .5 * dt;
  }
  const push = environmentalPush(before, driven, before.world.entities, dt, vehicle.width, vehicle.length);
  driven.x = push.x;
  const ds = driven.distance - before.distance;
  const world = fillWorld(before.world, before.distance, before.fuel, before.durability, drive.fuelFactor,
    boosted ? { ...vehicle, maxSpeed: drive.maxSpeed } : vehicle, before.activeSeconds, before.speed);
  if (world.integrated && dt > 1e-6 && !hasStar(before) && world.entities.some(e => e.kind === 'traffic' &&
      !e.consumed && !e.wrecked && e.lastHit < 0 && !before.protectedEntities.includes(e.id) &&
      Math.abs(before.x-e.x) <= (vehicle.width+e.width)/2 && Math.abs(before.distance-e.distance) <= (vehicle.length+e.length)/2 &&
      jumpHeight({ ...before, activeSeconds: before.activeSeconds + 5e-8 }) <
        (['bus','truck','container'].includes(e.trafficKind ?? 'car4') ? itemBalance.highTrafficClearance : itemBalance.lowTrafficClearance) - 1e-9)) {
    return splitSegment(before,input,dt,1e-7);
  }
  const movedEntities = world.entities.map(e => ({ ...e }));
  if (world.experimentalMotion) advanceCrossMotion(movedEntities, before.activeSeconds + dt);
  pushTrafficWithWind(movedEntities, world.entities, dt);
  const npcCuts = world.experimentalTraffic ? advanceInteractingTraffic(movedEntities, world.entities, dt) : [];
  if (!world.experimentalTraffic) advanceTraffic(movedEntities, dt);
  if (world.experimentalCargo) advanceCargo(movedEntities, dt, before.activeSeconds + dt);
  if (world.integrated) {
    let cut = npcCuts[0] ?? dt;
    // Before the earliest NPC transition its trajectory is linear. Do not use its post-impact endpoint.
    if (npcCuts.length) return splitSegment(before, input, dt, cut);
    for (let i = 0; i < movedEntities.length; i++) {
      const e = movedEntities[i], old = world.entities[i];
      if (e.kind !== 'traffic' || old.wrecked || old.consumed || old.lastHit >= 0 || before.protectedEntities.includes(e.id) || hasStar(before)) continue;
      const hit = sweptContact(before.x - old.x, before.distance - old.distance, driven.x - e.x, driven.distance - e.distance,
        (vehicle.width + e.width) / 2, (vehicle.length + e.length) / 2);
      if (hit && hit[0] * dt > 1e-8) cut = Math.min(cut, hit[0] * dt);
    }
    if (cut < dt - 1e-8) return splitSegment(before, input, dt, cut);
  }
  const r: Run = { ...before, world: { ...world, entities: movedEntities,
    retired: world.retired.map(entry => ({ ...entry, entity: (() => { const copy = { ...entry.entity, distance: entry.entity.distance + entry.entity.speed * dt }; advanceCrossMotion([copy], before.activeSeconds + dt); return copy; })() })) },
    ticks: before.ticks + 1,
    x: driven.x, lateralVelocity: driven.lateralVelocity, speed: driven.speed,
    recovering: (before.recovering || (waitingAtTrain && input.brake)) && driven.speed < drive.cruiseSpeed - 1e-8 };
  r.secret = secretVehicle(guardedSecret(r.secret, r.activeVehicleId, r.riderIds.length),
    vehicle.kind, r.activeVehicleId, r.riderIds.length);
  // A depleted imported/test state starts coasting immediately, never receives cruise thrust.
  if (r.fuel <= 0 && r.motion === 'powered') { r.motion = 'coasting'; r.coastRemaining = balance.coastDistance; r.speed = Math.min(before.speed, driven.speed); }
  const feedback = (kind: FeedbackKind, text: string) => {
    const count = r.feedbackCounts[kind]; r.feedbackCounts = { ...r.feedbackCounts, [kind]: count + 1 };
    r.eventSequence++; r.feedbackKind = kind; r.feedback = text; r.feedbackAt = r.activeSeconds;
    r.feedbackFlavor = captions[kind][count % captions[kind].length];
  };
  let replacementPending = false;
  let confiscatedId: string | null = null;
  const finish = (reason: RunResult['reason']) => {
    if (r.result) return;
    r.phase = 'ended'; r.speed = 0;
    if (reason !== 'train' && reason !== 'secret' && r.vehicleInstances.some(v => v.id !== r.activeVehicleId && !v.disabled && v.fuel > 0 && v.durability > 0)) {
      replacementPending = true; return;
    }
    r.result = { runId: r.runId, seed: r.seed, config: r.world.prototype?.version ?? balance.version, reason,
      distance: r.distance, score: r.score, money: r.money, seconds: r.activeSeconds };
  };
  const crashDriver = (impactSpeed: number) => {
    const special = new Set(r.grabRiderIds);
    const { returning, stranded } = splitCrashRiders(r.riderIds, r.seed, r.crashNumber, balance.passengerReturnChance);
    const rng = (Math.imul(r.crashRng, 1664525) + 1013904223) >>> 0;
    r.grabRiderIds = returning.filter(id => special.has(id));
    r.secret = initialSecret();
    r.crashRng = rng; r.crashNumber++; r.riderIds = []; r.lostPassengers += stranded.length;
    const crashX = before.x + (driven.x - before.x) * fraction;
    const side = crashX > balance.laneWidth / 2 ? -1 : crashX < -balance.laneWidth / 2 ? 1 : (rng & 1) ? 1 : -1;
    r.crash = { elapsed: 0, side, originDistance: r.distance, originX: crashX,
      impactSpeed, returningRiderIds: returning, strandedRiderIds: stranded };
    for (let i = 0; i < stranded.length; i++) {
      const index = returning.length + i;
      const passenger = entity('passenger', `fallen-${r.runId}-${r.eventSequence}-${i}`,
        r.distance + impactSpeed * balance.driverEjectionSpeedFactor * balance.driverFallSeconds + .7 + index * .8,
        crashX + side * (1.3 + index * .45));
      passenger.pickupable = false;
      passenger.riderId = stranded[i];
      if (special.has(stranded[i])) passenger.passengerType = 'grab';
      passenger.motionKey = `${r.seed}:fallen:${r.crashNumber}:${stranded[i]}`;
      passenger.passengerMotion = { ...passengerMotion(passenger,
        r.activeSeconds + balance.passengerKickSeconds + balance.passengerDownSeconds + balance.passengerStandSeconds),
        ejectedAt: r.activeSeconds, fromX: crashX, fromDistance: r.distance, crashRecovery: true };
      passenger.x = crashX; passenger.distance = r.distance;
      r.world.entities.push(passenger);
    }
    r.speed = impactSpeed; r.recovering = false;
    r.powers = { ...r.powers, boostUntil: r.activeSeconds, jumpAt: -100 };
  };
  type Event = { t: number; index: number; type: 'enter-water' | 'exit-water' | 'enter-pothole' | 'exit-pothole' | 'hit' };
  const events: Event[] = [];
  const flightAge = before.activeSeconds - before.powers.jumpAt;
  const sampledHeight = flightAge >= 0 && flightAge < itemBalance.jumpSeconds ?
    jumpHeight({ ...before, activeSeconds: before.activeSeconds + dt / 2 }) : 0;
  for (let index = 0; index < r.world.entities.length; index++) {
    const e = r.world.entities[index];
    const endDistance = e.distance;
    if (e.stunned || e.kind === 'wind') { e.touching = false; continue; }
    if (e.kind === 'train') {
      e.eventAt ??= before.activeSeconds;
      if (!e.crossMotion && !trainClosed(e, before.activeSeconds + dt / 2)) continue;
    }
    const height = sampledHeight > 0 ? isSpecial(e.kind) ? e.kind === 'train' ? eventBalance.trainClearance : Infinity : e.kind === 'traffic' ?
      (e.trafficKind === 'bus' || e.trafficKind === 'truck' || e.trafficKind === 'container') ? itemBalance.highTrafficClearance : itemBalance.lowTrafficClearance :
      harmful(e.kind) ? itemBalance.groundClearance : itemBalance.pickupClearance : Infinity;
    const airborne = sampledHeight >= height - 1e-9;
    if (e.kind === 'train' && airborne && hasBoost(before) && !e.consumed &&
      sweptContact(before.x - world.entities[index].x, before.distance - world.entities[index].distance,
        driven.x - e.x, driven.distance - e.distance, (vehicle.width + e.width) / 2,
        (vehicle.length + e.length) / 2)) {
      r.secret = secretTrainOverlap(r.secret, e.id, e.distance, (vehicle.length + e.length) / 2);
    }
    const contact = !airborne && !e.consumed && e.kind !== 'passenger' && e.kind !== 'shop' &&
      (e.kind !== 'traffic' || !e.wrecked) &&
      (!harmful(e.kind) || before.activeSeconds >= before.replacementProtectedUntil) &&
      sweptContact(before.x - world.entities[index].x, before.distance - world.entities[index].distance,
        driven.x - e.x, driven.distance - endDistance, (vehicle.width + e.width) / 2, (vehicle.length + e.length) / 2);
    if (!contact || before.protectedEntities.includes(e.id)) { e.touching = false; continue; }
    if (isSpecial(e.kind) && e.kind !== 'train' && before.activeSeconds < before.replacementProtectedUntil) { e.consumed = true; continue; }
    const [enter, exit] = contact;
    if (e.kind === 'water') {
      events.push({ t: enter, index, type: 'enter-water' }, { t: exit, index, type: 'exit-water' });
    } else if (e.kind === 'pothole') {
      events.push({ t: enter, index, type: 'enter-pothole' }, { t: exit, index, type: 'exit-pothole' });
    } else {
      if (e.kind !== 'traffic' || e.lastHit < 0) events.push({ t: enter, index, type: 'hit' });
    }
  }
  // Damage precedes pickups on exact ties. No later event can rescue an earlier terminal collision.
  const priority = (event: Event) => r.world.entities[event.index].kind === 'train' ? -1 : event.type === 'hit' && (r.world.entities[event.index].kind === 'traffic' || r.world.entities[event.index].kind === 'cargo' || isSpecial(r.world.entities[event.index].kind)) ? 0 :
    event.type === 'enter-pothole' ? 1 : event.type === 'enter-water' ? 2 :
      event.type === 'exit-water' || event.type === 'exit-pothole' ? 3 : 4;
  events.sort((a, b) => a.t - b.t || priority(a) - priority(b) || a.index - b.index);
  let fraction = 0, waterCount = 0, potholeCount = 0;
  const advance = (target: number) => {
    while (target - fraction > 1e-12 && r.phase !== 'ended' && !r.crash) {
      const powered = r.motion === 'powered';
      const fuelRate = powered ? ds * vehicle.fuelPerMeter * drive.fuelFactor + dt * waterCount * (hasStar(r) ? 0 : balance.waterFuelPerSecond) : 0;
      const damageRate = dt * potholeCount * (hasStar(r) ? 0 : balance.potholeDamagePerSecond);
      let segment = target - fraction;
      if (fuelRate > 0) segment = Math.min(segment, r.fuel / fuelRate);
      if (damageRate > 0) segment = Math.min(segment, r.durability / damageRate);
      if (!powered && ds > 0) segment = Math.min(segment, r.coastRemaining / ds);
      r.distance += ds * segment; r.score += ds * segment * balance.scorePerMeter * (1 + r.riderIds.length * balance.riderScoreBonus);
      r.money += ds * segment * (balance.moneyPerMeter + r.riderIds.length * balance.riderMoneyPerMeter +
        (r.grabRiderIds.length ? r.grabRiderIds.filter(id => r.riderIds.includes(id)).length : 0) * balance.riderMoneyPerMeter * (itemBalance.grabMoneyMultiplier - 1)); r.activeSeconds += dt * segment;
      if (powered) r.fuel = Math.max(0, r.fuel - fuelRate * segment);
      else r.coastRemaining = Math.max(0, r.coastRemaining - ds * segment);
      r.durability = Math.max(0, r.durability - damageRate * segment);
      fraction += segment;
      if (r.durability <= 1e-10) { r.durability = 0; finish('damage'); break; }
      if (!powered && r.coastRemaining <= 1e-10) { r.coastRemaining = 0; finish('fuel'); break; }
      if (powered && r.fuel <= 1e-10) {
        r.fuel = 0; r.motion = 'coasting'; r.coastRemaining = balance.coastDistance;
        r.speed = Math.min(r.speed, before.speed + (driven.speed - before.speed) * fraction);
        feedback('coast', 'Hết xăng · đang trôi. Tìm bình xăng!');
      }
    }
  };
  for (const event of events) {
    advance(event.t);
    if (r.phase === 'ended' || r.crash) break;
    const e = r.world.entities[event.index];
    if (e.consumed || e.stunned) continue;
    if (event.type === 'enter-water') {
      waterCount++; if (!hasStar(r) && !e.touching) feedback('water', 'Vũng nước · hao thêm xăng khi đi qua'); e.touching = true; continue;
    }
    if (event.type === 'exit-water') { waterCount = Math.max(0, waterCount - 1); if (event.t < 1) e.touching = false; continue; }
    if (event.type === 'enter-pothole') {
      potholeCount++;
      if (e.lastHit < 0 && !hasStar(r)) {
        const loss = Math.min(r.money, balance.potholeMoneyLoss);
        r.durability = Math.max(0, r.durability - balance.potholeImpactDamage);
        r.money -= loss; e.lastHit = r.activeSeconds;
        feedback('pothole', `Ổ gà · −${balance.potholeImpactDamage} HP · −${balance.potholeDamagePerSecond} HP/s${loss ? ` · −${loss.toFixed(1)} tiền` : ''}`);
        if (r.durability === 0) finish('damage');
      }
      e.touching = true; continue;
    }
    if (event.type === 'exit-pothole') { potholeCount = Math.max(0, potholeCount - 1); if (event.t < 1) e.touching = false; continue; }
    if (isSpecial(e.kind)) {
      e.consumed = true;
      if (e.kind === 'train') { feedback('train', 'Va chạm tàu'); finish('train'); }
      else if (e.kind === 'police' || e.kind === 'militia') {
        if (e.groupId) for (const member of r.world.entities) if (member.groupId === e.groupId) member.consumed = true;
        const fine = e.kind === 'police' ? eventBalance.policeFine : eventBalance.militiaFine;
        const short = r.money < fine, paid = Math.min(fine, r.money);
        r.money -= paid;
        feedback(e.kind, '−' + paid.toFixed(1) + ' tiền' + (e.kind === 'police' ? ' · tịch thu xe' : ''));
        if (e.kind === 'police') {
          confiscatedId = r.activeVehicleId;
          r.vehicleInstances = saveVehicle(r).map(v => v.id === r.activeVehicleId ? { ...v, disabled: true } :
            short ? { ...v, fuel: v.fuel * eventBalance.reserveFuelFactor } : v);
          finish('police');
        }
      } else if (e.kind === 'accident') {
        if (canSecretEnd(r.secret, r.activeVehicleId, r.riderIds.length)) {
          feedback('accident', 'Đã về nhà!'); finish('secret');
        } else { r.durability = 0; feedback('accident', 'Xe hỏng · 0 HP'); finish('damage'); }
      }
      else if (e.kind === 'jam') {
        feedback('jam', 'Kẹt xe · ngã xe');
        if (!hasStar(r)) crashDriver(before.speed + (driven.speed - before.speed) * fraction);
      } else if (e.kind === 'broken') {
        const npc = entity('passenger', e.id + '-passenger', e.distance + 4, e.x < 0 ? balance.laneWidth : -balance.laneWidth);
        npc.motionKey = e.id; r.world.entities.push(npc);
        const hash = (Math.imul(r.seed ^ e.id.split('').reduce((a, c) => Math.imul(a, 31) + c.charCodeAt(0), 0), 1664525) >>> 0);
        const slot = r.inventory.indexOf(null);
        if (slot >= 0 && hash / 4294967296 < eventBalance.brokenItemChance)
          r.inventory = r.inventory.map((v, i) => i === slot ? 'banana' : v);
        feedback('broken', 'Có khách cần đi nhờ · F đón');
      }
      continue;
    }
    if (e.kind === 'cargo') {
      e.consumed = true;
      if (!hasStar(r)) {
        const damage = e.cargoType === 'barrel' ? cargoBalance.barrelDamage : cargoBalance.crateDamage;
        r.durability = Math.max(0, r.durability - damage);
        feedback('cargo', `Đồ rơi · −${damage} HP`);
        if (r.durability === 0) finish('damage');
        else if (e.cargoType === 'barrel') crashDriver(before.speed + (driven.speed - before.speed) * fraction);
      }
    } else if (e.kind === 'traffic') {
      if (canSecretEnd(r.secret, r.activeVehicleId, r.riderIds.length)) {
        feedback('traffic', 'Đã về nhà!'); finish('secret'); continue;
      }
      if (hasStar(r)) continue;
      const target = trafficTypes[e.trafficKind ?? 'car4'];
      const ram = vehicleRam[vehicle.kind];
      e.hp = Math.max(0, (e.hp ?? target.hp) - ram.damage);
      if (world.integrated) e.trafficPlayerSource = true;
      if (e.hp === 0) { e.wrecked = true; e.wreckedByPlayer = true; e.wreckAge = 0; e.speed = 0; }
      const impactDamage = ram.breaksThrough && e.wrecked ? Math.ceil(target.damage * balance.trafficHeavySelfDamageFactor) : target.damage;
      r.durability = Math.max(0, r.durability - impactDamage);
      e.lastHit = r.activeSeconds;
      feedback('traffic', `${names.traffic} · −${impactDamage} HP`);
      if (r.durability === 0) finish('damage');
      else if (!(ram.breaksThrough && e.wrecked)) crashDriver(before.speed + (driven.speed - before.speed) * fraction);
    } else if (e.kind === 'fuel') {
      const gained = Math.min(vehicle.fuelPickup, vehicle.fuelCapacity - r.fuel);
      r.fuel += gained; r.motion = 'powered'; r.coastRemaining = balance.coastDistance; e.consumed = true;
      feedback('fuel', `Nhặt xăng · +${gained.toFixed(1)} L`);
    } else if (e.kind === 'repair') {
      const gained = Math.min(vehicle.repairPickup, vehicle.durabilityCapacity - r.durability);
      r.durability += gained; e.consumed = true; feedback('repair', `Sửa xe · +${gained.toFixed(0)} HP`);
    }
  }
  advance(1);
  if (r.phase === 'running' && !r.crash) r.secret = secretLanding(r.secret, r.activeSeconds,
    r.distance, itemBalance.jumpSeconds);
  const crossing = junction(r.seed, r.route.index);
  // Barrier sits just beyond the branch point; resolve it at its visible position.
  if (r.phase === 'running' && !r.crash && before.distance < crossing.distance + 4 && r.distance >= crossing.distance + 4) {
    const choice = r.route.choice ?? 'straight';
    r.route = { ...r.route, index: r.route.index + 1, choice: null, turns: r.route.turns + Number(choice !== 'straight'),
      lastTurn: choice, turnAt: r.activeSeconds, misses: r.route.misses + Number(choice === 'straight' && crossing.blockedStraight),
      history: choice === 'straight' ? r.route.history : [...r.route.history, { distance: crossing.distance, turn: choice }] };
    if (choice === 'straight' && crossing.blockedStraight && !hasStar(r)) {
      r.durability = Math.max(0, r.durability - balance.trafficDamage);
      feedback('traffic', `Đường thẳng bị chắn · −${balance.trafficDamage} HP`);
      if (r.durability === 0) finish('damage'); else crashDriver(r.speed);
    }
  }
  if (r.phase === 'ended' || r.crash) { r.x = before.x + (driven.x - before.x) * fraction; r.lateralVelocity = 0; }
  if (!r.crash) r.protectedEntities = r.protectedEntities.filter(id => {
    const e = r.world.entities.find(entity => entity.id === id);
    return !!e && overlapsVehicle(r.x, r.distance, e, vehicle);
  });
  if (world.experimentalMotion) retireCrossers(r.world.entities);
  spawnWreckPassengers(r.world, r.activeSeconds, vehicle);
  advancePassengers(r.world.entities, r.activeSeconds);
  if (world.experimentalCargo) releaseCargo(r.world.entities, r.activeSeconds, r.distance, world.branchSeed);
  r.route = compactRoute(r.route, r.distance, r.seed);
  r.vehicleInstances = saveVehicle(r).map(v => v.id === r.activeVehicleId &&
    (r.durability <= 0 || (r.fuel <= 0 && r.coastRemaining <= 0)) ? { ...v, disabled: true } : v);
  if (replacementPending) {
    r.phase = 'running';
    const replaced = switchVehicle(r, undefined, true);
    return confiscatedId ? { ...replaced, vehicleInstances: replaced.vehicleInstances.filter(v => v.id !== confiscatedId) } : replaced;
  }
  return r;
}
