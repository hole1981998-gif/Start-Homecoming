// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import { AudioDirector, taperLoopEdges } from '../src/audio-director';
import { initialRun, stepRun, type Run } from '../src/survival';
import { entity } from '../src/world';
import { developmentScenario } from '../src/development';
import { noInput } from '../src/simulation';
import { newVehicle } from '../src/vehicles';

afterEach(() => vi.unstubAllGlobals());

it('tapers both channels at compressed water-loop boundaries while preserving the body', () => {
  const channels = [new Float32Array(4410).fill(.4), new Float32Array(4410).fill(-.3)];
  const buffer = { sampleRate: 44100, length: 4410, numberOfChannels: 2,
    getChannelData: (index: number) => channels[index] } as AudioBuffer;
  taperLoopEdges(buffer);
  for (const channel of channels) {
    expect(Math.abs(channel[0])).toBe(0);
    expect(Math.abs(channel.at(-1)!)).toBe(0);
  }
  expect(channels[0][2205]).toBeCloseTo(.4);
  expect(channels[1][2205]).toBeCloseTo(-.3);
});

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
  const sources: Array<{ buffer?: { path: string }; gain?: { gain: { value: number; targets: number[] } }; playbackRate: { targets: number[] }; started: boolean; stopped: boolean; loop: boolean }> = [];
  const fetched: string[] = [];
  const waterFilters: Array<{ type: string; frequency: { value: number } }> = [];
  const stereoPans: Array<{ value: number }> = [];
  class FakeAudioContext {
    static time = 1;
    state = 'running'; get currentTime() { return FakeAudioContext.time; } destination = {};
    createGain() {
      return { gain: { value: 0, targets: [] as number[], setTargetAtTime(value: number) { this.targets.push(value); } },
        connect() { return this; }, disconnect() { /* detached */ } };
    }
    createBiquadFilter() {
      const filter = { type: '', frequency: { value: 0 }, connect(gain: ReturnType<FakeAudioContext['createGain']>) { return gain; },
        disconnect() { /* detached */ } };
      waterFilters.push(filter); return filter;
    }
    createStereoPanner() {
      const panner = { pan: { value: 0 }, connect() { return this; }, disconnect() { /* detached */ } };
      stereoPans.push(panner.pan); return panner;
    }
    createBufferSource() {
      const source = { buffer: undefined as { path: string } | undefined, gain: undefined as ReturnType<FakeAudioContext['createGain']> | undefined,
        started: false, stopped: false, loop: false, playbackRate: { targets: [] as number[], setTargetAtTime(value: number) { this.targets.push(value); } },
        connect(gain: ReturnType<FakeAudioContext['createGain']> | ReturnType<FakeAudioContext['createBiquadFilter']>) {
          if ('gain' in gain) this.gain = gain;
          return gain;
        },
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
  expect(fetched.some(path => path.includes('water_roll_shallow_loop'))).toBe(false);
  expect(fetched.some(path => path.includes('skid.wav') || path.includes('police_warning'))).toBe(false);

  const water = { ...entity('water', 'test-water', 0, 0), touching: true };
  await director.update({ ...base, eventSequence: 1, feedbackKind: 'water', world: { ...base.world, entities: [water] } });
  await vi.waitFor(() => expect(sources.some(source => source.started && source.buffer?.path.includes('water_roll_shallow_loop'))).toBe(true));
  expect(fetched.some(path => path.includes('water_entry_skim.mp3'))).toBe(true);
  expect(waterFilters.at(-1)).toMatchObject({ type: 'lowpass', frequency: { value: 1800 } });
  const waterSource = sources.find(source => source.buffer?.path.includes('water_roll_shallow_loop'))!;
  expect(waterSource.gain?.gain.targets.at(-1)).toBeGreaterThan(0);
  await director.update({ ...base, speed: 20, world: { ...base.world, entities: [water] } });
  expect(fetched.filter(path => path.includes('water_entry_skim.mp3'))).toHaveLength(1);
  const waterTargets = waterSource.gain?.gain.targets ?? [];
  expect(waterTargets.at(-1)).toBeGreaterThan(waterTargets.at(-2) ?? 0);
  expect(waterSource.playbackRate.targets.at(-1)).toBeGreaterThan(1);
  FakeAudioContext.time = 5;
  await director.update({ ...base, world: { ...base.world, entities: [water] } });
  await vi.waitFor(() => expect(sources.some(source => source.buffer?.path.includes('water_roll_shallow_ripple_loop') &&
    (source.gain?.gain.targets.at(-1) ?? 0) > 0)).toBe(true));
  expect(waterSource.gain?.gain.targets.at(-1)).toBe(0);
  FakeAudioContext.time = 8.5;
  await director.update({ ...base, world: { ...base.world, entities: [water] } });
  await vi.waitFor(() => expect(sources.some(source => source.buffer?.path.includes('water_roll_shallow_grit_loop') &&
    (source.gain?.gain.targets.at(-1) ?? 0) > 0)).toBe(true));
  await director.update(base);
  expect(waterSource.gain?.gain.targets.at(-1)).toBe(0);
  expect(fetched.some(path => path.includes('water_exit_spray.mp3'))).toBe(true);
  FakeAudioContext.time = 11;
  await director.update(base);
  await vi.waitFor(() => expect(sources.some(source => source.buffer?.path.includes('wind_road_soft_loop.mp3') &&
    (source.gain?.gain.targets.at(-1) ?? 0) > 0)).toBe(true));

  FakeAudioContext.time = 2;
  const wideWater = { ...water, id: 'wide-water', width: 9.6, length: 24 };
  await director.update({ ...base, eventSequence: 1, world: { ...base.world, entities: [wideWater] } });
  await vi.waitFor(() => expect(sources.some(source => source.started && source.buffer?.path.includes('water_roll_deep_loop'))).toBe(true));
  expect(fetched.some(path => path.includes('water_entry_wash.mp3'))).toBe(true);
  expect(waterSource.gain?.gain.targets.at(-1)).toBe(0);
  expect(sources.some(source => source.buffer?.path.includes('water_roll_deep_') &&
    (source.gain?.gain.targets.at(-1) ?? 0) > 0)).toBe(true);
  await director.update({ ...base, eventSequence: 1, world: { ...base.world, entities: [wideWater] } });
  expect(fetched.filter(path => path.includes('water_entry_wash.mp3'))).toHaveLength(1);
  await director.update(base);
  FakeAudioContext.time = 2.5;
  const truck = newVehicle('truck', 'test-truck');
  await director.update({ ...base, activeVehicleId: truck.id, vehicleInstances: [...base.vehicleInstances, truck],
    world: { ...base.world, entities: [{ ...water, id: 'truck-water' }] } });
  expect(fetched.some(path => path.includes('water_entry_heavy.mp3'))).toBe(true);
  await director.update(base);
  FakeAudioContext.time = 3;
  await director.update({ ...base, eventSequence: 1, world: { ...base.world, entities: [{ ...water, id: 'second-skim' }] } });
  expect(fetched.some(path => path.includes('water_entry_skim_alt.mp3'))).toBe(true);
  await director.update(base);
  FakeAudioContext.time = 3.5;
  await director.update({ ...base, eventSequence: 1, world: { ...base.world, entities: [{ ...water, id: 'third-skim' }] } });
  expect(fetched.some(path => path.includes('water_entry_skim_grit.mp3'))).toBe(true);
  await director.update(base);

  await director.update({ ...base, eventSequence: 2, feedbackKind: 'pothole' });
  const container = { ...entity('traffic', 'test-container', 0, 0), trafficKind: 'container' as const, lastHit: 0 };
  await director.update({ ...base, eventSequence: 3, feedbackKind: 'traffic', world: { ...base.world, entities: [container] } });
  expect(fetched.some(path => path.includes('pothole_light.mp3'))).toBe(true);
  expect(fetched.some(path => path.includes('resource_loss_a.wav'))).toBe(true);
  expect(fetched.some(path => path.includes('collision_light.mp3'))).toBe(true);
  FakeAudioContext.time = 4.5;
  await director.update({ ...base, speed: 25, eventSequence: 4, feedbackKind: 'traffic', world: { ...base.world, entities: [container] } });
  expect(fetched.some(path => path.includes('collision_heavy.mp3'))).toBe(true);
  const bike = { ...entity('traffic', 'bike', 0, 0), trafficKind: 'motorbike' as const, trafficPairContacts: ['moto'] };
  const moto = { ...entity('traffic', 'moto', 0, 0), trafficKind: 'motorcycle' as const, trafficPairContacts: ['bike'] };
  await director.update({ ...base, eventSequence: 4, world: { ...base.world, entities: [bike, moto] } });
  expect(fetched.some(path => path.includes('collision_light'))).toBe(true);
  expect(fetched.some(path => path.includes('collision_light_alt.mp3'))).toBe(true);
  const hole = entity('pothole', 'hole', 0, 0);
  await director.update({ ...base, eventSequence: 4, world: { ...base.world, entities: [{ ...container, trafficContacts: ['hole'] }, hole] } });
  expect(fetched.some(path => path.includes('pothole_heavy.mp3'))).toBe(true);
  FakeAudioContext.time = 5;
  const barrier = { ...entity('jam', 'barrier', 0, 0), consumed: true };
  await director.update({ ...base, eventSequence: 5, feedbackKind: 'jam', world: { ...base.world, entities: [barrier] } });
  expect(fetched.some(path => path.includes('barrier_hit.mp3'))).toBe(true);
  FakeAudioContext.time = 6;
  const ambulance = { ...entity('jam', 'ambulance', 0, 0), consumed: true, serviceRole: 'ambulance' as const };
  await director.update({ ...base, eventSequence: 6, feedbackKind: 'jam', world: { ...base.world, entities: [ambulance] } });
  expect(fetched.some(path => path.includes('ambulance_hit.mp3'))).toBe(true);
  expect(fetched.some(path => path.includes('skid.wav') || path.includes('police_warning'))).toBe(false);
  expect(fetched.some(path => path.includes('vehicle/accelerate.wav') || path.includes('vehicle/brake.wav'))).toBe(false);
  FakeAudioContext.time = 7;
  await director.update({ ...base, eventSequence: 7, feedbackKind: 'fuel' });
  expect(fetched.some(path => path.includes('fuel_gain.wav'))).toBe(true);
  expect(fetched.some(path => path.includes('resource_gain_a.wav'))).toBe(false);
  FakeAudioContext.time = 7.5;
  await director.update({ ...base, eventSequence: 8, feedbackKind: 'repair' });
  expect(fetched.some(path => path.includes('repair_gain.wav'))).toBe(true);
  FakeAudioContext.time = 8;
  await director.update({ ...base, eventSequence: 9, feedbackKind: 'passenger' });
  expect(fetched.some(path => path.includes('passenger_pickup.wav'))).toBe(true);
  expect(fetched.some(path => path.includes('reward_small_a.wav'))).toBe(false);
  director.ui('purchase_success');
  director.ui('shop_upgrade');
  director.ui('shop_service');
  director.ui('vehicle_purchase');
  expect(fetched.filter(path => path.includes('shop_success.wav'))).toHaveLength(3);
  expect(fetched.some(path => path.includes('vehicle_purchase.wav'))).toBe(true);
  FakeAudioContext.time = 11;
  const roadside = entity('passenger', 'roadside-silent', 12, 0);
  await director.update({ ...base, eventSequence: 8, world: { ...base.world, entities: [roadside] } });
  await director.update({ ...base, eventSequence: 8, world: { ...base.world, entities: [{ ...roadside, distance: -9 }] } });
  FakeAudioContext.time = 12;
  const vendorHit = { ...entity('jam', 'vendor-hit', 0, 0), crossingRole: 'vendor' as const, consumed: true };
  await director.update({ ...base, eventSequence: 10, feedbackKind: 'jam', world: { ...base.world, entities: [vendorHit] } });
  expect(fetched.some(path => path.includes('vendor_cart_hit.mp3'))).toBe(true);
  expect(fetched.some(path => path.includes('voice-auditions'))).toBe(false);
  const powers = { ...base.powers, boostUntil: 30, starUntil: 30 };
  await director.update({ ...base, powers });
  await vi.waitFor(() => expect(sources.some(source => source.started && source.loop &&
    source.buffer?.path.includes('nitro_run_loop.wav'))).toBe(true));
  await vi.waitFor(() => expect(sources.some(source => source.started && source.loop &&
    source.buffer?.path.includes('star_run_loop.wav'))).toBe(true));
  expect(fetched.some(path => path.includes('nitro_activate.mp3'))).toBe(true);
  expect(fetched.some(path => path.includes('star_activate.mp3'))).toBe(true);
  const nitroBed = sources.find(source => source.buffer?.path.includes('nitro_run_loop.wav'))!;
  await director.update(base);
  expect(nitroBed.gain?.gain.targets.at(-1)).toBe(0);

  FakeAudioContext.time = 13;
  const farCar = { ...entity('traffic', 'far-car', 80, 0), trafficKind: 'car4' as const, speed: -6 };
  await director.update({ ...base, speed: 15, world: { ...base.world, entities: [farCar] } });
  expect(fetched.some(path => path.includes('horn_car.wav'))).toBe(false);
  const closeCar = { ...farCar, distance: 35 };
  await director.update({ ...base, speed: 15, world: { ...base.world, entities: [closeCar] } });
  expect(fetched.some(path => path.includes('horn_car.wav'))).toBe(true);
  await director.update({ ...base, speed: 15, world: { ...base.world, entities: [{ ...closeCar, distance: -2 }] } });
  expect(fetched.some(path => path.includes('pass_light.wav'))).toBe(true);
  expect(fetched.filter(path => path.includes('horn_car.wav'))).toHaveLength(1);
  await director.update({ ...base, speed: 15, world: { ...base.world, entities: [{ ...closeCar, distance: -3 }] } });
  expect(fetched.filter(path => path.includes('pass_light.wav'))).toHaveLength(1);
  FakeAudioContext.time = 17;
  const truckTraffic = { ...entity('traffic', 'near-truck', 32, 3.2), trafficKind: 'truck' as const, speed: -7 };
  await director.update({ ...base, speed: 15, world: { ...base.world, entities: [truckTraffic] } });
  expect(fetched.some(path => path.includes('horn_heavy.wav'))).toBe(true);
  await vi.waitFor(() => expect(stereoPans.at(-1)?.value).toBeGreaterThan(0));
  await director.update({ ...base, speed: 15, world: { ...base.world, entities: [{ ...truckTraffic, distance: -1 }] } });
  expect(fetched.some(path => path.includes('pass_heavy.wav'))).toBe(true);

  const heavyBefore = sources.filter(source => source.started && source.buffer?.path.includes('collision_heavy')).length;
  await director.update({ ...base, phase: 'ended', eventSequence: 11, feedbackKind: 'accident' });
  await vi.waitFor(() => expect(sources.filter(source => source.started && source.buffer?.path.includes('collision_heavy')).length).toBeGreaterThan(heavyBefore));
  director.dispose();
});
