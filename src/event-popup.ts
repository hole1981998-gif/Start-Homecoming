import { popupCaptions } from './popup-events';
import type { Run } from './survival';
const popupDurationMs = 3000;
const popupFadeMs = 700;
/** One replaceable toast. Wall-clock expiry keeps terminal/paused events finite too. */
export class EventPopup {
 readonly root=document.createElement('aside');
 private image=document.createElement('img');
 private caption=document.createElement('strong');
 private loss=document.createElement('span');
 private runId='';private sequence=0;private until=0;
 constructor(private game:HTMLElement,private resultPanel:HTMLElement){
  this.root.id='event-popup';this.root.hidden=true;
  this.root.setAttribute('role','status');this.root.setAttribute('aria-live','polite');this.root.setAttribute('aria-atomic','true');
  const art=document.createElement('div');art.className='event-popup-art';this.image.alt='';this.image.draggable=false;
  art.append(this.image);this.root.append(art,this.caption);this.loss.className='popup-money-loss';this.loss.hidden=true;this.root.append(this.loss);game.append(this.root);
 }
 update(run:Run,now:number,enabled=true):void {
  if(this.runId!==run.runId){this.runId=run.runId;this.sequence=0;this.until=0;this.root.hidden=true;}
  const event=run.popupEvent;
  if(run.phase==='ready'){this.root.hidden=true;return;}
  if(event && event.sequence!==this.sequence){
   this.sequence=event.sequence;this.until=now+popupDurationMs;
   this.image.src='/ui/event-popups/'+event.kind+'.png';
   this.caption.textContent=popupCaptions[event.kind];
   this.root.dataset.kind=event.kind;
   this.loss.hidden=event.moneyLoss===undefined;this.loss.textContent=event.moneyLoss===undefined?'':'−'+new Intl.NumberFormat('vi-VN',{maximumFractionDigits:1}).format(event.moneyLoss)+' tiền';
   this.root.dataset.pulse=String(event.sequence%2);
  }
  this.root.hidden=!enabled || !event || now>=this.until;
  this.root.style.opacity=String(Math.max(0,Math.min(1,(this.until-now)/popupFadeMs)));
  const terminal=run.phase==='ended' && !this.resultPanel.parentElement?.hidden;
  this.root.dataset.terminal=String(terminal);
  const host=terminal?this.resultPanel:this.game;
  if(this.root.parentElement!==host){if(terminal)host.prepend(this.root);else host.append(this.root);}
 }
 dispose():void{this.root.remove();}
}
