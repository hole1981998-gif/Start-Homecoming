// @vitest-environment jsdom
import { expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import type { World } from '../src/world';
vi.mock('../src/world', async importOriginal => {
  const actual = await importOriginal<typeof import('../src/world')>();
  // Isolate the existing input/focus regression from discovery/hazard tests below.
  return { ...actual, fillWorld: (world: World) => ({ ...world, entities: [] }) };
});

const renderer = vi.hoisted(() => ({ draws: 0, instances: 0 }));
vi.mock('../src/render', () => ({ RoadRenderer: class {
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
  expect(el('release-help').textContent).not.toContain('50,4');
  click('play'); tick(1); expect(el('distance').textContent).toBe('14');
  expect(el('speed').textContent).toBe('50,4');
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
  const helpDistance = el('distance').textContent; tick(3); expect(el('distance').textContent).toBe(helpDistance);
  const firstAudioSlider = document.querySelector<HTMLInputElement>('.audio-options input');
  expect(firstAudioSlider?.getAttribute('aria-label')).toBe('Hiệu ứng');
  key('keydown', 'Tab'); expect(document.activeElement).toBe(firstAudioSlider);
  key('keydown', 'Tab', { shiftKey: true }); expect(document.activeElement).toBe(el('close-help'));
  key('keydown', 'Escape'); expect(el('modal').hidden).toBe(false);
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
