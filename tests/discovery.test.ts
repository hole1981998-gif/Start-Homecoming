// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { expect, it, vi } from 'vitest';
vi.mock('../src/render', () => ({ RoadRenderer: class { draw() {} project() { return { x: 50, y: 40 }; } dispose() {} } }));
it('first discovery pauses before danger, closes safely, and result/restart cannot revive an old run', async () => {
  document.body.innerHTML = new DOMParser().parseFromString(readFileSync('index.html', 'utf8'), 'text/html').body.innerHTML;
  localStorage.clear();
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  vi.spyOn(document, 'hasFocus').mockReturnValue(true);
  let now = 0; let nextFrame: FrameRequestCallback = () => undefined;
  vi.stubGlobal('performance', { now: () => now });
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => { nextFrame = cb; return 1; });
  await import('../src/main');
  const el = (id: string) => document.getElementById(id) as HTMLElement;
  const tick = (seconds: number) => { for (let i = 0; i < seconds * 60; i++) { now += 1000 / 60; nextFrame(now); } };
  el('play').click(); tick(6);
  expect(el('modal-title').textContent).toBe('Người cần đi nhờ'); expect(el('modal').hidden).toBe(false);
  const atCard = el('distance').textContent, fuelAtCard = el('fuel-value').textContent;
  tick(10); expect(el('distance').textContent).toBe(atCard); expect(el('fuel-value').textContent).toBe(fuelAtCard);
  expect(Number(atCard)).toBeLessThan(60); // safely before the first passenger
  vi.advanceTimersByTime(8000); tick(1); expect(el('modal').hidden).toBe(true);
  expect(JSON.parse(localStorage.getItem('dvn.cards.v1') ?? '[]')).toContain('passenger');
  // Remain in the middle. Dismiss every new kind once; middle traffic eventually destroys the bike.
  for (let second = 0; second < 600 && el('play').textContent !== 'Chơi lại'; second++) {
    tick(1);
    if (el('play').textContent === 'Đã hiểu · tiếp tục') el('play').click();
  }
  expect(el('play').textContent).toBe('Chơi lại'); expect(el('result-summary').hidden).toBe(false);
  const finalMoney = el('money').textContent, finalScore = el('score').textContent;
  tick(20); expect(el('money').textContent).toBe(finalMoney); expect(el('score').textContent).toBe(finalScore);
  const saved = JSON.parse(localStorage.getItem('dvn.results.v1') ?? '[]') as unknown[];
  expect(saved).toHaveLength(1);
  el('play').click(); tick(1); expect(el('result-summary').hidden).toBe(true);
  expect(el('hp-value').textContent).toBe('70 HP'); expect(el('score').textContent).toBe('14');
  expect(JSON.parse(localStorage.getItem('dvn.results.v1') ?? '[]')).toHaveLength(1);
  vi.unstubAllGlobals(); vi.restoreAllMocks(); vi.useRealTimers();
});
