import * as CANNON from 'cannon-es';
import { vehicles, type VehicleKind } from './vehicles';

export type SandboxScenario = 'mixed' | 'traffic' | 'npc' | 'cargo' | 'chain';
export type SandboxKind = 'player' | 'traffic' | 'npc' | 'cargo';
export interface SandboxActor {
  id: string; kind: SandboxKind; body: CANNON.Body; width: number; length: number;
  hp: number; maxHp: number; vehicle?: VehicleKind; forward: number; disabled: boolean;
  stunnedUntil: number; color: number;
}
export interface SandboxInput { accelerate: boolean; brake: boolean; left: boolean; right: boolean }
export interface SandboxEvent { pair: string; kinds: string; severity: number; at: number }
const fixedStep = 1 / 60;
const laneHalfWidth = 4.8;
const masses: Record<VehicleKind, number> = { motorcycle: 180, motorbike: 260, car4: 1050,
  car7: 1450, tricycle: 600, bus: 5200, truck: 6100, container: 9000 };
const colors: Record<SandboxKind, number> = { player: 0xe1c276, traffic: 0xc56d60,
  npc: 0x8fd6ad, cargo: 0x9da8b7 };
const clamp = (v: number, low: number, high: number) => Math.max(low, Math.min(high, v));
const pairKey = (a: SandboxActor, b: SandboxActor) => [a.id, b.id].sort().join('|');

/** Isolated Cannon world: the engine resolves contacts; arcade rules drive actors and score impact. */
export class CollisionSandbox {
  readonly world = new CANNON.World({ gravity: new CANNON.Vec3(0, -9.82, 0) });
  readonly actors: SandboxActor[] = [];
  readonly events: SandboxEvent[] = [];
  readonly scenario: SandboxScenario;
  readonly seed: number;
  time = 0;
  ticks = 0;
  totalImpacts = 0;
  private contacts = new Set<string>();
  private lastImpact = new Map<string, number>();
  private cargoReleased = false;
  private actorByBody = new Map<number, SandboxActor>();

  constructor(scenario: SandboxScenario = 'mixed', seed = 17) {
    this.scenario = scenario; this.seed = seed;
    this.world.allowSleep = false;
    (this.world.solver as CANNON.GSSolver).iterations = 12;
    // Horizontal grip is the arcade motor; ground friction must not cancel its impulses.
    this.world.defaultContactMaterial.friction = 0;
    this.world.defaultContactMaterial.restitution = .18;
    const ground = new CANNON.Body({ mass: 0, shape: new CANNON.Plane() });
    ground.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    this.world.addBody(ground);
    for (const side of [-1, 1]) {
      const wall = new CANNON.Body({ mass: 0, position: new CANNON.Vec3(side * (laneHalfWidth + .28), 1, 80),
        shape: new CANNON.Box(new CANNON.Vec3(.28, 1, 240)) });
      this.world.addBody(wall);
    }
    this.vehicle('player', 'car4', 0, 0, 10, 'player');
    if (scenario === 'traffic' || scenario === 'chain' || scenario === 'mixed') {
      this.vehicle('car-a', 'car4', 0, 24, 3);
      if (scenario !== 'traffic') this.vehicle('car-b', 'tricycle', 0, 34, 2);
    }
    if (scenario === 'npc' || scenario === 'mixed') {
      this.npc('walker-a', -4, 27);
      this.npc('walker-b', 4, 40);
    }
    if (scenario === 'cargo' || scenario === 'mixed') this.vehicle('source-truck', 'truck', 3.05, 32, 5);
  }

