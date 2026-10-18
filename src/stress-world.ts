import { balance, stressBalance as c } from './config';
import { entity, type World, type Entity } from './world';
import { vehicles, trafficTypes, type VehicleDefinition, type VehicleKind } from './vehicles';
import { movingEvent } from './moving-events';

/** Additive DEV stress stream: no fairness/corridor/balance claims. Never enabled by a normal run. */
export function fillStressWorld(w: World, ahead: number, now: number, distance: number, player: VehicleDefinition): void {
  w.nextStress ??= 0;
  const roster = Object.keys(vehicles) as VehicleKind[];
  while(c.first+w.nextStress*c.gap<=ahead) {
    const index=w.nextStress++, at=c.first+index*c.gap;
    if(at<distance-12) continue;
    const id='stress-'+w.branchId+'-'+index;
    const hash=(Math.imul(w.branchSeed^index,1664525)+1013904223)>>>0;
    for(let i=0;i<c.trafficPerStation;i++) {
      const kind=roster[(index*c.trafficPerStation+i)%roster.length];
      const lane=((hash>>> (i*3))%3)-1;
      const car=entity('traffic',id+'-car-'+i,at+i*8,lane*balance.laneWidth);
      car.trafficKind=kind;car.width=vehicles[kind].width;car.length=vehicles[kind].length;car.hp=trafficTypes[kind].hp;
      car.speed=lane<0?-trafficTypes[kind].speed:lane>0?trafficTypes[kind].speed:(hash&1?1:-1)*trafficTypes[kind].speed;
      car.baseSpeed=car.speed;car.fuel=index%9===0&&i===0?.004:vehicles[kind].fuelCapacity;car.trafficMotion='powered';
      w.entities.push(car);
    }
    if(index%2===0) {
      const patch=entity(index%4===0?'pothole':'water',id+'-patch',at+10,0);
      patch.width=[1.5,5.7,9.6][Math.floor(index/2)%3];patch.length=[4,20,35][Math.floor(index/2)%3];
      patch.x=patch.width>6?0:(hash&1?-1:1)*1.6;w.entities.push(patch);
    }
    if(index%c.specialEvery!==0) continue;
    const stage=Math.floor(index/c.specialEvery)%8;
    const kind:Entity['kind']=['police','militia','train','jam','jam','jam','accident','broken'][stage] as Entity['kind'];
    let actors:Entity[]=[];
    for(let attempt=0;attempt<100;attempt++) {
      actors=movingEvent(entity(kind,id+'-event',at+14,hash&1?-1.6:1.6),index,w.branchSeed+attempt,now,distance,player);
      if(stage<3||stage>5) break;
      const name=actors[0].displayName;
      if(stage===3&&name==='Rào sửa đường'||stage===4&&name==='Hàng rong băng đường'||stage===5&&name==='Cứu thương đổi lane')break;
    }
    if(stage===4) for(const e of actors) if(e.crossMotion) e.crossMotion.startedAt=now;
    w.entities.push(...actors);
  }
}
