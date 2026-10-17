import { expect, it } from 'vitest';
import { balance } from '../src/config';
import { initialRun, stepRun, type Run } from '../src/survival';
import { FixedClock, type Input } from '../src/simulation';
import { warningDistance } from '../src/world';

function pilot(r: Run, strategy: 'cruise' | 'fast' | 'slow'): Input {
  const nearby = r.world.entities.filter(e => !e.consumed && e.distance + e.length / 2 - r.distance > -6 &&
    e.distance - r.distance < Math.max(80, warningDistance(r.speed, e)));
  const target = [-balance.laneWidth, 0, balance.laneWidth].map(x => {
    let cost = Math.abs(x - r.x) * .08;
    for (const e of nearby) {
      if (Math.abs(x - e.x) > (e.width + balance.vehicleWidth) / 2) continue;
      const weight = 1 / Math.max(1, (e.distance - r.distance) / 12);
      if (e.kind === 'fuel' && r.fuel < 6) cost -= 6 * weight;
      else if (e.kind === 'repair' && r.durability < 55) cost -= 5 * weight;
      else if (e.kind === 'traffic' || e.kind === 'pothole') cost += 12 * weight;
      else if (e.kind === 'water') cost += 3 * weight;
    }
    return { x, cost };
  }).sort((a, b) => a.cost - b.cost)[0].x;
  return { accelerate: strategy === 'fast', brake: strategy === 'slow', left: r.x - target > .18, right: target - r.x > .18 };
}

it('seeded survival/economy sampling across cruise, W and S strategies', () => {
  const observations: { seed: number; strategy: string; seconds: number; distance: number; hp: number; fuel: number;
    minFuel: number; secondsBelow2: number; crashes: number; money: number; end: string; affordAt: number | null;
    fuelPickups: number; maxEntities: number }[] = [];
  const affordTimes = { cruise: [] as number[], fast: [] as number[], slow: [] as number[] };
  for (const seed of [17, 42, 20261017, ...Array.from({ length: 27 }, (_, i) => 100 + i)]) for (const strategy of ['cruise', 'fast', 'slow'] as const) {
    let r = { ...initialRun(seed), phase: 'running' as Run['phase'] };
    let affordAt: number | null = null, maxEntities = 0, fuelPickups = 0, oldSequence = 0, violations = 0;
    let minFuel = r.fuel, secondsBelow2 = 0, crashes = 0;
    for (let tick = 0; tick < 60 * 600 && r.phase === 'running'; tick++) {
      const old = r;
      r = stepRun(r, pilot(r, strategy));
      if (r.money >= 800 && affordAt === null) affordAt = r.activeSeconds;
      maxEntities = Math.max(maxEntities, r.world.entities.length);
      if (r.eventSequence !== oldSequence && r.feedback.startsWith('Nhặt xăng')) fuelPickups++;
      if (!old.crash && r.crash) crashes++;
      minFuel = Math.min(minFuel, r.fuel);
      if (r.fuel < 2) secondsBelow2 += balance.fixedStep;
      oldSequence = r.eventSequence;
      if (!Number.isFinite(r.distance) || r.distance < old.distance || r.money < 0 || r.fuel < 0 || r.fuel > balance.fuelCapacity || r.durability < 0 || r.durability > 70) violations++;
    }
    expect(violations).toBe(0); expect(maxEntities).toBeLessThan(20);
    if (affordAt !== null) affordTimes[strategy].push(affordAt);
    observations.push({ seed, strategy, seconds: r.activeSeconds, distance: r.distance, hp: r.durability, fuel: r.fuel, minFuel, secondsBelow2, crashes,
      money: r.money, end: r.result?.reason ?? 'running', affordAt, fuelPickups, maxEntities });
  }
  const median = (times: number[]) => times.sort((a, b) => a - b)[Math.floor(times.length / 2)];
  expect(affordTimes.cruise).toHaveLength(30);
  expect(affordTimes.fast).toHaveLength(30);
  for (const strategy of ['cruise', 'fast'] as const) {
    expect(median(affordTimes[strategy])).toBeGreaterThanOrEqual(60);
    expect(median(affordTimes[strategy])).toBeLessThanOrEqual(90);
    expect(observations.filter(o => o.strategy === strategy && o.minFuel < 2).length).toBeGreaterThanOrEqual(24);
  }
  expect(observations.filter(o => o.strategy === 'cruise' && o.end !== 'running').length).toBeLessThanOrEqual(15);
  expect(observations.filter(o => o.strategy === 'fast' && o.end !== 'running').length).toBeLessThanOrEqual(18);
  console.log(JSON.stringify({ config: balance.version, summary: (['cruise', 'fast', 'slow'] as const).map(strategy => ({
    strategy, afforded: affordTimes[strategy].length, medianAfford: median(affordTimes[strategy]),
    deaths: observations.filter(o => o.strategy === strategy && o.end !== 'running').length,
    lowFuelRuns: observations.filter(o => o.strategy === strategy && o.minFuel < 2).length,
    noAffordSeeds: observations.filter(o => o.strategy === strategy && o.affordAt === null).map(o => o.seed),
  })) }));
}, 15000);

it('resource, collision and RNG outcomes match at 30/60/144 render FPS', () => {
  const outcomes = [30, 60, 144].map(fps => {
    const clock = new FixedClock(); let r = { ...initialRun(42), phase: 'running' as Run['phase'] };
    for (let i = 0; i < fps * 100; i++) clock.advance(1 / fps, () => { r = stepRun(r, pilot(r, 'cruise')); });
    return r;
  });
  expect(outcomes[0]).toEqual(outcomes[1]); expect(outcomes[1]).toEqual(outcomes[2]);
});
