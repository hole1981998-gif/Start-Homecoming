// @vitest-environment jsdom
import { expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
vi.mock('../src/render', () => ({ RoadRenderer: class {
  draw() { /* real UI/simulation; WebGL replaced only in DOM integration */ }
  project() { return { x: 50, y: 40 }; }
  dispose() { /* no graphics resources */ }
} }));
it('C opens a frozen shop, purchases an item, R uses it only in gameplay and restart clears inventory', async () => {
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
  click('#play'); key('KeyC'); tick(1);
  expect(el('shop-panel').hidden).toBe(false);
  const distance = el('distance').textContent; tick(3); expect(el('distance').textContent).toBe(distance);
  click('[data-tab="item"]'); click('[data-item="repair"]'); tick(1);
  expect(el('shop-status').textContent).toContain('Đã mua'); expect(el('money').textContent).toBe('3.915');
  key('KeyR'); tick(1); expect(el('hp-value').textContent).toBe('30 HP');
  key('Escape'); key('KeyR'); tick(.2);
  expect(el('hp-value').textContent).toBe('70 HP'); expect(el('item-cue').hidden).toBe(true);
  expect(document.activeElement).toBe(el('scene'));
  click('#restart'); tick(.2); expect(el('money').textContent).toBe('4.000'); expect(el('hp-value').textContent).toBe('30 HP');
  expect(el('shop-panel').hidden).toBe(true);
  window.dispatchEvent(new Event('pagehide'));
  vi.unstubAllGlobals(); history.replaceState({}, '', '/');
});
