import { expect, it } from 'vitest';
import { CollisionSandbox, type SandboxScenario } from '../src/collision-sandbox';

const idle = { accelerate: false, brake: false, left: false, right: false };
function sample(scenario: SandboxScenario, seconds = 7) {
  const sandbox = new CollisionSandbox(scenario, 17);
  for (let i = 0; i < seconds * 60; i++) sandbox.step(idle);
  return sandbox;
}

it('Cannon resolves a real car contact once and arcade damage does not repeat each resting frame', () => {
  const sandbox = sample('traffic', 6);
  const impacts = sandbox.events.filter(e => e.pair === 'car-a|player');
  expect(impacts).toHaveLength(1);
  expect(sandbox.player.hp).toBeLessThan(sandbox.player.maxHp);
  expect(sandbox.actors.find(a => a.id === 'car-a')!.hp).toBeLessThan(sandbox.actors.find(a => a.id === 'car-a')!.maxHp);
  expect(sandbox.player.body.position.z).toBeGreaterThan(0);
});

it('NPCs are dynamic collision bodies and cargo is released behind a moving source', () => {
  const npc = sample('npc', 6);
  expect(npc.events.some(e => e.kinds.includes('npc'))).toBe(true);
  const cargo = sample('cargo', 6);
  expect(cargo.actors.filter(a => a.kind === 'cargo')).toHaveLength(2);
  expect(cargo.events.some(e => e.kinds.includes('cargo'))).toBe(true);
});

it('fixed-step physics with the same seed and inputs is reproducible and stays finite through a chain', () => {
  const a = sample('chain', 8), b = sample('chain', 8);
  const snapshot = (s: CollisionSandbox) => ({ events: s.events, actors: s.actors.map(actor => ({
    id: actor.id, hp: actor.hp, x: actor.body.position.x, z: actor.body.position.z,
    vx: actor.body.velocity.x, vz: actor.body.velocity.z })) });
  expect(snapshot(a)).toEqual(snapshot(b));
  expect(a.events.some(e => e.pair === 'car-a|player')).toBe(true);
  for (const actor of a.actors) for (const value of [actor.body.position.x, actor.body.position.z,
    actor.body.velocity.x, actor.body.velocity.z]) expect(Number.isFinite(value)).toBe(true);
});

it('render frame rate cannot change the fixed-step impact result, and a new run clears contacts', () => {
  const outcomes = [30, 60, 120].map(fps => {
    const sandbox = new CollisionSandbox('traffic', 17);
    let accumulator = 0;
    for (let frame = 0; frame < fps * 6; frame++) {
      accumulator += 1 / fps;
      while (accumulator + 1e-10 >= 1 / 60) { sandbox.step(idle); accumulator -= 1 / 60; }
    }
    return { hp: sandbox.player.hp, impacts: sandbox.totalImpacts,
      distance: sandbox.player.body.position.z };
  });
  expect(outcomes[1]).toEqual(outcomes[0]); expect(outcomes[2]).toEqual(outcomes[0]);
  const restarted = new CollisionSandbox('traffic', 17);
  expect(restarted.totalImpacts).toBe(0);
  expect(restarted.player.hp).toBe(restarted.player.maxHp);
});
