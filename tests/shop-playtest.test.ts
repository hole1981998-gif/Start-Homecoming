import { expect, it } from 'vitest';
import { balance, shopBalance } from '../src/config';
import { noInput } from '../src/simulation';
import { activeVehicle, initialRun, pickUpPassenger, stepRun, type Run } from '../src/survival';
import { enterShop, reachableShop, transact } from '../src/shop';
import { warningDistance } from '../src/world';
import { vehicles } from '../src/vehicles';

it('samples actual first-car purchases on seeded hazardous routes, separately from merely affording a car', () => {
  const observations = [];
  for (const fast of [false, true]) for (const seed of [17, 42, 20261017, ...Array.from({ length: 27 }, (_, i) => 100 + i)]) {
    let run: Run = { ...initialRun(seed), phase: 'running' }, purchased = false;
    for (let tick = 0; tick < 60 * 140 && run.phase === 'running' && run.distance < 1250; tick++) {
      const nearby = run.world.entities.filter(e => !e.consumed && !e.wrecked &&
        e.distance > run.distance - (e.kind === 'shop' ? shopBalance.reach : 6) &&
        e.distance - run.distance < Math.max(80, warningDistance(run.speed, e)));
      let target = [-balance.laneWidth, 0, balance.laneWidth].map(x => {
        let cost = Math.abs(x - run.x) * .08;
        for (const e of nearby) {
          if (Math.abs(x - e.x) > (e.width + activeVehicle(run).width) / 2) continue;
          const weight = 1 / Math.max(1, (e.distance - run.distance) / 12);
          if (e.kind === 'fuel' && run.fuel < 4) cost -= 6 * weight;
          else if (e.kind === 'repair' && run.durability < 55) cost -= 5 * weight;
          else if (e.kind === 'traffic' || e.kind === 'pothole') cost += 12 * weight;
          else if (e.kind === 'water') cost += 3 * weight;
        }
        return { x, cost };
      }).sort((a, b) => a.cost - b.cost)[0].x;
      const passenger = nearby.find(e => e.kind === 'passenger' && e.pickupable !== false && run.riderIds.length === 0);
      if (passenger && passenger.distance - run.distance < 85) target = passenger.x;
      const shop = nearby.find(e => e.kind === 'shop' && e.distance >= shopBalance.firstDistance);
      if (!passenger && shop && shop.distance - run.distance < 100) target = shop.x;
      run = stepRun(run, { ...noInput(), accelerate: fast, left: run.x - target > .18, right: target - run.x > .18 });
      run = pickUpPassenger(run);
      const reachable = reachableShop(run);
      if (reachable && run.money >= vehicles.car4.price && reachable.shopStock?.vehicles.includes('car4')) {
        run = transact(enterShop(run), { kind: 'vehicle', vehicle: 'car4', sequence: run.economySequence }).run;
        purchased = activeVehicle(run).kind === 'car4'; if (purchased) break;
      }
      expect(Number.isFinite(run.distance) && run.money >= 0 && run.fuel >= 0).toBe(true);
    }
    observations.push({ seed, fast, purchased, seconds: run.activeSeconds, end: run.result?.reason ?? (purchased ? 'purchased' : 'missed'), money: run.money });
  }
  for (const fast of [false, true]) {
    const group = observations.filter(o => o.fast === fast), purchases = group.filter(o => o.purchased);
    expect(purchases.length).toBeGreaterThan(0);
    const times = purchases.map(o => o.seconds).sort((a, b) => a - b);
    console.log(JSON.stringify({ config: balance.version, scenario: 'hazardous-route-real-purchase', fast,
      purchases: purchases.length, medianSeconds: times[Math.floor(times.length / 2)],
      failures: group.filter(o => !o.purchased).map(o => ({ seed: o.seed, reason: o.end, seconds: o.seconds, money: o.money })) }));
  }
}, 15000);
