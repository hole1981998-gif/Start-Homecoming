import { balance } from '../config';
import type { Entity } from '../world';
import { passengerCrashPose, type TimedPose } from './timing';
import type { PersonArchetype } from './people';

const roadsideCast = ['commuter', 'student', 'child', 'worker', 'parent', 'senior'] as const satisfies readonly PersonArchetype[];

/** Stable visual casting; no draw from the simulation's seeded RNG. */
export function roadsideArchetype(id: string): (typeof roadsideCast)[number] {
  let hash = 2166136261;
  for (let i = 0; i < id.length; i++) hash = Math.imul(hash ^ id.charCodeAt(i), 16777619);
  return roadsideCast[(hash >>> 0) % roadsideCast.length];
}

/** Sample from simulation time so pause and restart cannot advance a visual clip. */
export function roadsidePose(entity: Entity, activeSeconds: number): TimedPose {
  const motion = entity.passengerMotion;
  if (motion?.ejectedAt !== undefined) {
    const elapsed = activeSeconds - motion.ejectedAt;
    if (motion.crashRecovery) return passengerCrashPose(elapsed);
    if (elapsed < balance.passengerKickSeconds) return passengerCrashPose(elapsed);
  }
  if (motion?.idle || !motion) return {
    pose: entity.pickupable === false ? 'stand' : 'hail', phase: activeSeconds * .5 % 1,
  };
  const elapsed = Math.max(0, activeSeconds - motion.startedAt);
  return { pose: 'walk', phase: elapsed * .8 % 1 };
}

/** Local yaw toward the tangent of the simulation's circular wander path. */
export function roadsideWalkingYaw(entity: Entity, activeSeconds: number): number {
  const motion = entity.passengerMotion;
  if (!motion || roadsidePose(entity, activeSeconds).pose !== 'walk') return 0;
  const elapsed = Math.max(0, activeSeconds - motion.startedAt);
  const radius = balance.passengerWanderRadius / 2;
  const angle = elapsed * balance.passengerWanderSpeed / radius + motion.phase;
  // Entity distance grows down the road, whereas local +Z points toward the camera.
  return angle + Math.PI;
}
