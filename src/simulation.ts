import { balance, type Balance } from './config';

export type Phase = 'ready' | 'running' | 'paused';
export interface Input { accelerate: boolean; brake: boolean; left: boolean; right: boolean }
export const noInput = (): Input => ({ accelerate: false, brake: false, left: false, right: false });
export interface State { phase: Phase; distance: number; speed: number; x: number; lateralVelocity: number; ticks: number }
export const initialState = (): State => ({ phase: 'ready', distance: 0, speed: balance.cruiseSpeed, x: 0, lateralVelocity: 0, ticks: 0 });
const approach = (value: number, target: number, delta: number) =>
  Math.abs(target - value) <= delta + 1e-12 ? target : value + Math.sign(target - value) * delta;

/** Pure fixed-step gameplay. Renderer/camera cannot award distance or mutate economy. */
export function step(s: State, input: Input, dt = balance.fixedStep, c: Balance = balance): State {
  if (s.phase !== 'running' || !Number.isFinite(dt) || dt <= 0) return s;
  // Reject excessively large simulation steps; the clock must subdivide real time.
  if (dt > c.fixedStep + 1e-9) throw new Error('Simulation requires fixed steps');
  // Holding a pedal overrides cruise. A/D alone does not override the longitudinal controller.
  const target = input.brake ? c.minSpeed : input.accelerate ? c.maxSpeed : c.cruiseSpeed;
  const rate = input.brake ? c.braking : input.accelerate ? c.acceleration :
    s.speed < c.cruiseSpeed ? c.returnAcceleration : c.returnDeceleration;
  const speed = approach(s.speed, target, rate * dt);
  const direction = Number(input.right) - Number(input.left);
  let lateralVelocity = approach(s.lateralVelocity, direction * c.lateralSpeed,
    (direction ? c.lateralAcceleration : c.lateralBraking) * dt);
  const bound = (c.laneWidth * c.laneCount - c.vehicleWidth) / 2;
  const x = Math.max(-bound, Math.min(bound, s.x + lateralVelocity * dt));
  if ((x === bound && lateralVelocity > 0) || (x === -bound && lateralVelocity < 0)) lateralVelocity = 0;
  return { ...s, speed, x, lateralVelocity, distance: s.distance + (s.speed + speed) * 0.5 * dt, ticks: s.ticks + 1 };
}

/** Drops background/long-stall time rather than fast-forwarding the player. */
export class FixedClock {
  private accumulator = 0;
  reset(): void { this.accumulator = 0; }
  advance(seconds: number, tick: () => void): number {
    if (!Number.isFinite(seconds) || seconds <= 0) return 0;
    this.accumulator += Math.min(seconds, balance.maxFrameSeconds);
    let count = 0;
    while (this.accumulator + 1e-10 >= balance.fixedStep && count < balance.maxSubsteps) {
      tick(); this.accumulator -= balance.fixedStep; count++;
    }
    return Math.max(0, this.accumulator / balance.fixedStep);
  }
}
