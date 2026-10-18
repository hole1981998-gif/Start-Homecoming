import { expect, it } from 'vitest';
import { balance, movingBalance } from '../src/config';
import { initialRun, stepRun, selectTurn } from '../src/survival';
import { initialWorld, fillWorld, entity, forkWorld } from '../src/world';
import { movingEvent } from '../src/moving-events';
import { specialPlan } from '../src/special-events';
import { crossX } from '../src/cross-motion';
import { noInput, FixedClock } from '../src/simulation';
import { vehicles } from '../src/vehicles';
import { advanceInteractingTraffic } from '../src/traffic-interactions';
import { enterShop, leaveShop, transact } from '../src/shop';
import { pickUpPassenger, type Run } from '../src/survival';
import { usePowerItem } from '../src/items';
import { effectiveVehicle } from '../src/vehicles';
import { junction } from '../src/route';

it('normal seeded director includes moving train, officer variants, vendor/barrier/ambulance without rerolling other streams', () => {
  const seen = new Set<string>(), profiles = new Set<string>();
  for (let seed=1; seed<=30; seed++) for(let index=0;index<20;index++) {
    const p = specialPlan(index, seed), base = entity(p.kind, 'e-'+index, p.distance,p.x);
    const actors = movingEvent(base,index,seed,10,p.distance-250,vehicles.motorcycle);
    expect(actors).toEqual(movingEvent(entity(p.kind,'e-'+index,p.distance,p.x),index,seed,10,p.distance-250,vehicles.motorcycle));
    for (const e of actors) {
      seen.add(e.displayName ?? e.kind);
      if(e.kind==='police'||e.kind==='militia') {
        expect(e.width).toBeLessThan(1); expect(e.groupId).toBe('e-'+index);
        profiles.add(String(Math.abs(e.crossMotion!.velocity)));
      }
      if(e.kind==='train') expect((e.width+balance.laneWidth*balance.laneCount)/Math.abs(e.crossMotion!.velocity)).toBeCloseTo(4);
    }
  }
  for(const name of ['Tàu chạy ngang','Công an qua lại','Dân phòng qua lại','Rào sửa đường','Hàng rong băng đường','Cứu thương đổi lane']) expect(seen.has(name)).toBe(true);
  expect(profiles.size).toBeGreaterThanOrEqual(4);
  let world = initialWorld(17,true);
  for(let d=0; d<12000; d+=100) world=fillWorld(world,d,100,300,1,vehicles.container,d/14);
  expect(world.integrated).toBe(true);
});

