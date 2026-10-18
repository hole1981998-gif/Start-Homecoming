import { balance, forceBalance, itemBalance } from './config';
import { hasStar, jumpHeight } from './items';
import type { Run } from './survival';
import type { State } from './simulation';
import { sweptContact, type Entity } from './world';

/** Stateless bounded displacement: no hidden impulse survives a pause, immunity or zone exit. */
export function environmentalPush(before: Run, driven: State, entities: Entity[], dt: number, width: number, length: number): { x: number; push: number } {
  if(before.phase!=='running'||before.crash||hasStar(before)||before.activeSeconds<before.replacementProtectedUntil)return{x:driven.x,push:0};
  let push=0;
  for(const e of entities) {
    if(!e.lateralPush||e.consumed||before.protectedEntities.includes(e.id))continue;
    if(e.kind==='water'&&jumpHeight(before)>=itemBalance.groundClearance)continue;
    const contact=sweptContact(before.x-e.x,before.distance-e.distance,driven.x-e.x,driven.distance-e.distance,
      (width+e.width)/2,(length+e.length)/2);
    if(contact)push+=e.lateralPush*(contact[1]-contact[0]);
  }
  push=Math.max(-forceBalance.maxPush,Math.min(forceBalance.maxPush,push));
  const bound=(balance.laneWidth*balance.laneCount-width)/2;
  return{x:Math.max(-bound,Math.min(bound,driven.x+push*dt)),push};
}
