import { expect, it } from 'vitest';
import { playerIndicatorTurn } from '../src/art/vehicle-effects';

it('signals held A/D immediately, clears on release and preserves junction intent without drift input', () => {
  expect(playerIndicatorTurn(true, false, null)).toBe('left');
  expect(playerIndicatorTurn(false, true, 'left')).toBe('right');
  expect(playerIndicatorTurn(false, false, null)).toBeNull();
  expect(playerIndicatorTurn(true, true, null)).toBeNull();
  expect(playerIndicatorTurn(false, false, 'left')).toBe('left');
});
