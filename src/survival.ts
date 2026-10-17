import { balance } from './config';
import { initialState, step, type Input, type State } from './simulation';
import { fillWorld, initialWorld, sweptContact, type EntityKind, type World } from './world';
import { captions, initialFeedbackCounts, type FeedbackKind } from './feedback';

export interface RunResult { runId: string; seed: number; config: string; reason: 'fuel' | 'damage'; distance: number; score: number; money: number; seconds: number }
export interface Run extends State {
  runId: string; seed: number; fuel: number; durability: number; score: number; money: number;
  activeSeconds: number; motion: 'powered' | 'coasting'; coastRemaining: number;
  world: World; result: RunResult | null; eventSequence: number; feedback: string; feedbackAt: number;
  feedbackKind: FeedbackKind | null; feedbackFlavor: string; feedbackCounts: Record<FeedbackKind, number>;
}
export const initialRun = (seed = 17, runId = 'simulation'): Run => ({ ...initialState(),
  runId, seed, fuel: balance.fuelCapacity, durability: balance.durabilityCapacity, score: 0,
  money: balance.initialMoney, activeSeconds: 0, motion: 'powered', coastRemaining: balance.coastDistance,
  world: fillWorld(initialWorld(seed), 0), result: null, eventSequence: 0, feedback: '', feedbackAt: -100,
  feedbackKind: null, feedbackFlavor: '', feedbackCounts: initialFeedbackCounts(),
});
export const names: Record<EntityKind, string> = { water: 'Vũng nước', pothole: 'Ổ gà', traffic: 'Xe đang chạy', fuel: 'Xăng', repair: 'Bộ sửa chữa' };

export function stepRun(before: Run, input: Input): Run {
  if (before.phase !== 'running') return before;
  const dt = balance.fixedStep;
  const driven = step(before, input);
  if (before.motion === 'coasting' || before.fuel <= 0) {
    driven.speed = Math.max(balance.coastCrawlSpeed, before.speed - (input.brake ? balance.braking : balance.coastDrag) * dt);
    driven.distance = before.distance + (before.speed + driven.speed) * .5 * dt;
  }
  const ds = driven.distance - before.distance;
  const world = fillWorld(before.world, before.distance);
  const r: Run = { ...before, world: { ...world, entities: world.entities.map(e => ({ ...e })) }, ticks: before.ticks + 1,
    x: driven.x, lateralVelocity: driven.lateralVelocity, speed: driven.speed };
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
  type Event = { t: number; index: number; type: 'enter-water' | 'exit-water' | 'hit' };
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
    } else {
      const t = e.kind === 'traffic' ? Math.max(enter, (e.lastHit + balance.trafficCooldown - before.activeSeconds) / dt) : enter;
      if (t <= exit + 1e-10) events.push({ t: Math.max(0, t), index, type: 'hit' });
    }
  }
  // Damage precedes pickups on exact ties. No later event can rescue an earlier terminal collision.
  const priority = (event: Event) => event.type === 'enter-water' ? 0 : event.type === 'exit-water' ? 1 :
    ['pothole', 'traffic'].includes(r.world.entities[event.index].kind) ? 2 : 3;
  events.sort((a, b) => a.t - b.t || priority(a) - priority(b) || a.index - b.index);
  let fraction = 0, waterCount = 0;
  const advance = (target: number) => {
    if (target <= fraction || r.phase === 'ended') return;
    let segment = target - fraction;
    if (r.motion === 'powered') {
      const cost = segment * (ds * balance.fuelPerMeter + dt * waterCount * balance.waterFuelPerSecond);
      if (cost >= r.fuel && cost > 0) {
        const poweredPart = segment * r.fuel / cost;
        r.distance += ds * poweredPart; r.score += ds * poweredPart * balance.scorePerMeter;
        r.money += ds * poweredPart * balance.moneyPerMeter; r.activeSeconds += dt * poweredPart;
        fraction += poweredPart; segment -= poweredPart;
        r.fuel = 0; r.motion = 'coasting'; r.coastRemaining = balance.coastDistance;
        r.speed = Math.min(r.speed, before.speed + (driven.speed - before.speed) * fraction);
        feedback('coast', 'Hết xăng · đang trôi. Tìm bình xăng!');
      } else r.fuel = Math.max(0, r.fuel - cost);
    }
    if (r.motion === 'coasting') {
      const travel = ds * segment;
      if (travel >= r.coastRemaining - 1e-10) {
        segment = r.coastRemaining / ds;
        r.distance += r.coastRemaining; r.score += r.coastRemaining * balance.scorePerMeter;
        r.money += r.coastRemaining * balance.moneyPerMeter; r.activeSeconds += dt * segment;
        fraction += segment; r.coastRemaining = 0; finish('fuel'); return;
      }
      r.coastRemaining = Math.max(0, r.coastRemaining - travel);
    }
    r.distance += ds * segment; r.score += ds * segment * balance.scorePerMeter;
    r.money += ds * segment * balance.moneyPerMeter; r.activeSeconds += dt * segment;
    fraction = target;
  };
  for (const event of events) {
    advance(event.t);
    if (r.phase === 'ended') break;
    const e = r.world.entities[event.index];
    if (event.type === 'enter-water') {
      waterCount++; if (!e.touching) feedback('water', 'Vũng nước · hao thêm xăng khi đi qua'); e.touching = true; continue;
    }
    if (event.type === 'exit-water') { waterCount = Math.max(0, waterCount - 1); if (event.t < 1) e.touching = false; continue; }
    if (e.kind === 'pothole' || e.kind === 'traffic') {
      const damage = e.kind === 'pothole' ? balance.potholeDamage : balance.trafficDamage;
      const loss = e.kind === 'pothole' ? Math.min(r.money, balance.potholeMoneyLoss) : 0;
      r.durability = Math.max(0, r.durability - damage); r.money -= loss; e.lastHit = r.activeSeconds;
      if (e.kind === 'pothole') e.consumed = true;
      feedback(e.kind, `${names[e.kind]} · −${damage} HP${loss ? ` · −${loss.toFixed(1)} tiền` : ''}`);
      if (r.durability === 0) finish('damage');
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
  if (r.phase === 'ended') { r.x = before.x + (driven.x - before.x) * fraction; r.lateralVelocity = 0; }
  return r;
}
