import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { createAccidentArt, createShopArt } from '../src/art/special-hazards';

describe('essential special art', () => {
  it('keeps the two-car accident within the current terminal event footprint', () => {
    const art = createAccidentArt();
    const size = new THREE.Box3().setFromObject(art.root).getSize(new THREE.Vector3());
    expect(size.x).toBeLessThanOrEqual(6.2);
    expect(size.z).toBeLessThanOrEqual(5.0);
    expect(art.root.getObjectByName('accident_left_car')).toBeDefined();
    expect(art.root.getObjectByName('accident_right_car')).toBeDefined();
    expect(art.root.userData.terminal).toBe(true);
    art.dispose();
  });
  it('keeps the shop decorative and supplies a clear service sign and counter', () => {
    const art = createShopArt();
    expect(art.root.getObjectByName('service_counter')).toBeDefined();
    expect(art.root.getObjectByName('repair_sign')).toBeDefined();
    expect(art.root.userData.collisionRole).toBe('decorative-service');
    art.dispose();
  });
});
