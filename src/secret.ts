import type { VehicleKind } from './vehicles';

export type SecretStep = 0 | 1 | 2 | 3;
export interface SecretState {
  step: SecretStep;
  vehicleId: string | null;
  jumpAt: number | null;
  jumpStartDistance: number | null;
  trainId: string | null;
  trainFarEdge: number | null;
}
export const initialSecret = (): SecretState => ({ step: 0, vehicleId: null, jumpAt: null,
  jumpStartDistance: null, trainId: null, trainFarEdge: null });
const clearJump = (state: SecretState): SecretState => ({ ...state, jumpAt: null,
  jumpStartDistance: null, trainId: null, trainFarEdge: null });

/** A car4 starts a fresh boarding sequence once it has no passengers. */
export function secretVehicle(state: SecretState, kind: VehicleKind, vehicleId: string, riders: number): SecretState {
  if (kind !== 'car4') return initialSecret();
  if (state.vehicleId === vehicleId && state.step > 0 && riders === 3 && state.step >= 2) return state;
  if (state.vehicleId === vehicleId && state.step === 1 && riders >= 0 && riders < 3) return state;
  return riders === 0 ? { ...initialSecret(), step: 1, vehicleId } : initialSecret();
}
export function secretPickup(state: SecretState, vehicleId: string, riders: number): SecretState {
  if (state.step !== 1 || state.vehicleId !== vehicleId || riders < 1 || riders > 3) return initialSecret();
  return riders === 3 ? { ...state, step: 2 } : state;
}
export function guardedSecret(state: SecretState, vehicleId: string, riders: number): SecretState {
  if (!state.step) return state;
  return state.vehicleId !== vehicleId || riders > 3 || (state.step >= 2 && riders !== 3) ? initialSecret() : state;
}
export function secretJump(state: SecretState, at: number, startDistance: number): SecretState {
  return state.step === 2 ? { ...clearJump(state), jumpAt: at, jumpStartDistance: startDistance } : state;
}
/** Called only for an actual swept overlap with an active train while high enough and boosted. */
export function secretTrainOverlap(state: SecretState, trainId: string, trainDistance: number,
  halfFootprints: number): SecretState {
  if (state.step !== 2 || state.jumpAt === null || state.jumpStartDistance === null ||
    state.jumpStartDistance >= trainDistance - halfFootprints || state.trainId !== null) return state;
  return { ...state, trainId, trainFarEdge: trainDistance + halfFootprints };
}
/** Landing beyond the whole train, after a witnessed airborne overlap, completes step three. */
export function secretLanding(state: SecretState, at: number, distance: number, jumpSeconds: number): SecretState {
  if (state.step !== 2 || state.jumpAt === null || at < state.jumpAt + jumpSeconds - 1e-9) return state;
  const complete = state.trainId !== null && state.trainFarEdge !== null && distance > state.trainFarEdge;
  return { ...clearJump(state), step: complete ? 3 : 2 };
}
export function canSecretEnd(state: SecretState, vehicleId: string, riders: number): boolean {
  return state.step === 3 && state.vehicleId === vehicleId && riders === 3;
}
