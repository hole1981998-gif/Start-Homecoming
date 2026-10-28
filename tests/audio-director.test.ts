// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import { AudioDirector } from '../src/audio-director';
import { initialRun } from '../src/survival';

afterEach(() => vi.unstubAllGlobals());

it('starts layered driving sound after a user unlock and stops it on pause and reset', async () => {
  const sources: Array<{ started: boolean; stopped: boolean }> = [];
  const gain = () => ({ gain: { value: 0, setTargetAtTime() { /* audio parameter */ } }, connect() { return this; }, disconnect() { /* detached */ } });
  class FakeAudioContext {
    state = 'running'; currentTime = 1; destination = {};
    createGain() { return gain(); }
    createBufferSource() {
      const source = { started: false, stopped: false, buffer: null, loop: false,
        playbackRate: { setTargetAtTime() { /* audio parameter */ } },
        connect() { return this; }, disconnect() { /* detached */ },
        start() { this.started = true; }, stop() { this.stopped = true; } };
      sources.push(source); return source;
    }
    decodeAudioData() { return Promise.resolve({}); }
    resume() { return Promise.resolve(); }
    close() { return Promise.resolve(); }
  }
  vi.stubGlobal('AudioContext', FakeAudioContext);
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) }));
  const director = new AudioDirector();
  const run = { ...initialRun(17, 'audio-test'), phase: 'running' as const };
  director.unlock();
  await director.update(run, { accelerate: false, brake: false });
  await vi.waitFor(() => expect(sources.filter(s => s.started).length).toBeGreaterThanOrEqual(6));
  director.pause();
  expect(sources.filter(s => s.stopped).length).toBeGreaterThanOrEqual(3);
  director.reset();
  expect(sources.every(s => s.stopped)).toBe(true);
  director.dispose();
});
