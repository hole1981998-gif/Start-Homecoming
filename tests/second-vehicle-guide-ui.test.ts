// @vitest-environment jsdom
import {readFileSync} from 'node:fs';
import {expect,it,vi} from 'vitest';
import type {Run} from '../src/survival';
const drawn=vi.hoisted(()=>({run:undefined as Run|undefined}));
vi.mock('../src/render',()=>({RoadRenderer:class{setLowEffects(){} draw(run:Run){drawn.run=run;}project(){return{x:50,y:40};}dispose(){}}}));
vi.mock('../src/vehicle-thumbnails',async()=>{const{vehicles}=await import('../src/vehicles');return{vehicleThumbnailSources:()=>Object.fromEntries(Object.keys(vehicles).map(k=>[k,'data:image/png;base64,'+btoa(k)]))};});
it('introduces Tab after the first successful second-vehicle purchase, returns to shop and preserves old resources on switching',async()=>{
 document.body.innerHTML=new DOMParser().parseFromString(readFileSync('index.html','utf8'),'text/html').body.innerHTML;
 history.replaceState({},'','/?scenario=shop&seed=17');localStorage.clear();localStorage.setItem('dvn.discovery.v2','["shop"]');
 vi.spyOn(document,'hasFocus').mockReturnValue(true);let now=0,frame:FrameRequestCallback=()=>{};
 vi.stubGlobal('performance',{now:()=>now});vi.stubGlobal('requestAnimationFrame',(cb:FrameRequestCallback)=>{frame=cb;return 1;});
 await import('../src/main');const node=(id:string)=>document.getElementById(id) as HTMLElement;
 const click=(s:string)=>(document.querySelector(s) as HTMLElement).click();const key=(code:string)=>window.dispatchEvent(new KeyboardEvent('keydown',{code,bubbles:true}));
 const tick=()=>{now+=1000/60;frame(now);};click('#play');tick();key('KeyR');tick();
 const original=drawn.run!.activeVehicleId;const fuel=drawn.run!.fuel;
 click('[data-tab="vehicle"]');click('[data-vehicle="tricycle"]');click('[data-confirm]');tick();
 expect(node('modal-title').textContent).toBe('Có hai xe rồi, đổi bằng Tab nhé!');expect(drawn.run!.vehicleInstances).toHaveLength(2);
 expect(node('modal-description').textContent).toContain('Khách');const newVehicle=drawn.run!.activeVehicleId;
 key('Tab');tick();expect(drawn.run!.activeVehicleId).toBe(newVehicle);
 click('#play');tick();expect(node('shop-panel').hidden).toBe(false);expect(node('modal-title').textContent).toBe('Cửa hàng ven đường');
 expect(JSON.parse(localStorage.getItem('dvn.discovery.v2')!)).toContain('switching');
 click('#play');key('Tab');tick();expect(drawn.run!.activeVehicleId).toBe(original);expect(drawn.run!.durability).toBe(30);expect(drawn.run!.fuel).toBeLessThanOrEqual(fuel);
 key('KeyR');click('[data-tab="vehicle"]');click('[data-vehicle="car4"]');click('[data-cancel]');tick();expect(node('modal-title').textContent).toBe('Cửa hàng ven đường');
 window.dispatchEvent(new Event('pagehide'));vi.unstubAllGlobals();vi.restoreAllMocks();history.replaceState({},'','/');
});
