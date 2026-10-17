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
      distances.push(s.distance); expect(s.distance).toBeCloseTo(960, 6);
    }
    expect(Math.max(...distances) - Math.min(...distances)).toBeLessThan(1e-6);
  });
  it('accelerates to cap in 2.4 s and brakes to forward-only minimum in 1.2 s', () => {
    let s = run(running(), 2.4, { ...noInput(), accelerate: true });
    expect(s.speed).toBeCloseTo(20); expect(s.distance).toBeCloseTo(33.6);
    s = run(s, 1.2, { ...noInput(), brake: true });
    expect(s.speed).toBeCloseTo(8); expect(s.distance).toBeCloseTo(50.4);
    expect(run(s, 30, { ...noInput(), brake: true }).speed).toBe(8);
  });
  it('retains speed on releasing W and prioritizes braking on W+S', () => {
    const s = run(running(), 1, { ...noInput(), accelerate: true });
    expect(run(s, 1).speed).toBe(s.speed);
    expect(run(s, 1, { ...noInput(), accelerate: true, brake: true }).speed).toBe(8);
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
      const s = { ...running(), phase }; expect(run(s, 100)).toBe(s);
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
