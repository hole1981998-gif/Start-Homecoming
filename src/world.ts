import { balance } from './config';

export type EntityKind = 'water' | 'pothole' | 'traffic' | 'fuel' | 'repair';
export interface Entity {
  id: string; kind: EntityKind; x: number; distance: number; width: number; length: number;
  speed: number; consumed: boolean; touching: boolean; lastHit: number;
}
export interface World { entities: Entity[]; nextHazard: number; nextFuel: number; nextRepair: number; rng: number }
export const initialWorld = (seed: number): World => ({ entities: [], nextHazard: 0, nextFuel: 1, nextRepair: 0, rng: seed >>> 0 });
export function entity(kind: EntityKind, id: string, distance: number, x: number): Entity {
  const sizes: Record<EntityKind, [number, number]> = { water: [3.2, 7], pothole: [1.5, 1.8], traffic: [1.9, 3.6], fuel: [.8, .8], repair: [.8, .8] };
  return { id, kind, distance, x, width: sizes[kind][0], length: sizes[kind][1],
    speed: kind === 'traffic' ? balance.trafficSpeed : 0, consumed: false, touching: false, lastHit: -1e10 };
}
/** P2 deliberately uses one-lane encounters; moving traffic stays in the middle.
 * No junctions or difficulty director yet. Both outer lanes remain alternatives to traffic.
 */
export function fillWorld(world: World, distance: number): World {
  const w = { ...world, entities: world.entities.filter(e => e.distance + e.length / 2 > distance - 12) };
  const ahead = distance + balance.worldLookAhead;
  const randomLane = () => {
    w.rng = (Math.imul(w.rng, 1664525) + 1013904223) >>> 0;
    return ((w.rng >>> 16) % 3 - 1) * balance.laneWidth;
  };
  const kinds: EntityKind[] = ['water', 'pothole', 'traffic'];
  while (balance.firstHazard + w.nextHazard * balance.hazardGap <= ahead) {
    const index = w.nextHazard++, kind = kinds[index % kinds.length];
    const x = randomLane();
    w.entities.push(entity(kind, `hazard-${index}`, balance.firstHazard + index * balance.hazardGap, kind === 'traffic' ? 0 : x));
  }
  while (w.nextFuel * balance.fuelInterval <= ahead) {
    const index = w.nextFuel++;
    w.entities.push(entity('fuel', `fuel-${index}`, index * balance.fuelInterval, index % 2 ? -balance.laneWidth : balance.laneWidth));
  }
  while (balance.firstRepair + w.nextRepair * balance.repairInterval <= ahead) {
    const index = w.nextRepair++;
    w.entities.push(entity('repair', `repair-${index}`, balance.firstRepair + index * balance.repairInterval, index % 2 ? -balance.laneWidth : balance.laneWidth));
  }
  return w;
}

/** Slab sweep in relative 2D space, including sideways movement and moving traffic. */
export function sweptContact(x0: number, z0: number, x1: number, z1: number, halfWidth: number, halfLength: number): [number, number] | null {
  let enter = 0, exit = 1;
  for (const [a, b, extent] of [[x0, x1, halfWidth], [z0, z1, halfLength]]) {
    const delta = b - a;
    if (Math.abs(delta) < 1e-12) { if (Math.abs(a) > extent) return null; continue; }
    const t0 = (-extent - a) / delta, t1 = (extent - a) / delta;
    enter = Math.max(enter, Math.min(t0, t1)); exit = Math.min(exit, Math.max(t0, t1));
    if (exit < enter) return null;
  }
  return [enter, exit];
}
