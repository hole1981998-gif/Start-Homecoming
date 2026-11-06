/** Presentation only: half-size at 80 m or farther, full-size at contact.
 * Keep this visual ramp independent of speed and actual warning/decision
 * windows, so braking cannot make an approaching tag shrink. */
export function approachCueScale(distance: number): number {
  const progress = Math.max(0,Math.min(1,1-Math.max(0,distance)/80));
  return .5 + .5*progress;
}
