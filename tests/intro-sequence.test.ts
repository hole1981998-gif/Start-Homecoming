// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import { IntroSequence } from '../src/intro-sequence';

const sounds = new Map<string, FakeSound>();
class FakeSound {
  src: string;
  preload = '';
  loop = false;
  volume = 1;
  currentTime = 0;
  paused = true;
  plays = 0;
  pauses = 0;
  constructor(src: string) { this.src = src; sounds.set(src, this); }
  play() { this.paused = false; this.plays++; return Promise.resolve(); }
  pause() { this.paused = true; this.pauses++; }
}

afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); document.body.replaceChildren(); sounds.clear(); });

it('plays continuous beds once, starts steps on the first footfall, and opens the menu after 25s', () => {
  let frame: FrameRequestCallback | null = null;
  vi.stubGlobal('Audio', FakeSound);
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => { frame = callback; return 1; });
  vi.stubGlobal('cancelAnimationFrame', () => undefined);
  vi.spyOn(performance, 'now').mockReturnValue(0);
  const complete = vi.fn();
  const intro = new IntroSequence(complete, () => 1, () => 1);
  const fire = (seconds: number) => { const callback = frame; if (!callback) throw Error('Missing frame'); callback(seconds * 1000); };
  intro.show();
  expect(document.querySelector('.intro-overlay')?.hasAttribute('hidden')).toBe(false);
  (document.querySelector('.intro-start') as HTMLButtonElement).click();
  fire(1); fire(4); fire(6); fire(8); fire(10.5); fire(15);
  expect(sounds.get('/intro/footsteps.mp3')?.currentTime).toBe(.48);
  fire(16);
  expect((document.querySelector('.intro-portrait') as HTMLElement).style.transform).toContain('scale(4.6)');
  fire(18); fire(21); fire(23);
  expect(sounds.get('/intro/office.mp3')?.plays).toBe(1);
  expect(sounds.get('/intro/rain.mp3')?.plays).toBe(1);
  expect(sounds.get('/intro/typing.mp3')?.pauses).toBe(1);
  expect(sounds.get('/intro/game-horn.mp3')?.plays).toBe(1);
  expect((document.querySelector('.intro-title') as HTMLElement).hidden).toBe(false);
  fire(25);
  expect(complete).toHaveBeenCalledOnce();
  expect((document.querySelector('.intro-overlay') as HTMLElement).hidden).toBe(true);
  expect(sounds.get('/intro/office.mp3')?.paused).toBe(true);
  intro.dispose();
});

it('skips without starting any sound', () => {
  vi.stubGlobal('Audio', FakeSound);
  vi.stubGlobal('cancelAnimationFrame', () => undefined);
  const complete = vi.fn();
  const intro = new IntroSequence(complete, () => 1, () => 1);
  intro.show();
  (document.querySelector('.intro-skip') as HTMLButtonElement).click();
  expect(complete).toHaveBeenCalledOnce();
  expect([...sounds.values()].every(sound => sound.plays === 0)).toBe(true);
  intro.dispose();
});
