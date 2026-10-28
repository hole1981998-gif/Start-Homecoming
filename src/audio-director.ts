import type { Run } from './survival';
import type { VehicleKind } from './vehicles';
import { warningDistance } from './world';
import { activeVehicle } from './survival';
import { itemBalance } from './config';

const files = import.meta.glob([
  '../project-reference/sfx/procedural-auditions-2026-10-28/ambience/*.wav',
  '../project-reference/sfx/procedural-auditions-2026-10-28/engine-v2/*_loop.wav',
  '../project-reference/sfx/procedural-auditions-2026-10-28/interaction-v2/*.wav',
  '../project-reference/sfx/procedural-auditions-2026-10-28/item/*.wav',
  '../project-reference/sfx/procedural-auditions-2026-10-28/road/*.wav',
  '../project-reference/sfx/procedural-auditions-2026-10-28/vehicle/*.wav',
  '../project-reference/sfx/procedural-auditions-2026-10-28/result/*.wav',
  '../project-reference/sfx/procedural-auditions-2026-10-28/pickup_01.wav',
  '../project-reference/sfx/procedural-auditions-2026-10-28/kick_01.wav',
], { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const root = '../project-reference/sfx/procedural-auditions-2026-10-28/';
const url = (name: string): string | undefined => files[root + name];

type Bus = 'sfx' | 'ambience';
type Stem = { sources: AudioBufferSourceNode[]; gains: GainNode[]; kind: VehicleKind };

/** Presentation-only sound: every cue follows simulation state and never feeds back into it. */
export class AudioDirector {
  private context?: AudioContext;
  private buses?: Record<Bus, GainNode>;
  private buffers = new Map<string, Promise<AudioBuffer | null>>();
  private stem?: Stem;
  private ambience = new Map<string, { source: AudioBufferSourceNode; gain: GainNode }>();
  private warned = new Set<string>();
  private near = new Set<string>();
  private entityState = new Map<string, { lastHit: number; cargoDropped: boolean; consumed: boolean }>();
  private cooldown = new Map<string, number>();
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
  private vehicleId = '';
  private requestedKind?: VehicleKind;
  private generation = 0;
  private sweepTick = 0;

  unlock(): void {
    if (typeof AudioContext === 'undefined') return;
    if (!this.context) {
      this.context = new AudioContext();
      const sfx = this.context.createGain(), ambience = this.context.createGain();
      sfx.gain.value = .65; ambience.gain.value = .22;
      sfx.connect(this.context.destination); ambience.connect(this.context.destination);
      this.buses = { sfx, ambience };
    }
    void this.context.resume();
  }

  private async buffer(name: string): Promise<AudioBuffer | null> {
    const ctx = this.context, path = url(name);
    if (!ctx || !path) return null;
    if (!this.buffers.has(name)) this.buffers.set(name, fetch(path).then(r => r.ok ? r.arrayBuffer() : Promise.reject(new Error('audio fetch')))
      .then(data => ctx.decodeAudioData(data)).catch(() => null));
    return this.buffers.get(name)!;
  }

  private async play(name: string, key = name, gap = .18, volume = 1): Promise<void> {
    const ctx = this.context, bus = this.buses?.sfx;
    if (!ctx || !bus || ctx.state !== 'running') return;
    const now = ctx.currentTime;
    if (now - (this.cooldown.get(key) ?? -100) < gap) return;
    this.cooldown.set(key, now);
    const generation = this.generation;
    const buffer = await this.buffer(name);
    if (!buffer || generation !== this.generation || !this.context || this.context.state !== 'running') return;
    const source = ctx.createBufferSource(), gain = ctx.createGain();
    source.buffer = buffer; gain.gain.value = volume;
    source.connect(gain).connect(bus); source.start();
    this.oneShots.add(source);
    source.onended = () => { this.oneShots.delete(source); source.disconnect(); gain.disconnect(); };
  }

  private async loop(name: string, bus: Bus, volume: number): Promise<void> {
    if (this.ambience.has(name) || !this.context || !this.buses) return;
    const ctx = this.context, generation = this.generation, buffer = await this.buffer(name);
    if (!buffer || generation !== this.generation || this.ambience.has(name) || ctx.state !== 'running') return;
    const source = ctx.createBufferSource(), gain = ctx.createGain();
    source.buffer = buffer; source.loop = true; gain.gain.value = 0;
    source.connect(gain).connect(this.buses[bus]); source.start();
    this.ambience.set(name, { source, gain });
    gain.gain.setTargetAtTime(volume, ctx.currentTime, .15);
  }

  private async engine(kind: VehicleKind): Promise<void> {
    if (!this.context || !this.buses || this.stem?.kind === kind) return;
    const ctx = this.context, generation = this.generation;
    const names = ['idle', 'cruise', 'fast'].map(s => `engine-v2/${kind}_${s}_loop.wav`);
    const buffers = await Promise.all(names.map(n => this.buffer(n)));
    if (buffers.some(b => !b) || generation !== this.generation || this.requestedKind !== kind || this.stem?.kind === kind || ctx.state !== 'running') return;
    this.stopEngine();
    const sources: AudioBufferSourceNode[] = [], gains: GainNode[] = [];
    for (const buffer of buffers) {
      const source = ctx.createBufferSource(), gain = ctx.createGain();
      source.buffer = buffer; source.loop = true; gain.gain.value = 0;
      source.connect(gain).connect(this.buses.sfx);
      sources.push(source); gains.push(gain);
    }
    const start = ctx.currentTime + .01;
    for (const source of sources) source.start(start);
    this.stem = { kind, sources, gains };
  }

  private stopEngine(): void {
    for (const source of this.stem?.sources ?? []) { try { source.stop(); } catch { /* already stopped */ } source.disconnect(); }
    for (const gain of this.stem?.gains ?? []) gain.disconnect();
    this.stem = undefined;
  }

  reset(): void {
    this.generation++;
    for (const source of this.oneShots) { try { source.stop(); } catch { /* already stopped */ } }
    this.oneShots.clear();
    this.stopEngine();
    for (const { source, gain } of this.ambience.values()) { try { source.stop(); } catch { /* already stopped */ } source.disconnect(); gain.disconnect(); }
    this.ambience.clear(); this.warned.clear(); this.near.clear(); this.entityState.clear(); this.cooldown.clear(); this.sweepTick = 0;
    this.lastSequence = -1; this.lastJump = -100; this.lastBoost = 0; this.lastStar = 0; this.lastMotion = ''; this.lastSpeed = 0; this.ended = false; this.airborne = false; this.crashed = false; this.inWind = false; this.vehicleId = ''; this.requestedKind = undefined;
  }

  pause(): void {
    this.generation++;
    this.requestedKind = undefined;
    this.stopEngine();
    for (const source of this.oneShots) { try { source.stop(); } catch { /* already stopped */ } }
    for (const { gain } of this.ambience.values()) gain.gain.setTargetAtTime(0, this.context?.currentTime ?? 0, .08);
  }

  async update(run: Run, input: { accelerate: boolean; brake: boolean }): Promise<void> {
    const ctx = this.context;
    if (!ctx) return;
    if (run.runId !== this.runId) { this.reset(); this.runId = run.runId; }
    if (run.phase !== 'running') {
      this.stopEngine();
      for (const { gain } of this.ambience.values()) gain.gain.setTargetAtTime(0, ctx.currentTime, .1);
      if (run.phase === 'ended' && !this.ended) {
        this.ended = true;
        const reason = run.result?.reason;
        if (reason) void this.play(`result/result_${reason}.wav`, 'result', 0, .8);
      }
      return;
    }
    void this.loop('ambience/rain_light_loop.wav', 'ambience', .65);
    void this.loop('ambience/wind_loop.wav', 'ambience', .24);
    void this.loop('ambience/wet_road_loop.wav', 'ambience', .13);
    for (const [name, node] of this.ambience) node.gain.gain.setTargetAtTime(name.includes('rain') ? .65 : name.includes('wind') ? .24 : .13, ctx.currentTime, .15);
    const vehicle = activeVehicle(run);
    this.requestedKind = vehicle.kind;
    if (this.vehicleId && this.vehicleId !== run.activeVehicleId) void this.play('vehicle/vehicle_switch.wav');
    this.vehicleId = run.activeVehicleId;
    if (run.motion === 'powered' && !run.crash) {
      void this.engine(vehicle.kind);
      if (this.stem?.kind === vehicle.kind) {
        const s = Math.max(0, Math.min(1, (run.speed - vehicle.minSpeed) / Math.max(1, vehicle.maxSpeed - vehicle.minSpeed)));
        const weights = [Math.max(0, 1 - 2 * s), 1 - Math.abs(2 * s - 1), Math.max(0, 2 * s - 1)];
        this.stem.gains.forEach((gain, i) => gain.gain.setTargetAtTime(weights[i] * .32, ctx.currentTime, .085));
        this.stem.sources.forEach(source => source.playbackRate.setTargetAtTime(.86 + .38 * s, ctx.currentTime, .085));
      }
    } else this.stopEngine();
    if (input.brake && this.lastSpeed - run.speed > .1) void this.play('vehicle/brake.wav', 'brake', 2, .33);
    if (input.accelerate && run.speed - this.lastSpeed > .1) void this.play('vehicle/accelerate.wav', 'accelerate', 3, .25);
    if (this.lastSpeed > 2 && run.speed < .1) void this.play('vehicle/stop.wav', 'stop', 1, .35);
    if (Math.abs(run.lateralVelocity) > 3 && run.speed > 8) void this.play('vehicle/skid.wav', 'skid', 2.5, .3);
    if (run.crash && !this.crashed) void this.play('vehicle/driver_fall.wav', 'driver-fall', .5, .7);
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
    if (run.eventSequence !== this.lastSequence) {
      this.lastSequence = run.eventSequence;
      const kind = run.feedbackKind;
      const hitEntity = run.world.entities.find(e => e.consumed && !this.entityState.get(e.id)?.consumed && e.kind === kind);
      const cue: Record<string, string> = { water: 'road/water_splash.wav', pothole: 'road/pothole.wav', traffic: 'interaction-v2/vehicle_collision.wav', cargo: hitEntity?.cargoType === 'crate' ? 'interaction-v2/cargo_crate_hit.wav' : 'interaction-v2/cargo_barrel_hit.wav', fuel: 'item/fuel_pickup.wav', repair: 'item/repair_pickup.wav', passenger: run.feedback.startsWith('Gọi Grab') ? 'item/grab_call.wav' : 'pickup_01.wav', drop: 'kick_01.wav', coast: 'vehicle/coast.wav', police: run.feedback.includes('Chuối') ? 'interaction-v2/banana_use.wav' : 'interaction-v2/police_capture.wav', militia: run.feedback.includes('Chuối') ? 'interaction-v2/banana_use.wav' : 'interaction-v2/militia_warning.wav', jam: hitEntity?.crossingRole === 'vendor' ? 'interaction-v2/vendor_hit.wav' : 'interaction-v2/jam.wav', accident: 'interaction-v2/accident.wav', train: 'interaction-v2/train_pass.wav', broken: 'interaction-v2/broken_car.wav' };
      if (kind && cue[kind]) void this.play(cue[kind], `event-${kind}`, .2);
    }
    for (const e of run.world.entities) {
      const prior = this.entityState.get(e.id);
      if (e.kind === 'passenger' && prior && e.lastHit > prior.lastHit && e.lastHit >= 0 && e.passengerMotion?.crashRecovery)
        void this.play('interaction-v2/passenger_hit.wav', 'passenger-hit', .35, .75);
      if (e.kind === 'traffic' && e.cargoDropped && prior && !prior.cargoDropped && run.world.entities.some(c => c.cargoSourceId === e.id))
        void this.play('interaction-v2/cargo_release.wav', 'cargo-release', .5, .7);
      if (e.kind === 'cargo' && !prior && e.cargoSourceId && e.distance - run.distance < 95)
        void this.play(`interaction-v2/cargo_${e.cargoType === 'barrel' ? 'barrel' : 'crate'}_roll.wav`, 'cargo-roll', .3, .45);
      const ahead = e.distance - run.distance;
      if (!e.consumed && ahead > 0 && ahead < 25 && e.crossingRole === 'vendor' && !this.near.has(e.id)) {
        this.near.add(e.id); void this.play('interaction-v2/vendor_near.wav', 'vendor-near', 2, .6);
      }
      if (!e.consumed && ahead > 0 && ahead < 18 && e.serviceRole === 'ambulance' && !this.near.has(e.id)) {
        this.near.add(e.id); void this.play('interaction-v2/ambulance_pass.wav', 'ambulance-pass', 2, .6);
      }
      this.entityState.set(e.id, { lastHit: e.lastHit, cargoDropped: !!e.cargoDropped, consumed: e.consumed });
      if (e.consumed || e.distance <= run.distance || this.warned.has(e.id)) continue;
      if (!['train', 'police', 'militia', 'cargo', 'jam'].includes(e.kind)) continue;
      if (e.distance - run.distance > warningDistance(run.speed, e, vehicle.length)) continue;
      this.warned.add(e.id);
      const cues: Record<string, string> = { train: 'interaction-v2/train_approach.wav', police: 'interaction-v2/police_warning.wav', militia: 'interaction-v2/militia_warning.wav', cargo: 'interaction-v2/cargo_release.wav', jam: 'interaction-v2/jam.wav' };
      void this.play(cues[e.kind], `warning-${e.kind}`, .2, .7);
    }
    if (++this.sweepTick % 300 === 0) {
      const ids = new Set(run.world.entities.map(e => e.id));
      for (const id of this.entityState.keys()) if (!ids.has(id)) this.entityState.delete(id);
      for (const id of this.warned) if (!ids.has(id)) this.warned.delete(id);
      for (const id of this.near) if (!ids.has(id)) this.near.delete(id);
    }
  }

  dispose(): void { this.reset(); void this.context?.close(); }
}
