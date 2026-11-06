import { itemBalance } from './config';
import type { FeedbackKind } from './feedback';
import type { Run } from './survival';
import type { Entity, TrafficKind } from './world';

/** Presentation data only. The simulation assigns each event a monotonic id. */
export interface AudioEvent { id: number; kind: FeedbackKind; entityId?: string; variant?: string }
export type AudioCategory = 'sfx' | 'ambience' | 'music';
export type AudioCue =
  | 'ambulance_hit' | 'ambulance_pass' | 'banana_use' | 'barrier_hit' | 'broken_car'
  | 'cargo_barrel_hit' | 'cargo_crate_hit' | 'cargo_release' | 'collision_heavy' | 'collision_light'
  | 'collision_medium' | 'driver_fall' | 'fuel_pickup' | 'grab_call' | 'jump_land'
  | 'jump_launch' | 'nitro_activate' | 'passenger_drop' | 'passenger_pickup'
  | 'pedestrian_hit' | 'police_capture' | 'pothole_heavy' | 'pothole_light'
  | 'repair_pickup' | 'result_failure' | 'result_fuel' | 'result_police'
  | 'result_success' | 'result_train' | 'star_activate' | 'train_hit'
  | 'vehicle_coast' | 'vehicle_stop' | 'vehicle_switch' | 'vendor_cart_hit'
  | 'water_entry_heavy' | 'water_entry_skim' | 'water_entry_splash'
  | 'water_entry_wash' | 'water_exit_spray' | 'wind_gust';

const root = `${import.meta.env.BASE_URL}audio/`;
const url = (name: string) => `${root}${name}.mp3`;
const clamp = (value: number) => Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
const heavy = (kind?: string) => ['bus', 'truck', 'container'].includes(kind ?? '');
const bike = (kind?: string) => ['motorbike', 'motorcycle'].includes(kind ?? '');

export function cueForAudioEvent(event: AudioEvent): AudioCue | null {
  switch (event.kind) {
    case 'water': return event.variant === 'heavy' ? 'water_entry_heavy' :
      event.variant === 'wide' ? 'water_entry_wash' : 'water_entry_splash';
    case 'pothole': return event.variant === 'heavy' ? 'pothole_heavy' : 'pothole_light';
    case 'traffic': return event.variant === 'ambulance' ? 'ambulance_hit' : event.variant === 'barrier' ? 'barrier_hit' :
      heavy(event.variant) ? 'collision_heavy' : bike(event.variant) ? 'collision_light' : 'collision_medium';
    case 'cargo': return event.variant === 'barrel' ? 'cargo_barrel_hit' : 'cargo_crate_hit';
    case 'train': return 'train_hit';
    case 'accident': return 'collision_heavy';
    case 'jam': return event.variant === 'vendor' ? 'vendor_cart_hit' : 'barrier_hit';
    case 'police': case 'militia': return 'police_capture';
    case 'broken': return 'broken_car';
    case 'fuel': return 'fuel_pickup';
    case 'repair': return 'repair_pickup';
    case 'passenger': return 'passenger_pickup';
    case 'drop': return 'passenger_drop';
    case 'coast': return 'vehicle_coast';
    default: return null;
  }
}

export function unseenAudioEvents(events: readonly AudioEvent[], lastId: number): AudioEvent[] {
  return events.filter(event => event.id > lastId).sort((a, b) => a.id - b.id);
}

type LoopKey = 'rain' | 'wind' | 'tires' | 'water' | 'cargo' | 'player' | 'traffic' | 'train' | 'footsteps';
interface Loop { audio: HTMLAudioElement; file: string; category: AudioCategory }
interface Snapshot {
  runId: string; activeVehicleId: string; boostUntil: number; starUntil: number; jumpAt: number;
  activeSeconds: number; resultReason: Run['result'];
  crashed: boolean;
}

/** Sample playback is deliberately isolated from simulation timing and RNG. */
export class GameAudio {
  private volumes: Record<AudioCategory, number> = { sfx: .65, ambience: .4, music: .35 };
  private loops = new Map<LoopKey, Loop>();
  private voices = new Set<HTMLAudioElement>();
  private lastPlayed = new Map<AudioCue, number>();
  private lastEventId = 0;
  private seenCargo = new Set<string>();
  private seenWrecks = new Set<string>();
  private seenApproaches = new Set<string>();
  private snapshot: Snapshot | null = null;
  private unlocked = false;
  private suspended = true;
  private mediaSupported = true;

  constructor() {
    // jsdom has media elements but no playback implementation.
    if (typeof navigator !== 'undefined' && /jsdom/i.test(navigator.userAgent)) this.mediaSupported = false;
  }

  getVolume(category: AudioCategory): number { return this.volumes[category]; }
  setVolume(category: AudioCategory, value: number): void {
    this.volumes[category] = clamp(value);
    for (const loop of this.loops.values()) if (loop.category === category)
      loop.audio.volume = clamp(this.volumes[category] * Number(loop.audio.dataset.gain ?? '1'));
    if (category === 'sfx') for (const voice of this.voices)
      voice.volume = clamp(this.volumes.sfx * Number(voice.dataset.gain ?? '1'));
  }

