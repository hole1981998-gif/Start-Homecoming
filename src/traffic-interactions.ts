import { balance, movingBalance } from './config';
import { moveTrafficWithFuel } from './traffic-fuel';
import { sweptContact, type Entity } from './world';
import { trafficTypes } from './vehicles';

interface Track { car: Entity; vx: number; vz: number }
type Contact = { t: number; key: string; type: 'pair' | 'block' | 'enter' | 'exit' | 'death'; a: Track; b?: Track; patch?: Entity };
const pairKey = (a: string, b: string) => JSON.stringify([a, b].sort());
const patchKey = (car: string, patch: string) => JSON.stringify([car, patch]);
const overlap = (a: Entity, b: Entity) => Math.abs(a.x - b.x) <= (a.width + b.width) / 2 + 1e-9 &&
  Math.abs(a.distance - b.distance) <= (a.length + b.length) / 2 + 1e-9;

/** Experimental scenario-only event timeline. Stops/recomputes trajectories after every impact. */
export function advanceInteractingTraffic(entities: Entity[], previous: Entity[], dt: number): void {
  const tracks: Track[] = [], pairs = new Set<string>();
  const holes = entities.filter(e => !e.consumed && e.kind === 'pothole');
  const blockers = entities.filter(e => !e.consumed && ['jam', 'train', 'accident', 'broken'].includes(e.kind));
  const active = new Set<string>();
  const blocked = new Set<string>();
  const wreckAt = new Map<string, number>();
  for (const car of entities.filter(e => e.kind === 'traffic' && !e.consumed).sort((a, b) => a.id.localeCompare(b.id))) {
    const old = previous.find(e => e.id === car.id)!;
    const dx = car.x - old.x;
    car.x = old.x;
    if (car.wrecked || (car.hp ?? 0) <= 0) {
      car.speed = 0; car.wrecked = true; car.wreckAge = (car.wreckAge ?? 0) + dt;
      if (car.wreckAge >= balance.trafficWreckSeconds) car.consumed = true;
      tracks.push({ car, vx: 0, vz: 0 });
    } else {
      const from = car.distance;
      moveTrafficWithFuel(car, entities, dt);
      const vz = (car.distance - from) / dt;
      car.distance = from;
      tracks.push({ car, vx: dx / dt, vz });
    }
    for (const id of car.trafficPairContacts ?? []) pairs.add(pairKey(car.id, id));
    for (const id of car.trafficContacts ?? []) {
      const patch = holes.find(e => e.id === id);
      if (patch && overlap(car, patch)) active.add(patchKey(car.id, id));
      if (blockers.some(e => e.id === id)) blocked.add(patchKey(car.id, id));
    }
  }
  let time = 0;
  const stop = (track: Track) => {
    track.vx = 0; track.vz = 0; track.car.speed = 0; track.car.baseSpeed = 0;
    track.car.crossMotion = undefined; track.car.trafficStoppedByCollision = true;
  };
  const wreck = (track: Track, playerSource = false) => {
    const car = track.car;
    if (car.wrecked) return;
    car.hp = 0; car.wrecked = true; car.wreckAge = 0;
    car.wreckedByPlayer = car.wreckedByPlayer === true || playerSource || car.trafficPlayerSource === true;
    wreckAt.set(car.id, time); stop(track);
  };
  for (let iteration = 0; iteration < 256 && time < dt - 1e-12; iteration++) {
    const remaining = dt - time, events: Contact[] = [];
    for (const track of tracks) {
      const car = track.car;
      if (car.consumed || car.wrecked) continue;
      for (const obstacle of blockers) {
        const old = previous.find(e => e.id === obstacle.id)!;
        const vx = (obstacle.x - old.x) / dt, vz = (obstacle.distance - old.distance) / dt;
        const current = { ...obstacle, x: old.x + vx * time, distance: old.distance + vz * time };
        const key = patchKey(car.id, obstacle.id);
        if (blocked.has(key) && !overlap(car, current)) blocked.delete(key);
        if (blocked.has(key)) continue;
        const hit = sweptContact(car.x - current.x, car.distance - current.distance,
          car.x - current.x + (track.vx - vx) * remaining, car.distance - current.distance + (track.vz - vz) * remaining,
          (car.width + obstacle.width) / 2, (car.length + obstacle.length) / 2);
        if (hit) events.push({ t: hit[0] * remaining, key, type: 'block', a: track, patch: obstacle });
      }
      let count = 0;
      for (const patch of holes) {
        const key = patchKey(car.id, patch.id);
        const contact = sweptContact(car.x - patch.x, car.distance - patch.distance,
          car.x + track.vx * remaining - patch.x, car.distance + track.vz * remaining - patch.distance,
          (car.width + patch.width) / 2, (car.length + patch.length) / 2);
        if (active.has(key) && (!contact || contact[1] <= 1e-10)) active.delete(key);
        if (active.has(key)) {
          count++;
          if (contact && contact[1] < 1 - 1e-10)
            events.push({ t: contact[1] * remaining, key, type: 'exit', a: track, patch });
        } else if (contact && contact[1] - contact[0] > 1e-10) {
          events.push({ t: contact[0] * remaining, key, type: 'enter', a: track, patch });
        }
      }
      if (count) {
        const untilDeath = (car.hp ?? 0) / (balance.potholeDamagePerSecond * count);
        if (untilDeath <= remaining) events.push({ t: untilDeath, key: car.id, type: 'death', a: track });
      }
    }
    for (let i = 0; i < tracks.length; i++) for (let j = i + 1; j < tracks.length; j++) {
      const a = tracks[i], b = tracks[j], key = pairKey(a.car.id, b.car.id);
      if (a.car.consumed || b.car.consumed || (a.car.wrecked && b.car.wrecked)) continue;
      if (pairs.has(key) && !overlap(a.car, b.car)) pairs.delete(key);
      if (pairs.has(key)) continue;
      const hit = sweptContact(a.car.x - b.car.x, a.car.distance - b.car.distance,
        a.car.x - b.car.x + (a.vx - b.vx) * remaining,
        a.car.distance - b.car.distance + (a.vz - b.vz) * remaining,
        (a.car.width + b.car.width) / 2, (a.car.length + b.car.length) / 2);
      if (hit) events.push({ t: hit[0] * remaining, key, type: 'pair', a, b });
    }
    events.sort((a, b) => a.t - b.t || a.key.localeCompare(b.key) || a.type.localeCompare(b.type));
    const delta = events[0]?.t ?? remaining;
    for (const track of tracks) {
      const car = track.car;
      if (car.consumed) continue;
      car.x += track.vx * delta; car.distance += track.vz * delta;
      if (!car.wrecked) {
        const count = holes.filter(p => active.has(patchKey(car.id, p.id))).length;
        car.hp = Math.max(0, (car.hp ?? trafficTypes[car.trafficKind ?? 'car4'].hp) - count * balance.potholeDamagePerSecond * delta);
      }
    }
    time += delta;
    for (const track of tracks) if ((track.car.hp ?? 0) <= 1e-9) wreck(track);
    for (const event of events.filter(e => Math.abs(e.t - delta) <= 1e-10)) {
      const a = event.a;
      if (event.type === 'block') {
        blocked.add(event.key);
        if (a.car.wrecked) continue;
        const terminal = event.patch!.kind === 'train' || event.patch!.kind === 'accident';
        a.car.hp = terminal ? 0 : Math.max(0, (a.car.hp ?? 0) - movingBalance.blockerDamage);
        if (a.car.hp === 0) wreck(a); else stop(a);
        continue;
      }
      if (event.type === 'exit') { active.delete(event.key); continue; }
      if (event.type === 'death') { wreck(a); continue; }
      if (event.type === 'enter') {
        if (a.car.wrecked) continue;
        active.add(event.key);
        a.car.hp = Math.max(0, (a.car.hp ?? 0) - balance.potholeImpactDamage);
        if (a.car.hp === 0) wreck(a);
      } else {
        const b = event.b!;
        pairs.add(event.key);
        const sourceA = a.car.wreckedByPlayer === true || a.car.trafficPlayerSource === true;
        const sourceB = b.car.wreckedByPlayer === true || b.car.trafficPlayerSource === true;
        if (!a.car.wrecked) {
          a.car.hp = Math.max(0, (a.car.hp ?? 0) - trafficTypes[b.car.trafficKind ?? 'car4'].damage);
          a.car.trafficPlayerSource ||= sourceB;
          if (a.car.hp === 0) wreck(a, sourceB);
        }
        if (!b.car.wrecked) {
          b.car.hp = Math.max(0, (b.car.hp ?? 0) - trafficTypes[a.car.trafficKind ?? 'car4'].damage);
          b.car.trafficPlayerSource ||= sourceA;
          if (b.car.hp === 0) wreck(b, sourceA);
        }
        stop(a); stop(b);
      }
    }
    if (events.length === 0) break;
  }
  if (time < dt - 1e-9) throw new Error('Traffic contact timeline did not converge');
  for (const { car } of tracks) {
    car.trafficPairContacts = tracks.filter(t => t.car.id !== car.id && pairs.has(pairKey(car.id, t.car.id)) && overlap(car, t.car)).map(t => t.car.id);
    car.trafficContacts = [...holes.filter(p => active.has(patchKey(car.id, p.id))),
      ...blockers.filter(p => blocked.has(patchKey(car.id, p.id)))].map(p => p.id);
    if (wreckAt.has(car.id)) car.wreckAge = dt - wreckAt.get(car.id)!;
    if (!car.wrecked && !car.trafficStoppedByCollision && car.trafficMotion === 'powered') {
      const inWater = entities.some(e => e.kind === 'water' && !e.consumed && overlap(car, e));
      car.speed = (car.baseSpeed ?? balance.trafficSpeed) * (inWater ? balance.trafficWaterSpeedFactor : 1);
    }
  }
}