  private add(actor: SandboxActor): SandboxActor {
    this.actors.push(actor); this.actorByBody.set(actor.body.id, actor);
    this.world.addBody(actor.body); return actor;
  }
  private vehicle(id: string, type: VehicleKind, x: number, z: number, forward: number,
    kind: 'player' | 'traffic' = 'traffic'): SandboxActor {
    const spec = vehicles[type], mass = masses[type];
    const body = new CANNON.Body({ mass, position: new CANNON.Vec3(x, .55, z),
      shape: new CANNON.Box(new CANNON.Vec3(spec.width / 2, .52, spec.length / 2)) });
    body.fixedRotation = true; body.updateMassProperties();
    body.linearDamping = .18;
    body.velocity.z = forward;
    return this.add({ id, kind, body, width: spec.width, length: spec.length,
      hp: spec.durabilityCapacity, maxHp: spec.durabilityCapacity,
      vehicle: type, forward, disabled: false, stunnedUntil: 0, color: colors[kind] });
  }
  private npc(id: string, x: number, z: number): SandboxActor {
    const body = new CANNON.Body({ mass: 72, position: new CANNON.Vec3(x, .56, z),
      shape: new CANNON.Sphere(.48) });
    body.linearDamping = .38; body.angularDamping = .45;
    return this.add({ id, kind: 'npc', body, width: .96, length: .96,
      hp: 1, maxHp: 1, forward: 0, disabled: false, stunnedUntil: 0, color: colors.npc });
  }
  private releaseCargo(): void {
    if (this.cargoReleased) return;
    const source = this.actors.find(a => a.id === 'source-truck');
    if (!source || source.disabled) return;
    this.cargoReleased = true;
    const side = (Math.imul(this.seed, 1664525) & 1) ? -1 : 1;
    for (let i = 0; i < 2; i++) {
      const body = new CANNON.Body({ mass: i ? 65 : 110,
        position: new CANNON.Vec3(source.body.position.x + side * .25 * i, .7,
          source.body.position.z - source.length / 2 - 1.4 - i * 2),
        shape: i ? new CANNON.Sphere(.6) : new CANNON.Box(new CANNON.Vec3(.58, .58, .58)) });
      body.velocity.set(side * (.7 + i * .5), 0, source.body.velocity.z - 3 - i);
      body.angularVelocity.set(.6, side * 1.4, 1.8);
      body.linearDamping = .08; body.angularDamping = .12;
      this.add({ id: `cargo-${i}`, kind: 'cargo', body, width: 1.2, length: 1.2,
        hp: 1, maxHp: 1, forward: 0, disabled: false, stunnedUntil: 0, color: colors.cargo });
    }
  }
  get player(): SandboxActor { return this.actors[0]; }
  step(input: SandboxInput): void {
    const dt = fixedStep;
    this.time += dt; this.ticks++;
    if (this.time >= 1.3 && (this.scenario === 'cargo' || this.scenario === 'mixed')) this.releaseCargo();
    const prior = new Map(this.actors.map(a => [a.id, a.body.velocity.clone()]));
    for (const actor of this.actors) {
      if (actor.kind === 'cargo' || actor.disabled) continue;
      if (actor.kind === 'npc') {
        if (actor.stunnedUntil > this.time) continue;
        const direction = actor.id === 'walker-a' ? 1 : -1;
        this.motor(actor.body, direction * 1.8, 0, 2.2, dt);
        continue;
      }
      if (actor.kind === 'player') {
        const forward = input.brake ? 3 : input.accelerate ? 17 : 10;
        const lateral = (Number(input.right) - Number(input.left)) * 4.5;
        this.motor(actor.body, lateral, forward, 12, dt);
      } else this.motor(actor.body, 0, actor.forward, 2.5, dt);
    }
    this.world.step(dt);
    const touching = new Set<string>();
    const processed = new Set<string>();
    for (const contact of this.world.contacts) {
      const a = this.actorByBody.get(contact.bi.id), b = this.actorByBody.get(contact.bj.id);
      if (!a || !b) continue;
      const key = pairKey(a, b);
      touching.add(key);
      if (processed.has(key) || this.contacts.has(key) || this.time - (this.lastImpact.get(key) ?? -Infinity) < .75) continue;
      processed.add(key);
      const av = prior.get(a.id)!, bv = prior.get(b.id)!;
      const relative = Math.hypot(av.x - bv.x, av.z - bv.z);
      if (relative < 1.5) continue;
      const reducedMass = a.body.mass * b.body.mass / (a.body.mass + b.body.mass);
      const severity = clamp((relative - 1.5) * Math.sqrt(reducedMass / 200), 1, 32);
      this.lastImpact.set(key, this.time);
      this.impact(a, b, severity, key);
    }
    this.contacts = touching;
    if (this.events.length > 12) this.events.splice(0, this.events.length - 12);
  }
  private motor(body: CANNON.Body, lateral: number, forward: number, acceleration: number, dt: number): void {
    // Arcade target velocity; impulses are capped, then the engine owns collision response.
    const vx = clamp(lateral - body.velocity.x, -acceleration * dt, acceleration * dt);
    const vz = clamp(forward - body.velocity.z, -acceleration * dt, acceleration * dt);
    body.applyImpulse(new CANNON.Vec3(vx * body.mass, 0, vz * body.mass));
  }
  private impact(a: SandboxActor, b: SandboxActor, severity: number, pair: string): void {
    this.totalImpacts++;
    this.events.push({ pair, kinds: `${a.kind}–${b.kind}`, severity, at: this.time });
    for (const actor of [a, b]) {
      if (actor.kind === 'cargo') continue;
      if (actor.kind === 'npc') { actor.stunnedUntil = this.time + 2; continue; }
      actor.hp = Math.max(0, actor.hp - Math.max(2, Math.round(severity * (actor.kind === 'player' ? 1 : .8))));
      if (actor.hp === 0) { actor.disabled = true; actor.color = 0x696e75; }
    }
    // Small exaggeration makes impacts legible without replacing the engine response.
    const dx = b.body.position.x - a.body.position.x, dz = b.body.position.z - a.body.position.z;
    const length = Math.hypot(dx, dz) || 1;
    const impulse = Math.min(115, severity * 7);
    a.body.applyImpulse(new CANNON.Vec3(-dx / length * impulse, 0, -dz / length * impulse));
    b.body.applyImpulse(new CANNON.Vec3(dx / length * impulse, 0, dz / length * impulse));
  }
}
