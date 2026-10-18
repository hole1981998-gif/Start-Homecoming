import { expect, it } from 'vitest';
import { balance } from '../src/config';
import { developmentScenario } from '../src/development';
import { FixedClock, noInput } from '../src/simulation';
import { initialRun, pickUpPassenger, stepRun } from '../src/survival';
import { advanceTraffic, entity, forkWorld, initialWorld, spawnWreckPassengers, trafficPassengerCount } from '../src/world';
import { initialRoute } from '../src/route';
import { vehicles } from '../src/vehicles';

it('every vehicle leaves a deterministic bounded roster once; removal of the wreck does not remove riders', () => {
  for (const kind of Object.keys(vehicles) as Array<keyof typeof vehicles>) for (let seed = 1; seed <= 30; seed++) {
    const make = () => {
      const world = initialWorld(seed), car = entity('traffic', `source-${kind}`, 50, 0);
      car.trafficKind = kind; car.width = vehicles[kind].width; car.length = vehicles[kind].length;
      car.x = (seed % 3 - 1) * balance.laneWidth; car.hp = 0; car.wrecked = true;
      world.entities.push(car); return world;
    };
    const world = make(), replay = make();
    spawnWreckPassengers(world, 1, vehicles.motorcycle);
    spawnWreckPassengers(replay, 1, vehicles.motorcycle);
    expect(world).toEqual(replay);
    const riders = world.entities.filter(e => e.kind === 'passenger');
    expect(riders).toHaveLength(trafficPassengerCount(seed, world.entities[0]));
    expect(riders.length).toBeGreaterThan(0);
    expect(riders.length).toBeLessThanOrEqual(Math.min(vehicles[kind].capacity - 1, balance.trafficPassengerLimit));
    for (let i = 0; i < 200; i++) {
      advanceTraffic(world.entities, balance.fixedStep);
      spawnWreckPassengers(world, i / 60, vehicles.motorcycle);
    }
    expect(world.entities.filter(e => e.kind === 'passenger')).toEqual(riders);
    expect(new Set(riders.map(e => e.riderId)).size).toBe(riders.length);
    expect(riders.every(npc => Math.abs(npc.x - world.entities[0].x) > (world.entities[0].width + npc.width) / 2)).toBe(true);
  }
});

it('retired branch wrecks cannot create active-branch passengers', () => {
  const world = initialWorld(17), car = entity('traffic', 'old-source', 850, 0);
  car.wrecked = true; car.hp = 0; world.entities.push(car);
  const forked = forkWorld(world, initialRoute(), 'left', 800);
  spawnWreckPassengers(forked, 0, vehicles.motorcycle);
  expect(forked.entities).toHaveLength(0);
  expect(forked.retired).toHaveLength(1);
});

it('wreck/passenger results match at 30, 60 and 144 render FPS', () => {
  const outcomes = [30, 60, 144].map(fps => {
    let run = developmentScenario(initialRun(42), 'traffic-passengers-pothole'); run.phase = 'running';
    const clock = new FixedClock();
    for (let frame = 0; frame < fps * 4; frame++) clock.advance(1 / fps, () => { run = stepRun(run, noInput()); });
    return { distance: run.distance, money: run.money, entities: run.world.entities };
  });
  expect(outcomes[1]).toEqual(outcomes[0]); expect(outcomes[2]).toEqual(outcomes[0]);
});

it('samples wreck passenger opportunities separately from automatic rewards across seeds', () => {
  const samples = [];
  for (let seed = 1; seed <= 30; seed++) {
    let run = developmentScenario(initialRun(seed), 'traffic-passengers'); run.phase = 'running';
    for (let tick = 0; tick < 240; tick++) run = stepRun(run, noInput());
    const count = run.world.entities.filter(e => e.kind === 'passenger').length;
    expect(count).toBeGreaterThan(0); expect(count).toBeLessThanOrEqual(3);
    expect(run.riderIds).toHaveLength(0);
    samples.push(count);
  }
  console.log(JSON.stringify({ config: balance.version, seeds: 30, source: 'bus-ram-car4',
    generated: samples.reduce((sum, value) => sum + value, 0), min: Math.min(...samples), max: Math.max(...samples),
    autoBoarded: 0, instantReward: 0 }));
});

it('blocked exits defer spawning until a safe side opens, without consuming hazard RNG', () => {
  const world = initialWorld(17), car = entity('traffic', 'source', 50, 0);
  car.hp = 0; car.wrecked = true;
  const hole = entity('pothole', 'full-road', 50, 0); hole.width = 9.6; hole.length = 30;
  world.entities.push(car, hole);
  spawnWreckPassengers(world, 0, vehicles.bus);
  expect(world.entities.filter(e => e.kind === 'passenger')).toHaveLength(0);
  expect(car.wreckPassengersSpawned).not.toBe(true);
  hole.consumed = true;
  spawnWreckPassengers(world, 1, vehicles.bus);
  expect(car.wreckPassengersSpawned).toBe(true);
  expect(world.entities.some(e => e.kind === 'passenger')).toBe(true);
  expect(world.rng).toBe(17);
});

it('ram victims refuse F permanently while pothole victims accept; neither grants instant rewards', () => {
  for (const scenario of ['traffic-passengers', 'traffic-passengers-pothole']) {
    let run = developmentScenario(initialRun(17), scenario); run.phase = 'running';
    for (let tick = 0; tick < 360 && !run.world.entities.some(e => e.kind === 'passenger'); tick++) run = stepRun(run, noInput());
    const npc = run.world.entities.find(e => e.kind === 'passenger')!;
    expect(npc).toBeDefined(); expect(run.riderIds).toHaveLength(0);
    expect(run.money).toBeCloseTo(balance.initialMoney + run.distance * balance.moneyPerMeter);
    expect(run.score).toBeCloseTo(run.distance * balance.scorePerMeter);
    const at = { ...run, crash: null, x: npc.x, distance: npc.distance };
    const picked = pickUpPassenger(at);
    if (scenario === 'traffic-passengers') {
      expect(run.world.entities.find(e => e.kind === 'traffic')?.wreckedByPlayer).toBe(true);
      expect(run.world.entities.filter(e => e.kind === 'passenger').every(e => e.pickupable === false)).toBe(true);
      expect(picked.riderIds).toHaveLength(0);
      let later: typeof run = { ...at, fuel: 0, motion: 'coasting', coastRemaining: 25, speed: 0 };
      for (let i = 0; i < 240; i++) later = stepRun(later, noInput());
      const stranded = later.world.entities.find(e => e.id === npc.id);
      // Retest F after the wreck expires, keeping the NPC within the data window.
      expect(stranded).toBeDefined();
      expect(stranded!.pickupable).toBe(false);
      expect(later.world.entities.find(e => e.kind === 'traffic')?.consumed).toBe(true);
      expect(pickUpPassenger({ ...later, x: stranded!.x, distance: stranded!.distance }).riderIds).toHaveLength(0);
      continue;
    }
    expect(npc.pickupable).toBe(true);
    expect(picked.riderIds).toEqual([npc.riderId]);
    expect(picked.money).toBe(at.money); expect(picked.score).toBe(at.score);
    const othersGone = { ...picked, world: { ...picked.world, entities: picked.world.entities.filter(e => e.id === npc.id) } };
    expect(pickUpPassenger(othersGone).riderIds).toEqual(picked.riderIds);
    expect(initialRun(17).world.entities.some(e => e.id === npc.id)).toBe(false);
  }
});
