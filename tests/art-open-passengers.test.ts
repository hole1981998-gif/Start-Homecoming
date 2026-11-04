import { describe, expect, it } from 'vitest';
import { createVehicleArt } from '../src/art/vehicle-catalog';
import { openPassengerSeat } from '../src/art/open-passengers';
import { createPersonArt, mountPersonOnSeat } from '../src/art/people';

describe('open vehicle passenger mounts', () => {
  it.each(['motorcycle', 'motorbike'] as const)(
    'mounts both the normal and overloaded %s passenger as finished people', kind => {
      const bike = createVehicleArt(kind);
      const firstSeat = openPassengerSeat(bike, kind, 0);
      const extraSeat = openPassengerSeat(bike, kind, 1);
      expect(firstSeat).not.toBe(extraSeat);
      expect(openPassengerSeat(bike, kind, 1)).toBe(extraSeat);
      const first = createPersonArt('commuter', 'near');
      const extra = createPersonArt('student', 'near');
      mountPersonOnSeat(first, firstSeat, 'riding');
      mountPersonOnSeat(extra, extraSeat, 'riding');
      expect(first.root.parent).toBe(firstSeat);
      expect(extra.root.parent).toBe(extraSeat);
      expect(extraSeat.parent).toBe(bike.root);
      expect(extra.root.getObjectByName('head')).toBeDefined();
      expect(extraSeat.position.z).toBeGreaterThan(firstSeat.position.z);
      first.dispose(); extra.dispose(); bike.dispose();
    });
});
