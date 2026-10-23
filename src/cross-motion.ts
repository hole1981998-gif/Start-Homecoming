import { balance, movingBalance } from './config';
import type { Entity } from './world';

/** Opt-in P6.1 prototype motion, in metres/seconds of simulation time. */
export interface CrossMotion {
  type: 'linear' | 'pingpong' | 'vendor'; origin: number; velocity: number; startedAt: number;
  min: number; max: number;
}
export function crossX(m: CrossMotion, seconds: number): number {
  const elapsed = Math.max(0, seconds - m.startedAt);
  if (m.type === 'vendor') {
    const { vendorBurstSpeed: burst, vendorCruiseSpeed: cruise,
      vendorBurstSeconds: burstTime, vendorEaseSeconds: easeTime } = movingBalance;
    const first = Math.min(elapsed, burstTime) * burst;
    const easing = Math.min(Math.max(0, elapsed - burstTime), easeTime);
    const u = easing / easeTime;
    const second = cruise * easing + (burst - cruise) * easeTime * (1 - (1 - u) ** 3) / 3;
    const last = Math.max(0, elapsed - burstTime - easeTime) * cruise;
    return m.origin + Math.sign(m.velocity) * (first + second + last);
  }
  const unfolded = m.origin + m.velocity * elapsed;
  if (m.type === 'linear') return unfolded;
  const span = m.max - m.min, n = ((unfolded - m.min) % (2 * span) + 2 * span) % (2 * span);
  return n <= span ? m.min + n : m.max - (n - span);
}
/** Splitting at reflections/start makes each swept segment linear, including a full out-and-back tick. */
export function crossBoundaries(entities: Entity[], now: number, dt: number): number[] {
  const result: number[] = [];
  for (const e of entities) {
    const m = e.crossMotion;
    if (!m || e.motionWaiting || e.stunned || e.consumed || e.wrecked || m.velocity === 0) continue;
    if (m.startedAt > now + 1e-9 && m.startedAt < now + dt - 1e-9) result.push(m.startedAt);
    if (m.type === 'vendor') {
      for (const at of [m.startedAt + movingBalance.vendorBurstSeconds,
        m.startedAt + movingBalance.vendorBurstSeconds + movingBalance.vendorEaseSeconds])
        if (at > now + 1e-9 && at < now + dt - 1e-9) result.push(at);
    }
    if (m.type !== 'pingpong' || now + dt <= m.startedAt) continue;
    const span = m.max - m.min;
    const start = m.origin - m.min + m.velocity * Math.max(0, now - m.startedAt);
    const direction = Math.sign(m.velocity);
    let edge = direction > 0 ? Math.floor(start / span + 1e-9) + 1 : Math.ceil(start / span - 1e-9) - 1;
    for (let i = 0; i < 256; i++, edge += direction) {
      const at = m.startedAt + (edge * span - (m.origin - m.min)) / m.velocity;
      if (at >= now + dt - 1e-9) break;
      if (at > now + 1e-9) result.push(at);
    }
  }
  return result;
}
export function advanceCrossMotion(entities: Entity[], seconds: number): void {
  for (const e of entities) if (e.crossMotion && !e.motionWaiting && !e.stunned && !e.wrecked && !e.consumed) {
    e.x = crossX(e.crossMotion, seconds);
  }
}
/** Run AFTER collision sweeps so a fast crosser cannot disappear before its contact is tested. */
export function retireCrossers(entities: Entity[]): void {
  for (const e of entities) if ((e.crossMotion?.type === 'linear' || e.crossMotion?.type === 'vendor') &&
    Math.sign(e.crossMotion.velocity) * e.x > balance.laneWidth * balance.laneCount / 2 + e.width / 2 + 2 * balance.laneWidth) e.consumed = true;
}