function simultaneous(hp:number) {
  const run=initialRun(17), car=entity('traffic','target',3.3,0), hole=entity('pothole','hole',3,0);
  car.speed=0;car.baseSpeed=0;car.hp=hp;car.trafficContacts=['hole'];hole.length=30;hole.width=3;
  return {...run,phase:'running' as const,speed:20,world:{...initialWorld(17,true),entities:[car,hole],nextHazard:1e9,nextSpecial:1e9,nextFuel:1e9,nextRepair:1e9,nextPassenger:1e9,nextShopDistance:1e9}};
}
it('player impact before NPC pothole death retains player provenance; earlier environment death cannot damage player as a live car',()=>{
  const earlier=stepRun(simultaneous(.19),{...noInput(),accelerate:true});
  const late=stepRun(simultaneous(.03),{...noInput(),accelerate:true});
  expect(earlier.world.entities.find(e=>e.id==='target')?.wreckedByPlayer).toBe(true);
  expect(earlier.feedbackCounts.traffic).toBe(1);
  const overlapping=simultaneous(.19);overlapping.distance=.3;
  expect(stepRun(overlapping,noInput()).world.entities.find(e=>e.id==='target')?.wreckedByPlayer).toBe(true);
  expect(late.world.entities.find(e=>e.id==='target')?.wreckedByPlayer).not.toBe(true);
  expect(late.feedbackCounts.traffic).toBe(0);
  const airborne=simultaneous(100);airborne.distance=.3;airborne.powers={...airborne.powers,boostUntil:4,jumpAt:-.8};
  expect(stepRun(airborne,noInput()).feedbackCounts.traffic).toBe(0);
});
it('collision stops fuel billing at actual NPC contact; waiting wreck/stopped traffic never burns the predicted rest of a tick',()=>{
  const car=entity('traffic','car',10,0), barrier=entity('jam','barrier',15,0);
  car.speed=10;car.baseSpeed=10;car.fuel=4;car.hp=30;barrier.length=1.4;
  const old=[{...car},{...barrier}];advanceInteractingTraffic([car,barrier],old,1);
  expect(car.trafficStoppedByCollision).toBe(true);
  expect(car.fuel).toBeCloseTo(4-(car.distance-10)*vehicles.car4.fuelPerMeter,8);
  const fuel=car.fuel;advanceInteractingTraffic([car,barrier],[{...car},{...barrier}],1);expect(car.fuel).toBe(fuel);
});
it('branch retirement keeps motion/pose data, removes old colliders and produces independent seeded new branch',()=>{
  const run=initialRun(17);const e=movingEvent(entity('train','old',810,0),2,17,0,600,vehicles.motorcycle)[0];
  const world={...run.world,entities:[e]};const fork=forkWorld(world,run.route,'left',800);
  expect(fork.entities.some(v=>v.id==='old')).toBe(false);
  expect(fork.retired[0].entity.crossMotion).toEqual(e.crossMotion);
  expect(fork.branchSeed).not.toBe(world.branchSeed);
  expect(crossX(fork.retired[0].entity.crossMotion!,2)).toBe(crossX(e.crossMotion!,2));
});
it('integrated world pauses in shop and restart restores deterministic initial generation',()=>{
  let run={...initialRun(17),phase:'running' as const}; run={...run,distance:600,x:-balance.laneWidth,world:fillWorld(run.world,600)};
  const paused=enterShop(run);expect(paused.phase).toBe('paused');expect(paused.shopId).toBeTruthy();expect(stepRun(paused,noInput())).toBe(paused);
  expect(initialRun(17).world).toEqual(initialRun(17).world);
  expect(selectTurn({...initialRun(17),phase:'paused'},'left').route.choice).toBeNull();
});
it('normal integrated simulation is finite and reproducible across 30/60/144 FPS on a real seeded route',()=>{
  const outcomes=[];
  for(const fps of [30,60,144]) {
    let run={...initialRun(17),phase:'running' as const};const clock=new FixedClock();
    for(let f=0;f<fps*30;f++) clock.advance(1/fps,()=>{run=stepRun(run,noInput()) as typeof run;});
    outcomes.push([run.distance,run.fuel,run.durability,run.phase,run.world.entities.map(e=>[e.id,e.x,e.distance,e.hp])]);
  }
  expect(outcomes[1]).toEqual(outcomes[0]);expect(outcomes[2]).toEqual(outcomes[0]);
  expect(movingBalance.vendorWidth).toBeLessThan(balance.laneWidth*balance.laneCount);
});

