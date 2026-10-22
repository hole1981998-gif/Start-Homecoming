import { expect, it } from 'vitest';
import { balance } from '../src/config';
import { specialPlan } from '../src/special-events';
import { fillWorld, hazardDistance, initialWorld } from '../src/world';
import { developmentScenario } from '../src/development';
import { initialRun } from '../src/survival';

it('samples planned and spawned special coverage on 100 deterministic 3 km roads', () => {
  const variants = ['barrier', 'vendor', 'ambulance'] as const;
  const roadsWithVariant = Object.fromEntries(variants.map(kind => [kind, 0])) as Record<typeof variants[number], number>;
  let spawned = 0, planned = 0, pairs = 0, triples = 0, normal = 0, water = 0, wideLongWater = 0;
  const layerDistribution = [0, 0, 0];
  const patterns = new Set<number>();
  for (let seed = 1; seed <= 100; seed++) {
    const outcomes = new Set(variants.map(kind => kind));
    let world = initialWorld(seed, true);
    const seen = new Set<string>(), seenHazards = new Set<string>();
    const groupLayers = new Map<string, { distance: number; layers: number }>();
    for (let distance = 0; distance <= 3000; distance += 30) {
      world = fillWorld(world, distance, balance.fuelCapacity, balance.durabilityCapacity);
      for (const e of world.entities) if (e.id.startsWith('event-') && !e.id.startsWith('event-pattern-')) {
        seen.add(e.groupId ?? e.id);
        if (e.patternId) patterns.add(e.patternId);
        if (e.displayName === 'Rào sửa đường') outcomes.delete('barrier');
        if (e.displayName === 'Hàng rong băng đường') outcomes.delete('vendor');
        if (e.serviceRole === 'ambulance') outcomes.delete('ambulance');
      }
      for (const e of world.entities) if ((e.id.startsWith('hazard-') || e.id.startsWith('event-pattern-')) && !seenHazards.has(e.id)) {
        seenHazards.add(e.id);
        if (e.id.startsWith('hazard-')) {
          const key = e.id.replace(/^hazard-(pair-|third-)?/, 'hazard-');
          const group = groupLayers.get(key) ?? { distance: e.distance, layers: 0 };
          group.layers++; groupLayers.set(key, group);
        }
        if (e.id.startsWith('hazard-pair-')) pairs++;
        else if (e.id.startsWith('hazard-third-')) triples++;
        else if (e.id.startsWith('hazard-')) normal++;
        if (e.kind === 'water') { water++; if (e.width >= 5.7 && e.length >= 20) wideLongWater++; }
        if (e.patternId) patterns.add(e.patternId);
      }
    }
    spawned += seen.size;
    planned += Array.from({ length: 7 }, (_, index) => specialPlan(index, seed)).filter(plan => plan.distance <= 3000).length;
    for (const group of groupLayers.values()) if (group.distance >= 850 && group.distance <= 3000)
      layerDistribution[Math.min(3, group.layers) - 1]++;
    for (const kind of variants) if (!outcomes.has(kind)) roadsWithVariant[kind]++;
  }
  expect(spawned).toBeGreaterThan(0);
  expect(spawned).toBeGreaterThanOrEqual(680);
  expect(water).toBeGreaterThanOrEqual(1500);
  expect(wideLongWater).toBeGreaterThanOrEqual(250);
  expect(patterns).toEqual(new Set(Array.from({ length: 12 }, (_, i) => i + 1)));
  const layerTotal = layerDistribution.reduce((sum, count) => sum + count, 0);
  expect(layerDistribution[0] / layerTotal).toBeGreaterThan(.2);
  expect(layerDistribution[0] / layerTotal).toBeLessThan(.3);
  expect(layerDistribution[1] / layerTotal).toBeGreaterThan(.5);
  expect(layerDistribution[1] / layerTotal).toBeLessThan(.62);
  expect(layerDistribution[2] / layerTotal).toBeGreaterThan(.15);
  expect(layerDistribution[2] / layerTotal).toBeLessThan(.25);
  expect(Object.values(roadsWithVariant).every(count => count >= 45 && count <= 65)).toBe(true);
  console.log(JSON.stringify({ config: balance.version, scenario: '100 seeded generated roads to 3 km; spawned is not a player encounter',
    planned, spawned, normalPlannedPerRoad: Array.from({ length: 60 }, (_, i) => hazardDistance(i)).filter(x => x <= 3000).length,
    normal, water, wideLongWater, pairs, triples, layerDistribution,
    patterns: [...patterns].sort((a,b) => a-b), roadsWithVariant }));
});

it('keeps the no-force backup on its earlier P8 road schedule', () => {
  let pairs = 0, specials = 0;
  for (let seed = 1; seed <= 100; seed++) {
    let world = initialWorld(seed, true, 'backup');
    const pairIds = new Set<string>(), specialIds = new Set<string>();
    for (let distance = 0; distance <= 3000; distance += 30) {
      world = fillWorld(world, distance, balance.fuelCapacity, balance.durabilityCapacity);
      for (const e of world.entities) {
        if (e.id.startsWith('hazard-pair-')) pairIds.add(e.id);
        if (e.id.startsWith('event-') && !e.id.startsWith('event-pattern-')) specialIds.add(e.groupId ?? e.id);
      }
    }
    pairs += pairIds.size; specials += specialIds.size;
  }
  console.log(JSON.stringify({ scenario: 'backup director, 100 roads to 3 km', pairs, specials }));
  expect(pairs).toBe(98);
  expect(specials).toBe(685);
});

it('offers a playable seeded checkpoint before a long two-lane puddle', () => {
  for (const seed of [1, 17, 42]) {
    const run = developmentScenario(initialRun(seed), 'p8-water');
    expect(run.world.integrated).toBe(true);
    expect(run.world.entities.some(e => e.kind === 'water' && e.width >= 5.7 && e.length >= 20 &&
      e.distance > run.distance && e.distance - run.distance <= 240)).toBe(true);
    expect(run.vehicleInstances.find(v => v.id === run.activeVehicleId)?.kind).toBe('car4');
  }
});