  /** Called from a user gesture before the first run or when resuming. */
  unlock(): void { this.unlocked = true; this.suspended = false; }

  pause(): void {
    this.suspended = true;
    for (const loop of this.loops.values()) loop.audio.pause();
  }

  reset(): void {
    this.pause();
    for (const loop of this.loops.values()) { loop.audio.currentTime = 0; loop.audio.src = ''; }
    this.loops.clear();
    for (const voice of this.voices) { voice.pause(); voice.src = ''; }
    this.voices.clear(); this.lastPlayed.clear(); this.lastEventId = 0; this.snapshot = null;
    this.seenCargo.clear(); this.seenWrecks.clear(); this.seenApproaches.clear();
  }

  play(cue: AudioCue, gain = 1): void {
    if (!this.unlocked || !this.mediaSupported || this.volumes.sfx <= 0) return;
    const now = performance.now();
    if (now - (this.lastPlayed.get(cue) ?? -Infinity) < (cue.startsWith('collision_') ? 90 : 130)) return;
    this.lastPlayed.set(cue, now);
    if (this.voices.size >= 8) {
      const oldest = this.voices.values().next().value as HTMLAudioElement | undefined;
      if (oldest) { oldest.pause(); oldest.src = ''; this.voices.delete(oldest); }
    }
    const voice = new Audio(url(cue));
    voice.preload = 'auto'; voice.dataset.gain = String(gain); voice.volume = clamp(this.volumes.sfx * gain);
    voice.addEventListener('ended', () => this.voices.delete(voice), { once: true });
    voice.addEventListener('error', () => this.voices.delete(voice), { once: true });
    this.voices.add(voice);
    this.start(voice, () => this.voices.delete(voice));
  }

  /** Consume each simulation event once and update quiet, distance-based loops. */
  update(run: Run): void {
    if (this.snapshot?.runId !== run.runId) {
      const suspended = this.suspended;
      this.reset(); this.suspended = suspended;
      this.snapshot = this.takeSnapshot(run); this.lastEventId = run.eventSequence;
      for (const entity of run.world.entities) {
        if (entity.kind === 'cargo') this.seenCargo.add(entity.id);
        if (entity.kind === 'traffic' && entity.wrecked) this.seenWrecks.add(entity.id);
        if ((entity.kind === 'wind' || entity.serviceRole === 'ambulance') &&
          Math.abs(entity.distance - run.distance) < 45) this.seenApproaches.add(entity.id);
      }
    }
    if (this.unlocked) {
      for (const event of unseenAudioEvents(run.audioEvents, this.lastEventId)) {
        const cue = cueForAudioEvent(event);
        if (cue) this.play(cue);
        this.lastEventId = event.id;
      }
      const prior = this.snapshot!;
      if (run.powers.boostUntil > prior.boostUntil) this.play('nitro_activate');
      if (run.powers.starUntil > prior.starUntil) this.play('star_activate');
      if (run.powers.jumpAt > prior.jumpAt) this.play('jump_launch');
      else if (prior.jumpAt > -99 && prior.activeSeconds < prior.jumpAt + itemBalance.jumpSeconds &&
        run.activeSeconds >= prior.jumpAt + itemBalance.jumpSeconds) this.play('jump_land');
      if (run.activeVehicleId !== prior.activeVehicleId) this.play('vehicle_switch');
      if (run.crash && !prior.crashed) this.play('driver_fall', .45);
      this.worldEvents(run);
      if (!prior.resultReason && run.result) this.play(run.result.reason === 'train' ? 'result_train' :
        run.result.reason === 'police' ? 'result_police' : run.result.reason === 'fuel' ? 'result_fuel' :
          run.result.reason === 'secret' ? 'result_success' : 'result_failure', .7);
    }
    this.snapshot = this.takeSnapshot(run);
    if (!this.unlocked || this.suspended || run.phase !== 'running') { this.pauseLoops(); return; }
    this.updateLoops(run);
  }

  private takeSnapshot(run: Run): Snapshot {
    return { runId: run.runId, activeVehicleId: run.activeVehicleId,
      boostUntil: run.powers.boostUntil, starUntil: run.powers.starUntil, jumpAt: run.powers.jumpAt,
      activeSeconds: run.activeSeconds, resultReason: run.result, crashed: !!run.crash };
  }

