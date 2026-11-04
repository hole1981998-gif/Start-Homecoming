import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { createTwoWheelerArt } from '../src/art/two-wheelers';

describe('two-wheeler art handoff', () => {
  for (const [kind, length, width] of [['motorcycle', 2, .896], ['motorbike', 2.2, .96]] as const) {
    it(`${kind} stays close to its catalog footprint and exposes moving parts`, () => {
      const art = createTwoWheelerArt(kind);
      const b = new THREE.Box3().setFromObject(art.root);
      expect(b.max.x - b.min.x).toBeLessThanOrEqual(width + .04);
      expect(b.max.z - b.min.z).toBeLessThanOrEqual(length + .08);
      expect(b.min.y).toBeGreaterThanOrEqual(-.01);
      expect(art.frontWheel.parent).toBe(art.frontSteer);
      expect(art.rearWheel.parent).toBe(art.root);
      expect(art.seats.driver.position.z).toBeGreaterThan(art.seats.passenger.position.z);
      expect(art.sockets.headlamp.position.z).toBeGreaterThan(art.sockets.tail.position.z);
      art.dispose();
    });
  }
  it('uses different structural silhouettes, not merely a resized shared shell', () => {
    const commuter = createTwoWheelerArt('motorcycle');
    const sport = createTwoWheelerArt('motorbike');
    expect(commuter.root.getObjectByName('leg_shield_-1')).toBeDefined();
    expect(commuter.root.getObjectByName('footboard')).toBeDefined();
    expect(sport.root.getObjectByName('tank_upper')).toBeDefined();
    expect(sport.root.getObjectByName('radiator_fin_-1')).toBeDefined();
    commuter.dispose(); sport.dispose();
  });
});
