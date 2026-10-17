import { describe, expect, it } from 'vitest';
import { balance } from '../src/config';
import { noInput, type Input } from '../src/simulation';
import { initialRun, stepRun, type Run } from '../src/survival';
import { entity, fillWorld, initialWorld, sweptContact, type Entity } from '../src/world';

function empty(entities: Entity[] = []): Run {
  const r = initialRun();
  return { ...r, phase: 'running', world: { ...r.world, entities, nextHazard: 1e9, nextFuel: 1e9, nextRepair: 1e9 } };
}
function advance(run: Run, seconds: number, input: Input = noInput()): Run {
  for (let i = 0; i < Math.round(seconds * 60); i++) run = stepRun(run, input);
  return run;
}
describe('P2 survival and chronological consequences', () => {
  it('money/score/fuel follow actual travel; pause/ready/end have no side effects', () => {
    const r = advance(empty(), 10);
    expect(r.distance).toBeCloseTo(140); expect(r.score).toBeCloseTo(140);
    expect(r.money).toBeCloseTo(270); expect(r.fuel).toBeCloseTo(7.58);
    for (const phase of ['ready', 'paused', 'ended'] as const) {
      const stopped = { ...r, phase }; expect(advance(stopped, 10)).toBe(stopped);
    }
  });
  it('water burns by exact contact duration, separate from HP and distance fuel', () => {
    const r = advance(empty([entity('water', 'water', 7, 0)]), 1);
    expect(r.fuel).toBeCloseTo(8 - 14 * .003 - .8 * 9 / 14, 8);
    expect(r.durability).toBe(70); expect(r.money).toBeCloseTo(207);
  });
  it('pothole applies once, money cannot be negative; traffic has a collider cooldown', () => {
    const r = advance({ ...empty([entity('pothole', 'hole', 0, 0)]), money: 2 }, .1);
    expect(r.durability).toBe(58); expect(r.money).toBeLessThan(1);
    expect(r.eventSequence).toBe(1); expect(r.money).toBeGreaterThanOrEqual(0);
    const car = { ...entity('traffic', 'car', 0, 0), speed: 14 };
    const once = advance(empty([car]), .5); expect(once.durability).toBe(50);
    const twice = advance(once, .6); expect(twice.durability).toBe(30);
  });
  it('swept contacts catch thin obstacles crossed between endpoints, including sideways', () => {
    expect(sweptContact(0, -10, 0, 10, .5, .01)).toEqual([.4995, .5005]);
    expect(sweptContact(-5, 0, 5, 0, .5, 1)).toEqual([.45, .55]);
    expect(sweptContact(2, -10, 2, 10, .5, 1)).toBeNull();
    const thin = { ...entity('pothole', 'thin', 1.11, 0), length: .001 };
    const r = stepRun({ ...empty([thin]), speed: 20 }, { ...noInput(), accelerate: true });
    expect(r.durability).toBe(58);
  });
  it('fuel exhausts at the correct distance, coasts exactly 25m, W cannot power an empty tank', () => {
    let r = { ...empty(), fuel: .003 };
    for (let i = 0; i < 3000 && r.phase !== 'ended'; i++) r = stepRun(r, { ...noInput(), accelerate: true });
    expect(r.phase).toBe('ended'); expect(r.result?.reason).toBe('fuel'); expect(r.distance).toBeCloseTo(26, 7);
    expect(r.fuel).toBe(0); expect(r.coastRemaining).toBe(0);
    const stopped = r; expect(advance(stopped, 10)).toBe(stopped);
    const noFuel = { ...empty(), fuel: 0, speed: 8 };
    const coast = stepRun(noFuel, { ...noInput(), accelerate: true });
    expect(coast.motion).toBe('coasting'); expect(coast.speed).toBeLessThan(8);
  });
  it('a reachable fuel pickup restarts a coasting vehicle without exceeding tank', () => {
    const r = advance({ ...empty([entity('fuel', 'gas', 4, 0)]), fuel: 0, motion: 'coasting' }, .5);
    expect(r.motion).toBe('powered'); expect(r.fuel).toBeGreaterThan(7.9); expect(r.fuel).toBeLessThanOrEqual(8);
    expect(r.world.entities[0].consumed).toBe(true);
  });
  it('later repair/fuel events cannot rescue an earlier lethal collision', () => {
    const r = stepRun({ ...empty([entity('pothole', 'deadly', 1.95, 0), entity('repair', 'late', 1.6, 0)]), durability: 12, speed: 20 }, { ...noInput(), accelerate: true });
    expect(r.phase).toBe('ended'); expect(r.result?.reason).toBe('damage'); expect(r.distance).toBeCloseTo(.05);
    expect(r.world.entities[1].consumed).toBe(false); expect(r.durability).toBe(0);
    expect(r.result?.score).toBeCloseTo(.05); expect(r.distance).toBeLessThan(.333);
  });
  it('pickups apply once and clamp HP/fuel; restart discards all old entities/results', () => {
    const r = advance({ ...empty([entity('repair', 'fix', 0, 0), entity('fuel', 'gas', 0, 0)]), durability: 60, fuel: 7 }, .1);
    expect(r.durability).toBe(70); expect(r.fuel).toBeLessThanOrEqual(8); expect(r.eventSequence).toBe(2);
    const restarted = initialRun(); expect(restarted.durability).toBe(70); expect(restarted.fuel).toBe(8);
    expect(restarted.score).toBe(0); expect(restarted.money).toBe(200); expect(restarted.result).toBeNull();
  });
  it('seeded one-lane encounters and accessible supply gaps are reproducible', () => {
    expect(fillWorld(initialWorld(42), 1000)).toEqual(fillWorld(initialWorld(42), 1000));
    expect(fillWorld(initialWorld(42), 1000)).not.toEqual(fillWorld(initialWorld(17), 1000));
    const world = fillWorld(initialWorld(42), 5000);
    const fuels = world.entities.filter(e => e.kind === 'fuel');
    expect(fuels.every((e, i) => i === 0 || e.distance - fuels[i - 1].distance <= 500)).toBe(true);
    expect(world.entities.filter(e => e.kind === 'traffic').every(e => e.x === 0 && e.width < balance.laneWidth)).toBe(true);
  });
  it('flavor rotates per kind without consuming gameplay RNG or replacing numeric consequences', () => {
    let r = empty(); const flavors: string[] = []; const rng = r.world.rng;
    for (let i = 0; i < 3; i++) {
      r = stepRun({ ...r, world: { ...r.world, entities: [entity('pothole', `hole-${i}`, r.distance, 0)] } }, noInput());
      flavors.push(r.feedbackFlavor); expect(r.feedback).toContain('−12 HP'); expect(r.world.rng).toBe(rng);
    }
    expect(new Set(flavors).size).toBe(3); expect(r.durability).toBe(34);
  });
});
