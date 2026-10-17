import { balance } from './config';
import { initialState, step, type Input, type State } from './simulation';
import { advancePassengers, advanceTraffic, entity, fillWorld, forkWorld, initialWorld, passengerMotion, spawnWreckPassengers, sweptContact, trafficTypes, type EntityKind, type World } from './world';
import { captions, initialFeedbackCounts, type FeedbackKind } from './feedback';
import { canChoose, compactRoute, initialRoute, junction, type RouteState, type Turn } from './route';
import { newVehicle, vehicleRam, vehicles, type VehicleDefinition, type VehicleInstance } from './vehicles';
import { splitCrashRiders } from './passenger-outcomes';

export interface RunResult { runId: string; seed: number; config: string; reason: 'fuel' | 'damage'; distance: number; score: number; money: number; seconds: number }
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
}
export const initialRun = (seed = 17, runId = 'simulation'): Run => ({ ...initialState(),
  runId, seed, fuel: balance.fuelCapacity, durability: balance.durabilityCapacity, score: 0,
  money: balance.initialMoney, activeSeconds: 0, motion: 'powered', coastRemaining: balance.coastDistance,
  world: fillWorld(initialWorld(seed), 0), result: null, eventSequence: 0, feedback: '', feedbackAt: -100,
  feedbackKind: null, feedbackFlavor: '', feedbackCounts: initialFeedbackCounts(),
  crash: null, recovering: false, riderIds: [], lostPassengers: 0, crashRng: (seed ^ 0x9e3779b9) >>> 0, crashNumber: 0,
  protectedEntities: [],
  route: initialRoute(),
  vehicleInstances: [newVehicle('motorcycle', `${runId}-motorcycle`)],
  activeVehicleId: `${runId}-motorcycle`, replacementProtectedUntil: 0,
});
export const names: Record<EntityKind, string> = { water: 'Vũng nước', pothole: 'Ổ gà', traffic: 'Xe đang chạy', fuel: 'Xăng', repair: 'Bộ sửa chữa', passenger: 'Người cần đi nhờ' };

export const activeVehicle = (run: Run): VehicleDefinition =>
  vehicles[run.vehicleInstances.find(v => v.id === run.activeVehicleId)!.kind];
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
  const definition = vehicles[target.kind];
  const protectedEntities = run.world.entities.filter(e => harmful(e.kind) &&
    overlapsVehicle(run.x, run.distance, e, definition)).map(e => e.id);
  return { ...run, vehicleInstances: stored, activeVehicleId: target.id,
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
  return passengerEvent({ ...run, world, riderIds: [...run.riderIds, riderId] }, 'passenger', 'Đón khách · +1 người');
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
  passenger.lastHit = run.activeSeconds + balance.passengerReboardDelaySeconds;
  passenger.passengerMotion = { ...passengerMotion(passenger, run.activeSeconds + balance.passengerKickSeconds),
    ejectedAt: run.activeSeconds, fromX: run.x, fromDistance: run.distance };
  passenger.x = run.x; passenger.distance = run.distance;
  return passengerEvent({ ...run, riderIds: run.riderIds.slice(0, -1),
    world: { ...run.world, entities: [...run.world.entities, passenger] } }, 'drop', 'Khách xuống xe · −1 người');
}

const harmful = (kind: EntityKind) => kind === 'water' || kind === 'pothole' || kind === 'traffic';
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
      passengerDrive(run.riderIds.length, activeVehicle(run)).fuelFactor, activeVehicle(run)) };
}

