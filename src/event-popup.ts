import { popupCaptions } from './popup-events';
import type { Run } from './survival';
const popupDurationMs = 3000;
/** One replaceable toast. Wall-clock expiry keeps terminal/paused events finite too. */
export class EventPopup {
 readonly root=document.createElement('aside');
 private image=document.createElement('img');
 private caption=document.createElement('strong');
 private runId='';private sequence=0;private until=0;
 constructor(private game:HTMLElement,private resultPanel:HTMLElement){
  this.root.id='event-popup';this.root.hidden=true;
  this.root.setAttribute('role','status');this.root.setAttribute('aria-live','polite');this.root.setAttribute('aria-atomic','true');
  const art=document.createElement('div');art.className='event-popup-art';this.image.alt='';this.image.draggable=false;
  art.append(this.image);this.root.append(art,this.caption);game.append(this.root);
 }
 update(run:Run,now:number,enabled=true):void {
  if(this.runId!==run.runId){this.runId=run.runId;this.sequence=0;this.until=0;this.root.hidden=true;}
  const event=run.popupEvent;
  if(run.phase==='ready'){this.root.hidden=true;return;}
  if(event && event.sequence!==this.sequence){
   this.sequence=event.sequence;this.until=now+popupDurationMs;
   this.image.src='/ui/event-popups/'+event.kind+'.png';this.caption.textContent=popupCaptions[event.kind];
   this.root.dataset.kind=event.kind;
  }
  this.root.hidden=!enabled || !event || now>=this.until;
  const terminal=run.phase==='ended';this.root.dataset.terminal=String(terminal);
  const host=terminal?this.resultPanel:this.game;
  if(this.root.parentElement!==host){if(terminal)host.prepend(this.root);else host.append(this.root);}
 }
 dispose():void{this.root.remove();}
}
