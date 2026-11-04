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
    const counter = art.root.getObjectByName('service_counter');
    const sign = art.root.getObjectByName('repair_sign') as THREE.Mesh;
    expect(counter).toBeDefined();
    expect(sign).toBeDefined();
    for (const side of [-1, 1]) {
      expect(art.root.getObjectByName(`side_service_window_${side}`)).toBeDefined();
      expect(art.root.getObjectByName(`side_service_sign_${side}`)).toBeDefined();
    }
    const bounds = new THREE.Box3().setFromObject(art.root).getSize(new THREE.Vector3());
    expect(bounds.x).toBeLessThan(3.5);
    expect(bounds.z).toBeLessThan(4.1);
    const signMaterial = sign.material as THREE.MeshStandardMaterial;
    const wallMaterial = (art.root.getObjectByName('shop_plaster') as THREE.Mesh)
      .material as THREE.MeshStandardMaterial;
    expect(signMaterial.emissiveIntensity).toBeGreaterThan(0);
    expect(signMaterial.color.getHSL({ h: 0, s: 0, l: 0 }).l)
      .toBeGreaterThan(wallMaterial.color.getHSL({ h: 0, s: 0, l: 0 }).l);
    expect(art.root.userData.collisionRole).toBe('decorative-service');
    art.dispose();
  });
});