  private worldEvents(run: Run): void {
    if (run.phase !== 'running') return;
    const active = new Set(run.world.entities.map(entity => entity.id));
    for (const entity of run.world.entities) {
      const distance = Math.abs(entity.distance - run.distance);
      if (entity.kind === 'cargo' && !entity.consumed && !this.seenCargo.has(entity.id)) {
        this.seenCargo.add(entity.id);
        if (distance < 140) this.play('cargo_release', .5);
      }
      if (entity.kind === 'traffic' && entity.wrecked && !this.seenWrecks.has(entity.id)) {
        this.seenWrecks.add(entity.id);
        if (!entity.wreckedByPlayer && distance < 70)
          this.play(heavy(entity.trafficKind) ? 'collision_heavy' : bike(entity.trafficKind) ?
            'collision_light' : 'collision_medium', .35);
      }
      if (distance < 45 && !entity.consumed && !this.seenApproaches.has(entity.id)) {
        if (entity.serviceRole === 'ambulance') { this.seenApproaches.add(entity.id); this.play('ambulance_pass', .5); }
        else if (entity.kind === 'wind') { this.seenApproaches.add(entity.id); this.play('wind_gust', .4); }
      }
    }
    for (const seen of [this.seenCargo, this.seenWrecks, this.seenApproaches])
      for (const id of seen) if (!active.has(id)) seen.delete(id);
  }

  private pauseLoops(): void { for (const loop of this.loops.values()) loop.audio.pause(); }

  private start(audio: HTMLAudioElement, onFailure: () => void): void {
    try {
      const started = audio.play();
      if (!started || typeof started.catch !== 'function') {
        this.mediaSupported = false;
        onFailure();
      } else void started.catch(onFailure);
    } catch { onFailure(); }
  }

  private loop(key: LoopKey, file: string, category: AudioCategory, gain: number, rate = 1): void {
    const volume = clamp(this.volumes[category] * gain);
    if (!this.mediaSupported || volume <= .002) { this.loops.get(key)?.audio.pause(); return; }
    let loop = this.loops.get(key);
    if (!loop || loop.file !== file) {
      if (loop) { loop.audio.pause(); loop.audio.src = ''; }
      const audio = new Audio(url(file)); audio.loop = true; audio.preload = 'auto';
      loop = { audio, file, category }; this.loops.set(key, loop);
    }
    loop.audio.dataset.gain = String(gain);
    loop.audio.volume = volume;
    loop.audio.playbackRate = rate;
    if (loop.audio.paused) this.start(loop.audio, () => { /* Browser may require a fresh gesture. */ });
  }

  private updateLoops(run: Run): void {
    const speed = Math.max(0, run.speed);
    this.loop('rain', 'rain_road_loop', 'ambience', .23);
    this.loop('wind', 'wind_road_loop', 'ambience', .11);
    this.loop('tires', 'wet_tire_loop', 'ambience', .04 + Math.min(.13, speed / 120));
    const water = run.world.entities.find(entity => entity.kind === 'water' && entity.touching && !entity.consumed);
    if (water) this.loop('water', water.width > 7 ? 'water_roll_deep_loop' :
      water.width > 4 ? 'water_roll_loop' : 'water_roll_shallow_loop', 'sfx', .09);
    else this.loops.get('water')?.audio.pause();
    const player = run.vehicleInstances.find(vehicle => vehicle.id === run.activeVehicleId)?.kind;
    this.loop('player', engineFile(player), 'sfx', .12 + Math.min(.11, speed / 150), Math.min(1.3, .83 + speed / 95));
    const nearest = (kinds: readonly Entity['kind'][], radius: number, predicate: (entity: Entity) => boolean) =>
      run.world.entities.filter(entity => kinds.includes(entity.kind) && !entity.consumed &&
        Math.abs(entity.distance - run.distance) < radius && predicate(entity))
        .sort((a, b) => Math.abs(a.distance - run.distance) - Math.abs(b.distance - run.distance))[0];
    const traffic = nearest(['traffic'], 48, entity => !entity.wrecked && entity.trafficMotion !== 'stopped');
    if (traffic) this.loop('traffic', engineFile(traffic.trafficKind), 'sfx',
      Math.max(.015, .15 * (1 - Math.abs(traffic.distance - run.distance) / 48)));
    else this.loops.get('traffic')?.audio.pause();
    const cargo = nearest(['cargo'], 35, () => true);
    if (cargo) this.loop('cargo', cargo.cargoType === 'barrel' ? 'cargo_barrel_roll' : 'cargo_crate_roll',
      'sfx', .1 * (1 - Math.abs(cargo.distance - run.distance) / 35));
    else this.loops.get('cargo')?.audio.pause();
    const train = nearest(['train'], 85, entity => !entity.motionWaiting && !!entity.crossMotion);
    if (train) this.loop('train', 'train_roll_past', 'sfx',
      Math.max(.025, .28 * (1 - Math.abs(train.distance - run.distance) / 85)));
    else this.loops.get('train')?.audio.pause();
    const walker = nearest(['passenger', 'police', 'militia'], 24, entity => !entity.stunned &&
      (entity.kind === 'passenger' ? !!entity.passengerMotion && !entity.passengerMotion.idle : !!entity.crossMotion));
    if (walker) this.loop('footsteps', 'npc_footsteps_wet', 'sfx',
      Math.max(.01, .08 * (1 - Math.abs(walker.distance - run.distance) / 24)));
    else this.loops.get('footsteps')?.audio.pause();
  }
}

function engineFile(kind?: TrafficKind): string {
  return heavy(kind) ? 'engine_heavy_texture_loop' : bike(kind) ? 'engine_bike_texture_loop' : 'engine_car_texture_loop';
}
