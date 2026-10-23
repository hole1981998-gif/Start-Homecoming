import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { createUtilityVehicleArt, type UtilityVehicleKind } from '../src/art/utility-vehicles';

describe('utility vehicle art handoff', () => {
  for (const [kind, width, length] of [
    ['tricycle', 1.76, 3.2], ['bus', 2.72, 10], ['truck', 2.72, 7], ['container', 2.88, 15],
  ] as [UtilityVehicleKind, number, number][]) {
    it(`${kind} provides distinct geometry inside its catalog envelope`, () => {
      const art = createUtilityVehicleArt(kind);
      const b = new THREE.Box3().setFromObject(art.root);
      expect(b.min.y).toBeGreaterThanOrEqual(-.02);
      expect(b.max.x - b.min.x).toBeLessThanOrEqual(width + .09);
      expect(b.max.z - b.min.z).toBeLessThanOrEqual(length + .12);
      expect(art.wheels.length).toBeGreaterThanOrEqual(kind === 'tricycle' ? 3 : 4);
      expect(art.seats.length).toBeGreaterThanOrEqual(kind === 'bus' ? 25 : 2);
      expect(art.sockets.engine_smoke_fire).toBeDefined();
      art.dispose();
    });
  }
  it('keeps the player container trailer independent of the tractor while traffic reuses the same mesh family', () => {
    const player = createUtilityVehicleArt('container', 'player');
    const traffic = createUtilityVehicleArt('container', 'traffic', 'far');
    expect(player.trailer?.parent).toBe(player.root);
    expect(player.tractor?.parent).toBe(player.body);
    expect(player.wheels.filter(w => w.parent === player.trailer)).toHaveLength(4);
    expect(player.root.userData.articulated).toBe(true);
    expect(traffic.root.userData.articulated).toBe(false);
    player.dispose(); traffic.dispose();
  });
});
