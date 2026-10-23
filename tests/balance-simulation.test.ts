import { expect, it } from 'vitest';
import { balance, shopBalance } from '../src/config';
import { crossX } from '../src/cross-motion';
import { junction } from '../src/route';
import { activeVehicle, initialRun, pickUpPassenger, selectTurn, stepRun, type Run } from '../src/survival';
import { enterShop, leaveShop, reachableShop, transact } from '../src/shop';
import { newVehicle, vehicles, type VehicleKind } from '../src/vehicles';
import { fillWorld, initialWorld, warningDistance, type Entity } from '../src/world';

type Profile = { name: string; reaction: number; sight: number; accelerate: boolean; avoidWeight: number };
const profiles: Profile[] = [
  { name: 'cautious', reaction: .25, sight: 85, accelerate: false, avoidWeight: 24 },
  { name: 'average', reaction: .7, sight: 65, accelerate: false, avoidWeight: 16 },
  { name: 'fast', reaction: 1, sight: 55, accelerate: true, avoidWeight: 12 },
  { name: 'adaptive', reaction: .7, sight: 65, accelerate: false, avoidWeight: 16 },
];
const selectedProfiles = process.env.P8_PROFILE ? profiles.filter(profile => profile.name === process.env.P8_PROFILE) :
  profiles.filter(profile => profile.name !== 'adaptive');
if (!selectedProfiles.length) throw new Error('Unknown P8_PROFILE');
const requestedSamples = Number(process.env.P8_SAMPLE_COUNT ?? 30);
const sampleCount = Number.isInteger(requestedSamples) && requestedSamples >= 1 && requestedSamples <= 1000 ?
  requestedSamples : 30;
const requestedStart = Number(process.env.P8_SEED_START ?? 1);
const seedStart = Number.isSafeInteger(requestedStart) && requestedStart >= 1 ? requestedStart : 1;
const vehicleOverride = process.env.P8_VEHICLE as VehicleKind | undefined;
if (vehicleOverride && !(vehicleOverride in vehicles)) throw new Error('Unknown P8_VEHICLE');
const requestedDirector = process.env.P8_DIRECTOR;
if (requestedDirector && requestedDirector !== 'p8' && requestedDirector !== 'backup')
  throw new Error('Unknown P8_DIRECTOR');
const director = requestedDirector === 'backup' ? 'backup' : 'p8';

function chooseLane(run: Run, profile: Profile): number {
  const npc = run.riderIds.length ? undefined : run.world.entities.find(e => e.kind === 'passenger' &&
    !e.consumed && e.pickupable !== false && e.distance > run.distance && e.distance - run.distance < profile.sight);
  const shop = run.world.entities.find(e => e.kind === 'shop' && e.distance > run.distance &&
    e.distance - run.distance < Math.max(80, profile.sight));
  if (npc) return npc.x;
  if (shop && (run.vehicleInstances.length === 1 || run.fuel < 2 || run.durability < 35)) return shop.x;
  const nearby = run.world.entities.filter(e => !e.consumed && e.distance + e.length / 2 > run.distance &&
    e.distance - run.distance < profile.sight);
  return [-balance.laneWidth, 0, balance.laneWidth].map(x => {
    let cost = Math.abs(x - run.x) * .08;
    for (const e of nearby) {
      const t = Math.max(0, (e.distance - run.distance) / Math.max(4, run.speed - e.speed));
      const xAt = e.crossMotion ? crossX(e.crossMotion, run.activeSeconds + t) : e.x;
      if (Math.abs(x - xAt) > (e.width + activeVehicle(run).width) / 2) continue;
      const weight = 1 / Math.max(1, (e.distance - run.distance) / 12);
      if (e.kind === 'traffic' || e.kind === 'pothole' || e.kind === 'jam' ||
        e.kind === 'police' || e.kind === 'militia' || e.kind === 'accident') cost += profile.avoidWeight * weight;
      if (e.kind === 'water') {
        const seconds = (e.length + activeVehicle(run).length) / Math.max(6, run.speed);
        const litres = seconds * balance.waterFuelPerSecond;
        cost += (12 + 20 * litres / Math.max(1, run.fuel)) * weight;
      }
      if (e.kind === 'fuel' && run.fuel < 2) cost -= 12 * weight;
      if (e.kind === 'repair' && run.durability < 35) cost -= 8 * weight;
    }
    return { x, cost };
  }).sort((a, b) => a.cost - b.cost)[0].x;
}

