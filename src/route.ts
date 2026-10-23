import { balance } from './config';
import type { VehicleKind } from './vehicles';

export type Turn = 'left' | 'right';
export interface Junction { index: number; distance: number; blockedStraight: boolean; windowSeconds: number }
export interface JunctionWindow { index: number; openDistance: number; closeDistance: number; closed: boolean }
export interface RouteState { index: number; choice: Turn | null; turns: number; lastTurn: Turn | 'straight' | null; turnAt: number; misses: number;
  history: { distance: number; turn: Turn }[]; origin: PathPose & { distance: number }; window?: JunctionWindow }
export const initialRoute = (): RouteState => ({ index: 0, choice: null, turns: 0, lastTurn: null, turnAt: -1e9, misses: 0, history: [],
  origin: { distance: 0, x: 0, z: 0, heading: 0 } });

/** Pure world schedule; the same run seed always exposes the same junctions. */
export function junction(seed: number, index: number): Junction {
  const n = (Math.imul(seed ^ (index + 1), 1664525) + 1013904223) >>> 0;
  const distance = balance.firstJunction + index * balance.junctionInterval;
  return { index, distance, blockedStraight: index > 0 && n % 3 === 0,
    windowSeconds: 2.4 };
}

const closeLead: Record<VehicleKind, number> = {
  motorcycle: .6, motorbike: .6, tricycle: .75, car4: .8,
  car7: .95, truck: 1.1, bus: 1.15, container: 1.3,
};
export function junctionWindow(j: Junction, speed: number, kind: VehicleKind): JunctionWindow {
  const referenceSpeed = Math.max(speed, 8);
  return { index: j.index, openDistance: j.distance - referenceSpeed * j.windowSeconds,
    closeDistance: j.distance - Math.max(9, referenceSpeed * closeLead[kind]), closed: false };
}
/** Capture the approach once; braking or swapping vehicles cannot reopen a closed QTE. */
export function updateJunctionWindow(route: RouteState, distance: number, speed: number, j: Junction,
  kind: VehicleKind): RouteState {
  const gap = j.distance - distance;
  if (gap > Math.max(70, speed * 4)) return route;
  const window = route.window?.index === j.index ? route.window : junctionWindow(j, speed, kind);
  const closed = window.closed || distance >= window.closeDistance;
  return window === route.window && closed === window.closed ? route : { ...route, window: { ...window, closed } };
}
export function canChoose(distance: number, speed: number, j: Junction, kind: VehicleKind = 'motorcycle',
  window?: JunctionWindow): boolean {
  const bounds = window?.index === j.index ? window : junctionWindow(j, speed, kind);
  return !bounds.closed && distance >= bounds.openDistance && distance < bounds.closeDistance;
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
  let pose: PathPose = route.origin, cursor = route.origin.distance;
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

/** Discard turns only after their junction has moved outside the rear view. */
export function compactRoute(route: RouteState, distance: number, seed: number): RouteState {
  const retained = route.history.filter(event => event.distance + 64 >= distance);
  if (retained.length === route.history.length) return route;
  const lastRemoved = route.history[route.history.length - retained.length - 1];
  const anchorDistance = lastRemoved.distance + 8;
  const pose = pathPose(anchorDistance, route, seed);
  return { ...route, history: retained, origin: { distance: anchorDistance, ...pose } };
}
