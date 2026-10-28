/** Presentation decisions only: a fuel stop must never look like a destroyed engine. */
export function vehicleEffectState(hpFraction: number, wrecked: boolean, wreckAge: number) {
  return { smoke: wrecked || hpFraction < .35,
    fire: wrecked && wreckAge < 1.6,
    lamp: wrecked ? 'off' as const : 'tail' as const };
}

/** Catalogs expose both a single `tail` and sided `tail_left/right` locators. */
export function vehicleLampSignal(name: string, braking: boolean,
  turn: 'left' | 'right' | null, seconds: number, reduced: boolean) {
  if (name === 'tail' || name.startsWith('tail_') ||
    (braking && (name === 'brake' || name.startsWith('brake_'))))
    return { color: braking ? '#f27c69' : '#b64e42', size: braking ? .085 : .055 };
  if (turn && name.startsWith('indicator_') && name.endsWith(turn) &&
    (reduced || seconds % .9 < .52)) return { color: '#e5af54', size: .07 };
  return null;
}
