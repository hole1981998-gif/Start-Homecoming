import { shopBalance } from './config';
import type { Run } from './survival';
import { effectiveVehicle, vehicles, type VehicleKind } from './vehicles';
import { reachableShop, upgradeNames, upgradePrice, vehicleSummary, type ShopCommand, type UpgradeKind } from './shop';

/** Prototype shop UI. Transactions remain pure and revalidate every command. */
export class ShopView {
  private tab: 'service' | 'vehicle' | 'upgrade' | 'item' = 'service';
  private pending: VehicleKind | null = null;
  constructor(private host: HTMLElement, private read: () => Run,
    command: (command: ShopCommand) => void, select: (index: number) => void) {
    host.addEventListener('click', event => {
      const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button');
      if (!button || button.disabled) return;
      const run = read(), sequence = run.economySequence;
      if (button.dataset.tab) { this.tab = button.dataset.tab as typeof this.tab; this.pending = null; this.render(); return; }
      if (button.dataset.vehicle) { this.pending = button.dataset.vehicle as VehicleKind; this.render(); return; }
      if (button.dataset.cancel) { this.pending = null; this.render(); return; }
      if (button.dataset.confirm) {
        const discardId = host.querySelector<HTMLSelectElement>('#shop-discard')?.value;
        if (!this.pending) return;
        command({ kind: 'vehicle', vehicle: this.pending, discardId: discardId || undefined, sequence });
        if (this.read().economySequence !== sequence) this.pending = null;
        this.render(); return;
      }
      if (button.dataset.service) command({ kind: 'service', item: button.dataset.service as 'fuel' | 'repair', sequence });
      if (button.dataset.item) command({ kind: 'item', item: button.dataset.item as 'fuel' | 'repair', sequence });
      if (button.dataset.upgrade) command({ kind: 'upgrade', upgrade: button.dataset.upgrade as UpgradeKind, sequence });
      if (button.dataset.select !== undefined) select(Number(button.dataset.select));
      this.render();
    });
  }
  reset(): void { this.tab = 'service'; this.pending = null; }
  render(): void {
    const hadFocus = this.host.contains(document.activeElement);
    const run = this.read(), shop = reachableShop(run);
    if (!shop?.shopStock) return;
    const stock = shop.shopStock, instance = run.vehicleInstances.find(v => v.id === run.activeVehicleId)!, d = effectiveVehicle(instance);
    const button = (label: string, data: string, disabled = false) => `<button ${data}${disabled ? ' disabled' : ''}>${label}</button>`;
    const row = (title: string, detail: string, control: string) => `<div class="shop-row"><div><strong>${title}</strong><small>${detail}</small></div>${control}</div>`;
    const money = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 }).format(run.money);
    let content = '';
    if (this.tab === 'service') {
      content = row('Bơm xăng', `+ tối đa ${shopBalance.fuelAmount} L · ${shopBalance.fuelPrice} tiền`,
        button('Bơm', 'data-service="fuel"', run.money < shopBalance.fuelPrice || run.fuel >= d.fuelCapacity - 1e-9)) +
        row('Sửa xe', `+ tối đa ${shopBalance.repairAmount} HP · ${shopBalance.repairPrice} tiền`,
          button('Sửa', 'data-service="repair"', run.money < shopBalance.repairPrice || run.durability >= d.durabilityCapacity - 1e-9));
    }
    if (this.tab === 'vehicle') {
      content = stock.vehicles.map(kind => row(vehicles[kind].name, `${vehicleSummary(kind)} · ${vehicles[kind].price} tiền`,
        button('Chọn mua', `data-vehicle="${kind}" aria-label="Chọn mua ${vehicles[kind].name}"`, run.money < vehicles[kind].price))).join('');
      if (this.pending) {
        const kind = this.pending;
        content = `<div class="shop-confirm"><strong>Mua ${vehicles[kind].name} · ${vehicles[kind].price} tiền?</strong>
          <p>Xe mới trở thành xe đang lái. Giữ nguyên ${run.riderIds.length} khách đi nhờ; xe mới có thể quá tải.</p>` +
          (run.vehicleInstances.length === 2 ? `<label for="shop-discard">Kho đủ 2 xe — chọn xe bỏ vĩnh viễn</label><select id="shop-discard"><option value="">Chưa chọn xe bỏ</option>${run.vehicleInstances.map(v => `<option value="${v.id}">${vehicles[v.kind].name}${v.id === run.activeVehicleId ? ' (đang chạy)' : ' (dự phòng)'} · ${v.id === run.activeVehicleId ? run.fuel.toFixed(1) : v.fuel.toFixed(1)} L / ${Math.ceil(v.id === run.activeVehicleId ? run.durability : v.durability)} HP</option>`).join('')}</select>` : '<p>Xe hiện tại được giữ trong kho dự phòng.</p>') +
          button('Xác nhận mua', 'data-confirm="true"') + button('Huỷ mua', 'data-cancel="true"') + '</div>';
      }
    }
    if (this.tab === 'upgrade') content = (Object.keys(upgradeNames) as UpgradeKind[]).map(kind => {
      const level = instance.upgrades[kind] ?? 0, price = upgradePrice(kind, level);
      const details = { engine: '+8% tốc độ tối đa/cấp', tank: '+15% bình/cấp; không bơm thêm', armour: '+15% HP tối đa/cấp; không tự sửa', economy: '−8% tiêu hao nền/cấp' };
      return row(`${upgradeNames[kind]} · ${level}/3`, `${details[kind]}${price === undefined ? '' : ` · ${price} tiền`}`,
        button(price === undefined ? 'Tối đa' : 'Nâng cấp', `data-upgrade="${kind}" aria-label="Nâng cấp ${upgradeNames[kind]}"`, price === undefined || run.money < price));
    }).join('');
    if (this.tab === 'item') content = (['fuel', 'repair'] as const).map(item => {
      const price = item === 'fuel' ? shopBalance.fuelItemPrice : shopBalance.repairItemPrice;
      return row(item === 'fuel' ? 'Gói xăng' : 'Bộ sửa', `${price} tiền · còn ${stock[item]}`,
        button('Mua mang theo', `data-item="${item}" aria-label="Mua ${item === 'fuel' ? 'gói xăng' : 'bộ sửa'}"`,
          stock[item] <= 0 || run.money < price || run.inventory.length >= shopBalance.inventoryLimit));
    }).join('') + `<p>Kho ${run.inventory.length}/${shopBalance.inventoryLimit} · chọn món để dùng bằng R khi lái:</p>` +
      run.inventory.map((item, i) => button(`${i === run.selectedItem ? '✓ ' : ''}${i + 1}. ${item === 'fuel' ? 'Xăng' : 'Sửa'}`, `data-select="${i}" aria-pressed="${i === run.selectedItem}"`)).join('');
    this.host.innerHTML = `<p class="shop-wallet">${money} tiền · ${d.name}<br>${run.fuel.toFixed(1)}/${d.fuelCapacity.toFixed(1)} L · ${Math.ceil(run.durability)}/${Math.ceil(d.durabilityCapacity)} HP</p>
      <nav aria-label="Danh mục cửa hàng">${(['service', 'vehicle', 'upgrade', 'item'] as const).map((tab, i) =>
      button(['Tiếp tế', 'Mua xe', 'Nâng cấp', 'Vật phẩm'][i], `data-tab="${tab}" aria-pressed="${tab === this.tab}"`)).join('')}</nav><div class="shop-content">${content}</div>`;
    if (hadFocus) (this.host.querySelector<HTMLSelectElement>('#shop-discard') ??
      this.host.querySelector<HTMLButtonElement>('nav button[aria-pressed="true"]'))?.focus({ preventScroll: true });
  }
}
