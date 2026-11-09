// @vitest-environment jsdom
import { expect,it } from 'vitest';
import { existsSync } from 'node:fs';
import { EventPopup } from '../src/event-popup';
import { popupCaptions,withPopup } from '../src/popup-events';
import { initialRun,type Run } from '../src/survival';
it('replaces immediately, expires after 2.5 wall-clock seconds without refreshing on frames, and resets per run',()=>{
 document.body.innerHTML='<div id="game"></div><div id="result"></div>';
 const game=document.getElementById('game')!,result=document.getElementById('result')!;
 const view=new EventPopup(game,result);
 const run:Run={...initialRun(17),phase:'running'};
 const pickup=withPopup(run,'pickup');view.update(pickup,100);
 expect(view.root.hidden).toBe(false);expect(view.root.textContent).toBe('ĐÓN KHÁCH');
 view.update(pickup,2599);expect(view.root.hidden).toBe(false);
 const drop=withPopup(pickup,'drop');view.update(drop,2600);
 expect(view.root.textContent).toBe('CHIM CÚC!');
 expect(game.querySelectorAll('#event-popup')).toHaveLength(1);
 view.update({...drop,phase:'paused'},5099);expect(view.root.hidden).toBe(false);
 view.update(drop,5100);expect(view.root.hidden).toBe(true);
 const terminal=withPopup({...drop,phase:'ended' as const},'train');view.update(terminal,7000);
 expect(view.root.parentElement).toBe(result);expect(view.root.hidden).toBe(false);
 view.update(terminal,9500);expect(view.root.hidden).toBe(true);
 view.update(initialRun(18),10001);expect(view.root.hidden).toBe(true);
 view.update(withPopup({...initialRun(18),phase:'running'},'star'),10002);
 expect(view.root.parentElement).toBe(game);expect(view.root.textContent).toBe('SUPERSTAR!!!');
 view.update(withPopup({...initialRun(18),phase:'running'},'nitro'),10003,false);expect(view.root.hidden).toBe(true);
 view.dispose();expect(document.getElementById('event-popup')).toBeNull();
});
it('ships the owner illustrations for every supported event',()=>{
 for(const kind of Object.keys(popupCaptions))expect(existsSync('public/ui/event-popups/'+kind+'.png'),kind).toBe(true);
});

it('shows immediately, fades smoothly in the final 700ms, and replaces a fading event at full opacity',()=>{
 document.body.innerHTML='<div id="game"></div><div id="result"></div>';
 const view=new EventPopup(document.getElementById('game')!,document.getElementById('result')!);
 const first=withPopup({...initialRun(17),phase:'running' as const},'pickup');
 view.update(first,100);expect(view.root.style.opacity).toBe('1');
 view.update(first,1900);expect(view.root.style.opacity).toBe('1');
 view.update({...first,phase:'paused'},2250);expect(Number(view.root.style.opacity)).toBeCloseTo(.5);expect(view.root.hidden).toBe(false);
 const next=withPopup(first,'drop');view.update(next,2300);expect(view.root.style.opacity).toBe('1');
 view.update(next,4799);expect(Number(view.root.style.opacity)).toBeGreaterThan(0);expect(Number(view.root.style.opacity)).toBeLessThan(.01);
 view.update(next,4800);expect(view.root.hidden).toBe(true);expect(view.root.style.opacity).toBe('0');view.dispose();
});

it('shows the actual fine beneath the art and clears it for subsequent unrelated feedback',()=>{
 document.body.innerHTML='<div id="game"></div><div id="result"></div>';
 const view=new EventPopup(document.getElementById('game')!,document.getElementById('result')!);
 const run=withPopup({...initialRun(17),phase:'running' as const},'militia');run.popupEvent!.moneyLoss=37.5;
 view.update(run,0);expect(view.root.querySelector('.popup-money-loss')!.textContent).toBe('−37,5 tiền');
 view.update(withPopup(run,'pickup'),10);expect((view.root.querySelector('.popup-money-loss') as HTMLElement).hidden).toBe(true);view.dispose();
});
