// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { expect, it, vi } from 'vitest';
import type { Run } from '../src/survival';
const drawn = vi.hoisted(() => ({ run: undefined as Run | undefined }));
vi.mock('../src/render', () => ({ RoadRenderer: class {
  setLowEffects() {} draw(run: Run) { drawn.run = run; } project() { return {x:50,y:40}; } dispose() {}
} }));
it('introduces each held item once, pauses safely, then never repeats on use or restart', async () => {
  document.body.innerHTML = new DOMParser().parseFromString(readFileSync('index.html','utf8'),'text/html').body.innerHTML;
  history.replaceState({},'', '/?scenario=items&seed=17'); localStorage.clear();
  localStorage.setItem('dvn.discovery.v2','["obstacles"]');
  vi.spyOn(document,'hasFocus').mockReturnValue(true);
  let now=0, frame: FrameRequestCallback=()=>{};
  vi.stubGlobal('performance',{now:()=>now}); vi.stubGlobal('requestAnimationFrame',(cb:FrameRequestCallback)=>{frame=cb;return 1;});
  await import('../src/main');
  const node=(id:string)=>document.getElementById(id) as HTMLElement;
  const tick=(seconds:number)=>{for(let i=0;i<seconds*60;i++){now+=1000/60;frame(now);}};
  const key=(code:string)=>window.dispatchEvent(new KeyboardEvent('keydown',{code,bubbles:true}));
  node('play').click();tick(.1);expect(node('modal-title').textContent).toBe('Nitro');
  const distance=drawn.run!.distance,fuel=drawn.run!.fuel;
  key('Digit1');tick(3);expect(drawn.run!.distance).toBe(distance);expect(drawn.run!.fuel).toBe(fuel);
  expect(drawn.run!.inventory[0]).toBe('nitro');
  node('play').click();tick(.1);expect(node('modal-title').textContent).toBe('Ngôi sao');
  node('play').click();tick(.1);expect(node('modal').hidden).toBe(true);
  key('Digit1');tick(.1);key('Digit2');tick(.1);expect(node('modal').hidden).toBe(true);
  expect(drawn.run!.inventory).toEqual([null,null]);
  node('restart').click();node('play').click();tick(.1);expect(node('modal').hidden).toBe(true);
  expect(JSON.parse(localStorage.getItem('dvn.discovery.v2')!)).toEqual(['obstacles','nitro','star']);
  window.dispatchEvent(new Event('pagehide'));vi.unstubAllGlobals();vi.restoreAllMocks();history.replaceState({},'','/');
});
