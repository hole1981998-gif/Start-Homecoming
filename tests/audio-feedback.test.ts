// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import { AudioDirector, roadsideCallRange, spatialVoiceVolume, speechPlaybackRate, stormStrikeDelay, taperLoopEdges, waterLoopForVehicle } from '../src/audio-director';
import { initialRun, stepRun, type Run } from '../src/survival';
import { entity } from '../src/world';
import { developmentScenario } from '../src/development';
import { noInput } from '../src/simulation';
import { newVehicle } from '../src/vehicles';

afterEach(() => vi.unstubAllGlobals());

it('keeps a short line natural and brings a long take near 1.5 seconds without extreme speeding', () => {
  expect(speechPlaybackRate(1.2)).toBe(1);
  expect(2.08 / speechPlaybackRate(2.08)).toBeCloseTo(1.45);
  expect(speechPlaybackRate(3)).toBe(1.5);
  expect(2.72 / speechPlaybackRate(2.72, true)).toBeCloseTo(1.45);
});

it('makes a roadside call grow louder on approach and fade after passing', () => {
  expect(spatialVoiceVolume(58, 0)).toBe(0);
  expect(spatialVoiceVolume(40, 2)).toBeLessThan(spatialVoiceVolume(15, 2));
  expect(spatialVoiceVolume(5, 0)).toBeGreaterThan(.8);
  expect(spatialVoiceVolume(-13, 0)).toBe(0);
  expect(spatialVoiceVolume(-20, 0, 65, 65)).toBeGreaterThan(0);
  expect(spatialVoiceVolume(-6, 0)).toBeLessThan(spatialVoiceVolume(0, 0));
  expect(spatialVoiceVolume(10, 8)).toBeLessThan(spatialVoiceVolume(10, 0));
  expect(roadsideCallRange(4)).toBe(30);
  expect(roadsideCallRange(25)).toBe(45);
});

it('spaces storm strikes across a run and keeps each seed reproducible', () => {
  const first = stormStrikeDelay(17, 0);
  expect(first).toBeGreaterThanOrEqual(14);
  expect(first).toBeLessThanOrEqual(22);
  expect(stormStrikeDelay(17, 0)).toBe(first);
  expect(stormStrikeDelay(17, 1)).toBeGreaterThanOrEqual(27);
  expect(stormStrikeDelay(17, 1)).toBeLessThanOrEqual(43);
});

