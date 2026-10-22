import { describe, expect, it } from 'vitest';
import { balance } from '../src/config';
import { initialRun, selectTurn, stepRun, type Run } from '../src/survival';
import { noInput } from '../src/simulation';
import { canChoose, compactRoute, junction, junctionWindow, nearJunction, pathPose, updateJunctionWindow } from '../src/route';
import { entity, fillWorld, hazardDistance, initialWorld } from '../src/world';

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
  it('opens Q/E together, closes heavy vehicles earlier, and never reopens after braking', () => {
    const j = junction(17, 0), speed = 14;
    const small = junctionWindow(j, speed, 'motorcycle');
    const car7 = junctionWindow(j, speed, 'car7');
    const container = junctionWindow(j, speed, 'container');
    expect(small.openDistance).toBe(car7.openDistance);
    expect(car7.openDistance).toBe(container.openDistance);
    expect(small.closeDistance).toBeGreaterThan(car7.closeDistance);
    expect(car7.closeDistance).toBeGreaterThan(container.closeDistance);
    expect(canChoose(small.openDistance - .001, speed, j, 'motorcycle', small)).toBe(false);
    expect(canChoose(small.openDistance, speed, j, 'motorcycle', small)).toBe(true);
    expect(canChoose(small.closeDistance, speed, j, 'motorcycle', small)).toBe(false);
    const frozen = updateJunctionWindow(initialRun(17).route, j.distance - 40, speed, j, 'container');
    const closed = updateJunctionWindow(frozen, container.closeDistance, speed, j, 'container');
    expect(closed.window?.closed).toBe(true);
    expect(canChoose(container.closeDistance - 1, 8, j, 'motorcycle', closed.window)).toBe(false);
  });
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

  it('retains the old branch through the rear view, then retires its turn without moving the road', () => {
    const seed = 17, first = junction(seed, 0).distance;
    const route = { ...initialRun(seed).route, index: 1,
      history: [{ distance: first, turn: 'left' as const }] };
    expect(compactRoute(route, first + 64, seed).history).toHaveLength(1);
    const ahead = [first + 65, first + 90, junction(seed, 1).distance];
    const compacted = compactRoute(route, first + 65, seed);
    expect(compacted.history).toHaveLength(0);
    for (const distance of ahead) {
      const before = pathPose(distance, route, seed), after = pathPose(distance, compacted, seed);
      expect(after.x).toBeCloseTo(before.x, 8);
      expect(after.z).toBeCloseTo(before.z, 8);
      expect(after.heading).toBeCloseTo(before.heading, 8);
    }
  });
  it('keeps a seen straight hazard in place and gives each chosen branch a distinct hazard', () => {
    const seed = 17;
    const junctionIndex = Array.from({ length: 12 }, (_, i) => i).find(index => {
      const distance = junction(seed, index).distance;
      return Array.from({ length: 150 }, (_, hazard) => hazardDistance(hazard)).some(at =>
        at >= distance + balance.junctionClearance && at <= distance + balance.worldLookAhead - 10);
    })!;
    const crossing = junction(seed, junctionIndex), decisionDistance = crossing.distance - 10;
    // Isolate ordinary branch hazards from the independent P6 event corridor.
    const world = fillWorld({ ...initialWorld(seed), nextSpecial: 1e9 }, decisionDistance);
    const old = world.entities.find(e => e.id.startsWith('hazard-') &&
      e.distance >= crossing.distance + balance.junctionClearance)!;
    expect(old).toBeDefined();
    const base = { ...initialRun(seed), phase: 'running' as const, distance: decisionDistance,
      route: { ...initialRun(seed).route, index: junctionIndex }, world };
    const left = selectTurn(base, 'left'), right = selectTurn(base, 'right');
    for (const selected of [left, right]) {
      const preserved = selected.world.retired.find(item => item.entity.id === old.id)!;
      expect(preserved).toBeDefined();
      expect(preserved.route.choice).toBeNull();
      const newHazard = selected.world.entities.find(e => e.distance === old.distance && e.id.startsWith('hazard-'))!;
      expect(newHazard).toBeDefined();
      expect(newHazard.id).not.toBe(old.id);
      expect(newHazard.kind).not.toBe(old.kind);
      const oldPose = pathPose(old.distance, preserved.route, seed);
      const newPose = pathPose(newHazard.distance, selected.route, seed);
      expect(Math.hypot(oldPose.x - newPose.x, oldPose.z - newPose.z)).toBeGreaterThan(20);
    }
    expect(left.world.entities.find(e => e.distance === old.distance && e.id.startsWith('hazard-'))!.kind)
      .not.toBe(right.world.entities.find(e => e.distance === old.distance && e.id.startsWith('hazard-'))!.kind);
    expect(fillWorld(left.world, crossing.distance + 64).retired.some(item => item.entity.id === old.id)).toBe(true);
    expect(fillWorld(left.world, crossing.distance + 65).retired.some(item => item.entity.id === old.id)).toBe(false);
  });

  it('derives branch hazards from the chosen path, not how early Q/E was pressed', () => {
    const seed = 17, crossing = junction(seed, 1);
    const make = (distance: number) => {
      const initial = initialRun(seed);
      return selectTurn({ ...initial, phase: 'running', distance, route: { ...initial.route, index: 1 },
        world: fillWorld(initialWorld(seed), distance) }, 'left');
    };
    const early = make(crossing.distance - 18), late = make(crossing.distance - 10);
    expect(early.world.branchSeed).toBe(late.world.branchSeed);
    const oldBranch = fillWorld(early.world, crossing.distance + 50);
    const newBranch = fillWorld(late.world, crossing.distance + 50);
    expect(oldBranch.entities.filter(e => e.id.startsWith('hazard-') && e.distance > crossing.distance))
      .toEqual(newBranch.entities.filter(e => e.id.startsWith('hazard-') && e.distance > crossing.distance));
  });

  it('does not collide with traffic left on the unchosen straight branch', () => {
    const seed = 17, crossing = junction(seed, 0), initial = initialRun(seed);
    const car = entity('traffic', 'old-straight-car', crossing.distance + 4, 0); car.speed = 0;
    const run = { ...initial, phase: 'running' as const, distance: crossing.distance - 10,
      world: { ...initial.world, entities: [car], nextHazard: 1e9, nextFuel: 1e9, nextRepair: 1e9, nextPassenger: 1e9 } };
    const turned = selectTurn(run, 'left');
    expect(turned.world.retired.some(item => item.entity.id === car.id)).toBe(true);
    expect(turned.world.entities.some(e => e.id === car.id)).toBe(false);
    const after = cross(turned);
    expect(after.crash).toBeNull();
    expect(after.durability).toBe(initial.durability);
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