/** Same finite-reaction proxy as the C3 handoff: press W while the current lane looks clear. */
function situationalThrottle(run: Run): boolean {
  return !run.world.entities.some(e => !e.consumed &&
    ['water', 'pothole', 'traffic', 'jam', 'police', 'militia', 'accident', 'broken', 'cargo'].includes(e.kind) &&
    e.distance + e.length / 2 >= run.distance && e.distance - run.distance < 65 &&
    (e.distance - run.distance) / Math.max(4, run.speed - e.speed) < 3.5 &&
    Math.abs(run.x - (e.crossMotion ? crossX(e.crossMotion,
      run.activeSeconds + Math.max(0, (e.distance - run.distance) / Math.max(4, run.speed - e.speed))) : e.x)) <
      (e.width + activeVehicle(run).width) / 2 + .25);
}

function runProfile(seed: number, profile: Profile) {
  let run: Run = { ...initialRun(seed), phase: 'running',
    world: fillWorld(initialWorld(seed, true, director), 0) };
  if (vehicleOverride) {
    const instance = newVehicle(vehicleOverride, `pilot-${vehicleOverride}`);
    run = { ...run, vehicleInstances: [instance, newVehicle('motorcycle', 'pilot-spare')],
      activeVehicleId: instance.id, fuel: instance.fuel, durability: instance.durability,
      speed: vehicles[vehicleOverride].cruiseSpeed,
      world: fillWorld(initialWorld(seed, true, director), 0, instance.fuel,
        instance.durability, 1, vehicles[vehicleOverride]) };
  }
  let target = 0, firstCarAt: number | null = null;
  const seen = new Set<string>(), encountered = new Set<string>();
  const encounteredHazards = new Set<string>(), encounteredKinds = new Set<string>();
  const encounteredPatterns = new Set<number>();
  let waterCount = 0, wideLongWaterCount = 0;
  const group = (e: Entity): string | undefined => {
    if (e.kind === 'traffic' && e.serviceRole === 'ambulance') return 'moving-blockers';
    if (e.kind === 'jam') return 'moving-blockers';
    if (e.kind === 'water' || e.kind === 'pothole' || e.kind === 'traffic' || e.kind === 'wind' ||
      e.kind === 'cargo' || e.kind === 'police' || e.kind === 'militia' || e.kind === 'train' ||
      e.kind === 'accident' || e.kind === 'broken') return e.kind;
    return undefined;
  };
  let crashes = 0, waterSeconds = 0;
  const trafficPairs = new Set<string>(), trafficObstacles = new Set<string>();
  for (let tick = 0; tick < 60 * 720 && run.phase === 'running'; tick++) {
    if (tick % Math.max(1, Math.round(profile.reaction * 60)) === 0) target = chooseLane(run, profile);
    const shop = reachableShop(run);
    if (shop && (!vehicleOverride && run.vehicleInstances.length === 1 && run.money >= vehicles.car4.price ||
      run.fuel < activeVehicle(run).fuelCapacity * .6 || run.durability < activeVehicle(run).durabilityCapacity * .6)) {
      run = enterShop(run);
      if (run.shopId) {
        if (!vehicleOverride && run.vehicleInstances.length === 1 && run.money >= vehicles.car4.price) {
          run = transact(run, { kind: 'vehicle', vehicle: 'car4', sequence: run.economySequence }).run;
          if (activeVehicle(run).kind === 'car4' && firstCarAt === null) firstCarAt = run.activeSeconds;
        }
        if (run.fuel < activeVehicle(run).fuelCapacity * .6)
          run = transact(run, { kind: 'service', item: 'fuel', sequence: run.economySequence }).run;
        if (run.durability < activeVehicle(run).durabilityCapacity * .6)
          run = transact(run, { kind: 'service', item: 'repair', sequence: run.economySequence }).run;
        run = { ...leaveShop(run), phase: 'running' };
      }
    }
    run = pickUpPassenger(run);
    const j = junction(run.seed, run.route.index);
    if (j.blockedStraight && tick % Math.max(1, Math.round(profile.reaction * 60)) === 0)
      run = selectTurn(run, 'left');
    const train = run.world.entities.find(e => e.kind === 'train' && !e.consumed &&
      e.distance > run.distance && e.distance - run.distance < profile.sight);
    const previousCrash = !!run.crash;
    run = stepRun(run, { accelerate: (profile.name === 'adaptive' ? situationalThrottle(run) : profile.accelerate) && !train,
      brake: !!train,
      left: run.x > target + .18, right: run.x < target - .18 });
    if (!previousCrash && run.crash) crashes++;
    if (run.world.entities.some(e => e.kind === 'water' && e.touching)) waterSeconds += balance.fixedStep;
    for (const e of run.world.entities) {
      if (e.kind === 'traffic') {
        const visible = Math.abs(e.distance - run.distance) <= balance.worldLookAhead;
        if (visible) for (const id of e.trafficPairContacts ?? [])
          trafficPairs.add([e.id,id].sort().join(':'));
        if (visible) for (const id of e.trafficContacts ?? [])
          trafficObstacles.add(`${e.id}:${id}`);
      }
      if (e.id.startsWith('event-') && !e.id.startsWith('event-pattern-')) {
        seen.add(e.groupId ?? e.id);
      }
      const kind = group(e);
      const readable = e.distance + e.length / 2 >= run.distance &&
        e.distance - run.distance <= warningDistance(run.speed, e, activeVehicle(run).length) &&
        (e.kind !== 'train' || !e.motionWaiting &&
          e.x - e.width / 2 <= balance.laneWidth * 1.5 && e.x + e.width / 2 >= -balance.laneWidth * 1.5);
      if (kind && readable && !encounteredHazards.has(e.id)) {
        encounteredHazards.add(e.id); encounteredKinds.add(kind);
        if (e.id.startsWith('event-') && !e.id.startsWith('event-pattern-'))
          encountered.add(e.displayName ?? e.kind);
        if (e.kind === 'water') { waterCount++; if (e.width >= 5.7 && e.length >= 20) wideLongWaterCount++; }
        if (e.patternId) encounteredPatterns.add(e.patternId);
      }
    }
    if (tick % 60 === 0 && ![run.money, run.distance, run.fuel, run.durability].every(Number.isFinite))
      throw new Error(`Invalid resource in seed ${seed}, profile ${profile.name}`);
  }
  return { seed, profile: profile.name, seconds: Math.round(run.activeSeconds), end: run.result?.reason ?? 'censored',
    firstCarAt, distance: Math.round(run.distance), crashes, specialSpawned: seen.size, specialEncountered: encountered.size,
    distinctHazardGroups: encounteredKinds.size, waterCount, wideLongWaterCount,
    patterns: encounteredPatterns.size, kinds: [...encounteredKinds],
    rareVariants: ['Rào sửa đường', 'Hàng rong băng đường', 'Cứu thương đổi lane']
      .map((name, index) => encountered.has(name) ? ['barrier', 'vendor', 'ambulance'][index] : null)
      .filter((name): name is string => name !== null),
    trafficPairs: trafficPairs.size, trafficObstacles: trafficObstacles.size,
    waterSeconds: Number(waterSeconds.toFixed(1)),
    riders: run.riderIds.length, fuel: Number(run.fuel.toFixed(2)), hp: Number(run.durability.toFixed(1)) };
}

