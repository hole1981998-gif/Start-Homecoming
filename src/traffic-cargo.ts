import { cargoBalance } from './config';
import { entity, type Entity } from './world';

/** Move existing cargo before collision sweep; newly released cargo becomes solid next tick. */
export function advanceCargo(entities: Entity[], dt: number, now: number): void {
  for (const cargo of entities) {
    if (cargo.kind !== 'cargo' || cargo.consumed) continue;
    if (now >= (cargo.cargoExpiresAt ?? Infinity)) { cargo.consumed = true; continue; }
    let x = cargo.x + (cargo.cargoVelocityX ?? 0) * dt;
    if (x > cargoBalance.roadHalfWidth) { x = 2 * cargoBalance.roadHalfWidth - x; cargo.cargoVelocityX = -(cargo.cargoVelocityX ?? 0); }
    if (x < -cargoBalance.roadHalfWidth) { x = -2 * cargoBalance.roadHalfWidth - x; cargo.cargoVelocityX = -(cargo.cargoVelocityX ?? 0); }
    cargo.x = x;
    cargo.distance += cargo.speed * dt;
  }
}

/** A living on-screen truck/container may release once. IDs and trajectory depend only on source identity. */
export function releaseCargo(entities: Entity[], now: number, playerDistance: number, seed: number): void {
  let active = entities.filter(e => e.kind === 'cargo' && !e.consumed).length;
  for (const source of entities) {
    if (source.kind !== 'traffic' || (source.trafficKind !== 'truck' && source.trafficKind !== 'container') ||
        source.cargoReleaseAt === undefined || source.cargoDropped ||
        now < source.cargoReleaseAt || source.consumed || source.wrecked || (source.hp ?? 0) <= 0 ||
        source.speed <= 0 || (source.baseSpeed ?? source.speed) <= 0) continue;
    source.cargoDropped = true;
    // Off-screen or already behind the driver: never materialise an unfair late collision.
    if (active >= cargoBalance.maxActive || source.distance < playerDistance + 25 || source.distance > playerDistance + 180) continue;
    let hash = seed >>> 0;
    for (let i = 0; i < source.id.length; i++) hash = Math.imul(hash ^ source.id.charCodeAt(i), 16777619) >>> 0;
    const cargo = entity('cargo', `cargo:${source.id}`, source.distance - source.length / 2 - cargoBalance.releaseGap,
      source.x);
    cargo.cargoType = source.cargoType ?? 'crate';
    cargo.cargoSourceId = source.id;
    cargo.cargoVelocityX = (hash & 1 ? 1 : -1) * (cargoBalance.rollSpeed + ((hash >>> 1) % 8) * .1);
    cargo.cargoExpiresAt = now + cargoBalance.lifetime;
    cargo.speed = -(cargoBalance.backwardSpeed + ((hash >>> 5) % 6) * .2);
    cargo.displayName = cargo.cargoType === 'barrel' ? 'Thùng lăn' : 'Kiện hàng rơi';
    entities.push(cargo); active++;
  }
}
