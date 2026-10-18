// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { expect, it, vi } from 'vitest';
import type { Run } from '../src/survival';
const drawn = vi.hoisted(() => ({ run: undefined as Run | undefined }));
vi.mock('../src/render', () => ({ RoadRenderer: class {
  draw(run: Run) { drawn.run = run; }
  project() { return { x: 50, y: 40 }; }
  dispose() { /* no WebGL resources */ }
} }));
it('real input calls Grab once, shows charges/type, requires F, keeps riders through Tab/G and resets the fixture', async () => {
  document.body.innerHTML = new DOMParser().parseFromString(readFileSync('index.html', 'utf8'), 'text/html').body.innerHTML;
  history.replaceState({}, '', '/?scenario=grab&seed=17');
  localStorage.setItem('dvn.cards.v1', JSON.stringify(['passenger', 'water', 'traffic', 'pothole', 'shop']));
  let now = 0, frame: FrameRequestCallback = () => {};
  vi.stubGlobal('performance', { now: () => now });
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => { frame = cb; return 1; });
  await import('../src/main');
  const el = (id: string) => document.getElementById(id) as HTMLElement;
  const tick = (seconds: number) => { for (let i = 0; i < seconds * 60; i++) { now += 1000 / 60; frame(now); } };
  const key = (code: string, repeat = false) => window.dispatchEvent(new KeyboardEvent('keydown', { code, repeat, bubbles: true }));
  el('play').click(); key('Digit1', true); tick(.1);
  expect(el('item-cue').textContent).toContain('Grab×3');
  key('Digit1'); tick(.1); expect(el('item-cue').textContent).toContain('Grab×2');
  expect(drawn.run!.riderIds).toEqual([]);
  expect(el('world-cues').querySelector('[data-kind="passenger"]')?.getAttribute('aria-label')).toContain('Khách Grab');
  key('Digit1'); tick(.1); expect(drawn.run!.grabSequence).toBe(1);
  tick(3); key('KeyF'); tick(.1);
  expect(el('rider-count').textContent).toBe('2/2'); expect(drawn.run!.grabRiderIds).toHaveLength(1);
  const id = drawn.run!.grabRiderIds[0];
  key('Tab'); tick(.1); expect(el('rider-count').textContent).toBe('2/4');
  expect(drawn.run!.grabRiderIds).toEqual([id]); expect(el('item-cue').textContent).toContain('Grab×2');
  key('KeyG'); tick(.1); expect(drawn.run!.grabRiderIds).toEqual([]);
  expect(drawn.run!.world.entities.some(e => e.riderId === id && !e.consumed && e.passengerType === 'grab')).toBe(true);
  el('restart').click(); tick(.1);
  expect(el('item-cue').textContent).toContain('Grab×3'); expect(drawn.run!.grabSequence).toBe(0);
  expect(drawn.run!.grabRiderIds).toEqual([]); expect(drawn.run!.riderIds).toEqual([]);
  window.dispatchEvent(new Event('pagehide'));
  vi.unstubAllGlobals(); history.replaceState({}, '', '/');
});
