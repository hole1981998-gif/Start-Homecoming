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
