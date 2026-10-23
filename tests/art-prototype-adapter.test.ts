import { expect, it } from 'vitest';
import * as THREE from 'three';
import { createCar4Art } from '../src/art/car4';
import { attachVehicleArtToPrototype } from '../src/art/prototype-adapter';

it('turns +Z authored cars toward the prototype -Z route without moving the logic parent', () => {
  const parent = new THREE.Group(); parent.position.set(2, 0, -10);
  const art = createCar4Art();
  attachVehicleArtToPrototype(parent, art);
  expect(art.root.parent).toBe(parent);
  expect(parent.position.toArray()).toEqual([2, 0, -10]);
  expect(art.root.rotation.y).toBe(Math.PI);
  const front = art.sockets.headlamp_left.getWorldPosition(new THREE.Vector3());
  const rear = art.sockets.tail_left.getWorldPosition(new THREE.Vector3());
  expect(front.z).toBeLessThan(rear.z);
  art.dispose();
});
