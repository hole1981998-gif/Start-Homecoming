import { balance, shopBalance } from './config';
import type { Run } from './survival';
import { buyVehicle, effectiveVehicle, vehicles, type VehicleKind } from './vehicles';
import type { Entity } from './world';

export type ItemKind = 'fuel' | 'repair';
export type UpgradeKind = 'engine' | 'tank' | 'armour' | 'economy';
export type ShopCommand = { sequence: number } & (
  { kind: 'vehicle'; vehicle: VehicleKind; discardId?: string } |
  { kind: 'service' | 'item'; item: ItemKind } | { kind: 'upgrade'; upgrade: UpgradeKind });
export const upgradeNames: Record<UpgradeKind, string> = {
  engine: 'Động cơ', tank: 'Bình xăng', armour: 'Gia cố', economy: 'Tiết kiệm xăng' };
export function upgradePrice(kind: UpgradeKind, level: number): number | undefined {
  return shopBalance[`${kind}Prices`][level];
}
export function reachableShop(run: Run): Entity | undefined {
  if (run.crash || run.result) return;
  return run.world.entities.find(e => e.kind === 'shop' && !e.consumed && e.shopStock &&
    Math.abs(e.distance - run.distance) <= shopBalance.reach && Math.abs(e.x - run.x) <= shopBalance.lateralReach);
}
export function enterShop(run: Run): Run {
  const shop = reachableShop(run);
  if (run.phase !== 'running' || !shop) return run;
  return { ...run, phase: 'paused', shopId: shop.id };
}
export function leaveShop(run: Run): Run { return { ...run, shopId: null }; }
const sync = (run: Run) => run.vehicleInstances.map(v => v.id === run.activeVehicleId ?
  { ...v, fuel: run.fuel, durability: run.durability } : v);

