import { advanceCrossMotion } from './cross-motion';
import { advanceCargo } from './traffic-cargo';
import { advancePassengers, type Entity } from './world';
import type { Run } from './survival';

export const terminalSceneSeconds = 2;

/** The final two seconds are a visual epilogue: actors move, but the recorded run never changes. */
export function terminalVisualRun(run: Run, elapsed: number): Run {
  if (run.phase !== 'ended') return run;
  const seconds = Math.max(0, Math.min(terminalSceneSeconds, elapsed));
  const now = run.activeSeconds + seconds;
  const move = (entities: Entity[]): void => {
    for (const entity of entities) {
      if (entity.consumed) continue;
      if (entity.kind === 'traffic') {
        if (!entity.wrecked && entity.trafficFallAge === undefined) entity.distance += entity.speed * seconds;
        if (entity.trafficFallAge !== undefined) entity.trafficFallAge += seconds;
        if (entity.wreckAge !== undefined) entity.wreckAge += seconds;
      }
    }
    for (let t = 0; t < seconds - 1e-9;) {
      const dt = Math.min(.1, seconds - t);
      t += dt;
      advanceCargo(entities, dt, run.activeSeconds + t);
    }
    advanceCrossMotion(entities, now);
    advancePassengers(entities, now);
  };
  const entities = run.world.entities.map(entity => ({ ...entity }));
  const retired = run.world.retired.map(entry => ({ ...entry, entity: { ...entry.entity } }));
  move(entities);
  move(retired.map(entry => entry.entity));
  return { ...run, phase: 'running', activeSeconds: now,
    crash: run.crash ? { ...run.crash, elapsed: run.crash.elapsed + seconds } : null,
    world: { ...run.world, entities, retired } };
}

/** Count only visible frames, so returning from a hidden tab does not skip the epilogue. */
export function terminalElapsed(current: number, frameSeconds: number, visible: boolean): number {
  return Math.min(terminalSceneSeconds, current + (visible ? Math.min(Math.max(0, frameSeconds), .1) : 0));
}
