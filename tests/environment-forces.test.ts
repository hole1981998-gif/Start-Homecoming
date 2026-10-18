import {expect,it} from 'vitest';
import {environmentalPush} from '../src/environment-forces';
import {forceBalance,balance} from '../src/config';
import {initialRun,stepRun,type Run} from '../src/survival';
import {forceScenarios} from '../src/force-scenarios';
import {developmentScenario} from '../src/development';
import {noInput,FixedClock,type Input} from '../src/simulation';
import {entity,forkWorld} from '../src/world';
import {vehicles,newVehicle,type VehicleKind} from '../src/vehicles';
function ready(name='p62-wind-right'):Run{return{...developmentScenario(initialRun(17),name),phase:'running'};}
function seconds(r:Run,t:number,input:Input=noInput()):Run{for(let i=0;i<Math.round(t*60);i++)r=stepRun(r,input);return r;}
it('force respects swept zone entry/exit and caps overlap without storing velocity',()=>{
 const r=ready();r.distance=43;const end={...r,distance:45};
 const pushed=environmentalPush(r,end,r.world.entities,1,vehicles.motorcycle.width,2);
 expect(pushed.push).toBeCloseTo(forceBalance.windPush*.5);
 const far={...r,distance:120};expect(environmentalPush(far,{...far,distance:125},r.world.entities,1,.9,2).push).toBe(0);
 const zones=[{...r.world.entities[0],lateralPush:20},{...r.world.entities[0],id:'b',lateralPush:20}];
 const inside={...r,distance:70};expect(environmentalPush(inside,inside,zones,1,.9,2).push).toBe(forceBalance.maxPush);
 expect(inside.lateralVelocity).toBe(0);
});
it('AD can beat opposite push; no wind fuel/HP tax and no residual displacement after exit',()=>{
 const r=ready();r.distance=60;
 expect(seconds(r,.5,{...noInput(),left:true}).x).toBeLessThan(r.x);
 const calm={...r,world:{...r.world,entities:[]}};const a=seconds(r,1),b=seconds(calm,1);
 expect(a.fuel).toBeCloseTo(b.fuel);expect(a.durability).toBe(b.durability);expect(a.x).toBeCloseTo(1.5);
 const out={...a,distance:130};expect(seconds(out,.5).x).toBeCloseTo(out.x);
});
it('star/pause/crash/protected footprint suppress pushes; expiration has no catch-up impulse',()=>{
 let r=ready();r.distance=60;
 const protectedRun={...r,protectedEntities:['p62-zone']};expect(seconds(protectedRun,.25).x).toBe(0);
 const paused={...r,phase:'paused' as const};expect(seconds(paused,2)).toBe(paused);
 r={...r,powers:{...r.powers,starUntil:.25}};
 expect(seconds(r,.25).x).toBeCloseTo(0);expect(seconds(r,.5).x).toBeCloseTo(.375);
 const crashRun=seconds(ready('p62-crash'),5);expect(crashRun.crash).not.toBeNull();
 const calm={...crashRun,world:{...crashRun.world,entities:crashRun.world.entities.filter(e=>!e.lateralPush)}};
 expect(seconds(crashRun,.5).x).toBeCloseTo(seconds(calm,.5).x);
});
it('water retains normal fuel cost while adding push; airborne clears water current but not wind',()=>{
 const wet=ready('p62-current-right');wet.distance=60;
 const plain={...wet,world:{...wet.world,entities:wet.world.entities.map(e=>({...e,lateralPush:undefined}))}};
 expect(seconds(wet,.5).fuel).toBeCloseTo(seconds(plain,.5).fuel);expect(seconds(wet,.5).x).toBeGreaterThan(0);
 wet.powers={...wet.powers,jumpAt:-.8,boostUntil:4};
 expect(environmentalPush(wet,wet,wet.world.entities,.1,.9,2).push).toBe(0);
 const wind=ready();wind.distance=60;wind.powers=wet.powers;
 expect(environmentalPush(wind,wind,wind.world.entities,.1,.9,2).push).toBeGreaterThan(0);
});
it('push affects actual swept collision, coasting and branch retirement; normal route never spawns zones',()=>{
 const r=ready();r.distance=50;const car=entity('traffic','side-hit',58,1.7);car.speed=0;car.baseSpeed=0;r.world.entities.push(car);
 expect(seconds(r,1).crash).not.toBeNull();
 const calm={...r,world:{...r.world,entities:r.world.entities.filter(e=>!e.lateralPush)}};expect(seconds(calm,1).crash).toBeNull();
 const coast=ready('p62-coast');coast.distance=60;coast.motion='coasting';coast.fuel=0;
 expect(seconds(coast,.3).x).toBeGreaterThan(0);
 const fork=forkWorld({...r.world,entities:[{...r.world.entities[0],distance:810}]},r.route,'left',800);
 expect(fork.entities.some(e=>e.lateralPush)).toBe(false);expect(fork.retired.some(e=>e.entity.lateralPush)).toBe(true);
 expect(seconds({...initialRun(17),phase:'running'},10).world.entities.some(e=>e.lateralPush)).toBe(false);
});
it.each(Object.keys(vehicles) as VehicleKind[])('all zones stay bounded and countersteerable with %s and deterministic restart',kind=>{
 for(const[name]of forceScenarios){let r=ready(name);const v=newVehicle(kind,'active');r={...r,vehicleInstances:[v],activeVehicleId:v.id,fuel:v.fuel,durability:v.durability,speed:vehicles[kind].cruiseSpeed};
 const snapshot=structuredClone(r);let a=r;
 for(let i=0;i<600&&a.phase==='running';i++){a=stepRun(a,{...noInput(),left:i%120<60,right:i%120>=60});expect(Number.isFinite(a.x)).toBe(true);expect(Math.abs(a.x)).toBeLessThanOrEqual((9.6-vehicles[kind].width)/2+1e-8);}
 expect(r).toEqual(snapshot);expect(ready(name).world).toEqual(ready(name).world);}
});
it('force integration matches 30/60/144 FPS',()=>{
 const results=[];for(const fps of[30,60,144]){let r=ready('p62-mixed');const clock=new FixedClock();for(let i=0;i<fps*10;i++)clock.advance(1/fps,()=>{r=stepRun(r,noInput());});results.push([r.x,r.fuel,r.distance,r.durability]);}
 expect(results[1]).toEqual(results[0]);expect(results[2]).toEqual(results[0]);expect(forceBalance.maxPush).toBeLessThan(balance.lateralSpeed);
});

it('seeded force fixture simulation keeps finite resources and reports actual outcomes',()=>{
 const observations=[];
 for(const seed of[1,7,17,42,101,126])for(const[name]of forceScenarios){let r={...developmentScenario(initialRun(seed),name),phase:'running' as const};let bad=0;
 for(let i=0;i<600&&r.phase==='running';i++){r=stepRun(r,{...noInput(),left:i%180<60,right:i%180>=120}) as typeof r;if(![r.x,r.distance,r.fuel,r.durability].every(Number.isFinite)||r.fuel<0||r.durability<0)bad++;}
 expect(bad).toBe(0);observations.push({seed,scenario:name,x:+r.x.toFixed(3),distance:Math.round(r.distance),fuel:+r.fuel.toFixed(3),hp:+r.durability.toFixed(2),end:r.result?.reason??r.phase});}
 console.log(JSON.stringify({version:'p62-forces-1',mode:'fixed force fixtures, 6 seeds x 8 cases, 10s cap, scripted AD; not natural-route balance',cases:observations.length,observations}));
});
