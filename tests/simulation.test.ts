import { describe, expect, it } from 'vitest';
import { balance, validateConfig } from '../src/config';
import { FixedClock, initialState, noInput, step, type State } from '../src/simulation';
const running = (): State => ({ ...initialState(), phase: 'running' });
function run(s: State, seconds: number, input = noInput()): State {
  for (let i = 0; i < Math.round(seconds * 60); i++) s = step(s, input);
  return s;
}
describe('P1 gameplay and future economy invariants', () => {
  it('auto-runs; valid distance is independent of render frames at 30/60/144 Hz', () => {
    const distances: number[] = [];
    for (const fps of [30, 60, 144]) {
      let s = running(); const clock = new FixedClock();
      for (let i = 0; i < fps * 120; i++) clock.advance(1 / fps, () => { s = step(s, noInput()); });
      distances.push(s.distance); expect(s.distance).toBeCloseTo(1680, 6);
    }
    expect(Math.max(...distances) - Math.min(...distances)).toBeLessThan(1e-6);
  });
  it('accelerates to cap in 2.4 s and brakes to forward-only minimum in 1.2 s', () => {
    let s = run({ ...running(), speed: 8 }, 2.4, { ...noInput(), accelerate: true });
    expect(s.speed).toBeCloseTo(20); expect(s.distance).toBeCloseTo(33.6);
    s = run(s, 1.2, { ...noInput(), brake: true });
    expect(s.speed).toBeCloseTo(8); expect(s.distance).toBeCloseTo(50.4);
    expect(run(s, 30, { ...noInput(), brake: true }).speed).toBe(8);
  });
  it('starts/restarts at cruise, holding pedals maintains extremes, W+S prioritizes braking', () => {
    expect(initialState().speed).toBe(14);
    const s = run(running(), 10, { ...noInput(), accelerate: true });
    expect(s.speed).toBe(20);
    expect(run(s, 1.2, { ...noInput(), accelerate: true, brake: true }).speed).toBe(8);
    expect(run(running(), 10, { ...noInput(), brake: true }).speed).toBe(8);
  });
  it('returns smoothly from above/below without overshoot and integrates actual travel', () => {
    const high = { ...running(), speed: 20 };
    const low = { ...running(), speed: 8 };
    expect(run(high, .5).speed).toBeCloseTo(18);
    expect(run(low, 1).speed).toBeCloseTo(11);
    expect(run(high, 1.5).speed).toBe(14); expect(run(high, 1.5).distance).toBeCloseTo(25.5);
    expect(run(low, 2).speed).toBe(14); expect(run(low, 2).distance).toBeCloseTo(22);
    for (const start of [8, 13.99, 14, 14.01, 20]) {
      let s = { ...running(), speed: start };
      for (let i = 0; i < 600; i++) {
        const next = step(s, noInput());
        expect(Math.abs(next.speed - 14)).toBeLessThanOrEqual(Math.abs(s.speed - 14));
        expect((s.speed - 14) * (next.speed - 14)).toBeGreaterThanOrEqual(0);
        s = next;
      }
      expect(s.speed).toBe(14);
    }
  });
  it('A/D does not suspend cruise; pedal re-press overrides return immediately', () => {
    const s = run({ ...running(), speed: 20 }, .5, { ...noInput(), right: true });
    expect(s.x).toBeGreaterThan(0); expect(s.speed).toBeCloseTo(18);
    expect(step(s, { ...noInput(), accelerate: true }).speed).toBeGreaterThan(s.speed);
    expect(step(s, { ...noInput(), brake: true }).speed).toBeLessThan(s.speed);
  });
  it('return target comes from config; invalid cruise and return rates are rejected', () => {
    for (const cruiseSpeed of [9, 14, 19]) {
      const c = { ...balance, cruiseSpeed }; validateConfig(c);
      let s = { ...running(), speed: 8 };
      for (let i = 0; i < 600; i++) s = step(s, noInput(), balance.fixedStep, c);
      expect(s.speed).toBe(cruiseSpeed);
    }
    for (const changes of [{ cruiseSpeed: 7 }, { cruiseSpeed: 21 }, { cruiseSpeed: NaN }, { returnAcceleration: 0 }, { returnDeceleration: -1 }]) {
      expect(() => validateConfig({ ...balance, ...changes })).toThrow();
    }
  });
  it('mixed pedal/release/steering simulation matches at different render frame rates', () => {
    const results = [30, 60, 144].map(fps => {
      let s = running(); const clock = new FixedClock();
      for (let i = 0; i < fps * 10; i++) clock.advance(1 / fps, () => {
        const t = s.ticks / 60;
        s = step(s, { accelerate: t < 3, brake: t >= 5 && t < 7, left: false, right: t >= 7 });
      });
      return s;
    });
    expect(results[0]).toEqual(results[1]); expect(results[1]).toEqual(results[2]);
  });
  it('steers continuously, stops after release, and keeps full body inside edges', () => {
    let s = run(running(), 0.1, { ...noInput(), right: true });
    expect(s.x).toBeGreaterThan(0); expect(s.x).toBeLessThan(balance.laneWidth / 2);
    s = run(s, 1); expect(s.lateralVelocity).toBe(0);
    const stopped = s.x; s = run(s, 1); expect(s.x).toBe(stopped);
    s = run(s, 10, { ...noInput(), right: true });
    const bound = (balance.laneWidth * 3 - balance.vehicleWidth) / 2;
    expect(s.x).toBeCloseTo(bound); expect(s.lateralVelocity).toBe(0);
    s = run(s, 10, { ...noInput(), left: true }); expect(s.x).toBeCloseTo(-bound);
  });
  it('opposing steering cancels; pause/ready cannot award distance or ticks', () => {
    expect(run(running(), 10, { ...noInput(), right: true, left: true }).x).toBe(0);
    for (const phase of ['ready', 'paused'] as const) {
      for (const speed of [8, 20]) {
        const s = { ...running(), phase, speed }; expect(run(s, 100)).toBe(s);
      }
    }
  });
  it('drops stalled time; rejects invalid dt and balance; reset clears accumulated time', () => {
    const clock = new FixedClock(); let ticks = 0;
    clock.advance(60, () => ticks++); expect(ticks).toBe(6);
    clock.advance(0.008, () => ticks++); clock.reset(); clock.advance(0.009, () => ticks++); expect(ticks).toBe(6);
    expect(step(running(), noInput(), NaN).distance).toBe(0);
    expect(() => step(running(), noInput(), 1)).toThrow();
    expect(() => validateConfig({ ...balance, acceleration: -5 })).toThrow();
  });
  it('seeded 20 minute input simulation stays finite and reproducible', () => {
    const simulate = (seed: number) => {
      let s = running(); let minX = 0, maxX = 0; let random = seed;
      let input = noInput(); let violations = 0;
      for (let i = 0; i < 60 * 1200; i++) {
        if (i % 15 === 0) {
          random = (Math.imul(random, 1664525) + 1013904223) >>> 0;
          const bits = random >>> 16;
          input = { accelerate: !!(bits & 1), brake: (bits & 6) === 6, left: (bits & 24) === 24, right: (bits & 96) === 96 };
        }
        const previous = s;
        s = step(s, input);
        if (!(s.distance > previous.distance) || !Number.isFinite(s.distance) || !Number.isFinite(s.x) || s.speed < 8 || s.speed > 20) violations++;
        minX = Math.min(minX, s.x); maxX = Math.max(maxX, s.x);
      }
      expect(violations).toBe(0);
      const bound = (balance.laneWidth * 3 - balance.vehicleWidth) / 2;
      expect(minX).toBeGreaterThanOrEqual(-bound); expect(maxX).toBeLessThanOrEqual(bound);
      return s;
    };
    const results = [17, 42, 20261017].map(seed => ({ seed, result: simulate(seed) }));
    expect(simulate(42)).toEqual(results[1].result);
    console.log(JSON.stringify({ config: balance.version, durationPerSeed: '1200s', results }));
  });
});
