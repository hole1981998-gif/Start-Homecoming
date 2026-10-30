import { fillShopThumbnails } from './shop-thumbnails';
import { uiIcon, type UiIcon } from './ui-icons';
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
    command: (command: ShopCommand) => void) {
    host.addEventListener('change', event => {
      const select = event.target as HTMLSelectElement;
      if (select.id === 'shop-discard') { const confirm = host.querySelector<HTMLButtonElement>('[data-confirm]'); if (confirm) confirm.disabled = !select.value; return; }
      if (select.id !== 'shop-upgrade-target') return;
      this.upgradeTarget = select.value; this.render();
    });
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
      const icon = (name: UiIcon) => uiIcon(name).outerHTML;
    const vehicleIcon = (kind: VehicleKind) => `<img class="vehicle-thumbnail" data-vehicle-thumbnail="${kind}" alt="${vehicles[kind].name} — model 3D" width="360" height="240" />`;
    const button = (label: string, data: string, disabled = false) => `<button ${data}${disabled ? ' disabled' : ''}>${label}</button>`;
    const card = (image: string, title: string, detail: string, control: string, note = '') => `<article class="shop-card"><div class="shop-card-art">${image}</div><div class="shop-card-copy"><h3>${title}</h3><p>${detail}</p>${note}</div>${control}</article>`;
    const money = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 }).format(run.money);
    const inventory = `<section class="shop-inventory" aria-label="Hai ô vật phẩm">${run.inventory.map((item,i) => `<div><kbd>${i+1}</kbd>${item ? icon(({nitro:'nitro',star:'star',banana:'banana',grab:'grab'} as const)[item]) : icon('parcel')}<span>${item ? itemNames[item]+(item === 'grab' ? ' ×'+run.grabUses[i] : '') : 'Trống'}</span></div>`).join('')}</section>`;
    let content = '';
    if (this.tab === 'service') {
      content = card(icon('fuel'),'Bơm xăng',`Tới +${shopBalance.fuelAmount} L`,button(`${shopBalance.fuelPrice} · Bơm`,'data-service="fuel"',run.money < shopBalance.fuelPrice || run.fuel >= d.fuelCapacity-1e-9)) +
        card(icon('repair'),'Sửa xe',`Tới +${shopBalance.repairAmount} HP`,button(`${shopBalance.repairPrice} · Sửa`,'data-service="repair"',run.money < shopBalance.repairPrice || run.durability >= d.durabilityCapacity-1e-9));
    }
    if (this.tab === 'vehicle') {
      content = (Object.keys(vehicles) as VehicleKind[]).map(kind => {
        const owned = run.vehicleInstances.some(v => v.kind === kind), sold = !stock.vehicles.includes(kind), v = vehicles[kind];
        return card(vehicleIcon(kind),v.name,`${v.capacity} chỗ · ${v.price} tiền`,
          button(owned ? 'Đang sở hữu' : sold ? 'Hết hàng' : run.money < v.price ? 'Thiếu tiền' : 'Chọn mua',`data-vehicle="${kind}" aria-label="Chọn mua ${v.name}"`,owned || sold || run.money < v.price),
          `<details><summary>Thông số</summary><p>${vehicleSummary(kind,run.world.directorVersion === 'backup' ? 'backup' : undefined)}</p></details>`);
      }).join('');
      if (this.pending) {
        const kind = this.pending;
        content = `<section class="shop-confirm">${vehicleIcon(kind)}<h2>${vehicles[kind].name}</h2><strong>${vehicles[kind].price} tiền</strong><p>Chuyển sang xe mới · giữ ${run.riderIds.length} khách. Có thể quá tải.</p>` +
          (run.vehicleInstances.length === 2 ? `<label for="shop-discard">Kho đầy — chọn xe bỏ vĩnh viễn</label><select id="shop-discard"><option value="">Chọn xe bỏ…</option>${run.vehicleInstances.map(v => `<option value="${v.id}">${vehicles[v.kind].name}${v.id === run.activeVehicleId ? ' · đang lái' : ' · dự phòng'} · ${(v.id === run.activeVehicleId ? run.fuel : v.fuel).toFixed(1)} L / ${Math.ceil(v.id === run.activeVehicleId ? run.durability : v.durability)} HP</option>`).join('')}</select>` : '<p>Xe hiện tại ở lại trong kho.</p>') +
          `<div class="shop-confirm-actions">${button('Huỷ mua','data-cancel="true"')}${button('Xác nhận mua','data-confirm="true"',run.vehicleInstances.length === 2)}</div></section>`;
      }
    }
    if (this.tab === 'upgrade') {
      const upgradeIcons = {engine:'engine',tank:'fuel',armour:'shield',economy:'economy'} as const;
      const details = {engine:'+8% tốc độ tối đa',tank:'+15% bình · không bơm thêm',armour:'+15% HP tối đa · không tự sửa',economy:'−8% tiêu hao nền'};
      content = `<div class="shop-target"><label for="shop-upgrade-target">Nâng cấp cho</label><select id="shop-upgrade-target">${run.vehicleInstances.map(v => `<option value="${v.id}"${v.id === upgradeTarget.id ? ' selected' : ''}>${vehicles[v.kind].name} · ${v.id === run.activeVehicleId ? 'đang lái' : 'dự phòng'}</option>`).join('')}</select></div>` +
        (Object.keys(upgradeNames) as UpgradeKind[]).map(kind => {
          const level=upgradeTarget.upgrades[kind] ?? 0, price=upgradePrice(kind,level);
          return card(icon(upgradeIcons[kind]),upgradeNames[kind],`${details[kind]} / cấp`,button(price === undefined ? 'Tối đa' : `${price} · Nâng cấp`,`data-upgrade="${kind}" aria-label="Nâng cấp ${upgradeNames[kind]}"`,price === undefined || run.money < price),`<span class="shop-level">Cấp ${level}/3</span>`);
        }).join('');
    }
    if (this.tab === 'power-item') content = (['nitro','star','grab','banana'] as const).map(item => {
      const price=powerItemPrice(item,run.world.directorVersion === 'backup'), count=stock.items?.[item] ?? 0;
      const effect = item === 'nitro' ? `Tăng tốc ${itemBalance.boostSeconds}s · Space nhảy` : item === 'star' ? `Chống sát thương ${itemBalance.starSeconds}s · không bỏ sự kiện` : item === 'banana' ? 'Né cả nhóm chốt · dùng khi có cue' : `${itemBalance.grabUses} lượt gọi · F đón · thưởng khách ×${itemBalance.grabMoneyMultiplier}`;
      return card(icon(({nitro:'nitro',star:'star',grab:'grab',banana:'banana'} as const)[item]),itemNames[item],effect,button(count === 0 ? 'Hết hàng' : !run.inventory.includes(null) ? 'Kho đầy' : `${price} · Mua`,`data-power="${item}" aria-label="Mua ${itemNames[item]}"`,run.money < price || !run.inventory.includes(null) || !count),`<span class="shop-stock">Còn ${count}</span>`);
    }).join('');
    const garage = `<details class="shop-garage" aria-label="Kho xe, tối đa hai xe"><summary><strong>${d.name}</strong><span>${run.fuel.toFixed(1)} L · ${Math.ceil(run.durability)} HP</span><b>Kho ${run.vehicleInstances.length}/2</b></summary>${run.vehicleInstances.map(v => `<div class="garage-vehicle${v.id === run.activeVehicleId ? ' is-active' : ''}">${vehicleIcon(v.kind)}<div><strong>${vehicles[v.kind].name}</strong><small>${v.id === run.activeVehicleId ? 'Đang lái' : 'Dự phòng'} · ${(v.id === run.activeVehicleId ? run.fuel : v.fuel).toFixed(1)} L · ${Math.ceil(v.id === run.activeVehicleId ? run.durability : v.durability)} HP</small></div></div>`).join('')}</details>`;
    this.host.innerHTML = `<div class="shop-wallet">${icon('coins')}<strong>${money}</strong><span>tiền</span></div>${garage}${this.tab === 'power-item' ? inventory : ''}<nav aria-label="Danh mục cửa hàng">${(['service','vehicle','upgrade','power-item'] as const).map((tab,i) => button(icon((['repair','car','engine','bag'] as const)[i])+`<span>${['Tiếp tế','Xe','Nâng cấp','Vật phẩm'][i]}</span>`,`data-tab="${tab}" aria-pressed="${tab === this.tab}"`)).join('')}</nav><div class="shop-content${this.pending ? ' confirming' : ''}">${content}</div>`;
    fillShopThumbnails(this.host);
    if (this.pending) this.host.scrollTop = 0;
    if (hadFocus) (this.host.querySelector<HTMLSelectElement>('#shop-discard, #shop-upgrade-target') ??
      this.host.querySelector<HTMLButtonElement>('nav button[aria-pressed="true"]'))?.focus({ preventScroll: true });
  }
}
