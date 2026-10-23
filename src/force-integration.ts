import * as CANNON from 'cannon-es';
import { balance, forceTailSweep } from './config';
import { activeVehicle, stepRun, type Run } from './survival';
import type { Input } from './simulation';
import { vehicleRam, vehicles, type VehicleKind } from './vehicles';
import { passengerMotion, sweptContact, type Entity } from './world';
import { car7BodyCenterX, containerParts, heavyFrontCenterX, tailSweepYaw } from './tail-sweep';

type Dynamic = Entity & { kind: 'traffic' | 'passenger' | 'cargo' };
interface Actor { id: string; kind: Dynamic['kind'] | 'player'; body: CANNON.Body; entity?: Dynamic }
const dt = balance.fixedStep;
const mass: Record<VehicleKind, number> = { motorcycle: 180, motorbike: 260, car4: 1050,
  car7: 1450, tricycle: 600, bus: 5200, truck: 6100, container: 9000 };
// Trial handling weight: road traffic resists the player's impact more than an owned vehicle.
const trafficInertia = 2;
const trafficSlideDeceleration = 10; // m/s², trial value for post-impact rolling drag
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const dynamic = (entity: Entity): entity is Dynamic =>
  (entity.kind === 'traffic' || entity.kind === 'passenger' || entity.kind === 'cargo') && !entity.consumed;

