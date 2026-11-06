import { expect, it } from 'vitest';
import { noInput } from '../src/simulation';
import { initialRun, stepRun } from '../src/survival';
import { entity } from '../src/world';

it('keeps separate sound events when water and a pothole touch in the same simulation tick', () => {
  const base = initialRun(17, 'audio-contact');
  const water = entity('water', 'water-a', base.distance + 1, 0);
  const pothole = entity('pothole', 'pothole-a', base.distance + 1, 0);
  const world = { ...base.world, entities: [water, pothole], nextHazard: 1e9, nextSpecial: 1e9,
    nextFuel: 1e9, nextRepair: 1e9, nextPassenger: 1e9, nextShopDistance: 1e9 };
  const start = { ...base, phase: 'running' as const, world };
  const next = stepRun(start, noInput());
  expect(next.audioEvents.map(event => event.kind)).toEqual(['pothole', 'water']);
  expect(next.audioEvents.map(event => event.id)).toEqual([1, 2]);
  expect(next.audioEvents.map(event => event.entityId)).toEqual(['pothole-a', 'water-a']);
  expect(stepRun(next, noInput()).audioEvents).toEqual(next.audioEvents);
});
