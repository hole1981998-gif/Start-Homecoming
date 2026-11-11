import { expect, it } from 'vitest';
import { balance, lateWorldBalance, shopBalance } from '../src/config';
import { fuelAt, nextFuelIndex, nextRepairIndex, repairAt, shopGaps } from '../src/late-clock';
import { p8EncounterDistance, p8EncounterIndexAtOrAfter } from '../src/p8-encounters';
import { initialRoute } from '../src/route';
import { specialDistance, specialIndexAtOrAfter, specialPlan } from '../src/special-events';
import { fillWorld, forkWorld, initialWorld, nextShopDistance } from '../src/world';
import { vehicles } from '../src/vehicles';

it('keeps threshold stations, changes only later gaps, and inverts each schedule at branch points', () => {
  expect(fuelAt(11)).toBe(5280);
  expect(fuelAt(12) - fuelAt(11)).toBe(lateWorldBalance.fuelGap[1]);
  expect(fuelAt(17) - fuelAt(16)).toBe(lateWorldBalance.fuelGap[2]);
  expect(repairAt(5)).toBe(5650);
  expect(repairAt(6) - repairAt(5)).toBe(lateWorldBalance.repairGap[1]);
  expect(repairAt(8) - repairAt(7)).toBe(lateWorldBalance.repairGap[2]);
  for (const distance of [0, 480, 4999, 5000, 5280, 7999, 8000, 12000]) {
    const fuel = nextFuelIndex(distance), repair = nextRepairIndex(distance);
    expect(fuelAt(fuel)).toBeGreaterThanOrEqual(distance - 1e-7);
    expect(repairAt(repair)).toBeGreaterThanOrEqual(distance - 1e-7);
    if (fuel > 1) expect(fuelAt(fuel - 1)).toBeLessThan(distance + 1e-7);
    if (repair > 0) expect(repairAt(repair - 1)).toBeLessThan(distance + 1e-7);
  }
  const normalAtFive = p8EncounterIndexAtOrAfter(5000);
  expect(p8EncounterDistance(normalAtFive)).toBeCloseTo(5006.08);
  expect(p8EncounterDistance(normalAtFive + 1) - p8EncounterDistance(normalAtFive)).toBe(19);
  const normalAtEight = p8EncounterIndexAtOrAfter(8000);
  expect(p8EncounterDistance(normalAtEight + 1) - p8EncounterDistance(normalAtEight)).toBe(18);
  expect(p8EncounterDistance(1e9)).toBeGreaterThan(1e9);
  const normalAtFifteen = p8EncounterIndexAtOrAfter(15000);
  expect(p8EncounterDistance(normalAtFifteen + 1) - p8EncounterDistance(normalAtFifteen)).toBe(16.5);
  const specialAtFifteen = specialIndexAtOrAfter(15000);
  expect(specialDistance(specialAtFifteen + 1) - specialDistance(specialAtFifteen)).toBe(280);
  for (const at of [14999, 15000, 15010, 15999, 18000]) {
    const normal = p8EncounterIndexAtOrAfter(at), special = specialIndexAtOrAfter(at);
    expect(p8EncounterDistance(normal)).toBeGreaterThanOrEqual(at);
    expect(specialDistance(special)).toBeGreaterThanOrEqual(at);
  }
});

it('preserves the first two shops, uses later gap stages, and forks without replaying supplies', () => {
  expect(nextShopDistance(280, 0, 17)).toBe(1050);
  for (const previous of [1050, 4800, 5100, 8200]) {
    const [min, max] = shopGaps(previous);
    const gap = nextShopDistance(previous, 8, 17) - previous;
    expect(gap).toBeGreaterThanOrEqual(min);
    expect(gap).toBeLessThanOrEqual(max);
  }
  expect(nextShopDistance(8200, 8, 17, true) - 8200).toBeLessThanOrEqual(shopBalance.maxGap);
  for (const split of [5200, 8150]) {
    const fork = forkWorld(initialWorld(17, true), initialRoute(), 'left', split + 8);
    expect(fuelAt(fork.nextFuel)).toBeGreaterThanOrEqual(split);
    expect(repairAt(fork.nextRepair)).toBeGreaterThanOrEqual(split);
    expect(p8EncounterDistance(fork.nextHazard)).toBeGreaterThanOrEqual(split);
    expect(specialPlan(fork.nextSpecial!, fork.branchSeed).distance).toBeGreaterThanOrEqual(split);
    expect(fork.nextSpecial).toBe(specialIndexAtOrAfter(split));
  }
  const backup = forkWorld(initialWorld(17, true, 'backup'), initialRoute(), 'left', 8208);
  expect(backup.nextFuel).toBe(Math.ceil(8200 / balance.fuelInterval));
  expect(backup.nextRepair).toBe(Math.ceil((8200 - balance.firstRepair) / balance.repairInterval));
});

