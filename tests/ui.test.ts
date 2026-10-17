// @vitest-environment jsdom
import { expect, it, vi } from 'vitest';

const renderer = vi.hoisted(() => ({ draws: 0, instances: 0 }));
vi.mock('../src/render', () => ({ RoadRenderer: class {
  constructor() { renderer.instances++; }
  draw() { renderer.draws++; }
  dispose() { /* no WebGL context in DOM tests */ }
} }));

it('real input/UI wiring: release, blur, pause button, help, focus trap and repeat restarts', async () => {
  document.body.innerHTML = `<div id="game"><canvas id="scene" tabindex="0"></canvas>
    <span id="speed"></span><span id="distance"></span><button id="pause" disabled>Pause</button>
    <button id="restart" disabled>Restart</button><button id="help">Help</button>
    <div id="modal"><h1 id="modal-title"></h1><p id="modal-description"></p><span id="modal-label"></span>
    <div id="instructions"></div><button id="play">Play</button><button id="close-help" hidden>Close</button>
    <button id="panel-help" hidden>Help</button><button id="panel-restart" hidden>Restart</button></div><div id="error" hidden></div></div>`;
  let now = 0;
  let nextFrame: FrameRequestCallback = () => { throw new Error('RAF not registered'); };
  vi.stubGlobal('performance', { now: () => now });
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => { nextFrame = callback; return 1; });
  await import('../src/main');
  const el = (id: string) => document.getElementById(id) as HTMLElement;
  const tick = (seconds: number) => { for (let i = 0; i < seconds * 60; i++) { now += 1000 / 60; nextFrame(now); } };
  const key = (type: string, code: string, extra: KeyboardEventInit = {}) => window.dispatchEvent(new KeyboardEvent(type, { code, bubbles: true, cancelable: true, ...extra }));
  const click = (id: string) => { el(id).focus(); el(id).click(); };
  click('play'); tick(1); expect(el('distance').textContent).toBe('8');
  key('keydown', 'KeyW'); tick(3); key('keyup', 'KeyW');
  expect(el('speed').textContent).toBe('72'); tick(1); expect(el('speed').textContent).toBe('72');
  key('keydown', 'KeyS'); tick(2); key('keyup', 'KeyS'); expect(el('speed').textContent).toBe('29');
  // Focus moves before click in a browser: this must pause once, not pause then resume.
  click('pause'); expect(el('modal').hidden).toBe(false);
  const pausedDistance = el('distance').textContent; tick(10); expect(el('distance').textContent).toBe(pausedDistance);
  expect(el('panel-help').hidden).toBe(false); expect(el('panel-restart').hidden).toBe(false);
  click('play'); key('keydown', 'KeyW'); tick(1);
  window.dispatchEvent(new Event('blur')); tick(5); expect(el('modal').hidden).toBe(false);
  click('play'); tick(1); const resumedSpeed = el('speed').textContent; tick(1); expect(el('speed').textContent).toBe(resumedSpeed);
  click('help'); expect(el('modal-title').textContent).toBe('Cách cầm lái');
  const helpDistance = el('distance').textContent; tick(3); expect(el('distance').textContent).toBe(helpDistance);
  key('keydown', 'Tab'); expect(document.activeElement).toBe(el('close-help'));
  key('keydown', 'Escape'); expect(el('modal').hidden).toBe(false);
  key('keydown', 'Escape'); expect(el('modal').hidden).toBe(true);
  for (let i = 0; i < 10; i++) {
    click('restart'); tick(1); expect(el('distance').textContent).toBe('0');
    click('play'); tick(1); expect(el('distance').textContent).toBe('8');
  }
  expect(renderer.instances).toBe(1); expect(renderer.draws).toBeGreaterThan(1000);
  vi.unstubAllGlobals();
});
