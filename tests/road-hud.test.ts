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
  hud.update(run,{project:(x) => ({x:x>0?120:10,y:-20})});
  expect(document.querySelector('[data-kind="water"]')).toBeNull();
  expect(document.querySelector('[data-kind="traffic"]')).toBeNull();
  expect(document.querySelector('[data-kind="fuel"] .supply-badge [data-icon="fuel"]')).not.toBeNull();
  expect(document.querySelector('[data-kind="shop"] .shop-label')!.textContent).toBe('CỬA HÀNG');
  expect(document.querySelector<HTMLElement>('[data-kind="shop"] .shop-key')!.hidden).toBe(true);
  expect(document.querySelector('[data-kind="shop"] [data-icon]')).toBeNull();
  const fuel=document.querySelector<HTMLElement>('[data-kind="fuel"]')!;
  expect(fuel.hidden).toBe(false);expect(fuel.style.left).toBe('120%');expect(fuel.style.top).toBe('-20%');
  expect([...document.querySelectorAll<HTMLElement>('.world-cue')].map(n=>n.dataset.kind)).toEqual(['fuel','repair','shop']);
  expect(run).toEqual(before);
  hud.update({...run,phase:'paused'},{project:()=>({x:50,y:40})});expect(fuel.hidden).toBe(true);
});
it('shows a separate R key only when the shop can actually be entered', () => {
  const hud = setup(), projection = { project: () => ({ x: 50, y: 40 }) };
  const shop = entity('shop', 'shop-near', 20, 0);
  shop.shopStock = { vehicles: [], items: { nitro: 0, star: 0, grab: 0, banana: 0 } };
  const run: Run = { ...initialRun(), phase: 'running', distance: 10,
    world: { ...initialRun().world, entities: [shop] } };
  const cue = document.querySelector<HTMLElement>('[data-kind="shop"]')!;
  const key = cue.querySelector<HTMLElement>('.shop-key')!;
  hud.update(run, projection);
  expect(key.hidden).toBe(false);
  expect(key.textContent).toBe('R');
  expect(cue.querySelector('.shop-label')!.textContent).toBe('CỬA HÀNG');
  expect(cue.querySelector('.shop-distance')!.textContent).toBe('10 m');
  expect(cue.getAttribute('aria-label')).toContain('bấm R để ghé');
  hud.update({ ...run, x: 3.2 }, projection);
  expect(key.hidden).toBe(true);
  expect(cue.getAttribute('aria-label')).not.toContain('bấm R');
});
it('never shows floating action prompts for passengers, officers, trains or cargo', () => {
 const hud=setup(),projection={project:()=>({x:50,y:40})};
 const run:Run={...initialRun(),phase:'running',inventory:['banana',null]};
 for(const kind of ['passenger','police','militia','train','traffic'] as const){
  const target=entity(kind,'target',0,0);target.cargoReleaseAt=1;
  run.world.entities=[target];hud.update(run,projection);
  expect(document.getElementById('road-action')).toBeNull();
 }
});
it('keeps consequences in live text and resource HUD without visual impact popups', () => {
  const hud = setup(), projection = { project: () => ({ x: 50, y: 40 }) };
  const run: Run = { ...initialRun(), phase: 'running', feedbackKind: 'pothole', feedbackAt: 0, activeSeconds: 1,
    feedback: 'Ổ gà · −12 HP · −10.0 tiền', motion: 'coasting', coastRemaining: 18 };
  hud.update(run, projection);
  expect(document.getElementById('impact-cue')!.hidden).toBe(true);
  expect(document.getElementById('impact-value')!.textContent).toBe('');
  expect(document.getElementById('impact-flavor')!.textContent).toBe('');
  expect(document.getElementById('coast-cue')!.textContent).toBe('Trôi 18 m');
  hud.update(run, projection);
  expect(document.getElementById('impact-flavor')!.textContent).toBe('');
  expect(document.getElementById('impact-cue')!.hidden).toBe(true);
  hud.update({ ...run, activeSeconds: 3 }, projection);
  expect(document.getElementById('impact-cue')!.hidden).toBe(true);
  hud.update(initialRun(), projection);
  expect(document.getElementById('feedback')!.textContent).toBe('');
  expect(document.getElementById('coast-cue')!.hidden).toBe(true);
});
it('crash return cue shows remaining protection time and clears on restart', () => {
  const hud = setup(), projection = { project: () => ({ x: 50, y: 40 }) };
  const run: Run = { ...initialRun(), phase: 'running', crash: { elapsed: 1, side: 1, originDistance: 0, originX: 0,
    impactSpeed: balance.cruiseSpeed, returningRiderIds: [], strandedRiderIds: [] } };
  hud.update(run, projection);
  const cue = document.getElementById('crash-cue')!;
  expect(cue.hidden).toBe(false); expect(cue.getAttribute('aria-label')).toContain('miễn nhiễm');
  hud.update(initialRun(), projection);
  expect(cue.hidden).toBe(true);
});

it('grows supply tags as the player approaches without mutating the run',()=>{
 const hud=setup(),projection={project:()=>({x:50,y:40})};
 const run:Run={...initialRun(),phase:'running',world:{...initialRun().world,entities:[entity('fuel','f',35,0)]}};
 const cue=document.querySelector<HTMLElement>('[data-kind="fuel"]')!;
 const before=structuredClone(run);hud.update(run,projection);
 const far=Number(cue.style.getPropertyValue('--cue-scale'));
 hud.update({...run,speed:25},projection);expect(Number(cue.style.getPropertyValue('--cue-scale'))).toBe(far);
 hud.update({...run,distance:30},projection);const near=Number(cue.style.getPropertyValue('--cue-scale'));
 expect(near).toBeGreaterThan(far);expect(near).toBeLessThanOrEqual(1);expect(run).toEqual(before);
});

it('shows distant tags and follows the road projection continuously regardless of speed',()=>{
 const hud=setup(),run:Run={...initialRun(),phase:'running',speed:0,
  world:{...initialRun().world,entities:[entity('fuel','far-fuel',110,0)]}};
 const cue=document.querySelector<HTMLElement>('[data-kind="fuel"]')!;
 const projection={project:(_x:number,_y:number,z:number)=>({x:50,y:70+z/3})};
 hud.update(run,projection);expect(cue.hidden).toBe(false);
 const farY=parseFloat(cue.style.top),farScale=Number(cue.style.getPropertyValue('--cue-scale'));
 hud.update({...run,distance:50},projection);
 expect(parseFloat(cue.style.top)).toBeGreaterThan(farY);
 expect(Number(cue.style.getPropertyValue('--cue-scale'))).toBeGreaterThan(farScale);
 hud.update({...run,speed:30},projection);expect(parseFloat(cue.style.top)).toBe(farY);
});
