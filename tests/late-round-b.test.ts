import { expect, it } from 'vitest';
import { movingEvent } from '../src/moving-events';
import { makeP8Encounter, p8EncounterDistance } from '../src/p8-encounters';
import { specialDistance, specialPlan } from '../src/special-events';
import { scoreDistance } from '../src/scoring';
import { entity, fillWorld, initialWorld } from '../src/world';
import { vehicles } from '../src/vehicles';

it('keeps the original event rhythm before 5 km and adds trains only afterward', () => {
  const early = Array.from({ length: 14 }, (_, index) => specialPlan(index, 17));
  expect(early.map(event => event.distance)).toEqual(Array.from({ length: 14 }, (_, i) => 650 + i * 320));
  expect(early.map(event => event.kind)).toEqual([
    'jam', 'broken', 'police', 'train', 'militia', 'accident', 'jam',
    'police', 'jam', 'train', 'militia', 'accident', 'jam', 'broken',
  ]);
  for (let seed = 1; seed <= 30; seed++)
    expect(early.map((_, index) => specialPlan(index, seed).kind)).toEqual(
      early.map((_, index) => specialPlan(index, seed, true).kind));
  const late = Array.from({ length: 25 }, (_, offset) => specialPlan(offset + 14, 17));
  expect(late[0].distance).toBeGreaterThan(5000);
  expect(late.filter(event => event.kind === 'train')).toHaveLength(5);
});

it('does not add a second militia to road templates before the 8 km challenge step', () => {
  const make = (kind: Parameters<typeof entity>[0], id: string, distance: number, x: number) =>
    entity(kind, id, distance, x);
  let latePairs = 0;
  for (let seed = 1; seed <= 60; seed++) {
    const early = makeP8Encounter(seed, 44, 4000, 3900, 0, [], make, 11);
    const late = makeP8Encounter(seed, 44, 9000, 8900, 0, [], make, 11);
    expect(early.actors.filter(actor => actor.kind === 'militia')).toHaveLength(1);
    latePairs += Number(late.actors.filter(actor => actor.kind === 'militia').length === 2);
  }
  expect(latePairs).toBeGreaterThan(40);
});

it('increases late officer group size and stagger/fast mix without changing the backup', () => {
  for (const kind of ['police', 'militia'] as const) {
    const totals = { earlyPairs: 0, latePairs: 0, backupPairs: 0, lateFast: 0, lateStagger: 0 };
    for (let seed = 0; seed < 300; seed++) {
      const early = movingEvent(entity(kind, `early-${seed}`, 7000, 0), 3, seed, 0);
      const late = movingEvent(entity(kind, `late-${seed}`, 9000, 0), 3, seed, 0);
      const backup = movingEvent(entity(kind, `backup-${seed}`, 9000, 0), 3, seed, 0, undefined, true);
      totals.earlyPairs += Number(early.length === 2);
      totals.latePairs += Number(late.length === 2);
      totals.backupPairs += Number(backup.length === 2);
      totals.lateFast += Number(late[0].crossMotion?.velocity === 6.3);
      totals.lateStagger += Number(late[0].crossMotion?.velocity === 5.6);
      expect(late.length).toBeLessThanOrEqual(2);
    }
    expect(totals.latePairs).toBeGreaterThan(totals.earlyPairs);
    expect(totals.latePairs).toBeGreaterThan(200);
    expect(totals.lateFast + totals.lateStagger).toBeGreaterThan(200);
    expect(totals.backupPairs).toBeGreaterThan(60);
    expect(totals.backupPairs).toBeLessThan(140);
    console.log(JSON.stringify({ scenario: 'officer-group-mix', kind, totals }));
  }
});

it('records actual seeded actor density through 18 km instead of assuming template weights survive filters', () => {
  const edges = [0, 5000, 8000, 12000, 15000, 18000];
  const stages = edges.slice(0, -1).map((start, i) => ({ start, end: edges[i + 1],
    normalPlanned: 0, normalSpawned: 0, wind: 0, tripleGroups: 0,
    officerGroups: 0, officerActors: 0, train: 0, specialPlanned: 0, specialSpawned: 0,
    fuel: 0, repair: 0, shop: 0, score: 0 }));
  const stageAt = (distance: number) => stages.findIndex(s => distance >= s.start && distance < s.end);
  for (let index = 0; p8EncounterDistance(index) < 18000; index++) {
    const stage = stageAt(p8EncounterDistance(index)); if (stage >= 0) stages[stage].normalPlanned += 30;
  }
  for (let index = 0; specialDistance(index) < 18000; index++) {
    const stage = stageAt(specialDistance(index)); if (stage >= 0) stages[stage].specialPlanned += 30;
  }
  for (let seed = 1; seed <= 30; seed++) {
    let world = initialWorld(seed, true);
    const seen = new Map<string, ReturnType<typeof entity>>();
    for (let distance = 0; distance <= 18000; distance += 40) {
      world = fillWorld(world, distance, vehicles.car4.fuelCapacity, vehicles.car4.durabilityCapacity,
        1, vehicles.car4, distance / 16, 16);
      for (const actor of world.entities) if (!seen.has(actor.id)) seen.set(actor.id, actor);
    }
    const groups = new Map<string, number>();
    const officers = new Map<string, { stage: number; actors: number }>();
    for (const actor of seen.values()) {
      const stage = stageAt(actor.distance); if (stage < 0) continue;
      const s = stages[stage];
      if (actor.id.startsWith('hazard-')) {
        const match = /^hazard-(?:pair-|third-)?(\d+)/.exec(actor.id);
        if (match) groups.set(`${stage}:${match[1]}`, (groups.get(`${stage}:${match[1]}`) ?? 0) + 1);
        if (actor.kind === 'wind') s.wind++;
      }
      if (actor.kind === 'train') s.train++;
      if (actor.kind === 'fuel') s.fuel++;
      if (actor.kind === 'repair') s.repair++;
      if (actor.kind === 'shop') s.shop++;
      if (actor.kind === 'score') s.score++;
      if (actor.id.startsWith('event-') && !actor.id.includes('pattern-')) {
        const group = actor.groupId ?? actor.id;
        if (!officers.has(group) && (actor.kind === 'police' || actor.kind === 'militia'))
          officers.set(group, { stage, actors: 0 });
        if (actor.kind === 'police' || actor.kind === 'militia') officers.get(group)!.actors++;
        if (!actor.id.includes('-npc-')) s.specialSpawned++;
      }
    }
    for (const [key, count] of groups) {
      const stage = Number(key.split(':')[0]); stages[stage].normalSpawned++;
      if (count >= 3) stages[stage].tripleGroups++;
    }
    for (const officer of officers.values()) {
      stages[officer.stage].officerGroups++;
      stages[officer.stage].officerActors += officer.actors;
      stages[officer.stage].specialSpawned++;
    }
    for (let index = 0; scoreDistance(index, seed) < 18000; index++)
      expect(seen.has(`score-${index}`)).toBe(true);
  }
  expect(stages[4].normalPlanned / 3).toBeGreaterThan(stages[3].normalPlanned / 3);
  expect(stages[3].normalSpawned).toBeGreaterThan(0);
  expect(stages[4].normalSpawned).toBeGreaterThan(0);
  expect(stages[2].wind).toBeGreaterThan(0);
  console.log(JSON.stringify({ scenario: 'generated-stage-audit', seeds: 30, stages }));
}, 120000);
