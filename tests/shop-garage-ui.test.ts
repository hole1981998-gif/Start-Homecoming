// @vitest-environment jsdom
import { expect, it } from 'vitest';
import { ShopView } from '../src/shop-view';
import { enterShop, transact } from '../src/shop';
import { initialRun } from '../src/survival';
import { developmentScenario } from '../src/development';
import { vehicles } from '../src/vehicles';

it('shop UI lists the full catalog, locks owned kinds and upgrades a selected spare without switching', () => {
  document.body.innerHTML = '<div id="shop"></div>';
  const host = document.getElementById('shop')!;
  let run = enterShop({ ...developmentScenario(initialRun(17), 'shop-third'), phase: 'running' });
  const view = new ShopView(host, () => run, command => { run = transact(run, command).run; });
  view.reset(); view.render();
  const click = (selector: string) => host.querySelector<HTMLButtonElement>(selector)!.click();
  click('[data-tab="vehicle"]');
  expect(host.querySelectorAll('[data-vehicle]')).toHaveLength(Object.keys(vehicles).length);
  expect(host.querySelector<HTMLButtonElement>('[data-vehicle="motorcycle"]')!.disabled).toBe(true);
  expect(host.querySelector<HTMLButtonElement>('[data-vehicle="car7"]')!.disabled).toBe(true);
  expect(host.querySelector<HTMLButtonElement>('[data-vehicle="tricycle"]')!.disabled).toBe(false);
  expect(host.querySelector<HTMLButtonElement>('[data-vehicle="container"]')!.disabled).toBe(false);
  click('[data-tab="upgrade"]');
  const select = host.querySelector<HTMLSelectElement>('#shop-upgrade-target')!;
  select.value = 'qa-spare'; select.dispatchEvent(new Event('change', { bubbles: true }));
  click('[data-upgrade="tank"]');
  expect(run.vehicleInstances.find(v => v.id === 'qa-spare')!.upgrades.tank).toBe(1);
  expect(run.vehicleInstances[0].upgrades.tank).toBe(0);
  expect(run.activeVehicleId).not.toBe('qa-spare'); expect(run.fuel).toBe(1); expect(run.durability).toBe(30);
  expect(host.querySelector<HTMLSelectElement>('#shop-upgrade-target')!.value).toBe('qa-spare');
  expect(host.textContent).toContain('Bình xăng · 1/3');
});
