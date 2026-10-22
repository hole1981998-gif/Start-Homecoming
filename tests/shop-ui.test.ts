// @vitest-environment jsdom
import { expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
vi.mock('../src/render', () => ({ RoadRenderer: class {
  draw() { /* real UI/simulation; WebGL replaced only in DOM integration */ }
  project() { return { x: 50, y: 40 }; }
  dispose() { /* no graphics resources */ }
} }));
it('R opens shop without fuel/repair packs, empty item keys do not heal, and services apply immediately', async () => {
  document.body.innerHTML = new DOMParser().parseFromString(readFileSync('index.html', 'utf8'), 'text/html').body.innerHTML;
  history.replaceState({}, '', '/?scenario=shop&seed=17');
  localStorage.setItem('dvn.cards.v1', JSON.stringify(['shop']));
  let now = 0, frame: FrameRequestCallback = () => {};
  vi.stubGlobal('performance', { now: () => now });
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => { frame = callback; return 1; });
  await import('../src/main');
  const el = (id: string) => document.getElementById(id) as HTMLElement;
  const click = (selector: string) => (document.querySelector(selector) as HTMLElement).click();
  const tick = (seconds: number) => { for (let i = 0; i < seconds * 60; i++) { now += 1000 / 60; frame(now); } };
  const key = (code: string) => window.dispatchEvent(new KeyboardEvent('keydown', { code, bubbles: true }));
  click('#play'); key('KeyC'); expect(el('shop-panel').hidden).toBe(true);
  key('KeyR'); tick(1);
  expect(el('shop-panel').hidden).toBe(false);
  const distance = el('distance').textContent; tick(3); expect(el('distance').textContent).toBe(distance);
  expect(document.querySelector('[data-tab="item"]')).toBeNull();
  expect(document.querySelector('[data-item]')).toBeNull();
  key('Digit1'); key('Digit2'); tick(.2);
  expect(el('hp-value').textContent).toBe('30 HP'); expect(el('money').textContent).toBe('4.000');
  click('[data-service="fuel"]'); click('[data-service="repair"]'); tick(.2);
  expect(el('shop-status').textContent).toContain('Đã sửa');
  expect(el('money').textContent).toBe('3.740'); expect(el('hp-value').textContent).toBe('50 HP');
  expect(el('fuel-value').textContent).toBe('5,0 L');
  expect((document.querySelector('[data-service="fuel"]') as HTMLButtonElement).disabled).toBe(false);
  key('Escape'); tick(.2);
  expect(el('item-cue').hidden).toBe(true);
  expect(document.activeElement).toBe(el('scene'));
  click('#restart'); tick(.2); expect(el('money').textContent).toBe('4.000'); expect(el('hp-value').textContent).toBe('30 HP');
  expect(el('shop-panel').hidden).toBe(true);
  window.dispatchEvent(new Event('pagehide'));
  vi.unstubAllGlobals(); history.replaceState({}, '', '/');
});
