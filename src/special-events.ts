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
const lateOffsets = new Map<number, number>();
function scheduleAt(schedule: typeof outcomes, index: number, seed: number, offset: number) {
  const position = (seed & 8) ? schedule.length - 1 - index % schedule.length : index % schedule.length;
  return schedule[(position + offset) % schedule.length];
}
function cooldown(kind: SpecialKind): number {
  return kind === 'police' ? eventBalance.policeCooldown :
    kind === 'train' ? eventBalance.trainCooldown :
      kind === 'accident' ? eventBalance.accidentCooldown : 0;
}
function lateOffset(seed: number): number {
  const cached = lateOffsets.get(seed);
  if (cached !== undefined) return cached;
  const lastEarly = Array.from({ length: 3 }, (_, i) => lastEarlyIndex - 2 + i);
  const original = (seed >>> 0) % lateOutcomes.length;
  for (let shift = 0; shift < lateOutcomes.length; shift++) {
    const offset = (original + shift) % lateOutcomes.length;
    const previous = new Map<SpecialKind, number>();
    for (const index of lastEarly) previous.set(scheduleAt(outcomes, index, seed,
      (seed >>> 0) % outcomes.length).kind, specialDistance(index));
    let valid = true;
    for (let index = lastEarlyIndex + 1; index <= lastEarlyIndex + 3; index++) {
      const kind = scheduleAt(lateOutcomes, index, seed, offset).kind;
      const distance = specialDistance(index);
      if (distance - (previous.get(kind) ?? -Infinity) < cooldown(kind)) { valid = false; break; }
      previous.set(kind, distance);
    }
    if (valid) {
      if (lateOffsets.size >= 128) lateOffsets.clear();
      lateOffsets.set(seed, offset);
      return offset;
    }
  }
  throw new Error('No safe late event schedule');
}
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
  const distance = specialDistance(index, backup);
  const schedule = backup || distance < eventBalance.lateGapDistance ? outcomes : lateOutcomes;
  const offset = schedule === lateOutcomes ? lateOffset(seed) : (seed >>> 0) % schedule.length;
  return { ...scheduleAt(schedule, index, seed, offset),
    distance,
    x: ((hash & 1) ? 1 : -1) * balance.laneWidth / 2 };
}