it('integrated seeded journeys use actual shops, passengers, junctions and moving events with finite resources',()=>{
  const observations=[];
  let totalWind = 0, totalSources = 0, totalDrops = 0;
  for (const seed of [1,7,17,42,101,126]) {
    let run:Run={...initialRun(seed),phase:'running'}, violations=0, shops=0, purchases=0, moving=0;
    const seen=new Set<string>(), visitedShops=new Set<string>();
    const windIds = new Set<string>(), sourceIds = new Set<string>(), dropIds = new Set<string>();
    for(let tick=0;tick<60*240 && run.phase==='running';tick++) {
      const shopRun=visitedShops.has(run.world.entities.find(e=>e.kind==='shop'&&Math.abs(e.distance-run.distance)<30)?.id ?? '')?run:enterShop(run);
      if(shopRun!==run) {
        run=shopRun;shops++;visitedShops.add(run.shopId!);
        if(run.vehicleInstances.length===1 && run.money>=800) {const v=transact(run,{sequence:run.economySequence,kind:'vehicle',vehicle:'car4'});if(v.run!==run)purchases++;run=v.run;}
        const vehicle=effectiveVehicle(run.vehicleInstances.find(v=>v.id===run.activeVehicleId)!);
        if(run.fuel<vehicle.fuelCapacity*.7)run=transact(run,{sequence:run.economySequence,kind:'service',item:'fuel'}).run;
        if(run.durability<vehicle.durabilityCapacity*.7)run=transact(run,{sequence:run.economySequence,kind:'service',item:'repair'}).run;
        if(run.inventory.includes(null))run=transact(run,{sequence:run.economySequence,kind:'power-item',item:'banana'}).run;
        run={...leaveShop(run),phase:'running'};
      }
      run=pickUpPassenger(run);
      const crossing=junction(run.seed,run.route.index);
      if(crossing.blockedStraight)run=selectTurn(run,'left');
      const targetShop=run.world.entities.find(e=>e.kind==='shop'&&!e.consumed&&e.distance>run.distance&&e.distance-run.distance<100);
      const nearby=run.world.entities.filter(e=>!e.consumed&&!e.stunned&&e.distance>run.distance-10&&e.distance<run.distance+100);
      for(const e of nearby)if(e.crossMotion&&!seen.has(e.id)){seen.add(e.id);moving++;}
      const target=[-3.2,0,3.2].map(x=>{
        let cost=Math.abs(x-run.x)*.05;
        if(targetShop)cost+=Math.abs(x-targetShop.x)*20;
        for(const e of nearby){
          const t=Math.max(0,(e.distance-run.distance)/Math.max(4,run.speed-e.speed));
          const ex=e.crossMotion?crossX(e.crossMotion,run.activeSeconds+t):e.x;
          if(Math.abs(x-ex)>(e.width+1.3)/2)continue;
          const weight=1/Math.max(1,(e.distance-run.distance)/12);
          if(e.kind==='fuel'&&run.fuel<2)cost-=12*weight;
          else if(e.kind==='repair'&&run.durability<50)cost-=6*weight;
          else if(['traffic','pothole','police','militia','jam','accident'].includes(e.kind))cost+=20*weight;
        }
        return{x,cost};
      }).sort((a,b)=>a.cost-b.cost)[0].x;
      for(let slot=0;slot<2;slot++)if(run.inventory[slot]==='banana')run=usePowerItem(run,slot);
      const train=nearby.find(e=>e.kind==='train'&&e.distance-run.distance<70&&e.distance>run.distance);
      const before=run;
      run=stepRun(run,{accelerate:!train,brake:!!train,left:run.x-target>.18,right:target-run.x>.18});
      for (const e of run.world.entities) {
        if (e.kind === 'wind') windIds.add(e.id);
        if (e.cargoReleaseAt !== undefined) sourceIds.add(e.id);
        if (e.kind === 'cargo') dropIds.add(e.id);
      }
      if(![run.distance,run.money,run.fuel,run.durability].every(Number.isFinite)||run.distance<before.distance||run.money<0||run.fuel<0||run.durability<0)violations++;
    }
    expect(violations).toBe(0);
    totalWind += windIds.size; totalSources += sourceIds.size; totalDrops += dropIds.size;
    observations.push({seed,distance:Math.round(run.distance),seconds:Math.round(run.activeSeconds),end:run.result?.reason??run.phase,shops,purchases,moving,winds:windIds.size,cargoSources:sourceIds.size,drops:dropIds.size,turns:run.route.turns,riders:run.riderIds.length});
  }
  expect(totalWind).toBeGreaterThan(0);
  expect(totalSources).toBeGreaterThan(0);
  expect(totalDrops).toBeGreaterThan(0);
  console.log(JSON.stringify({version:balance.version,mode:'integrated generated routes, scripted pilot, 240s cap, no resource grants',observations}));
});
