import { balance } from './config';
import { vehicleDefinition, waterFuelPerSecond } from './vehicles';
import { sweptContact, type Entity } from './world';

/** Fuel belongs to each instance. Use absolute travel for both traffic directions. */
export function moveTrafficWithFuel(car: Entity, entities: Entity[], dt: number, endX = car.x): void {
  if (car.trafficStoppedByCollision) { car.speed = 0; car.trafficMotion = 'stopped'; return; }
  const definition = vehicleDefinition(car.trafficKind ?? 'car4', car.balanceProfile);
  car.fuel ??= definition.fuelCapacity;
  car.trafficMotion ??= 'powered';
  if (car.trafficMotion === 'powered' && (car.baseSpeed === undefined || Math.sign(car.speed) !== Math.sign(car.baseSpeed))) {
    car.baseSpeed = car.speed;
  }
  if (car.trafficMotion === 'stopped') { car.speed = 0; return; }
  const direction = Math.sign(car.speed || car.baseSpeed || 1);
  const water = entities.filter(e => !e.consumed && e.kind === 'water').flatMap(patch => {
    const contact = sweptContact(car.x - patch.x, car.distance - patch.distance, endX - patch.x,
      car.distance + car.speed * dt - patch.distance, (car.width + patch.width) / 2, (car.length + patch.length) / 2);
    return contact ? [contact] : [];
  });
  let poweredFraction = 0;
  if (car.trafficMotion === 'powered' && car.fuel > 0) {
    const edges = [...new Set([0, 1, ...water.flat()])].sort((a, b) => a - b);
    for (let i = 1; i < edges.length; i++) {
      const a = edges[i - 1], b = edges[i], midpoint = (a + b) / 2;
      const wetCount = water.filter(([enter, exit]) => enter <= midpoint && exit >= midpoint).length;
      const cost = Math.abs(car.speed) * dt * definition.fuelPerMeter + wetCount * dt * waterFuelPerSecond(car.balanceProfile);
      const fraction = cost > 0 ? Math.min(b - a, car.fuel / cost) : b - a;
      car.fuel = Math.max(0, car.fuel - cost * fraction);
      poweredFraction = a + fraction;
      if (fraction < b - a || car.fuel <= 1e-12) { car.fuel = 0; break; }
    }
    car.distance += car.speed * dt * poweredFraction;
  }
  if (car.fuel > 0) return;
  if (car.trafficMotion === 'powered') {
    car.trafficMotion = 'coasting'; car.coastRemaining = balance.coastDistance;
  }
  const coastSeconds = dt * (1 - poweredFraction), speed = Math.abs(car.speed);
  if (speed === 0 || (car.coastRemaining ?? 0) <= 0) {
    car.speed = 0; car.coastRemaining = 0; car.trafficMotion = 'stopped'; return;
  }
  const floor = Math.min(speed, balance.coastCrawlSpeed);
  const brakingSeconds = Math.min(coastSeconds, (speed - floor) / balance.coastDrag);
  const travel = speed * brakingSeconds - balance.coastDrag * brakingSeconds ** 2 / 2 + floor * (coastSeconds - brakingSeconds);
  const moved = Math.min(car.coastRemaining ?? balance.coastDistance, travel);
  car.distance += direction * moved;
  car.coastRemaining = Math.max(0, (car.coastRemaining ?? balance.coastDistance) - moved);
  if (car.coastRemaining <= 1e-10) { car.coastRemaining = 0; car.trafficMotion = 'stopped'; car.speed = 0; }
  else car.speed = direction * Math.max(floor, speed - balance.coastDrag * coastSeconds);
}
