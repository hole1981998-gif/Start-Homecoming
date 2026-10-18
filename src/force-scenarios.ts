import { forceBalance as c } from './config';
import { entity, type Entity } from './world';
import type { Run } from './survival';
export const forceScenarios = [
 ['p62-wind-right','Gió sang phải'],['p62-wind-left','Gió sang trái'],['p62-water-baseline','Nước thường · không đẩy'],
 ['p62-mixed','Hai vùng gió ngược hướng'],['p62-star','Star trong vùng gió'],['p62-crash','Ngã trong vùng gió'],
 ['p62-coast','Hết xăng trong gió'],['p62-traffic','Xe chướng ngại trong gió']
] as const;
export function forceScenario(run:Run,name:string):Run {
 const selected=name==='p62-current-right'||name==='p62-current-left'?'p62-water-baseline':name;
 const spec=forceScenarios.find(s=>s[0]===selected)??forceScenarios[0];
 const water=selected==='p62-water-baseline',sign=selected.endsWith('left')?-1:1;
 const zone=entity(water?'water':'wind','p62-zone',c.zoneStart+c.zoneLength/2,0);
 zone.width=c.windWidth;zone.length=c.zoneLength;
 if(!water)zone.lateralPush=sign*c.windPush;
 zone.displayName=spec[1];zone.help=water?'Vũng nước chỉ có hao xăng và giảm tốc như trước; lực đẩy ngang của nước đang tạm dừng.':
  'Vùng gió màu xanh có ranh giới; mũi tên báo hướng. A/D bù lực; xe đang chạy cũng bị gió đẩy. Khi tài xế trở lại xe, gió tiếp tục đẩy nếu xe vẫn còn trong vùng.';
 const entities:Entity[]=[zone];
 if(name==='p62-mixed') {const next={...zone,id:'p62-opposite',distance:zone.distance+80,lateralPush:-c.windPush,displayName:'Gió ngược hướng'};entities.push(next);}
 if(name==='p62-crash') {const car=entity('traffic','p62-hit',58,1.2);car.speed=0;car.baseSpeed=0;entities.push(car);}
 if(name==='p62-traffic') {const car=entity('traffic','p62-wind-car',100,-2.8);car.speed=-4;car.baseSpeed=-4;entities.push(car);}
 return {...run,inventory:['star','nitro'],fuel:name==='p62-coast'?.23:run.fuel,
  world:{...run.world,integrated:false,prototype:{version:'p62-forces-2',title:spec[1],description:zone.help},entities,
    nextHazard:1e9,nextSpecial:1e9,nextFuel:1e9,nextRepair:1e9,nextPassenger:1e9,nextShopDistance:1e9}};
}
