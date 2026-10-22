import { expect, it } from 'vitest';
import { developmentScenario } from '../src/development';
import { initialRun, stepRun, selectTurn } from '../src/survival';
import { fillWorld, entity, initialWorld, forkWorld, type World } from '../src/world';
import { movingEvent } from '../src/moving-events';
import { advanceCrossMotion } from '../src/cross-motion';
import { vehicles } from '../src/vehicles';
import { noInput } from '../src/simulation';
import { balance, movingBalance } from '../src/config';

it('stress is opt-in, dense, seeded, uses full traffic roster and every current hazard family',()=>{
  expect(initialRun(17).world.stress).toBeUndefined();
  const checkpoint=developmentScenario(initialRun(17),'stress',576);expect(checkpoint.distance).toBe(576);
  expect(developmentScenario(initialRun(17),'stress',NaN).distance).toBe(0);
  expect(checkpoint.world.entities.some(e=>e.id.startsWith('stress-')&&e.distance>=576)).toBe(true);
  let run=developmentScenario(initialRun(17),'stress');
  expect(run.world.integrated).toBe(true);expect(run.world.stress).toBe(true);
  expect(run.world.entities.filter(e=>e.kind==='traffic').length).toBeGreaterThan(20);
  const a=run.world.entities.map(e=>[e.id,e.x,e.distance,e.trafficKind]);
  expect(developmentScenario(initialRun(17),'stress').world.entities.map(e=>[e.id,e.x,e.distance,e.trafficKind])).toEqual(a);
  const seen=new Set<string>(),roster=new Set<string>();
  for(let d=0;d<=700;d+=20){
    run={...run,world:fillWorld(run.world,d,100,300,1,vehicles.container,0,10)};
    for(const e of run.world.entities){seen.add(e.displayName??e.kind);if(e.trafficKind)roster.add(e.trafficKind);}
    expect(new Set(run.world.entities.map(e=>e.id)).size).toBe(run.world.entities.length);
  }
  expect(roster.size).toBe(Object.keys(vehicles).length);
  for(const kind of ['water','pothole','Tàu chạy ngang','Công an qua lại','Dân phòng qua lại','Rào sửa đường','Hàng rong băng đường','Cứu thương đổi lane','accident','broken'])expect(seen.has(kind)).toBe(true);
});
it('train waits invisibly for actual approach, then moves at fast-driver arrival rather than staying parked until a cruise ETA',()=>{
  for(const speed of [8,14,20,31]) {
    const train=movingEvent(entity('train','train',1700,0),0,1,90,1380,vehicles.motorcycle)[0];
    expect(train.motionWaiting).toBe(true);
    const initialX=train.x;advanceCrossMotion([train],110);expect(train.x).toBe(initialX);
    let world:World={...initialWorld(1,true),entities:[train],nextHazard:1e9,nextSpecial:1e9,nextFuel:1e9,nextRepair:1e9,nextPassenger:1e9,nextShopDistance:1e9};
    const approach=Math.max(60,speed*2.4,speed*speed/(2*balance.braking)+vehicles.motorcycle.length+15);
    world=fillWorld(world,1700-approach+.01,5,70,1,vehicles.motorcycle,110,speed);
    const active=world.entities[0];expect(active.motionWaiting).toBe(false);expect(active.crossMotion!.startedAt).toBe(110);
    advanceCrossMotion(world.entities,110.5);expect(Math.abs(active.x-initialX)).toBeCloseTo(movingBalance.trainSpeed*.5);
    const halfway=110+approach/speed;
    advanceCrossMotion(world.entities,Math.min(halfway,113));
    expect(active.x).not.toBe(initialX);
  }
});
it('turn uses current gameplay time, and branch stress IDs/counters restart without copying old actors to the new lane',()=>{
  let run=developmentScenario(initialRun(7),'stress');run={...run,phase:'running',distance:780,speed:20,activeSeconds:100,world:fillWorld(run.world,780,45,300,1,vehicles.container,100,20)};
  run.distance = 770; // Container must commit before its rear reaches the turn arc.
  const turned=selectTurn(run,'left');expect(turned.route.choice).toBe('left');
  expect(turned.world.entities.filter(e=>e.crossMotion&&!e.motionWaiting).every(e=>e.crossMotion!.startedAt>=100)).toBe(true);
  const fork=forkWorld(run.world,run.route,'left',800);expect(fork.nextStress).toBeGreaterThan(0);
  expect(fork.retired.length).toBeGreaterThan(0);
});
it.each([1,7,17,42,101,126])('dense integrated seed %i stays finite through genuine failures without mutating source',seed=>{
    const source=developmentScenario(initialRun(seed),'stress'), snapshot=structuredClone(source);
    let run={...source,phase:'running' as const},maxEntities=0,violations=0;
    for(let tick=0;tick<60*30&&run.phase==='running';tick++) {
      run=stepRun(run,{...noInput(),accelerate:true}) as typeof run;
      maxEntities=Math.max(maxEntities,run.world.entities.length);
      if(![run.distance,run.money,run.fuel,run.durability].every(Number.isFinite)||run.money<0||run.fuel<0||run.durability<0)violations++;
    }
    expect(violations).toBe(0);expect(source).toEqual(snapshot);
    console.log(JSON.stringify({mode:'stress integrated, unbalanced, W only, 30s cap',seed,distance:Math.round(run.distance),phase:run.phase,end:run.result?.reason??null,maxEntities,seconds:run.activeSeconds}));
});

it('W on a generated integrated train approach sees actual cross-road motion before reaching the rails',()=>{
  let run={...developmentScenario(initialRun(1),'integrated-checkpoint'),phase:'running' as const};
  let started=false,moved=false;
  for(let tick=0;tick<60*25&&run.phase==='running';tick++) {
    run=stepRun(run,{...noInput(),accelerate:true}) as typeof run;
    const train=run.world.entities.find(e=>e.kind==='train');
    if(train&&!train.motionWaiting){started=true;if(Math.abs(train.x)<19)moved=true;}
  }
  console.log(JSON.stringify({ scenario: 'generated train approach', seed: 1,
    started, moved, distance: run.distance, end: run.result?.reason ?? null }));
  expect(started).toBe(true);expect(moved).toBe(true);
  expect(run.distance).toBeGreaterThan(1050);
  expect(Number.isFinite(run.fuel) && Number.isFinite(run.durability)).toBe(true);
});
