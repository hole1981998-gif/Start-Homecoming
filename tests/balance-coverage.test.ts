import { expect, it } from 'vitest';
import { balance } from '../src/config';
import { specialPlan } from '../src/special-events';
import { entity, fillWorld, initialWorld } from '../src/world';
import { makeP8Encounter, p8EncounterDistance } from '../src/p8-encounters';
import { developmentScenario } from '../src/development';
import { initialRun } from '../src/survival';

const requestedRoads = Number(process.env.P8_COVERAGE_SEEDS ?? 100);
const roadCount = Number.isInteger(requestedRoads) && requestedRoads >= 1 && requestedRoads <= 1000 ?
  requestedRoads : 100;

it(`samples planned and spawned special coverage on ${roadCount} deterministic 3 km roads`, () => {
  const variants = ['barrier', 'vendor', 'ambulance'] as const;
  const roadsWithVariant = Object.fromEntries(variants.map(kind => [kind, 0])) as Record<typeof variants[number], number>;
  let spawned = 0, planned = 0, pairs = 0, triples = 0, normal = 0, water = 0, wideLongWater = 0;
  let waterGroupCount = 0, trafficGroupCount = 0, coveredMetres = 0, measuredGroups = 0;
  const gaps: number[] = [];
  const layerDistribution = [0, 0, 0];
  const patterns = new Set<number>();
  for (let seed = 1; seed <= roadCount; seed++) {
    const outcomes = new Set(variants.map(kind => kind));
    let world = initialWorld(seed, true);
    const seen = new Set<string>(), seenHazards = new Set<string>();
    const eventWindows: {start:number;end:number}[] = [];
    const waterWindows: {start:number;end:number}[] = [];
    const groupLayers = new Map<string, { distance: number; layers: number; actors: {kind: string; start: number; end: number}[] }>();
    for (let distance = 0; distance <= 3000; distance += 30) {
      world = fillWorld(world, distance, balance.fuelCapacity, balance.durabilityCapacity);
      for (const e of world.entities) if (e.id.startsWith('event-') && !e.id.startsWith('event-pattern-')) {
        if (!seen.has(e.groupId ?? e.id)) eventWindows.push({start:e.distance-e.length/2,end:e.distance+e.length/2});
        seen.add(e.groupId ?? e.id);
        if (e.patternId) patterns.add(e.patternId);
        if (e.displayName === 'Rào sửa đường') outcomes.delete('barrier');
        if (e.displayName === 'Hàng rong băng đường') outcomes.delete('vendor');
        if (e.serviceRole === 'ambulance') outcomes.delete('ambulance');
      }
      for (const e of world.entities) if ((e.id.startsWith('hazard-') ||
        e.id.startsWith('event-pattern-')) && !seenHazards.has(e.id)) {
        seenHazards.add(e.id);
        if (e.id.startsWith('hazard-')) {
          const key = (e.groupId ?? e.id).replace(/^hazard-(pair-|third-)?/, 'hazard-');
          const group = groupLayers.get(key) ?? { distance: e.distance, layers: 0, actors: [] };
          group.layers++; group.actors.push({kind:e.kind,start:e.distance-e.length/2,end:e.distance+e.length/2});
          groupLayers.set(key, group);
        }
        if (e.id.startsWith('hazard-pair-')) pairs++;
        else if (e.id.startsWith('hazard-third-')) triples++;
        else if (e.id.startsWith('hazard-')) normal++;
        if (e.kind === 'water') {
          water++; waterWindows.push({start:e.distance-e.length/2,end:e.distance+e.length/2});
          if (e.width >= 5.7 && e.length >= 20) wideLongWater++;
        }
        if (e.patternId) patterns.add(e.patternId);
      }
    }
    spawned += seen.size;
    planned += Array.from({ length: 7 }, (_, index) => specialPlan(index, seed)).filter(plan => plan.distance <= 3000).length;
    const late = [...groupLayers.values()].filter(group => group.distance >= 350 && group.distance <= 3000)
      .sort((a,b)=>a.distance-b.distance);
    measuredGroups += late.length;
    waterGroupCount += late.filter(group=>group.actors.some(e=>e.kind==='water')).length;
    trafficGroupCount += late.filter(group=>group.actors.some(e=>e.kind==='traffic')).length;
    for(let z=350;z<3000;z++) if(waterWindows.some(e=>z>=e.start&&z<=e.end)) coveredMetres++;
    const windows=[...late.map(group=>({start:group.actors.reduce((v,e)=>Math.min(v,e.start),Infinity),
      end:group.actors.reduce((v,e)=>Math.max(v,e.end),-Infinity)})),...eventWindows.filter(e=>e.start>=350&&e.start<=3000)]
      .sort((a,b)=>a.start-b.start);
    for(let i=1;i<windows.length;i++) {
      const gap=Math.max(0,windows[i].start-windows[i-1].end)/16;
      gaps.push(gap);
    }
    for (const group of late) if (group.distance >= 850)
      layerDistribution[Math.min(3, group.layers) - 1]++;
    for (const kind of variants) if (!outcomes.has(kind)) roadsWithVariant[kind]++;
  }
  gaps.sort((a,b)=>a-b);
  console.log(JSON.stringify({planned,spawned,normal,water,wideLongWater,pairs,triples,layerDistribution,
    measuredGroups,waterGroupShare:waterGroupCount/measuredGroups,trafficGroupShare:trafficGroupCount/measuredGroups,
    waterLongitudinalShare:coveredMetres/(2650*roadCount),gapP95Seconds:gaps[Math.floor(gaps.length*.95)],
    gapOver2:gaps.filter(v=>v>2).length,
    patterns:[...patterns].sort((a,b)=>a-b),roadsWithVariant}));
  expect(spawned).toBeGreaterThan(0);
  expect(spawned).toBeGreaterThanOrEqual(6.8 * roadCount);
  expect(water).toBeGreaterThanOrEqual(15 * roadCount);
  expect(wideLongWater).toBeGreaterThanOrEqual(2.5 * roadCount);
  expect(patterns).toEqual(new Set(Array.from({ length: 16 }, (_, i) => i + 1)));
  const layerTotal = layerDistribution.reduce((sum, count) => sum + count, 0);
  expect(layerDistribution[0]).toBe(0);
  expect(layerDistribution[1] / layerTotal).toBeGreaterThan(.55);
  expect(layerDistribution[1] / layerTotal).toBeLessThan(.7);
  expect(layerDistribution[2] / layerTotal).toBeGreaterThan(.3);
  expect(layerDistribution[2] / layerTotal).toBeLessThan(.45);
  expect(waterGroupCount / measuredGroups).toBeGreaterThan(.65);
  expect(waterGroupCount / measuredGroups).toBeLessThan(.76);
  expect(trafficGroupCount / measuredGroups).toBeGreaterThan(.65);
  expect(trafficGroupCount / measuredGroups).toBeLessThan(.76);
  expect(coveredMetres / (2650 * roadCount)).toBeGreaterThan(.4);
  expect(coveredMetres / (2650 * roadCount)).toBeLessThan(.7);
  expect(Object.values(roadsWithVariant).every(count => count / roadCount >= .45 && count / roadCount <= .65)).toBe(true);
  console.log(JSON.stringify({ config: balance.version, scenario: `${roadCount} seeded generated roads to 3 km; spawned is not a player encounter`,
    planned, spawned, normalPlannedPerRoad: Array.from({ length: 150 }, (_, i) => p8EncounterDistance(i)).filter(x => x <= 3000).length,
    normal, water, wideLongWater, pairs, triples, layerDistribution,
    patterns: [...patterns].sort((a,b) => a-b), roadsWithVariant }));
});