it('routes puddle loops by vehicle weight', () => {
  for (const kind of ['motorcycle', 'motorbike', 'tricycle'] as const)
    expect(waterLoopForVehicle(kind)).toBe('road/water_tire_light_loop.wav');
  for (const kind of ['car4', 'car7'] as const)
    expect(waterLoopForVehicle(kind)).toBe('road/water_tire_medium_loop.wav');
  for (const kind of ['bus', 'truck', 'container'] as const)
    expect(waterLoopForVehicle(kind)).toBe('road/water_tire_heavy_loop.wav');
});

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
  const voicePaths: string[] = [];
  const voiceAudios: Array<{ src: string; paused: boolean; onended?: () => void }> = [];
  const voiceGains: Array<ReturnType<FakeAudioContext['createGain']>> = [];
  const waterFilters: Array<{ type: string; frequency: { value: number } }> = [];
  const stereoPans: Array<{ value: number }> = [];
  class FakeAudioContext {
    static time = 1;
    state = 'running'; get currentTime() { return FakeAudioContext.time; } destination = {};
    createGain() {
      return { gain: { value: 0, targets: [] as number[], setTargetAtTime(value: number) { this.targets.push(value); } },
        connect() { return this; }, disconnect() { /* detached */ } };
    }
    createMediaElementSource() {
      return { connect(gain: ReturnType<FakeAudioContext['createGain']>) { voiceGains.push(gain); return gain; },
        disconnect() { /* detached */ } };
    }
    createBiquadFilter() {
      const filter = { type: '', frequency: { value: 0 }, connect(gain: ReturnType<FakeAudioContext['createGain']>) { return gain; },
        disconnect() { /* detached */ } };
      waterFilters.push(filter); return filter;
    }
    createStereoPanner() {
      const panner = { pan: { value: 0, setTargetAtTime(value: number) { this.value = value; } },
        connect() { return this; }, disconnect() { /* detached */ } };
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
  class FakeAudio {
    static rejectNextCall = false;
    duration = 2; playbackRate = 1; preservesPitch = false; loop = false; preload = '';
    paused = true;
    onloadedmetadata?: () => void; onended?: () => void; onerror?: () => void;
    constructor(public src: string) { voicePaths.push(src); voiceAudios.push(this); }
    play() {
      if (this.src.includes('_call_') && FakeAudio.rejectNextCall) {
        FakeAudio.rejectNextCall = false;
        return Promise.reject(new Error('temporary media rejection'));
      }
      this.paused = false; this.onloadedmetadata?.(); return Promise.resolve();
    }
    pause() { this.paused = true; }
  }
  vi.stubGlobal('AudioContext', FakeAudioContext);
  vi.stubGlobal('Audio', FakeAudio);
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
  expect(fetched.some(path => path.includes('water_light_loop.mp3'))).toBe(false);
  expect(fetched.some(path => path.includes('skid.wav') || path.includes('police_warning'))).toBe(false);

  const water = { ...entity('water', 'test-water', 0, 0), touching: true };
  await director.update({ ...base, eventSequence: 1, feedbackKind: 'water', world: { ...base.world, entities: [water] } });
  await vi.waitFor(() => expect(sources.some(source => source.started && source.buffer?.path.includes('water_light_loop.mp3'))).toBe(true));
  expect(fetched.some(path => path.includes('water_entry_'))).toBe(false);
  expect(waterFilters).toHaveLength(0);
  const rainSource = sources.find(source => source.buffer?.path.includes('rain_shower_loop.mp3'))!;
  expect(rainSource.loop).toBe(true);
  expect(rainSource.gain?.gain.targets.at(-1)).toBeCloseTo(3);
  const thunderSource = sources.find(source => source.buffer?.path.includes('distant_thunder_loop.mp3'))!;
  expect(thunderSource.loop).toBe(true);
  expect(thunderSource.gain?.gain.targets.at(-1)).toBeCloseTo(1);
  expect(fetched.some(path => path.includes('rain_road_loop.mp3'))).toBe(false);
  const waterSource = sources.find(source => source.buffer?.path.includes('water_light_loop.mp3'))!;
  expect(waterSource.loop).toBe(true);
  expect(waterSource.gain?.gain.targets.at(-1)).toBeGreaterThan(0);
  await director.update({ ...base, speed: 20, world: { ...base.world, entities: [water] } });
  expect(fetched.some(path => path.includes('water_entry_'))).toBe(false);
  const waterTargets = waterSource.gain?.gain.targets ?? [];
  expect(waterTargets.at(-1)).toBeGreaterThan(waterTargets.at(-2) ?? 0);
  expect(waterSource.playbackRate.targets.at(-1)).toBeGreaterThan(1);
  FakeAudioContext.time = 5;
  await director.update({ ...base, world: { ...base.world, entities: [water] } });
  expect(waterSource.gain?.gain.targets.at(-1)).toBeGreaterThan(0);
  FakeAudioContext.time = 8.5;
  await director.update({ ...base, world: { ...base.world, entities: [water] } });
  expect(waterSource.gain?.gain.targets.at(-1)).toBeGreaterThan(0);
  expect(sources.filter(source => source.buffer?.path.includes('water_light_loop.mp3'))).toHaveLength(1);
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
  expect(waterSource.gain?.gain.targets.at(-1)).toBeGreaterThan(0);
  expect(fetched.some(path => path.includes('water_entry_'))).toBe(false);
  const car = newVehicle('car4', 'test-car');
  await director.update({ ...base, activeVehicleId: car.id, vehicleInstances: [...base.vehicleInstances, car],
    world: { ...base.world, entities: [wideWater] } });
  await vi.waitFor(() => expect(sources.some(source => source.buffer?.path.includes('water_medium_loop.mp3') &&
    (source.gain?.gain.targets.at(-1) ?? 0) > 0)).toBe(true));
  expect(waterSource.gain?.gain.targets.at(-1)).toBe(0);
  await director.update({ ...base, eventSequence: 1, world: { ...base.world, entities: [wideWater] } });
  expect(fetched.some(path => path.includes('water_entry_'))).toBe(false);
  await director.update(base);
  FakeAudioContext.time = 2.5;
  const truck = newVehicle('truck', 'test-truck');
  await director.update({ ...base, activeVehicleId: truck.id, vehicleInstances: [...base.vehicleInstances, truck],
    world: { ...base.world, entities: [{ ...water, id: 'truck-water' }] } });
  await vi.waitFor(() => expect(sources.some(source => source.buffer?.path.includes('water_heavy_loop.mp3') &&
    (source.gain?.gain.targets.at(-1) ?? 0) > 0)).toBe(true));
  expect(fetched.some(path => path.includes('water_entry_'))).toBe(false);
  await director.update(base);
  FakeAudioContext.time = 3;
  await director.update({ ...base, eventSequence: 1, world: { ...base.world, entities: [{ ...water, id: 'second-skim' }] } });
  expect(fetched.some(path => path.includes('water_entry_'))).toBe(false);
  await director.update(base);
  FakeAudioContext.time = 3.5;
  await director.update({ ...base, eventSequence: 1, world: { ...base.world, entities: [{ ...water, id: 'third-skim' }] } });
  expect(fetched.some(path => path.includes('water_entry_'))).toBe(false);
  await director.update(base);

  await director.update({ ...base, eventSequence: 2, feedbackKind: 'pothole' });
  const container = { ...entity('traffic', 'test-container', 0, 0), trafficKind: 'container' as const, lastHit: 0 };
  const beforePlayerTraffic = voicePaths.length;
  await director.update({ ...base, eventSequence: 3, feedbackKind: 'traffic', world: { ...base.world, entities: [container] } });
  expect(voicePaths.length).toBe(beforePlayerTraffic);
  expect(fetched.some(path => path.includes('pothole_light.mp3'))).toBe(true);
  expect(fetched.some(path => path.includes('resource_loss_a.wav'))).toBe(true);
  expect(fetched.some(path => path.includes('collision_light.mp3'))).toBe(true);
  FakeAudioContext.time = 4.5;
  await director.update({ ...base, speed: 25, eventSequence: 4, feedbackKind: 'traffic', world: { ...base.world, entities: [container] } });
  expect(fetched.some(path => path.includes('collision_heavy.mp3'))).toBe(true);
  const bike = { ...entity('traffic', 'bike', 0, 0), trafficKind: 'motorbike' as const, trafficPairContacts: ['moto'] };
  const moto = { ...entity('traffic', 'moto', 0, 0), trafficKind: 'motorcycle' as const, trafficPairContacts: ['bike'] };
  await director.update({ ...base, eventSequence: 4, world: { ...base.world, entities: [bike, moto] } });
  expect(voicePaths.slice(beforePlayerTraffic).some(path => path.includes('_driver_'))).toBe(true);
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
  const roadside = entity('passenger', 'roadside-caller', 50, 0);
  const beforeApproach = voicePaths.length;
  await director.update({ ...base, speed: 20, eventSequence: 8, world: { ...base.world, entities: [roadside] } });
  expect(voicePaths.length).toBe(beforeApproach);
  await director.update({ ...base, speed: 20, eventSequence: 8, world: { ...base.world, entities: [{ ...roadside, distance: 35 }] } });
  expect(voicePaths.some(path => path.includes('owner-voices-2026-11-04') && path.includes('_call_'))).toBe(true);
  const callGain = voiceGains.at(-1)!.gain.value;
  expect(callGain).toBeGreaterThan(.5);
  await director.update({ ...base, speed: 20, eventSequence: 8, world: { ...base.world, entities: [{ ...roadside, distance: 12 }] } });
  expect(voiceGains.at(-1)?.gain.targets.at(-1)).toBeGreaterThan(callGain);
  await director.update({ ...base, eventSequence: 8, world: { ...base.world, entities: [{ ...roadside, distance: -25 }] } });
  expect(voiceGains.at(-1)?.gain.targets.at(-1)).toBe(0);
  FakeAudio.rejectNextCall = true;
  const retryRider = entity('passenger', 'retry-caller', 29, 0);
  const callsBeforeRetry = voicePaths.filter(path => path.includes('_call_')).length;
  await director.update({ ...base, eventSequence: 8, world: { ...base.world, entities: [retryRider] } });
  await vi.waitFor(() => expect(voiceAudios.at(-1)?.paused).toBe(true));
  FakeAudioContext.time = 11.7;
  await director.update({ ...base, eventSequence: 8, world: { ...base.world, entities: [{ ...retryRider, distance: 20 }] } });
  expect(voicePaths.filter(path => path.includes('_call_')).length - callsBeforeRetry).toBe(2);
  expect(voiceAudios.at(-1)?.paused).toBe(false);
  const callsBeforeVariation = voicePaths.filter(path => path.includes('_call_')).length;
  await director.update({ ...base, world: { ...base.world, entities: [entity('passenger', 'caller-a', 22, 0)] } });
  await director.update({ ...base, world: { ...base.world, entities: [entity('passenger', 'caller-c', 22, 0)] } });
  const variants = voicePaths.filter(path => path.includes('_call_')).slice(callsBeforeVariation);
  expect(variants).toHaveLength(2);
  expect(variants[0]).not.toBe(variants[1]);
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

  FakeAudioContext.time = 18;
  const crash = { elapsed: 0, side: 1 as const, originDistance: 0, originX: 0, impactSpeed: 15,
    returningRiderIds: ['return-a', 'return-b'], strandedRiderIds: ['left-c'] };
  const fallen = { ...entity('passenger', 'fallen-c', -20, 0), riderId: 'left-c', pickupable: false,
    passengerMotion: { homeX: 0, homeDistance: -20, startedAt: 18, phase: 0, idle: false,
      ejectedAt: 18, fromX: 0, fromDistance: 0, crashRecovery: true } };
  const beforeCrashVoices = voicePaths.length;
  await director.update({ ...base, crash, riderIds: [], world: { ...base.world, entities: [fallen] } });
  expect(voicePaths.length - beforeCrashVoices).toBe(4);
  expect(voicePaths.slice(beforeCrashVoices).every(path => path.includes('scream') || path.includes('kick_short'))).toBe(true);
  expect(voicePaths.some(path => path.includes('_return_') || path.includes('_abandon_'))).toBe(false);
  FakeAudioContext.time = 20;
  await director.update({ ...base, crash: null, riderIds: ['return-a', 'return-b'],
    world: { ...base.world, entities: [fallen] } });
  expect(voicePaths.slice(beforeCrashVoices).filter(path => path.includes('_return_'))).toHaveLength(2);
  expect(voicePaths.slice(beforeCrashVoices).filter(path => path.includes('_abandon_'))).toHaveLength(1);
  const afterReboard = voicePaths.length;
  await director.update({ ...base, crash: null, riderIds: ['return-a', 'return-b'] });
  expect(voicePaths).toHaveLength(afterReboard);

  FakeAudioContext.time = 21;
  const beforeSoloCrash = voicePaths.length;
  await director.update({ ...base, crash: { ...crash, returningRiderIds: [], strandedRiderIds: [] }, riderIds: [] });
  expect(voicePaths.length - beforeSoloCrash).toBe(1);
  expect(voicePaths.at(-1)).toMatch(/anh_minh_scream|quang_toan_scream|huy_kick_scream/);

  FakeAudioContext.time = 23;
  const roadsideHit = entity('passenger', 'hit-rider', 3, 0);
  await director.update({ ...base, world: { ...base.world, entities: [roadsideHit] } });
  const beforeHit = voicePaths.length;
  for (let tick = 1; tick <= 60; tick++)
    await director.update({ ...base, distance: tick * .05, world: { ...base.world, entities: [roadsideHit] } });
  expect(voicePaths.length - beforeHit).toBe(0);
  const actualHit = { ...roadsideHit, pickupable: false, lastHit: 25,
    passengerMotion: { homeX: 0, homeDistance: 3, startedAt: 26, phase: 0, idle: false,
      ejectedAt: 25, fromX: 0, fromDistance: 3, crashRecovery: true, hitByPlayer: true } };
  await director.update({ ...base, distance: 3, world: { ...base.world, entities: [actualHit] } });
  expect(voicePaths.length - beforeHit).toBe(1);
  await director.update({ ...base, distance: 3.1, world: { ...base.world, entities: [roadsideHit] } });
  expect(voicePaths.length - beforeHit).toBe(1);

  FakeAudioContext.time = 25;
  const wreckRiders = [0, 1, 2].map(i => entity('passenger', `wreck-rider:bus:${i}`, 0, i * 2));
  const beforeWreck = voicePaths.length;
  await director.update({ ...base, world: { ...base.world, entities: wreckRiders } });
  expect(voicePaths.length - beforeWreck).toBe(3);
  voiceAudios[beforeWreck].onended?.();
  await director.update({ ...base, world: { ...base.world, entities: wreckRiders } });
  expect(voicePaths.slice(beforeWreck).some(path => path.includes('_traffic_'))).toBe(true);

  await director.update({ ...base, activeSeconds: 80 });
  await vi.waitFor(() => expect(fetched.some(path => path.includes('lightning_distant_a.mp3'))).toBe(true));
  const firstStrikeCount = fetched.filter(path => path.includes('lightning_distant_')).length;
  await director.update({ ...base, activeSeconds: 80 });
  expect(fetched.filter(path => path.includes('lightning_distant_'))).toHaveLength(firstStrikeCount);
  FakeAudioContext.time = 27;
  await director.update({ ...base, activeSeconds: 130 });
  await vi.waitFor(() => expect(fetched.some(path => path.includes('lightning_distant_b.mp3'))).toBe(true));

  const heavyBefore = sources.filter(source => source.started && source.buffer?.path.includes('collision_heavy')).length;
  await director.update({ ...base, phase: 'ended', eventSequence: 11, feedbackKind: 'accident' });
  await vi.waitFor(() => expect(sources.filter(source => source.started && source.buffer?.path.includes('collision_heavy')).length).toBeGreaterThan(heavyBefore));
  director.dispose();

  const roadsideDirector = new AudioDirector();
  roadsideDirector.unlock();
  let roadsideRun: Run = { ...developmentScenario(initialRun(17, 'roadside-audio-test'), 'passenger'),
    phase: 'running' };
  FakeAudioContext.time = 30;
  await roadsideDirector.update(roadsideRun);
  const beforeDriveBy = voicePaths.length;
  for (let tick = 0; tick < 45; tick++) {
    roadsideRun = stepRun(roadsideRun, noInput());
    await roadsideDirector.update(roadsideRun);
  }
  expect(roadsideRun.distance).toBeGreaterThan(5);
  expect(voicePaths.slice(beforeDriveBy).filter(path => path.includes('_scream') || path.includes('kick_short'))).toHaveLength(0);
  roadsideDirector.dispose();
});
