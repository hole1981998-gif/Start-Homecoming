// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import { AudioDirector } from '../src/audio-director';
import { initialRun } from '../src/survival';
import { newVehicle } from '../src/vehicles';

afterEach(() => vi.unstubAllGlobals());

it('starts ElevenLabs driving sound and cancels active stems on pause', async () => {
  const sources: Array<{ started: boolean; stopped: boolean; stopTimes: number[] }> = [];
  const tracks: Array<{ src: string; loop: boolean; paused: boolean }> = [];
  const gains: Array<{ gain: { value: number; targets: number[] } }> = [], fetched: string[] = [];
  const gain = () => { const node = { gain: { value: 0, targets: [] as number[], setTargetAtTime(value: number) { this.targets.push(value); } }, connect() { return this; }, disconnect() { /* detached */ } }; gains.push(node); return node; };
  class FakeAudioContext {
    state = 'running'; currentTime = 1; destination = {};
    createGain() { return gain(); }
    createMediaElementSource() { return { connect() { return this; }, disconnect() { /* detached */ } }; }
    createBufferSource() {
      const source = { started: false, stopped: false, stopTimes: [] as number[], buffer: null, loop: false,
        playbackRate: { setTargetAtTime() { /* audio parameter */ } },
        connect() { return this; }, disconnect() { /* detached */ },
        start() { this.started = true; }, stop(when = 0) { this.stopped = true; this.stopTimes.push(when); } };
      sources.push(source); return source;
    }
    decodeAudioData() { return Promise.resolve({}); }
    resume() { return Promise.resolve(); }
    close() { return Promise.resolve(); }
  }
  class FakeMusic {
    loop = false; preload = ''; paused = true;
    constructor(public src: string) { tracks.push(this); }
    play() { this.paused = false; return Promise.resolve(); }
    pause() { this.paused = true; }
  }
  vi.stubGlobal('AudioContext', FakeAudioContext);
  vi.stubGlobal('Audio', FakeMusic);
  vi.stubGlobal('fetch', vi.fn(async (path: string) => { fetched.push(path); return { ok: true, arrayBuffer: async () => new ArrayBuffer(8) }; }));
  const director = new AudioDirector();
  const run = { ...initialRun(17, 'audio-test'), phase: 'running' as const };
  director.unlock();
  director.setLevels(0, .5, .25);
  expect(gains[0].gain.targets.at(-1)).toBe(0);
  expect(gains[1].gain.targets.at(-1)).toBeCloseTo(.11);
  expect(gains[2].gain.targets.at(-1)).toBeCloseTo(.075);
  await director.update(run);
  expect(tracks).toHaveLength(1);
  expect(tracks[0].src).toContain('nimble_pursuit.mp3');
  expect(tracks[0].loop).toBe(true);
  expect(tracks[0].paused).toBe(false);
  await vi.waitFor(() => expect(sources.filter(s => s.started).length).toBeGreaterThanOrEqual(6));
  expect(fetched.some(path => path.includes('engine_bike_texture_loop.mp3'))).toBe(true);
  expect(fetched.some(path => path.includes('rain_shower_loop.mp3'))).toBe(true);
  director.ui('menu_select');
  expect(fetched.some(path => path.includes('ui_soft_select.mp3'))).toBe(true);
  const car = newVehicle('car4', 'audio-car');
  await director.update({ ...run, vehicleInstances: [...run.vehicleInstances, car], activeVehicleId: car.id });
  await vi.waitFor(() => expect(fetched.some(path => path.includes('engine_car_texture_loop.mp3'))).toBe(true));
  expect(fetched.some(path => path.includes('engine_car_texture_loop.mp3'))).toBe(true);
  director.pause();
  director.enterShop();
  expect(tracks).toHaveLength(2);
  expect(tracks[1].src).toContain('afternoon_jazz.mp3');
  expect(tracks[1].loop).toBe(true);
  expect(tracks[0].paused).toBe(true);
  expect(tracks[1].paused).toBe(false);
  await director.update({ ...run, phase: 'paused' });
  expect(tracks[1].paused).toBe(false);
  director.leaveShop();
  await director.update(run);
  await vi.waitFor(() => expect(tracks[0].paused).toBe(false));
  await vi.waitFor(() => expect(tracks[1].paused).toBe(true), { timeout: 1000 });
  director.pause();
  expect(tracks[0].paused).toBe(true);
  director.ui('pause');
  expect(fetched.some(path => path.includes('ui_pause.mp3'))).toBe(true);
  expect(sources.some(s => s.stopped)).toBe(true);
  director.reset();
  expect(sources.every(s => s.stopped)).toBe(true);
  director.dispose();
});

it('does not start pending engine or ambience buffers after the run ends', async () => {
  let release!: (value: { ok: boolean; arrayBuffer: () => Promise<ArrayBuffer> }) => void;
  const pending = new Promise<{ ok: boolean; arrayBuffer: () => Promise<ArrayBuffer> }>(resolve => { release = resolve; });
  const sources: Array<{ started: boolean }> = [];
  class FakeAudioContext {
    state = 'running'; currentTime = 1; destination = {};
    createGain() { return { gain: { value: 0, setTargetAtTime() { /* audio parameter */ } }, connect() { return this; }, disconnect() { /* detached */ } }; }
    createMediaElementSource() { return { connect() { return this; }, disconnect() { /* detached */ } }; }
    createBufferSource() { const source = { started: false, loop: false, buffer: null, connect() { return this; }, start() { this.started = true; }, stop() { /* stopped */ }, disconnect() { /* detached */ }, playbackRate: { setTargetAtTime() { /* audio parameter */ } } }; sources.push(source); return source; }
    decodeAudioData() { return Promise.resolve({}); }
    resume() { return Promise.resolve(); }
    close() { return Promise.resolve(); }
  }
  class FakeMusic {
    loop = false; preload = ''; paused = true;
    constructor(public src: string) { /* media path */ }
    play() { this.paused = false; return Promise.resolve(); }
    pause() { this.paused = true; }
  }
  vi.stubGlobal('AudioContext', FakeAudioContext);
  vi.stubGlobal('Audio', FakeMusic);
  vi.stubGlobal('fetch', vi.fn(() => pending));
  const director = new AudioDirector();
  const run = { ...initialRun(17, 'audio-loading'), phase: 'running' as const };
  director.unlock();
  await director.update(run);
  await director.update({ ...run, phase: 'ended' });
  release({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) });
  await new Promise(resolve => setTimeout(resolve, 0));
  expect(sources.some(source => source.started)).toBe(false);
  director.dispose();
});
