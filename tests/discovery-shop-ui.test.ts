// @vitest-environment jsdom
import {readFileSync} from 'node:fs';
import {expect,it,vi} from 'vitest';
import {renderItemSlots} from '../src/ui-icons';
vi.mock('../src/render',()=>({RoadRenderer:class{setLowEffects(){} draw(){} project(){return {x:50,y:40};}dispose(){}}}));
it('marks only occupied slots, without moving the other slot when one item is used',()=>{
 const host=document.createElement('div');renderItemSlots(host,['nitro','star'],[0,0],[]);
 expect(host.querySelector('[data-slot="0"]')?.getAttribute('data-item')).toBe('nitro');
 renderItemSlots(host,[null,'star'],[0,0],[]);
 expect(host.querySelector('[data-slot="0"]')?.hasAttribute('data-item')).toBe(false);
 expect(host.querySelector('[data-slot="1"]')?.getAttribute('data-item')).toBe('star');
});
it('introduces the first shop before entry and waits for explicit dismissal while simulation stays frozen',async()=>{
 document.body.innerHTML=new DOMParser().parseFromString(readFileSync('index.html','utf8'),'text/html').body.innerHTML;
 history.replaceState({},'','/?scenario=shop&seed=17');localStorage.clear();vi.spyOn(document,'hasFocus').mockReturnValue(true);
 let now=0,frame:FrameRequestCallback=()=>{};
 vi.stubGlobal('performance',{now:()=>now});vi.stubGlobal('requestAnimationFrame',(cb:FrameRequestCallback)=>{frame=cb;return 1;});
 await import('../src/main');
 const node=(id:string)=>document.getElementById(id) as HTMLElement;
 const tick=(n:number)=>{for(let i=0;i<n;i++){now+=1000/60;frame(now);}};
 node('play').click();tick(1);expect(node('modal-title').textContent).toBe('Ghé cửa hàng tiếp tế nhé');
 expect(node('modal-description').textContent).toContain('bấm R');const distance=node('distance').textContent;
 tick(900);expect(node('distance').textContent).toBe(distance);expect(node('play').textContent).toBe('Đã hiểu · tiếp tục');
 node('play').click();tick(1);expect(node('modal').hidden).toBe(true);
 window.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyR',bubbles:true}));expect(node('shop-panel').hidden).toBe(false);
 window.dispatchEvent(new Event('pagehide'));vi.unstubAllGlobals();vi.restoreAllMocks();history.replaceState({},'','/');
});
