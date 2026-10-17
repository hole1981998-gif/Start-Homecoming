import { balance } from './config';
import { initialState, step, type Input, type State } from './simulation';
import { fillWorld, initialWorld, sweptContact, type EntityKind, type World } from './world';
import { captions, initialFeedbackCounts, type FeedbackKind } from './feedback';

export interface RunResult { runId: string; seed: number; config: string; reason: 'fuel' | 'damage'; distance: number; score: number; money: number; seconds: number }
export interface CrashState { elapsed: number; side: -1 | 1; returningPassengers: number; lostPassengers: number }
export interface Run extends State {
  runId: string; seed: number; fuel: number; durability: number; score: number; money: number;
  activeSeconds: number; motion: 'powered' | 'coasting'; coastRemaining: number;
  world: World; result: RunResult | null; eventSequence: number; feedback: string; feedbackAt: number;
  feedbackKind: FeedbackKind | null; feedbackFlavor: string; feedbackCounts: Record<FeedbackKind, number>;
  crash: CrashState | null; recovering: boolean; passengers: number; lostPassengers: number; crashRng: number;
}
export const initialRun = (seed = 17, runId = 'simulation'): Run => ({ ...initialState(),
  runId, seed, fuel: balance.fuelCapacity, durability: balance.durabilityCapacity, score: 0,
  money: balance.initialMoney, activeSeconds: 0, motion: 'powered', coastRemaining: balance.coastDistance,
  world: fillWorld(initialWorld(seed), 0), result: null, eventSequence: 0, feedback: '', feedbackAt: -100,
  feedbackKind: null, feedbackFlavor: '', feedbackCounts: initialFeedbackCounts(),
  crash: null, recovering: false, passengers: 0, lostPassengers: 0, crashRng: (seed ^ 0x9e3779b9) >>> 0,
});
export const names: Record<EntityKind, string> = { water: 'Vũng nước', pothole: 'Ổ gà', traffic: 'Xe đang chạy', fuel: 'Xăng', repair: 'Bộ sửa chữa' };

