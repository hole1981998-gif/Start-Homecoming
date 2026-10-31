import type { Run } from './survival';
import type { VehicleKind } from './vehicles';
import { activeVehicle } from './survival';
import { itemBalance } from './config';

const files = import.meta.glob([
  '../project-reference/sfx/elevenlabs-2026-10-29/*.mp3',
  '!../project-reference/sfx/elevenlabs-2026-10-29/water_entry_splash.mp3',
  '!../project-reference/sfx/elevenlabs-2026-10-29/water_roll_loop.mp3',
  '../project-reference/sfx/procedural-auditions-2026-10-28/engine-v2/*_loop.wav',
  '../project-reference/sfx/procedural-auditions-2026-10-28/ui-modern/*_a.wav',
], { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const root = '../project-reference/sfx/procedural-auditions-2026-10-28/';
const generatedRoot = '../project-reference/sfx/elevenlabs-2026-10-29/';
const generated: Record<string, string> = {
  'road/water_entry_skim.wav': 'water_entry_skim.mp3',
  'road/water_entry_wash.wav': 'water_entry_wash.mp3',
  'road/water_entry_heavy.wav': 'water_entry_heavy.mp3',
  'road/water_roll_shallow_loop.wav': 'water_roll_shallow_loop.mp3',
  'road/water_roll_shallow_ripple_loop.wav': 'water_roll_shallow_ripple_loop.mp3',
  'road/water_roll_shallow_grit_loop.wav': 'water_roll_shallow_grit_loop.mp3',
  'road/water_roll_deep_loop.wav': 'water_roll_deep_loop.mp3',
  'road/water_roll_deep_churn_loop.wav': 'water_roll_deep_churn_loop.mp3',
  'road/water_roll_deep_surge_loop.wav': 'water_roll_deep_surge_loop.mp3',
  'road/water_entry_skim_alt.wav': 'water_entry_skim_alt.mp3',
  'road/water_entry_skim_grit.wav': 'water_entry_skim_grit.mp3',
  'road/water_entry_wash_alt.wav': 'water_entry_wash_alt.mp3',
  'road/water_entry_wash_ripple.wav': 'water_entry_wash_ripple.mp3',
  'road/water_entry_heavy_alt.wav': 'water_entry_heavy_alt.mp3',
  'road/water_entry_heavy_surge.wav': 'water_entry_heavy_surge.mp3',
  'road/water_exit_spray.wav': 'water_exit_spray.mp3',
  'road/pothole_rattle_light.wav': 'pothole_light.mp3',
  'road/pothole_rattle_light_alt.wav': 'pothole_light_alt.mp3',
  'road/pothole_rattle_heavy.wav': 'pothole_heavy.mp3',
  'road/pothole_rattle_heavy_alt.wav': 'pothole_heavy_alt.mp3',
  'interaction-v2/collision_light.wav': 'collision_light.mp3',
  'interaction-v2/collision_light_alt.wav': 'collision_light_alt.mp3',
  'interaction-v2/collision_medium.wav': 'collision_medium.mp3',
  'interaction-v2/collision_medium_alt.wav': 'collision_medium_alt.mp3',
  'interaction-v2/collision_heavy.wav': 'collision_heavy.mp3',
  'interaction-v2/collision_heavy_alt.wav': 'collision_heavy_alt.mp3',
  'interaction-v2/cargo_crate_hit.wav': 'cargo_crate_hit.mp3',
  'interaction-v2/cargo_crate_hit_alt.wav': 'cargo_crate_hit_alt.mp3',
  'interaction-v2/cargo_barrel_hit.wav': 'cargo_barrel_hit.mp3',
  'interaction-v2/cargo_barrel_hit_alt.wav': 'cargo_barrel_hit_alt.mp3',
  'interaction-v2/vendor_hit.wav': 'vendor_cart_hit.mp3',
  'interaction-v2/vendor_hit_alt.wav': 'vendor_cart_hit_alt.mp3',
  'interaction-v2/passenger_hit.wav': 'pedestrian_hit.mp3',
  'interaction-v2/passenger_hit_alt.wav': 'pedestrian_hit_alt.mp3',
  'interaction-v2/train_pass.wav': 'train_hit.mp3',
  'interaction-v2/barrier_hit.wav': 'barrier_hit.mp3',
  'interaction-v2/barrier_hit_alt.wav': 'barrier_hit_alt.mp3',
  'interaction-v2/ambulance_hit.wav': 'ambulance_hit.mp3',
  'interaction-v2/ambulance_hit_alt.wav': 'ambulance_hit_alt.mp3',
  'ambience/rain_light_loop.wav': 'rain_road_loop.mp3',
  'ambience/wind_loop.wav': 'wind_road_loop.mp3',
  'ambience/wind_soft_loop.wav': 'wind_road_soft_loop.mp3',
  'ambience/wet_road_loop.wav': 'wet_tire_loop.mp3',
  'engine-v2/bike_texture_loop.wav': 'engine_bike_texture_loop.mp3',
  'engine-v2/car_texture_loop.wav': 'engine_car_texture_loop.mp3',
  'engine-v2/heavy_texture_loop.wav': 'engine_heavy_texture_loop.mp3',
  'vehicle/coast.wav': 'vehicle_coast.mp3',
  'vehicle/stop.wav': 'vehicle_stop.mp3',
  'vehicle/driver_fall.wav': 'driver_fall.mp3',
  'vehicle/driver_fall_alt.wav': 'driver_fall_alt.mp3',
  'vehicle/vehicle_switch.wav': 'vehicle_switch.mp3',
  'interaction-v2/cargo_release.wav': 'cargo_release.mp3',
  'interaction-v2/cargo_barrel_roll.wav': 'cargo_barrel_roll.mp3',
  'interaction-v2/cargo_crate_roll.wav': 'cargo_crate_roll.mp3',
  'interaction-v2/ambulance_pass.wav': 'ambulance_pass.mp3',
  'interaction-v2/wind_gust.wav': 'wind_gust.mp3',
  'interaction-v2/police_capture.wav': 'police_capture.mp3',
  'interaction-v2/banana_use.wav': 'banana_use.mp3',
  'interaction-v2/broken_car.wav': 'broken_car.mp3',
  'item/fuel_pickup.wav': 'fuel_pickup.mp3',
  'item/repair_pickup.wav': 'repair_pickup.mp3',
  'item/nitro_activate.wav': 'nitro_activate.mp3',
  'item/jump.wav': 'jump_launch.mp3',
  'item/landing.wav': 'jump_land.mp3',
  'item/star_activate.wav': 'star_activate.mp3',
  'item/grab_call.wav': 'grab_call.mp3',
  'pickup_01.wav': 'passenger_pickup.mp3',
  'kick_01.wav': 'passenger_drop.mp3',
  'result/result_damage.wav': 'result_failure.mp3',
  'result/result_fuel.wav': 'result_fuel.mp3',
  'result/result_train.wav': 'result_train.mp3',
  'result/result_police.wav': 'result_police.mp3',
  'result/result_secret.wav': 'result_success.mp3',
};
const url = (name: string): string | undefined =>
  files[generatedRoot + generated[name]] ?? files[root + name];

const oneShotVariants: Record<string, string[]> = {
  'road/water_entry_skim.wav': ['road/water_entry_skim.wav', 'road/water_entry_skim_alt.wav', 'road/water_entry_skim_grit.wav'],
  'road/water_entry_wash.wav': ['road/water_entry_wash.wav', 'road/water_entry_wash_alt.wav', 'road/water_entry_wash_ripple.wav'],
  'road/water_entry_heavy.wav': ['road/water_entry_heavy.wav', 'road/water_entry_heavy_alt.wav', 'road/water_entry_heavy_surge.wav'],
  'interaction-v2/collision_light.wav': ['interaction-v2/collision_light.wav', 'interaction-v2/collision_light_alt.wav'],
  'interaction-v2/collision_medium.wav': ['interaction-v2/collision_medium.wav', 'interaction-v2/collision_medium_alt.wav'],
  'interaction-v2/collision_heavy.wav': ['interaction-v2/collision_heavy.wav', 'interaction-v2/collision_heavy_alt.wav'],
  'road/pothole_rattle_light.wav': ['road/pothole_rattle_light.wav', 'road/pothole_rattle_light_alt.wav'],
  'road/pothole_rattle_heavy.wav': ['road/pothole_rattle_heavy.wav', 'road/pothole_rattle_heavy_alt.wav'],
  'interaction-v2/cargo_crate_hit.wav': ['interaction-v2/cargo_crate_hit.wav', 'interaction-v2/cargo_crate_hit_alt.wav'],
  'interaction-v2/cargo_barrel_hit.wav': ['interaction-v2/cargo_barrel_hit.wav', 'interaction-v2/cargo_barrel_hit_alt.wav'],
  'interaction-v2/ambulance_hit.wav': ['interaction-v2/ambulance_hit.wav', 'interaction-v2/ambulance_hit_alt.wav'],
  'interaction-v2/barrier_hit.wav': ['interaction-v2/barrier_hit.wav', 'interaction-v2/barrier_hit_alt.wav'],
  'interaction-v2/vendor_hit.wav': ['interaction-v2/vendor_hit.wav', 'interaction-v2/vendor_hit_alt.wav'],
  'interaction-v2/passenger_hit.wav': ['interaction-v2/passenger_hit.wav', 'interaction-v2/passenger_hit_alt.wav'],
  'vehicle/driver_fall.wav': ['vehicle/driver_fall.wav', 'vehicle/driver_fall_alt.wav'],
};
const waterLoops = {
  shallow: ['road/water_roll_shallow_loop.wav', 'road/water_roll_shallow_ripple_loop.wav', 'road/water_roll_shallow_grit_loop.wav'],
  deep: ['road/water_roll_deep_loop.wav', 'road/water_roll_deep_churn_loop.wav', 'road/water_roll_deep_surge_loop.wav'],
};
const windLoops = ['ambience/wind_loop.wav', 'ambience/wind_soft_loop.wav'];

type Bus = 'sfx' | 'ambience';
type Stem = { sources: AudioBufferSourceNode[]; gains: GainNode[]; kind: VehicleKind };
const heavyVehicle = (kind?: VehicleKind): boolean => kind === 'bus' || kind === 'truck' || kind === 'container';
const lightVehicle = (kind?: VehicleKind): boolean => kind === 'motorcycle' || kind === 'motorbike' || kind === 'tricycle';
const collisionCue = (a?: VehicleKind, b?: VehicleKind, impactSpeed?: number): string => {
  const weight = impactSpeed === undefined
    ? heavyVehicle(a) || heavyVehicle(b) ? 'heavy' : lightVehicle(a) && lightVehicle(b) ? 'light' : 'medium'
    : impactSpeed < 9 ? 'light' : impactSpeed < 21 ? 'medium' : heavyVehicle(a) || heavyVehicle(b) ? 'heavy' : 'medium';
  return `interaction-v2/collision_${weight}.wav`;
};
const potholeCue = (kind?: VehicleKind): string => `road/pothole_rattle_${heavyVehicle(kind) ? 'heavy' : 'light'}.wav`;
const engineTexture = (kind: VehicleKind): string =>
  `engine-v2/${lightVehicle(kind) ? 'bike' : heavyVehicle(kind) ? 'heavy' : 'car'}_texture_loop.wav`;
const cueTrim: Record<string, number> = {
  'vehicle/coast.wav': .55, 'vehicle/stop.wav': 1.5, 'vehicle/driver_fall.wav': .55,
  'vehicle/vehicle_switch.wav': .35, 'interaction-v2/cargo_release.wav': .7,
  'interaction-v2/cargo_barrel_roll.wav': .65, 'interaction-v2/cargo_crate_roll.wav': .65,
  'interaction-v2/ambulance_pass.wav': .4, 'interaction-v2/wind_gust.wav': .3,
  'interaction-v2/police_capture.wav': 1.1, 'interaction-v2/banana_use.wav': .7,
  'interaction-v2/broken_car.wav': .55, 'item/fuel_pickup.wav': .65,
  'item/repair_pickup.wav': .8, 'item/nitro_activate.wav': .26,
  'item/jump.wav': 1.5, 'item/landing.wav': .65, 'item/star_activate.wav': .7,
  'item/grab_call.wav': 1.3, 'pickup_01.wav': .55, 'kick_01.wav': .55,
  'result/result_damage.wav': .55, 'result/result_fuel.wav': 1.5,
  'result/result_train.wav': .6, 'result/result_police.wav': 1.4,
  'result/result_secret.wav': .35,
};
export type UiCue = 'menu_select' | 'menu_back' | 'help_open' | 'card_open' | 'card_dismiss' |
  'pause' | 'resume' | 'restart' | 'shop_enter' | 'shop_category' | 'purchase_fail' |
  'purchase_success' | 'shop_service' | 'shop_upgrade' | 'vehicle_purchase' |
  'toggle_on' | 'toggle_off' | 'resource_gain' | 'resource_loss' | 'reward_small';
const waterEntryCue = (kind: VehicleKind, width: number, length: number): string =>
  heavyVehicle(kind) ? 'road/water_entry_heavy.wav' :
    lightVehicle(kind) && width < 5.7 && length < 20 ? 'road/water_entry_skim.wav' : 'road/water_entry_wash.wav';

/** Taper loop endpoints to zero so compressed MP3 boundary samples cannot click. */
export function taperLoopEdges(buffer: AudioBuffer): void {
  const fade = Math.min(Math.floor(buffer.sampleRate * .005), Math.floor(buffer.length / 4));
  if (fade < 2) return;
  for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
    const samples = buffer.getChannelData(channel);
    for (let i = 0; i < fade; i++) {
      const gain = Math.sin(Math.PI * i / (2 * (fade - 1)));
      samples[i] *= gain;
      samples[samples.length - 1 - i] *= gain;
    }
  }
}

/** Presentation-only sound: every cue follows simulation state and never feeds back into it. */
export class AudioDirector {
  private context?: AudioContext;
  private buses?: Record<Bus, GainNode>;
  private buffers = new Map<string, Promise<AudioBuffer | null>>();
  private stem?: Stem;
  private retiring = new Set<Stem>();
  private ambience = new Map<string, { source: AudioBufferSourceNode; gain: GainNode }>();
  private near = new Set<string>();
  private trafficPairs = new Set<string>();
  private trafficHoles = new Set<string>();
  private entityState = new Map<string, { lastHit: number; cargoDropped: boolean; consumed: boolean }>();
  private cooldown = new Map<string, number>();
  private variantCount = new Map<string, number>();
  private waterVisit = -1;
  private waterStart = 0;
  private windStart = 0;
  private oneShots = new Set<AudioBufferSourceNode>();
  private runId = '';
  private lastSequence = -1;
  private lastJump = -100;
  private lastBoost = 0;
  private lastStar = 0;
  private lastMotion = '';
  private lastSpeed = 0;
  private ended = false;
  private airborne = false;
  private crashed = false;
  private inWind = false;
  private waterActive = false;
  private waterContacts = new Set<string>();
  private vehicleId = '';
  private requestedKind?: VehicleKind;
  private running = false;
  private generation = 0;
  private uiRequest = 0;
  private sweepTick = 0;
  private levels = { sfx: 1, ambience: 1 };

  setLevels(sfx: number, ambience: number): void {
    this.levels = { sfx: Math.max(0, Math.min(1, sfx)), ambience: Math.max(0, Math.min(1, ambience)) };
    if (this.buses) {
      const now = this.context?.currentTime ?? 0;
      this.buses.sfx.gain.setTargetAtTime(.65 * this.levels.sfx, now, .025);
      this.buses.ambience.gain.setTargetAtTime(.22 * this.levels.ambience, now, .025);
    }
  }

  unlock(): void {
    if (typeof AudioContext === 'undefined') return;
    if (!this.context) {
      this.context = new AudioContext();
      const sfx = this.context.createGain(), ambience = this.context.createGain();
      sfx.gain.value = .65 * this.levels.sfx; ambience.gain.value = .22 * this.levels.ambience;
      sfx.connect(this.context.destination); ambience.connect(this.context.destination);
      this.buses = { sfx, ambience };
    }
    void this.context.resume();
  }

  private async buffer(name: string): Promise<AudioBuffer | null> {
    const ctx = this.context, path = url(name);
    if (!ctx || !path) return null;
    if (!this.buffers.has(name)) this.buffers.set(name, fetch(path).then(r => r.ok ? r.arrayBuffer() : Promise.reject(new Error('audio fetch')))
      .then(data => ctx.decodeAudioData(data)).then(buffer => {
        if (name.includes('_loop') && generated[name] && buffer.length > 0) taperLoopEdges(buffer);
        return buffer;
      }).catch(() => null));
    return this.buffers.get(name)!;
  }

  private async play(name: string, key = name, gap = .18, volume = 1): Promise<void> {
    const ctx = this.context, bus = this.buses?.sfx;
    if (!ctx || !bus || ctx.state !== 'running') return;
    const now = ctx.currentTime;
    if (now - (this.cooldown.get(key) ?? -100) < gap) return;
    this.cooldown.set(key, now);
    const trim = cueTrim[name] ?? 1;
    const variants = oneShotVariants[name];
    if (variants) {
      const count = this.variantCount.get(name) ?? 0;
      this.variantCount.set(name, count + 1);
      name = variants[count % variants.length];
    }
    const generation = this.generation;
    const buffer = await this.buffer(name);
    if (!buffer || generation !== this.generation || !this.context || this.context.state !== 'running') return;
    const source = ctx.createBufferSource(), gain = ctx.createGain();
    source.buffer = buffer; gain.gain.value = volume * trim;
    source.connect(gain).connect(bus); source.start();
    this.oneShots.add(source);
    source.onended = () => { this.oneShots.delete(source); source.disconnect(); gain.disconnect(); };
  }

  private async loop(name: string, bus: Bus, volume: number): Promise<void> {
    if (this.ambience.has(name) || !this.context || !this.buses) return;
    const ctx = this.context, generation = this.generation, buffer = await this.buffer(name);
    if (!buffer || generation !== this.generation || !this.running || this.ambience.has(name) || ctx.state !== 'running' || name.includes('water_roll') && !this.waterActive) return;
    const source = ctx.createBufferSource(), gain = ctx.createGain();
    source.buffer = buffer; source.loop = true; gain.gain.value = 0;
    source.connect(gain).connect(this.buses[bus]); source.start();
    this.ambience.set(name, { source, gain });
    gain.gain.setTargetAtTime(volume, ctx.currentTime, .15);
  }

  private async engine(kind: VehicleKind): Promise<void> {
    if (!this.context || !this.buses || this.stem?.kind === kind) return;
    const ctx = this.context, generation = this.generation;
    const names = [...['idle', 'cruise', 'fast'].map(s => `engine-v2/${kind}_${s}_loop.wav`), engineTexture(kind)];
    const buffers = await Promise.all(names.map(n => this.buffer(n)));
    if (buffers.slice(0, 3).some(b => !b) || generation !== this.generation || this.requestedKind !== kind || this.stem?.kind === kind || ctx.state !== 'running') return;
    this.stopEngine(.18);
    const sources: AudioBufferSourceNode[] = [], gains: GainNode[] = [];
    for (const buffer of buffers) {
      if (!buffer) continue;
      const source = ctx.createBufferSource(), gain = ctx.createGain();
      source.buffer = buffer; source.loop = true; gain.gain.value = 0;
      source.connect(gain).connect(this.buses.sfx);
      sources.push(source); gains.push(gain);
    }
    const start = ctx.currentTime + .01;
    for (const source of sources) source.start(start);
    this.stem = { kind, sources, gains };
  }

  private stopEngine(fadeSeconds = 0): void {
    const stem = this.stem, ctx = this.context;
    this.stem = undefined;
    if (!stem) return;
    if (fadeSeconds && ctx?.state === 'running') this.retiring.add(stem);
    let remaining = stem.sources.length;
    stem.sources.forEach((source, index) => {
      const gain = stem.gains[index];
      if (fadeSeconds && ctx?.state === 'running') {
        gain.gain.setTargetAtTime(0, ctx.currentTime, fadeSeconds / 4);
        source.onended = () => { source.disconnect(); gain.disconnect(); if (--remaining === 0) this.retiring.delete(stem); };
        try { source.stop(ctx.currentTime + fadeSeconds); } catch { /* already stopped */ }
      } else {
        try { source.stop(); } catch { /* already stopped */ }
        source.disconnect(); gain.disconnect();
      }
    });
  }

  private clearRetiring(): void {
    for (const stem of this.retiring) {
      stem.sources.forEach(source => { try { source.stop(); } catch { /* already stopped */ } source.disconnect(); });
      stem.gains.forEach(gain => gain.disconnect());
    }
    this.retiring.clear();
  }

  reset(): void {
    this.generation++;
    this.uiRequest++;
    for (const source of this.oneShots) { try { source.stop(); } catch { /* already stopped */ } }
    this.oneShots.clear();
    this.stopEngine();
    this.clearRetiring();
    for (const { source, gain } of this.ambience.values()) { try { source.stop(); } catch { /* already stopped */ } source.disconnect(); gain.disconnect(); }
    this.ambience.clear(); this.near.clear(); this.trafficPairs.clear(); this.trafficHoles.clear(); this.waterContacts.clear(); this.entityState.clear(); this.cooldown.clear(); this.variantCount.clear(); this.sweepTick = 0;
    this.waterVisit = -1; this.waterStart = 0; this.windStart = 0;
    this.lastSequence = -1; this.lastJump = -100; this.lastBoost = 0; this.lastStar = 0; this.lastMotion = ''; this.lastSpeed = 0; this.ended = false; this.airborne = false; this.crashed = false; this.inWind = false; this.waterActive = false; this.vehicleId = ''; this.requestedKind = undefined; this.running = false;
  }

  pause(): void {
    this.generation++;
    this.uiRequest++;
    this.requestedKind = undefined;
    this.running = false;
    this.waterActive = false;
    this.stopEngine();
    this.clearRetiring();
    for (const source of this.oneShots) { try { source.stop(); } catch { /* already stopped */ } }
    for (const { gain } of this.ambience.values()) gain.gain.setTargetAtTime(0, this.context?.currentTime ?? 0, .08);
  }

  ui(name: UiCue): void {
    const ctx = this.context;
    if (!ctx) return;
    const request = ++this.uiRequest, generation = this.generation;
    const play = () => { void this.play(`ui-modern/${name}_a.wav`, `ui-${name}`, .09,
      name === 'resource_gain' || name === 'resource_loss' || name === 'reward_small' ? .24 : .38); };
    if (ctx.state === 'running') play(); else void ctx.resume().then(() => {
      if (request === this.uiRequest && generation === this.generation) play();
    }).catch(() => { /* blocked until a gesture */ });
  }

  async update(run: Run): Promise<void> {
    const ctx = this.context;
    if (!ctx) return;
    if (run.runId !== this.runId) { this.reset(); this.runId = run.runId; }
    const vehicle = activeVehicle(run);
    if (run.eventSequence !== this.lastSequence) {
      this.lastSequence = run.eventSequence;
      const kind = run.feedbackKind;
      const hitEntity = run.world.entities.find(e => e.consumed && !this.entityState.get(e.id)?.consumed && e.kind === kind);
      const hitTraffic = run.world.entities.find(e => e.kind === 'traffic' && e.lastHit >= 0 && Math.abs(e.lastHit - run.activeSeconds) < .1);
      const impactSpeed = run.crash?.impactSpeed ?? run.speed;
      const cue: Record<string, string> = { pothole: potholeCue(vehicle.kind), traffic: collisionCue(vehicle.kind, hitTraffic?.trafficKind, impactSpeed), cargo: hitEntity?.cargoType === 'crate' ? 'interaction-v2/cargo_crate_hit.wav' : 'interaction-v2/cargo_barrel_hit.wav', fuel: 'item/fuel_pickup.wav', repair: 'item/repair_pickup.wav', passenger: run.feedback.startsWith('Gọi Grab') ? 'item/grab_call.wav' : 'pickup_01.wav', drop: 'kick_01.wav', coast: 'vehicle/coast.wav', police: run.feedback.includes('Chuối') ? 'interaction-v2/banana_use.wav' : 'interaction-v2/police_capture.wav', militia: run.feedback.includes('Chuối') ? 'interaction-v2/banana_use.wav' : collisionCue(vehicle.kind, undefined, impactSpeed), jam: hitEntity?.crossingRole === 'vendor' ? 'interaction-v2/vendor_hit.wav' : hitEntity?.serviceRole === 'ambulance' ? 'interaction-v2/ambulance_hit.wav' : 'interaction-v2/barrier_hit.wav', accident: 'interaction-v2/collision_heavy.wav', train: 'interaction-v2/train_pass.wav', broken: 'interaction-v2/broken_car.wav' };
      if (kind && cue[kind]) void this.play(cue[kind], `event-${kind}`);
      if (kind === 'fuel' || kind === 'repair') this.ui('resource_gain');
      else if (kind === 'passenger') this.ui('reward_small');
      else if (kind === 'pothole' || kind === 'police' || kind === 'militia') this.ui('resource_loss');
    }
    if (run.phase !== 'running') {
      this.running = false;
      this.requestedKind = undefined;
      this.stopEngine(.12);
      for (const { gain } of this.ambience.values()) gain.gain.setTargetAtTime(0, ctx.currentTime, .1);
      if (run.phase === 'ended' && !this.ended) {
        this.ended = true;
        const reason = run.result?.reason;
        if (reason) void this.play(`result/result_${reason}.wav`, 'result', 0, .8);
      }
      return;
    }
    this.running = true;
    const touchingWater = run.world.entities.filter(e => e.kind === 'water' && e.touching && !e.consumed);
    const inWater = touchingWater.length > 0;
    const newContacts = touchingWater.filter(e => !this.waterContacts.has(e.id));
    if (inWater && !this.waterActive) { this.waterVisit++; this.waterStart = ctx.currentTime; }
    if (newContacts.length) {
      const entry = newContacts.reduce((best, current) => current.width * current.length > best.width * best.length ? current : best);
      const entryCue = waterEntryCue(vehicle.kind, entry.width, entry.length);
      const speedLevel = .35 + .65 * Math.min(1, run.speed / Math.max(1, vehicle.maxSpeed * .7));
      const entryLevel = (entryCue.includes('skim') ? .65 : entryCue.includes('heavy') ? .45 : .4) * speedLevel;
      void this.play(entryCue, 'water-entry', .28, entryLevel);
    }
    if (this.waterActive && !inWater) void this.play('road/water_exit_spray.wav', 'water-exit', .35, .26);
    this.waterContacts = new Set(touchingWater.map(e => e.id));
    this.waterActive = inWater;
    void this.loop('ambience/rain_light_loop.wav', 'ambience', 2);
    if (!this.windStart) this.windStart = ctx.currentTime;
    const windIndex = Math.floor(Math.max(0, ctx.currentTime - this.windStart) / 9) % windLoops.length;
    for (const name of windLoops) void this.loop(name, 'ambience', name === windLoops[windIndex] ? .18 : 0);
    void this.loop('ambience/wet_road_loop.wav', 'ambience', .1);
    const waterSpeed = Math.max(0, Math.min(1, run.speed / Math.max(1, vehicle.maxSpeed)));
    const deepWater = heavyVehicle(vehicle.kind) || touchingWater.some(e => e.width >= 5.7 || e.length >= 20);
    const waterLevel = deepWater ? .10 + .12 * waterSpeed : .24 + .18 * waterSpeed;
    const activeWater = deepWater ? waterLoops.deep : waterLoops.shallow;
    const waterIndex = (this.waterVisit + Math.floor(Math.max(0, ctx.currentTime - this.waterStart) / 3.5)) % activeWater.length;
    if (inWater) for (const name of [...waterLoops.shallow, ...waterLoops.deep])
      void this.loop(name, 'sfx', name === activeWater[waterIndex] ? waterLevel : 0);
    for (const [name, node] of this.ambience) {
      const waterRoll = name.includes('water_roll');
      const waterTarget = inWater && name === activeWater[waterIndex] ? waterLevel : 0;
      const windTarget = name === windLoops[windIndex] ? .18 : 0;
      node.gain.gain.setTargetAtTime(waterRoll ? waterTarget : windLoops.includes(name) ? windTarget : name.includes('rain') ? 2 : .1,
        ctx.currentTime, waterRoll || windLoops.includes(name) ? .22 : .15);
      if (waterRoll) node.source.playbackRate.setTargetAtTime(.92 + .16 * waterSpeed, ctx.currentTime, .18);
    }
    this.requestedKind = vehicle.kind;
    if (this.vehicleId && this.vehicleId !== run.activeVehicleId) void this.play('vehicle/vehicle_switch.wav');
    this.vehicleId = run.activeVehicleId;
    if (!run.crash && run.speed > .15) {
      void this.engine(vehicle.kind);
      if (this.stem?.kind === vehicle.kind) {
        const s = Math.max(0, Math.min(1, (run.speed - vehicle.minSpeed) / Math.max(1, vehicle.maxSpeed - vehicle.minSpeed)));
        const weights = [Math.max(0, 1 - 2 * s), 1 - Math.abs(2 * s - 1), Math.max(0, 2 * s - 1)];
        const level = run.motion === 'coasting' ? .21 : .32;
        this.stem.gains.forEach((gain, i) => gain.gain.setTargetAtTime(i < 3 ? weights[i] * level :
          (lightVehicle(vehicle.kind) ? .09 : .13) * (run.motion === 'coasting' ? .6 : 1), ctx.currentTime, .085));
        this.stem.sources.forEach(source => source.playbackRate.setTargetAtTime((.86 + .38 * s) * (run.motion === 'coasting' ? .9 : 1), ctx.currentTime, .085));
      }
    } else this.stopEngine(.12);
    if (!run.crash && this.lastSpeed > 2 && run.speed < .1) void this.play('vehicle/stop.wav', 'stop', 1, .35);
    if (run.crash && !this.crashed) void this.play('vehicle/driver_fall.wav', 'driver-fall', .5, .32);
    this.crashed = !!run.crash;
    if (run.motion === 'coasting' && this.lastMotion !== 'coasting') void this.play('vehicle/coast.wav');
    this.lastMotion = run.motion; this.lastSpeed = run.speed;
    if (run.powers.jumpAt > this.lastJump) { this.lastJump = run.powers.jumpAt; void this.play('item/jump.wav'); }
    const airborne = run.activeSeconds > run.powers.jumpAt && run.activeSeconds < run.powers.jumpAt + itemBalance.jumpSeconds;
    if (this.airborne && !airborne) void this.play('item/landing.wav');
    this.airborne = airborne;
    if (run.powers.boostUntil > this.lastBoost) { this.lastBoost = run.powers.boostUntil; void this.play('item/nitro_activate.wav'); }
    if (run.powers.starUntil > this.lastStar) { this.lastStar = run.powers.starUntil; void this.play('item/star_activate.wav'); }
    const inWind = run.world.entities.some(e => e.kind === 'wind' && !e.consumed && Math.abs(e.distance - run.distance) < (e.length + vehicle.length) / 2 && Math.abs(e.x - run.x) < (e.width + vehicle.width) / 2);
    if (inWind && !this.inWind) void this.play('interaction-v2/wind_gust.wav', 'wind-gust', 1, .5);
    this.inWind = inWind;
    const nextPairs = new Set<string>(), nextHoles = new Set<string>();
    const trafficById = new Map(run.world.entities.filter(e => e.kind === 'traffic').map(e => [e.id, e]));
    const potholes = new Set(run.world.entities.filter(e => e.kind === 'pothole').map(e => e.id));
    for (const e of run.world.entities) {
      const prior = this.entityState.get(e.id);
      if (e.kind === 'traffic') {
        for (const otherId of e.trafficPairContacts ?? []) {
          const other = trafficById.get(otherId);
          if (!other) continue;
          const key = [e.id, otherId].sort().join('|');
          nextPairs.add(key);
          if (!this.trafficPairs.has(key) && Math.abs((e.distance + other.distance) / 2 - run.distance) < 65)
            void this.play(collisionCue(e.trafficKind, other.trafficKind), 'traffic-pair', .22, .55);
        }
        for (const holeId of e.trafficContacts ?? []) {
          if (!potholes.has(holeId)) continue;
          const key = `${e.id}|${holeId}`;
          nextHoles.add(key);
          if (!this.trafficHoles.has(key) && Math.abs(e.distance - run.distance) < 40)
            void this.play(potholeCue(e.trafficKind), 'traffic-pothole', .28, .42);
        }
      }
      if (e.kind === 'passenger' && prior && e.lastHit > prior.lastHit && e.lastHit >= 0 && e.passengerMotion?.crashRecovery)
        void this.play('interaction-v2/passenger_hit.wav', 'passenger-hit', .35, .75);
      if (e.kind === 'traffic' && e.cargoDropped && prior && !prior.cargoDropped && run.world.entities.some(c => c.cargoSourceId === e.id))
        void this.play('interaction-v2/cargo_release.wav', 'cargo-release', .5, .7);
      if (e.kind === 'cargo' && !prior && e.cargoSourceId && e.distance - run.distance < 95)
        void this.play(`interaction-v2/cargo_${e.cargoType === 'barrel' ? 'barrel' : 'crate'}_roll.wav`, 'cargo-roll', .3, .45);
      const ahead = e.distance - run.distance;
      if (!e.consumed && ahead > 0 && ahead < 18 && e.serviceRole === 'ambulance' && !this.near.has(e.id)) {
        this.near.add(e.id); void this.play('interaction-v2/ambulance_pass.wav', 'ambulance-pass', 2, .6);
      }
      this.entityState.set(e.id, { lastHit: e.lastHit, cargoDropped: !!e.cargoDropped, consumed: e.consumed });
    }
    this.trafficPairs = nextPairs; this.trafficHoles = nextHoles;
    if (++this.sweepTick % 300 === 0) {
      const ids = new Set(run.world.entities.map(e => e.id));
      for (const id of this.entityState.keys()) if (!ids.has(id)) this.entityState.delete(id);
      for (const id of this.near) if (!ids.has(id)) this.near.delete(id);
    }
  }

  dispose(): void { this.reset(); void this.context?.close(); }
}
