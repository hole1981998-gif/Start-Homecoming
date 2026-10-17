// @vitest-environment jsdom
import { expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { RoadHud } from '../src/road-hud';
import { balance } from '../src/config';
import { initialRun, type Run } from '../src/survival';
import { entity } from '../src/world';

function setup() {
  document.body.innerHTML = new DOMParser().parseFromString(readFileSync('index.html', 'utf8'), 'text/html').body.innerHTML;
  return new RoadHud(document.getElementById('world-cues')!);
}
it('spatial warnings choose imminent objects, preserve hazard priority and never mutate a run', () => {
  const hud = setup();
  const run: Run = { ...initialRun(), phase: 'running' };
  run.world.entities = [entity('water', 'near', 35, 3.2), entity('pothole', 'far', 120, 0), entity('fuel', 'fuel', 40, 3.2)];
  const snapshot = structuredClone(run);
  const projection = { project: () => ({ x: 120, y: -20 }) };
  hud.update(run, projection, true);
  const water = document.querySelector<HTMLElement>('[data-kind="water"]')!;
  expect(water.hidden).toBe(false); expect(water.getAttribute('aria-label')).toContain('phải · 35 m');
  expect(water.style.left).toBe('91%'); expect(water.style.top).toBe('24%');
  expect(document.querySelector<HTMLElement>('[data-kind="fuel"]')!.hidden).toBe(true);
  expect(document.querySelector<HTMLElement>('[data-kind="pothole"]')!.hidden).toBe(true);
  expect(run).toEqual(snapshot);
  hud.update({ ...run, phase: 'paused' }, projection, false);
  expect(water.hidden).toBe(true);
});
it('disabling flavor keeps numeric consequences; expired/restarted feedback clears; coast stays readable', () => {
  const hud = setup(), projection = { project: () => ({ x: 50, y: 40 }) };
  const run: Run = { ...initialRun(), phase: 'running', feedbackKind: 'pothole', feedbackAt: 0, activeSeconds: 1,
    feedback: 'Ổ gà · −12 HP · −10.0 tiền', motion: 'coasting', coastRemaining: 18 };
  hud.update(run, projection, false);
  expect(document.getElementById('impact-value')!.textContent).toContain('−12 HP');
  expect(document.getElementById('impact-flavor')!.textContent).toBe('');
  expect(document.getElementById('coast-cue')!.textContent).toBe('Trôi 18 m');
  hud.update(run, projection, true);
  expect(document.getElementById('impact-flavor')!.textContent).toBe('OH MY XE!');
  hud.update({ ...run, activeSeconds: 3 }, projection, true);
  expect(document.getElementById('impact-cue')!.hidden).toBe(true);
  hud.update(initialRun(), projection, true);
  expect(document.getElementById('feedback')!.textContent).toBe('');
  expect(document.getElementById('coast-cue')!.hidden).toBe(true);
});
it('oncoming warning appears earlier and exposes direction without relying on colour', () => {
  const hud = setup(), projection = { project: () => ({ x: 50, y: 40 }) };
  const car = entity('traffic', 'car', 85, -3.2); car.speed = -6;
  const run: Run = { ...initialRun(), phase: 'running', speed: 20, world: { ...initialRun().world, entities: [car] } };
  hud.update(run, projection, true);
  const cue = document.querySelector<HTMLElement>('[data-kind="traffic"]')!;
  expect(cue.hidden).toBe(false); expect(cue.getAttribute('aria-label')).toContain('ngược chiều');
  expect(cue.getAttribute('aria-label')).toContain('Xe nhỏ');
  expect(cue.querySelector('.traffic-direction')!.textContent).toBe('↓');
  hud.update({ ...run, world: { ...run.world, entities: [{ ...car, x: 3.2, speed: 6 }] } }, projection, true);
  expect(cue.hidden).toBe(true);
});
it('traffic warning names the seeded vehicle variety', () => {
  const hud = setup(), projection = { project: () => ({ x: 50, y: 40 }) };
  const truck = entity('traffic', 'truck', 50, 0); truck.trafficKind = 'truck'; truck.speed = -6;
  const run: Run = { ...initialRun(), phase: 'running', world: { ...initialRun().world, entities: [truck] } };
  hud.update(run, projection, true);
  expect(document.querySelector<HTMLElement>('[data-kind="traffic"]')!.getAttribute('aria-label')).toContain('Xe tải');
});
it('crash return cue shows remaining protection time and clears on restart', () => {
  const hud = setup(), projection = { project: () => ({ x: 50, y: 40 }) };
  const run: Run = { ...initialRun(), phase: 'running', crash: { elapsed: 1, side: 1, originDistance: 0, originX: 0,
    impactSpeed: balance.cruiseSpeed, returningRiderIds: [], strandedRiderIds: [] } };
  hud.update(run, projection, true);
  const cue = document.getElementById('crash-cue')!;
  expect(cue.hidden).toBe(false); expect(cue.getAttribute('aria-label')).toContain('miễn nhiễm');
  hud.update(initialRun(), projection, true);
  expect(cue.hidden).toBe(true);
});
it('does not invite F pickup while a kicked passenger is still locked out', () => {
  const hud = setup(), projection = { project: () => ({ x: 50, y: 40 }) };
  const person = entity('passenger', 'dropped', 0, 0); person.lastHit = 2;
  const run: Run = { ...initialRun(), phase: 'running', world: { ...initialRun().world, entities: [person] } };
  const cue = document.querySelector<HTMLElement>('[data-kind="passenger"]')!;
  hud.update(run, projection, true);
  expect(cue.hidden).toBe(true);
  hud.update({ ...run, activeSeconds: 2 }, projection, true);
  expect(cue.hidden).toBe(false);
  expect(cue.textContent).toContain('F · ĐÓN');
});
it('does not invite F pickup for a crash rider who refuses to reboard', () => {
  const hud = setup(), projection = { project: () => ({ x: 50, y: 40 }) };
  const person = entity('passenger', 'stranded', 0, 0); person.pickupable = false;
  const run: Run = { ...initialRun(), phase: 'running', world: { ...initialRun().world, entities: [person] } };
  hud.update(run, projection, true);
  expect(document.querySelector<HTMLElement>('[data-kind="passenger"]')!.hidden).toBe(true);
});