export function stepRun(before: Run, input: Input): Run {
  if (before.phase !== 'running') return before;
  const dt = balance.fixedStep;
  if (before.crash) {
    const world = fillWorld(before.world, before.distance, before.fuel, before.durability);
    const elapsed = before.crash.elapsed + dt;
    const returned = elapsed >= balance.driverFallSeconds + balance.driverReturnSeconds;
    return { ...before, world: { ...world, entities: world.entities.map(e => ({ ...e, distance: e.distance + e.speed * dt, touching: false })) },
      ticks: before.ticks + 1, activeSeconds: before.activeSeconds + dt, speed: 0, lateralVelocity: 0,
      crash: returned ? null : { ...before.crash, elapsed }, recovering: returned && before.fuel > 0 };
  }
  const driven = before.recovering ? (() => {
    const steering = step({ ...before, speed: balance.minSpeed }, input);
    const target = input.accelerate ? balance.maxSpeed : input.brake ? before.speed : balance.cruiseSpeed;
    const rate = input.accelerate ? balance.acceleration : input.brake ? 0 : balance.returnAcceleration;
    const speed = Math.min(target, before.speed + rate * dt);
    return { ...steering, speed, distance: before.distance + (before.speed + speed) * dt / 2 };
  })() : step(before, input);
  if (before.motion === 'coasting' || before.fuel <= 0) {
    driven.speed = Math.max(balance.coastCrawlSpeed, before.speed - (input.brake ? balance.braking : balance.coastDrag) * dt);
    driven.distance = before.distance + (before.speed + driven.speed) * .5 * dt;
  }
  const ds = driven.distance - before.distance;
  const world = fillWorld(before.world, before.distance, before.fuel, before.durability);
  const r: Run = { ...before, world: { ...world, entities: world.entities.map(e => ({ ...e })) }, ticks: before.ticks + 1,
    x: driven.x, lateralVelocity: driven.lateralVelocity, speed: driven.speed,
    recovering: before.recovering && driven.speed < balance.cruiseSpeed - 1e-8 };
  // A depleted imported/test state starts coasting immediately, never receives cruise thrust.
  if (r.fuel <= 0 && r.motion === 'powered') { r.motion = 'coasting'; r.coastRemaining = balance.coastDistance; r.speed = Math.min(before.speed, driven.speed); }
  const feedback = (kind: FeedbackKind, text: string) => {
    const count = r.feedbackCounts[kind]; r.feedbackCounts = { ...r.feedbackCounts, [kind]: count + 1 };
    r.eventSequence++; r.feedbackKind = kind; r.feedback = text; r.feedbackAt = r.activeSeconds;
    r.feedbackFlavor = captions[kind][count % captions[kind].length];
  };
  const finish = (reason: RunResult['reason']) => {
    if (r.result) return;
    r.phase = 'ended'; r.speed = 0;
    r.result = { runId: r.runId, seed: r.seed, config: balance.version, reason,
      distance: r.distance, score: r.score, money: r.money, seconds: r.activeSeconds };
  };
  type Event = { t: number; index: number; type: 'enter-water' | 'exit-water' | 'enter-pothole' | 'exit-pothole' | 'hit' };
  const events: Event[] = [];
  for (let index = 0; index < r.world.entities.length; index++) {
    const e = r.world.entities[index];
    const endDistance = e.distance + e.speed * dt;
    const contact = !e.consumed && sweptContact(before.x - e.x, before.distance - e.distance,
      driven.x - e.x, driven.distance - endDistance, (balance.vehicleWidth + e.width) / 2, (balance.vehicleLength + e.length) / 2);
    e.distance = endDistance;
    if (!contact) { e.touching = false; continue; }
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
      const fuelRate = powered ? ds * balance.fuelPerMeter + dt * waterCount * balance.waterFuelPerSecond : 0;
      const damageRate = dt * potholeCount * balance.potholeDamagePerSecond;
      let segment = target - fraction;
      if (fuelRate > 0) segment = Math.min(segment, r.fuel / fuelRate);
      if (damageRate > 0) segment = Math.min(segment, r.durability / damageRate);
      if (!powered && ds > 0) segment = Math.min(segment, r.coastRemaining / ds);
      r.distance += ds * segment; r.score += ds * segment * balance.scorePerMeter;
      r.money += ds * segment * balance.moneyPerMeter; r.activeSeconds += dt * segment;
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
      r.durability = Math.max(0, r.durability - balance.trafficDamage);
      e.lastHit = r.activeSeconds;
      feedback('traffic', `${names.traffic} · −${balance.trafficDamage} HP`);
      if (r.durability === 0) finish('damage');
      else {
        let rng = r.crashRng, returning = 0;
        for (let i = 0; i < r.passengers; i++) {
          rng = (Math.imul(rng, 1664525) + 1013904223) >>> 0;
          if (rng & 0x80000000) returning++;
        }
        rng = (Math.imul(rng, 1664525) + 1013904223) >>> 0;
        const lost = r.passengers - returning;
        r.crashRng = rng; r.passengers = returning; r.lostPassengers += lost;
        r.crash = { elapsed: 0, side: (rng & 1) ? 1 : -1, returningPassengers: returning, lostPassengers: lost };
        r.speed = 0; r.recovering = false;
      }
    } else if (e.kind === 'fuel') {
      const gained = Math.min(balance.fuelPickup, balance.fuelCapacity - r.fuel);
      r.fuel += gained; r.motion = 'powered'; r.coastRemaining = balance.coastDistance; e.consumed = true;
      feedback('fuel', `Nhặt xăng · +${gained.toFixed(1)} L`);
    } else if (e.kind === 'repair') {
      const gained = Math.min(balance.repairPickup, balance.durabilityCapacity - r.durability);
      r.durability += gained; e.consumed = true; feedback('repair', `Sửa xe · +${gained.toFixed(0)} HP`);
    }
  }
  advance(1);
  if (r.phase === 'ended' || r.crash) { r.x = before.x + (driven.x - before.x) * fraction; r.lateralVelocity = 0; }
  return r;
}
