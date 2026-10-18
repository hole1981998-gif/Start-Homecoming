import type { Run } from './survival';
import { entity, fillWorld, initialWorld, trafficTypes } from './world';
import { junction } from './route';
import { newVehicle, vehicles, type VehicleKind } from './vehicles';
import { balance, itemBalance } from './config';
/** Manual QA fixtures. Imported only through a DEV branch; no player-facing control. */
export function developmentScenario(run: Run, scenario: string | null): Run {
  if (scenario === 'grab-crash') {
    const vehicle = newVehicle('car4', 'qa-grab-crash');
    const car = entity('traffic', 'qa-grab-hit', 8, 0); car.speed = 0; car.baseSpeed = 0;
    const riders = ['qa-grab-0', 'qa-grab-1', 'qa-grab-2'];
    return { ...run, vehicleInstances: [vehicle], activeVehicleId: vehicle.id, speed: vehicles.car4.cruiseSpeed,
      fuel: vehicle.fuel, durability: vehicle.durability, riderIds: riders, grabRiderIds: [...riders],
      inventory: ['grab', null], grabUses: [itemBalance.grabUses, 0],
      world: { ...run.world, entities: [car], nextHazard: 1e9, nextFuel: 1e9, nextRepair: 1e9,
        nextPassenger: 1e9, nextShopDistance: 1e9 } };
  }
  if (scenario === 'grab' || scenario === 'grab-blocked') {
    const wall = entity('pothole', 'qa-grab-blocked', 100, 0); wall.width = 9.6; wall.length = 250;
    return { ...run, inventory: ['grab', null], grabUses: [itemBalance.grabUses, 0],
      vehicleInstances: [...run.vehicleInstances, newVehicle('car4', 'qa-grab-spare')],
      world: { ...run.world, entities: scenario === 'grab-blocked' ? [wall] : [], nextHazard: 1e9,
        nextFuel: 1e9, nextRepair: 1e9, nextPassenger: 1e9, nextShopDistance: 1e9 } };
  }
  if (scenario === 'items' || scenario === 'items-container') {
    const chosen = newVehicle(scenario === 'items-container' ? 'container' : 'motorcycle', 'qa-items');
    const hole = entity('pothole', 'qa-jump-hole', 24, 0); hole.width = 9.6; hole.length = 6;
    const water = entity('water', 'qa-star-water', 70, 0); water.width = 9.6; water.length = 35;
    const car = entity('traffic', 'qa-star-car', 80, 0); car.speed = 0; car.baseSpeed = 0;
    return { ...run, inventory: ['nitro', 'star'], vehicleInstances: [chosen], activeVehicleId: chosen.id,
      fuel: chosen.fuel, durability: chosen.durability, speed: vehicles[chosen.kind].cruiseSpeed,
      world: { ...run.world, entities: [hole, water, car], nextHazard: 1e9, nextFuel: 1e9,
        nextRepair: 1e9, nextPassenger: 1e9, nextShopDistance: 1e9 } };
  }
  if (scenario === 'shop' || scenario === 'shop-third' || scenario === 'shop-insufficient') {
    const shop = entity('shop', 'qa-shop', 12, 0);
    shop.shopStock = { vehicles: Object.keys(vehicles) as VehicleKind[], items: { nitro: 1, star: 1, grab: itemBalance.grabShopStock } };
    return { ...run, money: scenario === 'shop-insufficient' ? 20 : 4000, fuel: 1, durability: 30,
      riderIds: ['qa-shop-rider'],
      vehicleInstances: scenario === 'shop-third' ? [...run.vehicleInstances, newVehicle('car7', 'qa-spare')] : run.vehicleInstances,
      world: { ...run.world, entities: [shop], nextHazard: 1e9, nextFuel: 1e9, nextRepair: 1e9,
        nextPassenger: 1e9, nextShopDistance: 1e9 } };
  }
  if (scenario === 'vehicle-replacement' || scenario === 'vehicle-failure') {
    const car = entity('traffic', 'qa-vehicle-replacement', 8, 0); car.speed = 0;
    return { ...run, durability: 20,
      vehicleInstances: scenario === 'vehicle-replacement' ?
        [...run.vehicleInstances, newVehicle('car4', `${run.runId}-car4`)] : run.vehicleInstances,
      world: { ...run.world, entities: [car], nextHazard: 1e9, nextFuel: 1e9,
        nextRepair: 1e9, nextPassenger: 1e9 } };
  }
  if (scenario === 'vehicles' || scenario?.startsWith('vehicles-')) {
    const requested = scenario === 'vehicles' ? 'car4' : scenario!.slice('vehicles-'.length);
    const kind: VehicleKind = requested in vehicles ? requested as VehicleKind : 'car4';
    return { ...run, vehicleInstances: [...run.vehicleInstances, newVehicle(kind, `${run.runId}-${kind}`)] };
  }
  if (scenario === 'passenger') return { ...run, world: { ...run.world, entities: [entity('passenger', 'qa-passenger', 5, 0)],
    nextHazard: 1e9, nextFuel: 1e9, nextRepair: 1e9, nextPassenger: 1e9 } };
  if (scenario === 'passenger-crash' || scenario === 'passenger-crash-car') {
    const car = { ...entity('traffic', 'qa-traffic', 8, 0), speed: 0 };
    const water = entity('water', 'qa-water', 16, 0); water.width = 9.6; water.length = 10;
    const hole = entity('pothole', 'qa-hole', 15, 0); hole.width = 9.6; hole.length = 8;
    const qaCar = newVehicle('car4', `${run.runId}-qa-car4`);
    return { ...run, riderIds: ['qa-rider-0', 'qa-rider-1', 'qa-rider-2'],
      ...(scenario === 'passenger-crash-car' ? { vehicleInstances: [...run.vehicleInstances, qaCar], activeVehicleId: qaCar.id,
        fuel: vehicles.car4.fuelCapacity, durability: vehicles.car4.durabilityCapacity } : {}),
      world: { ...run.world, entities: [car, water, hole],
      nextHazard: 1e9, nextFuel: 1e9, nextRepair: 1e9, nextPassenger: 1e9 } };
  }
  if (scenario === 'traffic-fuel' || scenario === 'traffic-fuel-oncoming') {
    const car = entity('traffic', 'qa-fuel-traffic', 90, scenario === 'traffic-fuel' ? balance.laneWidth : -balance.laneWidth);
    car.speed = scenario === 'traffic-fuel' ? 6 : -6; car.baseSpeed = car.speed;
    car.fuel = .006;
    return { ...run, world: { ...run.world, entities: [car], nextHazard: 1e9,
      nextFuel: 1e9, nextRepair: 1e9, nextPassenger: 1e9 } };
  }
  if (scenario === 'traffic-passengers' || scenario === 'traffic-passengers-pothole') {
    const bus = newVehicle('bus', `${run.runId}-qa-bus`);
    const car = entity('traffic', 'qa-passenger-source', 55, 0);
    car.speed = 0; car.baseSpeed = 0;
    const hole = entity('pothole', 'qa-source-pothole', 55, 0); hole.width = 2; hole.length = 24;
    return { ...run, activeVehicleId: bus.id, vehicleInstances: [bus],
      speed: vehicles.bus.cruiseSpeed, fuel: bus.fuel, durability: bus.durability,
      world: { ...run.world, entities: scenario === 'traffic-passengers-pothole' ? [car, hole] : [car],
        nextHazard: 1e9, nextFuel: 1e9, nextRepair: 1e9, nextPassenger: 1e9 } };
  }
  if (scenario === 'traffic-ram') {
    const bus = newVehicle('bus', `${run.runId}-qa-bus`);
    const car = entity('traffic', 'qa-small-car', 8, 0); car.speed = 0; car.baseSpeed = 0;
    return { ...run, activeVehicleId: bus.id, vehicleInstances: [...run.vehicleInstances, bus],
      fuel: bus.fuel, durability: bus.durability,
      world: { ...run.world, entities: [car], nextHazard: 1e9, nextFuel: 1e9,
        nextRepair: 1e9, nextPassenger: 1e9 } };
  }
  if (scenario === 'traffic-gallery') {
    const entities = (Object.keys(trafficTypes) as VehicleKind[]).map((kind, i) => {
      const model = trafficTypes[kind], car = entity('traffic', `qa-${kind}`, 24 + i * 13,
        (i % 3 - 1) * balance.laneWidth);
      car.trafficKind = kind; car.hp = model.hp; car.width = model.width; car.length = model.length;
      car.speed = 0; car.baseSpeed = 0;
      return car;
    });
    return { ...run, world: { ...run.world, entities, nextHazard: 1e9, nextFuel: 1e9,
      nextRepair: 1e9, nextPassenger: 1e9 } };
  }
  if (scenario?.startsWith('traffic-kind-')) {
    const requested = scenario.slice('traffic-kind-'.length);
    if (Object.hasOwn(trafficTypes, requested)) {
      const kind = requested as VehicleKind, model = trafficTypes[kind];
      const car = entity('traffic', `qa-${kind}`, 24, 0);
      car.trafficKind = kind; car.hp = model.hp; car.width = model.width; car.length = model.length;
      car.speed = 0; car.baseSpeed = 0;
      return { ...run, world: { ...run.world, entities: [car], nextHazard: 1e9, nextFuel: 1e9,
        nextRepair: 1e9, nextPassenger: 1e9 } };
    }
  }
  if (scenario === 'branch-hazard') {
    const crossing = junction(run.seed, 1), distance = crossing.distance - 18;
    const traffic = entity('traffic', 'qa-old-branch', crossing.distance + 85, 0);
    traffic.speed = 0;
    const world = fillWorld(initialWorld(run.seed), distance);
    return { ...run, distance, route: { ...run.route, index: 1 },
      world: { ...world, entities: [...world.entities.filter(e => e.distance + e.length / 2 > distance - 12), traffic] } };
  }
  if (scenario === 'junction' || scenario === 'blocked-junction' || scenario === 'blocked-window') {
    const index = scenario === 'junction' ? 0 : Array.from({ length: 20 }, (_, i) => i + 1).find(i => junction(run.seed, i).blockedStraight)!;
    return { ...run, phase: 'ready', distance: junction(run.seed, index).distance - (scenario === 'blocked-window' ? 18 : 95),
      route: { ...run.route, index }, world: { ...run.world, entities: [], nextHazard: 1e9, nextFuel: 1e9, nextRepair: 1e9 } };
  }
  if (scenario !== 'coast' && scenario !== 'supplies' && scenario !== 'crash') return run;
  return { ...run, fuel: scenario === 'coast' ? .006 : scenario === 'supplies' ? 0 : run.fuel,
    durability: scenario === 'supplies' ? 30 : run.durability,
    motion: scenario === 'supplies' ? 'coasting' : 'powered',
    world: { ...run.world, nextHazard: 1e9, nextFuel: 1e9, nextRepair: 1e9,
      entities: scenario === 'supplies' ? [entity('fuel', 'qa-fuel', 6, 0), entity('repair', 'qa-repair', 12, 0)] :
        scenario === 'crash' ? [entity('traffic', 'qa-traffic', 8, 0)] : [] } };
}
