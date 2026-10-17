import { balance } from './config';

export type Turn = 'left' | 'right';
export interface Junction { index: number; distance: number; blockedStraight: boolean; windowSeconds: number }
export interface RouteState { index: number; choice: Turn | null; turns: number; lastTurn: Turn | 'straight' | null; turnAt: number; misses: number;
  history: { distance: number; turn: Turn }[] }
export const initialRoute = (): RouteState => ({ index: 0, choice: null, turns: 0, lastTurn: null, turnAt: -1e9, misses: 0, history: [] });

/** Pure world schedule; the same run seed always exposes the same junctions. */
export function junction(seed: number, index: number): Junction {
  const n = (Math.imul(seed ^ (index + 1), 1664525) + 1013904223) >>> 0;
  const distance = balance.firstJunction + index * balance.junctionInterval;
  const difficulty = Math.min(1, distance / 10000);
  return { index, distance, blockedStraight: index > 0 && n % 3 === 0,
    windowSeconds: Math.max(.9, 1.8 - .6 * difficulty) };
}

export function canChoose(distance: number, speed: number, j: Junction): boolean {
  return distance < j.distance && j.distance - distance <= Math.max(speed, 8) * j.windowSeconds;
}

export function nearJunction(distance: number): boolean {
  const nearest = Math.round((distance - balance.firstJunction) / balance.junctionInterval);
  return nearest >= 0 && Math.abs(distance - (balance.firstJunction + nearest * balance.junctionInterval)) < balance.junctionClearance;
}

export interface PathPose { x: number; z: number; heading: number }
/** Centerline in world metres. Quarter turns occupy 16 m of route length. */
export function pathPose(distance: number, route: RouteState, seed: number): PathPose {
  const active = route.choice ? [{ distance: junction(seed, route.index).distance, turn: route.choice }] : [];
  const turns = [...route.history, ...active];
  let pose: PathPose = { x: 0, z: 0, heading: 0 }, cursor = 0;
  for (const event of turns) {
    const start = event.distance - 8;
    if (distance <= start) break;
    const straight = start - cursor;
    pose = { x: pose.x + Math.sin(pose.heading) * straight,
      z: pose.z - Math.cos(pose.heading) * straight, heading: pose.heading };
    const arc = Math.min(16, distance - start);
    const curvature = (event.turn === 'right' ? 1 : -1) * Math.PI / 32;
    const endHeading = pose.heading + curvature * arc;
    pose = { x: pose.x + (Math.cos(pose.heading) - Math.cos(endHeading)) / curvature,
      z: pose.z - (Math.sin(endHeading) - Math.sin(pose.heading)) / curvature, heading: endHeading };
    cursor = start + arc;
    if (arc < 16) return pose;
  }
  const remaining = distance - cursor;
  return { x: pose.x + Math.sin(pose.heading) * remaining,
    z: pose.z - Math.cos(pose.heading) * remaining, heading: pose.heading };
}
