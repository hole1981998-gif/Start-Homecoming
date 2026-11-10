import { effectiveVehicle } from './vehicles';
import { balance, backupEventBalance, eventBalance } from './config';
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
// Two old cycles preserve all twenty non-train outcomes; the extra slot adds one train.
const lateOutcomes = [...outcomes, ...outcomes, { kind: 'train' as const }];
const lastEarlyIndex = Math.floor((eventBalance.lateGapDistance - eventBalance.firstDistance) / eventBalance.gap);
const lastEarlyDistance = eventBalance.firstDistance + lastEarlyIndex * eventBalance.gap;
const firstFinalIndex = lastEarlyIndex + Math.ceil((eventBalance.finalGapDistance - lastEarlyDistance) / eventBalance.lateGap);
const firstFinalDistance = lastEarlyDistance + (firstFinalIndex - lastEarlyIndex) * eventBalance.lateGap;
export function specialDistance(index: number, backup = false): number {
  return backup ? backupEventBalance.firstDistance + index * backupEventBalance.gap :
    index <= lastEarlyIndex ? eventBalance.firstDistance + index * eventBalance.gap :
      index <= firstFinalIndex ? lastEarlyDistance + (index - lastEarlyIndex) * eventBalance.lateGap :
        firstFinalDistance + (index - firstFinalIndex) * eventBalance.finalGap;
}
export function specialIndexNear(distance: number, backup = false): number {
  if (backup) return Math.max(0, Math.round((distance - backupEventBalance.firstDistance) / backupEventBalance.gap));
  return Math.max(0, distance <= lastEarlyDistance ?
    Math.round((distance - eventBalance.firstDistance) / eventBalance.gap) :
    distance <= firstFinalDistance ? lastEarlyIndex + Math.round((distance - lastEarlyDistance) / eventBalance.lateGap) :
      firstFinalIndex + Math.round((distance - firstFinalDistance) / eventBalance.finalGap));
}
export function specialIndexAtOrAfter(distance: number, backup = false): number {
  if (backup) return Math.max(0, Math.ceil((distance - backupEventBalance.firstDistance) / backupEventBalance.gap));
  return Math.max(0, distance <= lastEarlyDistance ?
    Math.ceil((distance - eventBalance.firstDistance) / eventBalance.gap) :
    distance <= firstFinalDistance ? lastEarlyIndex + Math.ceil((distance - lastEarlyDistance) / eventBalance.lateGap) :
      firstFinalIndex + Math.ceil((distance - firstFinalDistance) / eventBalance.finalGap));
}
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
export function specialPlan(index: number, seed: number, backup = false): { kind: SpecialKind; variant?: JamVariant; distance: number; x: number } {
  const hash = (Math.imul(seed ^ Math.imul(index + 1, 0x9e3779b1), 1664525) + 1013904223) >>> 0;
  const schedule = backup ? outcomes : lateOutcomes;
  const offset = (seed >>> 0) % schedule.length;
  const position = (seed & 8) ? schedule.length - 1 - index % schedule.length : index % schedule.length;
  return { ...schedule[(position + offset) % schedule.length],
    distance: specialDistance(index, backup),
    x: ((hash & 1) ? 1 : -1) * balance.laneWidth / 2 };
}
