import { expect, it } from 'vitest';
import { noInput } from '../src/simulation';
import { initialRun, stepRun, type Run } from '../src/survival';
import { terminalElapsed, terminalSceneSeconds, terminalVisualRun } from '../src/terminal-visuals';
import { entity } from '../src/world';

it('keeps the result and gameplay frozen while traffic, train and cargo continue visually', () => {
  const base = initialRun(17);
  const car = entity('traffic', 'car', 20, 0); car.speed = 6;
  const train = entity('train', 'train', 25, 0);
  train.crossMotion = { type: 'linear', origin: 0, velocity: 4, startedAt: 0, min: -10, max: 10 };
  const cargo = entity('cargo', 'cargo', 30, 0); cargo.speed = -3; cargo.cargoVelocityX = 1;
  const run: Run = { ...base, phase: 'ended', speed: 0, activeSeconds: 0,
    result: { runId: base.runId, seed: base.seed, config: 'test', scoreVersion: 'hybrid-v2',
      reason: 'damage', distance: 10, score: 25, money: 50, seconds: 0 },
    distance: 10, score: 25, money: 50,
    world: { ...base.world, entities: [car, train, cargo] } };
  const scene = terminalVisualRun(run, 1);
  expect(scene.phase).toBe('running');
  expect(scene.world.entities[0].distance).toBeCloseTo(26);
  expect(scene.world.entities[1].distance).toBeCloseTo(25);
  expect(scene.world.entities[2].distance).toBeCloseTo(27);
  expect(scene.world.entities[1].x).toBe(4);
  expect(scene.world.entities[2].x).toBeCloseTo(1);
  expect(scene.result).toBe(run.result);
  expect(scene.distance).toBe(run.distance);
  expect(scene.score).toBe(run.score);
  expect(scene.money).toBe(run.money);
  expect(run.world.entities.map(e => e.distance)).toEqual([20, 25, 30]);
  expect(stepRun(run, noInput())).toBe(run);
});

it('waits two visible seconds and never skips the ending after a hidden-tab gap', () => {
  let elapsed = 0;
  elapsed = terminalElapsed(elapsed, 10, false);
  expect(elapsed).toBe(0);
  elapsed = terminalElapsed(elapsed, 10, true);
  expect(elapsed).toBeCloseTo(.1);
  for (let i = 0; i < 114; i++) elapsed = terminalElapsed(elapsed, 1 / 60, true);
  expect(elapsed).toBeLessThan(terminalSceneSeconds);
  for (let i = 0; i < 6; i++) elapsed = terminalElapsed(elapsed, 1 / 60, true);
  expect(elapsed).toBe(terminalSceneSeconds);
});
