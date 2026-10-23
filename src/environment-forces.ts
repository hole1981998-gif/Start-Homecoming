import { balance, forceBalance } from './config';
import { hasStar } from './items';
import type { Run } from './survival';
import type { State } from './simulation';
import { sweptContact, type Entity } from './world';

/** Stateless bounded displacement: no hidden impulse survives a pause, immunity or zone exit. */
export function environmentalPush(before: Run, driven: State, entities: Entity[], dt: number, width: number, length: number): { x: number; push: number } {
  if(before.phase!=='running'||before.crash||hasStar(before)||before.activeSeconds<before.replacementProtectedUntil)return{x:driven.x,push:0};
  const push=windPush(before.x,before.distance,driven.x,driven.distance,width,length,entities);
  return{x:roadX(driven.x+push*dt,width),push};
}

const roadX=(x:number,width:number):number=>{
  const bound=(balance.laneWidth*balance.laneCount-width)/2;
  return Math.max(-bound,Math.min(bound,x));
};

/** Wind applies to moving traffic too. Water has its original fuel/speed rules only. */
export function windPush(fromX:number,fromDistance:number,toX:number,toDistance:number,width:number,length:number,entities:Entity[]):number {
  let push=0;
  for(const e of entities) {
    if(e.kind!=='wind'||!e.lateralPush||e.consumed)continue;
    const contact=sweptContact(fromX-e.x,fromDistance-e.distance,toX-e.x,toDistance-e.distance,
      (width+e.width)/2,(length+e.length)/2);
    if(contact)push+=e.lateralPush*(contact[1]-contact[0]);
  }
  return Math.max(-forceBalance.maxPush,Math.min(forceBalance.maxPush,push));
}

/** Set each mobile traffic endpoint before the existing swept collision timeline resolves impacts. */
export function pushTrafficWithWind(entities:Entity[],previous:Entity[],dt:number):void {
  if(!entities.some(e=>e.kind==='wind'&&!e.consumed&&e.lateralPush))return;
  for(const car of entities) {
    if(car.kind!=='traffic'||car.consumed||car.wrecked||car.speed===0||car.trafficMotion==='stopped'||car.trafficStoppedByCollision)continue;
    const old=previous.find(e=>e.id===car.id);
    if(!old)continue;
    const pushed=windPush(old.x,old.distance,car.x,car.distance+car.speed*dt,car.width,car.length,entities);
    car.x=roadX(car.x+pushed*dt,car.width);
  }
}
