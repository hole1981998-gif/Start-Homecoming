import {expect,it} from 'vitest';
import {initialRun,pickUpPassenger,dropPassenger,stepRun,type Run} from '../src/survival';
import {entity,initialWorld,type EntityKind} from '../src/world';
import {noInput} from '../src/simulation';
import {usePowerItem} from '../src/items';
import {newVehicle} from '../src/vehicles';
import {developmentScenario} from '../src/development';
import {feedbackPopup, type PopupKind} from '../src/popup-events';
function run(kind?:EntityKind,extra={}) : Run {
 const base=initialRun(17),obstacle=kind?{...entity(kind,'event',0,0),speed:0,eventAt:0,...extra}:null;
 return {...base,phase:'running',world:{...initialWorld(17),entities:obstacle?[obstacle]:[],nextHazard:1e9,nextFuel:1e9,nextRepair:1e9,nextPassenger:1e9,nextSpecial:1e9,nextShopDistance:1e9}};
}
it('records actual pickup/drop and successful item uses only, without changing simulation audio ids',()=>{
 const base=run('passenger');const picked=pickUpPassenger(base);expect(picked.popupEvent?.kind).toBe('pickup');
 expect(base.popupEvent).toBeUndefined();expect(pickUpPassenger(picked)).toBe(picked);
 const dropped=dropPassenger(picked);expect(dropped.popupEvent?.kind).toBe('drop');
 expect(dropped.popupEvent!.sequence).toBe(picked.popupEvent!.sequence+1);
 for(const kind of ['nitro','star','grab'] as const){
  const source={...run(),inventory:[kind,null] as Run['inventory'],grabUses:[3,0]};
  const used=usePowerItem(source,0);expect(used.popupEvent?.kind,kind).toBe(kind);
  if(kind!=='grab')expect(used.eventSequence).toBe(source.eventSequence);
 }
 const banana={...run('police',{distance:8}),inventory:['banana',null] as Run['inventory']};
 expect(usePowerItem(banana,0).popupEvent?.kind).toBe('banana');
 expect(usePowerItem({...run(),inventory:['banana',null]},0).popupEvent).toBeUndefined();
 expect(usePowerItem({...run(),phase:'paused',inventory:['star',null]},0).popupEvent).toBeUndefined();
});
it.each([
 ['police',{},'police'],['militia',{},'militia'],['pothole',{},'pothole'],
 ['cargo',{cargoType:'barrel'},'barrel'],['jam',{crossingRole:'vendor'},'vendor'],
 ['traffic',{},'accident'],['jam',{},'barrier'],['traffic',{serviceRole:'ambulance'},'ambulance'],
 ['train',{},'train'],['accident',{},'accident'],['fuel',{},'fuel'],['repair',{},'repair'],
] as [EntityKind,object,PopupKind][])('maps actual %s contact with subtype %j to %s',(kind,extra,wanted)=>{
 let source=run(kind,extra);source.fuel=1;source.durability=30;
 source=stepRun(source,noInput());expect(source.popupEvent?.kind).toBe(wanted);
});
it('records depletion including automatic replacement, and ignores water/crates',()=>{
 let source=run();source.fuel=.00001;
 const empty=stepRun(source,noInput());expect(empty.popupEvent?.kind).toBe('empty');
 source=run('pothole');source.durability=1;source.vehicleInstances.push(newVehicle('car4','spare'));
 const broken=stepRun(source,noInput());expect(broken.popupEvent?.kind).toBe('damage');
 expect(broken.activeVehicleId).toBe('spare');
 expect(feedbackPopup('water')).toBeUndefined();expect(feedbackPopup('traffic',entity('traffic','t',0,0))).toBe('accident');
 expect(feedbackPopup('cargo',{...entity('cargo','c',0,0),cargoType:'crate'})).toBeUndefined();
});

it.each(['police','militia'] as const)('records actual paid amount for %s, capped by available money',kind=>{
 const source=run(kind);source.money=3;
 const next=stepRun(source,noInput());
 expect(next.popupEvent?.kind).toBe(kind);expect(next.popupEvent?.moneyLoss).toBe(3);expect(next.money).toBeLessThan(.1);
});

it('police-last scenario confiscates both owned vehicles and ends with police illustration metadata',()=>{
 let source={...developmentScenario(initialRun(17),'events-police-last'),phase:'running' as const} as Run;
 const originalActive=source.activeVehicleId;
 for(let i=0;i<1800 && source.phase!=='ended';i++)source=stepRun(source,{...noInput(),accelerate:true});
 expect(source.phase).toBe('ended');expect(source.result?.reason).toBe('police');
 expect(source.feedbackCounts.police).toBe(2);expect(source.vehicleInstances.every(v=>v.disabled)).toBe(true);
 expect(source.vehicleInstances.some(v=>v.id===originalActive)).toBe(false);
 expect(source.popupEvent?.kind).toBe('police');expect(source.popupEvent?.moneyLoss).toBeGreaterThanOrEqual(0);
});
