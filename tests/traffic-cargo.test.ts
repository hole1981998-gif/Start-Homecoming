import { expect, it } from 'vitest';
import { cargoBalance } from '../src/config';
import { cargoScenarios } from '../src/cargo-scenarios';
import { developmentScenario } from '../src/development';
import { initialRun, stepRun, type Run } from '../src/survival';
import { advanceCargo, releaseCargo } from '../src/traffic-cargo';
import { entity, forkWorld } from '../src/world';
import { noInput, FixedClock } from '../src/simulation';

const ready = (scenario = 'p63-crate-right'): Run => ({ ...developmentScenario(initialRun(17), scenario), phase: 'running' });
const drive = (start: Run, frames: number): Run => { let r = start; for (let i = 0; i < frames && r.phase === 'running'; i++) r = stepRun(r, noInput()); return r; };
const cargoAt = (kind: 'crate' | 'barrel') => {
  const c = entity('cargo', `test-${kind}`, 6, 0); c.cargoType = kind; c.cargoExpiresAt = 20; return c;
};

it('offers opt-in P6.3 scenes without enabling cargo in normal gameplay', () => {
  expect(cargoScenarios).toHaveLength(6);
  expect(ready().world.prototype?.version).toBe('p63-cargo-1');
  expect(initialRun(17).world.entities.some(e => e.kind === 'cargo' || e.cargoReleaseAt !== undefined)).toBe(false);
});
it('releases one deterministic rolling object per living source, and skips wreck/offscreen sources', () => {
  const source = ready().world.entities[0];
  const entities = [{ ...source }];
  releaseCargo(entities, 3.5, 30, 17);
  const cargo = entities.find(e => e.kind === 'cargo')!;
  expect(cargo.id).toBe(`cargo:${source.id}`);
  expect(cargo.cargoSourceId).toBe(source.id);
  expect(cargo.cargoVelocityX).toBeLessThan(0);
  expect(cargo.x).toBe(source.x);
  expect(cargo.distance).toBeLessThan(source.distance - source.length / 2);
  expect(cargo.speed).toBeLessThan(0);
  releaseCargo(entities, 5, 30, 17);
  expect(entities.filter(e => e.kind === 'cargo')).toHaveLength(1);
  const moved = entities.map(e => ({ ...e })); advanceCargo(moved, .5, 4);
  expect(moved[1].x).toBeLessThan(cargo.x);
  advanceCargo(moved, cargoBalance.lifetime, cargo.cargoExpiresAt!);
  expect(moved[1].consumed).toBe(true);
  for (const blocked of [ready('p63-wrecked').world.entities[0], { ...source, id: 'behind', distance: 5 },
    { ...source, id: 'far', distance: 300 }, { ...source, id: 'opposite', speed: -2, baseSpeed: -2 },
    { ...source, id: 'stopped', speed: 0 }, { ...source, id: 'car', trafficKind: 'car4' as const }]) {
    const batch = [{ ...blocked }]; releaseCargo(batch, 10, 30, 17);
    expect(batch).toHaveLength(1);
  }
});
it('caps active cargo across multiple sources and never recreates an expired event', () => {
  const source = ready().world.entities[0];
  const batch = Array.from({ length: 7 }, (_, i) => ({ ...source, id: `source-${i}`, cargoDropped: false }));
  releaseCargo(batch, 5, 30, 17);
  expect(batch.filter(e => e.kind === 'cargo')).toHaveLength(cargoBalance.maxActive);
  for (const e of batch) if (e.kind === 'cargo') e.consumed = true;
  releaseCargo(batch, 6, 30, 17);
  expect(batch.filter(e => e.kind === 'cargo')).toHaveLength(cargoBalance.maxActive);
});
it('seeded cargo can roll either way after leaving the rear, and rebounds at the road edge', () => {
  const inward = [{ ...ready('p63-crate-right').world.entities[0] }];
  const outward = [{ ...ready('p63-roll-edge').world.entities[0] }];
  releaseCargo(inward, 5, 30, 17); releaseCargo(outward, 5, 30, 17);
  expect(inward[1].cargoVelocityX).toBeLessThan(0);
  expect(outward[1].cargoVelocityX).toBeGreaterThan(0);
  advanceCargo(outward, 2, 6);
  expect(outward[1].x).toBeLessThanOrEqual(cargoBalance.roadHalfWidth);
  expect(outward[1].cargoVelocityX).toBeLessThan(0);
});
it('swept crate collision damages once; barrel causes a fall; star and jump protect', () => {
  const base = ready();
  const make = (type: 'crate' | 'barrel') => ({ ...base, world: { ...base.world, entities: [cargoAt(type)] } });
  const crate = drive(make('crate'), 60);
  expect(crate.durability).toBe(base.durability - cargoBalance.crateDamage);
  expect(crate.crash).toBeNull();
  expect(crate.world.entities.find(e => e.id === 'test-crate')?.consumed ?? true).toBe(true);
  const barrel = drive(make('barrel'), 60);
  expect(barrel.durability).toBe(base.durability - cargoBalance.barrelDamage);
  expect(barrel.crash).not.toBeNull();
  const starred = drive({ ...make('barrel'), powers: { ...base.powers, starUntil: 5 } }, 60);
  expect(starred.durability).toBe(base.durability);
  expect(starred.crash).toBeNull();
  const jumping = drive({ ...make('barrel'), powers: { ...base.powers, boostUntil: 5, jumpAt: 0 } }, 60);
  expect(jumping.durability).toBe(base.durability);
  expect(jumping.crash).toBeNull();
});
it('does not clone old-branch sources or their cargo into the new playable branch', () => {
  const r = ready();
  const source = { ...r.world.entities[0], distance: 502 };
  const cargo = { ...cargoAt('crate'), distance: 503 };
  const forked = forkWorld({ ...r.world, entities: [source, cargo] }, r.route, 'left', 500);
  expect(forked.entities).toHaveLength(0);
  expect(forked.retired.map(e => e.entity.id)).toEqual([source.id, cargo.id]);
});
it('same seeded scene remains deterministic across render frame rates', () => {
  const snapshots = [30, 60, 144].map(fps => {
    let r = ready(); const clock = new FixedClock();
    for (let i = 0; i < fps * 5; i++) clock.advance(1 / fps, () => { r = stepRun(r, noInput()); });
    return [r.distance, r.durability, ...r.world.entities.filter(e => e.kind === 'cargo').map(e => e.x)];
  });
  expect(snapshots[1]).toEqual(snapshots[0]);
  expect(snapshots[2]).toEqual(snapshots[0]);
});
it('the default trial forces a readable crossing decision rather than missing every lane', () => {
  const crate = drive(ready('p63-crate-right'), 600);
  const barrel = drive(ready('p63-barrel-left'), 600);
  expect(crate.durability).toBeLessThan(ready().durability);
  expect(barrel.durability).toBeLessThan(ready().durability);
  let dodged = ready('p63-crate-right');
  for (let i = 0; i < 600; i++) dodged = stepRun(dodged, { ...noInput(), left: i < 90 });
  expect(dodged.durability).toBe(ready().durability);
});
it('samples 30 seeded tail drops without duplicate cargo, invalid state or unavoidable universal hits', () => {
  let hits = 0, misses = 0;
  for (let seed = 1; seed <= 30; seed++) {
    let run: Run = { ...developmentScenario(initialRun(seed), 'p63-crate-right'), phase: 'running' };
    let maxCargo = 0;
    for (let frame = 0; frame < 600; frame++) {
      run = stepRun(run, noInput());
      maxCargo = Math.max(maxCargo, run.world.entities.filter(e => e.kind === 'cargo' && !e.consumed).length);
      expect([run.distance, run.x, run.fuel, run.durability].every(Number.isFinite)).toBe(true);
    }
    expect(maxCargo).toBe(1);
    expect(run.crash).toBeNull();
    expect(maxCargo).toBeLessThanOrEqual(cargoBalance.maxActive);
    if (run.durability < 70) hits++; else misses++;
  }
  expect(hits).toBeGreaterThan(0);
  expect(misses).toBeGreaterThan(0);
  console.log(JSON.stringify({ scenario: 'p63-crate-right', seeds: 30, cruiseHits: hits, cruiseMisses: misses }));
});