/** Trial adapter: arcade owns events/economy, Cannon resolves dynamic-body contact displacement. */
export class ForceIntegration {
  contactPairs = 0;
  npcImpacts = 0;
  private passedWrecks = new Set<string>();
  private activePairs = new Set<string>();
  private trafficImpulse = new Map<string, { x: number; z: number }>();
  private trafficHitAt = new Map<string, number>();
  step(before: Run, input: Input): Run {
    // The arcade step can update entity fields while resolving a collision.
    // Snapshot the old pose/flags first so a newly wrecked car still receives its first impulse.
    const previous = new Map(before.world.entities.filter(dynamic).map(entity => [entity.id, { ...entity }]));
    let next = stepRun(before, input, true);
    if (before.phase !== 'running' || next.activeSeconds <= before.activeSeconds) return next;
    const vehicle = activeVehicle(before);
    const yaw = vehicle.kind === 'container' ? next.forceYaw : next.activeVehicleId === before.activeVehicleId ?
      tailSweepYaw(vehicle.kind, before.forceYaw, next.lateralVelocity, next.speed, dt,
        Number(input.right) - Number(input.left)) : 0;
    const trailerRearX = vehicle.kind === 'container' ?
      next.forceTrailerRearX : next.x;
    next = { ...next, forceYaw: yaw, forceTrailerRearX: trailerRearX };
    const liveIds = new Set(next.world.entities.map(entity => entity.id));
    for (const id of this.passedWrecks) if (!liveIds.has(id)) this.passedWrecks.delete(id);
    for (const id of this.trafficImpulse.keys()) if (!liveIds.has(id)) this.trafficImpulse.delete(id);
    for (const id of this.trafficHitAt.keys()) if (!liveIds.has(id)) this.trafficHitAt.delete(id);
    const halfRoad = balance.laneWidth * balance.laneCount / 2;
    if (this.trafficImpulse.size) {
      next = { ...next, world: { ...next.world, entities: next.world.entities.map(entity => {
        const impulse = this.trafficImpulse.get(entity.id);
        if (entity.kind !== 'traffic' || !impulse || entity.consumed) return entity;
        const x = clamp(entity.x + impulse.x * dt, -halfRoad + entity.width / 2, halfRoad - entity.width / 2);
        const distance = entity.distance + impulse.z * dt;
        const speed = Math.hypot(impulse.x, impulse.z);
        const remaining = Math.max(0, speed - trafficSlideDeceleration * dt);
        if (remaining < .05) this.trafficImpulse.delete(entity.id);
        else this.trafficImpulse.set(entity.id, { x: impulse.x * remaining / speed, z: impulse.z * remaining / speed });
        return { ...entity, x, distance };
      }) } };
    }
    const world = new CANNON.World({ gravity: new CANNON.Vec3(0, 0, 0) });
    world.defaultContactMaterial.friction = 0;
    world.defaultContactMaterial.restitution = .12;
    (world.solver as CANNON.GSSolver).iterations = 10;
    const origin = before.distance;
    const actors: Actor[] = [];
    const add = (id: string, kind: Actor['kind'], x: number, distance: number, width: number,
      length: number, bodyMass: number, vx: number, vz: number, entity?: Dynamic) => {
      const body = new CANNON.Body({ mass: bodyMass,
        // A thin skin catches contacts resolved at an exact swept-collision boundary.
        shape: new CANNON.Box(new CANNON.Vec3(width / 2 + .04, .5, length / 2 + .08)),
        position: new CANNON.Vec3(x, 0, distance - origin) });
      body.fixedRotation = true; body.updateMassProperties(); body.velocity.set(vx, 0, vz);
      body.collisionFilterGroup = kind === 'player' ? 1 : kind === 'traffic' ? 2 : kind === 'cargo' ? 4 : 8;
      if (kind === 'player') body.collisionFilterMask = ~1;
      // NPCs are swept targets, not rigid barriers that can stop a vehicle.
      if (kind === 'passenger') body.collisionResponse = false;
      // Arcade already owns the slide/recovery after a fall; avoid repeatedly shoving a target during it.
      if (kind === 'player' && before.crash) body.collisionResponse = false;
      // A heavy vehicle may pass its wreck after one impulse, while that wreck still blocks other traffic.
      if (kind === 'traffic' && entity?.wrecked && this.passedWrecks.has(id)) body.collisionFilterMask = ~1;
      world.addBody(body); actors.push({ id, kind, body, entity });
    };
    const oldParts = vehicle.kind === 'container' ?
      containerParts(before.x, before.distance, before.forceYaw, before.forceTrailerRearX) : null;
    const newParts = vehicle.kind === 'container' ?
      containerParts(next.x, next.distance, yaw, trailerRearX) : null;
    const bodyCenter = (x: number, angle: number) => vehicle.kind === 'car7' ?
      car7BodyCenterX(x, vehicle.length, angle) : vehicle.kind === 'bus' || vehicle.kind === 'truck' ?
        heavyFrontCenterX(vehicle.kind, x, vehicle.length, angle) : x;
    const startCenter = bodyCenter(before.x, before.forceYaw);
    const endCenter = bodyCenter(next.x, yaw);
    if (oldParts && newParts) {
      add('player', 'player', oldParts.tractorX, oldParts.tractorDistance, vehicle.width,
        forceTailSweep.tractorLength, mass.container * .36,
        (newParts.tractorX - oldParts.tractorX) / dt,
        (newParts.tractorDistance - oldParts.tractorDistance) / dt);
      actors[0].body.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), yaw);
      add('player-trailer', 'player', oldParts.trailerX, oldParts.trailerDistance, vehicle.width,
        forceTailSweep.trailerLength, mass.container * .64,
        (newParts.trailerX - oldParts.trailerX) / dt,
        (newParts.trailerDistance - oldParts.trailerDistance) / dt);
      actors[1].body.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), newParts.trailerYaw);
    } else {
      add('player', 'player', startCenter, before.distance, vehicle.width, vehicle.length,
        mass[vehicle.kind], (endCenter - startCenter) / dt, (next.distance - before.distance) / dt);
      actors[0].body.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), yaw);
    }
    for (const entity of next.world.entities) {
      if (!dynamic(entity) || Math.abs(entity.distance - next.distance) > 65) continue;
      const old = previous.get(entity.id);
      const start = old ?? entity;
      const kind = entity.trafficKind ?? 'car4';
      add(entity.id, entity.kind, start.x, start.distance, entity.width, entity.length,
        entity.kind === 'traffic' ? mass[kind] * trafficInertia : entity.kind === 'passenger' ? 25 : entity.cargoType === 'barrel' ? 90 : 55,
        old ? (entity.x - old.x) / dt : entity.kind === 'cargo' ? entity.cargoVelocityX ?? 0 : 0,
        old ? (entity.distance - old.distance) / dt : entity.speed, entity);
    }
    if (actors.length < 2) { this.activePairs.clear(); return next; }
    world.step(dt);
    const byBody = new Map(actors.map(actor => [actor.body.id, actor]));
    const involved = new Set<string>(), pairs = new Set<string>();
    for (const contact of world.contacts) {
      const a = byBody.get(contact.bi.id), b = byBody.get(contact.bj.id);
      if (!a || !b || !a.body.collisionResponse || !b.body.collisionResponse) continue;
      involved.add(a.id); involved.add(b.id);
      pairs.add([a.id, b.id].sort().join('|'));
      const target = a.kind === 'traffic' && b.kind === 'player' ? a :
        b.kind === 'traffic' && a.kind === 'player' ? b : null;
      if (target && next.activeSeconds - (this.trafficHitAt.get(target.id) ?? -1e9) > .7) {
        const traffic = target.entity!;
        const maxPush = clamp(5.5 + .35 * mass[vehicle.kind] / mass[traffic.trafficKind ?? 'car4'], 5.8, 7.5);
        const closingSpeed = Math.max(0, before.speed - (previous.get(target.id)?.speed ?? traffic.speed));
        const longitudinalTransfer = closingSpeed * .6 * Math.abs(contact.ni.z);
        const trailerContact = a.id === 'player-trailer' || b.id === 'player-trailer';
        const yawRate = trailerContact && newParts && oldParts ?
          (newParts.trailerYaw - oldParts.trailerYaw) / dt : 0;
        const tailFraction = trailerContact ?
          clamp((before.distance - traffic.distance) / (forceTailSweep.trailerLength / 2), 0, 1) : 0;
        const tailSweepingTowardTraffic = tailFraction > 0 &&
          (traffic.x - before.x) * yawRate < 0;
        const tailPush = tailSweepingTowardTraffic ?
          -yawRate * forceTailSweep.trailerLength * tailFraction * .28 : 0;
        const push = { x: clamp(target.body.velocity.x + tailPush, -3, 3),
          z: clamp(Math.max(target.body.velocity.z - traffic.speed, longitudinalTransfer), -maxPush, maxPush) };
        if (Math.hypot(push.x, push.z) > .5) this.trafficImpulse.set(target.id, push);
        this.trafficHitAt.set(target.id, next.activeSeconds);
      }
      if (target?.entity?.wrecked && vehicleRam[vehicle.kind].breaksThrough) this.passedWrecks.add(target.id);
    }
    this.contactPairs += [...pairs].filter(pair => !this.activePairs.has(pair)).length;
    this.activePairs = pairs;
    const modified = new Map<string, Dynamic>();
    for (const actor of actors) {
      if (!involved.has(actor.id) || !actor.entity) continue;
      const e = actor.entity;
      const x = clamp(actor.body.position.x, -halfRoad + e.width / 2, halfRoad - e.width / 2);
      const distance = clamp(origin + actor.body.position.z, e.distance - 2.5, e.distance + 2.5);
      const copy: Dynamic = { ...e, x, distance };
      if (e.kind === 'traffic') {
        // Keep engine impulse separate from the powered drive speed. Writing a recoil velocity
        // here can make traffic-fuel treat a backward shove as a new driving direction.
        copy.speed = e.wrecked ? 0 : e.speed;
      } else if (e.kind === 'cargo') {
        copy.cargoVelocityX = clamp(actor.body.velocity.x, -8, 8);
        copy.speed = clamp(actor.body.velocity.z, -12, 12);
      } else if (e.passengerMotion && e.passengerMotion.ejectedAt === undefined) {
        copy.passengerMotion = { ...e.passengerMotion,
          homeX: e.passengerMotion.homeX + x - e.x,
          homeDistance: e.passengerMotion.homeDistance + distance - e.distance };
      }
      modified.set(e.id, copy);
    }
    let playerHitNpc = false;
    const carriers = actors.filter(a => a.id === 'player' || a.kind === 'traffic');
    for (const npc of actors.filter(a => a.kind === 'passenger')) {
      const e = npc.entity!;
      const last = e.passengerMotion?.ejectedAt;
      const recovery = balance.passengerKickSeconds + balance.passengerDownSeconds + balance.passengerStandSeconds;
      if (last !== undefined && next.activeSeconds - last < recovery) continue;
      if (next.activeSeconds - e.lastHit < recovery) continue;
      const oldNpc = previous.get(e.id) ?? e;
      for (const carrier of carriers) {
        if (carrier.kind === 'player' && (before.crash || next.crash || next.phase !== 'running')) continue;
        const oldCar = carrier.kind === 'player' ? before : previous.get(carrier.id) ?? carrier.entity!;
        const newCar = carrier.kind === 'player' ? next : carrier.entity!;
        if (carrier.kind === 'traffic' && (newCar as Dynamic).wrecked) continue;
        if (!sweptContact(oldCar.x - oldNpc.x, oldCar.distance - oldNpc.distance,
          newCar.x - e.x, newCar.distance - e.distance,
          (carrier.kind === 'player' ? vehicle.width : carrier.entity!.width) / 2 + e.width / 2,
          (carrier.kind === 'player' ? vehicle.length : carrier.entity!.length) / 2 + e.length / 2)) continue;
        const forward = Math.max(2, newCar.distance - oldCar.distance > 0 ?
          (newCar.distance - oldCar.distance) / dt : carrier.body.velocity.z);
        const side = e.x >= newCar.x ? 1 : -1;
        const targetX = clamp(e.x + side * clamp(forward * .14, 1.2, 2.6),
          -halfRoad + e.width / 2, halfRoad - e.width / 2);
        const targetDistance = e.distance + clamp(forward * .35, 2.5, 6);
        const motion = e.passengerMotion ?? passengerMotion(e, next.activeSeconds);
        modified.set(e.id, { ...e, pickupable: carrier.kind === 'player' ? false : e.pickupable,
          lastHit: next.activeSeconds,
          passengerMotion: { ...motion, homeX: targetX, homeDistance: targetDistance,
            startedAt: next.activeSeconds + recovery, ejectedAt: next.activeSeconds,
            fromX: e.x, fromDistance: e.distance, crashRecovery: true } });
        this.npcImpacts++;
        if (carrier.kind === 'player') playerHitNpc = true;
        break;
      }
    }
    if (!pairs.size && !modified.size) return next;
    const player = actors[0];
    const canPushPlayer = (involved.has('player') || involved.has('player-trailer')) &&
      next.phase === 'running' && !next.crash && !before.crash;
    const trailer = actors.find(actor => actor.id === 'player-trailer');
    const contactBody = !involved.has('player') && trailer && newParts ? trailer.body : player.body;
    const expectedX = contactBody === trailer?.body && newParts ? newParts.trailerX : endCenter;
    const x = canPushPlayer ? clamp(next.x + clamp(contactBody.position.x - expectedX, -1, 1), -halfRoad + vehicle.width / 2,
      halfRoad - vehicle.width / 2) : next.x;
    const lateralVelocity = canPushPlayer ? clamp(contactBody.velocity.x, -balance.lateralSpeed * 1.5,
      balance.lateralSpeed * 1.5) : next.lateralVelocity;
    const speed = playerHitNpc ? next.speed * .98 : canPushPlayer ?
      clamp(player.body.velocity.z, 0, Math.max(next.speed, vehicles[vehicle.kind].maxSpeed)) : next.speed;
    return { ...next, x, lateralVelocity, speed,
      world: modified.size ? { ...next.world,
        entities: next.world.entities.map(e => modified.get(e.id) ?? e) } : next.world };
  }
}
