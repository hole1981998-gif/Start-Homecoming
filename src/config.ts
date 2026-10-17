/** All tunable values are TEMPORARY. Distances m, times s, speeds m/s. */
export const balance = Object.freeze({
  version: 'p1.2', laneWidth: 3.2, laneCount: 3, vehicleWidth: 0.28 * 3.2,
  // P1 currently has only the motorcycle; these move into its definition with the garage.
  minSpeed: 8, cruiseSpeed: 14, maxSpeed: 20, acceleration: 5, braking: 10,
  returnAcceleration: 3, returnDeceleration: 4,
  lateralSpeed: 5, lateralAcceleration: 22, lateralBraking: 30,
  fixedStep: 1 / 60, maxFrameSeconds: 0.1, maxSubsteps: 6,
});
export type Balance = { [K in keyof typeof balance]: typeof balance[K] extends number ? number : string };
export function validateConfig(c: Balance): void {
  for (const [key, value] of Object.entries(c)) {
    if (typeof value === 'number' && (!Number.isFinite(value) || value <= 0)) {
      throw new Error(`Invalid balance: ${key}`);
    }
  }
  if (c.maxSpeed < c.minSpeed || c.cruiseSpeed < c.minSpeed || c.cruiseSpeed > c.maxSpeed ||
      c.vehicleWidth >= c.laneWidth * 1.5 || c.laneCount !== 3 ||
      c.maxFrameSeconds > c.fixedStep * c.maxSubsteps + 1e-9) throw new Error('Invalid driving bounds');
}
validateConfig(balance);
