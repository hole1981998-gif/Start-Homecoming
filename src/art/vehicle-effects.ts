/** Presentation decisions only: a fuel stop must never look like a destroyed engine. */
export function vehicleEffectState(hpFraction: number, wrecked: boolean, wreckAge: number) {
  return { smoke: wrecked || hpFraction < .35,
    fire: wrecked && wreckAge < 1.6,
    lamp: wrecked ? 'off' as const : 'tail' as const };
}

/** +Y up / +Z forward: physical left is +X before the runtime's 180° adapter. */
export const vehicleIndicatorSide = (localX: number): 'left' | 'right' => localX > 0 ? 'left' : 'right';

/** Catalogs expose both a single `tail` and sided `tail_left/right` locators. */
export function vehicleLampSignal(name: string, braking: boolean,
  turn: 'left' | 'right' | null, seconds: number, reduced: boolean, hazard = false) {
  if (name === 'headlamp' || name.startsWith('headlamp_'))
    return { color: '#fff0c9', size: .16 };
  if (name === 'tail' || name.startsWith('tail_') ||
    (braking && (name === 'brake' || name.startsWith('brake_'))))
    return { color: braking ? '#ff593c' : '#d84e36', size: braking ? .15 : .11 };
  if ((hazard || turn && name.endsWith(turn)) && name.startsWith('indicator_') &&
    (reduced ? seconds % 1.2 < .75 : seconds % .9 < .52)) return { color: '#ffc04b', size: .14 };
  return null;
}
