// @vitest-environment jsdom
import { expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import type { World } from '../src/world';
vi.mock('../src/world', async importOriginal => {
  const actual = await importOriginal<typeof import('../src/world')>();
  // Isolate the existing input/focus regression from discovery/hazard tests below.
  return { ...actual, fillWorld: (world: World) => ({ ...world, entities: [] }) };
});

const renderer = vi.hoisted(() => ({ draws: 0, instances: 0, lowEffects: false }));
vi.mock('../src/render', () => ({ RoadRenderer: class {
  setLowEffects(enabled: boolean) { renderer.lowEffects = enabled; }
  constructor() { renderer.instances++; }
  draw() { renderer.draws++; }
  project() { return { x: 50, y: 40 }; }
  dispose() { /* no WebGL context in DOM tests */ }
} }));

it('real input/UI wiring: release, blur, pause button, help, focus trap and repeat restarts', async () => {
  document.body.innerHTML = new DOMParser().parseFromString(readFileSync('index.html', 'utf8'), 'text/html').body.innerHTML;
  localStorage.clear();
  let now = 0;
  let nextFrame: FrameRequestCallback = () => { throw new Error('RAF not registered'); };
  vi.stubGlobal('performance', { now: () => now });
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => { nextFrame = callback; return 1; });
  await import('../src/main');
  const el = (id: string) => document.getElementById(id) as HTMLElement;
  const tick = (seconds: number) => { for (let i = 0; i < seconds * 60; i++) { now += 1000 / 60; nextFrame(now); } };
  const key = (type: string, code: string, extra: KeyboardEventInit = {}) => window.dispatchEvent(new KeyboardEvent(type, { code, bubbles: true, cancelable: true, ...extra }));
  const click = (id: string) => { el(id).focus(); el(id).click(); };
  expect(el('release-help').textContent).toContain('Thả W/S');
  expect(document.getElementById('cruise')).toBeNull();
  expect(el('junction-cue').classList.contains('sr-only')).toBe(true);
  expect(el('junction-left').textContent).toBe('Q'); expect(el('junction-right').textContent).toBe('E');
  expect(document.querySelector('#game > .version-link')).toBeNull();
  expect(document.querySelector('#game > .version-badge')).toBeNull();
  expect(document.querySelector('.modal-version-link')).not.toBeNull();
  expect(el('release-help').textContent).not.toContain('50,4');
  const effects = el('effects-toggle') as HTMLInputElement;
  effects.checked = true; effects.dispatchEvent(new Event('change'));
  expect(renderer.lowEffects).toBe(true);
  expect(localStorage.getItem('homecoming-low-effects')).toBe('true');
  click('play'); tick(1); expect(el('distance').textContent).toBe('14');
  expect(el('speed').textContent).toBe('50,4');
  const menu = el('controls-menu'), toggle = el('controls-toggle'), menuPanel = el('controls-panel');
  const hover = (type: string, pointerType: string) => {
    const event = new Event(type); Object.defineProperty(event, 'pointerType', {value:pointerType}); menu.dispatchEvent(event);
  };
  expect(menuPanel.hidden).toBe(true);
  hover('pointerenter','mouse');expect(menuPanel.hidden).toBe(false);
  hover('pointerleave','mouse');expect(menuPanel.hidden).toBe(true);
  hover('pointerenter','touch');expect(menuPanel.hidden).toBe(true);
  click('controls-toggle');expect(menuPanel.hidden).toBe(false);expect(toggle.getAttribute('aria-expanded')).toBe('true');
  click('controls-toggle');expect(menuPanel.hidden).toBe(true);
  el('scene').focus(); key('keydown','KeyM');expect(menuPanel.hidden).toBe(false);
  toggle.dispatchEvent(new KeyboardEvent('keydown',{code:'Escape',bubbles:true}));
  expect(menuPanel.hidden).toBe(true);expect(el('modal').hidden).toBe(true);
  el('scene').focus();

  const fuel = el('fuel') as HTMLProgressElement;
  const fuelArc = el('fuel-arc') as unknown as SVGPathElement;
  const hpArc = el('hp-arc') as unknown as SVGPathElement;
  expect(parseFloat(fuelArc.style.strokeDasharray)).toBeCloseTo(fuel.value / fuel.max * 100, 5);
  expect(parseFloat(fuelArc.style.strokeDasharray)).toBeLessThan(100);
  expect(parseFloat(hpArc.style.strokeDasharray)).toBe(100);
  key('keydown', 'KeyW'); tick(3); expect(el('drive-mode').textContent).toContain('Giữ W'); key('keyup', 'KeyW');
  expect(el('speed').textContent).toBe('72,0'); tick(1); expect(el('speed').textContent).toBe('57,6');
  expect(el('drive-mode').textContent).toContain('hồi');
  tick(1); expect(el('speed').textContent).toBe('50,4');
  key('keydown', 'KeyS'); tick(2); expect(el('drive-mode').textContent).toContain('Giữ S'); key('keyup', 'KeyS'); expect(el('speed').textContent).toBe('28,8');
  // Focus moves before click in a browser: this must pause once, not pause then resume.
  click('pause'); expect(el('modal').hidden).toBe(false);
  const pausedDistance = el('distance').textContent; tick(10); expect(el('distance').textContent).toBe(pausedDistance);
  expect(el('panel-help').hidden).toBe(false); expect(el('panel-restart').hidden).toBe(false);
  click('play'); tick(1); expect(el('speed').textContent).toBe('39,6');
  tick(1); expect(el('speed').textContent).toBe('50,4');
  key('keydown', 'KeyW'); tick(2);
  window.dispatchEvent(new Event('blur')); tick(5); expect(el('modal').hidden).toBe(false);
  click('play'); tick(1); expect(el('speed').textContent).toBe('57,6');
  tick(1); expect(el('speed').textContent).toBe('50,4');
  click('help'); expect(el('modal-title').textContent).toBe('Cách cầm lái');
  expect(el('help-details').hidden).toBe(false);
  expect(el('help-details').textContent).toContain('tài xế');
  expect(el('modal-title').nextElementSibling).toBe(el('close-help'));
  const helpDistance = el('distance').textContent; tick(3); expect(el('distance').textContent).toBe(helpDistance);
  key('keydown', 'Tab'); expect(document.activeElement).toBe(el('close-help'));
  el('flavor-toggle').focus(); key('keydown', 'Tab'); expect(document.activeElement).toBe(el('close-help'));
  key('keydown', 'Escape'); expect(el('modal').hidden).toBe(false);
  expect(el('help-details').hidden).toBe(true);
  key('keydown', 'Escape'); expect(el('modal').hidden).toBe(true);
  for (let i = 0; i < 10; i++) {
    click('restart'); tick(1); expect(el('distance').textContent).toBe('0');
    expect(parseFloat(fuelArc.style.strokeDasharray)).toBe(100);
    click('play'); tick(1); expect(el('distance').textContent).toBe('14');
    expect(el('speed').textContent).toBe('50,4');
  }
  expect(renderer.instances).toBe(1); expect(renderer.draws).toBeGreaterThan(1000);
  vi.unstubAllGlobals();
});
