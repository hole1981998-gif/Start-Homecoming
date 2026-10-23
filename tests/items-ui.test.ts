// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { expect, it, vi } from 'vitest';
import type { Run } from '../src/survival';
import { jumpHeight } from '../src/items';
const drawn = vi.hoisted(() => ({ run: undefined as Run | undefined }));
vi.mock('../src/render', () => ({ RoadRenderer: class {
  draw(run: Run) { drawn.run = run; }
  project() { return { x: 50, y: 40 }; }
  dispose() { /* no graphics resources */ }
} }));
it('real keys use fixed slots once, paused time freezes effects, and restart clears active effects', async () => {
  document.body.innerHTML = new DOMParser().parseFromString(readFileSync('index.html', 'utf8'), 'text/html').body.innerHTML;
  history.replaceState({}, '', '/?scenario=items&seed=17');
  localStorage.setItem('dvn.cards.v1', JSON.stringify(['water', 'pothole', 'traffic', 'shop']));
  let now = 0, frame: FrameRequestCallback = () => {};
  vi.stubGlobal('performance', { now: () => now });
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => { frame = cb; return 1; });
  await import('../src/main');
  const el = (id: string) => document.getElementById(id) as HTMLElement;
  const tick = (seconds: number) => { for (let i = 0; i < seconds * 60; i++) { now += 1000 / 60; frame(now); } };
  const key = (code: string, repeat = false) => window.dispatchEvent(new KeyboardEvent('keydown', { code, repeat, bubbles: true }));
  el('play').click(); key('Digit1', true); tick(.1);
  expect(el('item-cue').textContent).not.toContain('NITRO');
  key('Space'); tick(.1); expect(drawn.run!.powers.jumpAt).toBe(-100);
  key('Digit1'); tick(.1);
  expect(jumpHeight(drawn.run!)).toBe(0);
  key('Space', true); tick(.1); expect(drawn.run!.powers.jumpAt).toBe(-100);
  key('Space'); tick(.1); expect(jumpHeight(drawn.run!)).toBeGreaterThan(0);
  const jumpAt = drawn.run!.powers.jumpAt;
  key('Space'); tick(.1); expect(drawn.run!.powers.jumpAt).toBe(jumpAt);
  expect(el('item-cue').textContent).toContain('1 · —'); expect(el('item-cue').textContent).toContain('2 · ☆');
  expect(el('item-cue').textContent).toContain('NITRO');
  key('Escape'); tick(.1); const frozen = el('item-cue').textContent;
  key('Digit2'); tick(5); expect(el('item-cue').textContent).toBe(frozen);
  key('Escape'); key('Digit2'); tick(.1);
  expect(el('item-cue').textContent).toContain('STAR'); expect(el('item-cue').textContent).toContain('2 · —');
  el('restart').click(); tick(.1);
  expect(el('item-cue').textContent).not.toContain('STAR'); expect(el('item-cue').textContent).not.toContain('NITRO');
  expect(el('item-cue').textContent).toContain('1 · ↟'); expect(el('item-cue').textContent).toContain('2 · ☆');
  window.dispatchEvent(new Event('pagehide'));
  vi.unstubAllGlobals(); history.replaceState({}, '', '/');
});