it('gives seeded P8 traffic lane directions while preserving explicit opposing cars', () => {
  for (const seed of [1, 17, 42]) {
    const plan = makeP8Encounter(seed, 20, 800, 650, 0, [], entity, 5);
    const traffic = plan.actors.filter(e => e.kind === 'traffic');
    expect(traffic).toHaveLength(2);
    expect(traffic.find(e => e.x < 0)?.speed).toBeLessThan(0);
    expect(traffic.find(e => e.x > 0)?.speed).toBeGreaterThan(0);
  }
  const opposing = makeP8Encounter(17, 20, 800, 650, 0, [], entity, 13);
  expect(opposing.actors.filter(e => e.kind === 'traffic').every(e => e.speed < 0)).toBe(true);
});

it('computes the dense encounter clock directly even for disabled future slots', () => {
  expect(p8EncounterDistance(2)).toBe(350);
  expect(p8EncounterDistance(55)).toBeCloseTo(1842.48);
  expect(p8EncounterDistance(120)).toBeCloseTo(3386.88);
  expect(p8EncounterDistance(56) - p8EncounterDistance(55)).toBeCloseTo(23.76);
  expect(p8EncounterDistance(121) - p8EncounterDistance(120)).toBeCloseTo(20.24);
  expect(p8EncounterDistance(1e9)).toBeGreaterThan(1e9);
  expect(Number.isFinite(p8EncounterDistance(1e9))).toBe(true);
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
