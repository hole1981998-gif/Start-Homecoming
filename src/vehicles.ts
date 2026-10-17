import { balance } from './config';

export type VehicleKind = 'motorcycle' | 'motorbike' | 'car4' | 'car7' | 'tricycle' | 'bus' | 'truck' | 'container';
export interface VehicleDefinition {
  kind: VehicleKind; name: string; capacity: number; minSpeed: number; cruiseSpeed: number; maxSpeed: number;
  cruiseLoss: number; cruiseFloor: number; fuelCapacity: number; durabilityCapacity: number; fuelPerMeter: number;
  fuelPickup: number; repairPickup: number; width: number; length: number; price: number;
}
export interface VehicleInstance {
  id: string; kind: VehicleKind; fuel: number; durability: number; upgrades: { engine: number; tank: number; armour: number };
  disabled: boolean;
}
/** Temporary P4B trial numbers; the motorcycle keeps its proven P4A baseline. */
export const vehicles: Record<VehicleKind, VehicleDefinition> = {
  motorcycle: { kind: 'motorcycle', name: 'Xe máy', capacity: 2, minSpeed: balance.minSpeed,
    cruiseSpeed: balance.cruiseSpeed, maxSpeed: balance.maxSpeed, cruiseLoss: balance.riderCruiseLoss,
    cruiseFloor: balance.riderCruiseFloor, fuelCapacity: balance.fuelCapacity,
    durabilityCapacity: balance.durabilityCapacity, fuelPerMeter: balance.fuelPerMeter,
    fuelPickup: balance.fuelPickup, repairPickup: balance.repairPickup,
    width: balance.vehicleWidth, length: balance.vehicleLength, price: 250 },
  motorbike: { kind: 'motorbike', name: 'Mô tô', capacity: 2, minSpeed: 9, cruiseSpeed: 18.5,
    maxSpeed: 28, cruiseLoss: 2.4, cruiseFloor: 9, fuelCapacity: 10, durabilityCapacity: 85,
    fuelPerMeter: .004, fuelPickup: 6, repairPickup: 40, width: .96, length: 2.2, price: 600 },
  car4: { kind: 'car4', name: 'Ô tô 4 chỗ', capacity: 4, minSpeed: 8, cruiseSpeed: 16,
    maxSpeed: 24, cruiseLoss: 1.6, cruiseFloor: 9, fuelCapacity: 16, durabilityCapacity: 120,
    fuelPerMeter: .005, fuelPickup: 8, repairPickup: 45, width: 1.86, length: 4.2, price: 800 },
  car7: { kind: 'car7', name: 'Ô tô 7 chỗ', capacity: 7, minSpeed: 8, cruiseSpeed: 15,
    maxSpeed: 22, cruiseLoss: .9, cruiseFloor: 9, fuelCapacity: 20, durabilityCapacity: 145,
    fuelPerMeter: .006, fuelPickup: 10, repairPickup: 50, width: 2.08, length: 4.8, price: 1200 },
  tricycle: { kind: 'tricycle', name: 'Ba gác', capacity: 4, minSpeed: 6, cruiseSpeed: 11.5,
    maxSpeed: 17, cruiseLoss: 1, cruiseFloor: 6, fuelCapacity: 12, durabilityCapacity: 100,
    fuelPerMeter: .0045, fuelPickup: 7, repairPickup: 40, width: 1.76, length: 3.2, price: 450 },
  bus: { kind: 'bus', name: 'Xe buýt', capacity: 25, minSpeed: 6, cruiseSpeed: 12.5,
    maxSpeed: 19, cruiseLoss: .3, cruiseFloor: 7, fuelCapacity: 35, durabilityCapacity: 210,
    fuelPerMeter: .01, fuelPickup: 12, repairPickup: 60, width: 2.72, length: 10, price: 2400 },
  truck: { kind: 'truck', name: 'Xe tải', capacity: 3, minSpeed: 6, cruiseSpeed: 13,
    maxSpeed: 20, cruiseLoss: 1.3, cruiseFloor: 7, fuelCapacity: 30, durabilityCapacity: 230,
    fuelPerMeter: .009, fuelPickup: 12, repairPickup: 60, width: 2.72, length: 7, price: 1800 },
  container: { kind: 'container', name: 'Container', capacity: 2, minSpeed: 5, cruiseSpeed: 11.5,
    maxSpeed: 18, cruiseLoss: 1.8, cruiseFloor: 5, fuelCapacity: 45, durabilityCapacity: 300,
    fuelPerMeter: .012, fuelPickup: 15, repairPickup: 70, width: 2.88, length: 15, price: 3000 },
};
for (const d of Object.values(vehicles)) {
  if (Object.values(d).some(value => typeof value === 'number' && !Number.isFinite(value)) ||
    !Number.isInteger(d.capacity) || d.capacity < 1 || d.minSpeed <= 0 ||
    !(d.minSpeed <= d.cruiseFloor && d.cruiseFloor < d.cruiseSpeed && d.cruiseSpeed <= d.maxSpeed) ||
    d.cruiseLoss <= 0 || d.width >= balance.laneWidth * 1.5 || d.length <= 0 ||
    d.fuelCapacity <= 0 || d.durabilityCapacity <= 0 || d.fuelPerMeter <= 0 || d.price <= 0 ||
    d.fuelPickup <= 0 || d.repairPickup <= 0) throw new Error(`Invalid vehicle: ${d.kind}`);
}
export interface TrafficDefinition {
  kind: VehicleKind; name: string; hp: number; damage: number; width: number; length: number;
  speed: number; spawnWeight: number; color: string;
}
/** Temporary obstacle tuning. Footprints follow the matching player vehicle. */
export const trafficTypes: Record<VehicleKind, TrafficDefinition> = {
  motorcycle: { kind: 'motorcycle', name: 'Xe máy', hp: 20, damage: 12, width: vehicles.motorcycle.width,
    length: vehicles.motorcycle.length, speed: 8, spawnWeight: 3, color: '#dba66f' },
  motorbike: { kind: 'motorbike', name: 'Mô tô', hp: 26, damage: 16, width: vehicles.motorbike.width,
    length: vehicles.motorbike.length, speed: 10, spawnWeight: 2, color: '#a2a7c8' },
  car4: { kind: 'car4', name: 'Ô tô 4 chỗ', hp: 30, damage: balance.trafficDamage, width: vehicles.car4.width,
    length: vehicles.car4.length, speed: balance.trafficSpeed, spawnWeight: 4, color: '#d59561' },
  car7: { kind: 'car7', name: 'Ô tô 7 chỗ', hp: 48, damage: 26, width: vehicles.car7.width,
    length: vehicles.car7.length, speed: 5.5, spawnWeight: 2, color: '#8baaa2' },
  tricycle: { kind: 'tricycle', name: 'Ba gác', hp: 32, damage: 18, width: vehicles.tricycle.width,
    length: vehicles.tricycle.length, speed: 5, spawnWeight: 2, color: '#c5a568' },
  bus: { kind: 'bus', name: 'Xe buýt', hp: 90, damage: 38, width: vehicles.bus.width,
    length: vehicles.bus.length, speed: 4, spawnWeight: 1, color: '#8eabc3' },
  truck: { kind: 'truck', name: 'Xe tải', hp: 100, damage: 42, width: vehicles.truck.width,
    length: vehicles.truck.length, speed: 5, spawnWeight: 1, color: '#8a879c' },
  container: { kind: 'container', name: 'Container', hp: 130, damage: 50, width: vehicles.container.width,
    length: vehicles.container.length, speed: 4, spawnWeight: 1, color: '#b18773' },
};
if (Object.keys(trafficTypes).length !== Object.keys(vehicles).length) throw new Error('Traffic catalog incomplete');
for (const [kind, type] of Object.entries(trafficTypes)) if (!(kind in vehicles) || type.kind !== kind ||
  !Number.isFinite(type.hp) || !Number.isFinite(type.damage) || !Number.isFinite(type.speed) ||
  !Number.isInteger(type.spawnWeight) || type.hp <= 0 || type.damage <= 0 || type.speed <= 0 ||
  type.spawnWeight <= 0 || type.width >= balance.laneWidth * 1.5 || type.length <= 0) {
  throw new Error(`Invalid traffic type: ${kind}`);
}
export const trafficSpawnKinds: VehicleKind[] = Object.values(trafficTypes).flatMap(type =>
  Array<VehicleKind>(type.spawnWeight).fill(type.kind));
