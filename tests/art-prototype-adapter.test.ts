import { expect, it } from 'vitest';
import * as THREE from 'three';
import { createCar4Art } from '../src/art/car4';
import { createUtilityVehicleArt } from '../src/art/utility-vehicles';
import { attachArticulatedContainerArt, attachVehicleArtToPrototype } from '../src/art/prototype-adapter';

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

it('keeps the container tractor and trailer centered on their independent route poses', () => {
  const tractorFrame = new THREE.Group(), trailerFrame = new THREE.Group();
  const art = createUtilityVehicleArt('container', 'player');
  attachArticulatedContainerArt(tractorFrame, trailerFrame, art);
  tractorFrame.updateMatrixWorld(true);
  trailerFrame.updateMatrixWorld(true);
  expect(art.root.parent).toBe(tractorFrame);
  expect(art.trailer?.parent?.parent).toBe(trailerFrame);
  const centerZ = (part: THREE.Object3D) => {
    const bounds = new THREE.Box3().setFromObject(part);
    return (bounds.min.z + bounds.max.z) / 2;
  };
  expect(centerZ(art.tractor!)).toBeCloseTo(0, 1);
  expect(centerZ(art.trailer!)).toBeCloseTo(0, 1);
  tractorFrame.position.x = 3;
  trailerFrame.position.x = -2;
  tractorFrame.updateMatrixWorld(true);
  trailerFrame.updateMatrixWorld(true);
  expect(new THREE.Box3().setFromObject(art.tractor!).getCenter(new THREE.Vector3()).x).toBeCloseTo(3);
  expect(new THREE.Box3().setFromObject(art.trailer!).getCenter(new THREE.Vector3()).x).toBeCloseTo(-2);
  art.setCondition('damaged');
  expect(art.root.getObjectByName('damaged_panels')).toBeUndefined();
  expect(trailerFrame.getObjectByName('damaged_panels')?.visible).toBe(true);
  art.dispose();
  expect(trailerFrame.children).toHaveLength(0);
});