it('does not stack two water bills under one late visible footprint', () => {
  let checked = 0;
  for (const seed of [1, 17, 29]) {
    let world = initialWorld(seed, true);
    for (let distance = 0; distance <= 9200; distance += 40) {
      world = fillWorld(world, distance, vehicles.car4.fuelCapacity, vehicles.car4.durabilityCapacity,
        1, vehicles.car4, distance / 16, 16);
      const water = world.entities.filter(e => e.kind === 'water' && !e.consumed &&
        e.distance >= lateWorldBalance.firstThreshold && e.id.startsWith('hazard-'));
      for (const actor of water) for (const other of world.entities) if (actor !== other && other.kind === 'water' && !other.consumed) {
        const overlapX = Math.abs(actor.x - other.x) < (actor.width + other.width) / 2 - 1e-8;
        const overlapZ = Math.abs(actor.distance - other.distance) < (actor.length + other.length) / 2 - 1e-8;
        expect(overlapX && overlapZ, `${seed} ${distance}: ${actor.id}@${actor.distance} ${other.id}@${other.distance}`).toBe(false);
        checked++;
      }
    }
  }
  expect(checked).toBeGreaterThan(0);
});

it('samples visible road and supply spacing after 5 km on deterministic seeds', () => {
  const totals = { normal5to8: 0, normal8to12: 0, longWater: 0, fuel5to8: 0, fuel8to12: 0,
    repair5to8: 0, repair8to12: 0, shop5to8: 0, shop8to12: 0, train5to12: 0,
    wetLaneSamples: 0, stackedWetSamples: 0, laneSamples: 0 };
  for (let seed = 1; seed <= 20; seed++) {
    let world = initialWorld(seed, true);
    const seen = new Map<string, { kind: string; x: number; distance: number; width: number; length: number }>();
    for (let distance = 0; distance <= 12000; distance += 40) {
      world = fillWorld(world, distance, vehicles.car4.fuelCapacity, vehicles.car4.durabilityCapacity,
        1, vehicles.car4, distance / 16, 16);
      for (const e of world.entities) if (!seen.has(e.id)) seen.set(e.id, e);
    }
    for (const [id, e] of seen) {
      if (e.distance < 5000 || e.distance >= 12000) continue;
      const firstStage = e.distance < 8000;
      if (/^hazard-\d+$/.test(id)) totals[firstStage ? 'normal5to8' : 'normal8to12']++;
      if (e.kind === 'water' && e.width >= 5.7 && e.length >= 24) totals.longWater++;
      if (e.kind === 'fuel') totals[firstStage ? 'fuel5to8' : 'fuel8to12']++;
      if (e.kind === 'repair') totals[firstStage ? 'repair5to8' : 'repair8to12']++;
      if (e.kind === 'shop') totals[firstStage ? 'shop5to8' : 'shop8to12']++;
      if (e.kind === 'train') totals.train5to12++;
    }
    const water = [...seen.values()].filter(e => e.kind === 'water');
    for (const train of [...seen.values()].filter(e => e.kind === 'train'))
      expect(water.some(e => e.width >= balance.laneWidth * balance.laneCount - .01 &&
        e.distance + e.length / 2 >= train.distance - 62 &&
        e.distance - e.length / 2 <= train.distance + 12)).toBe(false);
    for (let z = 5000; z < 12000; z += 20) for (const x of [-3.2, 0, 3.2]) {
      const wet = water.filter(e => Math.abs(e.x - x) < e.width / 2 && Math.abs(e.distance - z) < e.length / 2).length;
      totals.laneSamples++;
      if (wet) totals.wetLaneSamples++;
      if (wet > 1) totals.stackedWetSamples++;
    }
  }
  console.log(JSON.stringify({ scenario: 'generated roads from 5 to 12 km, no pilot', seeds: 20, totals }));
  expect(totals.normal5to8).toBeGreaterThan(0);
  expect(totals.normal8to12).toBeGreaterThan(totals.normal5to8);
  expect(totals.longWater).toBeGreaterThan(0);
  expect(totals.fuel5to8 / 3).toBeGreaterThan(totals.fuel8to12 / 4);
  expect(totals.train5to12).toBeGreaterThan(0);
}, 20000);
