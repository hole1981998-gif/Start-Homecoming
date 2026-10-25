import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { movingBalance } from '../src/config';
import { createAmbulanceArt, createOfficerArt, createTrainArt, createVendorArt } from '../src/art/moving-events';

describe('moving event art uses prototype contracts', () => {
  it('keeps a finite crossing train within the existing world-space footprint in either direction', () => {
    for (const direction of [-1, 1] as const) {
      const asset = createTrainArt(direction);
      const size = new THREE.Box3().setFromObject(asset.root).getSize(new THREE.Vector3());
      expect(size.x).toBeLessThanOrEqual(movingBalance.trainWidth + .3);
      expect(size.x).toBeGreaterThan(movingBalance.trainWidth - .8);
      expect(size.z).toBeLessThanOrEqual(movingBalance.trainDepth + .06);
      expect(asset.root.userData.crossingSeconds).toBe(movingBalance.trainCrossSeconds);
      expect(asset.root.getObjectByName('locomotive')).toBeDefined();
      expect(asset.root.getObjectByName('carriage_2')).toBeDefined();
      expect(Math.sign(asset.sockets.front.getWorldPosition(new THREE.Vector3()).x)).toBe(direction);
      asset.dispose();
    }
  });
  it('reuses car7 geometry for ambulance without changing its gameplay footprint', () => {
    const asset = createAmbulanceArt();
    const size = new THREE.Box3().setFromObject(asset.root).getSize(new THREE.Vector3());
    expect(size.x).toBeLessThanOrEqual(2.14);
    expect(size.z).toBeLessThanOrEqual(4.9);
    expect(asset.root.getObjectByName('third_row_glass_-1')).toBeDefined();
    expect(asset.sockets.beacon).toBeDefined();
    asset.setState('damaged');
    expect(asset.root.getObjectByName('service_damage')?.visible).toBe(true);
    asset.dispose();
  });
  it('provides readable officer/vendor states without owning NPC motion time', () => {
    for (const kind of ['police', 'militia'] as const) {
      const asset = createOfficerArt(kind);
      expect(asset.root.getObjectByName(kind === 'police' ? 'police_cap' : 'militia_wide_hat')).toBeDefined();
      asset.setState('stunned');
      expect(asset.root.getObjectByName('stunned_mark')?.visible).toBe(true);
      expect(asset.root.userData.motionSource).toBe('crossMotion');
      asset.dispose();
    }
    const vendor = createVendorArt();
    const size = new THREE.Box3().setFromObject(vendor.root).getSize(new THREE.Vector3());
    expect(size.x).toBeLessThanOrEqual(movingBalance.vendorWidth + .05);
    expect(size.z).toBeLessThanOrEqual(movingBalance.vendorLength + .1);
    vendor.setState('damaged');
    expect(vendor.root.getObjectByName('vendor_damage')?.visible).toBe(true);
    vendor.dispose();
  });
  it('keeps the police shirt and full trousers in a bright warm uniform distinct from militia', () => {
    const police = createOfficerArt('police');
    const militia = createOfficerArt('militia');
    const colorOf = (art: typeof police, name: string) =>
      ((art.root.getObjectByName(name) as THREE.Mesh).material as THREE.MeshStandardMaterial).color;
    const shirt = colorOf(police, 'coat_torso');
    const trousers = colorOf(police, 'pants_pelvis');
    const thigh = colorOf(police, 'thigh_1');
    expect(shirt.r).toBeGreaterThan(shirt.b * 3);
    expect(trousers.r).toBeGreaterThan(trousers.b * 3);
    expect(thigh.equals(trousers)).toBe(true);
    expect(shirt.equals(colorOf(militia, 'coat_torso'))).toBe(false);
    expect(trousers.equals(colorOf(militia, 'pants_pelvis'))).toBe(false);
    police.dispose(); militia.dispose();
  });
});
