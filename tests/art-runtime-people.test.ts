import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { balance } from '../src/config';
import { createCrashBlenderDriver, createRidingBlenderDriver } from '../src/art/blender-driver';
import { roadsideArchetype, roadsidePose } from '../src/art/runtime-people';
import { driverCrashPose } from '../src/art/timing';
import { entity, passengerMotion } from '../src/world';

describe('runtime people visuals', () => {
  it('casts the same rider consistently without consuming gameplay RNG', () => {
    const ids = Array.from({ length: 60 }, (_, i) => `rider-${i}`);
    const first = ids.map(roadsideArchetype);
    expect(ids.map(roadsideArchetype)).toEqual(first);
    expect(new Set(first).size).toBe(6);
    expect(roadsideArchetype('rider-0')).toBe(first[0]);
  });

  it('freezes a waiting passenger pose when simulation time is paused', () => {
    const person = entity('passenger', 'waiting', 40, -5);
    person.passengerMotion = { ...passengerMotion(person, 10), idle: false };
    const moving = roadsidePose(person, 10.5);
    expect(moving.pose).toBe('walk');
    expect(roadsidePose(person, 10.5)).toEqual(moving);
    person.passengerMotion.idle = true;
    expect(roadsidePose(person, 30).pose).toBe('hail');
    expect(roadsidePose(person, 30)).toEqual(roadsidePose(person, 30));
    expect(roadsidePose(person, 30).phase).not.toBe(roadsidePose(person, 31).phase);
    person.pickupable = false;
    expect(roadsidePose(person, 30).pose).toBe('stand');
  });

  it('uses crash pose timing from simulation and returns to standing', () => {
    const person = entity('passenger', 'fallen', 40, -5);
    person.passengerMotion = { ...passengerMotion(person, 0),
      ejectedAt: 5, crashRecovery: true };
    expect(roadsidePose(person, 5.1).pose).toBe('ejected');
    expect(roadsidePose(person, 5 + balance.passengerKickSeconds + .01).pose).toBe('grounded');
    expect(roadsidePose(person, 5 + balance.passengerKickSeconds +
      balance.passengerDownSeconds + .01).pose).toBe('recover');
    expect(roadsidePose(person, 50).pose).toBe('stand');
  });

  it('mounts the delivered Blender driver on its authored pivots without changing the template', async () => {
    const bytes = readFileSync(new URL('../assets/art/driver-adjusted-delivery.glb', import.meta.url));
    const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
    const template = (await new GLTFLoader().parseAsync(buffer, '')).scene;
    const torso = (root: THREE.Object3D) => {
      let result: THREE.Object3D | undefined;
      root.traverse(node => { if (node.name.startsWith('torso_pivot')) result = node; });
      return result!;
    };
    const original = torso(template).quaternion.clone();
    const driver = createRidingBlenderDriver(template);
    const bounds = new THREE.Box3().setFromObject(driver);
    const seated = torso(driver).quaternion.clone();
    driver.setVisualTime(.625);
    expect(torso(driver).quaternion.equals(seated)).toBe(false);
    driver.setVisualTime(0);
    expect(torso(driver).quaternion.equals(seated)).toBe(true);
    expect(torso(driver).quaternion.equals(original)).toBe(false);
    expect(torso(template).quaternion.equals(original)).toBe(true);
    expect(bounds.getSize(new THREE.Vector3()).y).toBeGreaterThan(1);
    expect(bounds.getSize(new THREE.Vector3()).y).toBeLessThan(2.5);
  });

  it('keeps the edited driver mesh through ejection, ground hold and recovery', async () => {
    const bytes = readFileSync(new URL('../assets/art/driver-adjusted-delivery.glb', import.meta.url));
    const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
    const template = (await new GLTFLoader().parseAsync(buffer, '')).scene;
    const driver = createCrashBlenderDriver(template);
    const hip = (root: THREE.Object3D) => {
      let result: THREE.Object3D | undefined;
      root.traverse(node => { if (node.name.startsWith('hip_pivot')) result = node; });
      return result!;
    };
    const originalY = hip(template).position.y;
    const sample = (elapsed: number) => {
      driver.setTimedPose(driverCrashPose(elapsed));
      let torso: THREE.Object3D | undefined;
      driver.traverse(node => { if (node.name.startsWith('torso_pivot')) torso = node; });
      return { y: hip(driver).position.y,
        torso: torso!.quaternion.clone() };
    };
    const airborne = sample(.2);
    const grounded = sample(balance.driverFallSeconds + .1);
    const recovering = sample(balance.driverFallSeconds + balance.driverPauseSeconds +
      balance.driverReturnSeconds * .5);
    expect(airborne.y).toBeCloseTo(originalY);
    expect(grounded.y).toBeLessThan(originalY - .3);
    expect(recovering.y).toBeGreaterThan(grounded.y);
    expect(recovering.y).toBeLessThan(originalY);
    expect(recovering.torso.equals(grounded.torso)).toBe(false);
    expect(sample(.2).torso.equals(airborne.torso)).toBe(true);
    expect(hip(template).position.y).toBe(originalY);
  });
});
