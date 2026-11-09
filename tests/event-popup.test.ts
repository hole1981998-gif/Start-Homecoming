// @vitest-environment jsdom
import { expect,it } from 'vitest';
import { existsSync } from 'node:fs';
import { EventPopup } from '../src/event-popup';
import { popupCaptions,withPopup } from '../src/popup-events';
import { initialRun,type Run } from '../src/survival';
it('replaces immediately, expires after 3 wall-clock seconds without refreshing on frames, and resets per run',()=>{
 document.body.innerHTML='<div id="game"></div><div id="result"></div>';
 const game=document.getElementById('game')!,result=document.getElementById('result')!;
 const view=new EventPopup(game,result);
 const run:Run={...initialRun(17),phase:'running'};
 const pickup=withPopup(run,'pickup');view.update(pickup,100);
 expect(view.root.hidden).toBe(false);expect(view.root.textContent).toBe('ĐÓN KHÁCH');
 view.update(pickup,2999);expect(view.root.hidden).toBe(false);
 const drop=withPopup(pickup,'drop');view.update(drop,3000);
 expect(view.root.textContent).toBe('CHIM CÚC!');
 expect(game.querySelectorAll('#event-popup')).toHaveLength(1);
 view.update({...drop,phase:'paused'},5999);expect(view.root.hidden).toBe(false);
 view.update(drop,6000);expect(view.root.hidden).toBe(true);
 const terminal=withPopup({...drop,phase:'ended' as const},'train');view.update(terminal,7000);
 expect(view.root.parentElement).toBe(result);expect(view.root.hidden).toBe(false);
 view.update(terminal,10000);expect(view.root.hidden).toBe(true);
 view.update(initialRun(18),10001);expect(view.root.hidden).toBe(true);
 view.update(withPopup({...initialRun(18),phase:'running'},'star'),10002);
 expect(view.root.parentElement).toBe(game);expect(view.root.textContent).toBe('SUPERSTAR!!!');
 view.update(withPopup({...initialRun(18),phase:'running'},'nitro'),10003,false);expect(view.root.hidden).toBe(true);
 view.dispose();expect(document.getElementById('event-popup')).toBeNull();
});
it('ships the owner illustrations for every supported event',()=>{
 for(const kind of Object.keys(popupCaptions))expect(existsSync('public/ui/event-popups/'+kind+'.png'),kind).toBe(true);
});
