import { itemBalance, shopBalance } from './config';
import type { Run } from './survival';
import { effectiveVehicle, vehicles, type VehicleKind } from './vehicles';
import { powerItemPrice, reachableShop, upgradeNames, upgradePrice, vehicleSummary, type ShopCommand, type UpgradeKind } from './shop';

import { itemNames, type PowerItem } from './items';

/** Prototype shop UI. Transactions remain pure and revalidate every command. */
export class ShopView {
  private tab: 'service' | 'vehicle' | 'upgrade' | 'power-item' = 'service';
  private pending: VehicleKind | null = null;
  private upgradeTarget: string | null = null;
  constructor(private host: HTMLElement, private read: () => Run,
    command: (command: ShopCommand) => void,
    private ui?: (cue: 'shop_category' | 'menu_select' | 'menu_back') => void) {
    host.addEventListener('change', event => {
      const select = event.target as HTMLSelectElement;
      if (select.id !== 'shop-upgrade-target') return;
      this.upgradeTarget = select.value; this.ui?.('shop_category'); this.render();
    });
    host.addEventListener('click', event => {
      const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button');
      if (!button || button.disabled) return;
      const run = read(), sequence = run.economySequence;
      if (button.dataset.tab) { if (this.tab !== button.dataset.tab) this.ui?.('shop_category'); this.tab = button.dataset.tab as typeof this.tab; this.pending = null; this.render(); return; }
      if (button.dataset.vehicle) { this.pending = button.dataset.vehicle as VehicleKind; this.ui?.('menu_select'); this.render(); return; }
      if (button.dataset.cancel) { this.pending = null; this.ui?.('menu_back'); this.render(); return; }
      if (button.dataset.confirm) {
        const discardId = host.querySelector<HTMLSelectElement>('#shop-discard')?.value;
        if (!this.pending) return;
        command({ kind: 'vehicle', vehicle: this.pending, discardId: discardId || undefined, sequence });
        if (this.read().economySequence !== sequence) this.pending = null;
        this.render(); return;
      }
      if (button.dataset.service) command({ kind: 'service', item: button.dataset.service as 'fuel' | 'repair', sequence });
      if (button.dataset.power) command({ kind: 'power-item', item: button.dataset.power as PowerItem, sequence });
      if (button.dataset.upgrade) command({ kind: 'upgrade', upgrade: button.dataset.upgrade as UpgradeKind,
        targetId: this.upgradeTarget ?? run.activeVehicleId, sequence });
      this.render();
    });
  }
  reset(): void { this.tab = 'service'; this.pending = null; this.upgradeTarget = this.read().activeVehicleId; }
  render(): void {
    const hadFocus = this.host.contains(document.activeElement);
    const run = this.read(), shop = reachableShop(run);
    if (!shop?.shopStock) return;
    const stock = shop.shopStock, instance = run.vehicleInstances.find(v => v.id === run.activeVehicleId)!, d = effectiveVehicle(instance);
    const upgradeTarget = run.vehicleInstances.find(v => v.id === this.upgradeTarget) ?? instance;
    this.upgradeTarget = upgradeTarget.id;
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
      content = (Object.keys(vehicles) as VehicleKind[]).map(kind => {
        const owned = run.vehicleInstances.some(v => v.kind === kind), sold = !stock.vehicles.includes(kind);
        return row(vehicles[kind].name, `${vehicleSummary(kind, run.world.directorVersion === 'backup' ? 'backup' : undefined)} · ${vehicles[kind].price} tiền`,
          button(owned ? 'Đã sở hữu' : sold ? 'Hết hàng' : 'Chọn mua',
            `data-vehicle="${kind}" aria-label="${owned ? 'Đã sở hữu' : 'Chọn mua'} ${vehicles[kind].name}"`,
            owned || sold || run.money < vehicles[kind].price));
      }).join('');
      if (this.pending) {
        const kind = this.pending;
        content = `<div class="shop-confirm"><strong>Mua ${vehicles[kind].name} · ${vehicles[kind].price} tiền?</strong>
          <p>Xe mới trở thành xe đang lái. Giữ nguyên ${run.riderIds.length} khách đi nhờ; xe mới có thể quá tải.</p>` +
          (run.vehicleInstances.length === 2 ? `<label for="shop-discard">Kho đủ 2 xe — chọn xe bỏ vĩnh viễn</label><select id="shop-discard"><option value="">Chưa chọn xe bỏ</option>${run.vehicleInstances.map(v => `<option value="${v.id}">${vehicles[v.kind].name}${v.id === run.activeVehicleId ? ' (đang chạy)' : ' (dự phòng)'} · ${v.id === run.activeVehicleId ? run.fuel.toFixed(1) : v.fuel.toFixed(1)} L / ${Math.ceil(v.id === run.activeVehicleId ? run.durability : v.durability)} HP</option>`).join('')}</select>` : '<p>Xe hiện tại được giữ trong kho dự phòng.</p>') +
          button('Xác nhận mua', 'data-confirm="true"') + button('Huỷ mua', 'data-cancel="true"') + '</div>';
      }
    }
    if (this.tab === 'upgrade') content = `<label for="shop-upgrade-target">Xe cần nâng cấp</label>
      <select id="shop-upgrade-target">${run.vehicleInstances.map(v => `<option value="${v.id}"${v.id === upgradeTarget.id ? ' selected' : ''}>${vehicles[v.kind].name} (${v.id === run.activeVehicleId ? 'đang lái' : 'dự phòng'})</option>`).join('')}</select>
      <p>Nâng cấp ${vehicles[upgradeTarget.kind].name}; giữ nguyên xe đang lái, xăng và HP hiện có.</p>` +
      (Object.keys(upgradeNames) as UpgradeKind[]).map(kind => {
      const level = upgradeTarget.upgrades[kind] ?? 0, price = upgradePrice(kind, level);
      const details = { engine: '+8% tốc độ tối đa/cấp', tank: '+15% bình/cấp; không bơm thêm', armour: '+15% HP tối đa/cấp; không tự sửa', economy: '−8% tiêu hao nền/cấp' };
      return row(`${upgradeNames[kind]} · ${level}/3`, `${details[kind]}${price === undefined ? '' : ` · ${price} tiền`}`,
        button(price === undefined ? 'Tối đa' : 'Nâng cấp', `data-upgrade="${kind}" aria-label="Nâng cấp ${upgradeNames[kind]}"`, price === undefined || run.money < price));
    }).join('');
    if (this.tab === 'power-item') content = (['nitro', 'star', 'grab', 'banana'] as const).map(item => {
      const price = powerItemPrice(item, run.world.directorVersion === 'backup');
      const effect = item === 'nitro' ? 'Boost ' + itemBalance.boostSeconds + ' s; Space nhảy ' + itemBalance.jumpSeconds + ' s khi đang boost; không vượt xe cao' :
        item === 'star' ? 'Miễn damage/debuff ' + itemBalance.starSeconds + ' s; không bỏ qua event' :
        item === 'banana' ? 'Trong cửa sổ cảnh báo: vô hiệu cả nhóm công an/dân phòng; họ đứng yên và chạm vào không bị bắt' :
        itemBalance.grabUses + ' lượt gọi khách Grab; F đón; thưởng khách ×' + itemBalance.grabMoneyMultiplier + ', không nhân thu nhập nền; còn khách chờ/không có chỗ thì không trừ lượt';
      return row(itemNames[item], effect + ' · ' + price + ' tiền · còn ' + (stock.items?.[item] ?? 0),
        button('Mua', 'data-power="' + item + '" aria-label="Mua ' + itemNames[item] + '"',
          run.money < price || !run.inventory.includes(null) || !(stock.items?.[item]))) }).join('') +
      '<p>Kho 1/2: ' + run.inventory.map((item, i) => (i + 1) + ': ' + (item ? itemNames[item] + (item === 'grab' ? ' ×' + run.grabUses[i] : '') : 'Trống')).join(' · ') + '</p>';
    this.host.innerHTML = `<p class="shop-wallet">${money} tiền · ${d.name}<br>${run.fuel.toFixed(1)}/${d.fuelCapacity.toFixed(1)} L · ${Math.ceil(run.durability)}/${Math.ceil(d.durabilityCapacity)} HP</p>
      <nav aria-label="Danh mục cửa hàng">${(['service', 'vehicle', 'upgrade', 'power-item'] as const).map((tab, i) =>
      button(['Tiếp tế', 'Mua xe', 'Nâng cấp', 'Vật phẩm'][i], `data-tab="${tab}" aria-pressed="${tab === this.tab}"`)).join('')}</nav><div class="shop-content">${content}</div>`;
    if (hadFocus) (this.host.querySelector<HTMLSelectElement>('#shop-discard, #shop-upgrade-target') ??
      this.host.querySelector<HTMLButtonElement>('nav button[aria-pressed="true"]'))?.focus({ preventScroll: true });
  }
}
