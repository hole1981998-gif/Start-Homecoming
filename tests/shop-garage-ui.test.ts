// @vitest-environment jsdom
import { expect, it, vi } from 'vitest';
import { ShopView } from '../src/shop-view';
import { enterShop, transact } from '../src/shop';
import { initialRun } from '../src/survival';
import { developmentScenario } from '../src/development';
import { vehicles } from '../src/vehicles';

vi.mock('../src/vehicle-thumbnails', async () => {
  const { vehicles } = await import('../src/vehicles');
  return { vehicleThumbnailSources: () => Object.fromEntries(Object.keys(vehicles).map(kind => [kind, 'data:image/png;base64,' + btoa(kind)])) };
});

it('shop UI lists the full catalog, locks owned kinds and upgrades a selected spare without switching', async () => {
  document.body.innerHTML = '<div id="shop"></div>';
  const host = document.getElementById('shop')!;
  let run = enterShop({ ...developmentScenario(initialRun(17), 'shop-third'), phase: 'running' });
  const view = new ShopView(host, () => run, command => { run = transact(run, command).run; });
  view.reset(); view.render();
  const click = (selector: string) => host.querySelector<HTMLButtonElement>(selector)!.click();
  click('[data-tab="vehicle"]');
  await vi.dynamicImportSettled();
  const thumbs = [...host.querySelectorAll<HTMLImageElement>('.shop-card img[data-vehicle-thumbnail]')];
  expect(thumbs).toHaveLength(8); expect(new Set(thumbs.map(image => image.src)).size).toBe(8);
  for (const image of thumbs) expect(image.src).toBe('data:image/png;base64,' + btoa(image.dataset.vehicleThumbnail!));
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
  expect(host.querySelector('[data-upgrade="tank"]')!.closest('.shop-card')!.textContent).toContain('Cấp 1/3');
});

it('requires an explicit discard for a third vehicle, supports cancel, and preserves passengers', () => {
 document.body.innerHTML='<div id="shop"></div>';const host=document.getElementById('shop')!;
 let run=enterShop({...developmentScenario(initialRun(17),'shop-third'),phase:'running'});
 const view=new ShopView(host,()=>run,command=>{run=transact(run,command).run;});view.reset();view.render();
 const click=(selector:string)=>host.querySelector<HTMLButtonElement>(selector)!.click();
 const before=structuredClone(run);click('[data-tab="vehicle"]');click('[data-vehicle="tricycle"]');
 expect(host.querySelector<HTMLImageElement>('.shop-confirm img')!.dataset.vehicleThumbnail).toBe('tricycle');
 expect(host.querySelector<HTMLButtonElement>('[data-confirm]')!.disabled).toBe(true);
 click('[data-confirm]');expect(run).toEqual(before);
 click('[data-cancel]');expect(run).toEqual(before);expect(host.querySelector('[data-confirm]')).toBeNull();
 click('[data-vehicle="tricycle"]');const discard=host.querySelector<HTMLSelectElement>('#shop-discard')!;
 discard.value='qa-spare';discard.dispatchEvent(new Event('change',{bubbles:true}));
 expect(host.querySelector<HTMLButtonElement>('[data-confirm]')!.disabled).toBe(false);click('[data-confirm]');
 expect(run.vehicleInstances).toHaveLength(2);expect(run.vehicleInstances.some(v=>v.id==='qa-spare')).toBe(false);
 expect(run.riderIds).toEqual(before.riderIds);expect(run.money).toBe(before.money-vehicles.tricycle.price);
 expect(run.vehicleInstances.find(v=>v.id===before.activeVehicleId)!.fuel).toBe(before.fuel);
});
