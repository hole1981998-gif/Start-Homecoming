// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import { AudioDirector } from '../src/audio-director';
import { initialRun, stepRun, type Run } from '../src/survival';
import { entity } from '../src/world';
import { developmentScenario } from '../src/development';
import { noInput } from '../src/simulation';

afterEach(() => vi.unstubAllGlobals());

it('the water contact flag remains active across ticks of a long puddle', () => {
  let run: Run = { ...developmentScenario(initialRun(17), 'p62-water-baseline'), phase: 'running', distance: 60 };
  let wetTicks = 0;
  for (let tick = 0; tick < 45; tick++) {
    run = stepRun(run, noInput());
    if (run.world.entities.some(e => e.kind === 'water' && e.touching)) wetTicks++;
  }
  expect(wetTicks).toBeGreaterThan(10);
});

it('sustains water only during contact, uses physical collision types, and leaves steering and warning cues silent', async () => {
  const sources: Array<{ buffer?: { path: string }; gain?: { gain: { targets: number[] } }; playbackRate: { targets: number[] }; started: boolean; stopped: boolean; loop: boolean }> = [];
  const fetched: string[] = [];
  class FakeAudioContext {
    static time = 1;
    state = 'running'; get currentTime() { return FakeAudioContext.time; } destination = {};
    createGain() {
      return { gain: { value: 0, targets: [] as number[], setTargetAtTime(value: number) { this.targets.push(value); } },
        connect() { return this; }, disconnect() { /* detached */ } };
    }
    createBufferSource() {
      const source = { buffer: undefined as { path: string } | undefined, gain: undefined as ReturnType<FakeAudioContext['createGain']> | undefined,
        started: false, stopped: false, loop: false, playbackRate: { targets: [] as number[], setTargetAtTime(value: number) { this.targets.push(value); } },
        connect(gain: ReturnType<FakeAudioContext['createGain']>) { this.gain = gain; return gain; },
        disconnect() { /* detached */ }, start() { this.started = true; }, stop() { this.stopped = true; } };
      sources.push(source); return source;
    }
    decodeAudioData(data: ArrayBuffer & { path?: string }) { return Promise.resolve({ path: data.path ?? '' }); }
    resume() { return Promise.resolve(); }
    close() { return Promise.resolve(); }
  }
  vi.stubGlobal('AudioContext', FakeAudioContext);
  vi.stubGlobal('fetch', vi.fn(async (path: string) => {
    fetched.push(path);
    return { ok: true, arrayBuffer: async () => Object.assign(new ArrayBuffer(8), { path }) };
  }));
  const director = new AudioDirector();
  const base = { ...initialRun(17, 'audio-feedback'), phase: 'running' as const, speed: 4 };
  director.unlock();
  const police = entity('police', 'test-police', 12, 0);
  await director.update({ ...base, lateralVelocity: 5, world: { ...base.world, entities: [police] } });
  await vi.waitFor(() => expect(sources.filter(source => source.started && source.buffer?.path.includes('engine-v2')).length).toBe(3));
  const drivingStems = sources.filter(source => source.started && source.buffer?.path.includes('engine-v2'));
  await director.update({ ...base, motion: 'coasting', speed: 4 });
  expect(drivingStems.every(source => !source.stopped)).toBe(true);
  expect(fetched.some(path => path.includes('water_roll_loop'))).toBe(false);
  expect(fetched.some(path => path.includes('skid.wav') || path.includes('police_warning'))).toBe(false);

  const water = { ...entity('water', 'test-water', 0, 0), touching: true };
  await director.update({ ...base, eventSequence: 1, feedbackKind: 'water', world: { ...base.world, entities: [water] } });
  await vi.waitFor(() => expect(sources.some(source => source.started && source.buffer?.path.includes('water_roll_loop'))).toBe(true));
  const waterSource = sources.find(source => source.buffer?.path.includes('water_roll_loop'))!;
  expect(waterSource.gain?.gain.targets.at(-1)).toBeGreaterThan(0);
  await director.update({ ...base, speed: 20, world: { ...base.world, entities: [water] } });
  const waterTargets = waterSource.gain?.gain.targets ?? [];
  expect(waterTargets.at(-1)).toBeGreaterThan(waterTargets.at(-2) ?? 0);
  expect(waterSource.playbackRate.targets.at(-1)).toBeGreaterThan(1);
  await director.update(base);
  expect(waterSource.gain?.gain.targets.at(-1)).toBe(0);

  await director.update({ ...base, eventSequence: 2, feedbackKind: 'pothole' });
  const container = { ...entity('traffic', 'test-container', 0, 0), trafficKind: 'container' as const, lastHit: 0 };
  await director.update({ ...base, eventSequence: 3, feedbackKind: 'traffic', world: { ...base.world, entities: [container] } });
  expect(fetched.some(path => path.includes('pothole_rattle_light'))).toBe(true);
  expect(fetched.some(path => path.includes('collision_light'))).toBe(true);
  FakeAudioContext.time = 2;
  await director.update({ ...base, speed: 25, eventSequence: 4, feedbackKind: 'traffic', world: { ...base.world, entities: [container] } });
  expect(fetched.some(path => path.includes('collision_heavy'))).toBe(true);
  const bike = { ...entity('traffic', 'bike', 0, 0), trafficKind: 'motorbike' as const, trafficPairContacts: ['moto'] };
  const moto = { ...entity('traffic', 'moto', 0, 0), trafficKind: 'motorcycle' as const, trafficPairContacts: ['bike'] };
  await director.update({ ...base, eventSequence: 4, world: { ...base.world, entities: [bike, moto] } });
  expect(fetched.some(path => path.includes('collision_light'))).toBe(true);
  const hole = entity('pothole', 'hole', 0, 0);
  await director.update({ ...base, eventSequence: 4, world: { ...base.world, entities: [{ ...container, trafficContacts: ['hole'] }, hole] } });
  expect(fetched.some(path => path.includes('pothole_rattle_heavy'))).toBe(true);
  expect(fetched.some(path => path.includes('skid.wav') || path.includes('police_warning'))).toBe(false);
  expect(fetched.some(path => path.includes('vehicle/accelerate.wav') || path.includes('vehicle/brake.wav'))).toBe(false);
  const heavyBefore = sources.filter(source => source.started && source.buffer?.path.includes('collision_heavy')).length;
  await director.update({ ...base, phase: 'ended', eventSequence: 5, feedbackKind: 'accident' });
  await vi.waitFor(() => expect(sources.filter(source => source.started && source.buffer?.path.includes('collision_heavy')).length).toBeGreaterThan(heavyBefore));
  director.dispose();
});
