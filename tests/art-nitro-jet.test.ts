import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { createNitroJet } from '../src/art/nitro-jet';

describe('continuous nitro exhaust', () => {
  it('follows the actual rotated exhaust, holds during pause and disappears on expiry', () => {
    const car = new THREE.Group(), socket = new THREE.Object3D();
    car.rotation.y = Math.PI; car.position.set(3, 0, 8); socket.position.set(-.5, .3, -2);
    car.add(socket); const jet = createNitroJet(); jet.update(socket, true, 1, false);
    expect(jet.root.visible).toBe(true);
    expect(jet.root.position.x).toBeCloseTo(3.5); expect(jet.root.position.z).toBeCloseTo(10);
    const rear = new THREE.Vector3(0, 0, -1).applyQuaternion(jet.root.quaternion);
    expect(rear.z).toBeCloseTo(1);
    const flame = jet.root.children[0]; const scale = flame.scale.clone();
    jet.update(socket, true, 1, false); expect(flame.scale.equals(scale)).toBe(true);
    car.position.z = 5; jet.update(socket, true, 2, true); expect(jet.root.position.z).toBeCloseTo(7);
    jet.update(socket, false, 3, false); expect(jet.root.visible).toBe(false); jet.dispose();
  });
});
