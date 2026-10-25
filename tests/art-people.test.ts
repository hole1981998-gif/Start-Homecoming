import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { createPersonArt, mountPersonOnSeat, passengerArchetypes } from '../src/art/people';
import { createTwoWheelerArt } from '../src/art/two-wheelers';
import { createCar4Art } from '../src/art/car4';

const cast = ['driver', ...passengerArchetypes] as const;

describe('essential people art', () => {
  it('provides ground roots, distinct named silhouettes and attachment sockets', () => {
    expect(new Set(passengerArchetypes).size).toBe(12);
    for (const archetype of cast) {
      const person = createPersonArt(archetype);
      const bounds = new THREE.Box3().setFromObject(person.root);
      expect(person.root.name).toBe(`chr_${archetype}_root`);
      expect(person.sockets.hip.parent?.name).toBe('hip_pivot');
      expect(person.sockets.ground_contact.getWorldPosition(new THREE.Vector3()).y).toBe(0);
      expect(bounds.min.y).toBeGreaterThan(-.06);
      expect(bounds.max.y).toBeGreaterThan(.9);
      person.dispose();
    }
  });

  it('switches core poses without cumulative drift', () => {
    const person = createPersonArt('worker');
    const hip = person.sockets.hip;
    const standY = hip.getWorldPosition(new THREE.Vector3()).y;
    person.setPose('grounded');
    expect(hip.getWorldPosition(new THREE.Vector3()).y).toBeLessThan(standY);
    person.setPose('hail', .25);
    expect(hip.getWorldPosition(new THREE.Vector3()).y).toBe(standY);
    expect(person.root.getObjectByName('shoulder_1')?.rotation.z).toBeGreaterThan(2);
    person.setPose('refuse');
    person.setPose('ejected', .2);
    const startTilt = person.root.getObjectByName('torso_pivot')!.rotation.x;
    person.setPose('ejected', .8);
    expect(person.root.getObjectByName('torso_pivot')!.rotation.x).toBeLessThan(startTilt);
    person.setPose('recover', .5);
    expect(hip.getWorldPosition(new THREE.Vector3()).y).toBeGreaterThan(.33);
    person.setPose('stand');
    expect(person.root.getObjectByName('shoulder_1')?.rotation.z).toBeCloseTo(.28);
    expect(hip.getWorldPosition(new THREE.Vector3()).y).toBe(standY);
    person.dispose();
  });

  it('cycles a walk pose in place so movement remains owned by gameplay', () => {
    const person = createPersonArt('commuter');
    person.setPose('walk', .25);
    const left = person.root.getObjectByName('hip_leg_-1')!;
    const right = person.root.getObjectByName('hip_leg_1')!;
    expect(left.rotation.x).toBeGreaterThan(.4);
    expect(right.rotation.x).toBeLessThan(-.4);
    expect(person.root.position.toArray()).toEqual([0, 0, 0]);
    person.setPose('walk', .75);
    expect(left.rotation.x).toBeLessThan(-.4);
    expect(right.rotation.x).toBeGreaterThan(.4);
    person.setPose('stand');
    expect(person.root.position.toArray()).toEqual([0, 0, 0]);
    person.dispose();
  });

  it('mounts a rider at the vehicle hip socket while preserving the vehicle root', () => {
    const bike = createTwoWheelerArt('motorcycle');
    const rider = createPersonArt('driver');
    mountPersonOnSeat(rider, bike.seats.driver, 'riding');
    expect(rider.root.parent).toBe(bike.seats.driver);
    expect(rider.sockets.hip.getWorldPosition(new THREE.Vector3()).distanceTo(
      bike.seats.driver.getWorldPosition(new THREE.Vector3()))).toBeLessThan(1e-6);
    expect(bike.root.position.toArray()).toEqual([0, 0, 0]);
    rider.dispose(); bike.dispose();
  });
  it('keeps the adjusted driver head compact without shrinking the actor or its seat mount', () => {
    const driver = createPersonArt('driver');
    const head = new THREE.Box3().setFromObject(driver.root.getObjectByName('head')!);
    const body = new THREE.Box3().setFromObject(driver.root);
    expect(head.getSize(new THREE.Vector3()).x).toBeLessThan(.50);
    expect(body.getSize(new THREE.Vector3()).y).toBeGreaterThan(1.8);
    expect(driver.sockets.hip.getWorldPosition(new THREE.Vector3()).y).toBeCloseTo(.85);
    const shoulder = driver.root.getObjectByName('shoulder_1')!
      .getWorldPosition(new THREE.Vector3());
    const pelvis = new THREE.Box3().setFromObject(driver.root.getObjectByName('pants_pelvis')!);
    expect(shoulder.x).toBeLessThan(.19);
    expect(shoulder.y).toBeLessThan(1.35);
    expect(pelvis.getSize(new THREE.Vector3()).x).toBeGreaterThan(shoulder.x * 2);
    driver.dispose();
  });
  it('seats the senior hat on the head rather than leaving a visible air gap', () => {
    const person = createPersonArt('senior');
    const head = person.root.getObjectByName('head')!;
    const brim = person.root.getObjectByName('soft_hat_brim')!;
    const headBounds = new THREE.Box3().setFromObject(head);
    const brimBounds = new THREE.Box3().setFromObject(brim);
    expect(brimBounds.min.y).toBeLessThan(headBounds.max.y - .03);
    expect(brimBounds.max.y).toBeGreaterThan(headBounds.max.y - .1);
    person.dispose();
  });
  it('keeps the child cap attached with a visible forward visor', () => {
    const person = createPersonArt('child');
    const head = new THREE.Box3().setFromObject(person.root.getObjectByName('head')!);
    const crown = new THREE.Box3().setFromObject(person.root.getObjectByName('soft_cap_crown')!);
    const visor = new THREE.Box3().setFromObject(person.root.getObjectByName('soft_cap_visor')!);
    expect(crown.min.y).toBeLessThan(head.max.y - .03);
    expect(visor.max.z).toBeGreaterThan(head.max.z + .06);
    person.dispose();
  });
  it('keeps a seated driver under the car4 roof without scaling the whole person', () => {
    const car = createCar4Art();
    const driver = createPersonArt('driver');
    mountPersonOnSeat(driver, car.seats.driver);
    const bounds = new THREE.Box3().setFromObject(driver.root);
    expect(bounds.max.y).toBeLessThan(1.59);
    expect(driver.root.scale.toArray()).toEqual([1, 1, 1]);
    driver.dispose(); car.dispose();
  });
});
