import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { movingBalance } from '../src/config';
import { createAmbulanceArt, createOfficerArt, createTrainArt, createVendorArt,
  crossingVisualYaw } from '../src/art/moving-events';
import { attachAmbulanceService } from '../src/art/ambulance-service';
import { createVehicleArt } from '../src/art/vehicle-catalog';

describe('moving event art uses prototype contracts', () => {
  it('keeps a finite crossing train within the existing world-space footprint in either direction', () => {
    for (const lod of ['near', 'far'] as const) for (const direction of [-1, 1] as const) {
      const asset = createTrainArt(direction, lod);
      const size = new THREE.Box3().setFromObject(asset.root).getSize(new THREE.Vector3());
      expect(size.x).toBeLessThanOrEqual(movingBalance.trainWidth + .3);
      expect(size.x).toBeGreaterThan(movingBalance.trainWidth - .8);
      expect(size.z).toBeLessThanOrEqual(movingBalance.trainDepth + .06);
      expect(asset.root.userData.crossingSeconds).toBe(movingBalance.trainCrossSeconds);
      expect(asset.root.getObjectByName('locomotive')).toBeDefined();
      expect(asset.root.getObjectByName('carriage_2')).toBeDefined();
      expect(Math.sign(asset.sockets.front.getWorldPosition(new THREE.Vector3()).x)).toBe(direction);
      const wheel = asset.root.getObjectByName('wheel_0_-1_-1')!;
      asset.setVisualTime?.(1, true);
      const rolling = wheel.rotation.y;
      asset.setVisualTime?.(1, true);
      expect(wheel.rotation.y).toBe(rolling);
      asset.setVisualTime?.(2, true);
      expect(wheel.rotation.y).not.toBe(rolling);
      asset.setVisualTime?.(2, false);
      expect(wheel.rotation.y).toBe(0);
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
  it('alternates the bright roof beacon from simulation time on the real traffic car7', () => {
    const traffic = createVehicleArt('car7', 'traffic', 'far');
    const service = attachAmbulanceService(traffic.body);
    const red = service.root.getObjectByName('beacon_red') as THREE.Mesh;
    const blue = service.root.getObjectByName('beacon_blue') as THREE.Mesh;
    const redMaterial = red.material as THREE.MeshStandardMaterial;
    const blueMaterial = blue.material as THREE.MeshStandardMaterial;
    const wash = service.root.getObjectByName('ambulance_beacon_wash') as THREE.PointLight;
    expect(new THREE.Box3().setFromObject(red).min.y).toBeGreaterThan(1.9);
    service.setVisualTime(.05);
    expect(redMaterial.emissiveIntensity).toBeGreaterThan(blueMaterial.emissiveIntensity);
    expect(wash.position.x).toBeLessThan(0);
    service.setVisualTime(.25);
    expect(blueMaterial.emissiveIntensity).toBeGreaterThan(redMaterial.emissiveIntensity);
    expect(wash.position.x).toBeGreaterThan(0);
    const flash = blueMaterial.emissiveIntensity;
    service.setVisualTime(.25);
    expect(blueMaterial.emissiveIntensity).toBe(flash);
    traffic.dispose();
  });
  it('puts distinct, raised hats above both officers instead of flat head plates', () => {
    for (const kind of ['police', 'militia'] as const) {
      const asset = createOfficerArt(kind, 'far');
      const head = asset.root.getObjectByName('head')!;
      const hat = asset.root.getObjectByName(kind === 'police' ? 'police_cap' : 'militia_wide_hat')!;
      asset.root.updateMatrixWorld(true);
      const headTop = new THREE.Box3().setFromObject(head).max.y;
      const hatTop = new THREE.Box3().setFromObject(hat).max.y;
      expect(hatTop).toBeGreaterThan(headTop);
      expect(asset.root.getObjectByName(kind === 'police' ? 'police_cap_visor' : 'militia_hat_crown')).toBeDefined();
      asset.dispose();
    }
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
  it('cycles officer and vendor steps only from the supplied simulation time', () => {
    for (const [asset, firstTime, secondTime] of [
      [createOfficerArt('police'), .25 / 1.55, .75 / 1.55],
      [createVendorArt(), .3125, .9375],
    ] as const) {
      const leg = asset.root.getObjectByName('hip_leg_-1')!;
      asset.setVisualTime!(firstTime, true);
      const moving = leg.rotation.x;
      asset.setVisualTime!(firstTime, true);
      expect(leg.rotation.x).toBe(moving);
      asset.setVisualTime!(secondTime, true);
      expect(leg.rotation.x).toBeLessThan(moving);
      asset.setVisualTime!(firstTime, false);
      expect(Math.abs(leg.rotation.x)).toBeLessThan(Math.abs(moving));
      asset.dispose();
    }
  });
  it('faces crossers along their travel, including patrol reversal, with the seller behind the cart', () => {
    const patrol = { type: 'pingpong' as const, origin: -2, velocity: 2, startedAt: 0, min: -2, max: 2 };
    expect(crossingVisualYaw(patrol, 1)).toBeCloseTo(Math.PI / 2);
    expect(crossingVisualYaw(patrol, 3)).toBeCloseTo(-Math.PI / 2);
    const vendor = createVendorArt();
    const tray = vendor.root.getObjectByName('cart_tray')!;
    const seller = vendor.root.getObjectByName('vendor_person')!;
    for (const direction of [-1, 1]) {
      vendor.root.rotation.y = direction * Math.PI / 2;
      vendor.root.updateMatrixWorld(true);
      const travel = tray.getWorldPosition(new THREE.Vector3()).x -
        seller.getWorldPosition(new THREE.Vector3()).x;
      expect(Math.sign(travel)).toBe(direction);
    }
    vendor.dispose();
  });
  it('gives police and militia distinct repeatable signals without moving their collision roots', () => {
    const police = createOfficerArt('police');
    const militia = createOfficerArt('militia');
    const policeArm = police.root.getObjectByName('shoulder_1')!;
    const militiaArm = militia.root.getObjectByName('shoulder_1')!;
    for (const asset of [police, militia]) {
      asset.setVisualTime!(1.2, true);
      const arm = asset.root.getObjectByName('shoulder_1')!;
      const first = arm.rotation.clone();
      asset.setVisualTime!(2.4, true);
      expect(arm.rotation.equals(first)).toBe(false);
      asset.setVisualTime!(1.2, true);
      expect(arm.rotation.equals(first)).toBe(true);
      expect(asset.root.position.length()).toBe(0);
      asset.setState('stunned');
      asset.setVisualTime!(1.2, false);
      expect(asset.root.getObjectByName('stunned_mark')?.visible).toBe(true);
    }
    police.setState('normal'); militia.setState('normal');
    police.setVisualTime!(1.2, false); militia.setVisualTime!(1.2, false);
    expect(policeArm.rotation.x).toBeLessThan(-.8);
    expect(militiaArm.rotation.z).toBeGreaterThan(1);
    police.dispose(); militia.dispose();
  });
  it('rolls the vendor wheels and braces both hands only while pushing', () => {
    const vendor = createVendorArt();
    const wheel = vendor.root.getObjectByName('cart_wheel_1')!;
    const arm = vendor.root.getObjectByName('shoulder_1')!;
    vendor.setVisualTime!(1, true);
    expect(Math.abs(wheel.rotation.y)).toBeGreaterThan(3);
    expect(arm.rotation.x).toBeLessThan(-.6);
    const axle = () => new THREE.Vector3(0, 1, 0).applyQuaternion(wheel.getWorldQuaternion(new THREE.Quaternion()));
    expect(Math.abs(axle().x)).toBeCloseTo(1);
    expect(Math.abs(axle().y)).toBeLessThan(.00001);
    expect(Math.abs(axle().z)).toBeLessThan(.00001);
    const angle = wheel.rotation.y;
    vendor.setVisualTime!(1, true);
    expect(wheel.rotation.y).toBe(angle);
    vendor.setVisualTime!(2, true);
    expect(Math.abs(axle().x)).toBeCloseTo(1);
    expect(Math.abs(axle().z)).toBeLessThan(.00001);
    vendor.setVisualTime!(1, false);
    expect(wheel.rotation.y).toBe(0);
    vendor.setState('stunned');
    vendor.setVisualTime!(1, true);
    expect(wheel.rotation.y).toBe(0);
    expect(vendor.root.position.length()).toBe(0);
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
