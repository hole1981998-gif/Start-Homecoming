import { itemBalance } from './config';
import type { Run } from './survival';

export type PowerItem = 'nitro' | 'star';
export interface Powers { boostUntil: number; starUntil: number; jumpAt: number }
export const itemNames: Record<PowerItem, string> = { nitro: 'Nitro boost', star: 'Invincible star' };
export const newPowers = (): Powers => ({ boostUntil: 0, starUntil: 0, jumpAt: -100 });
export const hasStar = (run: Run): boolean => run.activeSeconds < run.powers.starUntil - 1e-9;
export const hasBoost = (run: Run): boolean => run.activeSeconds < run.powers.boostUntil - 1e-9;
export function jumpHeight(run: Run): number {
  const age = run.activeSeconds - run.powers.jumpAt;
  return age > 0 && age < itemBalance.jumpSeconds ?
    itemBalance.jumpHeight * Math.sin(Math.PI * age / itemBalance.jumpSeconds) : 0;
}
/** Ordinary collision clearance; terminal/event policies are deliberately separate. */
export function clears(run: Run, height: number): boolean { return jumpHeight(run) >= height - 1e-9; }
export function usePowerItem(run: Run, slot: number): Run {
  if (run.phase !== 'running' || run.crash || run.result || !Number.isInteger(slot) || slot < 0 || slot > 1) return run;
  const item = run.inventory[slot];
  if (!item || (item === 'nitro' && (hasBoost(run) || run.fuel <= 0 || run.motion !== 'powered')) ||
    (item === 'star' && hasStar(run))) return run;
  return { ...run, inventory: run.inventory.map((value, i) => i === slot ? null : value),
    powers: item === 'nitro' ? { ...run.powers, boostUntil: run.activeSeconds + itemBalance.boostSeconds, jumpAt: run.activeSeconds } :
      { ...run.powers, starUntil: run.activeSeconds + itemBalance.starSeconds } };
}
/** Split a fixed tick at effect/clearance boundaries so landing and expiration cannot grant a spare tick. */
export function powerBoundaries(run: Run, dt: number): number[] {
  if (run.activeSeconds >= Math.max(run.powers.boostUntil, run.powers.starUntil, run.powers.jumpAt + itemBalance.jumpSeconds)) return [];
  const times = [run.powers.boostUntil, run.powers.starUntil];
  for (const height of [itemBalance.groundClearance, itemBalance.pickupClearance, itemBalance.lowTrafficClearance]) {
    const ascent = Math.asin(height / itemBalance.jumpHeight) * itemBalance.jumpSeconds / Math.PI;
    times.push(run.powers.jumpAt + ascent, run.powers.jumpAt + itemBalance.jumpSeconds - ascent);
  }
  return [...new Set(times.filter(t => t > run.activeSeconds + 1e-9 && t < run.activeSeconds + dt - 1e-9))].sort((a, b) => a - b);
}