export const vehicleRam: Record<VehicleKind, { damage: number; breaksThrough: boolean }> = {
  motorcycle: { damage: 14, breaksThrough: false }, motorbike: { damage: 18, breaksThrough: false },
  car4: { damage: 24, breaksThrough: false }, car7: { damage: 30, breaksThrough: false },
  tricycle: { damage: 22, breaksThrough: false }, bus: { damage: 55, breaksThrough: true },
  truck: { damage: 60, breaksThrough: true }, container: { damage: 70, breaksThrough: true },
};
if (Object.keys(vehicleRam).length !== Object.keys(vehicles).length ||
  Object.values(vehicleRam).some(value => !Number.isFinite(value.damage) || value.damage <= 0)) {
  throw new Error('Invalid ram catalog');
}
export function newVehicle(kind: VehicleKind, id: string): VehicleInstance {
  const d = vehicles[kind];
  return { id, kind, fuel: d.fuelCapacity, durability: d.durabilityCapacity,
    upgrades: { engine: 0, tank: 0, armour: 0 }, disabled: false };
}
export function buyVehicle(inventory: VehicleInstance[], money: number, kind: VehicleKind,
  newId: string, discardId?: string): { inventory: VehicleInstance[]; money: number } | null {
  const price = vehicles[kind].price;
  if (!Number.isFinite(money) || money < price || inventory.some(v => v.id === newId)) return null;
  if (inventory.length === 2 && (!discardId || !inventory.some(v => v.id === discardId))) return null;
  if (inventory.length > 2 || (inventory.length < 2 && discardId)) return null;
  const kept = discardId ? inventory.filter(v => v.id !== discardId) : inventory;
  return { inventory: [...kept, newVehicle(kind, newId)], money: money - price };
}