const samples = new Map<string, ReturnType<typeof runProfile>[]>();
const chunkSize = 15; // Keep each synchronous simulation below Vitest's worker RPC heartbeat.
const chunks = selectedProfiles.flatMap(profile => Array.from({ length: Math.ceil(sampleCount / chunkSize) }, (_, chunk) => ({
  profile, from: seedStart + chunk * chunkSize,
  to: Math.min(seedStart + sampleCount - 1, seedStart + (chunk + 1) * chunkSize - 1),
})));

it.each(chunks)('simulates $profile.name seeds $from–$to with finite reaction', async ({ profile, from, to }) => {
  const runs: ReturnType<typeof runProfile>[] = [];
  for (let seed = from; seed <= to; seed++) {
    try { runs.push(runProfile(seed, profile)); }
    catch (error) { console.error(`Simulation failed: seed ${seed}, ${profile.name}`); throw error; }
    // Let Vitest receive task updates during long deterministic batches.
    await new Promise<void>(resolve => setImmediate(resolve));
  }
  samples.set(profile.name, [...(samples.get(profile.name) ?? []), ...runs]);
  expect(runs).toHaveLength(to - from + 1);
}, 90000);

it.each(selectedProfiles)('summarizes $name finite-reaction pilot without claiming human skill', profile => {
  const runs = samples.get(profile.name) ?? [];
  const ended = runs.filter(r => r.end !== 'censored');
  const carTimes = runs.flatMap(r => r.firstCarAt === null ? [] : [r.firstCarAt]).sort((a, b) => a - b);
  const times = runs.map(r => r.seconds).sort((a, b) => a - b);
  const carPercentile = (fraction: number) => carTimes.length ? Number(carTimes[Math.floor((carTimes.length - 1) * fraction)].toFixed(1)) : null;
  const terminalPercentile = (fraction: number) => ended.length > runs.length * fraction ?
    times[Math.floor((runs.length - 1) * fraction)] : null;
  const summary = { profile: profile.name, ended: ended.length,
    endings: Object.fromEntries([...new Set(runs.map(r => r.end))].map(reason =>
      [reason, runs.filter(r => r.end === reason).length])),
    averageDistance: Math.round(runs.reduce((sum, r) => sum + r.distance, 0) / runs.length),
    averageFuel: Number((runs.reduce((sum, r) => sum + r.fuel, 0) / runs.length).toFixed(2)),
    averageHp: Number((runs.reduce((sum, r) => sum + r.hp, 0) / runs.length).toFixed(1)),
    averageWaterSeconds: Number((runs.reduce((sum, r) => sum + r.waterSeconds, 0) / runs.length).toFixed(1)),
    visiblePairRuns: runs.filter(r => r.trafficPairs > 0).length,
    visibleObstacleRuns: runs.filter(r => r.trafficObstacles > 0).length,
    q25Seconds: terminalPercentile(.25), medianSeconds: terminalPercentile(.5), q75Seconds: terminalPercentile(.75),
    p10CarSeconds: carPercentile(.1), medianCarSeconds: carPercentile(.5), p90CarSeconds: carPercentile(.9),
    carWithin24Seconds: carTimes.filter(seconds => seconds <= 24).length,
    carWithin30Seconds: carTimes.filter(seconds => seconds <= 30).length,
    boughtCar: carTimes.length, averageCrashes: Number((runs.reduce((sum, r) => sum + r.crashes, 0) / runs.length).toFixed(1)),
    averageSpecials: Number((runs.reduce((sum, r) => sum + r.specialEncountered, 0) / runs.length).toFixed(1)),
    averageWater: Number((runs.reduce((sum, r) => sum + r.waterCount, 0) / runs.length).toFixed(1)),
    averageWideLongWater: Number((runs.reduce((sum, r) => sum + r.wideLongWaterCount, 0) / runs.length).toFixed(1)),
    eligibleRuns: runs.filter(r => r.distance >= 3000 || r.seconds >= 240).length,
    eligibleWithEightGroups: runs.filter(r => (r.distance >= 3000 || r.seconds >= 240) && r.distinctHazardGroups >= 8).length,
    eligibleWithRare: Object.fromEntries(['barrier', 'vendor', 'ambulance'].map(kind =>
      [kind, runs.filter(r => (r.distance >= 3000 || r.seconds >= 240) && r.rareVariants.includes(kind)).length])) };
  expect(runs).toHaveLength(sampleCount);
  if (!vehicleOverride) expect(summary.boughtCar).toBeGreaterThan(0);
  console.log(JSON.stringify({ config: balance.version, director, vehicle: vehicleOverride ?? 'motorcycle',
    seedRange: `${seedStart}–${seedStart + sampleCount - 1}`, capSeconds: 720,
    firstShop: shopBalance.firstDistance, scenario: 'scripted finite-reaction pilots, not human playtest', summary }));
}, sampleCount > 30 ? 120000 : 90000);
