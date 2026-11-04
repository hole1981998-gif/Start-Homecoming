import { pathPose, type RouteState } from './route';
/** Presentation range matches the visible road; interaction windows are unchanged. */
export const roadCueDistance = 120;
/** Perspective-like growth independent of speed. */
export function approachCueScale(distance: number): number {
  return 32 / (32 + Math.max(0, distance));
}

/** Q/E describes the junction itself, so choosing an exit must not relocate its anchors. */
export function roadCuePose(distance: number, route: RouteState, seed: number, junctionAnchor = false) {
  return pathPose(distance, junctionAnchor ? { ...route, choice: null } : route, seed);
}