/** Validate then apply once; repeated/stale commands never repeat a charge. */
export function transact(run: Run, command: ShopCommand): { run: Run; message: string } {
  const fail = (message: string) => ({ run, message });
  const shop = reachableShop(run);
  if (run.phase !== 'paused' || !shop || shop.id !== run.shopId || command.sequence !== run.economySequence ||
    !Number.isFinite(run.money) || run.money < 0) return fail('Giao dịch đã cũ hoặc ngoài cửa hàng.');
  const stock = shop.shopStock!, instances = sync(run);
  const active = instances.find(v => v.id === run.activeVehicleId)!;
  const definition = effectiveVehicle(active);
  let next = { ...run };
  const updatedStock = { ...stock, vehicles: [...stock.vehicles] };
  let price = 0, message = '';
  if (command.kind === 'vehicle') {
    if (!stock.vehicles.includes(command.vehicle)) return fail('Xe không còn tại cửa hàng này.');
    if (instances.length >= 2 && !command.discardId) return fail('Chọn chiếc xe sẽ bỏ trước khi xác nhận mua.');
    const bought = buyVehicle(instances, run.money, command.vehicle, `${run.runId}-purchase-${run.economySequence}`, command.discardId);
    if (!bought) return fail('Không đủ tiền hoặc lựa chọn xe bỏ không hợp lệ.');
    const target = bought.inventory[bought.inventory.length - 1], d = effectiveVehicle(target);
    next = { ...run, vehicleInstances: bought.inventory, activeVehicleId: target.id, money: bought.money,
      fuel: target.fuel, durability: target.durability, motion: 'powered', coastRemaining: balance.coastDistance,
      speed: Math.min(run.speed, d.maxSpeed), recovering: run.speed < d.minSpeed,
      x: Math.max(-(balance.laneWidth * balance.laneCount - d.width) / 2,
        Math.min((balance.laneWidth * balance.laneCount - d.width) / 2, run.x)) };
    const overlaps = run.world.entities.filter(e => ['water', 'pothole', 'traffic'].includes(e.kind) && !e.consumed &&
      Math.abs(e.x - next.x) <= (e.width + d.width) / 2 && Math.abs(e.distance - run.distance) <= (e.length + d.length) / 2);
    next.protectedEntities = [...new Set([...run.protectedEntities, ...overlaps.map(e => e.id)])];
    updatedStock.vehicles = stock.vehicles.filter(k => k !== command.vehicle);
    message = `Đã mua ${d.name}; khách giữ nguyên.${command.discardId ? ' Đã bỏ xe đã chọn.' : ''}`;
  } else if (command.kind === 'upgrade') {
    const level = active.upgrades[command.upgrade] ?? 0;
    const cost = upgradePrice(command.upgrade, level);
    if (cost === undefined) return fail('Đã đạt cấp tối đa.');
    price = cost;
    next.vehicleInstances = instances.map(v => v.id === active.id ?
      { ...v, upgrades: { ...v.upgrades, [command.upgrade]: level + 1 } } : v);
    message = `${upgradeNames[command.upgrade]} cấp ${level + 1}; không tự bơm/sửa thêm.`;
  } else {
    const fuel = command.item === 'fuel';
    price = command.kind === 'item' ? fuel ? shopBalance.fuelItemPrice : shopBalance.repairItemPrice :
      fuel ? shopBalance.fuelPrice : shopBalance.repairPrice;
    if (command.kind === 'item') {
      if (run.inventory.length >= shopBalance.inventoryLimit) return fail('Kho vật phẩm đã đầy.');
      if (stock[command.item] <= 0) return fail('Vật phẩm đã hết ở cửa hàng này.');
      next.inventory = [...run.inventory, command.item]; updatedStock[command.item]--;
      message = 'Đã mua vật phẩm; chọn trong cửa hàng và dùng R khi lái.';
    } else {
      const gained = fuel ? Math.min(shopBalance.fuelAmount, definition.fuelCapacity - run.fuel) :
        Math.min(shopBalance.repairAmount, definition.durabilityCapacity - run.durability);
      if (gained <= 1e-9) return fail(fuel ? 'Bình đã đầy; không thu tiền.' : 'Xe còn nguyên độ bền; không thu tiền.');
      if (fuel) { next.fuel += gained; next.motion = 'powered'; next.coastRemaining = balance.coastDistance; }
      else next.durability += gained;
      next.vehicleInstances = instances.map(v => v.id === active.id ? { ...v, fuel: next.fuel, durability: next.durability,
        disabled: next.fuel <= 0 || next.durability <= 0 } : v);
      message = fuel ? `Đã bơm +${gained.toFixed(1)} L.` : `Đã sửa +${gained.toFixed(0)} HP.`;
    }
    if (command.kind === 'item') next.vehicleInstances = instances;
  }
  if (run.money < price) return fail('Không đủ tiền.');
  next.money -= price;
  next.economySequence++;
  next.world = { ...run.world, entities: run.world.entities.map(e => e.id === shop.id ? { ...e, shopStock: updatedStock } : e) };
  return { run: next, message };
}

export function useItem(run: Run): Run {
  if (run.phase !== 'running' || run.crash || run.result) return run;
  const item = run.inventory[run.selectedItem]; if (!item) return run;
  const active = run.vehicleInstances.find(v => v.id === run.activeVehicleId)!, d = effectiveVehicle(active);
  const gain = item === 'fuel' ? Math.min(shopBalance.fuelAmount, d.fuelCapacity - run.fuel) :
    Math.min(shopBalance.repairAmount, d.durabilityCapacity - run.durability);
  if (gain <= 1e-9) return run;
  const inventory = run.inventory.filter((_, i) => i !== run.selectedItem);
  const next: Run = { ...run, inventory, selectedItem: Math.min(run.selectedItem, Math.max(0, inventory.length - 1)),
    fuel: run.fuel + (item === 'fuel' ? gain : 0), durability: run.durability + (item === 'repair' ? gain : 0),
    eventSequence: run.eventSequence + 1, feedbackKind: item, feedbackAt: run.activeSeconds,
    feedback: item === 'fuel' ? `Dùng xăng · +${gain.toFixed(1)} L` : `Dùng bộ sửa · +${gain.toFixed(0)} HP` };
  if (item === 'fuel') { next.motion = 'powered'; next.coastRemaining = balance.coastDistance; }
  next.vehicleInstances = sync(next);
  return next;
}

export function vehicleSummary(kind: VehicleKind): string {
  const d = vehicles[kind];
  return `${d.capacity} chỗ · trung vị ${(d.cruiseSpeed * 3.6).toFixed(0)} km/h · ${d.fuelCapacity} L · ${d.durabilityCapacity} HP`;
}
