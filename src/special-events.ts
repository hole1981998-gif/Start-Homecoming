import { effectiveVehicle } from './vehicles';
import { balance, eventBalance } from './config';
import type { Entity, EntityKind } from './world';
import type { Run } from './survival';

export const specialKinds = ['police', 'militia', 'jam', 'accident', 'train', 'broken'] as const;
export type SpecialKind = typeof specialKinds[number];
export type JamVariant = 'barrier' | 'vendor' | 'ambulance';
const outcomes: readonly { kind: SpecialKind; variant?: JamVariant }[] = [
  { kind: 'police' }, { kind: 'jam', variant: 'barrier' }, { kind: 'train' },
  { kind: 'militia' }, { kind: 'accident' }, { kind: 'jam', variant: 'vendor' },
  { kind: 'broken' }, { kind: 'police' }, { kind: 'train' },
  { kind: 'militia' }, { kind: 'accident' }, { kind: 'jam', variant: 'ambulance' },
];
export const isSpecial = (kind: EntityKind): kind is SpecialKind => (specialKinds as readonly string[]).includes(kind);
/** Clock is gameplay time: pause/help/shop never advance the crossing. */
export function trainClosed(e: Entity, seconds: number): boolean {
  if (e.crossMotion) return e.x + e.width / 2 >= -balance.laneWidth * 1.5 && e.x - e.width / 2 <= balance.laneWidth * 1.5;
  return (seconds - (e.eventAt ?? seconds)) % eventBalance.trainPeriod < eventBalance.trainClosedSeconds;
}
export function bananaTarget(run: Run): Entity | undefined {
  const vehicle = effectiveVehicle(run.vehicleInstances.find(v => v.id === run.activeVehicleId)!);
  return run.world.entities.filter(e => (e.kind === 'police' || e.kind === 'militia') && !e.consumed && !e.stunned &&
    e.distance > run.distance && e.distance - run.distance <= Math.max(eventBalance.bananaReach, run.speed * eventBalance.reactionSeconds + (vehicle.length + e.length) / 2))
    .sort((a, b) => a.distance - b.distance)[0];
}
/** Deterministic, separate event stream. Two-lane patterns always leave one whole lane. */
export function specialPlan(index: number, seed: number): { kind: SpecialKind; variant?: JamVariant; distance: number; x: number } {
  const hash = (Math.imul(seed ^ Math.imul(index + 1, 0x9e3779b1), 1664525) + 1013904223) >>> 0;
  // Every twelve slots include all outcomes; repeated threats retain type-specific cooldowns.
  const offset = (seed >>> 0) % outcomes.length;
  const position = (seed & 8) ? outcomes.length - 1 - index % outcomes.length : index % outcomes.length;
  return { ...outcomes[(position + offset) % outcomes.length],
    distance: eventBalance.firstDistance + index * eventBalance.gap,
    x: ((hash & 1) ? 1 : -1) * balance.laneWidth / 2 };
}
