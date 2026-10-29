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
it('renders only supply tags and leaves hazards in the world without mutating simulation', () => {
  const hud=setup(), run: Run={...initialRun(),phase:'running'};
  run.world.entities=[entity('water','water',35,3.2),entity('traffic','car',25,0),entity('fuel','fuel',40,3.2),entity('repair','repair',30,-3.2),entity('shop','shop',30,3.2)];
  const before=structuredClone(run);
  hud.update(run,{project:(x) => ({x:x>0?120:10,y:-20})},true);
  expect(document.querySelector('[data-kind="water"]')).toBeNull();
  expect(document.querySelector('[data-kind="traffic"]')).toBeNull();
  const fuel=document.querySelector<HTMLElement>('[data-kind="fuel"]')!;
  expect(fuel.hidden).toBe(false);expect(fuel.style.left).toBe('91%');expect(fuel.style.top).toBe('32%');
  expect([...document.querySelectorAll<HTMLElement>('.world-cue')].map(n=>n.dataset.kind)).toEqual(['fuel','repair','shop']);
  expect(run).toEqual(before);
  hud.update({...run,phase:'paused'},{project:()=>({x:50,y:40})},false);expect(fuel.hidden).toBe(true);
});
it('keeps essential train and banana actions without reinstating obstacle tags', () => {
 const hud=setup(), train=entity('train','t',15,0), projection={project:()=>({x:50,y:40})};
 const run: Run={...initialRun(),phase:'running',world:{...initialRun().world,entities:[train]}};
 hud.update(run,projection,false);expect(document.getElementById('road-action')!.textContent).toContain('TÀU');
 expect(document.querySelector('[data-kind="train"]')).toBeNull();
 const officer=entity('police','p',10,0);run.world.entities=[officer];run.inventory=['banana',null];
 hud.update(run,projection,false);expect(document.getElementById('road-action')!.textContent).toBe('1 · DÙNG CHUỐI');
 expect(document.querySelector('[data-kind="police"]')).toBeNull();
});
it('shows pickup action only for a reachable, unlocked, willing passenger', () => {
 const hud=setup(),person=entity('passenger','p',0,0), projection={project:()=>({x:50,y:40})};
 const run: Run={...initialRun(),phase:'running',world:{...initialRun().world,entities:[person]}};
 const cue=document.getElementById('road-action')!;
 person.lastHit=2;hud.update(run,projection,false);expect(cue.hidden).toBe(true);
 run.activeSeconds=2;hud.update(run,projection,false);expect(cue.textContent).toContain('F · ĐÓN');expect(cue.hidden).toBe(false);
 person.pickupable=false;hud.update(run,projection,false);expect(cue.hidden).toBe(true);
 person.pickupable=true;person.x=8;hud.update(run,projection,false);expect(cue.hidden).toBe(true);
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
