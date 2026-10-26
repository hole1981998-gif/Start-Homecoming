import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { balance } from '../src/config';
import { createRidingBlenderDriver } from '../src/art/blender-driver';
import { roadsideArchetype, roadsidePose } from '../src/art/runtime-people';
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
    expect(torso(driver).quaternion.equals(original)).toBe(false);
    expect(torso(template).quaternion.equals(original)).toBe(true);
    expect(bounds.getSize(new THREE.Vector3()).y).toBeGreaterThan(1);
    expect(bounds.getSize(new THREE.Vector3()).y).toBeLessThan(2.5);
  });
});