export function stepRun(before: Run, input: Input): Run {
  if (before.phase !== 'running') return before;
  const dt = balance.fixedStep;
  const vehicle = activeVehicle(before);
  if (before.crash) {
    const world = fillWorld(before.world, before.distance, before.fuel, before.durability,
      passengerDrive(before.riderIds.length, vehicle).fuelFactor, vehicle);
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
    advanceTraffic(movedEntities, dt);
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
    const crashed: Run = { ...before, world: { ...world, entities: movedEntities,
      retired: world.retired.map(entry => ({ ...entry, entity: { ...entry.entity, distance: entry.entity.distance + entry.entity.speed * dt } })) },
      protectedEntities: [...protectedEntities],
      ticks: before.ticks + 1, activeSeconds: before.activeSeconds + dt, distance, x, speed, lateralVelocity: 0,
      crash: returned ? null : { ...before.crash, elapsed }, recovering: returned && before.fuel > 0,
      riderIds: returned ? before.crash.returningRiderIds : before.riderIds };
    return { ...crashed, vehicleInstances: saveVehicle(crashed) };
  }
  const drive = passengerDrive(before.riderIds.length, vehicle);
  const driveConfig = { ...balance, minSpeed: Math.min(vehicle.minSpeed, drive.maxSpeed), cruiseSpeed: drive.cruiseSpeed,
    maxSpeed: drive.maxSpeed, vehicleWidth: vehicle.width };
  const driven = before.recovering ? (() => {
    const steering = step({ ...before, speed: driveConfig.minSpeed }, input, dt, driveConfig);
    const target = input.accelerate ? drive.maxSpeed : input.brake ? before.speed : drive.cruiseSpeed;
    const rate = input.accelerate ? balance.acceleration : input.brake ? 0 : balance.returnAcceleration;
    const speed = Math.min(target, before.speed + rate * dt);
    return { ...steering, speed, distance: before.distance + (before.speed + speed) * dt / 2 };
  })() : step(before, input, dt, driveConfig);
  if (before.motion === 'coasting' || before.fuel <= 0) {
    driven.speed = Math.max(Math.min(balance.coastCrawlSpeed, vehicle.minSpeed),
      before.speed - (input.brake ? balance.braking : balance.coastDrag) * dt);
    driven.distance = before.distance + (before.speed + driven.speed) * .5 * dt;
  }
  const ds = driven.distance - before.distance;
  const world = fillWorld(before.world, before.distance, before.fuel, before.durability, drive.fuelFactor, vehicle);
  const movedEntities = world.entities.map(e => ({ ...e }));
  advanceTraffic(movedEntities, dt);
  const r: Run = { ...before, world: { ...world, entities: movedEntities,
    retired: world.retired.map(entry => ({ ...entry, entity: { ...entry.entity, distance: entry.entity.distance + entry.entity.speed * dt } })) },
    ticks: before.ticks + 1,
    x: driven.x, lateralVelocity: driven.lateralVelocity, speed: driven.speed,
    recovering: before.recovering && driven.speed < drive.cruiseSpeed - 1e-8 };
  // A depleted imported/test state starts coasting immediately, never receives cruise thrust.
  if (r.fuel <= 0 && r.motion === 'powered') { r.motion = 'coasting'; r.coastRemaining = balance.coastDistance; r.speed = Math.min(before.speed, driven.speed); }
  const feedback = (kind: FeedbackKind, text: string) => {
    const count = r.feedbackCounts[kind]; r.feedbackCounts = { ...r.feedbackCounts, [kind]: count + 1 };
    r.eventSequence++; r.feedbackKind = kind; r.feedback = text; r.feedbackAt = r.activeSeconds;
    r.feedbackFlavor = captions[kind][count % captions[kind].length];
  };
  let replacementPending = false;
  const finish = (reason: RunResult['reason']) => {
    if (r.result) return;
    r.phase = 'ended'; r.speed = 0;
    if (r.vehicleInstances.some(v => v.id !== r.activeVehicleId && !v.disabled && v.fuel > 0 && v.durability > 0)) {
      replacementPending = true; return;
    }
    r.result = { runId: r.runId, seed: r.seed, config: balance.version, reason,
      distance: r.distance, score: r.score, money: r.money, seconds: r.activeSeconds };
  };
  const crashDriver = (impactSpeed: number) => {
    const { returning, stranded } = splitCrashRiders(r.riderIds, r.seed, r.crashNumber, balance.passengerReturnChance);
    const rng = (Math.imul(r.crashRng, 1664525) + 1013904223) >>> 0;
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
      passenger.motionKey = `${r.seed}:fallen:${r.crashNumber}:${stranded[i]}`;
      passenger.passengerMotion = { ...passengerMotion(passenger,
        r.activeSeconds + balance.passengerKickSeconds + balance.passengerDownSeconds + balance.passengerStandSeconds),
        ejectedAt: r.activeSeconds, fromX: crashX, fromDistance: r.distance, crashRecovery: true };
      passenger.x = crashX; passenger.distance = r.distance;
      r.world.entities.push(passenger);
    }
    r.speed = impactSpeed; r.recovering = false;
  };
  type Event = { t: number; index: number; type: 'enter-water' | 'exit-water' | 'enter-pothole' | 'exit-pothole' | 'hit' };
  const events: Event[] = [];
  for (let index = 0; index < r.world.entities.length; index++) {
    const e = r.world.entities[index];
    const endDistance = e.distance;
    const contact = !e.consumed && e.kind !== 'passenger' &&
      (e.kind !== 'traffic' || !e.wrecked) &&
      (!harmful(e.kind) || before.activeSeconds >= before.replacementProtectedUntil) &&
      sweptContact(before.x - e.x, before.distance - world.entities[index].distance,
        driven.x - e.x, driven.distance - endDistance, (vehicle.width + e.width) / 2, (vehicle.length + e.length) / 2);
    if (!contact || before.protectedEntities.includes(e.id)) { e.touching = false; continue; }
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
  const priority = (event: Event) => event.type === 'hit' && r.world.entities[event.index].kind === 'traffic' ? 0 :
    event.type === 'enter-pothole' ? 1 : event.type === 'enter-water' ? 2 :
      event.type === 'exit-water' || event.type === 'exit-pothole' ? 3 : 4;
  events.sort((a, b) => a.t - b.t || priority(a) - priority(b) || a.index - b.index);
  let fraction = 0, waterCount = 0, potholeCount = 0;
  const advance = (target: number) => {
    while (target - fraction > 1e-12 && r.phase !== 'ended' && !r.crash) {
      const powered = r.motion === 'powered';
      const fuelRate = powered ? ds * vehicle.fuelPerMeter * drive.fuelFactor + dt * waterCount * balance.waterFuelPerSecond : 0;
      const damageRate = dt * potholeCount * balance.potholeDamagePerSecond;
      let segment = target - fraction;
      if (fuelRate > 0) segment = Math.min(segment, r.fuel / fuelRate);
      if (damageRate > 0) segment = Math.min(segment, r.durability / damageRate);
      if (!powered && ds > 0) segment = Math.min(segment, r.coastRemaining / ds);
      r.distance += ds * segment; r.score += ds * segment * balance.scorePerMeter * (1 + r.riderIds.length * balance.riderScoreBonus);
      r.money += ds * segment * (balance.moneyPerMeter + r.riderIds.length * balance.riderMoneyPerMeter); r.activeSeconds += dt * segment;
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
    if (event.type === 'enter-water') {
      waterCount++; if (!e.touching) feedback('water', 'Vũng nước · hao thêm xăng khi đi qua'); e.touching = true; continue;
    }
    if (event.type === 'exit-water') { waterCount = Math.max(0, waterCount - 1); if (event.t < 1) e.touching = false; continue; }
    if (event.type === 'enter-pothole') {
      potholeCount++;
      if (e.lastHit < 0) {
        const loss = Math.min(r.money, balance.potholeMoneyLoss);
        r.durability = Math.max(0, r.durability - balance.potholeImpactDamage);
        r.money -= loss; e.lastHit = r.activeSeconds;
        feedback('pothole', `Ổ gà · −${balance.potholeImpactDamage} HP · −${balance.potholeDamagePerSecond} HP/s${loss ? ` · −${loss.toFixed(1)} tiền` : ''}`);
        if (r.durability === 0) finish('damage');
      }
      e.touching = true; continue;
    }
    if (event.type === 'exit-pothole') { potholeCount = Math.max(0, potholeCount - 1); if (event.t < 1) e.touching = false; continue; }
    if (e.kind === 'traffic') {
      const target = trafficTypes[e.trafficKind ?? 'car4'];
      const ram = vehicleRam[vehicle.kind];
      e.hp = Math.max(0, (e.hp ?? target.hp) - ram.damage);
      if (e.hp === 0) { e.wrecked = true; e.wreckAge = 0; e.speed = 0; }
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
  const crossing = junction(r.seed, r.route.index);
  // Barrier sits just beyond the branch point; resolve it at its visible position.
  if (r.phase === 'running' && !r.crash && before.distance < crossing.distance + 4 && r.distance >= crossing.distance + 4) {
    const choice = r.route.choice ?? 'straight';
    r.route = { ...r.route, index: r.route.index + 1, choice: null, turns: r.route.turns + Number(choice !== 'straight'),
      lastTurn: choice, turnAt: r.activeSeconds, misses: r.route.misses + Number(choice === 'straight' && crossing.blockedStraight),
      history: choice === 'straight' ? r.route.history : [...r.route.history, { distance: crossing.distance, turn: choice }] };
    if (choice === 'straight' && crossing.blockedStraight) {
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
  spawnWreckPassengers(r.world, r.activeSeconds, vehicle);
  advancePassengers(r.world.entities, r.activeSeconds);
  r.route = compactRoute(r.route, r.distance, r.seed);
  r.vehicleInstances = saveVehicle(r).map(v => v.id === r.activeVehicleId &&
    (r.durability <= 0 || (r.fuel <= 0 && r.coastRemaining <= 0)) ? { ...v, disabled: true } : v);
  if (replacementPending) { r.phase = 'running'; return switchVehicle(r, undefined, true); }
  return r;
}
