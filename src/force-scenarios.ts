import { forceBalance as c } from './config';
import { entity, type Entity } from './world';
import type { Run } from './survival';
export const forceScenarios = [
 ['p62-wind-right','Gió sang phải'],['p62-wind-left','Gió sang trái'],['p62-current-right','Nước đẩy phải'],['p62-current-left','Nước đẩy trái'],
 ['p62-mixed','Hai vùng ngược hướng'],['p62-star','Star trong vùng gió'],['p62-crash','Ngã trong vùng đẩy'],['p62-coast','Hết xăng trong gió']
] as const;
export function forceScenario(run:Run,name:string):Run {
 const spec=forceScenarios.find(s=>s[0]===name)??forceScenarios[0];
 const current=name.includes('current'),sign=name.endsWith('left')?-1:1;
 const zone=entity(current?'water':'wind','p62-zone',c.zoneStart+c.zoneLength/2,0);
 zone.width=c.windWidth;zone.length=c.zoneLength;zone.lateralPush=sign*(current?c.currentPush:c.windPush);
 zone.displayName=spec[1];zone.help='Vùng màu có ranh giới; mũi tên báo hướng. A/D bù lực; 1 dùng star,2 dùng nitro rồi Space. Không đổi hướng input; ngã miễn lực. Số lực tạm để duyệt.';
 const entities:Entity[]=[zone];
 if(name==='p62-mixed') {const next={...zone,id:'p62-opposite',distance:zone.distance+80,lateralPush:-c.currentPush,kind:'water' as const,displayName:'Dòng nước ngược hướng'};entities.push(next);}
 if(name==='p62-crash') {const car=entity('traffic','p62-hit',58,1.2);car.speed=0;car.baseSpeed=0;entities.push(car);}
 return {...run,inventory:['star','nitro'],fuel:name==='p62-coast'?.23:run.fuel,
  world:{...run.world,integrated:false,prototype:{version:'p62-forces-1',title:spec[1],description:zone.help},entities,
    nextHazard:1e9,nextSpecial:1e9,nextFuel:1e9,nextRepair:1e9,nextPassenger:1e9,nextShopDistance:1e9}};
}
