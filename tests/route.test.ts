import { describe, expect, it } from 'vitest';
import { balance } from '../src/config';
import { initialRun, selectTurn, stepRun, type Run } from '../src/survival';
import { noInput } from '../src/simulation';
import { canChoose, junction, nearJunction, pathPose } from '../src/route';
import { hazardDistance } from '../src/world';

function atJunction(index: number, seed = 17): Run {
  const j = junction(seed, index);
  const r = initialRun(seed);
  return { ...r, phase: 'running', distance: j.distance - 10,
    route: { ...r.route, index }, world: { ...r.world, entities: [], nextHazard: 1e9, nextFuel: 1e9, nextRepair: 1e9 } };
}
function cross(r: Run): Run {
  const target = junction(r.seed, r.route.index).distance + 4;
  for (let i = 0; i < 120 && r.phase === 'running' && r.distance < target; i++) r = stepRun(r, noInput());
  return r;
}

describe('P3B junction decisions', () => {
  it('allows one Q/E decision only inside the QTE window and advances one route', () => {
    const r = atJunction(0);
    const j = junction(r.seed, 0);
    expect(selectTurn({ ...r, distance: j.distance - 100 }, 'left').route.choice).toBeNull();
    expect(canChoose(r.distance, r.speed, j)).toBe(true);
    const chosen = selectTurn(r, 'left');
    expect(selectTurn(chosen, 'right').route.choice).toBe('left');
    const after = cross(chosen);
    expect(after.route).toMatchObject({ index: 1, choice: null, turns: 1, lastTurn: 'left', misses: 0 });
    expect(after.world.rng).not.toBe(cross(selectTurn(r, 'right')).world.rng);
    expect(stepRun(after, noInput()).route.index).toBe(1);
  });

  it('takes the straight path on an open junction; a blocked straight causes one real crash', () => {
    const open = cross(atJunction(0));
    expect(open.crash).toBeNull(); expect(open.route.lastTurn).toBe('straight');
    const blockedIndex = Array.from({ length: 20 }, (_, i) => i + 1).find(i => junction(17, i).blockedStraight)!;
    const before = atJunction(blockedIndex);
    const hit = cross(before);
    expect(hit.route.misses).toBe(1);
    expect(hit.durability).toBe(balance.durabilityCapacity - balance.trafficDamage);
    expect(hit.crash).not.toBeNull();
    expect(stepRun(hit, noInput()).route.misses).toBe(1);
    const safe = cross(selectTurn(before, 'right'));
    expect(safe.crash).toBeNull(); expect(safe.route.misses).toBe(0);
  });

  it('keeps decision corridors clear and ramps hazard spacing without dropping below its floor', () => {
    expect(nearJunction(balance.firstJunction)).toBe(true);
    expect(hazardDistance(1) - hazardDistance(0)).toBeCloseTo(balance.hazardGap);
    for (let i = 1; i < 300; i++) {
      const gap = hazardDistance(i) - hazardDistance(i - 1);
      expect(gap).toBeGreaterThanOrEqual(balance.hazardGapMin - 1e-8);
    }
    expect(hazardDistance(299) - hazardDistance(298)).toBeCloseTo(balance.hazardGapMin);
  });

  it('keeps the rendered route continuous while a selected turn becomes route history', () => {
    const r = atJunction(0), chosen = selectTurn(r, 'left');
    const j = junction(r.seed, 0);
    const before = pathPose(j.distance, chosen.route, r.seed);
    expect(before.heading).toBeCloseTo(-Math.PI / 4);
    const after = cross(chosen);
    const carried = pathPose(j.distance, after.route, r.seed);
    expect(carried.x).toBeCloseTo(before.x, 8);
    expect(carried.z).toBeCloseTo(before.z, 8);
    expect(pathPose(j.distance + 8, after.route, r.seed).heading).toBeCloseTo(-Math.PI / 2);
    expect(pathPose(j.distance + 8, cross(selectTurn(r, 'right')).route, r.seed).heading).toBeCloseTo(Math.PI / 2);
  });

  it('seeded QTE sampling separates a missed blocked route from a timely turn', () => {
    let blocked = 0, avoided = 0;
    for (let seed = 100; seed < 130; seed++) {
      const index = Array.from({ length: 12 }, (_, i) => i + 1).find(i => junction(seed, i).blockedStraight)!;
      const start = atJunction(index, seed);
      const missed = cross(start), steered = cross(selectTurn(start, seed % 2 ? 'left' : 'right'));
      blocked += Number(missed.crash !== null && missed.route.misses === 1);
      avoided += Number(steered.crash === null && steered.route.misses === 0);
    }
    expect(blocked).toBe(30); expect(avoided).toBe(30);
    console.log(JSON.stringify({ config: balance.version, seeds: 30, blockedMisses: blocked, timelyTurnsAvoided: avoided }));
  });
});
